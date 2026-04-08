<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let container: HTMLElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let width = 0;
	let height = 0;
	
	interface Particle {
		x: number;
		y: number;
		targetX: number;
		targetY: number;
		size: number;
		finalW: number;
		finalH: number;
		baseColor: string;
		speed: number;
		opacity: number;
	}

	let particles: Particle[] = [];
	let animationId: number;
	
	let scrollY = 0;
	let lastScrollY = 0;
	let scrollVelocity = 0;
	let progress = 0; // 0 to 1 based on scrolled area

	const markers = [
		{ id: "M1", label: "2023-01", threshold: 0.05 },
		{ id: "M2", label: "2023-04", threshold: 0.15 },
		{ id: "M3", label: "2023-07", threshold: 0.25 },
		{ id: "M4", label: "2023-10", threshold: 0.35 },
		{ id: "M5", label: "2024-01", threshold: 0.45 },
		{ id: "M6", label: "2024-11", threshold: 0.55 },
		{ id: "M7", label: "2025-01", threshold: 0.65 },
	];

	// Intense vibrant blues for the "X"
	const COLORS = ['#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'];

	// Generate target points to draw a massive "X"
	function getTextPixels(w: number, h: number) {
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const octx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!octx) return [];
        
		// Calculate a gigantic font size so the "X" occupies the screen background beautifully
        let fontSize = Math.min(w * 0.9, h * 0.9);
        octx.font = `800 ${fontSize}px Montserrat, sans-serif`;
        octx.textBaseline = "middle";
		octx.textAlign = "center";
		
		// Optional: slightly adjust vertical positioning of X to feel optically centered behind HTML block
		octx.fillStyle = "blue";
		octx.fillText("X", w / 2, h / 2 + (fontSize * 0.05));
        
        const imageData = octx.getImageData(0, 0, w, h).data;
        const points = [];
        
        // Sampling gap depends on screen size so we don't over-burden the engine
        const gap = Math.max(2, Math.floor(w / 600));
        
        for (let y = 0; y < h; y += gap) {
            for (let x = 0; x < w; x += gap) {
				const idx = (y * w + x) * 4;
                const a = imageData[idx+3];

                if (a > 128) {
                    points.push({ 
						// Random offset creates organic looking debris (fragmented blocks)
                         x: x + (Math.random() - 0.5) * 6, 
                         y: y + (Math.random() - 0.5) * 6
                    });
                }
            }
        }
        
        return points;
    }

	function initParticles() {
		particles = [];
		const textPoints = getTextPixels(width, height);
		// Massive particle count for the large logo limits aliasing gaps
		const count = Math.min(textPoints.length, width > 700 ? 12000 : 6000);
		
		const shuffledPoints = [...textPoints].sort(() => Math.random() - 0.5);

		for (let i = 0; i < count; i++) {
			const pt = shuffledPoints[i % shuffledPoints.length];
			
			// The logo is only blue shades
			const colorOpts = COLORS;
			
			particles.push({
				x: Math.random() * width,
				y: (Math.random() * height * 1.5) - height, 
				targetX: pt.x,
				targetY: pt.y,
				size: Math.random() * 1.5 + 1.2, // Keep falling bits small
				finalW: Math.random() * 2.5 + 1.5, // Fragment width when snapped into X
				finalH: Math.random() * 3.5 + 2, // Fragment height when snapped into X
				baseColor: colorOpts[Math.floor(Math.random() * colorOpts.length)],
				speed: Math.random() * 1.5 + 0.5,
				opacity: Math.random() * 0.5 + 0.3
			});
		}
	}

	function resize() {
		if (!canvas) return;
		width = document.documentElement.clientWidth; 
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		initParticles();
	}

	function handleScroll() {
		if (typeof window === 'undefined') return;
		scrollY = window.scrollY;
		
		if (container) {
			const rect = container.getBoundingClientRect();
			const start = rect.top + scrollY;
			const totalScrollableDistance = rect.height - window.innerHeight;
			
			if (scrollY >= start && scrollY <= start + totalScrollableDistance) {
				progress = (scrollY - start) / totalScrollableDistance;
			} else if (scrollY < start) {
				progress = 0;
			} else {
				progress = 1;
			}
		}
	}

	function animate() {
		if (!ctx) return;
		
		scrollVelocity = scrollY - lastScrollY;
		lastScrollY = scrollY;
		
		const speedBoost = Math.min(20, Math.max(0, scrollVelocity * 0.5)); 
		
		ctx.fillStyle = 'rgba(3, 5, 12, 0.4)'; 
		ctx.fillRect(0, 0, width, height);
		
		// The Logo collapse happens aggressively towards the end of the scroll (75% onwards)
		let collapsePhase = 0;
		if (progress > 0.75) {
			collapsePhase = Math.min(1, (progress - 0.75) / 0.25);
		}
		
		const ease = collapsePhase < 0.5 ? 2 * collapsePhase * collapsePhase : -1 + (4 - 2 * collapsePhase) * collapsePhase;

		for (let p of particles) {
			ctx.fillStyle = p.baseColor;
			// At full ease, push the X logo to full brightness 
			ctx.globalAlpha = Math.min(1, p.opacity + (1 - p.opacity) * ease * 1.5);
			
			p.y += p.speed + (speedBoost * (1 - collapsePhase)); 
			
			if (p.y > height + 50 && collapsePhase === 0) {
				p.y = -50;
				p.x = Math.random() * width;
			}
			
			let drawX = p.x;
			let drawY = p.y;
			
			if (collapsePhase > 0) {
				drawX = drawX + (p.targetX - drawX) * ease;
				drawY = drawY + (p.targetY - drawY) * ease;
			}
			
			ctx.beginPath();
			
			const dropWidth = p.size * 1.5;
			const dropHeight = p.size * 5;
			
			const currentWidth = dropWidth + (p.finalW - dropWidth) * ease;
			const currentHeight = dropHeight + (p.finalH - dropHeight) * ease;
			
			ctx.rect(drawX, drawY, currentWidth, currentHeight);
			ctx.fill();
		}
		
		ctx.globalAlpha = 1;
		animationId = requestAnimationFrame(animate);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			scrollY = window.scrollY;
			lastScrollY = window.scrollY;
		}
		ctx = canvas.getContext('2d');
		
		if (document.fonts) {
			document.fonts.ready.then(() => {
				resize();
			});
		} else {
			resize();
		}

		window.addEventListener('resize', resize);
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		animate();
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', resize);
			window.removeEventListener('scroll', handleScroll);
		}
		if (animationId) cancelAnimationFrame(animationId);
	});
</script>

<div bind:this={container} class="timeline-container">
	<div class="timeline-sticky">
		<!-- Particles draw the massive X below the text -->
		<canvas bind:this={canvas} class="waterfall-canvas"></canvas>
		
		<!-- Extra radial darkness to ensure white text remains readable above the blue logo -->
		<div class="overlay-gradient"></div>

		<!-- Static HTML Title that sits beautifully layered OVER the particles -->
		<div class="title-container flex-center">
			<h1 class="main-title text-center text-white px-4">
				Who’s Driving Chinese-Language <br/>
				<span style="color: #38bdf8;">Misinformation</span> Trends on X?
			</h1>
			
			<!-- Signature that fades in perfectly at the end -->
			<p class="author fw-bold" style="opacity: {progress > 0.9 ? (progress - 0.9) * 10 : 0};">
				By Ava Hu
			</p>
		</div>

		<!-- Time markers disappear when the Logo fully settles -->
		<div class="markers-container flex-col-center" style="opacity: {progress > 0.85 ? 0 : 1};">
			{#each markers as marker, i (marker.id)}
				<div 
					class="time-marker"
					class:active={progress >= marker.threshold && progress < (markers[i+1] ? markers[i+1].threshold : 0.85)}
					class:past={progress > marker.threshold && !(progress >= marker.threshold && progress < (markers[i+1] ? markers[i+1].threshold : 0.85))}
				>
					{marker.label}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.timeline-container {
		height: 450vh;
		position: relative;
		background-color: #03050c; 
	}

	.timeline-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	.waterfall-canvas {
		display: block;
		width: 100%;
		height: 100%;
		background-color: transparent;
	}
	
	.overlay-gradient {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(3, 5, 12, 0.4) 0%, rgba(3, 5, 12, 0.9) 100%);
		pointer-events: none; /* Crucial so we can click on things if we add them */
	}

	.flex-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.flex-col-center {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.title-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.main-title {
		font-family: 'Montserrat', sans-serif;
		font-size: clamp(2rem, 5vw, 4rem);
		font-weight: 800;
		max-width: 900px;
		/* Intense shadow ensures the text pops even when the shiny blue 'X' forms behind it */
		text-shadow: 0 4px 30px rgba(0,0,0,1), 0 2px 10px rgba(0,0,0,0.8);
		line-height: 1.25;
		color: #ffffff; 
		z-index: 10;
	}

	.author {
		position: absolute;
		bottom: 12%;
		font-family: 'Montserrat', sans-serif;
		font-size: clamp(1rem, 2vw, 1.3rem);
		letter-spacing: 0.2rem;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.8);
		transition: opacity 0.1s linear;
	}

	.markers-container {
		position: absolute;
		top: 0;
		right: 5%;
		height: 100%;
		z-index: 20;
		pointer-events: none;
		align-items: flex-end;
		gap: 2rem;
		transition: opacity 0.3s;
	}

	.time-marker {
		color: rgba(255, 255, 255, 0.15);
		font-size: 1.2rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-weight: bold;
		transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateX(40px); 
		opacity: 0;
	}
	
	.time-marker.past {
		color: rgba(255, 255, 255, 0.3);
		transform: translateX(0px);
		opacity: 1;
		font-size: 1.2rem;
	}

	.time-marker.active {
		color: #ffffff;
		transform: translateX(-15px) scale(1.3);
		opacity: 1;
		text-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
	}
</style>

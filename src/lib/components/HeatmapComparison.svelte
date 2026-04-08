<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import heatmapData from '../data/heatmapData.json';

	const { months, globalMax, accounts } = heatmapData;
	const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	let container: HTMLElement;
	let scrollY = 0;
	let progress = 0;

	function handleScroll() {
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const windowH = window.innerHeight;
		const start = rect.top;
		const totalScrollable = rect.height - windowH;
		
		if (start <= 0 && totalScrollable > 0) {
			progress = Math.min(1, Math.max(0, -start / totalScrollable));
		} else if (start > 0) {
			progress = 0;
		} else {
			progress = 1;
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', handleScroll, { passive: true });
			handleScroll();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', handleScroll);
		}
	});

	// Heatmap mapping: White for 0, deep dark blue for max
	function getColor(val: number) {
		if (!val || val === 0) return '#ffffff'; // White for empty
		
		const ratio = val / globalMax; // 0 to 1
		// Deep blue mapping: lightness goes from 90% (light blue) down to 25% (deep dark navy)
		const lightness = 90 - (ratio * 65); 
		return `hsl(215, 90%, ${lightness}%)`;
	}
	
	function getTextColor(val: number) {
		const ratio = val / globalMax;
		// White text on dark deep blue cells, dark grey text on bright cells
		return ratio > 0.45 ? '#ffffff' : '#334155'; 
	}

	// Calculate absolute horizontal positioning indices for annotations
	const col202501 = months.indexOf("2025-01");
	const col202506 = months.indexOf("2025-06");
</script>

<div class="scrolly-container" bind:this={container}>
	<!-- Fixed Flex Layout to prevent clipping on small screens -->
	<div class="heatmap-sticky">
		
		<div class="title-wrap">
			<h2 class="section-title">Temporal Posting Patterns</h2>
			<p class="subtitle">Comparing frequency of posts across users (Scale max: {globalMax})</p>
		</div>
		
		<div class="heatmap-stack">
			{#each accounts as acct, accountIndex}
				<div class="heatmap-wrapper">
					<div class="heatmap-header">
						<h3 class="account-title">@{acct.account}</h3>
					</div>
					<div class="grid-container" style="--total-cols: {months.length};">
						<!-- Top left empty cell -->
						<div class="corner"></div>
						
						<!-- Month headers -->
						{#each months as month}
							<div class="month-header">
								<span class="rotate-text">{month}</span>
							</div>
						{/each}

						<!-- Rows for each day -->
						{#each daysOrder as day}
							<div class="day-label">{day}</div>
							{#each months as month, mIndex}
								{@const val = acct.days[day] ? (acct.days[day][mIndex] || 0) : 0}
								<div 
									class="heatmap-cell" 
									style="background-color: {getColor(val)}; color: {getTextColor(val)};"
									title={`@${acct.account} - ${month} ${day}: ${val} posts`}
								>
									{#if val > 0}
										{val}
									{/if}
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/each}

			<!-- Scroll Annotations Overlay relative to heatmap-stack -->
			<div class="annotations-layer">
				
				<!-- Annotation A: 2025.01 Spike -->
				<div class="annotation-box" 
					 style="
						left: calc(35px + {col202501 + 0.5} * ((100% - 35px) / {months.length}));
						top: 50%;
						opacity: {progress > 0.15 && progress < 0.5 ? 1 : 0}; 
						transform: translate(-50%, {progress > 0.15 && progress < 0.5 ? 0 : 20}px);
					 "
				>
					<h4>2025.01</h4>
					<p>Significant jump in posting frequency concurrent with the Trump inauguration.</p>
					<div class="arrow down-arrow"></div>
				</div>

				<!-- Annotation B: 2025.06 Drop -->
				<div class="annotation-box" 
					 style="
						left: calc(35px + {col202506 + 0.5} * ((100% - 35px) / {months.length}));
						top: 65%;
						opacity: {progress > 0.55 && progress < 0.9 ? 1 : 0}; 
						transform: translate(-50%, {progress > 0.55 && progress < 0.9 ? 0 : 20}px);
					 "
				>
					<h4>2025.06</h4>
					<p>Noticeable drop-off in activity during the summer months.</p>
					<div class="arrow down-arrow"></div>
				</div>

			</div>
		</div>
	</div>
</div>

<style>
	.scrolly-container {
		position: relative;
		height: 350vh; 
		background-color: #03050c; 
	}

	.heatmap-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start; /* Prevent vertical clipping */
		padding: 2vh 2vw;
		box-sizing: border-box;
		overflow: hidden;
	}

	.title-wrap {
		text-align: center;
		margin-bottom: 2vh;
		flex-shrink: 0; /* Protect title from squishing */
	}

	.section-title {
		font-family: 'Montserrat', sans-serif;
		font-size: clamp(1.2rem, 3vh, 2rem);
		font-weight: 800;
		color: #ffffff;
		margin: 0;
	}

	.subtitle {
		font-size: clamp(0.7rem, 1.5vh, 1rem);
		color: rgba(255, 255, 255, 0.6);
		margin-top: 0.5vh;
		margin-bottom: 0;
	}

	.heatmap-stack {
		position: relative; /* Anchor for absolute annotations */
		display: flex;
		flex-direction: column;
		gap: 1.5vh; 
		width: 100%;
		max-width: 1400px;
		flex: 1; /* Stretch to fill remaining viewport exactly */
		min-height: 0; /* Prevents overflow push */
	}

	.heatmap-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5vh;
		flex: 1; /* Three boxes split exactly 33% vertical height */
		min-height: 0; 
	}

	.heatmap-header {
		flex-shrink: 0;
	}

	.account-title {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: clamp(0.8rem, 2vh, 1.1rem);
		color: #38bdf8;
		margin: 0 0 0 35px; /* Align to grid offset */
		font-weight: 600;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 35px repeat(var(--total-cols), minmax(0, 1fr));
		grid-template-rows: 25px repeat(7, minmax(0, 1fr)); /* 8 rows mapped strictly into container */
		gap: 2px;
		width: 100%;
		flex: 1; /* Grid assumes all remaining flex height! */
		min-height: 0;
	}

	.corner {
		/* Fills the 1x1 top-left implicit slot safely */
	}

	.month-header {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		overflow: visible; /* Allows rotated text to push upward */
	}

	.rotate-text {
		transform: rotate(-45deg);
		transform-origin: left bottom;
		font-size: clamp(0.5rem, 1.2vh, 0.75rem);
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
		display: inline-block;
		margin-left: 5px;
	}

	.day-label {
		font-size: clamp(0.5rem, 1.2vh, 0.75rem);
		color: rgba(255, 255, 255, 0.5);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 5px;
	}

	.heatmap-cell {
		/* Using pure grid layout so it stretches nicely as rectangles if needed */
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(0.45rem, 0.8vw, 0.75rem);
		border-radius: 2px;
		transition: transform 0.1s, box-shadow 0.1s;
		cursor: crosshair;
		overflow: hidden; /* Prevent text spillage if box is too small */
	}

	.heatmap-cell:hover {
		transform: scale(1.4);
		z-index: 10;
		box-shadow: 0 0 8px rgba(0,0,0,0.9);
		border: 1px solid white;
		border-radius: 4px;
	}

	/* Annotations Overlay Layer */
	.annotations-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 50;
	}

	.annotation-box {
		position: absolute;
		background: rgba(3, 5, 12, 0.85);
		border: 1px solid #38bdf8;
		padding: 1rem;
		border-radius: 8px;
		width: 250px;
		backdrop-filter: blur(4px);
		box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(56, 189, 248, 0.3);
		transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
		/* Slight negative Z translation keeps text sharp while performing transforms */
		will-change: transform, opacity;
	}

	.annotation-box h4 {
		margin: 0 0 0.5rem 0;
		font-family: 'Montserrat', sans-serif;
		color: #ffffff;
		font-size: 1rem;
	}

	.annotation-box p {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.4;
	}

	.arrow.down-arrow {
		width: 0; 
		height: 0; 
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 15px solid #38bdf8; 
		position: absolute;
		bottom: -15px; 
		left: 50%;
		transform: translateX(-50%);
	}
</style>

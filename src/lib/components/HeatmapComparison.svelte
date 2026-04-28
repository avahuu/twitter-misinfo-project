<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import heatmapData from '../data/heatmapData.json';
	import * as d3 from 'd3';

	const rawMonths = heatmapData.months;
	const rawAccounts = heatmapData.accounts;
	
	// Keep only data between 2024-03 and 2026-01
	let startIndex = rawMonths.indexOf("2024-03");
	let endIndex = rawMonths.indexOf("2026-01");
	
	// Fallback if exactly those strings aren't found
	if (startIndex === -1) startIndex = 0;
	if (endIndex === -1) endIndex = rawMonths.length - 1;
	
	const months = rawMonths.slice(startIndex, endIndex + 1);
	
	// Slice all users' data arrays and filter out single test account
	const accounts = rawAccounts
		.filter((acct: { account: string }) => acct.account.includes("usa"))
		.map((acct: { account: string; days: Record<string, number[]> }) => {
			let newDays: Record<string, number[]> = {};
			for (let day of Object.keys(acct.days)) {
				newDays[day] = acct.days[day].slice(startIndex, endIndex + 1);
			}
			return {
				account: acct.account,
				days: newDays
			};
		});
	
	// Recalculate max because we sliced the array, the old globalMax might be from an excluded month
	let globalMax = 1;
	for (let acct of accounts) {
		for (let day of Object.keys(acct.days)) {
			// Find max within the remaining dataset
			const dayArr = acct.days[day] || [];
			const dayMax = Math.max(...(dayArr.length ? dayArr : [0]));
			if (dayMax > globalMax) globalMax = dayMax;
		}
	}

	const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	let container: HTMLElement;
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

	// Custom 9-step blue palette: dark navy → deep blue → vivid blue → bright blue → pale sky → near white
	// Matches the reference screenshot's color ramp
	const blues: string[] = [
		'#e8f4ff', // 1 – near white (lowest)
		'#b8dcff', // 2 – pale sky
		'#6db8ff', // 3 – light blue
		'#3a91f0', // 4 – medium blue
		'#1a6be8', // 5 – vivid blue
		'#0f4bbf', // 6 – strong blue
		'#0a2a6e', // 7 – deep blue
		'#061540', // 8 – navy
		'#03060f', // 9 – near black (highest)
	];
	const blueScale = d3.scaleQuantize<string>()
		.domain([0, globalMax])
		.range(blues);

	// Pre-calculate legend steps (reversed so darkest is at the top)
	const reversedLegend = [...blues].reverse().map((color, idx) => {
		const actBucket = 8 - idx;
		const threshold = Math.round(actBucket * (globalMax / 9));
		return { color, label: threshold };
	});

	// Heatmap mapping: Discrete shades of blue
	function getColor(val: number) {
		if (!val || val === 0) return '#ffffff'; // 0 posts → white
		return blueScale(val);
	}
	
	function getTextColor(val: number) {
		const ratio = Math.min(val / globalMax, 1);
		// White text on dark cells, dark text on light cells
		// Threshold raised slightly because our palette is darker overall
		return ratio > 0.35 ? '#ffffff' : '#0a1628';
	}

	// Format "2024-03" → "24 03" (compact, no redundant century)
	function formatMonth(m: string) {
		const [year, mon] = m.split('-');
		return `${year.slice(2)} ${mon}`;
	}

</script>

<div class="scrolly-container" bind:this={container}>
	<!-- Fixed Flex Layout to prevent clipping on small screens -->
	<div class="heatmap-sticky">
		
		<div class="header">
			<h2>Temporal Posting Patterns</h2>
			<p>Comparing frequency of posts across users (Scale max: {globalMax})</p>
		</div>
		
		<div class="main-layout">
		<!-- Color legend — left side -->
		<div class="legend-container">
			<div class="legend-title">Posts</div>
			<div class="legend-bar">
				{#each reversedLegend as bin, idx (idx)}
					<div class="legend-swatch" style="background-color: {bin.label === 0 ? '#ffffff' : bin.color};">
						<span class="legend-label">{bin.label}</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="heatmap-stack">
			{#each accounts as acct, accountIndex}
				<div class="heatmap-wrapper">
					<div class="heatmap-header">
						<h3 class="account-title">@{acct.account}</h3>
					</div>
					<div class="grid-container" style="--total-cols: {months.length};">
						<!-- Row 1: Top span annotations -->
						<div class="corner"></div> <!-- row header spacer -->
						<div class="annot-arc-top" style="grid-column: 2 / span 12; opacity: {progress >= 0.1 && progress < 0.4 ? 1 : 0};">
							<span>Election Cycle</span>
						</div>
						<div class="annot-arc-top" style="grid-column: 14 / span 11; opacity: {progress >= 0.4 && progress < 0.7 ? 1 : 0};">
							<span>Post-Inauguration</span>
						</div>
						<div class="corner"></div> <!-- right legend spacer -->
						
						<!-- Row 2: Month headers -->
						<div class="corner"></div>
						{#each months as month}
							<div class="month-header">
								<span class="rotate-text">{formatMonth(month)}</span>
							</div>
						{/each}
						<div class="corner"></div>

						<!-- Rows 3-9: Days -->
						{#each daysOrder as day, dayIdx}
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
							
							<!-- Right Pointer Annotation -->
							{#if dayIdx === 5}
								<div class="annot-weekends" style="grid-row: 8 / span 2; grid-column: -2 / -1; opacity: {progress >= 0.7 ? 1 : 0};">
									<span>Less posts<br/>during<br/>weekends</span>
								</div>
							{:else if dayIdx !== 6}
								<div class="corner"></div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
	</div>
</div>

<style>
	.scrolly-container {
		position: relative;
		height: 350vh; 
		background-color: #03050c; 
		font-family: 'Montserrat', sans-serif;
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

	.header {
		text-align: center;
		margin-bottom: 2.5rem;
		flex-shrink: 0;
	}
	.header h2 {
		margin: 0 0 0.5rem 0;
		color: #fff;
		font-size: 1.6rem;
		font-weight: 800;
	}
	.header p {
		margin: 0 0 1.5rem 0;
		color: rgba(255,255,255,0.6);
		font-size: 0.9rem;
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		width: 100%;
		gap: 2vw;
		flex: 1;
		min-height: 0; 
		justify-content: center;
	}

	.heatmap-stack {
		position: relative; /* Anchor for absolute annotations */
		display: flex;
		flex-direction: column;
		gap: 1.5vh; 
		width: 100%;
		flex: 1; /* Stretch to fill remaining viewport exactly */
		min-height: 0; /* Prevents overflow push */
		justify-content: center; /* Center single item nicely */
	}

	.legend-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-end; /* bar sits flush against the chart on its right edge */
		width: 60px;
		flex-shrink: 0;
	}

	.legend-title {
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		color: #ffffff;
		margin-bottom: 0.5rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.legend-bar {
		display: flex;
		flex-direction: column;
		height: 250px;
		width: 18px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.legend-swatch {
		flex: 1;
		width: 100%;
		position: relative;
	}

	.legend-label {
		position: absolute;
		/* Labels sit to the LEFT of the swatch, hanging outward */
		right: 24px;
		top: -7px;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		text-align: right;
	}

	.heatmap-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5vh;
		flex: 1; /* Three boxes split exactly 33% vertical height */
		min-height: 0; 
		max-height: 60vh; /* Lock single user height */
	}

	.heatmap-header {
		flex-shrink: 0;
	}

	.account-title {
		font-family: 'Montserrat', sans-serif;
		font-size: clamp(0.8rem, 2vh, 1.1rem);
		color: #38bdf8;
		margin: 0 0 0 35px; /* Align to grid offset */
		font-weight: 600;
	}

	.grid-container {
		display: grid;
		/* No trailing right column — legend moved to left, weekend annotation flows naturally */
		grid-template-columns: 35px repeat(var(--total-cols), minmax(0, 1fr)) 120px;
		grid-template-rows: 35px 25px repeat(7, minmax(0, 1fr)); 
		gap: 2px;
		width: 100%;
		flex: 1; 
		min-height: 0;
	}

	.corner {
		/* Fills the 1x1 top-left implicit slot safely */
	}

	.month-header {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}

	.rotate-text {
		transform: none;
		font-size: clamp(0.65rem, 1.5vh, 0.9rem);
		color: rgba(255, 255, 255, 0.65);
		white-space: nowrap;
		display: inline-block;
		text-align: center;
	}

	.day-label {
		font-size: clamp(0.65rem, 1.5vh, 0.9rem);
		color: rgba(255, 255, 255, 0.65);
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

	/* Double-tick horizontal span — |————————| with label centered above
	   Encodes a time range clearly without implying directionality */
	.annot-arc-top {
		position: relative;
		height: 10px;
		margin-top: 18px;
		margin-bottom: 2px;
		transition: opacity 0.4s ease-in-out;
		will-change: opacity;
		/* Horizontal bar */
		border-top: 1px solid rgba(255, 255, 255, 0.75);
		border-left: none;
		border-right: none;
		border-bottom: none;
		border-radius: 0;
	}

	/* Left tick */
	.annot-arc-top::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 0;
		width: 1px;
		height: 8px;
		background: rgba(255, 255, 255, 0.75);
	}

	/* Right tick */
	.annot-arc-top::after {
		content: '';
		position: absolute;
		top: -1px;
		right: 0;
		width: 1px;
		height: 8px;
		background: rgba(255, 255, 255, 0.75);
	}

	.annot-arc-top span {
		position: absolute;
		top: -22px;
		/* Center label over the full span */
		left: 0;
		right: 0;
		text-align: center;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.5px;
		color: rgba(255, 255, 255, 0.95);
		white-space: nowrap;
	}

	/* Vertical blockquote bar — spans the Sat + Sun rows on the right
	   A vertical accent encodes a row grouping (day axis), not a time range */
	.annot-weekends {
		position: relative;
		margin-left: 8px;
		margin-top: 2px;
		margin-bottom: 2px;
		display: flex;
		align-items: center; /* vertically center the label */
		transition: opacity 0.4s ease-in-out;
		will-change: opacity;
		/* Vertical accent bar on the left edge */
		border-left: 2px solid rgba(255, 255, 255, 0.6);
		border-top: none;
		border-right: none;
		border-bottom: none;
	}

	.annot-weekends span {
		position: absolute;
		left: 12px;
		font-family: 'Montserrat', sans-serif;
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.4px;
		color: rgba(255, 255, 255, 0.85);
		white-space: nowrap;
		line-height: 1.5;
	}
</style>

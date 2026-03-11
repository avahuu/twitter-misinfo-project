<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let container: HTMLDivElement;

	interface DataPoint {
		month: string;
		tweet_count: number;
	}

	interface AccountData {
		name: string;
		values: { date: Date; count: number }[];
		color: string;
	}

	const accounts = [
		{ name: 'CaoChangqing', file: '/data/CaoChangqing_monthly.csv', color: '#ff7f0e' },
		{ name: 'usa912152217', file: '/data/usa912152217_monthly.csv', color: '#1f77b4' },
		{ name: 'SydneyDaddy1', file: '/data/SydneyDaddy1_monthly.csv', color: '#2ca02c' }
	];

	onMount(async () => {
		// 1. Load the data
		const parseTime = d3.timeParse('%Y-%m');
		const allData: AccountData[] = [];

		for (const d of accounts) {
			const csvData = await d3.csv<keyof DataPoint>(d.file);
			const values = csvData
				.map((row: d3.DSVRowString<keyof DataPoint>) => ({
					date: parseTime(row.month!) as Date,
					count: +row.tweet_count!
				}))
				.filter((v: { date: Date; count: number }) => v.date !== null && !isNaN(v.count))
				.sort(
					(a: { date: Date; count: number }, b: { date: Date; count: number }) =>
						a.date.getTime() - b.date.getTime()
				); // Ensure sorted by date

			allData.push({
				name: d.name,
				color: d.color,
				values
			});
		}

		// Flatten dates to find domain
		const allDates = allData.flatMap((d) => d.values.map((v) => v.date));
		const allCounts = allData.flatMap((d) => d.values.map((v) => v.count));

		// 2. Setup Chart Dimensions
		const margin = { top: 40, right: 150, bottom: 80, left: 60 };
		const width = 800 - margin.left - margin.right;
		const height = 450 - margin.top - margin.bottom;

		// Clear any existing svg (useful for HMR)
		d3.select(container).selectAll('*').remove();

		const svg = d3
			.select(container)
			.append('svg')
			.attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
			.attr('preserveAspectRatio', 'xMidYMid meet')
			.style('width', '100%')
			.style('height', 'auto')
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// 3. Setup Scales
		const x = d3
			.scaleTime()
			.domain(d3.extent(allDates) as [Date, Date])
			.range([0, width]);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(allCounts)! * 1.1])
			.range([height, 0]);

		// 4. Setup Axes
		svg
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(
				d3.axisBottom(x)
					.ticks(d3.timeMonth)
					.tickFormat((d) => d3.timeFormat('%Y-%m')(d as Date))
			)
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)');

		svg.append('g').call(d3.axisLeft(y));

		// Y-axis label
		svg
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin.left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('Monthly Tweet Count');

		// 5. Draw Lines
		const line = d3
			.line<{ date: Date; count: number }>()
			.x((d) => x(d.date))
			.y((d) => y(d.count))
			.curve(d3.curveMonotoneX);

		svg
			.selectAll('.line')
			.data(allData)
			.enter()
			.append('path')
			.attr('class', 'line')
			.attr('fill', 'none')
			.attr('stroke', (d: unknown) => (d as AccountData).color)
			.attr('stroke-width', 3)
			.attr('d', (d: unknown) => line((d as AccountData).values));

		// Add labels at the end of the lines
		svg
			.selectAll('.label')
			.data(allData)
			.enter()
			.append('text')
			.datum((d: unknown) => {
				const account = d as AccountData;
				return {
					name: account.name,
					color: account.color,
					value: account.values[account.values.length - 1] // Get last point
				};
			})
			.attr('transform', (d: unknown) => {
				const dd = d as { value: { date: Date; count: number } };
				return `translate(${x(dd.value.date)},${y(dd.value.count)})`;
			})
			.attr('x', 5)
			.attr('dy', '.35em')
			.style('fill', (d: unknown) => (d as { color: string }).color)
			.style('font-weight', 'bold')
			.text((d: unknown) => (d as { name: string }).name);

		// 6. Setup Tooltip and Interactivity
		const tooltip = d3
			.select(container)
			.append('div')
			.style('opacity', 0)
			.attr('class', 'tooltip')
			.style('position', 'absolute')
			.style('background-color', 'white')
			.style('border', 'solid')
			.style('border-width', '1px')
			.style('border-radius', '5px')
			.style('padding', '10px')
			.style('pointer-events', 'none');

		// Add invisible rect for mouse tracking
		svg
			.append('rect')
			.attr('width', width)
			.attr('height', height)
			.style('fill', 'none')
			.style('pointer-events', 'all')
			.on('mousemove', function (event: MouseEvent) {
				const [xPos] = d3.pointer(event); // this is relative to the `g` within the SVG viewBox
				const mouseDate = x.invert(xPos);

				// Find the closest data points for each line
				const bisect = d3.bisector((d: { date: Date; count: number }) => d.date).left;

				let htmlContent = `<strong>${d3.timeFormat('%Y-%m')(mouseDate)}</strong><br/>`;

				allData.forEach((account) => {
					const i = bisect(account.values, mouseDate, 1);
					const d0 = account.values[i - 1];
					const d1 = account.values[i];
					if (d0 && d1) {
						const d =
							mouseDate.getTime() - d0.date.getTime() > d1.date.getTime() - mouseDate.getTime()
								? d1
								: d0;
						htmlContent += `<span style="color:${account.color}">${account.name}: ${d.count}</span><br/>`;
					}
				});

				tooltip
					.html(htmlContent)
					.style('opacity', 1)
					.style('left', event.pageX + 15 + 'px')
					.style('top', event.pageY - 28 + 'px');
			})
			.on('mouseout', function () {
				tooltip.style('opacity', 0);
			});
	});
</script>

<div class="bump-chart-container py-5">
	<h3 class="text-center mb-4">Monthly Tweet Volume Comparison</h3>
	<div bind:this={container} class="chart position-relative"></div>
</div>

<style>
	.bump-chart-container {
		width: 100%;
		/* Remove overflow-x: auto so the responsive svg handles fit natively */
	}
	.chart {
		width: 100%;
		position: relative;
	}
	:global(.tooltip) {
		pointer-events: none; /* Make sure tooltip doesn't steal hover */
	}
</style>

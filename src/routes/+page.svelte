<script lang="ts">
	import rawBlocks from '$lib/doc.blocks.json';
	import DocRenderer from '$lib/components/DocRenderer.svelte';
	import TimelineWaterfall from '$lib/components/TimelineWaterfall.svelte';
	import HeatmapComparison from '$lib/components/HeatmapComparison.svelte';
	import type { Block } from '$lib/components/DocRenderer.svelte';
	const blocks = rawBlocks as Block[];
</script>
<TimelineWaterfall />
<HeatmapComparison />

<!-- DO NOT EDIT (except to modify classes). This will become code imported from Google Doc. -->
<div class="container">
	<div class="row justify-content-center">
		<div class="col-12 col-sm-10 col-lg-8 col-xxl-6">
			<DocRenderer {blocks} />
		</div>
	</div>
</div>

<!-- Hard-code any custom code that should appear AFTER Google Doc below here. -->
<footer class="container-fluid bg-dark text-white p-5">
	<p class="text-center">
		See template on <a
			class="text-white"
			href="https://github.com/jrue/multimedia-template-2026"
			target="_blank">Github</a
		>
	</p>
</footer>

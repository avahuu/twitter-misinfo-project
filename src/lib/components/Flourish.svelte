<script lang="ts">
	import { onMount } from 'svelte';

	export let src = '';
	export let size: 'full' | 'large' | 'fit' = 'large'; // Default back to large so it pops out of the text

	const allowedSizes = new Set(['full', 'large', 'fit']);
	$: normalizedSize = allowedSizes.has(String(size)) ? size : 'large';

	let hostEl: HTMLDivElement | null = null;

	onMount(() => {
		if (!hostEl) return;

		// Dynamically inject the embed script so Flourish can handle the perfect responsive mobile height calculation
		const script = document.createElement('script');
		script.src = "https://public.flourish.studio/resources/embed.js";
		script.defer = true;
		
		hostEl.appendChild(script);

		return () => {
			if (script && script.parentNode) {
				script.parentNode.removeChild(script);
			}
		};
	});
</script>

{#if normalizedSize === 'full'}
	<figure class="my-4 full-bleed">
		<div class="flourish-embed flourish-chart" data-src={src} bind:this={hostEl}></div>
	</figure>
{:else if normalizedSize === 'large'}
	<figure class="my-4 full-bleed">
		<div class="container-fluid">
			<div class="row justify-content-center">
				<div class="col-12 col-lg-10 col-xxl-8">
					<div class="flourish-embed flourish-chart w-100" data-src={src} bind:this={hostEl}></div>
				</div>
			</div>
		</div>
	</figure>
{:else}
	<figure class="my-4">
		<div class="flourish-embed flourish-chart" data-src={src} bind:this={hostEl}></div>
	</figure>
{/if}

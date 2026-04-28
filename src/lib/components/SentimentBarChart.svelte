<script>
  import { onMount } from 'svelte';

  const data = [
    { topic: "Russia", sentiment: 0.949, count: 366 },
    { topic: "China", sentiment: 0.930, count: 358 },
    { topic: "Ukraine", sentiment: 0.897, count: 417 },
    { topic: "Media", sentiment: 0.896, count: 833 },
    { topic: "Female", sentiment: 0.864, count: 148 },
    { topic: "Immigration", sentiment: 0.835, count: 816 },
    { topic: "Male", sentiment: 0.833, count: 108 },
    { topic: "Election", sentiment: 0.821, count: 1120 },
    { topic: "LGBTQ", sentiment: 0.806, count: 84 },
    { topic: "Safety", sentiment: 0.800, count: 866 },
    { topic: "Black", sentiment: 0.798, count: 108 },
    { topic: "California", sentiment: 0.760, count: 367 }
  ];

  const PRIMARY_COLOR = '#38bdf8';
  
  let containerEl;
  let svgEl;
  let tooltip = { visible: false, x: 0, y: 0, text: '' };

  onMount(() => {
    drawChart();
    const ro = new ResizeObserver(() => drawChart());
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  function drawChart() {
    if (!svgEl) return;
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    const W = svgEl.clientWidth || 600;
    const H = Math.max(400, data.length * 35);
    svgEl.style.height = `${H}px`;

    const ml = 90, mr = 20, mt = 20, mb = 40;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const minSentiment = 0.7;
    const maxSentiment = 1.0;
    const range = maxSentiment - minSentiment;
    
    const xPx = val => ml + (Math.max(0, val - minSentiment) / range) * pw;
    const yPx = i => mt + (i + 0.5) * (ph / data.length);
    const barHeight = (ph / data.length) * 0.7;

    // Grid lines
    for (let v = 0.7; v <= 1.0; v += 0.1) {
      const x = xPx(v);
      line(svgEl, x, mt, x, mt + ph, 'rgba(255,255,255,0.08)');
      text(svgEl, x, mt + ph + 20, v.toFixed(1), {
        'font-size': '12', 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.5)'
      });
    }

    // Axis line
    line(svgEl, ml, mt, ml, mt + ph, 'rgba(255,255,255,0.2)');

    // Bars
    data.forEach((d, i) => {
      const y = yPx(i) - barHeight / 2;
      const w = xPx(d.sentiment) - ml;
      
      // label
      text(svgEl, ml - 12, yPx(i) + 4, d.topic, {
        'font-size': '13', 'text-anchor': 'end', fill: '#fff', 'font-weight': '500'
      });

      const rect = el('rect', {
        x: ml, y, width: Math.max(0, w), height: barHeight,
        fill: 'rgba(56, 189, 248, 0.15)',
        stroke: PRIMARY_COLOR,
        'stroke-width': '1.5',
        rx: 3,
        style: 'cursor: pointer; transition: opacity 0.2s;'
      });
      
      rect.addEventListener('mouseover', e => {
        rect.style.opacity = '0.8';
        tooltip = {
          visible: true,
          x: e.clientX + 10,
          y: e.clientY - 20,
          text: `${d.topic}: ${d.sentiment.toFixed(3)} avg sentiment (${d.count} tweets)`
        };
      });
      
      rect.addEventListener('mousemove', e => {
        tooltip.x = e.clientX + 10;
        tooltip.y = e.clientY - 20;
      });
      
      rect.addEventListener('mouseleave', () => {
        rect.style.opacity = '1';
        tooltip.visible = false;
      });
      
      svgEl.appendChild(rect);

      // value text at the end of the bar
      text(svgEl, xPx(d.sentiment) + 6, yPx(i) + 4, d.sentiment.toFixed(3), {
        'font-size': '11', fill: 'rgba(255,255,255,0.7)', 'text-anchor': 'start'
      });
    });
  }

  // ── SVG helpers ──
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function line(svg, x1, y1, x2, y2, stroke) {
    svg.appendChild(el('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1 }));
  }
  function text(svg, x, y, content, attrs={}) {
    const t = el('text', { x, y, ...attrs });
    t.textContent = content;
    svg.appendChild(t);
  }
</script>

{#if tooltip.visible}
  <div class="sentiment-tooltip" style="left:{tooltip.x}px; top:{tooltip.y}px">
    {tooltip.text}
  </div>
{/if}

<div class="chart-wrapper" bind:this={containerEl}>
  <div class="header">
    <h2>Topic Sentiment Analysis</h2>
    <div class="user-profile">
      <img src="{base}/twitter_profiles_img/xixing_headshto.jpg" alt="Xi Xing Xiao Bao 2.0" />
      <div class="user-info">
        <span class="user-name">Xi Xing Xiao Bao 2.0</span>
        <span class="user-handle">@usa912152217</span>
      </div>
    </div>
    <p>Average sentiment score per topic (0 = Negative, 1 = Positive). Hover over bars for details.</p>
  </div>
  <svg class="chart-svg" bind:this={svgEl}></svg>
</div>

<style>
  .chart-wrapper {
    width: 100%;
    max-width: 800px;
    margin: 2rem auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  .header h2 {
    margin: 0 0 1rem 0;
    color: #fff;
    font-size: 1.6rem;
    font-weight: 800;
  }
  .user-profile {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
    padding: 0.4rem 0.8rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 999px;
  }
  .user-profile img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid #38bdf8;
    object-fit: cover;
  }
  .user-info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .user-name {
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.1;
  }
  .user-handle {
    color: rgba(255,255,255,0.5);
    font-size: 0.75rem;
  }
  .header p {
    margin: 0 0 1.5rem 0;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
  }
  .chart-svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .sentiment-tooltip {
    position: fixed;
    z-index: 10000;
    background: rgba(15, 23, 42, 0.95);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    pointer-events: none;
    border: 1px solid #38bdf8;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  }
</style>

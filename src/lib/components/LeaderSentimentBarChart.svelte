<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';

  const data = [
    { leader: "Putin", img: "Putin.png", sentiment: 0.994, count: 47 },
    { leader: "Xi Jinping", img: "Xi.png", sentiment: 0.931, count: 136 },
    { leader: "Zelensky", img: "Zelensky.png", sentiment: 0.917, count: 41 },
    { leader: "Epstein", img: "Epstein.png", sentiment: 0.895, count: 89 },
    { leader: "Biden", img: "Biden.png", sentiment: 0.873, count: 1454 },
    { leader: "Trump", img: "Trump.png", sentiment: 0.872, count: 3900 },
    { leader: "Elon Musk", img: "Elon.png", sentiment: 0.831, count: 607 },
    { leader: "Kamala Harris", img: "Kamala.png", sentiment: 0.827, count: 520 },
    { leader: "AOC", img: "AOC.png", sentiment: 0.774, count: 17 }
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

    // Defs for circle clip-path
    const defs = el('defs', {});
    const clipPath = el('clipPath', { id: 'circle-clip', clipPathUnits: 'objectBoundingBox' });
    clipPath.appendChild(el('circle', { cx: '0.5', cy: '0.5', r: '0.5' }));
    defs.appendChild(clipPath);
    svgEl.appendChild(defs);

    const W = svgEl.clientWidth || 600;
    const H = Math.max(400, data.length * 40); // slightly taller rows for images
    svgEl.style.height = `${H}px`;

    const ml = 160, mr = 30, mt = 20, mb = 40;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const minSentiment = 0.7;
    const maxSentiment = 1.0;
    const range = maxSentiment - minSentiment;
    
    const xPx = val => ml + (Math.max(0, val - minSentiment) / range) * pw;
    const yPx = i => mt + (i + 0.5) * (ph / data.length);
    const barHeight = (ph / data.length) * 0.65;

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
      const imgSize = Math.min(28, barHeight * 1.2);
      
      // image
      const imgNode = el('image', {
        href: `${base}/twitter_profiles_img/sentiment_headshot/${d.img}`,
        x: ml - imgSize - 8,
        y: yPx(i) - imgSize / 2,
        width: imgSize,
        height: imgSize,
        preserveAspectRatio: 'xMidYMid slice',
        'clip-path': 'url(#circle-clip)'
      });
      svgEl.appendChild(imgNode);

      // label
      text(svgEl, ml - imgSize - 16, yPx(i) + 4, d.leader, {
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
          text: `${d.leader}: ${d.sentiment.toFixed(3)} avg sentiment (${d.count} tweets)`
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
    <h2>Leader Sentiment Analysis (@usa912152217)</h2>
    <p>Average sentiment score per political figure (0 = Negative, 1 = Positive).</p>
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

<script>
  import { onMount } from 'svelte';

  const ACCOUNTS = [
    { key: 'CaoChangqing', label: '曹長青', handle: '@CaoChangqing' },
    { key: 'SydneyDaddy1', label: '悉尼奶爸', handle: '@SydneyDaddy1' },
    { key: 'usa912152217', label: '西行小宝2.0', handle: '@usa912152217' },
  ];

  const HOUR_LABELS = Array.from({ length: 13 }, (_, i) => i * 2); // 0,2,4...24
  const BLUE   = '#38bdf8'; // bright blue for burst
  const NORMAL = 'rgba(160,170,185,0.35)';

  let data = null;
  let svgEls = {};
  let containerEl;
  let drawn = false;

  // ── fetch data ────────────────────────────────────────────────────────────
  onMount(async () => {
    const res = await fetch('/burstData.json');
    data = await res.json();
    drawAll();

    const ro = new ResizeObserver(() => { if (data) drawAll(); });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  // ── drawing ───────────────────────────────────────────────────────────────
  function drawAll() {
    for (const acc of ACCOUNTS) {
      if (svgEls[acc.key] && data[acc.key]) draw(acc.key, data[acc.key]);
    }
  }

  function draw(key, { normal, burst }) {
    const svg = svgEls[key];
    if (!svg) return;

    // clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const W = svg.clientWidth  || 900;
    const H = svg.clientHeight || 220;
    const ml = 52, mr = 16, mt = 12, mb = 38;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    // ── scale helpers ─────────────────────────────────────────────────────
    const allMs  = normal.concat(burst).map(p => p[0]);
    const minMs  = Math.min(...allMs);
    const maxMs  = Math.max(...allMs);
    const xRange = maxMs - minMs || 1;

    function xPx(ms)   { return ml + ((ms - minMs) / xRange) * pw; }
    function yPx(hour) { return mt + (hour / 24) * ph; }

    // ── grid lines (y) ───────────────────────────────────────────────────
    for (const h of HOUR_LABELS) {
      const y = yPx(h);
      line(svg, ml, y, ml + pw, y, 'rgba(255,255,255,0.06)');
      text(svg, ml - 6, y + 4, `${String(h).padStart(2,'0')}:00`, {
        'font-size': '9', 'text-anchor': 'end', fill: 'rgba(255,255,255,0.4)'
      });
    }

    // ── x-axis tick marks (every 2 months) ───────────────────────────────
    const start = new Date(minMs);
    start.setDate(1);
    start.setHours(0,0,0,0);
    // round up to next even month
    if (start.getMonth() % 2 !== 0) start.setMonth(start.getMonth() + 1);
    const tickMs = [];
    const cur = new Date(start);
    while (cur.getTime() <= maxMs) {
      tickMs.push(cur.getTime());
      cur.setMonth(cur.getMonth() + 2);
    }

    for (const ms of tickMs) {
      const x = xPx(ms);
      line(svg, x, mt, x, mt + ph, 'rgba(255,255,255,0.06)');
      const d = new Date(ms);
      const label = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      text(svg, x, mt + ph + 14, label, {
        'font-size': '8.5', 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.4)',
        transform: `rotate(-35, ${x}, ${mt + ph + 14})`
      });
    }

    // ── scatter dots ─────────────────────────────────────────────────────
    // Draw normal first (behind), then burst on top
    for (const [ms, hr] of normal) {
      circle(svg, xPx(ms), yPx(hr), 1.6, NORMAL);
    }
    for (const [ms, hr] of burst) {
      circle(svg, xPx(ms), yPx(hr), 3.5, BLUE, 0.8);
    }

    // ── legend ───────────────────────────────────────────────────────────
    const lx = ml + pw - 8;
    const ly = mt + 8;
    circle(svg, lx - 70, ly, 2, 'rgba(160,170,185,0.5)');
    text(svg, lx - 62, ly + 3.5, `Normal (${normal.length})`, {
      'font-size': '9', fill: 'rgba(255,255,255,0.5)'
    });
    circle(svg, lx - 70, ly + 16, 3.5, BLUE, 0.85);
    text(svg, lx - 62, ly + 19.5, `In burst (${burst.length})`, {
      'font-size': '9', fill: BLUE
    });

    // ── axis border ───────────────────────────────────────────────────────
    line(svg, ml, mt, ml, mt + ph, 'rgba(255,255,255,0.15)');
    line(svg, ml, mt + ph, ml + pw, mt + ph, 'rgba(255,255,255,0.15)');
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  function circle(svg, cx, cy, r, fill, opacity = 1) {
    svg.appendChild(el('circle', { cx, cy, r, fill, opacity }));
  }

  function line(svg, x1, y1, x2, y2, stroke) {
    svg.appendChild(el('line', { x1, y1, x2, y2, stroke, 'stroke-width': 0.5 }));
  }

  function text(svg, x, y, content, attrs = {}) {
    const t = el('text', { x, y, ...attrs });
    t.textContent = content;
    svg.appendChild(t);
  }
</script>

<div class="bt-wrapper" bind:this={containerEl}>
  <div class="bt-header">
    <h2 class="bt-title">发帖行为 · Burst Timeline</h2>
    <p class="bt-subtitle">
      每个点代表一条推文（x = 日期，y = UTC 发帖时段）。
      <span class="burst-label">亮蓝色点</span>为集中爆发时段（burst session）内的推文。
    </p>
  </div>

  {#each ACCOUNTS as acc}
    <div class="bt-chart-block">
      <div class="bt-chart-label">
        <span class="bt-name">{acc.label}</span>
        <span class="bt-handle">{acc.handle}</span>
      </div>
      <svg
        class="bt-svg"
        bind:this={svgEls[acc.key]}
      ></svg>
    </div>
  {/each}
</div>

<style>
  .bt-wrapper {
    width: 100%;
    background: #050a12;
    color: #fff;
    padding: 3rem 2rem 4rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
  }

  .bt-header {
    max-width: 960px;
    margin: 0 auto 2.5rem;
  }

  .bt-title {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    background: linear-gradient(90deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .bt-subtitle {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    margin: 0;
    line-height: 1.6;
  }

  .burst-label {
    color: #38bdf8;
    font-weight: 600;
  }

  .bt-chart-block {
    max-width: 960px;
    margin: 0 auto 2.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .bt-chart-label {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.85rem 1.25rem 0.6rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .bt-name {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .bt-handle {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
  }

  .bt-svg {
    display: block;
    width: 100%;
    height: 220px;
  }
</style>

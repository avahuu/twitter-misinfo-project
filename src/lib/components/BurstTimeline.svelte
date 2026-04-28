<script>
  import { onMount } from 'svelte';

  const ACCOUNTS = [
    { key: 'CaoChangqing', label: 'Cao Changqing', handle: '@CaoChangqing' },
    { key: 'SydneyDaddy1', label: 'Sydney Daddy',  handle: '@SydneyDaddy1' },
    { key: 'usa912152217', label: 'Xi Xing Xiao Bao 2.0', handle: '@usa912152217' },
  ];

  const HOUR_LABELS = Array.from({ length: 13 }, (_, i) => i * 2);
  const BLUE   = '#38bdf8';
  const NORMAL = 'rgba(160,170,185,0.3)';

  let data = null;
  let svgEls    = {};
  let containerEl;

  // tooltip state
  let tooltip = { visible: false, x: 0, y: 0, text: '', date: '', burstCount: 0, burstDur: 0 };

  // per-chart burst point lookup (for hover)
  let burstCache = {}; // key → [{px, py, text, date, burstCount, burstDur}]

  // ── fetch + draw ──────────────────────────────────────────────────────────
  onMount(async () => {
    const res = await fetch('/burstData.json');
    data = await res.json();
    drawAll();

    const ro = new ResizeObserver(() => { if (data) drawAll(); });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  function drawAll() {
    for (const acc of ACCOUNTS) {
      if (svgEls[acc.key] && data[acc.key]) draw(acc.key, data[acc.key]);
    }
  }

  // ── main draw function ────────────────────────────────────────────────────
  function draw(key, { normal, burst }) {
    const svg = svgEls[key];
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const W  = svg.clientWidth  || 900;
    const H  = svg.clientHeight || 220;
    const ml = 52, mr = 16, mt = 12, mb = 42;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    // scale
    const allMs  = normal.map(p=>p[0]).concat(burst.map(p=>p[0]));
    const minMs  = Math.min(...allMs);
    const maxMs  = Math.max(...allMs);
    const xRange = maxMs - minMs || 1;
    const xPx = ms   => ml + ((ms - minMs) / xRange) * pw;
    const yPx = hour => mt + (hour / 24) * ph;

    // y grid
    for (const h of HOUR_LABELS) {
      const y = yPx(h);
      line(svg, ml, y, ml + pw, y, 'rgba(255,255,255,0.05)');
      text(svg, ml - 6, y + 4, `${String(h).padStart(2,'0')}:00`, {
        'font-size': '9', 'text-anchor': 'end', fill: 'rgba(255,255,255,0.35)'
      });
    }

    // x ticks (every 2 months)
    const s0 = new Date(minMs); s0.setDate(1); s0.setHours(0,0,0,0);
    if (s0.getMonth() % 2 !== 0) s0.setMonth(s0.getMonth() + 1);
    const cur = new Date(s0);
    while (cur.getTime() <= maxMs) {
      const x = xPx(cur.getTime());
      line(svg, x, mt, x, mt + ph, 'rgba(255,255,255,0.05)');
      const lbl = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`;
      const xt = el('text', {
        x, y: mt + ph + 8,
        'font-size': '8.5', 'text-anchor': 'end', fill: 'rgba(255,255,255,0.35)',
        transform: `rotate(-40, ${x}, ${mt + ph + 8})`
      });
      xt.textContent = lbl;
      svg.appendChild(xt);
      cur.setMonth(cur.getMonth() + 2);
    }

    // normal dots
    for (const [ms, hr] of normal) {
      circle(svg, xPx(ms), yPx(hr), 1.6, NORMAL);
    }

    // burst dots — store pixel positions for hover
    const cache = [];
    for (const [ms, hr, tw, tc, dur] of burst) {
      const px = xPx(ms), py = yPx(hr);
      const c = circle(svg, px, py, 4, BLUE, 0.75);
      const d = new Date(ms);
      const dateStr = d.toLocaleString('en-US', {
        month:'short', day:'numeric', year:'numeric',
        hour:'2-digit', minute:'2-digit', timeZone:'UTC', timeZoneName:'short'
      });
      cache.push({ px, py, tw, date: dateStr, burstCount: tc, burstDur: dur });
    }
    burstCache[key] = cache;

    // legend
    const lx = ml + pw;
    const ly = mt + 8;
    circle(svg, lx - 80, ly, 2, 'rgba(160,170,185,0.55)');
    text(svg, lx - 72, ly + 4, `Normal (${normal.length})`, {
      'font-size': '9', fill: 'rgba(255,255,255,0.45)'
    });
    circle(svg, lx - 80, ly + 16, 4, BLUE, 0.8);
    text(svg, lx - 72, ly + 20, `Burst (${burst.length})`, {
      'font-size': '9', fill: BLUE
    });

    // axis borders
    line(svg, ml, mt, ml, mt + ph, 'rgba(255,255,255,0.12)');
    line(svg, ml, mt + ph, ml + pw, mt + ph, 'rgba(255,255,255,0.12)');

    // invisible hit area for mouse events
    const hitRect = el('rect', {
      x: ml, y: mt, width: pw, height: ph,
      fill: 'transparent', style: 'cursor:crosshair'
    });
    hitRect.addEventListener('mousemove', e => onMouseMove(e, key, svg));
    hitRect.addEventListener('mouseleave', () => { tooltip = { ...tooltip, visible: false }; });
    svg.appendChild(hitRect);
  }

  // ── hover handler ─────────────────────────────────────────────────────────
  function onMouseMove(e, key, svg) {
    const rect  = svg.getBoundingClientRect();
    const mx    = e.clientX - rect.left;
    const my    = e.clientY - rect.top;
    const cache = burstCache[key] || [];

    let best = null, bestDist = Infinity;
    for (const pt of cache) {
      const d = Math.hypot(pt.px - mx, pt.py - my);
      if (d < bestDist) { bestDist = d; best = pt; }
    }

    if (best && bestDist < 20) {
      tooltip = {
        visible: true,
        x: e.clientX + 14,
        y: e.clientY - 10,
        text: best.tw,
        date: best.date,
        burstCount: best.burstCount,
        burstDur: best.burstDur
      };
    } else {
      tooltip = { ...tooltip, visible: false };
    }
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function circle(svg, cx, cy, r, fill, opacity=1) {
    const c = el('circle', { cx, cy, r, fill, opacity });
    svg.appendChild(c);
    return c;
  }
  function line(svg, x1, y1, x2, y2, stroke) {
    svg.appendChild(el('line', { x1, y1, x2, y2, stroke, 'stroke-width': 0.5 }));
  }
  function text(svg, x, y, content, attrs={}) {
    const t = el('text', { x, y, ...attrs });
    t.textContent = content;
    svg.appendChild(t);
  }
</script>

<!-- Global tooltip (fixed to viewport) -->
{#if tooltip.visible}
  <div
    class="bt-tooltip"
    style="left:{tooltip.x}px; top:{tooltip.y}px"
    role="tooltip"
  >
    <div class="tt-date">{tooltip.date}</div>
    <div class="tt-meta">
      Burst session · {tooltip.burstCount} tweets · {tooltip.burstDur} min
    </div>
    <div class="tt-text">{tooltip.text || '(no text available)'}</div>
  </div>
{/if}

<div class="bt-wrapper" bind:this={containerEl}>
  <div class="bt-header">
    <h2 class="bt-title">Posting Behavior · Burst Timeline</h2>
    <p class="bt-subtitle">
      Each dot is one tweet (x = date, y = hour of day UTC).
      <span class="burst-label">Bright blue dots</span> fall within
      a detected burst session — a short window of unusually rapid posting.
      Hover over blue dots to see the tweet.
    </p>
  </div>

  {#each ACCOUNTS as acc}
    <div class="bt-chart-block">
      <div class="bt-chart-label">
        <span class="bt-name">{acc.label}</span>
        <span class="bt-handle">{acc.handle}</span>
      </div>
      <svg class="bt-svg" bind:this={svgEls[acc.key]}></svg>
    </div>
  {/each}
</div>

<style>
  /* ── Tooltip (fixed to viewport) ──────────────────────────────── */
  .bt-tooltip {
    position: fixed;
    z-index: 9999;
    max-width: 320px;
    background: rgba(10, 20, 35, 0.97);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 0.6rem;
    padding: 0.7rem 0.9rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.78rem;
    color: #e2e8f0;
    pointer-events: none;
    box-shadow: 0 8px 30px rgba(0,0,0,0.6);
    line-height: 1.45;
  }
  .tt-date {
    font-size: 0.7rem;
    color: #38bdf8;
    font-weight: 600;
    margin-bottom: 0.2rem;
  }
  .tt-meta {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.4);
    margin-bottom: 0.45rem;
  }
  .tt-text {
    color: #f1f5f9;
    font-size: 0.78rem;
    word-break: break-word;
  }

  /* ── Layout ────────────────────────────────────────────────────── */
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
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.6;
  }
  .burst-label { color: #38bdf8; font-weight: 600; }

  .bt-chart-block {
    max-width: 960px;
    margin: 0 auto 2rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 0.75rem;
    overflow: hidden;
  }
  .bt-chart-label {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.8rem 1.25rem 0.55rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .bt-name   { font-weight: 700; font-size: 0.95rem; }
  .bt-handle { font-size: 0.8rem; color: rgba(255,255,255,0.35); }
  .bt-svg    { display: block; width: 100%; height: 220px; }
</style>

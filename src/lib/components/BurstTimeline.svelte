<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';

  const ACCOUNTS = [
    {
      key: 'CaoChangqing',
      label: 'Cao Changqing',
      handle: '@CaoChangqing',
      avatar: `${base}/twitter_profiles_img/cao_headshot.jpg`
    },
    {
      key: 'SydneyDaddy1',
      label: 'Sydney Daddy',
      handle: '@SydneyDaddy1',
      avatar: `${base}/twitter_profiles_img/sydney_headshot.jpg`
    },
    {
      key: 'usa912152217',
      label: 'Xi Xing Xiao Bao 2.0',
      handle: '@usa912152217',
      avatar: `${base}/twitter_profiles_img/xixing_headshto.jpg`
    },
  ];

  const HOUR_LABELS = Array.from({ length: 13 }, (_, i) => i * 2);
  const BLUE   = '#38bdf8';
  const NORMAL = 'rgba(160,170,185,0.28)';

  let data = null;
  let svgEls     = {};
  let containerEl;
  let counts     = {}; // key → { normal, burst }

  // tooltip state
  let tooltip = { visible: false, x: 0, y: 0, text: '', date: '', burstCount: 0, burstDur: 0 };
  let burstCache = {};

  // ── fetch + draw ──────────────────────────────────────────────────────────
  onMount(async () => {
    const res = await fetch(`${base}/burstData.json`);
    data = await res.json();

    // pre-compute counts for display outside SVG
    for (const acc of ACCOUNTS) {
      if (data[acc.key]) {
        counts[acc.key] = {
          normal: data[acc.key].normal.length,
          burst:  data[acc.key].burst.length
        };
      }
    }
    counts = { ...counts }; // trigger reactivity

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

  // ── main draw ─────────────────────────────────────────────────────────────
  function draw(key, { normal, burst }) {
    const svg = svgEls[key];
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const W  = svg.clientWidth  || 900;
    const H  = svg.clientHeight || 264;
    const ml = 52, mr = 16, mt = 12, mb = 44;
    const pw = W - ml - mr;
    const ph = H - mt - mb;

    const allMs  = normal.map(p=>p[0]).concat(burst.map(p=>p[0]));
    const minMs  = Math.min(...allMs);
    const maxMs  = Math.max(...allMs);
    const xRange = maxMs - minMs || 1;
    const xPx = ms   => ml + ((ms - minMs) / xRange) * pw;
    const yPx = hour => mt + (hour / 24) * ph;

    // y grid + labels
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
        x, y: mt + ph + 9,
        'font-size': '8.5', 'text-anchor': 'end', fill: 'rgba(255,255,255,0.35)',
        transform: `rotate(-40, ${x}, ${mt + ph + 9})`
      });
      xt.textContent = lbl;
      svg.appendChild(xt);
      cur.setMonth(cur.getMonth() + 2);
    }

    // normal dots
    for (const [ms, hr] of normal) {
      circle(svg, xPx(ms), yPx(hr), 1.8, NORMAL, 1);
    }

    // burst dots with stroke (so stacked dots show depth)
    const cache = [];
    for (const [ms, hr, tw, tc, dur] of burst) {
      const px = xPx(ms), py = yPx(hr);
      burstCircle(svg, px, py);
      const d = new Date(ms);
      const dateStr = d.toLocaleString('en-US', {
        month:'short', day:'numeric', year:'numeric',
        hour:'2-digit', minute:'2-digit', timeZone:'UTC', timeZoneName:'short'
      });
      cache.push({ px, py, tw, date: dateStr, burstCount: tc, burstDur: dur });
    }
    burstCache[key] = cache;

    // axis borders
    line(svg, ml, mt, ml, mt + ph, 'rgba(255,255,255,0.12)');
    line(svg, ml, mt + ph, ml + pw, mt + ph, 'rgba(255,255,255,0.12)');

    // transparent hit area for hover
    const hitRect = el('rect', {
      x: ml, y: mt, width: pw, height: ph,
      fill: 'transparent', style: 'cursor:crosshair'
    });
    hitRect.addEventListener('mousemove', e => onMouseMove(e, key, svg));
    hitRect.addEventListener('mouseleave', () => { tooltip = { ...tooltip, visible: false }; });
    svg.appendChild(hitRect);
  }

  // ── hover ─────────────────────────────────────────────────────────────────
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

    if (best && bestDist < 22) {
      tooltip = {
        visible: true,
        x: e.clientX + 16,
        y: e.clientY - 12,
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
    svg.appendChild(el('circle', { cx, cy, r, fill, opacity }));
  }
  // Burst dot with transparent fill and solid stroke
  function burstCircle(svg, cx, cy) {
    svg.appendChild(el('circle', {
      cx, cy, r: 4.5,
      fill: 'rgba(56, 189, 248, 0.15)',
      stroke: BLUE,
      'stroke-width': '1.5'
    }));
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

<!-- Fixed tooltip -->
{#if tooltip.visible}
  <div class="bt-tooltip" style="left:{tooltip.x}px; top:{tooltip.y}px" role="tooltip">
    <div class="tt-date">{tooltip.date}</div>
    <div class="tt-meta">Burst session · {tooltip.burstCount} tweets · {tooltip.burstDur} min</div>
    <div class="tt-text">{tooltip.text || '(no text available)'}</div>
  </div>
{/if}

<div class="bt-wrapper" bind:this={containerEl}>
  <div class="header">
    <h2>Posting Behavior · Burst Timeline</h2>
    <p>
      Each dot is one tweet (x = date, y = UTC hour of day).
      <span class="burst-label">Blue dots</span> fall within a detected burst session —
      an unusually rapid sequence of posts. Hover a blue dot to read the tweet.
    </p>
  </div>

  {#each ACCOUNTS as acc}
    {@const c = counts[acc.key]}
    <div class="bt-chart-block">

      <!-- Header row: avatar + name + stat pills -->
      <div class="bt-chart-label">
        <img class="bt-avatar" src={acc.avatar} alt={acc.label} />
        <div class="bt-identity">
          <span class="bt-name">{acc.label}</span>
          <span class="bt-handle">{acc.handle}</span>
        </div>
        {#if c}
          <div class="bt-stats">
            <span class="stat stat-normal">
              <span class="stat-dot normal-dot"></span>
              Normal &nbsp;<strong>{c.normal.toLocaleString()}</strong>
            </span>
            <span class="stat stat-burst">
              <span class="stat-dot burst-dot"></span>
              Burst &nbsp;<strong>{c.burst.toLocaleString()}</strong>
            </span>
          </div>
        {/if}
      </div>

      <svg class="bt-svg" bind:this={svgEls[acc.key]}></svg>
    </div>
  {/each}
</div>

<style>
  /* ── Tooltip ───────────────────────────────────────────────────── */
  .bt-tooltip {
    position: fixed;
    z-index: 9999;
    max-width: 320px;
    background: rgba(8,18,32,0.97);
    border: 1px solid rgba(56,189,248,0.4);
    border-radius: 0.6rem;
    padding: 0.7rem 0.9rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.78rem;
    color: #e2e8f0;
    pointer-events: none;
    box-shadow: 0 8px 30px rgba(0,0,0,0.7);
    line-height: 1.5;
  }
  .tt-date  { font-size: 0.7rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.15rem; }
  .tt-meta  { font-size: 0.67rem; color: rgba(255,255,255,0.38); margin-bottom: 0.4rem; }
  .tt-text  { color: #f1f5f9; font-size: 0.77rem; word-break: break-word; }

  /* ── Wrapper ───────────────────────────────────────────────────── */
  .bt-wrapper {
    width: 100%;
    color: #fff;
    padding: 3rem 2rem 4rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-sizing: border-box;
  }
  
  .header {
    text-align: center;
    margin-bottom: 2.5rem;
    max-width: 960px;
    margin-left: auto;
    margin-right: auto;
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
    line-height: 1.65;
  }
  .burst-label { color: #38bdf8; font-weight: 600; }

  /* ── Chart card ────────────────────────────────────────────────── */
  .bt-chart-block {
    max-width: 960px;
    margin: 0 auto 2rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  /* Header row */
  .bt-chart-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .bt-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(56,189,248,0.3);
    flex-shrink: 0;
  }
  .bt-identity {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    flex: 1;
  }
  .bt-name   { font-weight: 700; font-size: 0.92rem; line-height: 1.2; }
  .bt-handle { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

  /* Stat pills */
  .bt-stats {
    display: flex;
    gap: 0.6rem;
    flex-shrink: 0;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .stat-normal {
    background: rgba(160,170,185,0.1);
    color: rgba(255,255,255,0.5);
  }
  .stat-burst {
    background: rgba(56,189,248,0.1);
    color: #38bdf8;
  }
  .stat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .normal-dot { background: rgba(160,170,185,0.6); }
  .burst-dot  {
    background: rgba(56,189,248,0.15);
    border: 1.5px solid #38bdf8;
    box-sizing: border-box;
  }

  /* SVG — 20% taller than original 220px */
  .bt-svg { display: block; width: 100%; height: 264px; }
</style>

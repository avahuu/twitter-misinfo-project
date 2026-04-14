<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  // ── Types ─────────────────────────────────────────────────────────────────────
  interface Kw { cn: string; en: string; pct: number; }
  interface BubbleDot { x: number; y: number; }
  interface FBubble extends Kw { r: number; x: number; y: number; vx: number; vy: number; dots: BubbleDot[]; }

  // ── View state ────────────────────────────────────────────────────────────────
  let view: 'venn' | 'bubble' = 'venn';
  let selectedId: 'usa' | 'syd' | 'cao' | null = null;
  let hoverRegion: string | null = null;
  let clientX = 0, clientY = 0;
  let svgEl: SVGSVGElement;
  let zoomedBubble: FBubble | null = null;
  let bubbles: FBubble[] = [];

  // ── Venn scatter dots ─────────────────────────────────────────────────────────
  let usaDots: {x:number,y:number}[] = [];
  let caoDots: {x:number,y:number}[] = [];
  let sydDots: {x:number,y:number}[] = [];

  // ── Venn geometry ─────────────────────────────────────────────────────────────
  const CIRC = {
    usa: { cx:330, cy:220, r:125, color:'#4da6ff', dim:'rgba(77,166,255,0.07)',  handle:'@usa912152217', posts:8013 },
    cao: { cx:485, cy:220, r:95,  color:'#27d191', dim:'rgba(39,209,145,0.07)',  handle:'@CaoChangqing',  posts:3517 },
    syd: { cx:410, cy:360, r:115, color:'#f5a623', dim:'rgba(245,166,35,0.07)', handle:'@SydneyDaddy1',  posts:7474 },
  } as const;

  // ── Keyword data ──────────────────────────────────────────────────────────────
  const USA_KWS: Kw[] = [
    {cn:'川普',en:'Trump',pct:46.8},{cn:'美国',en:'United States',pct:44.4},
    {cn:'总统',en:'President',pct:30.9},{cn:'政府',en:'Government',pct:27.1},
    {cn:'这是',en:'This is',pct:17.6},{cn:'拜登',en:'Biden',pct:17.3},
    {cn:'可能',en:'Possible',pct:14.6},{cn:'国家',en:'Country',pct:14.0},
    {cn:'现在',en:'Now',pct:13.6},{cn:'今天',en:'Today',pct:12.7},
    {cn:'知道',en:'Know',pct:12.2},{cn:'民主党',en:'Democrats',pct:12.1},
    {cn:'联邦',en:'Federation',pct:11.4},{cn:'支持',en:'Support',pct:11.3},
    {cn:'非法',en:'Illegal',pct:10.8},{cn:'宣布',en:'Announce',pct:10.7},
    {cn:'媒体',en:'Media',pct:10.3},{cn:'移民',en:'Immigration',pct:10.0},
    {cn:'问题',en:'Question',pct:9.9},{cn:'民猪',en:'Folk Pig',pct:9.7},
    {cn:'不会',en:"Won't",pct:9.4},{cn:'这种',en:'This Kind',pct:9.3},
    {cn:'法律',en:'Law',pct:9.1},{cn:'亿美元',en:'$Billions',pct:8.6},
    {cn:'选举',en:'Election',pct:8.7},{cn:'大选',en:'Gen. Election',pct:8.2},
    {cn:'马斯克',en:'Musk',pct:7.2},{cn:'共和党',en:'Republicans',pct:6.5},
    {cn:'战争',en:'War',pct:6.5},{cn:'乌克兰',en:'Ukraine',pct:5.1},
  ];

  const CAO_KWS: Kw[] = [
    {cn:'美国',en:'United States',pct:65.8},{cn:'川普',en:'Trump',pct:61.1},
    {cn:'总统',en:'President',pct:53.0},{cn:'左派',en:'Leftist',pct:35.8},
    {cn:'支持',en:'Support',pct:27.4},{cn:'拜登',en:'Biden',pct:26.8},
    {cn:'这是',en:'This is',pct:24.2},{cn:'今天',en:'Today',pct:23.2},
    {cn:'政府',en:'Government',pct:23.0},{cn:'国家',en:'Country',pct:22.1},
    {cn:'政治',en:'Politics',pct:19.9},{cn:'可能',en:'Possible',pct:19.8},
    {cn:'民主党',en:'Democrats',pct:18.9},{cn:'左媒',en:'Left Media',pct:17.0},
    {cn:'这种',en:'This Kind',pct:16.3},{cn:'白宫',en:'White House',pct:15.7},
    {cn:'现在',en:'Now',pct:15.1},{cn:'世界',en:'World',pct:14.8},
    {cn:'问题',en:'Question',pct:14.7},{cn:'哈里斯',en:'Harris',pct:14.0},
    {cn:'人民',en:'People',pct:14.0},{cn:'全球',en:'Global',pct:13.8},
    {cn:'保守派',en:'Conservative',pct:12.8},{cn:'中国',en:'China',pct:12.5},
    {cn:'媒体',en:'Media',pct:12.2},{cn:'乌克兰',en:'Ukraine',pct:11.9},
    {cn:'共和党',en:'Republicans',pct:10.4},{cn:'亿美元',en:'$Billions',pct:10.4},
    {cn:'战争',en:'War',pct:10.2},{cn:'移民',en:'Immigration',pct:10.1},
    {cn:'非法',en:'Illegal',pct:9.0},{cn:'马斯克',en:'Musk',pct:9.1},
    {cn:'黑人',en:'Black People',pct:8.2},{cn:'欧洲',en:'Europe',pct:8.4},
    {cn:'哈马斯',en:'Hamas',pct:5.5},{cn:'普京',en:'Putin',pct:5.7},
    {cn:'台湾',en:'Taiwan',pct:5.4},{cn:'日本',en:'Japan',pct:5.4},
  ];

  const SYD_KWS: Kw[] = [
    {cn:'川普',en:'Trump',pct:12.7},{cn:'美国',en:'United States',pct:12.2},
    {cn:'中国',en:'China',pct:11.3},{cn:'中共',en:'CCP',pct:5.4},
    {cn:'支持',en:'Support',pct:4.7},{cn:'可能',en:'Possible',pct:4.6},
    {cn:'这是',en:'This is',pct:4.6},{cn:'政府',en:'Government',pct:4.2},
    {cn:'国家',en:'Country',pct:3.8},{cn:'伊朗',en:'Iran',pct:3.3},
    {cn:'这种',en:'This Kind',pct:3.3},{cn:'澳洲',en:'Australia',pct:3.2},
    {cn:'以色列',en:'Israel',pct:3.2},{cn:'日本',en:'Japan',pct:3.2},
    {cn:'台湾',en:'Taiwan',pct:3.1},{cn:'知道',en:'Know',pct:3.1},
    {cn:'希望',en:'Hope',pct:3.0},{cn:'现在',en:'Now',pct:3.7},
    {cn:'问题',en:'Question',pct:2.8},{cn:'今天',en:'Today',pct:2.2},
    {cn:'马斯克',en:'Musk',pct:2.8},{cn:'媒体',en:'Media',pct:2.6},
    {cn:'政治',en:'Politics',pct:2.8},{cn:'乌克兰',en:'Ukraine',pct:2.9},
    {cn:'民主党',en:'Democrats',pct:2.1},{cn:'总统',en:'President',pct:2.1},
    {cn:'移民',en:'Immigration',pct:1.7},{cn:'哈里斯',en:'Harris',pct:2.1},
    {cn:'宣布',en:'Announce',pct:2.3},{cn:'不会',en:"Won't",pct:2.2},
    {cn:'俄国',en:'Russia',pct:2.1},{cn:'习近平',en:'Xi Jinping',pct:2.0},
    {cn:'关税',en:'Tariff',pct:2.4},{cn:'民调',en:'Poll',pct:1.6},
    {cn:'孩子',en:'Children',pct:1.6},
  ];

  // ── Intersection sets ─────────────────────────────────────────────────────────
  const INT_USA_CAO: Kw[] = [
    {cn:'拜登',en:'Biden',pct:17.3},{cn:'非法',en:'Illegal',pct:10.8},
    {cn:'亿美元',en:'$Billions',pct:8.6},{cn:'共和党',en:'Republicans',pct:6.5},
    {cn:'战争',en:'War',pct:6.5},
  ];
  const INT_USA_SYD: Kw[] = [
    {cn:'知道',en:'Know',pct:12.2},{cn:'宣布',en:'Announce',pct:10.7},
    {cn:'不会',en:"Won't",pct:9.4},
  ];
  const INT_CAO_SYD: Kw[] = [
    {cn:'中国',en:'China',pct:11.3},{cn:'政治',en:'Politics',pct:2.8},
    {cn:'哈里斯',en:'Harris',pct:2.1},{cn:'以色列',en:'Israel',pct:3.2},
    {cn:'日本',en:'Japan',pct:3.2},{cn:'台湾',en:'Taiwan',pct:3.1},
    {cn:'伊朗',en:'Iran',pct:3.3},{cn:'俄国',en:'Russia',pct:2.1},
  ];
  const INT_ALL: Kw[] = [
    {cn:'川普',en:'Trump',pct:12.7},{cn:'美国',en:'United States',pct:12.2},
    {cn:'总统',en:'President',pct:2.1},{cn:'政府',en:'Government',pct:4.2},
    {cn:'这是',en:'This is',pct:4.6},{cn:'可能',en:'Possible',pct:4.6},
    {cn:'国家',en:'Country',pct:3.8},{cn:'现在',en:'Now',pct:3.7},
    {cn:'今天',en:'Today',pct:2.2},{cn:'民主党',en:'Democrats',pct:2.1},
    {cn:'支持',en:'Support',pct:4.7},{cn:'媒体',en:'Media',pct:2.6},
    {cn:'移民',en:'Immigration',pct:1.7},{cn:'问题',en:'Question',pct:2.8},
    {cn:'这种',en:'This Kind',pct:3.3},{cn:'马斯克',en:'Musk',pct:2.8},
  ];

  const intCns = new Set([...INT_ALL,...INT_USA_CAO,...INT_USA_SYD,...INT_CAO_SYD].map(k=>k.cn));
  const USA_ONLY = USA_KWS.filter(k=>!intCns.has(k.cn));
  const CAO_ONLY = CAO_KWS.filter(k=>!intCns.has(k.cn));
  const SYD_ONLY = SYD_KWS.filter(k=>!intCns.has(k.cn));

  const REGION_KWS: Record<string,Kw[]> = {
    usa:USA_ONLY, cao:CAO_ONLY, syd:SYD_ONLY,
    usa_cao:INT_USA_CAO, usa_syd:INT_USA_SYD, cao_syd:INT_CAO_SYD, all:INT_ALL,
  };
  const REGION_TITLES: Record<string,string> = {
    usa:'Unique to @usa912152217', cao:'Unique to @CaoChangqing', syd:'Unique to @SydneyDaddy1',
    usa_cao:'usa912 ∩ CaoChangqing', usa_syd:'usa912 ∩ SydneyDaddy1',
    cao_syd:'CaoChangqing ∩ SydneyDaddy1', all:'Shared by all three',
  };

  // ── Venn keyword word-cloud labels ────────────────────────────────────────────
  interface VLabel { x:number; y:number; cn:string; fs:number; fill:string; region:string; }
  const VENN_LABELS: VLabel[] = [
    {x:228,y:182,cn:'联邦',  fs:20,fill:'#4da6ff', region:'usa'},
    {x:260,y:208,cn:'选举',  fs:15,fill:'#4da6ff', region:'usa'},
    {x:226,y:230,cn:'大选',  fs:12,fill:'#4da6ff', region:'usa'},
    {x:257,y:249,cn:'民猪',  fs:10,fill:'#4da6ff', region:'usa'},
    {x:544,y:182,cn:'左派',  fs:20,fill:'#27d191', region:'cao'},
    {x:558,y:206,cn:'黑人',  fs:14,fill:'#27d191', region:'cao'},
    {x:540,y:224,cn:'欧洲',  fs:11,fill:'#27d191', region:'cao'},
    {x:554,y:241,cn:'保守派',fs:9, fill:'#27d191', region:'cao'},
    {x:388,y:437,cn:'中共',  fs:18,fill:'#f5a623', region:'syd'},
    {x:427,y:452,cn:'澳洲',  fs:14,fill:'#f5a623', region:'syd'},
    {x:398,y:465,cn:'习近平',fs:12,fill:'#f5a623', region:'syd'},
    {x:408,y:207,cn:'拜登',  fs:14,fill:'rgba(180,220,255,0.85)',region:'usa_cao'},
    {x:404,y:221,cn:'共和党',fs:10,fill:'rgba(180,220,255,0.6)', region:'usa_cao'},
    {x:340,y:300,cn:'知道',  fs:13,fill:'rgba(255,235,180,0.85)',region:'usa_syd'},
    {x:347,y:313,cn:'宣布',  fs:10,fill:'rgba(255,235,180,0.6)', region:'usa_syd'},
    {x:479,y:297,cn:'中国',  fs:14,fill:'rgba(180,255,220,0.85)',region:'cao_syd'},
    {x:474,y:311,cn:'政治',  fs:10,fill:'rgba(180,255,220,0.6)', region:'cao_syd'},
    {x:407,y:255,cn:'川普',  fs:18,fill:'rgba(255,255,255,0.95)',region:'all'},
    {x:408,y:272,cn:'美国',  fs:14,fill:'rgba(255,255,255,0.80)',region:'all'},
  ];

  // ── Geometry helpers ──────────────────────────────────────────────────────────
  function d2(x1:number,y1:number,x2:number,y2:number){ return Math.sqrt((x2-x1)**2+(y2-y1)**2); }

  function getRegion(mx:number,my:number): string|null {
    const A=d2(mx,my,CIRC.usa.cx,CIRC.usa.cy)<CIRC.usa.r;
    const B=d2(mx,my,CIRC.cao.cx,CIRC.cao.cy)<CIRC.cao.r;
    const C=d2(mx,my,CIRC.syd.cx,CIRC.syd.cy)<CIRC.syd.r;
    if(A&&B&&C)return'all'; if(A&&B)return'usa_cao'; if(A&&C)return'usa_syd';
    if(B&&C)return'cao_syd'; if(A)return'usa'; if(B)return'cao'; if(C)return'syd';
    return null;
  }

  function circleOpacity(id:string): number {
    if(!hoverRegion) return 0.82;
    return hoverRegion.includes(id)?1:0.2;
  }

  function onSVGMouseMove(e: MouseEvent) {
    clientX=e.clientX; clientY=e.clientY;
    const rect=svgEl.getBoundingClientRect();
    hoverRegion=getRegion((e.clientX-rect.left)*(780/rect.width),(e.clientY-rect.top)*(520/rect.height));
  }

  function onSVGMouseLeave(){ hoverRegion=null; }

  // ── Sparse scatter dots for inside a bubble ──────────────────────────────────
  function bubbleDots(b: {x:number,y:number,r:number}, n: number): BubbleDot[] {
    const arr: BubbleDot[] = [];
    while(arr.length < n) {
      const a = Math.random()*2*Math.PI, d = Math.sqrt(Math.random())*b.r*0.78;
      arr.push({ x: b.x+Math.cos(a)*d, y: b.y+Math.sin(a)*d });
    }
    return arr;
  }

  // ── Force layout ─────────────────────────────────────────────────────────────
  function forceLayout(kws: Kw[], maxBubbles = 28): FBubble[] {
    const BW=720, BH=460;
    const maxP=Math.max(...kws.map(k=>k.pct));
    const items = kws.slice(0,maxBubbles).map(k=>({
      ...k,
      r: Math.round(15+(k.pct/maxP)*52),
      x: BW/2+(Math.random()-0.5)*140,
      y: BH/2+(Math.random()-0.5)*140,
      vx:0, vy:0,
    }));
    for(let iter=0;iter<500;iter++){
      for(let i=0;i<items.length;i++){
        for(let j=i+1;j<items.length;j++){
          const dx=items[j].x-items[i].x, dy=items[j].y-items[i].y;
          const dist=Math.sqrt(dx*dx+dy*dy)||0.01;
          const minD=items[i].r+items[j].r+5;
          if(dist<minD){const f=((minD-dist)/dist)*0.5;items[i].vx-=dx*f;items[i].vy-=dy*f;items[j].vx+=dx*f;items[j].vy+=dy*f;}
        }
        items[i].vx+=(BW/2-items[i].x)*0.012; items[i].vy+=(BH/2-items[i].y)*0.012;
        const pad=items[i].r+5;
        if(items[i].x<pad)items[i].vx+=(pad-items[i].x)*0.3;
        if(items[i].x>BW-pad)items[i].vx+=(BW-pad-items[i].x)*0.3;
        if(items[i].y<pad)items[i].vy+=(pad-items[i].y)*0.3;
        if(items[i].y>BH-pad)items[i].vy+=(BH-pad-items[i].y)*0.3;
      }
      for(let i=0;i<items.length;i++){items[i].vx*=0.82;items[i].vy*=0.82;items[i].x+=items[i].vx;items[i].y+=items[i].vy;}
    }
    // Attach sparse scatter dots after positions stable
    return items.map(b => ({
      ...b,
      dots: b.r > 45 ? bubbleDots(b, 14)
          : b.r > 32 ? bubbleDots(b, 7)
          : b.r > 22 ? bubbleDots(b, 3)
          : [],
    }));
  }

  function onCircleClick(id:'usa'|'cao'|'syd'){
    selectedId = id;
    const kwMap: Record<string,Kw[]> = {usa:USA_KWS, cao:CAO_KWS, syd:SYD_KWS};
    bubbles = forceLayout(kwMap[id]);
    zoomedBubble = null;
    view = 'bubble';
  }

  function toggleZoom(b: FBubble){
    zoomedBubble = (zoomedBubble===b) ? null : b;
  }

  // ── Venn scatter dots ─────────────────────────────────────────────────────────
  function circDots(cx:number,cy:number,r:number,n:number){
    const arr:{x:number,y:number}[]=[];
    while(arr.length<n){const a=Math.random()*2*Math.PI,d=Math.sqrt(Math.random())*r*0.9;arr.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d});}
    return arr;
  }

  onMount(()=>{
    usaDots=circDots(CIRC.usa.cx,CIRC.usa.cy,CIRC.usa.r,180);
    caoDots=circDots(CIRC.cao.cx,CIRC.cao.cy,CIRC.cao.r,130);
    sydDots=circDots(CIRC.syd.cx,CIRC.syd.cy,CIRC.syd.r,155);
  });

  // ── Reactive ──────────────────────────────────────────────────────────────────
  $: tooltipKws   = hoverRegion?(REGION_KWS[hoverRegion]||[]).slice(0,8):[];
  $: tooltipTitle = hoverRegion?(REGION_TITLES[hoverRegion]||''):'';
  $: selCirc      = selectedId?CIRC[selectedId]:null;
  $: zoomVB       = zoomedBubble
    ? `${zoomedBubble.x-zoomedBubble.r*2.8} ${zoomedBubble.y-zoomedBubble.r*2.8} ${zoomedBubble.r*5.6} ${zoomedBubble.r*5.6}`
    : '0 0 720 460';
</script>

<section class="kv">

<!-- ── FRAME 1: Venn ─────────────────────────────────────────────────────────── -->
{#if view === 'venn'}
<div transition:fade={{duration:350}}>
  <div class="kv-head">
    <h2 class="kv-title">Keyword Overlap Across Accounts</h2>
    <p class="kv-sub">Hover to see shared keywords · click any circle to explore</p>
  </div>

  <div class="legend-row">
    {#each Object.entries(CIRC) as [id, c]}
      <button class="acct-pill" style="color:{c.color};border-color:{c.color}44;background:{c.dim}"
        on:click={()=>onCircleClick(id as any)}>
        {c.handle} · {c.posts.toLocaleString()} posts
      </button>
    {/each}
  </div>

  <div class="venn-wrap">
    <svg bind:this={svgEl} viewBox="0 0 780 520" class="venn-svg"
      on:mousemove={onSVGMouseMove} on:mouseleave={onSVGMouseLeave}>
      <defs>
        <filter id="hd" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {#each usaDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.usa.color} opacity="0.13"/>{/each}
      {#each caoDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.cao.color} opacity="0.13"/>{/each}
      {#each sydDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.syd.color} opacity="0.13"/>{/each}

      {#each Object.entries(CIRC) as [id, c]}
        <circle cx={c.cx} cy={c.cy} r={c.r} fill={c.dim} stroke="none"
          opacity={circleOpacity(id)} style="transition:opacity .2s"/>
        <circle cx={c.cx} cy={c.cy} r={c.r} fill="none"
          stroke={c.color} stroke-width="1.6" stroke-dasharray="7 3.5"
          opacity={circleOpacity(id)} filter="url(#hd)"
          style="transition:opacity .2s; pointer-events:none"/>
      {/each}

      {#each VENN_LABELS as lbl}
        <text x={lbl.x} y={lbl.y} text-anchor="middle" dominant-baseline="middle"
          font-family="Montserrat,sans-serif" font-size={lbl.fs} font-weight="700"
          fill={lbl.fill}
          opacity={!hoverRegion||hoverRegion===lbl.region?1:0.12}
          style="transition:opacity .2s;pointer-events:none">{lbl.cn}</text>
      {/each}

      <!-- Transparent full-area hit circles (must be last/on top) -->
      {#each Object.entries(CIRC) as [id, c]}
        <circle cx={c.cx} cy={c.cy} r={c.r} fill="transparent" style="cursor:pointer"
          on:click={()=>onCircleClick(id as any)} role="button" tabindex="0" aria-label="Explore {c.handle}"/>
      {/each}
    </svg>

    {#if hoverRegion && tooltipKws.length}
      <div class="tooltip" style="left:{clientX+16}px;top:{clientY-12}px" transition:fade={{duration:100}}>
        <div class="tt-head">{tooltipTitle}</div>
        <div class="tt-list">
          {#each tooltipKws as kw}
            <div class="tt-row"><span class="tt-cn">{kw.cn}</span><span class="tt-en">{kw.en}</span></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- ── FRAME 2: Bubble chart (mirrors Venn circle style) ──────────────────────── -->
{:else if view==='bubble' && selCirc}
<div transition:fade={{duration:350}}>
  <div class="kv-head">
    <h2 class="kv-title" style="color:{selCirc.color}">{selCirc.handle}</h2>
    <p class="kv-sub">{selCirc.posts.toLocaleString()} posts · bubble size = % of tweets · click to zoom</p>
  </div>

  <div class="bubble-wrap">
    <svg viewBox={zoomVB} class="bubble-svg" style="transition:viewBox 0s">
      <defs>
        <filter id="hdb" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {#each bubbles as b, i}
        {@const fs = Math.max(6, Math.round(b.r * 0.30))}
        {@const delayS = (i * 0.37 % 3).toFixed(2)}
        {@const durS   = (2.4 + (i % 5) * 0.4).toFixed(1)}

        <g on:click={()=>toggleZoom(b)} style="cursor:{b.r<30?'zoom-in':'default'}" role="button" tabindex="0">
          <!-- Same dashed circle as Venn -->
          <circle cx={b.x} cy={b.y} r={b.r}
            fill={selCirc.dim}
            stroke={selCirc.color}
            stroke-width="1.5"
            stroke-dasharray="7 3.5"
            filter="url(#hdb)"
            opacity="0.9"/>

          <!-- Sparse scatter dots — same style as Venn circle dots -->
          {#each b.dots as d}
            <circle cx={d.x} cy={d.y} r="1.3" fill={selCirc.color} opacity="0.16"/>
          {/each}

          <!-- CN text -->
          <text x={b.x} y={b.y - (b.r>30 ? fs*0.3 : 0)}
            text-anchor="middle" dominant-baseline="middle"
            font-family="Montserrat,sans-serif"
            font-size={fs} font-weight="800"
            fill="rgba(255,255,255,0.95)"
            style="pointer-events:none">{b.cn}</text>

          <!-- EN text (only if bubble large enough) -->
          {#if b.r > 20}
            <text x={b.x} y={b.y + fs*0.85}
              text-anchor="middle" dominant-baseline="middle"
              font-family="Montserrat,sans-serif"
              font-size={Math.max(5, Math.round(fs*0.58))} font-weight="400"
              fill="rgba(255,255,255,0.42)"
              style="pointer-events:none">{b.en}</text>
          {/if}
        </g>
      {/each}
    </svg>
    {#if zoomedBubble}
      <div class="zoom-close-row">
        <button class="zoom-close" on:click={()=>zoomedBubble=null}>× zoom out</button>
      </div>
    {/if}
  </div>
  <div class="back-row">
    <button class="back-btn" on:click={()=>{view='venn';selectedId=null;zoomedBubble=null;}}>
      ← Back to overview
    </button>
  </div>
</div>
{/if}

</section>

<style>
  .kv {
    background: #03050c;
    padding: 4vh 2vw 8vh;
    font-family: 'Montserrat', sans-serif;
    position: relative;
    min-height: 80vh;
  }

  .kv-head { text-align: center; margin-bottom: 3vh; }
  .kv-title { font-size: clamp(1.2rem,3vh,2rem); font-weight:800; color:#fff; margin:0; }
  .kv-sub { font-size:.78rem; color:rgba(255,255,255,.38); margin-top:.5rem; }

  .legend-row { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-bottom:3.5vh; }
  .acct-pill {
    font-family:'Montserrat',sans-serif; font-size:.7rem; font-weight:700;
    letter-spacing:.05em; padding:5px 14px; border-radius:999px; border:1px solid;
    cursor:pointer; transition:opacity .15s,transform .15s;
  }
  .acct-pill:hover { opacity:.75; transform:translateY(-1px); }

  /* Venn */
  .venn-wrap { position:relative; max-width:1100px; margin:0 auto; }
  .venn-svg  { width:100%; height:auto; cursor:crosshair; display:block; }

  /* Tooltip */
  .tooltip {
    position:fixed; z-index:999; background:rgba(8,10,24,.95);
    border:1px solid rgba(255,255,255,.12); border-radius:12px;
    padding:11px 15px; min-width:170px; max-width:240px;
    box-shadow:0 6px 32px rgba(0,0,0,.55); pointer-events:none;
  }
  .tt-head { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.45); margin-bottom:9px; padding-bottom:7px; border-bottom:1px solid rgba(255,255,255,.08); }
  .tt-list  { display:flex; flex-direction:column; gap:6px; }
  .tt-row   { display:flex; align-items:baseline; gap:7px; }
  .tt-cn    { font-size:.88rem; font-weight:600; color:rgba(255,255,255,.92); }
  .tt-en    { font-size:.66rem; color:rgba(255,255,255,.38); white-space:nowrap; }

  /* Back button — centered below chart */
  .back-row {
    display:flex; justify-content:center; margin-top:2rem;
  }
  .back-btn {
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
    color:rgba(255,255,255,.65); font-family:'Montserrat',sans-serif;
    font-size:.76rem; font-weight:600; letter-spacing:.04em;
    padding:9px 24px; border-radius:8px; cursor:pointer;
    transition:background .18s,color .18s;
  }
  .back-btn:hover { background:rgba(255,255,255,.09); color:#fff; }

  /* Zoom-close row */
  .zoom-close-row { display:flex; justify-content:center; margin-top:.75rem; }
  .zoom-close {
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
    color:rgba(255,255,255,.6); font-family:'Montserrat',sans-serif;
    font-size:.72rem; font-weight:600; padding:6px 16px;
    border-radius:8px; cursor:pointer; transition:background .15s;
  }
  .zoom-close:hover { background:rgba(255,255,255,.11); color:#fff; }

  /* Bubble SVG */
  .bubble-wrap { max-width:1100px; margin:0 auto; position:relative; }
  .bubble-svg  { width:100%; height:auto; display:block; }


</style>

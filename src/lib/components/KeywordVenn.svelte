<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  // ── Types ─────────────────────────────────────────────────────────────────────
  interface Kw { cn: string; en: string; pct: number; }
  interface BubbleDot { x: number; y: number; }
  interface FBubble extends Kw { r: number; x: number; y: number; vx: number; vy: number; dots: BubbleDot[]; }

  // ── View state ────────────────────────────────────────────────────────────────
  let view: 'venn' | 'bubble' = 'venn';
  let selectedId: 'usa' | 'syd' | 'cao' | null = null;
  let hoverRegion: string | null = null;
  let hoverBubble: FBubble | null = null;
  let clientX = 0, clientY = 0;
  let localX = 0, localY = 0;
  let svgEl: SVGSVGElement;
  let zoomedBubble: FBubble | null = null;
  let bubbles: FBubble[] = [];

  // ── Geometry Tweens ──────────────────────────────────────────────────────────
  const usaTween = tweened({ cx: 330, cy: 220, r: 125, bgOp: 0.07 }, { duration: 650, easing: cubicOut });
  const caoTween = tweened({ cx: 485, cy: 220, r: 95,  bgOp: 0.07 }, { duration: 650, easing: cubicOut });
  const sydTween = tweened({ cx: 410, cy: 360, r: 115, bgOp: 0.07 }, { duration: 650, easing: cubicOut });
  
  const circTweens = { usa: usaTween, cao: caoTween, syd: sydTween };
  $: currentTweens = { usa: $usaTween, cao: $caoTween, syd: $sydTween };

  const INIT_VB = [175, 75, 435, 420];
  const BUBBLE_VB = [130, 0, 520, 520];
  const vbTween = tweened(INIT_VB, { duration: 650, easing: cubicOut });
  $: viewBoxStr = `${$vbTween[0]} ${$vbTween[1]} ${$vbTween[2]} ${$vbTween[3]}`;

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
    {cn:'拜登',en:'Biden',pct:17.3},{cn:'国家',en:'Country',pct:14.0},
    {cn:'民主党',en:'Democrats',pct:12.1},{cn:'联邦',en:'Federation',pct:11.4},
    {cn:'非法',en:'Illegal',pct:10.8},{cn:'安全',en:'Safe',pct:10.7},
    {cn:'媒体',en:'Media',pct:10.3},{cn:'移民',en:'Immigration',pct:10.0},
    {cn:'民猪',en:'Folk Pig',pct:9.7},{cn:'法律',en:'Law',pct:9.1},
    {cn:'选举',en:'Election',pct:8.7},{cn:'控制',en:'Control',pct:8.7},
    {cn:'亿美元',en:'$Billions',pct:8.6},{cn:'调查',en:'Investigate',pct:8.5},
    {cn:'公司',en:'Company',pct:8.4},{cn:'大选',en:'Gen. Election',pct:8.2},
    {cn:'计划',en:'Plan',pct:7.9},{cn:'马斯克',en:'Musk',pct:7.2},
    {cn:'起诉',en:'Sue',pct:7.1},{cn:'投票',en:'Vote',pct:6.8},
    {cn:'共和党',en:'Republicans',pct:6.5},{cn:'战争',en:'War',pct:6.5},
    {cn:'法官',en:'Judge',pct:5.9},{cn:'乌克兰',en:'Ukraine',pct:5.1},
    {cn:'俄罗斯',en:'Russia',pct:4.5},{cn:'加拿大',en:'Canada',pct:3.6},
  ];

  const CAO_KWS: Kw[] = [
    {cn:'美国',en:'United States',pct:65.8},{cn:'川普',en:'Trump',pct:61.1},
    {cn:'总统',en:'President',pct:53.0},{cn:'左派',en:'Leftist',pct:35.8},
    {cn:'拜登',en:'Biden',pct:26.8},{cn:'政府',en:'Government',pct:23.0},
    {cn:'国家',en:'Country',pct:22.1},{cn:'政治',en:'Politics',pct:19.9},
    {cn:'民主党',en:'Democrats',pct:18.9},{cn:'左媒',en:'Left Media',pct:17.0},
    {cn:'白宫',en:'White House',pct:15.7},{cn:'世界',en:'World',pct:14.8},
    {cn:'问题',en:'Question',pct:14.7},{cn:'哈里斯',en:'Harris',pct:14.0},
    {cn:'人民',en:'People',pct:14.0},{cn:'全球',en:'Global',pct:13.8},
    {cn:'保守派',en:'Conservative',pct:12.8},{cn:'中国',en:'China',pct:12.5},
    {cn:'媒体',en:'Media',pct:12.2},{cn:'乌克兰',en:'Ukraine',pct:11.9},
    {cn:'共和党',en:'Republicans',pct:10.4},{cn:'经济',en:'Economy',pct:10.4},
    {cn:'亿美元',en:'$Billions',pct:10.4},{cn:'战争',en:'War',pct:10.2},
    {cn:'移民',en:'Immigration',pct:10.1},{cn:'乌战',en:'Ukraine War',pct:9.3},
    {cn:'俄国',en:'Russia',pct:9.3},{cn:'马斯克',en:'Musk',pct:9.1},
    {cn:'非法',en:'Illegal',pct:9.0},{cn:'以色列',en:'Israel',pct:8.8},
    {cn:'欧洲',en:'Europe',pct:8.4},{cn:'黑人',en:'Black Ppl',pct:8.2},
    {cn:'林斯基',en:'Linsky',pct:6.7},{cn:'普京',en:'Putin',pct:5.7},
    {cn:'哈马斯',en:'Hamas',pct:5.5},{cn:'日本',en:'Japan',pct:5.4},
    {cn:'台湾',en:'Taiwan',pct:5.4},{cn:'伊朗',en:'Iran',pct:5.0},
  ];

  const SYD_KWS: Kw[] = [
    {cn:'川普',en:'Trump',pct:12.7},{cn:'美国',en:'United States',pct:12.2},
    {cn:'中国',en:'China',pct:11.3},{cn:'中共',en:'CCP',pct:5.4},
    {cn:'很多',en:'A lot',pct:4.8},{cn:'视频',en:'Video',pct:4.8},
    {cn:'政府',en:'Government',pct:4.2},{cn:'国家',en:'Country',pct:3.8},
    {cn:'伊朗',en:'Iran',pct:3.3},{cn:'澳洲',en:'Australia',pct:3.2},
    {cn:'以色列',en:'Israel',pct:3.2},{cn:'日本',en:'Japan',pct:3.2},
    {cn:'台湾',en:'Taiwan',pct:3.1},{cn:'希望',en:'Hope',pct:3.0},
    {cn:'乌克兰',en:'Ukraine',pct:2.9},{cn:'政治',en:'Politics',pct:2.8},
    {cn:'直播',en:'Live Stream',pct:2.8},{cn:'马斯克',en:'Musk',pct:2.8},
    {cn:'媒体',en:'Media',pct:2.6},{cn:'反对',en:'Object',pct:2.6},
    {cn:'关税',en:'Tariff',pct:2.4},{cn:'宣布',en:'Announce',pct:2.3},
    {cn:'哈里斯',en:'Harris',pct:2.1},{cn:'民主党',en:'Democrats',pct:2.1},
    {cn:'俄国',en:'Russia',pct:2.1},{cn:'总统',en:'President',pct:2.1},
    {cn:'习近平',en:'Xi Jinping',pct:2.0},{cn:'移民',en:'Immigration',pct:1.7},
    {cn:'民调',en:'Poll',pct:1.6},{cn:'孩子',en:'Children',pct:1.6},
  ];

  // ── Intersection sets ─────────────────────────────────────────────────────────
  const INT_USA_CAO: Kw[] = [
    {cn:'拜登',en:'Biden',pct:17.3},{cn:'非法',en:'Illegal',pct:10.8},
    {cn:'亿美元',en:'$Billions',pct:8.6},{cn:'共和党',en:'Republicans',pct:6.5},
    {cn:'战争',en:'War',pct:6.5},
  ];
  const INT_USA_SYD: Kw[] = [];
  const INT_CAO_SYD: Kw[] = [
    {cn:'中国',en:'China',pct:11.3},{cn:'政治',en:'Politics',pct:2.8},
    {cn:'哈里斯',en:'Harris',pct:2.1},{cn:'以色列',en:'Israel',pct:3.2},
    {cn:'日本',en:'Japan',pct:3.2},{cn:'台湾',en:'Taiwan',pct:3.1},
    {cn:'伊朗',en:'Iran',pct:3.3},{cn:'俄国',en:'Russia',pct:2.1},
  ];
  const INT_ALL: Kw[] = [
    {cn:'川普',en:'Trump',pct:12.7},{cn:'美国',en:'United States',pct:12.2},
    {cn:'总统',en:'President',pct:2.1},{cn:'政府',en:'Government',pct:4.2},
    {cn:'国家',en:'Country',pct:3.8},{cn:'民主党',en:'Democrats',pct:2.1},
    {cn:'媒体',en:'Media',pct:2.6},{cn:'移民',en:'Immigration',pct:1.7},
    {cn:'乌克兰',en:'Ukraine',pct:2.9},{cn:'马斯克',en:'Musk',pct:2.8},
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
  interface VLabel { x:number; y:number; cn:string; en:string; fs:number; fill:string; region:string; }
  const VENN_LABELS: VLabel[] = [
    // USA ONLY (Shifted to center)
    {x:230, y:135, cn:'调查', en:'Invest.', fs:20,fill:'#4da6ff', region:'usa'},
    {x:285, y:145, cn:'选举', en:'Election', fs:19,fill:'#4da6ff', region:'usa'},
    {x:220, y:185, cn:'联邦', en:'Federation', fs:23,fill:'#4da6ff', region:'usa'},
    {x:275, y:185, cn:'控制', en:'Control', fs:15,fill:'#4da6ff', region:'usa'},
    {x:235, y:230, cn:'安全', en:'Safe', fs:14,fill:'#4da6ff', region:'usa'},
    {x:280, y:235, cn:'起诉', en:'Sue', fs:13,fill:'#4da6ff', region:'usa'},
    // CAO ONLY (Shifted to center)
    {x:560, y:135, cn:'白宫', en:'White House', fs:19,fill:'#27d191', region:'cao'},
    {x:505, y:140, cn:'问题', en:'Question', fs:16,fill:'#27d191', region:'cao'},
    {x:570, y:185, cn:'欧洲', en:'Europe', fs:20,fill:'#27d191', region:'cao'},
    {x:510, y:185, cn:'左派', en:'Leftist', fs:23,fill:'#27d191', region:'cao'},
    {x:525, y:235, cn:'左媒', en:'Left Media', fs:14,fill:'#27d191', region:'cao'},
    {x:575, y:240, cn:'保守派', en:'Conserv.', fs:13,fill:'#27d191', region:'cao'},
    // SYD ONLY (Shifted to center)
    {x:410, y:385, cn:'澳洲', en:'Australia', fs:22,fill:'#f5a623', region:'syd'},
    {x:355, y:415, cn:'习近平', en:'Xi Jinping', fs:18,fill:'#f5a623', region:'syd'},
    {x:465, y:415, cn:'视频', en:'Video', fs:15,fill:'#f5a623', region:'syd'},
    {x:410, y:435, cn:'中共', en:'CCP', fs:24,fill:'#f5a623', region:'syd'},
    {x:470, y:450, cn:'反对', en:'Object', fs:15,fill:'#f5a623', region:'syd'},
    {x:360, y:455, cn:'宣布', en:'Announce', fs:14,fill:'#f5a623', region:'syd'},
    // USA & CAO
    {x:408, y:165, cn:'拜登', en:'Biden', fs:15,fill:'rgba(180,220,255,0.85)',region:'usa_cao'},
    {x:408, y:195, cn:'共和党', en:'Republicans', fs:13,fill:'rgba(180,220,255,0.7)', region:'usa_cao'},
    {x:408, y:220, cn:'非法', en:'Illegal', fs:11,fill:'rgba(180,220,255,0.7)', region:'usa_cao'},
    // CAO & SYD
    {x:470, y:275, cn:'中国', en:'China', fs:15,fill:'rgba(180,255,220,0.85)',region:'cao_syd'},
    {x:445, y:320, cn:'台湾', en:'Taiwan', fs:11,fill:'rgba(180,255,220,0.7)', region:'cao_syd'},
    {x:480, y:330, cn:'政治', en:'Politics', fs:13,fill:'rgba(180,255,220,0.7)', region:'cao_syd'},
    // ALL
    {x:395, y:295, cn:'美国', en:'USA', fs:25,fill:'rgba(255,255,255,0.95)',region:'all'},
    {x:380, y:260, cn:'川普', en:'Trump', fs:22,fill:'rgba(255,255,255,0.85)',region:'all'},
    {x:355, y:285, cn:'总统', en:'President', fs:12,fill:'rgba(255,255,255,0.7)', region:'all'},
    {x:390, y:330, cn:'政府', en:'Government', fs:13,fill:'rgba(255,255,255,0.7)', region:'all'},
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
    if (view === 'bubble') return 1;
    if(!hoverRegion) return 0.82;
    return hoverRegion.includes(id)?1:0.2;
  }

  let debugLog = "";
  function onSVGMouseMove(e: MouseEvent) {
    clientX=e.clientX; clientY=e.clientY;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    localX = e.clientX - rect.left;
    localY = e.clientY - rect.top;
    try {
      const ctm = svgEl.getScreenCTM();
      let locX = 0, locY = 0;
      if (ctm && typeof svgEl.createSVGPoint === 'function') {
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const loc = pt.matrixTransform(ctm.inverse());
        locX = loc.x; locY = loc.y;
      } else {
        const rect = svgEl.getBoundingClientRect();
        const vb = $vbTween;
        const scale = Math.min(rect.width / vb[2], rect.height / vb[3]);
        const dx = (rect.width - vb[2] * scale) / 2;
        const dy = (rect.height - vb[3] * scale) / 2;
        locX = vb[0] + (e.clientX - rect.left - dx) / scale;
        locY = vb[1] + (e.clientY - rect.top - dy) / scale;
      }
      hoverRegion = getRegion(locX, locY);
      debugLog = `mouse: ${locX.toFixed(1)}, ${locY.toFixed(1)} rx: ${hoverRegion} len: ${popoverKws.length}`;
    } catch (e) {
      console.error('Hover Math Error', e);
      hoverRegion = null;
    }
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
    const BW=780, BH=520;
    const maxP=Math.max(...kws.map(k=>k.pct));
    const items = kws.slice(0,maxBubbles).map(k=>({
      ...k,
      r: Math.round(15+(k.pct/maxP)*52),
      x: BW/2+(Math.random()-0.5)*40,
      y: BH/2+(Math.random()-0.5)*40,
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

  function onCircleClick(id:'usa'|'cao'|'syd', evt?: MouseEvent){
    if (view === 'bubble') return;
    selectedId = id;
    const kwMap: Record<string,Kw[]> = {usa:USA_KWS, cao:CAO_KWS, syd:SYD_KWS};
    bubbles = forceLayout(kwMap[id]);
    zoomedBubble = null;
    hoverRegion = null;
    hoverBubble = null;
    view = 'bubble';
    
    vbTween.set([0, 0, 780, 520]);

    for (const [key, t] of Object.entries(circTweens)) {
      if (key === id) {
        t.set({ cx: 390, cy: 260, r: 245, bgOp: 0.15 });
      } else {
        const dx = CIRC[key as 'usa'|'cao'|'syd'].cx - 390;
        const dy = CIRC[key as 'usa'|'cao'|'syd'].cy - 260;
        const angle = Math.atan2(dy, dx);
        t.set({ 
          cx: 390 + Math.cos(angle) * 550, 
          cy: 260 + Math.sin(angle) * 550, 
          r: CIRC[key as 'usa'|'cao'|'syd'].r,
          bgOp: 0.03
        });
      }
    }
  }

  function goBack(){
    view = 'venn';
    selectedId = null;
    zoomedBubble = null;
    hoverBubble = null;
    vbTween.set(INIT_VB);

    for (const [key, t] of Object.entries(circTweens)) {
      const c = CIRC[key as 'usa'|'cao'|'syd'];
      t.set({ cx: c.cx, cy: c.cy, r: c.r, bgOp: 0.07 });
    }
  }

  function toggleZoom(b: FBubble){
    if (zoomedBubble === b) {
      zoomedBubble = null;
      vbTween.set(BUBBLE_VB);
    } else {
      zoomedBubble = b;
      vbTween.set([
        b.x - b.r * 2.8,
        b.y - b.r * 2.8,
        b.r * 5.6,
        b.r * 5.6
      ]);
    }
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
  $: popoverKws   = hoverRegion?(REGION_KWS[hoverRegion]||[]).slice(0,8):[];
  $: popoverTitle = hoverRegion?(REGION_TITLES[hoverRegion]||''):'';
  $: selCirc      = selectedId?CIRC[selectedId]:null;
</script>

<section class="kv">

<!-- ── Unified Morphing Canvas ────────────────────────────────────────────────── -->
<div class="kv-head-wrap">
  {#if view === 'venn'}
    <div class="header" transition:fade={{duration:250}}>
      <h2>Keyword Overlap Across Accounts</h2>
      <p>Hover to see shared keywords · click any circle to explore</p>
    </div>
  {:else if selCirc}
    <div class="header" transition:fade={{duration:250}}>
      <h2 style="color:{selCirc.color}">{selCirc.handle}</h2>
      <p>{selCirc.posts.toLocaleString()} posts · bubble size = % of tweets · click to zoom</p>
    </div>
  {/if}
</div>

<div class="controls-wrap">
  {#if view === 'venn'}
    <div class="legend-row" transition:fade={{duration:250}}>
      {#each Object.entries(CIRC) as [id, c]}
        <button class="acct-pill" style="color:{c.color};border-color:{c.color}44;background:{c.dim}"
          on:click={(e)=>onCircleClick(id as any, e)}>
          {c.handle} · {c.posts.toLocaleString()} posts
        </button>
      {/each}
    </div>
  {/if}
</div>

<div class="venn-wrap">
  {#if view === 'bubble'}
    <button class="up-btn" transition:fade={{duration: 250}}
      on:click={() => { if(zoomedBubble){ zoomedBubble=null; vbTween.set(BUBBLE_VB); } else goBack(); }}
      aria-label="Go back up">
      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  {/if}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svg bind:this={svgEl} viewBox={viewBoxStr} class="venn-svg"
    on:mousemove={onSVGMouseMove} on:mouseleave={onSVGMouseLeave}>
    <defs>
      <filter id="hd" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>

    <!-- ── 1. The 3 Background/Bounding Circles (ALWAYS RENDERED, TWEENED) ── -->
    {#each ['usa', 'cao', 'syd'] as id}
      {@const c = CIRC[id as 'usa'|'cao'|'syd']}
      {@const tc = currentTweens[id as 'usa'|'cao'|'syd']}
      <circle cx={tc.cx} cy={tc.cy} r={tc.r} fill={c.color} fill-opacity={tc.bgOp} stroke="none"
        opacity={view==='venn' ? circleOpacity(id) : 1}
        style="transition:opacity .2s"/>
      <circle cx={tc.cx} cy={tc.cy} r={tc.r} fill="none"
        stroke={c.color} stroke-width="1.6" stroke-dasharray="7 3.5"
        opacity={view==='venn' ? circleOpacity(id) : (id===selectedId?0.9:0)} filter="url(#hd)"
        style="transition:opacity .2s; pointer-events:none"/>
    {/each}

    <!-- ── 2. Venn-Specific Elements (Fade out when entering bubble chart) ── -->
    {#if view === 'venn'}
      <g transition:fade={{duration: 250}}>
        {#each usaDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.usa.color} opacity="0.13"/>{/each}
        {#each caoDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.cao.color} opacity="0.13"/>{/each}
        {#each sydDots as d}<circle cx={d.x} cy={d.y} r="1.3" fill={CIRC.syd.color} opacity="0.13"/>{/each}

        {#each VENN_LABELS as lbl}
          <text text-anchor="middle"
            opacity={!hoverRegion||hoverRegion===lbl.region?1:0.12}
            style="transition:opacity .2s;pointer-events:none">
            <tspan x={lbl.x} y={lbl.y - lbl.fs*0.2} font-family="Montserrat,sans-serif" font-size={lbl.fs} font-weight="800" fill={lbl.fill} dominant-baseline="middle">{lbl.cn}</tspan>
            <tspan x={lbl.x} y={lbl.y + lbl.fs*0.8} font-family="Montserrat,sans-serif" font-size={Math.max(6, Math.round(lbl.fs*0.6))} font-weight="400" fill={lbl.fill} fill-opacity="0.6" dominant-baseline="middle">{lbl.en}</tspan>
          </text>
        {/each}
      </g>
    {/if}

    <!-- ── 3. Bubble Chart Elements (Pop in when entered) ── -->
    {#if view === 'bubble' && selCirc}
      {#each bubbles as b, i}
        {@const fs = Math.max(6, Math.round(b.r * 0.30))}
        <g in:scale={{duration: 500, delay: Math.min(i*12, 350), easing: cubicOut, start: 0.1}} out:fade={{duration: 150}}
           on:click={()=>toggleZoom(b)} on:keydown={(e)=>e.key==='Enter'&&toggleZoom(b)}
           style="cursor:{b.r<30?'zoom-in':'pointer'}" role="button" tabindex="0">
          
          <circle cx={b.x} cy={b.y} r={b.r}
            on:mouseover={() => hoverBubble = b} on:mouseout={() => hoverBubble = null}
            fill={selCirc.dim} stroke={selCirc.color} stroke-width="1.2" stroke-dasharray="5 3" filter="url(#hd)" opacity="0.85"/>
          {#each b.dots as d}
            <circle cx={d.x} cy={d.y} r="1.3" fill={selCirc.color} opacity="0.16"/>
          {/each}
          <text x={b.x} y={b.y - (b.r>20 ? fs*0.25 : 0)}
            text-anchor="middle" dominant-baseline="middle"
            font-family="Montserrat,sans-serif" font-size={fs} font-weight="800"
            fill="rgba(255,255,255,0.95)" style="pointer-events:none">{b.cn}</text>
          {#if b.r > 20}
            <text x={b.x} y={b.y + fs*0.85}
              text-anchor="middle" dominant-baseline="middle"
              font-family="Montserrat,sans-serif" font-size={Math.max(5, Math.round(fs*0.58))} font-weight="400"
              fill="rgba(255,255,255,0.42)" style="pointer-events:none">{b.en}</text>
          {/if}
        </g>
      {/each}
    {/if}

    <!-- ── 4. Interactions ── -->
    {#if view === 'venn'}
      {#each ['usa', 'cao', 'syd'] as id}
        {@const c = CIRC[id as 'usa'|'cao'|'syd']}
        {@const tc = currentTweens[id as 'usa'|'cao'|'syd']}
        <circle cx={tc.cx} cy={tc.cy} r={tc.r} fill="transparent" style="cursor:pointer"
          on:click={(e)=>onCircleClick(id as 'usa'|'cao'|'syd', e)} on:keydown={(e)=>e.key==='Enter'&&onCircleClick(id as 'usa'|'cao'|'syd')} role="button" tabindex="0" aria-label="Explore {c.handle}"/>
      {/each}
    {/if}
  </svg>

  {#if view === 'venn' && hoverRegion && popoverKws.length}
    <div class="venn-popover" style="left:{localX+16}px;top:{localY-12}px" transition:fade={{duration:100}}>
      <div class="tt-head">{popoverTitle}</div>
      <div class="tt-list">
        {#each popoverKws as kw}
          <div class="tt-row">
            <span class="tt-cn">{kw.cn}</span>
            <span class="tt-en">{kw.en}</span>
            <span class="tt-pct">{kw.pct}%</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if view === 'bubble' && hoverBubble && selCirc}
    <div class="venn-popover" style="left:{localX+16}px;top:{localY-12}px; min-width:120px;">
      <div class="tt-row" style="margin-bottom:2px;">
        <span class="tt-cn" style="font-size:1.1rem; color:{selCirc.color};">{hoverBubble.cn}</span>
      </div>
      <div class="tt-row" style="margin-bottom:8px;">
        <span class="tt-en" style="font-size:0.75rem; color:rgba(255,255,255,0.48);">{hoverBubble.en}</span>
      </div>
      <div class="tt-row" style="padding-top:6px; border-top:1px solid rgba(255,255,255,0.1);">
        <span class="tt-en" style="font-size:0.75rem; color:rgba(255,255,255,0.75);">Posts</span>
        <span class="tt-pct" style="font-size:0.9rem; margin-left:auto; display:flex; align-items:baseline;">
          {Math.round(hoverBubble.pct / 100 * selCirc.posts)} 
          <span style="font-size:0.75rem; font-weight:400; opacity:0.65; margin-left:4px;">({hoverBubble.pct}%)</span>
        </span>
      </div>
    </div>
  {/if}
</div>

</section>

<style>
  .kv {
    padding: 4vh 2vw 8vh;
    font-family: 'Montserrat', sans-serif;
    position: relative;
    min-height: 80vh;
  }

  .kv-head-wrap { margin-bottom: 24px; padding-top: 1rem; }
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

  /* Interactive Elements Reset */
  svg g:focus, svg circle:focus { outline: none; }

  .controls-wrap { position: relative; min-height: 3.5rem; margin-bottom: 20px; }
  .legend-row, .back-row { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }

  .acct-pill {
    font-family:'Montserrat',sans-serif; font-size:.7rem; font-weight:700;
    letter-spacing:.05em; padding:5px 14px; border-radius:999px; border:1px solid;
    cursor:pointer; transition:opacity .15s,transform .15s;
  }
  .acct-pill:hover { opacity:.75; transform:translateY(-1px); }

  /* Venn */
  .venn-wrap { position:relative; max-width:1100px; margin:0 auto; }
  .venn-svg  { width:100%; height:auto; max-height:68vh; display:block; margin:0 auto; }

  /* Tooltip */
  .venn-popover {
    position:absolute; z-index:999; background:rgba(8,10,24,.95);
    border:1px solid rgba(255,255,255,.12); border-radius:12px;
    padding:11px 15px; min-width:170px; max-width:240px;
    box-shadow:0 6px 32px rgba(0,0,0,.55); pointer-events:none;
  }
  .tt-head { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.45); margin-bottom:9px; padding-bottom:7px; border-bottom:1px solid rgba(255,255,255,.08); }
  .tt-list  { display:flex; flex-direction:column; gap:6px; }
  .tt-row   { display:flex; align-items:baseline; gap:7px; }
  .tt-cn    { font-size:.88rem; font-weight:600; color:rgba(255,255,255,.92); }
  .tt-en    { font-size:.66rem; color:rgba(255,255,255,.38); white-space:nowrap; }
  .tt-pct   { font-size:.70rem; font-weight:700; color:rgba(255,255,255,.6); margin-left:auto; font-variant-numeric: tabular-nums; }

  /* Floating Up/Back arrow button */
  .up-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: all 0.2s;
  }
  .up-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    transform: translateY(-2px);
  }


</style>

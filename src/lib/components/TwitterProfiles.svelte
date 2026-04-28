<script>
  import { profiles, tweets } from './twitterData.js';
  import { onMount, onDestroy } from 'svelte';

  // SVG Icons
  const VerifiedIcon = `<svg viewBox="0 0 24 24" aria-label="Verified account" role="img" class="icon-verified"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.846 3.45-.06.273-.095.556-.095.847 0 2.21 1.71 4 3.918 4 .47 0 .92-.086 1.336-.25C9.182 21.585 10.49 22.5 12 22.5s2.816-.917 3.337-2.25c.416.165.866.25 1.336.25 2.21 0 3.918-1.792 3.918-4 0-.29-.035-.574-.095-.848 1.107-.704 1.846-1.99 1.846-3.45z" fill="currentColor"></path><path d="M10.246 15.364l-2.613-2.613c-.39-.39-.39-1.023 0-1.414.39-.39 1.024-.39 1.415 0l1.905 1.906 4.685-4.686c.39-.39 1.024-.39 1.415 0 .39.39.39 1.024 0 1.414l-5.392 5.393c-.39.39-1.024.39-1.415 0z" fill="#fff"></path></g></svg>`;
  const ReplyIcon   = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>`;
  const RepostIcon  = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>`;
  const LikeIcon    = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>`;
  const ViewIcon    = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>`;
  const BookmarkIcon= `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></g></svg>`;
  const ShareIcon   = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg>`;
  const MoreIcon    = `<svg viewBox="0 0 24 24" class="icon-metric"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g></svg>`;

  const enrichedTweets = tweets.map(tweet => ({
    ...tweet,
    profile: profiles.find(p => p.id === tweet.profileId)
  }));

  // ── Scroll-driven parallax state ──────────────────────────────────────────
  let containerEl;
  let scrollY      = 0;
  let containerTop = 0;
  let winH         = 600;
  let ticking      = false;   // rAF guard

  $: localScroll = Math.max(0, scrollY - containerTop);
  $: slideIndex  = localScroll / winH;

  $: panel1Y       = Math.min(0, -(slideIndex - 0.5) * 100 / 0.5);
  $: panel1Opacity = Math.max(0, 1 - (slideIndex - 0.5) * 2);
  $: panel2Y       = Math.max(0, (1 - (slideIndex - 0.5) / 0.5) * 100);
  $: panel2Opacity = Math.min(1, Math.max(0, (slideIndex - 0.5) * 2));

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        scrollY = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }

  onMount(() => {
    winH = window.innerHeight;
    scrollY = window.scrollY;
    if (containerEl) containerTop = containerEl.getBoundingClientRect().top + window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      winH = window.innerHeight;
      if (containerEl) containerTop = containerEl.getBoundingClientRect().top + window.scrollY;
    });
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', onScroll);
    }
  });
</script>

<!--
  The outer wrapper reserves 3 × 100vh of scroll space:
  • 1st vh  = profiles fade in & hold
  • 2nd vh  = transition to tweets
  • 3rd vh  = tweets hold then fade out before releasing page scroll
-->
<div
  class="tp-spacer"
  bind:this={containerEl}
  style="height: 300vh;"
>
  <div class="tp-sticky">

    <!-- Permanent black background — never moves -->
    <div class="tp-bg"></div>

    <!-- Fade-out overlay at very end so tweets don't bleed into next section -->
    <div class="tp-fade-out" style="opacity: {Math.max(0, (slideIndex - 1.7) * 4)};"></div>

    <!-- Panel 1: Profiles ──────────────────────────────────────────────── -->
    <div
      class="tp-panel profiles-panel"
      style="transform: translateY({panel1Y}vh); opacity: {panel1Opacity};"
    >
      <div class="profiles-wrapper">
        {#each profiles as profile}
          <div class="profile-card">
            <div class="banner">
              {#if profile.banner}
                <img src="{profile.banner}" alt="Banner" />
              {/if}
            </div>

            <div class="profile-content">
              <div class="avatar-row">
                <div class="avatar-wrapper">
                  <img src="{profile.avatar}" alt="{profile.name}" />
                </div>
                <div class="actions">
                  <button class="action-btn">{@html MoreIcon}</button>
                  <button class="follow-btn">Follow</button>
                </div>
              </div>

              <div class="user-info">
                <h2>{profile.name} {#if profile.verified}{@html VerifiedIcon}{/if}</h2>
                <p class="handle">{profile.handle}</p>
              </div>

              <div class="bio">{profile.bio}</div>

              <div class="stats">
                <div class="stat">
                  <span class="stat-num">{profile.following}</span>
                  <span class="stat-label">Following</span>
                </div>
                <div class="stat">
                  <span class="stat-num">{profile.followers}</span>
                  <span class="stat-label">Followers</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Panel 2: Tweets ────────────────────────────────────────────────── -->
    <div
      class="tp-panel tweets-panel"
      style="transform: translateY({panel2Y}vh); opacity: {panel2Opacity};"
    >
      <div class="tweets-wrapper">
        {#each enrichedTweets as tweet}
          <div class="tweet-card">
            <div class="tweet-layout">
              <div class="tweet-avatar">
                <img src="{tweet.profile.avatar}" alt="{tweet.profile.name}" />
              </div>

              <div class="tweet-content">
                <div class="tweet-header">
                  <div class="tweet-meta">
                    <span class="tweet-name">{tweet.profile.name}</span>
                    {@html VerifiedIcon}
                    <span class="tweet-handle">{tweet.profile.handle}</span>
                    <span class="dot">·</span>
                    <span class="tweet-time">{tweet.time}</span>
                  </div>
                  <button class="more-btn">{@html MoreIcon}</button>
                </div>

                <div class="tweet-text">
                  <p class="zh-text">{tweet.content_zh}</p>
                  <p class="en-text">{tweet.content_en}</p>
                </div>

                <div class="tweet-metrics">
                  <div class="metric reply">
                    <div class="icon-wrapper">{@html ReplyIcon}</div>
                    <span>{tweet.replies}</span>
                  </div>
                  <div class="metric repost">
                    <div class="icon-wrapper">{@html RepostIcon}</div>
                    <span>{tweet.reposts}</span>
                  </div>
                  <div class="metric like">
                    <div class="icon-wrapper">{@html LikeIcon}</div>
                    <span>{tweet.likes}</span>
                  </div>
                  <div class="metric view">
                    <div class="icon-wrapper">{@html ViewIcon}</div>
                    <span>{tweet.views}</span>
                  </div>
                  <div class="metric-group">
                    <div class="metric bookmark">
                      <div class="icon-wrapper">{@html BookmarkIcon}</div>
                    </div>
                    <div class="metric share">
                      <div class="icon-wrapper">{@html ShareIcon}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>

<style>
  /* ── Parallax scaffold ──────────────────────────────────────────────────── */

  /* Reserve scroll space but don't clip anything */
  .tp-spacer {
    position: relative;
    width: 100%;
  }

  /* Sticky viewport window – clips the panels cleanly */
  .tp-sticky {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 100%;
    overflow: hidden;               /* Hard clip — nothing bleeds out */
    background: #000;               /* Solid fallback in case tp-bg lags */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  /* Solid black background – always behind everything */
  .tp-bg {
    position: absolute;
    inset: 0;
    background: #000;
    z-index: 0;
  }

  /* Black fade-out overlay that covers everything at the very end */
  .tp-fade-out {
    position: absolute;
    inset: 0;
    background: #000;
    z-index: 20;          /* Above the panels */
    pointer-events: none;
  }

  /* Both panels sit on top of the background, centred */
  .tp-panel {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #fff;
    will-change: transform, opacity;
    /* NO CSS transition here — JS drives position directly each rAF,
       any CSS transition would fight the JS and cause jank */
    z-index: 1;
    overflow-y: auto;
  }

  /* ── Icons (must be :global because they come from {@html}) ─────────────── */
  :global(.icon-verified) {
    width: 1.1rem;
    height: 1.1rem;
    display: inline-block;
    color: #1d9bf0;
    margin-left: 0.2rem;
    vertical-align: text-bottom;
    flex-shrink: 0;
  }

  :global(.icon-metric) {
    width: 1.1rem;
    height: 1.1rem;
    fill: currentColor;
    display: block;
  }

  /* ── Panel 1: Profiles ─────────────────────────────────────────────────── */
  .profiles-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: center;
    max-width: 1200px;
    width: 100%;
  }

  .profile-card {
    flex: 1 1 300px;
    max-width: 360px;
    background: #16181c;
    border: 1px solid #2f3336;
    border-radius: 1rem;
    overflow: hidden;
    transition: background-color 0.2s;
  }

  .profile-card:hover { background: #1e2028; }

  .banner {
    height: 120px;
    width: 100%;
    background: #333;
  }

  .banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .profile-content { padding: 0 1rem 1rem; }

  .avatar-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: -2.75rem;
    margin-bottom: 0.5rem;
  }

  .avatar-wrapper {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 3px solid #16181c;
    background: #333;
    overflow: hidden;
  }

  .avatar-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .actions {
    margin-top: 3rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .action-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid #536471;
    background: transparent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .action-btn:hover { background: rgba(255,255,255,.1); }

  .follow-btn {
    padding: 0 1rem;
    height: 34px;
    font-weight: 700;
    font-size: 14px;
    color: #0f1419;
    background: #eff3f4;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
  }
  .follow-btn:hover { background: #d7dbdc; }

  .user-info { margin-bottom: 0.5rem; }

  .user-info h2 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.1rem;
  }

  .handle { color: #71767b; font-size: 14px; margin: 0; }

  .bio { font-size: 14px; line-height: 1.3; margin-bottom: 0.6rem; }

  .stats { display: flex; gap: 1rem; font-size: 13px; }
  .stat { cursor: pointer; }
  .stat:hover { text-decoration: underline; }
  .stat-num { font-weight: 700; color: #fff; }
  .stat-label { color: #71767b; }

  /* ── Panel 2: Tweets ───────────────────────────────────────────────────── */
  .tweets-panel { align-items: flex-start; padding-top: 2rem; }

  .tweets-wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    max-width: 1200px;
    width: 100%;
    padding-bottom: 2rem;
  }

  .tweet-card {
    background: #16181c;
    border: 1px solid #2f3336;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 8px 24px rgba(0,0,0,.6);
    transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s;
    width: calc(100% - 1rem);
    max-width: 420px;
  }

  /* Staggered scattered layout */
  @media (min-width: 700px) {
    .tweet-card { width: calc(50% - 0.75rem); }
    .tweet-card:nth-child(even) { transform: translateY(3rem); }
  }

  @media (min-width: 1024px) {
    .tweet-card { width: calc(33.333% - 1rem); }
    .tweet-card:nth-child(3n+1) { transform: translateY(0); }
    .tweet-card:nth-child(3n+2) { transform: translateY(5rem); }
    .tweet-card:nth-child(3n+0) { transform: translateY(2.5rem); }
  }

  .tweet-card:hover {
    background: #1e2028;
    box-shadow: 0 16px 40px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.08);
    z-index: 5;
    position: relative;
  }

  /* ── Tweet internals ───────────────────────────────────────────────────── */
  .tweet-layout { display: flex; gap: 0.6rem; }

  .tweet-avatar { width: 38px; height: 38px; flex-shrink: 0; }
  .tweet-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

  .tweet-content { flex: 1; min-width: 0; }

  .tweet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }

  .tweet-meta {
    display: flex;
    align-items: center;
    font-size: 13px;
    overflow: hidden;
    flex-wrap: wrap;
    gap: 0.15rem;
  }

  .tweet-name { font-weight: 700; cursor: pointer; white-space: nowrap; }
  .tweet-name:hover { text-decoration: underline; }

  .tweet-handle, .dot, .tweet-time { color: #71767b; white-space: nowrap; }

  .more-btn {
    background: transparent;
    border: none;
    color: #71767b;
    cursor: pointer;
    padding: 0;
    display: flex;
    flex-shrink: 0;
  }
  .more-btn:hover { color: #1d9bf0; }

  .tweet-text { font-size: 14px; line-height: 1.4; margin-bottom: 0.6rem; }
  .zh-text { margin: 0 0 0.4rem; }
  .en-text {
    margin: 0;
    padding-top: 0.4rem;
    border-top: 1px solid #2f3336;
    color: #8b98a5;
    font-style: italic;
    font-size: 13px;
  }

  .tweet-metrics {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #71767b;
    font-size: 12px;
    margin-top: 0.4rem;
  }

  .metric {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    cursor: pointer;
    transition: color 0.15s;
  }

  .icon-wrapper {
    padding: 0.3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s;
  }

  .metric.reply:hover  { color: #1d9bf0; }
  .metric.reply:hover  .icon-wrapper { background: rgba(29,155,240,.1); }
  .metric.repost:hover { color: #00ba7c; }
  .metric.repost:hover .icon-wrapper { background: rgba(0,186,124,.1); }
  .metric.like:hover   { color: #f91880; }
  .metric.like:hover   .icon-wrapper { background: rgba(249,24,128,.1); }
  .metric.view:hover   { color: #1d9bf0; }
  .metric.view:hover   .icon-wrapper { background: rgba(29,155,240,.1); }
  .metric.bookmark:hover, .metric.share:hover { color: #1d9bf0; }
  .metric.bookmark:hover .icon-wrapper, .metric.share:hover .icon-wrapper { background: rgba(29,155,240,.1); }

  .metric-group { display: flex; gap: 0.25rem; }
</style>

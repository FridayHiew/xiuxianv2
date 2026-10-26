/* ============================================================
   ui/status.js - 顶部精简状态条与底部水墨六大圆章导航
   ============================================================ */

function updateProfileIcon() {
  if (!S) return;
  const el = document.getElementById("profileIcon");
  if (el) el.textContent = S.name ? S.name.slice(0, 1) : "道";
}

function renderStatus() {
  if (!S) return;
  const playerInfo = getPlayerRealmInfo();
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : { lvl: 0, exp: 0, proficiency: 0 };

  let realmShort = "凡胎肉体";
  let expPct = 0;
  if (playerInfo.realm === 0) {
    realmShort = "凡胎肉体";
    expPct = Math.min(100, Math.floor(prog.proficiency || 0));
  } else {
    realmShort = `${REALMS[playerInfo.realm].name}${subName(playerInfo.lvl)}${playerInfo.lvl}重`;
    const curLevelData = art && art.levels ? art.levels.find(l => l.lvl === prog.lvl) : null;
    const need = curLevelData && curLevelData.expNeed ? curLevelData.expNeed : 100;
    expPct = Math.min(100, Math.floor(((prog.exp || 0) / need) * 100));
  }

  const sectName = S.sect ? (SECTS.find(s => s.id === S.sect)?.name || "无名宗") : "散修";
  const rank = S.flags.rank || "杂务";
  const artName = art ? art.name : "未修心法";
  const di = getDateInfo();
  const fest = getFestival();
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));

  const subEl = document.getElementById("topHeaderSub");
  if (subEl) {
    subEl.textContent = `${S.name} · ${sectName} (${rank})`;
  }

  const el = document.getElementById("statusBar");
  if (!el) return;

  el.innerHTML = `
    <div class="om-top-hud">
      <div class="om-hud-realm" onclick="gotoCultivate()" title="点击进入打坐吐纳">
        <div class="om-realm-dot">☯</div>
        <div class="om-realm-text">
          <div class="om-realm-title">${realmShort} <span class="om-realm-pct">${expPct}%</span></div>
          <div class="om-realm-sub">${artName}</div>
        </div>
      </div>

      <div class="om-hud-currencies">
        <div class="om-cur-pill" title="修真灵石">
          <span class="om-cur-ico">💎</span>
          <span class="om-cur-val">${fmt(S.stone || 0)}</span>
        </div>
        <div class="om-cur-pill" title="凡俗铜钱">
          <span class="om-cur-ico">🪙</span>
          <span class="om-cur-val">${fmt(S.money || 0)}</span>
        </div>
        <div class="om-cur-pill" title="宗门功绩贡献">
          <span class="om-cur-ico">🎖️</span>
          <span class="om-cur-val">${fmt(S.contrib || 0)}</span>
        </div>
      </div>

      <div class="om-hud-time" onclick="switchTab('day')" title="点击前往日常事务">
        <div class="om-time-year">道历${di.year}年 · ${di.monthName}${di.day}日</div>
        <div class="om-time-ap">${HOURS[S.hour] || '上午'} · 行动 <b>${remain}</b>/${ACTIONS_PER_SLOT}</div>
      </div>
    </div>
    ${fest ? `
      <div class="om-festival-strip">
        <span class="tag festival-tag">${fest.name}</span>
        <span>今日吉相：${fest.bonus}</span>
      </div>
    ` : ''}
  `;
}

const SEAL_NAV_ITEMS = [
  { id: "profile",      seal: "人物" },
  { id: "adventureMap", seal: "历练" },
  { id: "day",          seal: "日常" },
  { id: "sect",         seal: "宗门" },
  { id: "cave",         seal: "洞府" },
  { id: "bag",          seal: "行囊" },
];

function renderTabs() {
  const tabsEl = document.getElementById("tabs");
  if (!tabsEl || !S) return;

  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const hasPendingSecret = !!(S.flags && S.flags.pendingSecretRealm);
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : null;
  let canBreakNow = false;
  if (art && prog) {
    if (prog.lvl === 0 && prog.proficiency >= 100) canBreakNow = true;
    else if (prog.lvl > 0 && prog.lvl < prog.maxLearn) {
      const ld = art.levels ? art.levels.find(l => l.lvl === prog.lvl) : null;
      if (ld && prog.exp >= ld.expNeed) canBreakNow = true;
    }
  }

  tabsEl.innerHTML = SEAL_NAV_ITEMS.map(item => {
    const isActive = currentTab === item.id ||
      (item.id === "cave" && currentTab === "cultivatePage") ||
      (item.id === "day" && (currentTab === "story" || currentTab === "social"));

    let showDot = false;
    if (item.id === "day" && remain > 0) showDot = true;
    if (item.id === "adventureMap" && hasPendingSecret) showDot = true;
    if (item.id === "cave" && canBreakNow) showDot = true;

    return `
      <button type="button" class="seal-nav-btn ${isActive ? 'active' : ''}" onclick="switchTab('${item.id}')">
        <span class="seal-nav-ring">
          <span class="seal-nav-text">${item.seal}</span>
          ${showDot ? '<span class="seal-nav-dot"></span>' : ''}
        </span>
      </button>
    `;
  }).join("");
}

function switchTab(id) {
  const mainHomeTabs = ["profile", "adventureMap", "day", "sect", "cave", "bag"];
  if (mainHomeTabs.includes(currentTab) && !mainHomeTabs.includes(id)) {
    lastMainTab = currentTab;
  } else if (mainHomeTabs.includes(id)) {
    lastMainTab = id;
  }
  currentTab = id;
  if (id === "sect") sectSubPanel = null;
  if (id === "cave") caveSubPanel = null;
  if (id === "day") daySubPanel = null;
  render();
}

function isInFullScreenDetailMode() {
  const profileMask = document.getElementById("profileMask");
  const logMask = document.getElementById("logMask");
  const profileOpen = !!(profileMask && profileMask.classList.contains("show"));
  const logOpen = !!(logMask && logMask.classList.contains("show"));
  if (profileOpen || logOpen) return true;
  if (currentTab === "sect" && sectSubPanel) return true;
  if (currentTab === "cave" && caveSubPanel) return true;
  if (currentTab === "cultivatePage" || currentTab === "story" || currentTab === "social") return true;
  return false;
}

function syncFullScreenDetailChrome() {
  const isFs = isInFullScreenDetailMode();
  const appEl = document.getElementById("app");
  if (appEl) appEl.classList.toggle("fullscreen-detail-mode", isFs);
  document.body.classList.toggle("fullscreen-detail-active", isFs);
}

function returnFromDetailPage() {
  const profileMask = document.getElementById("profileMask");
  if (profileMask && profileMask.classList.contains("show")) {
    closeProfile();
    return;
  }
  if (currentTab === "sect" && sectSubPanel) {
    closeSectSubPanel();
    return;
  }
  if (currentTab === "cave" && caveSubPanel) {
    closeCaveSubPanel();
    return;
  }
  const target = (typeof lastMainTab === "string" && ["profile", "adventureMap", "day", "sect", "cave", "bag"].includes(lastMainTab))
    ? lastMainTab
    : "cave";
  switchTab(target);
}

/* 参照上传截图：全屏详情页顶部紧凑状态资财条 + 顶部石刻/宣纸分类切换栏 */
function renderFullScreenTopBar(tabsHtml, fallbackTitle) {
  if (!S) return "";
  const playerInfo = getPlayerRealmInfo();
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : { lvl: 0, exp: 0, proficiency: 0 };

  let realmShort = "凡胎肉体";
  let expPct = 0;
  if (playerInfo.realm === 0) {
    realmShort = "凡胎肉体";
    expPct = Math.min(100, Math.floor(prog.proficiency || 0));
  } else {
    realmShort = `${REALMS[playerInfo.realm].name}${subName(playerInfo.lvl)}${playerInfo.lvl}重`;
    const curLevelData = art && art.levels ? art.levels.find(l => l.lvl === prog.lvl) : null;
    const need = curLevelData && curLevelData.expNeed ? curLevelData.expNeed : 100;
    expPct = Math.min(100, Math.floor(((prog.exp || 0) / need) * 100));
  }

  return `
    <div class="fs-detail-top-header">
      <div class="fs-top-resource-strip">
        <div class="fs-realm-badge">
          <span class="fs-realm-name">${realmShort}</span>
          <span class="fs-realm-pct">· ${expPct}%</span>
        </div>
        <div class="fs-resource-pills">
          <span class="fs-res-pill" title="修真灵石"><em>💎</em><b>${fmt(S.stone || 0)}</b></span>
          <span class="fs-res-pill" title="凡俗铜钱"><em>🪙</em><b>${fmt(S.money || 0)}</b></span>
          <span class="fs-res-pill" title="宗门贡献"><em>🎖️</em><b>${fmt(S.contrib || 0)}</b></span>
        </div>
      </div>
      <div class="fs-top-tab-banner">
        ${tabsHtml || `<div class="fs-banner-single-title">${fallbackTitle || "详情"}</div>`}
      </div>
    </div>
  `;
}

/* 参照上传截图：全屏详情页底部云雾渐变栏 + 左下角水墨笔触圆形【返回】印章按钮 */
function renderFullScreenBottomBar(returnOnClick, centerActionHtml) {
  const fnCall = returnOnClick || "returnFromDetailPage()";
  return `
    <div class="fs-detail-bottom-bar">
      <button type="button" class="ink-return-seal-btn" onclick="${fnCall}" title="返回主页">
        <span class="ink-return-seal-ring">
          <span class="ink-return-seal-txt">返回</span>
        </span>
      </button>
      <div class="fs-bottom-center-slot">
        ${centerActionHtml || ""}
      </div>
      <div class="fs-bottom-right-spacer"></div>
    </div>
  `;
}
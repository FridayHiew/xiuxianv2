/* ============================================================
   ui/sect.js - 宗门水墨山门全景、各殿堂极简列表与九州历练地图
   ============================================================ */

function openSectSubPanel(tabName) {
  const rank = S.flags.rank || "杂务";
  const isMennei = RANKS.indexOf(rank) >= 2;

  if ((tabName === "藏经阁" || tabName === "丹方阁" || tabName === "坊市") && !isMennei) {
    showModal("🔒 宗门禁制", `
      <p>【${tabName}】乃内门重地，需晋升为<b>【门内弟子】</b>后方可入内参学兑换。</p>
      <p class="small">（你可先在【宗门大殿】查看晋升要求，或在【传功殿】【装备铺】【杂役铺】兑换外门所需。）</p>
    `, [{ label: "知晓了", fn: closeModal }]);
    return;
  }

  sectSubPanel = tabName;
  currentSectTab = tabName;
  render();
}

function closeSectSubPanel() {
  sectSubPanel = null;
  render();
}

function openSectRankBoard() {
  const rank = S.flags.rank || "杂务";
  if (rank === "杂务") {
    showModal("⚔️ 宗门战榜", `<p>杂务弟子尚未列入正式战榜，晋升【门外弟子】后即可角逐门外战榜！</p>`, [{ label: "好", fn: closeModal }]);
    return;
  }
  const boardTab = (rank === "门内" || rank === "真传") ? "门内战榜" : "门外战榜";
  openSectSubPanel(boardTab);
}

function renderSect() {
  if (!S.sect) return `<div class="subpanel-drawer"><h3>宗门</h3><p class="small">尚未拜入宗门。</p></div>`;
  const sect = SECTS.find(s => s.id === S.sect);
  const rank = S.flags.rank || "杂务";
  const isMennei = RANKS.indexOf(rank) >= 2;

  /* 如果已点开某个殿堂，渲染全屏宣纸详情界面 + 顶部石刻/宣纸分类切换栏 + 左下角【返回】圆章 */
  if (sectSubPanel) {
    const hallSeals = [
      { id: "简介",     name: "大殿", locked: false },
      { id: "传功殿",   name: "传功", locked: false },
      { id: "宗门事务", name: "事务", locked: false },
      { id: "杂役铺",   name: "百货", locked: false },
      { id: "装备铺",   name: "装备", locked: false },
      { id: "藏经阁",   name: "丹阁", locked: !isMennei },
      ...(isMennei ? [
        { id: "丹方阁", name: "丹方", locked: false },
        { id: "坊市",   name: "市集", locked: false },
      ] : []),
    ];
    const tabsHtml = `
      <div class="fs-rect-tabs">
        ${hallSeals.map(h => `
          <button type="button"
                  class="fs-rect-tab ${sectSubPanel === h.id ? 'active' : ''} ${h.locked ? 'locked' : ''}"
                  onclick="openSectSubPanel('${h.id}')"
                  title="${h.name}">
            ${h.name}
          </button>
        `).join("")}
      </div>
    `;

    let bodyHtml = "";
    if (sectSubPanel === "简介") bodyHtml = renderSectInfo(sect, rank);
    else if (sectSubPanel === "宗门事务") bodyHtml = renderSectTasks(rank);
    else if (sectSubPanel === "杂役铺") bodyHtml = renderShop();
    else if (sectSubPanel === "传功殿") bodyHtml = renderChuanGongDian(sect);
    else if (sectSubPanel === "藏经阁") bodyHtml = renderLibrary();
    else if (sectSubPanel === "丹方阁") bodyHtml = renderRecipeShop();
    else if (sectSubPanel === "历练") bodyHtml = renderAdventureZoneList();
    else if (sectSubPanel === "秘境") bodyHtml = renderSecretRealmList();
    else if (sectSubPanel === "装备铺") bodyHtml = renderSectEquipShop(sect);
    else if (sectSubPanel === "门外战榜") bodyHtml = renderRankBoard("menwai");
    else if (sectSubPanel === "门内战榜") bodyHtml = renderRankBoard("mennei");
    else if (sectSubPanel === "坊市") bodyHtml = renderMarket();
    else bodyHtml = renderSectInfo(sect, rank);

    let centerAction = "";
    if (sectSubPanel === "杂役铺") {
      const cur = getCurrency();
      centerAction = `<button type="button" class="fs-bottom-action-btn" onclick="refreshShopPaid()" ${cur < SHOP_REFRESH_COST ? "disabled" : ""}>进货 (${SHOP_REFRESH_COST}${currencyName()})</button>`;
    } else if (sectSubPanel === "简介") {
      const nextRank = RANKS[RANKS.indexOf(rank) + 1];
      const canUp = nextRank ? canPromoteTo(nextRank) : false;
      if (nextRank && canUp) {
        centerAction = `<button type="button" class="fs-bottom-action-btn" onclick="tryPromote()">申请晋升【${nextRank}】</button>`;
      }
    }

    return `
      <div class="fs-detail-page">
        ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, `${sect.name} · ${sectSubPanel}`) : tabsHtml}
        <div class="fs-detail-scroll-body">
          ${bodyHtml}
        </div>
        ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("closeSectSubPanel()", centerAction) : ""}
      </div>
    `;
  }

  /* 全景水墨卷轴宗门山门视图 */
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const canPromote = nextRank ? canPromoteTo(nextRank) : false;
  const nextReq = nextRank ? RANK_REQ[nextRank] : null;
  const masterName = (S.master && S.npcMap && S.npcMap[S.master]) ? S.npcMap[S.master].name : "暂未拜师";
  const peakName = S.peak ? (PEAKS.find(p => p.id === S.peak)?.name || "主峰") : "外山杂役院";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const isWeekend = (S.weekday === 0 || S.weekday === 6);
  const dq = S.dailyQuest;
  const dqDone = dq ? dq.done >= dq.amount : true;
  const activeTasks = (S.flags && S.flags.activeTasks) || [];

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻悬浮宗门题跋与辅助圆章 HUD -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">${sect.camp}</span>
            ${sect.name}
          </div>
          <div class="plaque-sub">身份：<b>${rank}弟子</b> · 贡献：<b>${fmt(S.contrib)}</b> · 行动 <b>${remain}/${ACTIONS_PER_SLOT}</b></div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal ${canPromote ? 'glow' : ''}" onclick="openSectSubPanel('简介')" title="身份晋升">
            <span>晋升</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="openSectSubPanel('杂役铺')" title="杂役百货">
            <span>百货</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="openSectRankBoard()" title="同门战榜">
            <span>战榜</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="showRankHelp()" title="宗门门规">
            <span>门规</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的宽幅宗门群峰水墨长卷 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="left">
        <div class="ink-scene-canvas sect-panorama ink-panorama-world">
          <img class="ink-scene-bg" src="./src/assets/images/sect_mountain_gate_1792114544883.jpg" alt="${sect.name}水墨山门" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">${sect.name}</div>

          <!-- 左翼西峰圆章：今日杂务/周末传功、山门巡弋、演武百艺 -->
          ${isWeekend ? `
            <button type="button" class="ink-seal-node pos-tl ${remain > 0 && S.hour !== 2 ? 'glow-node' : ''}" onclick="openWeekendLectureModal()">
              <span class="node-char">
                讲
                <em class="seal-red-stamp">周末</em>
              </span>
              <span class="node-caption">宗门传功</span>
              <span class="node-sub-hint">长老法筵传道</span>
            </button>
          ` : `
            <button type="button" class="ink-seal-node pos-tl ${!dqDone && S.hour !== 2 && remain > 0 ? 'glow-node' : ''}" onclick="openSectChoreAndTaskModal()">
              <span class="node-char">
                务
                <em class="seal-red-stamp">${!dqDone ? `${dq.done}/${dq.amount}` : (activeTasks.length ? `悬赏${activeTasks.length}` : '差事')}</em>
              </span>
              <span class="node-caption">${!dqDone ? dq.chore.name : '宗门杂务'}</span>
              <span class="node-sub-hint">指派差事与悬赏</span>
            </button>
          `}

          <button type="button" class="ink-seal-node pos-ml" onclick="openMountainPatrolModal()">
            <span class="node-char">
              巡
              <em class="seal-red-stamp">巡山</em>
            </span>
            <span class="node-caption">山门巡弋</span>
            <span class="node-sub-hint">山门防务巡查</span>
          </button>

          <button type="button" class="ink-seal-node pos-bl" onclick="openDailyPracticeModal()">
            <span class="node-char">
              武
              <em class="seal-red-stamp">百艺</em>
            </span>
            <span class="node-caption">演武百艺</span>
            <span class="node-sub-hint">同门切磋与研习</span>
          </button>

          <!-- 中央主峰：宗门大殿 + 道统画心 + 万宝坊市/杂役百货 -->
          <button type="button" class="ink-seal-node pos-center-top ${canPromote ? 'glow-node' : ''}" onclick="openSectSubPanel('简介')">
            <span class="node-char">
              殿
              <em class="seal-red-stamp">${canPromote ? '可升' : rank}</em>
            </span>
            <span class="node-caption">宗门大殿</span>
            <span class="node-sub-hint">道统与晋升</span>
          </button>

          <div class="sect-center-scroll-card" onclick="openSectSubPanel('简介')" title="点击进入宗门大殿查看道统与晋升">
            <div class="scsc-header">
              <span class="scsc-peak">${peakName}</span>
              <span class="scsc-dot">·</span>
              <span class="scsc-art">镇派《${sect.art}》</span>
            </div>
            <div class="scsc-body">
              <div class="scsc-row"><span>师承</span><b>${masterName}</b></div>
              <div class="scsc-row"><span>专精</span><b>${sect.specialty}</b></div>
            </div>
            <div class="scsc-footer ${canPromote ? 'ready' : ''}">
              ${nextRank
                ? (canPromote ? `✨ 已满足【${nextRank}】晋升条件，点击晋升` : `下阶【${nextRank}】：${nextReq ? nextReq.desc : ''}`)
                : `👑 已臻本门最高【真传弟子】之位`}
            </div>
          </div>

          ${isMennei ? `
            <button type="button" class="ink-seal-node pos-center-bottom" onclick="openSectSubPanel('坊市')">
              <span class="node-char">
                市
                <em class="seal-red-stamp">拍卖</em>
              </span>
              <span class="node-caption">万宝坊市</span>
              <span class="node-sub-hint">奇珍异宝竞拍</span>
            </button>
          ` : `
            <button type="button" class="ink-seal-node pos-center-bottom" onclick="openSectSubPanel('杂役铺')">
              <span class="node-char">
                杂
                <em class="seal-red-stamp">百货</em>
              </span>
              <span class="node-caption">杂役百货</span>
              <span class="node-sub-hint">日常器物采买</span>
            </button>
          `}

          <!-- 右翼东峰圆章：传功大殿、藏经丹阁、神兵利器 -->
          <button type="button" class="ink-seal-node pos-tr" onclick="openSectSubPanel('传功殿')">
            <span class="node-char">
              传
              <em class="seal-red-stamp">功法</em>
            </span>
            <span class="node-caption">传功大殿</span>
            <span class="node-sub-hint">心法法术参学</span>
          </button>

          <button type="button" class="ink-seal-node pos-mr ${!isMennei ? 'locked-node' : ''}" onclick="openSectSubPanel('藏经阁')">
            <span class="node-char">
              藏
              <em class="seal-red-stamp">${isMennei ? '丹经' : '内门'}</em>
            </span>
            <span class="node-caption">藏经丹阁</span>
            <span class="node-sub-hint">灵丹与丹方参悟</span>
          </button>

          <button type="button" class="ink-seal-node pos-br" onclick="openSectSubPanel('装备铺')">
            <span class="node-char">
              器
              <em class="seal-red-stamp">法器</em>
            </span>
            <span class="node-caption">神兵利器</span>
            <span class="node-sub-hint">护身法器兑换</span>
          </button>
        </div>
      </div>

      <!-- 底部横向长卷导览罗盘 -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn active" data-pos="left" onclick="panPanorama('left')">◀ 西峰·演武差事</button>
        <button type="button" class="pano-compass-btn" data-pos="center" onclick="panPanorama('center')">🏯 主峰·大殿</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">东峰·传功丹器 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}

function renderSectInfo(sect, rank) {
  let html = `<h4>宗门道统</h4>`;
  html += `<div class="card">
    <b>${sect.name}</b> <span class="tag">Lv.${sect.level}</span>
    <div class="small">道统特色：${sect.specialty}　镇派心法：${sect.art}</div>
    <div class="small">${sect.desc}</div>
  </div>`;
  html += `<h4>我的身份与恩师</h4>`;
  html += `<div class="card">
    <div class="row"><span>当前身份</span><b>${rank}</b></div>
    <div class="row"><span>宗门贡献</span><b>${S.contrib}</b></div>
    ${S.peak ? `<div class="row"><span>所在灵峰</span><b>${PEAKS.find(p => p.id === S.peak)?.name || '主峰'}</b></div>` : ""}
    ${S.master && S.npcMap[S.master] ? `<div class="row"><span>传道师尊</span><b>${S.npcMap[S.master].name}</b></div>` : ""}
  </div>`;
  html += `<h4>身份晋升</h4>`;
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  if (nextRank) {
    const req = RANK_REQ[nextRank];
    const canUp = canPromoteTo(nextRank);
    html += `<div class="card">
      <div class="row"><span>下一身份</span><b>${nextRank}弟子</b></div>
      <div class="small" style="margin:4px 0;">晋升条件：${req.desc}</div>
      <button class="primary block" onclick="tryPromote()" ${canUp ? "" : "disabled"}>
        ${canUp ? `✨ 立即申请晋升【${nextRank}】` : `尚未满足晋升条件`}
      </button>
    </div>`;
  } else {
    html += `<p class="small">你已贵为本门最高真传弟子。</p>`;
  }
  return html;
}

function renderSectTasks(rank) {
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const isWeekend = (S.weekday === 0 || S.weekday === 6);
  const dq = S.dailyQuest;
  const dqDone = dq ? dq.done >= dq.amount : true;
  const activeTasks = (S.flags && S.flags.activeTasks) || [];

  let html = `<h4>宗门差事、巡山与演武（剩余行动：${remain}/${ACTIONS_PER_SLOT}）</h4>`;
  html += `
    <div class="card" style="margin-bottom:12px;">
      <div class="row" style="margin-bottom:8px;">
        <span>${isWeekend ? '📖 周末宗门传功法筵' : (dq ? `🧹 今日指派：${dq.chore.name}（${dq.done}/${dq.amount}）` : '🧹 今日指派杂务已毕')}</span>
        ${isWeekend
          ? `<button class="primary small" onclick="openWeekendLectureModal()">前往听讲</button>`
          : `<button class="${!dqDone ? 'primary ' : ''}small" onclick="onDayChoreNodeClick()">${!dqDone ? '执行指派' : '自由劳作'}</button>`
        }
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        <button class="small" onclick="openChoreSelector()">🪓 自由打杂</button>
        ${rank !== "杂务" ? `<button class="small" onclick="openTaskSelector()">📋 宗门悬赏${activeTasks.length ? '(' + activeTasks.length + ')' : ''}</button>` : ""}
        <button class="small" onclick="openMountainPatrolModal()">🛡️ 山门巡弋</button>
        <button class="small" onclick="openDailyPracticeModal()">⚔️ 演武百艺</button>
      </div>
    </div>
  `;

  html += `<h4>宗门劳作与事务熟练度</h4>`;
  const chores = rank === "杂务" ? CHORES_FAN : rank === "门外" ? CHORES_MENWAI : CHORES_MENNEI;
  html += `<div class="parchment-list-wrap">`;
  chores.forEach(c => {
    const pct = (S.choreSkill[c.id] || 0).toFixed(1);
    html += `
      <div class="parchment-item-row">
        <div class="p-row-left">
          <div class="p-row-icon">📜</div>
          <span class="p-row-name tier-green">${c.name}</span>
        </div>
        <span class="p-row-count">熟练 ${pct}%</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

/* ============================================================
   杂役铺 (极简名字行 + 点击弹窗购买)
   ============================================================ */

function getShopItemCategoryName(it) {
  if (!it) return "器物";
  const catMap = { A: "工具", B: "杂货", C: "闲趣", D: "补给" };
  if (it.cat && catMap[it.cat]) return catMap[it.cat];
  if (it.hobby) return "闲趣";
  if (it.chore) return "工具";
  if (it.cat && ["A", "B", "C", "D"].includes(it.cat)) return "器物";
  return it.cat || "器物";
}

function renderShop() {
  if (currentShopDay !== S.day) refreshShop();
  const cur = getCurrency();

  let html = `<div class="parchment-sec-header">杂役百货</div>`;
  html += `<div class="parchment-list-wrap">`;
  currentShopStock.forEach(itemId => {
    const it = ITEMS[itemId];
    if (!it) return;
    const owned = !!S.tools[itemId];
    const canBuy = !owned && cur >= it.price;
    const catLabel = getShopItemCategoryName(it);
    html += `
      <div class="parchment-item-row" onclick="openShopItemModal('${itemId}')">
        <div class="p-row-left">
          <div class="p-row-icon">🧰<span class="p-icon-qty">1</span></div>
          <span class="p-row-name tier-green">${it.name}</span>
          <span class="p-row-badge">${catLabel}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">🪙 ${it.price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyShopItem('${itemId}')" ${canBuy ? "" : "disabled"}>
            ${owned ? "已购" : "购买"}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openShopItemModal(itemId) {
  const it = ITEMS[itemId];
  if (!it) return;
  const owned = !!S.tools[itemId];
  const cur = getCurrency();
  const canBuy = !owned && cur >= it.price;
  const catLabel = getShopItemCategoryName(it);

  showModal(`🧰 器物详情 · ${it.name}`, `
    <div class="card">
      <div class="row"><span>器物类别</span><b>${catLabel}类</b></div>
      <div class="row"><span>售价</span><b>${it.price} ${currencyName()}（拥有 ${cur}）</b></div>
    </div>
    <p>${it.desc || "宗门特制实用器物。"}</p>
  `, [
    ...(canBuy ? [{
      label: `立即购买 (${it.price}${currencyName()})`,
      primary: true,
      fn: () => { closeModal(); buyShopItem(itemId); }
    }] : []),
    { label: "关闭", fn: closeModal }
  ]);
}

/* ============================================================
   传功殿 (极简名字行 + 点击弹窗兑换)
   ============================================================ */

function switchCGDTab(t) {
  currentCGDTab = t;
  render();
}

function renderChuanGongDian(sect) {
  if (currentCGDTab === "召唤" || currentCGDTab === "基本功") currentCGDTab = "心法";

  let html = `<div class="om-bag-tabs" style="margin-bottom:8px;">`;
  ["心法", "法术"].forEach(t => {
    html += `<button type="button" class="om-bag-tab ${currentCGDTab === t ? 'active' : ''}"
      onclick="switchCGDTab('${t}')">${t}秘籍</button>`;
  });
  html += `</div>`;

  if (currentCGDTab === "心法") html += renderSectArts(sect);
  else if (currentCGDTab === "法术") html += renderSectSpells(sect);

  return html;
}

function renderSectArts(sect) {
  const playerInfo = getPlayerRealmInfo();
  const playerRealm = playerInfo.realm;

  let html = `<p class="small">点击心法或残卷名字查看功法属性与兑换条件（当前贡献：<b>${S.contrib}</b>）。</p>`;

  const allItems = getShopItems(SECT_ART_SHOP, S.sect);
  const available = filterShopByRealm(allItems, playerRealm);

  html += `<div class="parchment-sec-header">本门可兑心法（上卷）</div>`;
  if (available.length > 0) {
    html += `<div class="parchment-list-wrap">`;
    available.forEach(item => {
      const art = HEART_ARTS.find(a => a.id === item.artId);
      if (!art) return;
      const bookId = item.artId + "_f1";
      const book = ITEMS[bookId];
      if (!book) return;

      const learned = S.heartArts.learned.includes(item.artId);
      html += `
        <div class="parchment-item-row" onclick="openExchangeArtModal('${item.artId}', ${item.price})">
          <div class="p-row-left">
            <div class="p-row-icon">📖</div>
            <span class="p-row-name tier-purple">${book.name}</span>
            <span class="p-row-badge">${art.type}道</span>
          </div>
          <span class="p-row-count">${learned ? '已学会' : `${item.price} 贡献`}</span>
        </div>
      `;
    });
    html += `</div>`;
  } else {
    html += `<p class="empty">当前境界暂无可兑换心法。</p>`;
  }

  html += `<div class="parchment-sec-header" style="margin-top:12px;">后续进阶残卷兑换</div>`;
  let any = false;
  let fragHtml = `<div class="parchment-list-wrap">`;
  S.heartArts.learned.forEach(artId => {
    const art = HEART_ARTS.find(a => a.id === artId);
    if (!art) return;

    const prog = getArtProgress(artId);
    const nextStart = prog.maxLearn + 1;

    const nextFrag = getAllItemsByType("heartFragment")
      .find(f => f.artId === artId && f.start === nextStart);
    if (!nextFrag) return;

    any = true;
    const price = nextFrag.price || 100;

    fragHtml += `
      <div class="parchment-item-row" onclick="openExchangeFragModal('${nextFrag.id}', '${artId}', ${price})">
        <div class="p-row-left">
          <div class="p-row-icon">📜</div>
          <span class="p-row-name tier-gold">${nextFrag.name}</span>
          <span class="p-row-badge">Lv.${nextFrag.start}~${nextFrag.end}</span>
        </div>
        <span class="p-row-count">${price} 贡献</span>
      </div>
    `;
  });
  fragHtml += `</div>`;

  if (!any) {
    html += `<p class="empty">暂无可兑换的后续残卷。</p>`;
  } else {
    html += fragHtml;
  }

  return html;
}

function openExchangeArtModal(artId, price) {
  const art = HEART_ARTS.find(a => a.id === artId);
  const bookId = artId + "_f1";
  const book = ITEMS[bookId];
  if (!art || !book) return;

  const learned = S.heartArts.learned.includes(artId);
  const check = canLearnArt(artId);
  const owned = (S.inventory && S.inventory[bookId]) || 0;
  const canBuy = !learned && check.ok && S.contrib >= price;

  showModal(`📖 心法秘卷 · ${book.name}`, `
    <div class="card">
      <div class="row"><span>心法道统</span><b>${art.name}（${art.type}道）</b></div>
      <div class="row"><span>解锁层级</span><b>Lv.1 ~ Lv.${book.end}</b></div>
      <div class="row"><span>参悟要求</span><b>${moralityReqText(art)} / 最高灵根 ≥ ${art.reqRoot}</b></div>
      <div class="row"><span>兑换价格</span><b>${price} 贡献（当前 ${S.contrib}，已持有 ×${owned}）</b></div>
    </div>
    <p>${art.desc || "上乘宗门吐纳真诀，兑换后可在行囊中参悟习得。"}</p>
    ${!check.ok && !learned ? `<p style="color:#e06c75;">⚠️ 当前无法兑换：${check.reason}</p>` : ""}
  `, [
    ...(canBuy ? [{
      label: `立即兑换 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); exchangeArt(artId, price); }
    }] : []),
    { label: "合上秘卷", fn: closeModal }
  ]);
}

function openExchangeFragModal(fragId, artId, price) {
  const art = HEART_ARTS.find(a => a.id === artId);
  const nextFrag = ITEMS[fragId];
  if (!art || !nextFrag) return;
  const prog = getArtProgress(artId);
  const owned = (S.inventory && S.inventory[fragId]) || 0;
  const canBuy = S.contrib >= price;

  showModal(`📜 进阶残卷 · ${nextFrag.name}`, `
    <div class="card">
      <div class="row"><span>所属心法</span><b>《${art.name}》</b></div>
      <div class="row"><span>拓展上限</span><b>解锁 Lv.${nextFrag.start} ~ Lv.${nextFrag.end}</b></div>
      <div class="row"><span>当前进度</span><b>Lv.${prog.lvl} / 上限 Lv.${prog.maxLearn}</b></div>
      <div class="row"><span>兑换价格</span><b>${price} 贡献（当前 ${S.contrib}，已持有 ×${owned}）</b></div>
    </div>
    <p class="small">兑换后残卷将放入【行囊】，可在行囊中点击参悟突破心法上限。</p>
  `, [
    ...(canBuy ? [{
      label: `立即兑换 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); exchangeFragment(fragId, price); }
    }] : []),
    { label: "关闭", fn: closeModal }
  ]);
}

function renderSectSpells(sect) {
  const playerInfo = getPlayerRealmInfo();
  const playerRealm = playerInfo.realm;

  let html = `<p class="small">点击法术名称查看威力与参悟需求（当前贡献：<b>${S.contrib}</b>）。</p>`;

  const allItems = getShopItems(SECT_SPELL_SHOP, S.sect);
  const available = filterShopByRealm(allItems, playerRealm);

  if (available.length === 0) {
    return html + `<p class="empty">当前境界暂无可兑换的法术。</p>`;
  }

  html += `<div class="parchment-list-wrap">`;
  available.forEach(item => {
    const spell = getSpell(item.spellId);
    if (!spell) return;
    const bookId = "book_" + item.spellId;
    const book = ITEMS[bookId];
    if (!book) return;

    const learned = hasSpell(item.spellId);
    html += `
      <div class="parchment-item-row" onclick="openExchangeSpellModal('${item.spellId}', '${bookId}', ${item.price})">
        <div class="p-row-left">
          <div class="p-row-icon">✨</div>
          <span class="p-row-name tier-blue">${spell.name}</span>
          <span class="p-row-badge">${spell.type}系</span>
        </div>
        <span class="p-row-count">${learned ? '已掌握' : `${item.price} 贡献`}</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openExchangeSpellModal(spellId, bookId, price) {
  const spell = getSpell(spellId);
  const book = ITEMS[bookId];
  if (!spell || !book) return;

  const learned = hasSpell(spellId);
  const check = canLearnSpell(spellId);
  const owned = (S.inventory && S.inventory[bookId]) || 0;
  const canBuy = !learned && check.ok && S.contrib >= price;

  const reqLines = [];
  if (spell.skillReq) {
    for (const k in spell.skillReq) reqLines.push(`${k} Lv.${spell.skillReq[k]}`);
  }
  if (spell.elementReq) {
    for (const k in spell.elementReq) {
      const elName = (ROOT_TYPES.find(r => r.id === k) || {}).name || k;
      reqLines.push(`${elName}属性 ${spell.elementReq[k]}`);
    }
  }
  if (spell.artReq && spell.artReq.length > 0) {
    spell.artReq.forEach(aid => {
      const a = HEART_ARTS.find(x => x.id === aid);
      reqLines.push(`需《${a ? a.name : aid}》`);
    });
  }

  showModal(`✨ 法术秘籍 · ${spell.name}`, `
    <div class="card">
      <div class="row"><span>法术门类</span><b>${spell.type}系神通</b></div>
      <div class="row"><span>灵力消耗 / 威力</span><b>耗蓝 ${spell.cost.mp} / 威力 ×${spell.power}</b></div>
      ${reqLines.length ? `<div class="row"><span>修习条件</span><b>${reqLines.join("、")}</b></div>` : ""}
      <div class="row"><span>兑换价格</span><b>${price} 贡献（当前 ${S.contrib}，已持有 ×${owned}）</b></div>
    </div>
    <p>${spell.desc}</p>
    ${!check.ok && !learned ? `<p style="color:#e06c75;">⚠️ ${check.reason}</p>` : ""}
  `, [
    ...(canBuy ? [{
      label: `立即兑换 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); exchangeSpellBook(bookId, price); }
    }] : []),
    { label: "合上秘籍", fn: closeModal }
  ]);
}

/* ============================================================
   藏经阁 (丹药贡献兑换：极简名字行 + 点击弹窗兑换)
   ============================================================ */

let currentLibraryTab = "pills";

function switchLibraryTab(t) {
  currentLibraryTab = t;
  render();
}

function renderLibrary() {
  const sect = SECTS.find(s => s.id === S.sect) || SECTS[0];
  let html = `<div class="om-bag-tabs" style="margin-bottom:8px;">`;
  html += `<button type="button" class="om-bag-tab ${currentLibraryTab === 'pills' ? 'active' : ''}" onclick="switchLibraryTab('pills')">💊 灵丹宝库</button>`;
  html += `<button type="button" class="om-bag-tab ${currentLibraryTab === 'spells' ? 'active' : ''}" onclick="switchLibraryTab('spells')">✨ 藏经法术</button>`;
  html += `</div>`;

  if (currentLibraryTab === "spells") {
    return html + renderSectSpells(sect);
  }

  html += `<p class="small">点击丹药名字选择品级并用贡献兑换（当前贡献：<b>${S.contrib}</b>）。</p>`;

  const exchangeList = [
    { baseId: "回血丹", maxGrade: 5 },
    { baseId: "回灵丹", maxGrade: 5 },
    { baseId: "解毒丹", maxGrade: 5 },
    { baseId: "聚气丹", maxGrade: 9 },
    { baseId: "破境丹", maxGrade: 7 },
    { baseId: "凝神丹", maxGrade: 7 },
    { baseId: "淬体丹", maxGrade: 9 },
  ];

  html += `<div class="parchment-list-wrap">`;
  exchangeList.forEach(({ baseId, maxGrade }) => {
    const baseItem = (typeof getItem === "function" ? getItem(baseId + "_1") : null) || ITEMS[baseId + "_1"];
    if (!baseItem) return;
    const minCost = Math.floor((baseItem.price || 5) * 2);

    html += `
      <div class="parchment-item-row" onclick="openLibraryPillModal('${baseId}', ${maxGrade})">
        <div class="p-row-left">
          <div class="p-row-icon">💊</div>
          <span class="p-row-name tier-green">${baseId}</span>
          <span class="p-row-badge">1~${maxGrade}品</span>
        </div>
        <span class="p-row-count">${minCost}+ 贡献 ▸</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openLibraryPillModal(baseId, maxGrade) {
  const baseItem = (typeof getItem === "function" ? getItem(baseId + "_1") : null) || ITEMS[baseId + "_1"];
  if (!baseItem) return;

  let rows = `<div class="parchment-list-wrap">`;
  for (let g = 1; g <= maxGrade; g++) {
    const itemId = baseId + "_" + g;
    const item = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
    if (!item) continue;
    const contribCost = Math.floor((item.price || 5) * 2);
    const owned = (S.inventory && S.inventory[itemId]) || 0;
    const canBuy = S.contrib >= contribCost;
    const itemName = (item.name && item.name !== "undefined") ? item.name : baseId;

    rows += `
      <div class="parchment-item-row" onclick="showItemDetailModal('${itemId}')">
        <div class="p-row-left">
          <div class="p-row-icon">💊</div>
          <span class="p-row-name ${g >= 5 ? 'tier-gold' : g >= 3 ? 'tier-blue' : 'tier-green'}">${itemName}（${g}品）</span>
          ${owned > 0 ? `<span class="p-row-badge">有×${owned}</span>` : ''}
        </div>
        <button class="small" onclick="event.stopPropagation(); exchange('${itemId}', ${contribCost}); openLibraryPillModal('${baseId}', ${maxGrade});" ${canBuy ? "" : "disabled"}>
          ${contribCost}贡献
        </button>
      </div>
    `;
  }
  rows += `</div>`;

  showModal(`💊 藏经丹阁 · 兑换【${baseId}】`, `
    <p class="small">${(baseItem.desc || "").replace(/（1 品）$/, "")}（当前贡献：<b>${S.contrib}</b>）</p>
    ${rows}
  `, [{ label: "关闭", fn: closeModal }]);
}

/* ============================================================
   丹方阁 (支持切换【丹方秘卷】与【炼器图谱（金丹及以下）】)
   ============================================================ */

let currentRecipeShopMode = "alchemy"; // "alchemy" | "forge"
let currentForgeRecipeShopRealm = "all"; // "all" | 0 | 1 | 2 | 3

function switchRecipeShopMode(mode) {
  currentRecipeShopMode = mode;
  render();
}

function switchForgeRecipeShopRealm(realmFilter) {
  currentForgeRecipeShopRealm = realmFilter;
  render();
}

function renderRecipeShop() {
  let html = `
    <div class="om-bag-tabs" style="margin-bottom:8px;">
      <button type="button" class="om-bag-tab ${currentRecipeShopMode === 'alchemy' ? 'active' : ''}" onclick="switchRecipeShopMode('alchemy')">💊 丹方秘卷</button>
      <button type="button" class="om-bag-tab ${currentRecipeShopMode === 'forge' ? 'active' : ''}" onclick="switchRecipeShopMode('forge')">⚒️ 炼器图谱</button>
    </div>
  `;

  if (currentRecipeShopMode === "forge") {
    return html + renderSectForgeRecipeExchangeList();
  }

  html += `<p class="small">点击丹方名称查看详情与配方并用贡献解锁（仅授一至二阶丹方，当前贡献：<b>${S.contrib}</b>）。</p>`;

  if (typeof RECIPES === "undefined" || !RECIPES) {
    return html + `<p class="empty">丹方数据未加载。</p>`;
  }

  const availableRecipes = RECIPES.filter(r => (r.tier || 1) <= 2);
  const sorted = [...availableRecipes].sort((a, b) => (a.tier || 1) - (b.tier || 1) || (a.price || 0) - (b.price || 0));

  html += `<div class="parchment-list-wrap">`;
  sorted.forEach(recipe => {
    const known = isRecipeKnown(recipe.id);
    const price = recipe.price || 100;

    html += `
      <div class="parchment-item-row" onclick="openRecipeShopDetailModal('${recipe.id}')">
        <div class="p-row-left">
          <div class="p-row-icon">📜</div>
          <span class="p-row-name ${recipe.tier >= 2 ? 'tier-blue' : 'tier-green'}">${recipe.name}丹方</span>
          <span class="p-row-badge">${recipe.tier || 1}阶</span>
        </div>
        <span class="p-row-count">${known ? '已解锁' : `${price} 贡献`}</span>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

/* 宗门炼器谱兑换列表（严格限制：金丹期 realm <= 3 及以下） */
function renderSectForgeRecipeExchangeList() {
  let html = `<p class="small">宗门器谱阁仅传授<b>【金丹期及以下（1~6品）】</b>炼器图谱，参悟后可在【洞府 > 炼器房】锻造神兵法器（当前贡献：<b>${S.contrib}</b>）。</p>`;

  if (typeof FORGE_RECIPES === "undefined" || !FORGE_RECIPES) {
    return html + `<p class="empty">炼器谱数据未加载。</p>`;
  }

  const realmTabs = [
    { key: "all", label: "全部(金丹及以下)" },
    { key: 0, label: "凡人·1品" },
    { key: 1, label: "炼气·2~3品" },
    { key: 2, label: "筑基·4~5品" },
    { key: 3, label: "金丹·6品" },
  ];

  html += `<div class="om-bag-tabs" style="margin-bottom:8px;">`;
  realmTabs.forEach(t => {
    const active = String(currentForgeRecipeShopRealm) === String(t.key) ? "active" : "";
    const arg = t.key === "all" ? "'all'" : t.key;
    html += `<button type="button" class="om-bag-tab ${active}" onclick="switchForgeRecipeShopRealm(${arg})">${t.label}</button>`;
  });
  html += `</div>`;

  /* 严格过滤：只允许兑换金丹期（realm <= 3 且 grade <= 6）及以下的炼器谱 */
  const allowedRecipes = FORGE_RECIPES.filter(r => {
    if (typeof isForgeRecipeExchangeableInSect === "function") {
      return isForgeRecipeExchangeableInSect(r);
    }
    const rm = r.realm !== undefined ? r.realm : (r.grade <= 1 ? 0 : r.grade <= 3 ? 1 : r.grade <= 5 ? 2 : r.grade === 6 ? 3 : 4);
    return rm <= 3 && (r.grade || 1) <= 6;
  }).filter(r => {
    if (currentForgeRecipeShopRealm === "all") return true;
    const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(r) : (r.realm || 0);
    return rm === Number(currentForgeRecipeShopRealm);
  });

  if (allowedRecipes.length === 0) {
    return html + `<p class="empty">该境界暂无可兑换的炼器谱。</p>`;
  }

  const realmNames = { 0: "凡人阶", 1: "炼气阶", 2: "筑基阶", 3: "金丹阶" };
  html += `<div class="parchment-list-wrap">`;
  allowedRecipes.forEach(recipe => {
    const known = typeof isForgeRecipeKnown === "function" ? isForgeRecipeKnown(recipe.id) : false;
    const price = typeof getForgeRecipeExchangePrice === "function" ? getForgeRecipeExchangePrice(recipe) : (recipe.price || 50);
    const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(recipe) : (recipe.realm || 0);
    const tierNum = recipe.tier || (rm <= 1 ? 1 : rm);
    const slotLabel = EQUIP_SLOT_LABELS[recipe.slot] || SLOT_NAMES[recipe.slot] || recipe.slot;
    const tierCls = recipe.grade >= 6 ? "tier-gold" : recipe.grade >= 4 ? "tier-purple" : recipe.grade >= 2 ? "tier-blue" : "tier-green";
    const canBuy = !known && S.contrib >= price;

    html += `
      <div class="parchment-item-row" onclick="openForgeRecipeShopDetailModal('${recipe.id}')">
        <div class="p-row-left">
          <div class="p-row-icon">⚒️</div>
          <span class="p-row-name ${tierCls}">《${recipe.name}》器谱</span>
          <span class="p-row-badge">${realmNames[rm] || '凡人阶'}·${tierNum}阶${recipe.grade}品·${slotLabel}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">🎖️ ${price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyForgeRecipe('${recipe.id}', ${price})" ${canBuy ? "" : "disabled"}>
            ${known ? "已掌握" : "兑换"}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openForgeRecipeShopDetailModal(recipeId) {
  const recipe = typeof getForgeRecipe === "function" ? getForgeRecipe(recipeId) : null;
  if (!recipe) return;
  const known = typeof isForgeRecipeKnown === "function" ? isForgeRecipeKnown(recipeId) : false;
  const price = typeof getForgeRecipeExchangePrice === "function" ? getForgeRecipeExchangePrice(recipe) : (recipe.price || 50);
  const allowed = typeof isForgeRecipeExchangeableInSect === "function" ? isForgeRecipeExchangeableInSect(recipe) : ((recipe.realm || 0) <= 3 && (recipe.grade || 1) <= 6);
  const canBuy = allowed && !known && S.contrib >= price;
  const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(recipe) : (recipe.realm || 0);
  const realmNames = { 0: "凡人境", 1: "炼气期", 2: "筑基期", 3: "金丹期", 4: "元婴期" };
  const tierNum = recipe.tier || (rm <= 1 ? 1 : rm);
  const slotLabel = EQUIP_SLOT_LABELS[recipe.slot] || SLOT_NAMES[recipe.slot] || recipe.slot;
  const matText = Object.entries(recipe.mats || {})
    .map(([base, cnt]) => `${base}_${recipe.grade}品 ×${cnt}`).join(" + ");

  showModal(`⚒️ 炼器图谱 · 《${recipe.name}》`, `
    <div class="card">
      <div class="row"><span>适用境界</span><b>${realmNames[rm] || "凡人境"}（金丹及以下可兑）</b></div>
      <div class="row"><span>成器品阶</span><b>${tierNum} 阶 · ${recipe.grade} 品（${slotLabel}）</b></div>
      <div class="row"><span>锻造耗材</span><b>${matText} + 灵石×${recipe.spiritStone || 0}</b></div>
      <div class="row"><span>基础成器率</span><b>${((recipe.rate || 0.5) * 100).toFixed(0)}%</b></div>
      <div class="row"><span>兑换所需</span><b>${price} 宗门贡献（当前 ${S.contrib}）</b></div>
    </div>
    <p>${recipe.desc || "宗门秘传百炼器谱，参悟后可在【洞府 > 炼器房】开炉锻造。"}</p>
  `, [
    ...(canBuy ? [{
      label: `立即兑换器谱 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); buyForgeRecipe(recipeId, price); }
    }] : []),
    { label: "合上玉简", fn: closeModal }
  ]);
}

function buyForgeRecipe(recipeId, price) {
  const res = typeof unlockForgeRecipe === "function" ? unlockForgeRecipe(recipeId, price) : { ok: false, reason: "系统未就绪" };
  if (!res.ok) {
    log(`兑换失败：${res.reason}`, "c-bad");
    return;
  }
  save();
  render();
  showActionModal("习得炼器谱", [
    `获得炼器谱：《${res.recipe.name}》（${res.recipe.grade}品）`,
    `消耗：${res.cost} 宗门贡献`,
    `可前往【洞府 > 炼器房】开炉锻造`,
  ]);
}

function openRecipeShopDetailModal(recipeId) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return;
  const known = isRecipeKnown(recipeId);
  const price = recipe.price || 100;
  const canBuy = !known && S.contrib >= price;
  const matText = Object.entries(recipe.mat)
    .map(([base, cnt]) => `${base} ×${cnt}`).join(" + ");

  showModal(`📜 丹方秘卷 · 《${recipe.name}》`, `
    <div class="card">
      <div class="row"><span>丹方品阶</span><b>${recipe.tier || 1} 阶丹方（可炼 1~${recipe.maxGrade || 5}品）</b></div>
      <div class="row"><span>药材配比</span><b>${matText}</b></div>
      <div class="row"><span>基础成丹率</span><b>${(recipe.rate * 100).toFixed(0)}%</b></div>
      <div class="row"><span>兑换所需</span><b>${price} 宗门贡献（当前 ${S.contrib}）</b></div>
    </div>
    <p>${recipe.desc || "宗门秘传灵丹配方，参悟后可在洞府紫府丹房开炉炼制。"}</p>
  `, [
    ...(canBuy ? [{
      label: `立即解锁丹方 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); buyRecipe(recipeId, price); }
    }] : []),
    { label: "合上玉简", fn: closeModal }
  ]);
}

function buyRecipe(recipeId, price) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return;
  if (isRecipeKnown(recipeId)) { log("已解锁该丹方。", "c-bad"); return; }

  const result = unlockRecipe(recipeId, price);
  if (!result.ok) {
    log(`购买失败：${result.reason}`, "c-bad");
    return;
  }

  save(); render();
  showActionModal("解锁丹方", [
    `获得丹方：《${recipe.name}》`,
    `消耗：${price} 贡献`,
    `可在【洞府 > 炼丹房】炼制`,
  ]);
}

/* ============================================================
   【历练】主视图 (水墨江山卷轴 + 五大险地圆形书法印章节点 + 天机秘境圆章)
   ============================================================ */

function renderAdventureMapPage() {
  if (typeof ADVENTURE_ZONES === "undefined") {
    return `<p class="empty">历练地图数据未加载。</p>`;
  }

  const info = getPlayerRealmInfo();
  const realm = info.realm;
  const pPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
  const remainActions = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const pending = S.flags && S.flags.pendingSecretRealm;
  const unlockedB = (typeof SECRET_EVENTS !== "undefined" && SECRET_EVENTS.B)
    ? SECRET_EVENTS.B.filter(e => isSecretEventUnlocked(e.id))
    : [];
  const secretCount = (pending ? 1 : 0) + unlockedB.length;

  /* 对应五大险地：云雾山麓(云)、寒潭幽谷(寒)、丹霞秘境(丹)、沉星古陵(陵)、天渊道窟(渊) */
  const sealChars = ["云", "寒", "丹", "陵", "渊"];

  let sealNodesHtml = ADVENTURE_ZONES.map((zone, idx) => {
    const recPower = typeof calcZoneRecommendedPower === "function" ? calcZoneRecommendedPower(zone) : 0;
    const isUnderRealm = realm < zone.realmMin;
    const isWeak = pPower < recPower || isUnderRealm;
    const isCleared = Boolean(S.flags && S.flags.dungeonsCleared && S.flags.dungeonsCleared[zone.id]);
    const minRealmName = REALMS[zone.realmMin] ? REALMS[zone.realmMin].name : "凡人";
    const sealChar = sealChars[idx] || zone.name.charAt(0);
    const stampText = isCleared ? "已通" : (isWeak ? "凶险" : "适宜");
    const stampCls = isCleared ? "good" : (isWeak ? "bad" : "good");

    return `
      <button type="button"
              class="adv-seal-node ${isWeak ? 'danger' : 'safe'}"
              onclick="openAdventureZoneModal('${zone.id}')"
              title="点击查看【${zone.name}】详情与探索">
        <div class="adv-seal-disc">
          <span class="adv-seal-idx">${idx + 1}</span>
          <span class="adv-seal-char">${sealChar}</span>
          <span class="adv-seal-stamp ${stampCls}">${stampText}</span>
        </div>
        <div class="adv-seal-caption">${zone.name}</div>
        <div class="adv-seal-meta">${minRealmName} · ☯${fmt(recPower)}</div>
      </button>
    `;
  }).join("");

  /* 第 6 枚圆章：天机秘境入口（补齐 3列×2行 山河卷轴） */
  sealNodesHtml += `
    <button type="button"
            class="adv-seal-node ${secretCount > 0 ? 'safe' : ''}"
            onclick="openSecretRealmListModal()"
            title="探索天机秘境与古修遗迹">
      <div class="adv-seal-disc">
        <span class="adv-seal-idx">✦</span>
        <span class="adv-seal-char">秘</span>
        <span class="adv-seal-stamp ${secretCount > 0 ? 'good' : 'bad'}">${secretCount > 0 ? `机缘×${secretCount}` : '寻访'}</span>
      </div>
      <div class="adv-seal-caption">天机秘境</div>
      <div class="adv-seal-meta">${pending ? '限时裂隙开启' : '寻访天机 · 古修秘藏'}</div>
    </button>
  `;

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻历练战力铭牌与【秘境/服丹】圆章入口 -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">历练</span>
            九州万里山河卷
          </div>
          <div class="plaque-sub">战力 <b>☯ ${fmt(pPower)}</b> · 气血 <b>${S.hp}/${typeof totalMaxHp === "function" ? totalMaxHp() : (S.hpMax || 100)}</b> · 行动 <b>${remainActions}/${ACTIONS_PER_SLOT}</b></div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal" onclick="if(typeof openAdvQuickHealModal==='function') openAdvQuickHealModal();" title="服用丹药恢复状态">
            <span>调息</span>
          </button>
          <button type="button" class="ink-mini-seal ${secretCount > 0 ? 'glow' : ''}" onclick="openSecretRealmListModal()" title="天机秘境探索">
            <span>秘境${secretCount > 0 ? `(${secretCount})` : ''}</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的九州山河万里长卷 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="left">
        <div class="ink-scene-canvas adv-map-panorama ink-panorama-world adv-wide-world">
          <img class="ink-scene-bg" src="./src/assets/images/xianxia_bg_banner_1792114543496.jpg" alt="九州水墨历练卷轴" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">九州山河</div>

          <!-- 水墨蜿蜒古道连线 SVG -->
          <svg class="adv-trail-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 140,105 Q 240,245 320,255 T 500,105 T 680,255 T 850,115"
                  fill="none"
                  stroke="rgba(226, 192, 118, 0.38)"
                  stroke-width="3"
                  stroke-dasharray="8 8" />
          </svg>

          <!-- 五大历练险地 + 天机秘境圆形书法印章排布 (3列×2行蜿蜒错落) -->
          <div class="adv-pillars-stage adv-seal-grid">
            ${sealNodesHtml}
          </div>
        </div>
      </div>

      <!-- 底部九州地域导览罗盘 -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn active" data-pos="left" onclick="panPanorama('left')">◀ 初途·云雾寒潭</button>
        <button type="button" class="pano-compass-btn" data-pos="center" onclick="panPanorama('center')">🔥 中途·丹霞古陵</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">天渊·天机秘境 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}

function openAdventureZoneModal(zoneId) {
  if (typeof ADVENTURE_ZONES === "undefined") return;
  const zone = ADVENTURE_ZONES.find(z => z.id === zoneId);
  if (!zone) return;

  const info = getPlayerRealmInfo();
  const pPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
  const recPower = typeof calcZoneRecommendedPower === "function" ? calcZoneRecommendedPower(zone) : 0;
  const isWeak = pPower < recPower || info.realm < zone.realmMin;
  const isCleared = Boolean(S.flags && S.flags.dungeonsCleared && S.flags.dungeonsCleared[zone.id]);
  const realmText = `${REALMS[zone.realmMin].name} ~ ${REALMS[zone.realmMax].name}`;

  /* 汇总各层标题与可掉落物预览 */
  const layerNames = (zone.layers || []).map(l => `第${l.layer}层「${l.title}」`).join(" → ");
  const dropItemIds = new Set();
  (zone.layers || []).forEach(l => {
    (l.storageRewards || []).forEach(sr => {
      if (sr.itemId) dropItemIds.add(sr.itemId);
    });
  });
  const dropNames = Array.from(dropItemIds).map(id => {
    const def = (typeof ITEMS !== "undefined" && ITEMS[id]) ? ITEMS[id] : null;
    return def ? `${def.icon || ""} ${def.name}` : id;
  }).slice(0, 6).join("、");

  showModal(`${zone.icon || '⛰️'} 历练险地 · ${zone.name}`, `
    <div class="card">
      <div class="row"><span>通关状态</span><b style="color:${isCleared ? '#98c379' : '#ffd875'};">${isCleared ? '✅ 已通关（可重复历练）' : '🌟 首通待破（首通享双倍通关奖励）'}</b></div>
      <div class="row"><span>适宜境界</span><b>${realmText}</b></div>
      <div class="row"><span>险地层数</span><b>共 ${zone.layers.length} 层（耗费 ${zone.actionCost} 行动）</b></div>
      <div class="row"><span>推荐战力</span><b style="color:#d8b878;">☯ ${fmt(recPower)}</b></div>
    </div>
    <p class="small" style="margin:6px 0 4px; color:var(--text-main);">${zone.desc}</p>
    <div class="small" style="color:var(--text-dim); line-height:1.5;">
      <div>🗺️ 路线：${layerNames}</div>
      ${dropNames ? `<div>🎁 机缘产出：灵石、修为、${dropNames} 等</div>` : ""}
      <div>💡 提示：练气1重妖兽可尝试【驯】收服为灵宠。</div>
    </div>
  `, [
    {
      label: isWeak ? "⚠️ 涉险前往历练" : "⚔️ 立即进入历练",
      primary: true,
      fn: () => {
        closeModal();
        enterAdventure(zone.id, true);
      }
    },
    { label: "暂缓前往", fn: closeModal }
  ]);
}

function openSecretRealmListModal() {
  const pending = S.flags && S.flags.pendingSecretRealm;
  const btns = [];
  if (!pending && typeof seekSecretRealm === "function") {
    btns.push({
      label: "🧭 寻访天机 (1行动·50灵石)",
      primary: true,
      fn: () => {
        closeModal();
        seekSecretRealm();
      }
    });
  }
  btns.push({ label: "合上玉简", fn: closeModal });
  showModal("📜 天机秘境录", renderSecretRealmList(), btns);
}

function renderAdventureZoneList() {
  return renderAdventureMapPage();
}

/* ============================================================
   秘境（列表）
   ============================================================ */

function renderSecretRealmList() {
  const pPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  let html = `
    <div class="small" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; color:var(--text-dim);">
      <span>每次秘境探索耗 <b>2</b> 行动（剩余 <b>${remain}/${ACTIONS_PER_SLOT}</b>）</span>
      <span>战力 <b style="color:#d8b878;">☯ ${fmt(pPower)}</b></span>
    </div>
  `;

  const pending = S.flags.pendingSecretRealm;
  html += `<div class="parchment-list-wrap">`;

  /* 1. 限时天机秘境（A组） */
  if (pending) {
    const ev = getSecretEventById(pending.id);
    if (ev) {
      const recPower = typeof calcSecretRealmRecommendedPower === "function" ? calcSecretRealmRecommendedPower(ev) : 0;
      const isWeak = pPower < recPower || (ev.realmMin !== undefined && S.realm < ev.realmMin);
      const leftDays = Math.max(1, pending.expireDay - S.day);
      html += `
        <div class="parchment-item-row" onclick="closeModal(); enterSecretRealmById('${ev.id}', {fromPending:true})">
          <div class="p-row-left">
            <div class="p-row-icon">${ev.icon || "🌀"}</div>
            <div>
              <div>
                <span class="p-row-name tier-gold">${ev.name}</span>
                <span class="p-row-badge">${isWeak ? '⚠️凶险' : '适宜'} · 剩${leftDays}天</span>
              </div>
              <div class="small" style="color:var(--text-dim); font-size:11px;">限时天机裂隙 · 荐战力 ☯${fmt(recPower)}</div>
            </div>
          </div>
          <span class="p-row-count" style="color:var(--text-gold);">探索 ▸</span>
        </div>
      `;
    }
  } else {
    html += `
      <div class="parchment-item-row" onclick="closeModal(); if(typeof seekSecretRealm==='function') seekSecretRealm();">
        <div class="p-row-left">
          <div class="p-row-icon">🧭</div>
          <div>
            <div>
              <span class="p-row-name tier-gold">寻访天机 · 推演秘境裂隙</span>
              <span class="p-row-badge">耗1行动 · 50灵石</span>
            </div>
            <div class="small" style="color:var(--text-dim); font-size:11px;">除每月初五自然显化外，可主动布设寻灵盘推演附近秘境</div>
          </div>
        </div>
        <span class="p-row-count" style="color:var(--text-gold);">推演 ▸</span>
      </div>
    `;
  }

  /* 2. 古修遗迹与常驻秘境（B组：展示已解锁与未解锁条件） */
  const allB = (typeof SECRET_EVENTS !== "undefined" && SECRET_EVENTS.B) ? SECRET_EVENTS.B : [];
  allB.forEach(ev => {
    const unlocked = isSecretEventUnlocked(ev.id);
    const isCleared = Boolean(S.flags && S.flags.secretCleared && S.flags.secretCleared[ev.id]);
    const recPower = typeof calcSecretRealmRecommendedPower === "function" ? calcSecretRealmRecommendedPower(ev) : 0;
    const isWeak = pPower < recPower || (ev.realmMin !== undefined && S.realm < ev.realmMin);

    if (unlocked) {
      html += `
        <div class="parchment-item-row" onclick="closeModal(); enterSecretRealmById('${ev.id}')">
          <div class="p-row-left">
            <div class="p-row-icon">${ev.icon || "⛩️"}</div>
            <div>
              <div>
                <span class="p-row-name tier-purple">${ev.name}</span>
                <span class="p-row-badge">${isCleared ? '✅已探' : (isWeak ? '⚠️凶险' : '适宜')}</span>
              </div>
              <div class="small" style="color:var(--text-dim); font-size:11px;">${ev.desc || "古修秘境"} · 荐战力 ☯${fmt(recPower)}</div>
            </div>
          </div>
          <span class="p-row-count">进入 ▸</span>
        </div>
      `;
    } else {
      html += `
        <div class="parchment-item-row" style="opacity:0.62; cursor:default;">
          <div class="p-row-left">
            <div class="p-row-icon">🔒</div>
            <div>
              <div>
                <span class="p-row-name">${ev.name}</span>
                <span class="p-row-badge">未解锁</span>
              </div>
              <div class="small" style="color:var(--text-dim); font-size:11px;">解锁条件：${ev.unlockHint || "满足特定境界或机缘"}</div>
            </div>
          </div>
          <span class="p-row-count" style="color:var(--text-dim);">荐 ☯${fmt(recPower)}</span>
        </div>
      `;
    }
  });

  html += `</div>`;
  return html;
}

/* ============================================================
   装备铺 / 炼器铺 (仅限兑换 1 品武器/法器 + 兑换金丹及以下炼器谱)
   ============================================================ */

let currentEquipShopSubMode = "equip"; // "equip" | "forgeRecipe"

function switchEquipShopSubMode(mode) {
  currentEquipShopSubMode = mode;
  render();
}

const EQUIP_SLOT_LABELS = {
  rightHand: "兵器",
  leftHand:  "左手",
  head:      "头部",
  body:      "衣服",
  shoes:     "鞋子",
  accessory: "玉佩",
  artifact:  "法宝",
};

function renderSectEquipShop(sect) {
  let html = `
    <div class="om-bag-tabs" style="margin-bottom:8px;">
      <button type="button" class="om-bag-tab ${currentEquipShopSubMode === 'equip' ? 'active' : ''}" onclick="switchEquipShopSubMode('equip')">⚔️ 一品武器/法器</button>
      <button type="button" class="om-bag-tab ${currentEquipShopSubMode === 'forgeRecipe' ? 'active' : ''}" onclick="switchEquipShopSubMode('forgeRecipe')">⚒️ 炼器谱兑换</button>
    </div>
  `;

  if (currentEquipShopSubMode === "forgeRecipe") {
    return html + renderSectForgeRecipeExchangeList();
  }

  html += `<p class="small">宗门武库仅提供<b>【1品（1阶·1品）】</b>制式武器与护身法器兑换（当前贡献：<b>${S.contrib}</b>）。2品及以上神兵请切换至【⚒️ 炼器谱兑换】习得图谱后于洞府锻造。</p>`;

  const allItems = getShopItems(SECT_EQUIP_SHOP, S.sect);
  /* 严格过滤：宗门只能兑换 1 品武器/装备 */
  const available = allItems.filter(item => {
    const eq = ITEMS[item.itemId];
    return eq && (eq.grade || 1) === 1;
  });

  html += `<div class="parchment-sec-header">宗门一品武库（1阶·1品）</div>`;
  if (available.length === 0) {
    return html + `<p class="empty">暂无可兑换的一品武器与法器。</p>`;
  }

  html += `<div class="parchment-list-wrap">`;
  available.forEach(item => {
    const eq = ITEMS[item.itemId];
    if (!eq) return;
    const owned = hasItem(item.itemId);
    const canBuy = !owned && S.contrib >= item.price;
    const slotLabel = EQUIP_SLOT_LABELS[eq.slot] || SLOT_NAMES[eq.slot] || eq.slot;
    const tierNum = eq.tier || 1;
    const gradeNum = eq.grade || 1;
    const tierCls = typeof getItemTierColorClass === "function" ? getItemTierColorClass(eq) : "tier-green";

    html += `
      <div class="parchment-item-row" onclick="openSectEquipModal('${item.itemId}', ${item.price})">
        <div class="p-row-left">
          <div class="p-row-icon">${typeof getItemIcon === "function" ? getItemIcon(eq, item.itemId) : (eq.slot === 'body' ? '🥋' : '⚔️')}<span class="p-icon-qty">1</span></div>
          <span class="p-row-name ${tierCls}">${eq.name}</span>
          <span class="p-row-badge">${tierNum}阶·${gradeNum}品·${slotLabel}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">🎖️ ${item.price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyShopEquip('${item.itemId}', ${item.price})" ${canBuy ? "" : "disabled"}>
            ${owned ? "已兑" : "兑换"}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openSectEquipModal(itemId, price) {
  const eq = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
  if (!eq) return;
  const owned = hasItem(itemId);
  const gradeNum = eq.grade || 1;
  const tierNum = eq.tier || 1;
  const canBuy = !owned && gradeNum === 1 && S.contrib >= price;
  const extra = eq.spellBonus ? ` / 法术威力 +${(eq.spellBonus * 100).toFixed(0)}%` : "";
  const equipIcon = typeof getItemIcon === "function" ? getItemIcon(eq, itemId) : (eq.slot === 'body' ? '🥋' : '⚔️');
  const slotLabel = EQUIP_SLOT_LABELS[eq.slot] || SLOT_NAMES[eq.slot] || eq.slot;

  showModal(`${equipIcon} 宗门法器 · ${eq.name}`, `
    <div class="card">
      <div class="row"><span>佩戴部位</span><b>${slotLabel}</b></div>
      <div class="row"><span>品阶品质</span><b>${tierNum} 阶 · ${gradeNum} 品</b></div>
      <div class="row"><span>法器属性</span><b>攻+${eq.atk || 0} 防+${eq.def || 0} 血+${eq.hp || 0} 灵+${eq.mp || 0}${extra}</b></div>
      <div class="row"><span>兑换价格</span><b>${price} 宗门贡献（当前 ${S.contrib}）</b></div>
    </div>
    <p>${eq.desc || "宗门炼器堂精铸的一品护身法器。"}</p>
  `, [
    ...(canBuy ? [{
      label: `立即兑换 (${price}贡献)`,
      primary: true,
      fn: () => { closeModal(); buyShopEquip(itemId, price); }
    }] : []),
    { label: "合上玉简", fn: closeModal }
  ]);
}

function isShopItemOwned(id) {
  return hasItem(id);
}

/* ============================================================
   宗门坊市 / 市集 (参照上传截图：分类横线标题 + 宣纸商品卡片 + 右侧购买按钮)
   ============================================================ */
function renderMarket() {
  refreshAuctionStock();

  const goods = getMarketGoods();
  const equipGoods = [];
  const pillGoods = [];
  const matGoods = [];
  const specialGoods = [];

  goods.forEach(g => {
    const item = ITEMS[g.itemId];
    if (!item) return;
    if (item.type === "equip" || item.type === "artifact") equipGoods.push({ g, item });
    else if (item.type === "pill" || item.type === "food") pillGoods.push({ g, item });
    else if (item.type === "mat") matGoods.push({ g, item });
    else specialGoods.push({ g, item });
  });

  const renderGoodRow = ({ g, item }) => {
    const canBuy = S.money >= g.price;
    const icon = (typeof getItemIcon === "function") ? getItemIcon(item, g.itemId) : ((typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "🏺");
    const tierCls = typeof getItemTierColorClass === "function" ? getItemTierColorClass(item) : "tier-green";
    return `
      <div class="parchment-item-row" onclick="openMarketGoodModal('${g.itemId}', ${g.price})">
        <div class="p-row-left">
          <div class="p-row-icon">${icon}<span class="p-icon-qty">1</span></div>
          <span class="p-row-name ${tierCls}">${item.name}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">🪙 ${g.price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyMarketGood('${g.itemId}', ${g.price})" ${canBuy ? "" : "disabled"}>
            购买
          </button>
        </div>
      </div>
    `;
  };

  let html = "";

  if (equipGoods.length > 0) {
    html += `<div class="parchment-sec-header">装备</div>`;
    html += `<div class="parchment-list-wrap">${equipGoods.map(renderGoodRow).join("")}</div>`;
  }
  if (pillGoods.length > 0) {
    html += `<div class="parchment-sec-header">丹药</div>`;
    html += `<div class="parchment-list-wrap">${pillGoods.map(renderGoodRow).join("")}</div>`;
  }
  if (matGoods.length > 0) {
    html += `<div class="parchment-sec-header">材料</div>`;
    html += `<div class="parchment-list-wrap">${matGoods.map(renderGoodRow).join("")}</div>`;
  }
  if (specialGoods.length > 0) {
    html += `<div class="parchment-sec-header">特殊</div>`;
    html += `<div class="parchment-list-wrap">${specialGoods.map(renderGoodRow).join("")}</div>`;
  }

  html += `<div class="parchment-sec-header">天机特拍</div>`;
  html += `<div class="parchment-list-wrap">`;
  S.flags.auction.stock.forEach((g, i) => {
    const item = (typeof getItem === "function" ? getItem(g.itemId) : null) || ITEMS[g.itemId];
    if (!item) return;
    const bought = S.flags.auction.bought[i];
    const canBuy = !bought && S.stone >= g.price;
    const icon = (typeof getItemIcon === "function") ? getItemIcon(item, g.itemId) : ((typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "💎");
    html += `
      <div class="parchment-item-row" onclick="openAuctionItemModal(${i})">
        <div class="p-row-left">
          <div class="p-row-icon">${icon}<span class="p-icon-qty">1</span></div>
          <span class="p-row-name tier-gold">${item.name}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">💎 ${g.price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyAuctionItem(${i})" ${canBuy ? "" : "disabled"}>
            ${bought ? "已购" : "购买"}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  return html;
}

function openMarketGoodModal(itemId, price) {
  const d = getItemDetails(itemId);
  const canBuy = S.money >= price;

  showModal(`🏺 坊市货品 · ${d.name}`, `
    <div class="card">
      <div class="row"><span>品类</span><b>${d.typeName}</b></div>
      <div class="row"><span>售价</span><b>${price} 铜钱（当前 ${S.money}）</b></div>
      <div class="row"><span>行囊持有</span><b>×${d.count}</b></div>
    </div>
    <p>${d.effectDesc || d.desc}</p>
  `, [
    ...(canBuy ? [{
      label: `购买 1 件 (${price}铜钱)`,
      primary: true,
      fn: () => { closeModal(); buyMarketGood(itemId, price); }
    }] : []),
    { label: "关闭", fn: closeModal }
  ]);
}

function openAuctionItemModal(idx) {
  const g = S.flags.auction?.stock?.[idx];
  if (!g) return;
  const d = getItemDetails(g.itemId);
  const bought = S.flags.auction.bought[idx];
  const canBuy = !bought && S.stone >= g.price;

  showModal(`💎 拍卖珍品 · ${d.name}`, `
    <div class="card">
      <div class="row"><span>珍品类别</span><b>${d.typeName}</b></div>
      <div class="row"><span>一口拍价</span><b>${g.price} 灵石（当前 ${S.stone}）</b></div>
    </div>
    <p>${d.effectDesc || d.desc}</p>
  `, [
    ...(canBuy ? [{
      label: `立即拍下 (${g.price}灵石)`,
      primary: true,
      fn: () => { closeModal(); buyAuctionItem(idx); }
    }] : []),
    { label: "关闭", fn: closeModal }
  ]);
}


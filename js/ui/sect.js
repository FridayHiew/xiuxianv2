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
          <div class="plaque-sub">身份：<b>${rank}弟子</b> · 贡献：<b>${fmt(S.contrib)}</b></div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal ${canPromote ? 'glow' : ''}" onclick="openSectSubPanel('简介')" title="身份晋升">
            <span>晋升</span>
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
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="center">
        <div class="ink-scene-canvas sect-panorama ink-panorama-world">
          <img class="ink-scene-bg" src="./src/assets/images/sect_mountain_gate_1792114544883.jpg" alt="${sect.name}水墨山门" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">${sect.name}</div>

          <!-- 左翼西峰圆章：杂役百货、传功大殿、宗门事务 -->
          <button type="button" class="ink-seal-node pos-tl" onclick="openSectSubPanel('杂役铺')">
            <span class="node-char">
              杂
              <em class="seal-red-stamp">百货</em>
            </span>
            <span class="node-caption">杂役百货</span>
            <span class="node-sub-hint">日常器物采买</span>
          </button>

          <button type="button" class="ink-seal-node pos-ml" onclick="openSectSubPanel('传功殿')">
            <span class="node-char">
              传
              <em class="seal-red-stamp">功法</em>
            </span>
            <span class="node-caption">传功大殿</span>
            <span class="node-sub-hint">心法法术参学</span>
          </button>

          <button type="button" class="ink-seal-node pos-bl" onclick="openSectSubPanel('宗门事务')">
            <span class="node-char">
              务
              <em class="seal-red-stamp">劳作</em>
            </span>
            <span class="node-caption">宗门事务</span>
            <span class="node-sub-hint">杂务熟练一览</span>
          </button>

          <!-- 中央主峰：宗门大殿 + 道统画心 + 万宝坊市 -->
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
            <button type="button" class="ink-seal-node pos-center-bottom locked-node" onclick="openSectSubPanel('坊市')">
              <span class="node-char">
                市
                <em class="seal-red-stamp">内门</em>
              </span>
              <span class="node-caption">万宝坊市</span>
              <span class="node-sub-hint">内门弟子开放</span>
            </button>
          `}

          <!-- 右翼东峰圆章：藏经丹阁、丹方秘阁/同门战榜、神兵利器 -->
          <button type="button" class="ink-seal-node pos-tr ${!isMennei ? 'locked-node' : ''}" onclick="openSectSubPanel('藏经阁')">
            <span class="node-char">
              藏
              <em class="seal-red-stamp">${isMennei ? '灵丹' : '内门'}</em>
            </span>
            <span class="node-caption">藏经丹阁</span>
            <span class="node-sub-hint">九品灵丹兑换</span>
          </button>

          ${isMennei ? `
            <button type="button" class="ink-seal-node pos-mr" onclick="openSectSubPanel('丹方阁')">
              <span class="node-char">
                丹
                <em class="seal-red-stamp">1~2阶</em>
              </span>
              <span class="node-caption">丹方秘阁</span>
              <span class="node-sub-hint">秘传丹方参悟</span>
            </button>
          ` : `
            <button type="button" class="ink-seal-node pos-mr" onclick="openSectRankBoard()">
              <span class="node-char">
                榜
                <em class="seal-red-stamp">争锋</em>
              </span>
              <span class="node-caption">同门战榜</span>
              <span class="node-sub-hint">切磋角逐排名</span>
            </button>
          `}

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
        <button type="button" class="pano-compass-btn" data-pos="left" onclick="panPanorama('left')">◀ 西峰·传功</button>
        <button type="button" class="pano-compass-btn active" data-pos="center" onclick="panPanorama('center')">🏯 主峰·大殿</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">东峰·丹器 ▶</button>
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
  let html = `<h4>宗门劳作与事务熟练度</h4>`;
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
    html += `
      <div class="parchment-item-row" onclick="openShopItemModal('${itemId}')">
        <div class="p-row-left">
          <div class="p-row-icon">🧰<span class="p-icon-qty">1</span></div>
          <span class="p-row-name tier-green">${it.name}</span>
          <span class="p-row-badge">${it.cat || '器物'}</span>
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

  showModal(`🧰 器物详情 · ${it.name}`, `
    <div class="card">
      <div class="row"><span>器物类别</span><b>${it.cat || '杂务'}类</b></div>
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

function renderLibrary() {
  let html = `<p class="small">点击丹药名字选择品级并用贡献兑换（当前贡献：<b>${S.contrib}</b>）。</p>`;

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
    const baseItem = ITEMS[baseId + "_1"];
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
  const baseItem = ITEMS[baseId + "_1"];
  if (!baseItem) return;

  let rows = `<div class="parchment-list-wrap">`;
  for (let g = 1; g <= maxGrade; g++) {
    const itemId = baseId + "_" + g;
    const item = ITEMS[itemId];
    if (!item) continue;
    const contribCost = Math.floor((item.price || 0) * 2);
    const owned = (S.inventory && S.inventory[itemId]) || 0;
    const canBuy = S.contrib >= contribCost;

    rows += `
      <div class="parchment-item-row" onclick="showItemDetailModal('${itemId}')">
        <div class="p-row-left">
          <div class="p-row-icon">💊</div>
          <span class="p-row-name ${g >= 5 ? 'tier-gold' : g >= 3 ? 'tier-blue' : 'tier-green'}">${item.name}（${g}品）</span>
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
   丹方阁 (仅门内显示，且仅限 1~2 阶丹方：极简名字行 + 点击弹窗购买)
   ============================================================ */

function renderRecipeShop() {
  let html = `<p class="small">点击丹方名称查看详情与配方并用贡献解锁（仅授一至二阶丹方，当前贡献：<b>${S.contrib}</b>）。</p>`;

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
   【历练】主视图 (水墨江山卷轴 + 九大险地圆形书法印章节点 + 天机秘境圆章)
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

  /* 提取每个历练地域的核心水墨篆印字（如“迷雾森林”->“林”，“幽冥涧”->“涧”） */
  const sealChars = ["林", "涧", "谷", "窟", "山", "原", "泽", "渊", "墟"];

  const sealNodesHtml = ADVENTURE_ZONES.map((zone, idx) => {
    const recPower = typeof calcZoneRecommendedPower === "function" ? calcZoneRecommendedPower(zone) : 0;
    const isUnderRealm = realm < zone.realmMin;
    const isWeak = pPower < recPower || isUnderRealm;
    const minRealmName = REALMS[zone.realmMin] ? REALMS[zone.realmMin].name : "凡人";
    const sealChar = sealChars[idx] || zone.name.slice(-1);

    return `
      <button type="button"
              class="adv-seal-node ${isWeak ? 'danger' : 'safe'}"
              onclick="openAdventureZoneModal('${zone.id}')"
              title="点击查看【${zone.name}】详情与探索">
        <div class="adv-seal-disc">
          <span class="adv-seal-idx">${idx + 1}</span>
          <span class="adv-seal-char">${sealChar}</span>
          <span class="adv-seal-stamp ${isWeak ? 'bad' : 'good'}">${isWeak ? '凶险' : '适宜'}</span>
        </div>
        <div class="adv-seal-caption">${zone.name}</div>
        <div class="adv-seal-meta">${minRealmName} · ☯${fmt(recPower)}</div>
      </button>
    `;
  }).join("");

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻历练战力铭牌与【秘境】圆章入口 -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">历练</span>
            九州万里山河卷
          </div>
          <div class="plaque-sub">战力 <b>☯ ${fmt(pPower)}</b> · 行动 <b>${remainActions}/${ACTIONS_PER_SLOT}</b> · 左右滑动探索险境</div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal ${secretCount > 0 ? 'glow' : ''}" onclick="openSecretRealmListModal()" title="天机秘境探索">
            <span>秘境${secretCount > 0 ? `(${secretCount})` : ''}</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的九州山河万里长卷 (从左至右蜿蜒深入九大险境) -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="left">
        <div class="ink-scene-canvas adv-map-panorama ink-panorama-world adv-wide-world">
          <img class="ink-scene-bg" src="./src/assets/images/xianxia_bg_banner_1792114543496.jpg" alt="九州水墨历练卷轴" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">九州山河</div>

          <!-- 水墨蜿蜒古道连线 SVG -->
          <svg class="adv-trail-svg" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 90,115 Q 150,240 210,255 T 330,110 T 450,255 T 570,110 T 690,255 T 810,110 T 915,245"
                  fill="none"
                  stroke="rgba(226, 192, 118, 0.36)"
                  stroke-width="3"
                  stroke-dasharray="8 8" />
          </svg>

          <!-- 九大历练险地圆形书法印章长卷排布 (5列×2行蜿蜒错落，宽敞不拥挤) -->
          <div class="adv-pillars-stage adv-seal-grid">
            ${sealNodesHtml}
          </div>
        </div>
      </div>

      <!-- 底部九州地域导览罗盘 -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn active" data-pos="left" onclick="panPanorama('left')">◀ 近郊·林涧谷</button>
        <button type="button" class="pano-compass-btn" data-pos="center" onclick="panPanorama('center')">⛰️ 中州·窟山原</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">绝域·泽渊墟 ▶</button>
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
  const realmText = `${REALMS[zone.realmMin].name} ~ ${REALMS[zone.realmMax].name}`;
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));

  showModal(`${zone.icon || '⛰️'} 历练险地 · ${zone.name}`, `
    <div class="card">
      <div class="row"><span>适宜境界</span><b>${realmText}</b></div>
      <div class="row"><span>险地层数</span><b>共 ${zone.layers.length} 层（耗费 ${zone.actionCost} 行动）</b></div>
      <div class="row"><span>推荐战力</span><b style="color:#d8b878;">☯ ${fmt(recPower)}</b></div>
      <div class="row"><span>你的战力</span><b style="color:${isWeak ? '#e06c75' : '#98c379'};">☯ ${fmt(pPower)} ${isWeak ? '（⚠️ 凶险）' : '（适宜）'}</b></div>
      <div class="row"><span>本时段剩余行动</span><b>${remain} / ${ACTIONS_PER_SLOT}</b></div>
    </div>
    <p>${zone.desc}</p>
    <p class="small">💡 只有【练气1重】妖兽可被收服为灵宠，更高阶妖兽桀骜难驯必定失败。</p>
  `, [
    {
      label: isWeak ? "⚠️ 涉险前往历练" : "⚔️ 立即进入历练",
      primary: true,
      fn: () => {
        closeModal();
        enterAdventure(zone.id);
      }
    },
    { label: "暂缓前往", fn: closeModal }
  ]);
}

function openSecretRealmListModal() {
  showModal("📜 天机秘境录", renderSecretRealmList(), [
    { label: "合上玉简", fn: closeModal }
  ]);
}

function renderAdventureZoneList() {
  return renderAdventureMapPage();
}

/* ============================================================
   秘境（列表）
   ============================================================ */

function renderSecretRealmList() {
  const pPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
  let html = `<p class="small">秘境为机缘奇遇，每次探索消耗 2 行动。当前战力：<b style="color:#d8b878;">☯ ${fmt(pPower)}</b></p>`;

  const pending = S.flags.pendingSecretRealm;
  let hasAny = false;
  html += `<div class="parchment-list-wrap">`;

  if (pending) {
    const ev = getSecretEventById(pending.id);
    if (ev) {
      hasAny = true;
      const recPower = typeof calcSecretRealmRecommendedPower === "function" ? calcSecretRealmRecommendedPower(ev) : 0;
      const isWeak = pPower < recPower || (ev.realmMin !== undefined && S.realm < ev.realmMin);
      html += `
        <div class="parchment-item-row" onclick="closeModal(); enterSecretRealmById('${ev.id}', {fromPending:true})">
          <div class="p-row-left">
            <div class="p-row-icon">🌀</div>
            <span class="p-row-name tier-gold">${ev.name}</span>
            <span class="p-row-badge">${isWeak ? '⚠️凶险' : '适宜'}·剩${pending.expireDay - S.day}天</span>
          </div>
          <span class="p-row-count">荐战力 ${recPower} ▸</span>
        </div>
      `;
    }
  }

  const unlockedB = (SECRET_EVENTS.B || []).filter(e => isSecretEventUnlocked(e.id));
  unlockedB.forEach(ev => {
    hasAny = true;
    const recPower = typeof calcSecretRealmRecommendedPower === "function" ? calcSecretRealmRecommendedPower(ev) : 0;
    const isWeak = pPower < recPower || (ev.realmMin !== undefined && S.realm < ev.realmMin);
    html += `
      <div class="parchment-item-row" onclick="closeModal(); enterSecretRealmById('${ev.id}')">
        <div class="p-row-left">
          <div class="p-row-icon">⛩️</div>
          <span class="p-row-name tier-purple">${ev.name}</span>
          <span class="p-row-badge">${isWeak ? '⚠️凶险' : '适宜'}</span>
        </div>
        <span class="p-row-count">荐战力 ${recPower} ▸</span>
      </div>
    `;
  });

  html += `</div>`;
  if (!hasAny) {
    html += `<p class="empty">天地茫茫，近期尚无秘境开启之兆（每月初五或奇遇可触发秘境）。</p>`;
  }

  return html;
}

/* ============================================================
   装备铺 (极简名字行 + 点击弹窗兑换)
   ============================================================ */

function renderSectEquipShop(sect) {
  const playerInfo = getPlayerRealmInfo();
  const playerRealm = playerInfo.realm;

  const allItems = getShopItems(SECT_EQUIP_SHOP, S.sect);
  const available = filterShopByRealm(allItems, playerRealm);

  let html = `<div class="parchment-sec-header">装备</div>`;
  if (available.length === 0) {
    return html + `<p class="empty">当前境界暂无可兑换的装备。</p>`;
  }

  html += `<div class="parchment-list-wrap">`;
  available.forEach(item => {
    const eq = ITEMS[item.itemId];
    if (!eq) return;
    const owned = hasItem(item.itemId);
    const canBuy = !owned && S.contrib >= item.price;

    html += `
      <div class="parchment-item-row" onclick="openSectEquipModal('${item.itemId}', ${item.price})">
        <div class="p-row-left">
          <div class="p-row-icon">⚔️<span class="p-icon-qty">1</span></div>
          <span class="p-row-name tier-blue">${eq.name}</span>
          <span class="p-row-badge">${SLOT_NAMES[eq.slot] || eq.slot}</span>
        </div>
        <div class="fs-card-right-group">
          <span class="fs-card-cost">🎖️ ${item.price}</span>
          <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); buyShopEquip('${item.itemId}', ${item.price})" ${canBuy ? "" : "disabled"}>
            ${owned ? "已兑" : "购买"}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function openSectEquipModal(itemId, price) {
  const eq = ITEMS[itemId];
  if (!eq) return;
  const owned = hasItem(itemId);
  const canBuy = !owned && S.contrib >= price;
  const extra = eq.spellBonus ? ` / 法术威力 +${(eq.spellBonus * 100).toFixed(0)}%` : "";

  showModal(`⚔️ 神兵鉴赏 · ${eq.name}`, `
    <div class="card">
      <div class="row"><span>佩戴部位</span><b>${SLOT_NAMES[eq.slot] || eq.slot}</b></div>
      <div class="row"><span>法器属性</span><b>攻+${eq.atk || 0} 防+${eq.def || 0} 血+${eq.hp || 0} 灵+${eq.mp || 0}${extra}</b></div>
      <div class="row"><span>兑换价格</span><b>${price} 宗门贡献（当前 ${S.contrib}）</b></div>
    </div>
    <p>${eq.desc || "宗门炼器堂精铸护身法器。"}</p>
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
    const icon = (typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "🏺";
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
    const item = ITEMS[g.itemId];
    if (!item) return;
    const bought = S.flags.auction.bought[i];
    const canBuy = !bought && S.stone >= g.price;
    const icon = (typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "💎";
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


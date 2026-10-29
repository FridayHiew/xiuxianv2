/* ============================================================
   ui/cultivate.js - 修炼面板
   ============================================================ */

function renderCultivatePage() {
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : { lvl: 0, exp: 0, proficiency: 0, maxLearn: 3 };
  const playerInfo = getPlayerRealmInfo();
  const isFan = playerInfo.realm === 0;
  const remain = ACTIONS_PER_SLOT - S.actionsUsed;

  const realmText = isFan ? "凡胎肉体" :
    `${REALMS[playerInfo.realm].name}·${subName(playerInfo.lvl)}${playerInfo.lvl}重`;

  const pillBreakBonus = (S.flags && S.flags.pillBuff && S.flags.pillBuff.breakBonus) || 0;
  const pillCultMul = (S.flags && S.flags.cultivateBuff && S.flags.cultivateBuff.mul) || 1;

  let curNeed = 0;
  let expPct = 0;
  if (art && !isFan && prog.lvl > 0) {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    curNeed = curLevelData ? curLevelData.expNeed : 0;
    expPct = curNeed > 0 ? Math.min(100, prog.exp / curNeed * 100) : 0;
  }

  const isBP = art ? isBreakPoint(prog.lvl) : false;
  const isReadyBreak = art && (
    (prog.lvl === 0 && prog.proficiency >= 100) ||
    (prog.lvl > 0 && curNeed > 0 && prog.exp >= curNeed)
  );

  let header = `
    <div class="cultivate-meridian-card ${isReadyBreak ? "is-break-ready" : ""}">
      <div class="cm-visual-col">
        <div class="cm-bagua-ring"></div>
        <svg class="cm-meridian-svg" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(242, 207, 126, 0.45)" stroke-width="1.2" stroke-dasharray="4 3" />
          <circle cx="40" cy="22" r="4" fill="#9ef5d4" />
          <circle cx="40" cy="40" r="5" fill="#ffe28a" />
          <circle cx="40" cy="58" r="6" fill="${isReadyBreak ? '#ffcf5c' : '#5eead4'}" />
          <line x1="40" y1="22" x2="40" y2="58" stroke="rgba(158, 245, 212, 0.75)" stroke-width="1.8" />
          <path d="M24,34 Q40,26 56,34" fill="none" stroke="rgba(242, 207, 126, 0.65)" stroke-width="1.4" />
          <path d="M22,50 Q40,62 58,50" fill="none" stroke="rgba(158, 245, 212, 0.65)" stroke-width="1.4" />
        </svg>
        <span class="cm-realm-tag">${isReadyBreak ? "⚡ 瓶颈圆满" : "☯ 周天运转"}</span>
      </div>
      <div class="cm-info-col">
        <div class="row" style="padding:2px 0;">
          <span>当前道境</span>
          <b style="color:var(--text-bright); font-size:0.86rem;">${realmText}</b>
        </div>
        <div class="row" style="padding:2px 0;">
          <span>主修心法</span>
          <b>${art ? `《${art.name}》(${art.type}${!isFan ? `·Lv.${prog.lvl}/${art.maxLvl}` : ""})` : "未装配心法"}</b>
        </div>
        ${pillBreakBonus > 0 || pillCultMul > 1 ? `
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
            ${pillBreakBonus > 0 ? `<span class="tag gold">💊 破境丹效 +${Math.round(pillBreakBonus * 100)}%</span>` : ""}
            ${pillCultMul > 1 ? `<span class="tag good">✨ 悟道加速 ×${pillCultMul.toFixed(1)}</span>` : ""}
          </div>
        ` : ""}
      </div>
    </div>
  `;

  if (art) {
    /* 残卷上限提示 */
    if (!isFan && prog.maxLearn < art.maxLvl) {
      header += `<p class="small" style="color:#e8c87a; margin-top:6px;">📜 残卷上限：Lv.${prog.maxLearn}（全卷可修至 Lv.${art.maxLvl}，需在行囊中参悟后续残卷）</p>`;
    }

    header += `<div class="skill-bar" style="margin-top:6px;">
      <span>熟练度</span>
      <div class="skill-mini"><div style="width:${prog.proficiency}%"></div></div>
      <span class="small">${prog.proficiency.toFixed(2)}/100${prog.proficiency >= 100 ? " ✓" : ""}</span>
    </div>`;

    if (!isFan && prog.lvl > 0) {
      header += `<div class="skill-bar">
        <span>修为</span>
        <div class="skill-mini"><div style="width:${expPct}%"></div></div>
        <span class="small">${fmt(prog.exp)}/${fmt(curNeed)}</span>
      </div>`;
    }
  } else {
    header += `<p class="small" style="color:#d05a4a;">⚠ 没有心法</p>`;
  }

  const check = canCultivateHeart();
  if (!check.ok) {
    header += `<p class="small" style="color:#d05a4a;">⚠ ${check.reason}</p>`;
  }

  let sliderHTML = '';
  if (!check.ok) {
    sliderHTML = `<p class="small" style="color:#d05a4a;">无法修炼</p>`;
  } else if (remain > 0) {
    const maxCount = remain;
    if (S.meditateCount > maxCount) S.meditateCount = maxCount;
    if (S.meditateCount < 1) S.meditateCount = 1;
    sliderHTML = `
      <div class="slider-row">
        <button onclick="changeMeditate(-1)">−</button>
        <span class="slider-value">${S.meditateCount}</span>
        <button onclick="changeMeditate(1)">+</button>
        <span class="small">/ ${maxCount}</span>
        <button onclick="setMeditate(${maxCount})">最大</button>
      </div>
      <button class="primary block" onclick="doCultivate(${S.meditateCount})">☯ 打坐吐纳 ${S.meditateCount} 次</button>
    `;
  } else {
    sliderHTML = `<p class="small">本时段行动已用完。</p>`;
  }

  let primaryBtn = sliderHTML;

  if (art) {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    const isMaxed = prog.lvl >= prog.maxLearn;

    if (isMaxed) {
      primaryBtn += `<p class="small" style="color:#ff8a7a; text-align:center; margin-top:10px;">
        ⚠ 【${art.name}】已达当前残卷上限 Lv.${prog.maxLearn}。<br>
        需在背包中使用中卷/下卷残卷解锁更高等级。
      </p>`;
    } else if (isBP) {
      let ready = false;
      if (prog.lvl === 0) ready = prog.proficiency >= 100;
      else ready = curLevelData && prog.exp >= curLevelData.expNeed;

      if (ready && !S.flags.breakAttemptedToday && check.ok) {
        const rate = calcBreakRate();
        const label = prog.lvl === 0
          ? `🌩️ 引发天劫 · 渡劫破境（把握 ${(rate * 100).toFixed(0)}%）`
          : `⚡ 冲击瓶颈 · 突破到 Lv.${prog.lvl + 1}（把握 ${(rate * 100).toFixed(0)}%）`;
        primaryBtn += `<button class="primary block trib-trigger-btn" onclick="tryBreak()">${label}</button>`;
      }
    } else {
      if (prog.lvl < art.maxLvl && curLevelData && prog.exp >= curLevelData.expNeed) {
        primaryBtn += `<button class="primary block trib-trigger-btn" onclick="tryBreak()">✨ 水到渠成 · 晋升到 Lv.${prog.lvl + 1}</button>`;
      }
    }
  }

  const stoneCount = S.stone || 0;
  const tabsHtml = `
    <div class="fs-rect-tabs">
      <button type="button" class="fs-rect-tab active">蒲团吐纳</button>
      <button type="button" class="fs-rect-tab" onclick="openProfileSubModal('心法')">心法宝库</button>
    </div>
  `;

  return `
    <div class="fs-detail-page">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, "蒲团吐纳 · 冲击瓶颈") : tabsHtml}
      <div class="fs-detail-scroll-body">
        <div class="parchment-sec-header">周天吐纳</div>
        <div class="card">
          ${header}
        </div>
        ${primaryBtn}
        <div class="parchment-sec-header">灵石辅修</div>
        <div class="card">
          <p class="small">需熟练度满 100，每次消耗 1 块灵石。当前灵石：<b>${stoneCount}</b> 块</p>
          <button class="block" onclick="cultivateWithStoneItem()" ${(isFan || stoneCount < 1) ? "disabled" : ""}>
            ${isFan ? "凡人阶段无法使用" : stoneCount < 1 ? "灵石不足" : "💎 汲取 1 块灵石修炼"}
          </button>
        </div>
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("returnFromDetailPage()") : ""}
    </div>
  `;
}


function changeMeditate(delta) {
  const remain = ACTIONS_PER_SLOT - S.actionsUsed;
  S.meditateCount = Math.max(1, Math.min(remain, S.meditateCount + delta));
  render();
}
function setMeditate(n) {
  const remain = ACTIONS_PER_SLOT - S.actionsUsed;
  S.meditateCount = Math.max(1, Math.min(remain, n));
  render();
}
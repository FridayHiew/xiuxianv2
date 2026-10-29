/* ============================================================
   ui/adventure.js - 历练险地全屏探索界面
   ============================================================ */

function renderAdventureScreen() {
  const adv = S.flags.adventure;
  if (!adv) {
    const el = document.getElementById("adventureScreen");
    if (el) el.style.display = "none";
    return;
  }

  const zone = getAdventureZone(adv.zoneId);
  if (!zone) return;

  /* 顶部标题与右上角退出图标 */
  const titleEl = document.getElementById("advTitle");
  if (titleEl) titleEl.textContent = `${zone.icon || "⛰️"} ${zone.name}`;

  const subEl = document.getElementById("advSub");
  if (subEl) subEl.remove();

  const hudEl = document.getElementById("advHudBar");
  if (hudEl) hudEl.remove();

  const footerEl = document.querySelector("#adventureScreen .adv-footer");
  if (footerEl) footerEl.remove();

  const headerEl = document.querySelector("#adventureScreen .adventure-header");
  if (headerEl && !headerEl.querySelector(".adv-exit-icon-btn")) {
    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "adv-exit-icon-btn";
    exitBtn.title = "中途撤离历练";
    exitBtn.setAttribute("aria-label", "中途撤离历练");
    exitBtn.onclick = onAdvLeave;
    exitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    `;
    headerEl.appendChild(exitBtn);
  }

  /* 路径条 */
  renderAdvPathBar();

  /* 事件卡片 */
  renderAdvEventCard();

  /* 底部选择 */
  renderAdvChoices();
}

function renderAdvHudBar() {
  const hudEl = document.getElementById("advHudBar");
  if (hudEl) hudEl.remove();
}

/* 路径条：最近 5 步 */
function renderAdvPathBar() {
  const adv = S.flags.adventure;
  const bar = document.getElementById("advPathBar");
  if (!bar) return;

  const recent = adv.path.slice(-5);
  let html = "";
  recent.forEach((node, i) => {
    const isLast = i === recent.length - 1;
    const cls = isLast ? "current" : "past";
    html += `
      <div class="path-step ${cls}">
        <div class="step-icon">${node.icon}</div>
        <div class="step-name">${node.name}</div>
      </div>
    `;
  });
  const cur = adv.path[adv.path.length - 1];
  if (!cur || (cur.type !== "exit" && cur.type !== "portal")) {
    html += `
      <div class="path-step unknown">
        <div class="step-icon">❓</div>
        <div class="step-name">前路未知</div>
      </div>
    `;
  }
  bar.innerHTML = html;
  setTimeout(() => { bar.scrollLeft = bar.scrollWidth; }, 10);
}

/* 事件卡片 */
function renderAdvEventCard() {
  const adv = S.flags.adventure;
  const card = document.getElementById("advEventCard");
  if (!card) return;

  const cur = adv.path[adv.path.length - 1];
  if (!cur) { card.innerHTML = ""; return; }

  /* 最近 4 条日志显示在卡片下 */
  const logList = (S.flags.adventureLog || []).slice(-4);
  const logHtml = logList.map(l =>
    `<div class="log-line ${l.cls || ''}">· ${l.text}</div>`
  ).join("");

  card.innerHTML = `
    <div class="card-icon">${cur.icon}</div>
    <div class="card-title">${cur.name}</div>
    <div class="card-desc">${getAdvNodeDesc(cur)}</div>
    ${logHtml ? `<div class="card-logs">${logHtml}</div>` : ""}
  `;
}

function getAdvNodeDesc(node) {
  switch (node.type) {
    case "start":
      return "四周灵气缭绕，前方便是险地深处。审视自身气血与灵力，择路而行。";
    case "fight":
      if (node.data && node.data.enemyName) {
        return `前方妖气森然，【${node.data.enemyName}】已被惊动！`;
      }
      return "一股凌厉的杀机从前方袭来。";
    case "event":
      return (node.data && node.data.event && node.data.event.text) || "你在秘径旁发现了一处奇异之地。";
    case "storage":
      return "前人遗落的储物袋散落在此，清点战利品后可继续前行。";
    case "empty":
      return "此处山石幽寂，并无妖兽盘踞，正好稍作喘息。";
    case "portal":
      return "前方灵纹流转，一座古传送阵正散发幽光，踏入即可前往下一层。";
    case "exit":
      return "前方云雾散开，已见通往山外的出口灵光。";
    default:
      return "……";
  }
}

/* 底部选择 */
function renderAdvChoices() {
  const adv = S.flags.adventure;
  const list = document.getElementById("advChoiceList");
  if (!list) return;

  if (!adv.choices || adv.choices.length === 0) {
    list.innerHTML = `<div class="empty-hint">前路已尽，请结算离开。</div>`;
    return;
  }

  let html = "";
  adv.choices.forEach((c, i) => {
    const isEnd = (c.type === "exit" || c.type === "portal");
    const subInfo = getAdvChoiceSubLabel(c);
    html += `
      <button class="choice-btn ${isEnd ? 'exit-choice' : ''} ${c.type === 'fight' ? 'fight-choice' : ''}" onclick="onAdvChoose(${i})">
        <div class="choice-icon">${c.icon}</div>
        <div class="choice-text">
          <div class="choice-top-row">
            <span class="choice-name">${c.name}</span>
            ${subInfo.badge ? `<span class="adv-choice-badge ${subInfo.badgeCls || ''}">${subInfo.badge}</span>` : ""}
          </div>
          <span class="choice-sub">${subInfo.desc}</span>
        </div>
      </button>
    `;
  });
  list.innerHTML = html;
}

function getAdvChoiceSubLabel(node) {
  if (!node) return { desc: "", badge: "" };
  switch (node.type) {
    case "fight": {
      const eId = node.data && node.data.enemyId;
      const eDef = (typeof FIGHT_ENEMIES !== "undefined" && eId) ? FIGHT_ENEMIES[eId] : null;
      if (eDef) {
        const rName = (typeof REALMS !== "undefined" && REALMS[eDef.realm]) ? REALMS[eDef.realm].name : "未知";
        const isDanger = (eDef.realm > S.realm) || (eDef.realm === S.realm && eDef.rank > S.rank + 1);
        return {
          desc: `${eDef.desc || "凶悍拦路之敌"} · 击败获修为与掉落`,
          badge: `${rName}${eDef.rank}重${isDanger ? " · 强敌" : ""}`,
          badgeCls: isDanger ? "danger" : "fight",
        };
      }
      return { desc: "遭遇拦路妖兽，击败可获战利品", badge: "战斗", badgeCls: "fight" };
    }
    case "event":
      return { desc: "灵光隐现，或许藏有一桩奇遇机缘", badge: "奇遇", badgeCls: "good" };
    case "storage":
      return { desc: "拾取散落的储物袋，获取灵石或丹药材料", badge: "宝袋", badgeCls: "gold" };
    case "empty":
      return { desc: "风平浪静的小径，可安全通过并调息", badge: "安全", badgeCls: "dim" };
    case "portal":
      return { desc: "踏入传送阵，深入险地下一层", badge: "下一层", badgeCls: "portal" };
    case "exit": {
      const zoneId = S.flags.adventure && S.flags.adventure.zoneId;
      const isCleared = S.flags.dungeonsCleared && S.flags.dungeonsCleared[zoneId];
      return {
        desc: isCleared ? "圆满走完本险地，领取通关修为与灵石奖励" : "首次通关本险地，可获丰厚首通修为与灵石大奖！",
        badge: isCleared ? "通关结算" : "🌟 首通大奖",
        badgeCls: "gold",
      };
    }
    default:
      return { desc: "继续探索", badge: "" };
  }
}

/* 玩家点击选择 */
function onAdvChoose(i) {
  adventureChoose(i);
}

function onAdvLeave() {
  const adv = S.flags.adventure;
  const gains = (adv && adv.gains) || { exp: 0, stone: 0, items: {} };
  const itemCount = Object.values(gains.items || {}).reduce((s, n) => s + n, 0);

  showModal("中途撤离历练", `
    <p>确定要中途撤离这片历练险地吗？</p>
    <p class="small" style="color:var(--text-dim);">撤离后已获得的战利品（修为 +${fmt(gains.exp || 0)}、灵石 +${fmt(gains.stone || 0)}、物品 ${itemCount} 件）将悉数保留，但无法获得终点通关奖励。</p>
  `, [
    { label: "继续探索", fn: closeModal },
    { label: "确定撤离", primary: true, fn: () => {
      closeModal();
      if (typeof leaveAdventure === "function") {
        leaveAdventure(false);
      } else {
        S.flags.adventure = null;
        S.flags.adventureLog = null;
        S.flags.adventureCombat = null;
        const el = document.getElementById("adventureScreen");
        if (el) el.style.display = "none";
        save();
        render();
      }
    }},
  ]);
}
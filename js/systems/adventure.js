/* ============================================================
   systems/adventure.js - 冒险地核心逻辑
   ------------------------------------------------------------
   流程：
   1. 玩家选冒险地 → enterAdventure(zoneId)
   2. 生成第 1 层路径树 → 玩家在层内推进
   3. 到达传送门 → 进入下一层
   4. 到达出口 → 离开冒险地
   
   玩家状态（临时）：
   - S.flags.adventure = {
       zoneId: "black_forest",
       layer: 1,
       path: [],           // 走过的节点
       currentNodeId: null,
       choices: [],        // 当前可选项
     }
   ============================================================ */

/* ============================================================
   进入 / 离开
   ============================================================ */

function enterAdventure(zoneId, forceConfirm) {
  const zone = getAdventureZone(zoneId);
  if (!zone) return;

  /* 行动检查 */
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    showModal("行动不足", `
      <p>本时段行动已用完（${S.actionsUsed} / ${ACTIONS_PER_SLOT}）。</p>
      <p class="small">睡一觉或等下一时段再试。</p>
    `, [{ label: "关闭", fn: closeModal }]);
    return;
  }

  /* 战力与境界对比 */
  if (!forceConfirm) {
    const info = getPlayerRealmInfo();
    const playerPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
    const recPower = typeof calcZoneRecommendedPower === "function" ? calcZoneRecommendedPower(zone) : 0;
    const isUnderRealm = info.realm < zone.realmMin;
    const isWeakPower = playerPower < recPower;

    if (isUnderRealm || isWeakPower) {
      const realmText = (zone.realmMin !== undefined && REALMS[zone.realmMin]?.name) || "炼气";
      let warnDetail = "";
      if (isUnderRealm && isWeakPower) {
        warnDetail = `此地极度凶险！适宜境界需达 <b>${realmText}</b> 以上，建议战力 <b>${recPower}</b>。<br>你当前境界为 <b>${REALMS[info.realm]?.name || '凡人'}·${info.lvl}重</b>（战力 <b>${playerPower}</b>），极易遇袭重伤！`;
      } else if (isWeakPower) {
        warnDetail = `此地潜藏强大妖物！当前历练建议战力为 <b>${recPower}</b>。<br>你当前战力为 <b>${playerPower}</b>，稍显孱弱，可能面临险境。`;
      } else {
        warnDetail = `此地适宜境界为 <b>${realmText}</b> 以上。<br>你当前战力为 <b>${playerPower}</b>，境界稍逊，稍有不慎恐遭压制。`;
      }

      showModal("⚠️ 历练涉险示警", `
        <div class="card" style="border: 1.5px solid #d05a4a; background: rgba(50, 20, 20, 0.45); padding: 12px; margin-bottom: 8px;">
          <b style="color: #e06c75; font-size: 15px;">【${zone.name}】凶险莫测</b>
          <div class="small" style="margin-top: 6px; line-height: 1.6; color: #f0cfcb;">
            ${warnDetail}
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 13px;">
            <span>当前战力：<b style="color:#e06c75;">${playerPower}</b></span>
            <span>建议战力：<b style="color:#d8b878;">${recPower}</b></span>
          </div>
        </div>
        <p class="small" style="color: var(--text-dim);">修仙问道，生死有命。道友是否执意以身涉险，前往探秘？</p>
      `, [
        { label: "暂缓前往 · 潜修备战", fn: closeModal },
        { label: "执意涉险 · 依然进入", primary: true, fn: () => {
          closeModal();
          enterAdventure(zoneId, true);
        }}
      ]);
      return;
    }
  }

  /* ★ 先清空旧的冒险状态 */
  S.flags.adventure = null;
  S.flags.adventureLog = null;
  S.flags.adventureCombat = null;

  /* 扣行动并检查时辰推进 */
  S.actionsUsed += zone.actionCost;
  if (typeof triggerDailyTask === "function") {
    triggerDailyTask("explore");
  }

  /* 初始化状态（含本次历练累计收获） */
  S.flags.adventure = {
    zoneId: zoneId,
    layer: 1,
    path: [],
    currentNodeId: null,
    choices: [],
    gains: {
      exp: 0,
      stone: 0,
      items: {},
    },
  };

  /* 生成第 1 层 */
  const layerConf = zone.layers[0];
  generateAdventureLayer(zone, layerConf);

  log(`【${zone.name}】你踏入了${layerConf.title}。`, "c-gold");
  save();
  openAdventureScreen();
}

/* 记录本次历练累计收获 */
function recordAdventureGain(payload) {
  if (!S || !S.flags || !S.flags.adventure || !payload) return;
  if (!S.flags.adventure.gains) {
    S.flags.adventure.gains = { exp: 0, stone: 0, items: {} };
  }
  const g = S.flags.adventure.gains;
  if (payload.exp && payload.exp > 0) {
    g.exp = (g.exp || 0) + Math.floor(payload.exp);
  }
  if (payload.stone && payload.stone > 0) {
    g.stone = (g.stone || 0) + Math.floor(payload.stone);
  }
  if (payload.itemId && payload.count > 0) {
    g.items[payload.itemId] = (g.items[payload.itemId] || 0) + payload.count;
  }
}

/* 历练途中快捷服丹调息（不消耗时辰行动） */
function openAdvQuickHealModal(onAfterUse) {
  const maxHp = typeof totalMaxHp === "function" ? totalMaxHp() : (S.hpMax || 100);
  const maxMp = typeof totalMaxMp === "function" ? totalMaxMp() : (S.mpMax || 100);

  const healItems = [];
  for (const id in (S.inventory || {})) {
    const cnt = S.inventory[id];
    if (!id || id === "undefined" || cnt <= 0) continue;
    const it = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id];
    if (!it) continue;
    const isHealPill = (it.type === "pill" || it.type === "pillTemplate") &&
      it.effect && ["heal", "healMp", "fullHeal", "cure"].includes(it.effect.type);
    const isBandage = id === "d_gao";
    if (isHealPill || isBandage) {
      healItems.push({ id, it, cnt });
    }
  }

  let listHtml = "";
  if (healItems.length === 0) {
    listHtml = `<p class="empty">行囊中暂无疗伤或回灵丹药（可在洞府炼丹房炼制或藏经丹阁兑换）。</p>`;
  } else {
    listHtml = `<div class="parchment-list-wrap" style="max-height:46vh; overflow-y:auto;">` + healItems.map(({ id, it, cnt }) => {
      const icon = typeof getItemIcon === "function" ? getItemIcon(it, id) : "💊";
      const safeId = String(id).replace(/'/g, "\\'");
      return `
        <div class="parchment-item-row" onclick="useAdvQuickHealItem('${safeId}')">
          <div class="p-row-left">
            <div class="p-row-icon">${icon}</div>
            <span class="p-row-name tier-green">${it.name || id}</span>
            <span class="p-row-badge">${it.desc || '恢复状态'}</span>
          </div>
          <div class="fs-card-right-group">
            <span class="p-row-count">×${cnt}</span>
            <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); useAdvQuickHealItem('${safeId}')">服用</button>
          </div>
        </div>
      `;
    }).join("") + `</div>`;
  }

  window._advAfterQuickHeal = typeof onAfterUse === "function" ? onAfterUse : null;

  showModal("💊 服丹调息 · 状态整备", `
    <div class="card" style="margin-bottom:8px;">
      <div class="row"><span>当前气血</span><b style="color:#ff8b8b;">❤️ ${S.hp} / ${maxHp}</b></div>
      <div class="row"><span>当前灵力</span><b style="color:#67b7f7;">💧 ${S.mp} / ${maxMp}</b></div>
    </div>
    ${listHtml}
  `, [{ label: "完毕", fn: closeModal }], { showCloseX: true });
}

function useAdvQuickHealItem(itemId) {
  if (!S.inventory || (S.inventory[itemId] || 0) <= 0) return;
  const maxHp = typeof totalMaxHp === "function" ? totalMaxHp() : (S.hpMax || 100);
  const maxMp = typeof totalMaxMp === "function" ? totalMaxMp() : (S.mpMax || 100);
  const it = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
  if (!it) return;

  if (itemId === "d_gao") {
    if (S.hp >= maxHp) {
      log("当前气血已满，无需使用药膏。", "c-dim");
      return;
    }
    S.hp = Math.min(maxHp, S.hp + 20);
    removeItem(itemId, 1);
    log("敷上药膏，气血 +20。", "c-good");
  } else if (typeof useItem === "function") {
    useItem(itemId);
  } else if (it.effect) {
    if (it.effect.type === "heal") {
      S.hp = Math.min(maxHp, S.hp + (it.effect.value || 50));
      removeItem(itemId, 1);
    } else if (it.effect.type === "healMp") {
      S.mp = Math.min(maxMp, S.mp + (it.effect.value || 50));
      removeItem(itemId, 1);
    }
  }

  save();
  if (typeof renderAdventureScreen === "function" && S.flags && S.flags.adventure) {
    renderAdventureScreen();
  }
  if (typeof render === "function") render();
  openAdvQuickHealModal(window._advAfterQuickHeal);
}

function leaveAdventure(isCleared) {
  if (!S.flags.adventure) {
    closeAdventureScreen();
    return;
  }
  const adv = S.flags.adventure;
  const zone = getAdventureZone(adv.zoneId);
  const zoneName = zone ? zone.name : "历练险地";
  const gains = adv.gains || { exp: 0, stone: 0, items: {} };

  /* 清理历练临时状态并推进时段 */
  S.flags.adventure = null;
  S.flags.adventureLog = null;
  S.flags.adventureCombat = null;
  closeAdventureScreen();
  if (typeof checkAdvanceTimeSlot === "function") {
    checkAdvanceTimeSlot();
  }
  save();
  render();

  const itemEntries = Object.entries(gains.items || {}).filter(([, cnt]) => cnt > 0);
  const hasAnyGain = (gains.exp > 0) || (gains.stone > 0) || itemEntries.length > 0;

  let itemsHtml = "";
  if (itemEntries.length > 0) {
    const chips = itemEntries.map(([id, cnt]) => {
      const it = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id];
      const name = (it && it.name) ? it.name : id;
      const icon = typeof getItemIcon === "function" ? getItemIcon(it, id) : "📦";
      return `<div class="settlement-loot-chip"><span>${icon} ${name}</span><b>×${cnt}</b></div>`;
    }).join("");
    itemsHtml = `<div class="settlement-loot-grid" style="margin-top:8px;">${chips}</div>`;
  }

  const title = isCleared ? `🏆 历练凯旋 · ${zoneName}` : `🌲 历练归来 · ${zoneName}`;
  const bodyHtml = hasAnyGain ? `
    <div class="card">
      <div class="row"><span>历练险地</span><b>${zoneName}${isCleared ? '（已通关）' : ''}</b></div>
      <div class="row"><span>累计修为精进</span><b style="color:#67b7f7;">+${fmt(gains.exp || 0)}</b></div>
      <div class="row"><span>累计收获灵石</span><b style="color:#f5b956;">+${fmt(gains.stone || 0)}</b></div>
    </div>
    ${itemsHtml}
  ` : `
    <p>你从【${zoneName}】全身而退，返回宗门调息。</p>
  `;

  showModal(title, bodyHtml, [
    { label: "收纳战果", primary: true, fn: closeModal },
  ]);
}

/* ============================================================
   生成一层路径树
   ============================================================ */
function generateAdventureLayer(zone, layerConf) {
  const depth = layerConf.depth;             /* 中间层数（不含起始和终点）*/
  const finalType = layerConf.finalType;
  const finalCount = layerConf.finalCount;
  const escapeRate = layerConf.escapeRate !== undefined ? layerConf.escapeRate : 0.4;
  const enemies = layerConf.enemies || [];
  const storageCount = layerConf.storageCount || [1, 2];
  const storagePool = layerConf.storage || [];
  const eventPool = layerConf.events || [];

  /* 生成 layers */
  const layers = [];

  /* 第 0 层：入口 */
  layers.push([{
    id: "n_0_0",
    type: "start",
    name: "险地入口",
    icon: "🚪",
    depth: 0,
    index: 0,
    children: [],
  }]);

  /* 1 ~ depth 层：中间节点 */
  for (let d = 1; d <= depth; d++) {
    const prevLayer = layers[d - 1];
    const thisLayer = [];

    /* 决定本层节点数 */
    const prevCount = prevLayer.length;
    let thisCount = Math.max(2, Math.min(3, prevCount + rndInt(-1, 1)));

    for (let i = 0; i < thisCount; i++) {
      const t = randomNodeType(d, depth);
      const node = {
        id: `n_${d}_${i}`,
        type: t,
        name: "",
        icon: "",
        depth: d,
        index: i,
        children: [],
      };

      fillNodeContent(node, t, { enemies, storagePool, eventPool });
      thisLayer.push(node);
    }

    /* 连接上一层 → 本层（每个父节点连 1~2 个子） */
    prevLayer.forEach((p, pi) => {
      const subCount = rndInt(1, Math.min(2, thisLayer.length));
      const start = pi % thisLayer.length;
      for (let k = 0; k < subCount; k++) {
        const ci = (start + k) % thisLayer.length;
        if (!p.children.includes(ci)) p.children.push(ci);
      }
    });

    /* 保证每个本层节点都有父 */
    thisLayer.forEach((c, ci) => {
      const hasParent = prevLayer.some(p => p.children.includes(ci));
      if (!hasParent) {
        const p = prevLayer[rndInt(0, prevLayer.length - 1)];
        p.children.push(ci);
      }
    });

    layers.push(thisLayer);
  }

  /* 最后一层：传送门 / 出口 */
  const lastLayer = [];
  for (let i = 0; i < finalCount; i++) {
    const isFinal = (finalType === "exit");
    lastLayer.push({
      id: `end_${i}`,
      type: isFinal ? "exit" : "portal",
      name: isFinal ? "秘境出口" : "通往下一层",
      icon: isFinal ? "🏆" : "🌀",
      depth: depth + 1,
      index: i,
      children: [],
    });
  }

  const prevLast = layers[depth];
  prevLast.forEach((p, pi) => {
    const ci = pi % lastLayer.length;
    p.children.push(ci);
  });
  lastLayer.forEach((c, ci) => {
    const hasParent = prevLast.some(p => p.children.includes(ci));
    if (!hasParent) {
      prevLast[rndInt(0, prevLast.length - 1)].children.push(ci);
    }
  });

  layers.push(lastLayer);

  /* 储存袋分配：随机选一些节点改成 storage（不改入口和终点） */
  const storageNum = rndInt(storageCount[0], storageCount[1]);
  const candidateNodes = [];
  for (let d = 1; d <= depth; d++) {
    layers[d].forEach(n => {
      if (n.type !== "storage") candidateNodes.push(n);
    });
  }
  for (let i = 0; i < storageNum && candidateNodes.length > 0; i++) {
    const idx = rndInt(0, candidateNodes.length - 1);
    const n = candidateNodes.splice(idx, 1)[0];
    n.type = "storage";
    n.icon = "🎒";
    n.name = "古修储物袋";
    n.data = { storage: pick(storagePool) };
  }

  /* 存到状态 */
  S.flags.adventure.tree = {
    layers: layers,
    startId: "n_0_0",
    escapeRate: escapeRate,
    layerTitle: layerConf.title,
    layerConf: layerConf,
  };

  /* 进入起点 */
  const startNode = layers[0][0];
  S.flags.adventure.path = [startNode];
  S.flags.adventure.currentNodeId = startNode.id;
  S.flags.adventure.choices = startNode.children.map(i => layers[1][i]);
}

/* 随机节点类型 */
function randomNodeType(depth, totalDepth) {
  const ratio = depth / totalDepth;
  const roll = Math.random();

  if (roll < 0.38 + ratio * 0.14) return "fight";
  if (roll < 0.75 + ratio * 0.08) return "event";
  if (roll < 0.88) return "empty";
  return "storage";
}

/* 填节点内容（赋予具体的妖兽名或奇遇名） */
function fillNodeContent(node, type, pools) {
  switch (type) {
    case "fight": {
      const enemyId = pools.enemies.length > 0
        ? pick(pools.enemies)
        : "e_wolf";
      const enemyDef = typeof getEnemyById === "function" ? getEnemyById(enemyId) : null;
      node.icon = (enemyDef && enemyDef.isBeast === false) ? "🗡️" : "⚔️";
      node.name = enemyDef ? enemyDef.name : "妖兽拦路";
      node.data = { enemyId };
      break;
    }
    case "event": {
      const ev = pools.eventPool.length > 0
        ? pick(pools.eventPool)
        : { text: "你在林间古径缓步前行，吐纳山间清气。", effect: {} };
      const txt = ev.text || "";
      if (txt.includes("采") || txt.includes("草") || txt.includes("花") || txt.includes("芝")) {
        node.icon = "🌿";
        node.name = "灵草机缘";
      } else if (txt.includes("石") || txt.includes("匣") || txt.includes("搜")) {
        node.icon = "💎";
        node.name = "古修遗宝";
      } else {
        node.icon = "✨";
        node.name = "险地悟道";
      }
      node.data = { event: ev };
      break;
    }
    case "empty": {
      node.icon = "🪨";
      node.name = "幽静石径";
      node.data = {};
      break;
    }
    case "storage": {
      node.icon = "🎒";
      node.name = "古修储物袋";
      node.data = { storage: pools.storagePool && pools.storagePool.length > 0 ? pick(pools.storagePool) : { type: "stone", amount: [20, 50] } };
      break;
    }
    default:
      node.icon = "🪨";
      node.name = "未知秘径";
      node.data = {};
  }
}

/* ============================================================
   玩家选择
   ============================================================ */
function adventureChoose(choiceIdx) {
  const adv = S.flags.adventure;
  if (!adv) return;

  const choice = adv.choices[choiceIdx];
  if (!choice) return;

  /* 前进 */
  adv.path.push(choice);
  adv.currentNodeId = choice.id;

  /* 刷新 choices */
  const tree = adv.tree;
  const nextLayer = tree.layers[choice.depth + 1];
  if (nextLayer) {
    adv.choices = choice.children.map(i => nextLayer[i]).filter(Boolean);
  } else {
    adv.choices = [];
  }

  /* 触发事件 */
  adventureTriggerNode(choice);

  save();
  renderAdventureScreen();
}

/* ============================================================
   触发节点事件
   ============================================================ */
function adventureTriggerNode(node) {
  switch (node.type) {
    case "fight": {
      const enemyId = node.data.enemyId;
      const enemyDef = typeof getEnemyById === "function" ? getEnemyById(enemyId) : null;
      const enemyName = enemyDef ? enemyDef.name : node.name;
      const realmName = (enemyDef && REALMS[enemyDef.realm || 0]) ? REALMS[enemyDef.realm || 0].name : "炼气";
      const realmBadge = enemyDef ? `${realmName}·${enemyDef.sub || 1}重` : "凶兽";
      const escapeRate = S.flags.adventure.tree.escapeRate || 0.4;
      const canFlee = chance(escapeRate);

      showModal(`⚔️ 遭遇拦路 · ${enemyName}`, `
        <div class="card" style="margin-bottom:8px;">
          <div class="row"><span>拦路对手</span><b>${enemyName}</b></div>
          <div class="row"><span>对手境界</span><b style="color:#f5b956;">${realmBadge}</b></div>
          ${enemyDef && enemyDef.isBeast && enemyDef.realm === 1 && enemyDef.sub === 1
            ? `<div class="row"><span>灵兽机缘</span><b style="color:#7fd694;">🐾 可在战斗中施展【驯】收服</b></div>`
            : ""}
        </div>
        ${canFlee
          ? `<p class="small" style="color:var(--c-good);">对手尚未察觉你的气机，你可正面迎战，亦可敛息绕行。</p>`
          : `<p class="small" style="color:var(--c-bad);">对手杀机已锁定于你，退路被封，唯有一战！</p>`}
      `, [
        { label: "⚔️ 拔剑迎战", primary: true, fn: () => {
          closeModal();
          startAdventureBattle(enemyId);
        }},
        canFlee ? { label: "💨 敛息绕开", fn: () => {
          closeModal();
          adventureLog(`你借地势收敛气息，巧妙绕开了【${enemyName}】。`, "dim");
          renderAdventureScreen();
        }} : null,
      ].filter(Boolean));
      break;
    }

    case "event": {
      const ev = node.data.event || { text: "你在林间调息片刻。", effect: {} };
      const effect = ev.effect || {};
      const detail = [];

      if (effect.mat) {
        for (const baseId in effect.mat) {
          const count = effect.mat[baseId];
          const gradeRange = effect.gradeRange || [1, 1];
          const grade = rndInt(gradeRange[0], gradeRange[1]);
          const itemId = baseId + "_" + grade;
          addItem(itemId, count);
          recordAdventureGain({ itemId, count });
          const itObj = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
          const displayName = (itObj && itObj.name) ? itObj.name : `${baseId}（${grade}品）`;
          detail.push(`${displayName} ×${count}`);
        }
      }
      if (effect.stone) {
        S.stone += effect.stone;
        recordAdventureGain({ stone: effect.stone });
        detail.push(`灵石 +${effect.stone}`);
      }
      if (effect.exp) {
        if (typeof gainCultivationExp === "function") gainCultivationExp(effect.exp);
        else S.exp = (S.exp || 0) + effect.exp;
        recordAdventureGain({ exp: effect.exp });
        detail.push(`修为 +${effect.exp}`);
      }
      if (effect.item) {
        for (const id in effect.item) {
          const finalId = resolveAdventureItemId(id);
          const cnt = effect.item[id];
          addItem(finalId, cnt);
          recordAdventureGain({ itemId: finalId, count: cnt });
          const itObj = (typeof getItem === "function" ? getItem(finalId) : null) || ITEMS[finalId];
          detail.push(`${itObj ? itObj.name : finalId} ×${cnt}`);
        }
      }

      adventureLog(ev.text, "blue");
      if (detail.length > 0) {
        adventureLog(`机缘收获：${detail.join(" · ")}`, "good");
      }
      renderAdventureScreen();
      break;
    }

    case "empty":
      adventureLog(`行经【${node.name}】，四周风平浪静，你稍作调息继续前行。`, "dim");
      renderAdventureScreen();
      break;

    case "storage": {
      const storage = node.data.storage || { type: "stone", amount: [20, 50] };
      const detail = [];
      grantStorageReward(storage, detail);
      adventureLog(`拾获古修遗留的储物袋：${detail.join("、")}！`, "gold");
      renderAdventureScreen();
      break;
    }

    case "portal": {
      const adv = S.flags.adventure;
      const zone = adv ? getAdventureZone(adv.zoneId) : null;
      const nextLayerConf = zone ? zone.layers.find(l => l.layer === (adv.layer + 1)) : null;
      showModal("🌀 秘境传送古阵", `
        <p>前方出现一座灵光流转的古传送阵，通往更深层的险境${nextLayerConf ? `【<b>${nextLayerConf.title}</b>】` : ""}。</p>
        <p class="small" style="color:var(--text-dim);">深层妖物更为强横，但机缘储物袋与灵材品阶亦随之提升。</p>
      `, [
        { label: "留在当前层", fn: closeModal },
        { label: "🌀 踏入下一层", primary: true, fn: () => {
          closeModal();
          adventureGoToNextLayer();
        }},
      ]);
      break;
    }

    case "exit": {
      const zId = S.flags.adventure && S.flags.adventure.zoneId;
      const zObj = zId ? getAdventureZone(zId) : null;
      let clearBonusText = "";
      if (zId && zObj) {
        if (!S.flags.dungeonsCleared) S.flags.dungeonsCleared = {};
        const isFirstClear = !S.flags.dungeonsCleared[zId];
        S.flags.dungeonsCleared[zId] = true;

        /* 每次抵达关底出口皆可获通关历练感悟与灵石赏赐，首通翻倍 */
        const baseExp = Math.max(80, (zObj.realmMin + 1) * 120) * (isFirstClear ? 2 : 1);
        const baseStone = Math.max(60, (zObj.realmMin + 1) * 100) * (isFirstClear ? 2 : 1);
        if (typeof gainCultivationExp === "function") gainCultivationExp(baseExp);
        else S.exp = (S.exp || 0) + baseExp;
        S.stone += baseStone;
        recordAdventureGain({ exp: baseExp, stone: baseStone });

        clearBonusText = `${isFirstClear ? "🎉 首通秘宝加持" : "✨ 通关嘉奖"}：修为 +${baseExp} · 灵石 +${baseStone}`;
        adventureLog(`抵达【${zObj.name}】深处出口！${clearBonusText}`, "gold");
        if (isFirstClear) {
          log(`【秘境首通】你成功打通了【${zObj.name}】，获首通厚赏！`, "c-gold");
        }
      }
      showModal("🏆 抵达历练出口 · 圆满通关", `
        <p>你已穿行至【${zObj ? zObj.name : "历练险地"}】最深处出口，圆满完成此次历练！</p>
        ${clearBonusText ? `<div class="card"><b style="color:var(--text-gold);">${clearBonusText}</b></div>` : ""}
        <p class="small" style="color:var(--text-dim);">点击【凯旋结算】即可携全部历练收获返回。</p>
      `, [
        { label: "稍作停留", fn: closeModal },
        { label: "🏆 凯旋结算离开", primary: true, fn: () => {
          closeModal();
          leaveAdventure(true);
        }},
      ]);
      break;
    }
  }
}

/* 解析并注册可能带品级的丹药 ID（例如 "回春丹_1阶_2品" 或 "筑基丹_3品"） */
function resolveAdventureItemId(rawId) {
  if (!rawId) return rawId;
  if (typeof getOrCreatePillItem === "function") {
    const m = rawId.match(/^(.+)_([0-5])品$/);
    if (m) {
      const created = getOrCreatePillItem(m[1], parseInt(m[2], 10));
      if (created) {
        ITEMS[rawId] = created;
        return created.id || rawId;
      }
    }
    if (ITEMS[rawId] && ITEMS[rawId].type === "pillTemplate") {
      const created = getOrCreatePillItem(rawId, 2);
      if (created) return created.id || (rawId + "_2品");
    }
  }
  if (ITEMS[rawId] && ITEMS[rawId].id) {
    return ITEMS[rawId].id;
  }
  if (typeof getItem === "function") {
    const it = getItem(rawId);
    if (it) return it.id || rawId;
  }
  return rawId;
}

/* 发放储存袋奖励 */
function grantStorageReward(storage, detail) {
  if (storage.type === "stone") {
    const amount = rndInt(storage.amount[0], storage.amount[1]);
    S.stone += amount;
    recordAdventureGain({ stone: amount });
    detail.push(`灵石 +${amount}`);
  } else if (storage.type === "mat") {
    const grade = rndInt(storage.gradeRange[0], storage.gradeRange[1]);
    const itemId = storage.baseId + "_" + grade;
    addItem(itemId, storage.count);
    recordAdventureGain({ itemId, count: storage.count });
    const itObj = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
    const displayName = (itObj && itObj.name) ? itObj.name : `${storage.baseId}（${grade}品）`;
    detail.push(`${displayName} ×${storage.count}`);
  } else if (storage.type === "item") {
    const finalId = resolveAdventureItemId(storage.id);
    addItem(finalId, storage.count);
    recordAdventureGain({ itemId: finalId, count: storage.count });
    const it = (typeof getItem === "function" ? getItem(finalId) : null) || ITEMS[finalId];
    const name = it ? it.name : finalId;
    detail.push(`${name} ×${storage.count}`);
  }
}

/* ============================================================
   进入下一层
   ============================================================ */
function adventureGoToNextLayer() {
  const adv = S.flags.adventure;
  if (!adv) return;
  const zone = getAdventureZone(adv.zoneId);
  if (!zone) return;

  const nextLayer = adv.layer + 1;
  const layerConf = zone.layers.find(l => l.layer === nextLayer);
  if (!layerConf) {
    log(`【${zone.name}】没有更多层了。`, "c-bad");
    return;
  }

  adv.layer = nextLayer;
  generateAdventureLayer(zone, layerConf);
  adventureLog(`你踏过传送阵，深入【${layerConf.title}】。`, "gold");
  save();
  renderAdventureScreen();
}

/* ============================================================
   战斗：进入战斗后返回
   ============================================================ */
function startAdventureBattle(enemyId) {
  S.flags.adventureCombat = {
    enemyId: enemyId,
    returnTo: "adventure",
  };
  startBattle([{ enemyId: enemyId }]);
}

/* ============================================================
   日志（临时用 S.flags.adventureLog）
   ============================================================ */
function adventureLog(text, cls) {
  if (!S.flags.adventureLog) S.flags.adventureLog = [];
  S.flags.adventureLog.push({ text, cls });
  if (S.flags.adventureLog.length > 50) S.flags.adventureLog.shift();
}

/* ============================================================
   UI 交互：打开 / 关闭冒险界面
   ============================================================ */
function openAdventureScreen() {
  if (typeof renderAdventureScreen === "function") {
    renderAdventureScreen();
  }
  const el = document.getElementById("adventureScreen");
  if (el) {
    el.style.display = "flex";
    el.style.zIndex = "2400";
  }
}

function closeAdventureScreen() {
  const el = document.getElementById("adventureScreen");
  if (el) el.style.display = "none";
}
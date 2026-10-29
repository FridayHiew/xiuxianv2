/* ============================================================
   ui/battle.js - 全屏战斗界面（含五行/功法光影、粒子特效与震屏反馈）
   ============================================================ */

let _pendingBattleAction = null;

const TARGET_LABEL = {
  enemySingle: "敌单",
  enemyAll: "敌全",
  allySingle: "我单",
  allyAll: "我全",
  all: "全体",
};

/* ============================================================
   功法与法术专属五行/属性光影配色配置
   ============================================================ */
const ELEMENT_VFX_PALETTES = {
  jin: {
    key: "jin",
    name: "庚金凛冽",
    short: "金",
    icon: "⚔️",
    primary: "#ffd966",
    secondary: "#fff5cc",
    glow: "rgba(255, 217, 102, 0.62)",
    softGlow: "rgba(255, 217, 102, 0.22)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(96, 74, 20, 0.58) 0%, #120d06 62%, #050402 100%)",
    bannerTint: "linear-gradient(135deg, rgba(84, 64, 18, 0.92), rgba(24, 17, 8, 0.96))",
    particles: ["✦", "⚔", "✧", "✴"],
    freq: 660,
  },
  mu: {
    key: "mu",
    name: "乙木生机",
    short: "木",
    icon: "🌿",
    primary: "#5ce68b",
    secondary: "#c8fadc",
    glow: "rgba(92, 230, 139, 0.58)",
    softGlow: "rgba(92, 230, 139, 0.22)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(20, 74, 38, 0.58) 0%, #09120b 62%, #030604 100%)",
    bannerTint: "linear-gradient(135deg, rgba(18, 62, 32, 0.92), rgba(10, 22, 13, 0.96))",
    particles: ["🍃", "✦", "❀", "✧"],
    freq: 528,
  },
  shui: {
    key: "shui",
    name: "玄水沧澜",
    short: "水",
    icon: "💧",
    primary: "#4db8ff",
    secondary: "#c4e8ff",
    glow: "rgba(77, 184, 255, 0.60)",
    softGlow: "rgba(77, 184, 255, 0.22)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(16, 58, 94, 0.60) 0%, #070e16 62%, #030508 100%)",
    bannerTint: "linear-gradient(135deg, rgba(16, 48, 78, 0.92), rgba(8, 18, 30, 0.96))",
    particles: ["💧", "✦", "🫧", "✧"],
    freq: 440,
  },
  huo: {
    key: "huo",
    name: "离火焚天",
    short: "火",
    icon: "🔥",
    primary: "#ff6638",
    secondary: "#ffd280",
    glow: "rgba(255, 102, 56, 0.65)",
    softGlow: "rgba(255, 102, 56, 0.25)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(98, 30, 14, 0.62) 0%, #160805 62%, #070302 100%)",
    bannerTint: "linear-gradient(135deg, rgba(86, 26, 12, 0.92), rgba(28, 10, 6, 0.96))",
    particles: ["🔥", "✦", "✴", "✧"],
    freq: 587,
  },
  tu: {
    key: "tu",
    name: "厚土乾坤",
    short: "土",
    icon: "⛰️",
    primary: "#e0a960",
    secondary: "#f7dfc0",
    glow: "rgba(224, 169, 96, 0.58)",
    softGlow: "rgba(224, 169, 96, 0.22)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(78, 52, 24, 0.58) 0%, #140d07 62%, #060402 100%)",
    bannerTint: "linear-gradient(135deg, rgba(68, 44, 20, 0.92), rgba(22, 14, 8, 0.96))",
    particles: ["❖", "✦", "⬟", "✧"],
    freq: 392,
  },
  lei: {
    key: "lei",
    name: "九霄紫雷",
    short: "雷",
    icon: "⚡",
    primary: "#c280ff",
    secondary: "#eed6ff",
    glow: "rgba(194, 128, 255, 0.68)",
    softGlow: "rgba(194, 128, 255, 0.26)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(64, 24, 102, 0.62) 0%, #100718 62%, #050208 100%)",
    bannerTint: "linear-gradient(135deg, rgba(54, 20, 86, 0.92), rgba(18, 8, 30, 0.96))",
    particles: ["⚡", "✦", "✴", "✧"],
    freq: 784,
  },
  bing: {
    key: "bing",
    name: "极寒玄冰",
    short: "冰",
    icon: "❄️",
    primary: "#7ce8ff",
    secondary: "#e6fcff",
    glow: "rgba(124, 232, 255, 0.62)",
    softGlow: "rgba(124, 232, 255, 0.24)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(20, 68, 86, 0.60) 0%, #071116 62%, #030608 100%)",
    bannerTint: "linear-gradient(135deg, rgba(18, 56, 72, 0.92), rgba(8, 20, 26, 0.96))",
    particles: ["❄️", "✦", "❖", "✧"],
    freq: 698,
  },
  xue: {
    key: "xue",
    name: "幽冥血煞",
    short: "魔",
    icon: "🩸",
    primary: "#ff3b5c",
    secondary: "#ffbdca",
    glow: "rgba(255, 59, 92, 0.65)",
    softGlow: "rgba(255, 59, 92, 0.25)",
    bgTint: "radial-gradient(circle at 50% 22%, rgba(86, 14, 28, 0.62) 0%, #140508 62%, #060203 100%)",
    bannerTint: "linear-gradient(135deg, rgba(74, 12, 24, 0.92), rgba(24, 6, 10, 0.96))",
    particles: ["🩸", "✦", "✴", "✧"],
    freq: 330,
  },
  neutral: {
    key: "neutral",
    name: "玄元真气",
    short: "玄",
    icon: "☯️",
    primary: "#e8c478",
    secondary: "#fff2cf",
    glow: "rgba(232, 196, 120, 0.52)",
    softGlow: "rgba(232, 196, 120, 0.18)",
    bgTint: "radial-gradient(circle at 50% 25%, #22170c 0%, #0d0905 60%, #050402 100%)",
    bannerTint: "linear-gradient(135deg, #2b1d0e, #140e08)",
    particles: ["✦", "✧", "☯", "✴"],
    freq: 523,
  },
};

function getElementPalette(key) {
  return ELEMENT_VFX_PALETTES[key] || ELEMENT_VFX_PALETTES.neutral;
}

/* 解析心法对应的属性光影 */
function getArtElementKey(art) {
  if (!art) return "neutral";
  if (art.element && ELEMENT_VFX_PALETTES[art.element]) return art.element;
  const n = String(art.name || "");
  if (n.includes("火") || n.includes("炎") || n.includes("阳") || n.includes("丹霞")) return "huo";
  if (n.includes("冰") || n.includes("寒") || n.includes("雪") || n.includes("霜")) return "bing";
  if (n.includes("雷") || n.includes("电") || n.includes("紫霄")) return "lei";
  if (n.includes("剑") || n.includes("金") || n.includes("青云")) return "jin";
  if (n.includes("木") || n.includes("春") || n.includes("长生") || n.includes("药")) return "mu";
  if (n.includes("水") || n.includes("合欢") || n.includes("沧") || n.includes("海")) return "shui";
  if (n.includes("土") || n.includes("万兽") || n.includes("山") || n.includes("岩")) return "tu";
  if (art.type === "魔" || n.includes("血") || n.includes("魔") || n.includes("冥") || n.includes("煞")) return "xue";
  return "neutral";
}

/* 解析作战单位的属性光影 */
function getUnitElementKey(unit) {
  if (!unit) return "neutral";
  if (unit.element && ELEMENT_VFX_PALETTES[unit.element]) {
    return unit.element;
  }
  if (unit.isPlayer) {
    const art = typeof getCurrentArt === "function" ? getCurrentArt() : null;
    const artElem = getArtElementKey(art);
    if (artElem !== "neutral") return artElem;
    /* 若心法为无属性，取玩家最高灵根或元素等级 */
    if (S && S.elementLvl) {
      let bestK = null, bestV = 0;
      for (const k in S.elementLvl) {
        if (S.elementLvl[k] > bestV && ELEMENT_VFX_PALETTES[k]) {
          bestV = S.elementLvl[k];
          bestK = k;
        }
      }
      if (bestK) return bestK;
    }
    return "neutral";
  }
  if (unit.isPet && S && S.pets && Array.isArray(S.pets.list)) {
    const pet = S.pets.list.find(p => p.uid === unit.petUid);
    if (pet && typeof getPetBloodline === "function") {
      const bl = getPetBloodline(pet.bloodline);
      if (bl && bl.element && ELEMENT_VFX_PALETTES[bl.element]) return bl.element;
      if (pet.bloodline === "xue") return "xue";
    }
  }
  /* 敌方或灵宠单位按名字、ID、抗性或异常状态推断专属属性光影 */
  const name = String(unit.name || "");
  const id = String(unit.defId || unit.id || "");
  const inflict = unit.attackInflict || {};
  const resist = unit.resistances || {};
  if (/冰|寒|霜|雪|冻|凛/.test(name) || /frost|ice|snow/.test(id) || inflict.freeze || (resist.freeze && resist.freeze >= 60)) return "bing";
  if (/火|炎|赤|丹霞|阳|烈|焚|熔/.test(name) || /fire|flame|danxia/.test(id) || inflict.burn || (resist.burn && resist.burn >= 50)) return "huo";
  if (/雷|电|霆|紫电|冤魂|惊蛰/.test(name) || /thunder|lightning|wraith/.test(id)) return "lei";
  if (/毒|蛛|蛇|木|草|藤|花|竹|芝|蝎|守宫|鹿|蜂|蝶|雀|兔/.test(name) || inflict.poison) return "mu";
  if (/水|潭|蟾|蛟|泽|溪|浪|露|渊/.test(name)) return "shui";
  if (/石|岩|熊|山|穿山甲|猪|猿|猢狲|虫|铁甲|碑|流寇|当家/.test(name)) return "tu";
  if (/血|魔|煞|尸|骨|鬼|残剑|邪|狂乱/.test(name)) return "xue";
  if (/剑|刀|狼|豹|虎|鹰|猬|针|金|兵|斥候|暗哨|战傀/.test(name)) return "jin";
  return unit.isPet ? "jin" : "xue";
}

/* 解析单位的功法/妖丹名称与光影元数据（敌我通用） */
function getUnitArtInfo(unit) {
  const elemKey = getUnitElementKey(unit);
  const palette = getElementPalette(elemKey);

  if (!unit || unit.isPlayer) {
    const currentArt = (typeof getCurrentArt === "function" && S) ? getCurrentArt() : null;
    return {
      elementKey: elemKey,
      palette,
      artName: (currentArt && currentArt.name) || "引气吐纳诀",
      roleLabel: "我方功法",
    };
  }

  if (unit.isPet) {
    return {
      elementKey: elemKey,
      palette,
      artName: unit.artName || "通灵伴生诀",
      roleLabel: "灵宠血脉",
    };
  }

  const fallbackArtMap = {
    jin:  unit.isBeast ? "庚金裂爪妖诀" : "太白庚金剑诀",
    mu:   unit.isBeast ? "青木蚀骨妖典" : "万木化生真诀",
    shui: unit.isBeast ? "玄水覆海妖功" : "沧溟玄水真诀",
    huo:  unit.isBeast ? "离火焚脉妖诀" : "丹霞明火心法",
    tu:   unit.isBeast ? "戊土撼岳妖身" : "黑风磐石霸体",
    lei:  unit.isBeast ? "紫电惊蛰妖法" : "九霄引雷真诀",
    bing: unit.isBeast ? "玄冰凝魄妖诀" : "寒潭玄冰剑诀",
    xue:  unit.isBeast ? "天妖血煞真功" : "血炼魔煞心经",
  };

  return {
    elementKey: elemKey,
    palette,
    artName: unit.artName || fallbackArtMap[elemKey] || "玄阴煞气诀",
    roleLabel: unit.isBeast ? "敌方妖丹" : "敌方功法",
  };
}

/* 解析法术对应的属性光影 */
function getSpellElementKey(spell, caster) {
  if (!spell) return getUnitElementKey(caster);
  if (spell.elementReq) {
    for (const k in spell.elementReq) {
      if (ELEMENT_VFX_PALETTES[k]) return k;
    }
  }
  if (spell.inflict) {
    if (spell.inflict.burn) return "huo";
    if (spell.inflict.freeze) return "bing";
    if (spell.inflict.poison) return "mu";
    if (spell.inflict.bleed) return "jin";
    if (spell.inflict.stun) return "lei";
  }
  const n = String(spell.name || "");
  if (n.includes("火") || n.includes("焰") || n.includes("焚")) return "huo";
  if (n.includes("冰") || n.includes("霜") || n.includes("寒")) return "bing";
  if (n.includes("雷") || n.includes("电")) return "lei";
  if (n.includes("剑") || n.includes("刀") || n.includes("斩")) return "jin";
  if (n.includes("木") || n.includes("毒")) return "mu";
  if (n.includes("水") || n.includes("澜")) return "shui";
  if (n.includes("土") || n.includes("山") || n.includes("崩")) return "tu";
  return getUnitElementKey(caster);
}

/* 解析武技招式对应的属性光影（敌我双方均继承自身功法属性光影） */
function getSkillElementKey(sk, caster) {
  if (!sk) return getUnitElementKey(caster);
  if (sk.id === "sk_sacrifice") return "xue";
  const casterElem = getUnitElementKey(caster);
  if (casterElem && casterElem !== "neutral") return casterElem;
  if (sk.type === "剑" || sk.type === "刀") return "jin";
  if (sk.type === "拳" || sk.type === "棍") return "tu";
  if (sk.type === "掌") return "shui";
  if (sk.type === "鞭") return "mu";
  if (sk.type === "兽") return "huo";
  return casterElem || "neutral";
}


function renderBattle() {
  if (!battle) return;

  const container = document.getElementById("battleScreen");
  if (!container) return;

  /* 保护尚未播放完毕的全屏特效与单位受击特效，避免回合切换重绘时被提前抹除 */
  const preservedOverlayNodes = [];
  const oldOverlay = document.getElementById("battleVfxOverlay");
  if (oldOverlay && oldOverlay.children && oldOverlay.children.length > 0) {
    Array.from(oldOverlay.children).forEach(child => preservedOverlayNodes.push(child));
  }
  const preservedUnitVfx = {};
  if (typeof container.querySelectorAll === "function") {
    const unitEls = container.querySelectorAll(".battle-unit");
    Array.from(unitEls).forEach(uEl => {
      const uid = uEl.getAttribute("data-unit-id");
      if (!uid) return;
      const vfxChildren = uEl.querySelectorAll(".battle-unit-vfx-layer, .battle-float-dmg, .battle-caster-callout");
      if (vfxChildren && vfxChildren.length > 0) {
        preservedUnitVfx[uid] = Array.from(vfxChildren);
      }
    });
  }

  const current = battle.order[battle.currentIdx];
  const isPlayerTurn = current && current.isPlayer;

  /* 1. 解析我方与敌方功法属性光影 */
  const playerUnit = battle.units.find(u => u.isPlayer) || { isPlayer: true };
  const playerArtInfo = getUnitArtInfo(playerUnit);
  const playerPal = playerArtInfo.palette;

  const focusEnemy = (current && current.side === "enemy" && current.alive ? current : null)
    || (battle.lastActorSide === "enemy" ? battle.units.find(u => u.id === battle.lastActorId && u.side === "enemy") : null)
    || battle.units.find(u => u.side === "enemy" && u.alive && !u.escaped && !u.tamed)
    || battle.units.find(u => u.side === "enemy");
  const enemyArtInfo = focusEnemy ? getUnitArtInfo(focusEnemy) : null;
  const enemyPal = enemyArtInfo ? enemyArtInfo.palette : getElementPalette("xue");

  /* 当敌方行动或敌方正在释放法术/暴击特效时，主战场光影动态切换为敌方功法配色 */
  const hasEnemyVfxInQueue = Array.isArray(battle.vfxQueue) && battle.vfxQueue.some(e => e && e.attackerSide === "enemy");
  const isEnemyFocus = (!isPlayerTurn && current && current.side === "enemy") || hasEnemyVfxInQueue;
  const activePal = isEnemyFocus ? enemyPal : playerPal;

  container.style.setProperty("--battle-elem-primary", activePal.primary);
  container.style.setProperty("--battle-elem-secondary", activePal.secondary);
  container.style.setProperty("--battle-elem-glow", activePal.glow);
  container.style.setProperty("--battle-elem-soft", activePal.softGlow);
  /* 顶部笼罩敌方功法灵光，底部升腾我方功法灵光，底层铺陈青绿仙山云海画卷 */
  container.style.background = `
    radial-gradient(circle at 50% 10%, ${enemyPal.softGlow} 0%, transparent 46%),
    radial-gradient(circle at 50% 88%, ${playerPal.softGlow} 0%, transparent 50%),
    linear-gradient(180deg, rgba(22, 43, 39, 0.84) 0%, rgba(28, 52, 47, 0.80) 52%, rgba(19, 36, 33, 0.90) 100%),
    url("./src/assets/images/xiantu_qinglv_scroll.svg") center center / cover no-repeat
  `;

  const enemyUnits = battle.units.filter(u => u.side === "enemy" && !u.recalled);
  const playerUnits = battle.units.filter(u => u.side === "player" && !u.recalled);

  let html = `<div class="battle-qinglv-backdrop"></div>`;
  html += `<div id="battleVfxOverlay" class="battle-vfx-overlay"></div>`;
  html += `<div class="battle-field-body">`;

  html += `<div class="battle-side">
    <h4 class="battle-side-title">
      <span>👹 敌方阵营 · 第 ${battle.round} 回合</span>
      ${enemyArtInfo ? `<span class="battle-side-elem" style="color:${enemyPal.primary};">${enemyPal.icon} ${enemyPal.name}</span>` : ""}
    </h4>
    <div class="battle-units-grid ${enemyUnits.length > 1 ? "multi-units" : ""}">`;
  enemyUnits.forEach(u => {
    html += renderBattleUnit(u);
  });
  html += `</div></div>`;

  html += `<div class="battle-side">
    <h4 class="battle-side-title">
      <span>🛡️ 我方阵营</span>
      <span class="battle-side-elem" style="color:${playerPal.primary};">${playerPal.icon} ${playerPal.name}</span>
    </h4>
    <div class="battle-units-grid ${playerUnits.length > 1 ? "multi-units" : ""}">`;
  playerUnits.forEach(u => {
    html += renderBattleUnit(u);
  });
  html += `</div></div>`;

  html += `</div>`;

  /* 攻击选项固定保留在底部位置，不在战斗动画或敌方回合时收起；底部不显示战斗日志条 */
  const actionsLocked = !(isPlayerTurn && !battle.animating);
  html += renderBattleActions(current, actionsLocked);

  container.innerHTML = html;
  container.style.display = "flex";
  container.classList.add("show");

  /* 恢复重绘前尚未结束的全屏与单位粒子动画 */
  const newOverlay = document.getElementById("battleVfxOverlay");
  if (newOverlay && preservedOverlayNodes.length > 0) {
    preservedOverlayNodes.forEach(node => newOverlay.appendChild(node));
  }
  for (const uid in preservedUnitVfx) {
    const targetUnitEl = document.getElementById("battle-unit-" + uid);
    if (targetUnitEl && Array.isArray(preservedUnitVfx[uid])) {
      preservedUnitVfx[uid].forEach(node => targetUnitEl.appendChild(node));
    }
  }

  /* 立即播放本回合累积的法术命中、暴击震屏与属性粒子特效 */
  flushBattleVfxQueue();
}

function renderBattleUnit(u) {
  if (!u || u.recalled) return "";
  const hpPct = Math.max(0, u.hp / u.hpMax * 100);
  const mpPct = u.mpMax > 0 ? Math.max(0, u.mp / u.mpMax * 100) : 0;
  const realmText = u.realm === 0 ? "凡人" : `${REALMS[u.realm]?.name || '修者'}·${u.sub}重`;
  const dead = !u.alive || u.escaped || u.tamed;
  const status = u.escaped ? "（遁）" : u.tamed ? "（契）" : !u.alive ? "（陨）" : "";

  const artInfo = getUnitArtInfo(u);
  const unitPal = artInfo.palette;
  const currentActor = battle && battle.order ? battle.order[battle.currentIdx] : null;
  const isActing = !dead && ((currentActor && currentActor.id === u.id) || (battle && battle.lastActorId === u.id));

  let statusHtml = "";
  if (u.statuses && u.statuses.length > 0) {
    statusHtml = `<span class="statuses">` + u.statuses.map(s => {
      const def = getStatusDef(s.id);
      if (!def) return "";
      const stack = s.stacks > 1 ? `×${s.stacks}` : "";
      return `<span class="status-icon" title="${def.name}（${s.turns}回合）">${def.icon}${stack}</span>`;
    }).join("") + `</span>`;
  }

  const icon = u.isPlayer ? "🗡️" : (u.isPet ? "🐾" : (typeof getPetOrAllyIcon === "function" ? getPetOrAllyIcon(u) : (u.isBeast ? "🐺" : "👹")));
  const elemTag = `<span class="unit-elem-orb" style="color:${unitPal.primary}; border-color:${unitPal.primary}88; background:${unitPal.softGlow};" title="${unitPal.name}">${unitPal.icon}${unitPal.short}</span>`;

  /* 敌我双方单位卡片均赋予专属属性边框与光晕（当前行动者光影更盛） */
  const cardStyle = dead
    ? ""
    : `border-color:${unitPal.primary}${isActing ? "" : "aa"}; box-shadow:0 0 ${isActing ? "10px" : "6px"} ${unitPal.softGlow}, inset 0 0 ${isActing ? "10px" : "6px"} ${unitPal.softGlow};`;

  const ambientPos = u.side === "enemy" ? "15% 20%" : "88% 20%";

  return `<div id="battle-unit-${u.id}" data-unit-id="${u.id}" class="battle-unit ${dead ? "dead" : ""} ${u.isPlayer ? "player" : ""} ${u.isPet ? "pet-unit" : ""} ${u.side === "enemy" ? "enemy-unit" : ""} ${isActing ? "acting-unit" : ""}" style="${cardStyle}">
    <div class="unit-ambient-glow" style="background:radial-gradient(circle at ${ambientPos}, ${unitPal.softGlow}, transparent 68%);"></div>
    <div class="battle-unit-head">
      <div class="battle-unit-ident">
        <span class="battle-unit-icon">${icon}</span>
        <b class="battle-unit-name" style="color:${unitPal.primary}; text-shadow:0 0 5px ${unitPal.softGlow};">${u.name}</b>
        ${elemTag}
        ${statusHtml}
      </div>
      <span class="battle-unit-realm">${realmText}${status}</span>
    </div>
    <div class="bar-row battle-bar-row">
      <span class="label battle-bar-label hp">气血</span>
      <div class="bar-wrap battle-bar-wrap"><div class="bar-fill bar-hp" style="width:${hpPct}%; background:linear-gradient(90deg, #b8261e, #ff5252); transition:width 0.4s ease-out;"></div>
        <div class="bar-text battle-bar-text">${Math.floor(u.hp)}/${u.hpMax}</div></div>
    </div>
    ${u.mpMax > 0 ? `<div class="bar-row battle-bar-row">
      <span class="label battle-bar-label mp" style="color:${unitPal.primary};">灵力</span>
      <div class="bar-wrap battle-bar-wrap"><div class="bar-fill bar-mp" style="width:${mpPct}%; background:linear-gradient(90deg, #1f5f8b, ${unitPal.primary}); transition:width 0.4s ease-out;"></div>
        <div class="bar-text battle-bar-text">${Math.floor(u.mp)}/${u.mpMax}</div></div>
    </div>` : ""}
  </div>`;
}

/* ============================================================
   战斗视觉特效引擎：震屏、水墨刀光剑影、五行八卦符箓与法宝助阵（敌我双端完备）
   ============================================================ */

function flushBattleVfxQueue() {
  if (!battle || !Array.isArray(battle.vfxQueue) || battle.vfxQueue.length === 0) return;
  const queue = battle.vfxQueue.slice();
  battle.vfxQueue = [];

  queue.forEach((evt, idx) => {
    if (idx === 0) {
      playSingleBattleVfx(evt);
    } else {
      setTimeout(() => playSingleBattleVfx(evt), idx * 160);
    }
  });
}

function playSingleBattleVfx(evt) {
  if (!evt) return;
  const screen = document.getElementById("battleScreen");
  if (!screen) return;

  const pal = getElementPalette(evt.element || "neutral");
  const isCrit = !!evt.crit;
  const isSpellOrSkill = evt.kind === "spell" || evt.kind === "skill";
  const isHeal = evt.kind === "heal";
  const isSummon = evt.kind === "summon";
  const isEnemyAttacker = evt.attackerSide === "enemy" || (typeof evt.attackerId === "string" && evt.attackerId.startsWith("enemy_"));

  /* 0. 施法者/攻击者自身功法光影迸发与突进动画（敌我双方皆触发） */
  if (evt.attackerId) {
    const attackerEl = document.getElementById("battle-unit-" + evt.attackerId);
    if (attackerEl) {
      const lungeClass = isEnemyAttacker ? "vfx-lunge-down" : "vfx-lunge-up";
      attackerEl.style.setProperty("--caster-glow-color", pal.primary);
      attackerEl.classList.remove("vfx-lunge-down", "vfx-lunge-up", "vfx-caster-surge");
      void attackerEl.offsetWidth;
      attackerEl.classList.add(lungeClass, "vfx-caster-surge");
      setTimeout(() => {
        attackerEl.classList.remove(lungeClass, "vfx-caster-surge");
      }, 520);

      spawnCasterAuraEffect(attackerEl, pal, evt);
    }
  }

  /* 1. 触发屏幕震动效果 */
  if (!isHeal) {
    const shakeClass = isCrit
      ? "battle-shake-crit"
      : isSpellOrSkill
      ? "battle-shake-spell"
      : "battle-shake-light";
    screen.classList.remove("battle-shake-light", "battle-shake-spell", "battle-shake-crit");
    void screen.offsetWidth;
    screen.classList.add(shakeClass);
    setTimeout(() => {
      screen.classList.remove(shakeClass);
    }, isCrit ? 540 : 400);
  }

  /* 2. 全屏属性光影闪烁、法术贯通波纹 & 敌我暴击/施法天威横幅 */
  const overlay = document.getElementById("battleVfxOverlay");
  if (overlay && (isCrit || isSpellOrSkill || isSummon || isEnemyAttacker)) {
    const flash = document.createElement("div");
    flash.className = `battle-screen-flash ${isCrit ? "crit-flash" : ""}`;
    const focusY = isEnemyAttacker ? "62%" : "36%";
    flash.style.background = isCrit
      ? `radial-gradient(circle at 50% ${focusY}, rgba(255, 230, 128, 0.42), ${pal.glow} 48%, rgba(255, 45, 70, 0.38) 85%, transparent 100%)`
      : `radial-gradient(circle at 50% ${focusY}, ${pal.softGlow}, transparent 76%)`;
    overlay.appendChild(flash);
    setTimeout(() => flash.remove(), 540);

    /* 敌我法术/暴击定向能量冲击光波 */
    if (!isHeal && !isSummon && (isCrit || isSpellOrSkill)) {
      const wave = document.createElement("div");
      wave.className = `battle-elem-wave ${isEnemyAttacker ? "from-enemy" : "from-player"} ${isCrit ? "crit-wave" : ""}`;
      wave.style.background = `radial-gradient(ellipse at center, ${pal.glow} 0%, ${pal.softGlow} 50%, transparent 80%)`;
      wave.style.borderColor = isCrit ? "#ffe066" : pal.primary;
      overlay.appendChild(wave);
      setTimeout(() => wave.remove(), 560);
    }

    if (isCrit) {
      const critBanner = document.createElement("div");
      critBanner.className = `battle-crit-banner ${isEnemyAttacker ? "enemy-crit-banner" : "player-crit-banner"}`;
      critBanner.style.borderColor = pal.primary;
      critBanner.style.boxShadow = `0 0 26px ${pal.glow}`;
      const whoText = isEnemyAttacker
        ? `👹 敌方暴击 · ${evt.attackerName || "强敌"}`
        : `💥 会心暴击`;
      const artText = evt.attackerArt ? `《${evt.attackerArt}》` : "";
      const moveText = `【${evt.label || pal.name}】！`;
      const isLongBanner = (whoText.length + artText.length + moveText.length) > 13;
      critBanner.innerHTML = isLongBanner
        ? `<div class="banner-line-top">${whoText}</div><div class="banner-line-sub">${artText}${moveText}</div>`
        : `<span>${whoText} · ${artText}${moveText}</span>`;
      overlay.appendChild(critBanner);
      setTimeout(() => critBanner.remove(), 1850);
    } else if (isSpellOrSkill) {
      const castBanner = document.createElement("div");
      castBanner.className = `battle-spell-cast-banner ${isEnemyAttacker ? "enemy-cast" : "player-cast"}`;
      castBanner.style.borderColor = `${pal.primary}aa`;
      castBanner.style.boxShadow = `0 0 18px ${pal.softGlow}`;
      castBanner.style.color = pal.secondary;
      const actorPrefix = isEnemyAttacker ? `👹 ${evt.attackerName || "敌方"}` : `✨ ${evt.attackerName || "我方"}`;
      const artText = evt.attackerArt ? `《${evt.attackerArt}》· ` : "";
      const castMain = `${pal.icon} ${actorPrefix}催动`;
      const castSub = `${artText}【${evt.label}】！`;
      const isLongCast = (castMain.length + castSub.length) > 14;
      castBanner.innerHTML = isLongCast
        ? `<div class="banner-line-top">${castMain}</div><div class="banner-line-sub">${castSub}</div>`
        : `<span>${castMain}${castSub}</span>`;
      overlay.appendChild(castBanner);
      setTimeout(() => castBanner.remove(), 1850);
    }
  }

  /* 3. 目标单位受击高亮、水墨刀光剑气、五行符箓八卦阵、法宝虚影与飘字 */
  const unitEl = document.getElementById("battle-unit-" + evt.targetId);
  if (unitEl) {
    const hitClass = isCrit ? "crit-hit" : isSpellOrSkill ? "spell-hit" : isHeal ? "heal-hit" : "hit";
    unitEl.style.setProperty("--hit-glow-color", pal.primary);
    unitEl.classList.remove("hit", "spell-hit", "crit-hit", "heal-hit");
    void unitEl.offsetWidth;
    unitEl.classList.add(hitClass);
    setTimeout(() => unitEl.classList.remove(hitClass), 680);

    spawnUnitParticles(unitEl, pal, evt);
    spawnFloatingCallout(unitEl, pal, evt);
  }

  /* 4. 触发合成音效反馈 */
  playBattleVfxSound(evt, pal);
}

/* 施法者/攻击者身上的功法光环与招式铭文呼出（停留约 1.8 秒，含随身法宝共鸣提示） */
function spawnCasterAuraEffect(attackerEl, pal, evt) {
  if (!attackerEl || !evt) return;
  const callout = document.createElement("div");
  callout.className = `battle-caster-callout ${evt.crit ? "crit" : ""}`;
  callout.style.color = evt.crit ? "#ffe066" : pal.secondary;
  callout.style.borderColor = `${pal.primary}99`;
  callout.style.boxShadow = `0 0 12px ${pal.softGlow}`;
  const artStr = evt.attackerArt ? `《${evt.attackerArt}》` : pal.name;
  const moveLabel = evt.label || "出手";
  const artifactBadge = evt.artifactName
    ? `<span class="callout-artifact-tag">🔮${evt.artifactName}</span>`
    : "";
  const isLongCallout = (artStr.length + moveLabel.length) >= 6 || !!evt.artifactName;
  if (isLongCallout) {
    callout.classList.add("two-lines");
    callout.innerHTML = `<div class="callout-line-top">${pal.icon} ${artStr} ${artifactBadge}</div><div class="callout-line-sub">【${moveLabel}】</div>`;
  } else {
    callout.innerHTML = `${pal.icon} ${artStr} · 【${moveLabel}】`;
  }
  attackerEl.appendChild(callout);
  setTimeout(() => callout.remove(), 1850);
}

function spawnUnitParticles(unitEl, pal, evt) {
  const isCrit = !!evt.crit;
  const isSpell = evt.kind === "spell";
  const isSkill = evt.kind === "skill";
  const isSpellOrSkill = isSpell || isSkill;
  const count = isCrit ? 24 : isSpellOrSkill ? 16 : 11;

  const layer = document.createElement("div");
  layer.className = "battle-unit-vfx-layer";

  /* A. 法术专属：青绿水墨八卦太极阵盘 + 五行敕令符箓镇压特效 */
  if (isSpell || evt.kind === "summon") {
    const bagua = document.createElement("div");
    bagua.className = `battle-bagua-array ${isCrit ? "crit-bagua" : ""}`;
    bagua.style.borderColor = pal.primary;
    bagua.style.boxShadow = `0 0 18px ${pal.glow}, inset 0 0 12px ${pal.softGlow}`;
    bagua.innerHTML = `<span>☯</span>`;
    layer.appendChild(bagua);

    if (isSpell) {
      const talisman = document.createElement("div");
      talisman.className = "battle-talisman-seal";
      talisman.style.borderColor = pal.primary;
      talisman.style.boxShadow = `0 0 14px ${pal.glow}`;
      talisman.innerHTML = `<span class="talisman-head">敕令</span><span class="talisman-char">${pal.short}</span>`;
      layer.appendChild(talisman);
    }
  }

  /* B. 扩散法阵冲击波环（暴击时生成双层震荡光环） */
  if (isCrit || isSpellOrSkill || evt.kind === "summon") {
    const ring = document.createElement("div");
    ring.className = `battle-shockwave ${isCrit ? "crit-ring" : ""}`;
    ring.style.borderColor = isCrit ? "#ffdf70" : pal.primary;
    ring.style.boxShadow = `0 0 16px ${pal.glow}, inset 0 0 12px ${pal.glow}`;
    layer.appendChild(ring);

    if (isCrit) {
      const ring2 = document.createElement("div");
      ring2.className = "battle-shockwave crit-ring secondary-ring";
      ring2.style.borderColor = pal.primary;
      ring2.style.boxShadow = `0 0 22px ${pal.glow}`;
      layer.appendChild(ring2);
    }
  }

  /* C. 水墨飞白弧光剑气 SVG + 刀光掠影（普攻/武技/法术均呈现水墨剑弧） */
  if (!evt.kind || evt.kind === "attack" || isSpellOrSkill) {
    const inkArc = document.createElement("div");
    inkArc.className = `battle-ink-crescent ${isCrit ? "crit-arc" : ""}`;
    inkArc.innerHTML = `
      <svg viewBox="0 0 160 64" class="battle-ink-crescent-svg" preserveAspectRatio="none">
        <path d="M8,52 Q78,2 152,18 Q84,22 8,52 Z" fill="${pal.primary}" opacity="0.88" />
        <path d="M16,48 Q80,10 146,20" fill="none" stroke="${isCrit ? '#fff8cc' : pal.secondary}" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    `;
    layer.appendChild(inkArc);

    const slash = document.createElement("div");
    slash.className = `battle-slash-beam ${isCrit ? "crit-slash" : ""}`;
    slash.style.background = `linear-gradient(90deg, transparent, ${pal.primary}, ${pal.secondary}, ${pal.primary}, transparent)`;
    slash.style.boxShadow = `0 0 14px ${pal.glow}`;
    layer.appendChild(slash);

    if (isCrit) {
      const crossSlash = document.createElement("div");
      crossSlash.className = "battle-slash-beam crit-slash crit-slash-cross";
      crossSlash.style.background = `linear-gradient(90deg, transparent, #ffe066, #ffffff, ${pal.primary}, transparent)`;
      crossSlash.style.boxShadow = `0 0 18px #ff4757, 0 0 12px ${pal.glow}`;
      layer.appendChild(crossSlash);
    }
  }

  /* D. 随身法宝虚影助阵流光 */
  if (evt.artifactName && (isCrit || isSpellOrSkill)) {
    const artPhantom = document.createElement("div");
    artPhantom.className = "battle-artifact-phantom";
    artPhantom.style.borderColor = pal.primary;
    artPhantom.style.color = pal.secondary;
    artPhantom.style.boxShadow = `0 0 12px ${pal.glow}`;
    artPhantom.innerHTML = `🔮 ${evt.artifactName}`;
    layer.appendChild(artPhantom);
  }

  /* E. 属性粒子迸发 */
  const glyphs = pal.particles || ["✦", "✧"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const isGlyph = i % 3 === 0;
    p.className = isGlyph ? "battle-particle glyph" : "battle-particle spark";
    if (isGlyph) {
      p.textContent = glyphs[i % glyphs.length];
      p.style.color = (isCrit && i % 2 === 0) ? "#ffe066" : pal.primary;
      p.style.textShadow = `0 0 8px ${pal.glow}`;
    } else {
      p.style.background = (isCrit && i % 2 === 0) ? "#ffdf6b" : (i % 2 === 0 ? pal.primary : pal.secondary);
      p.style.boxShadow = `0 0 8px ${pal.glow}`;
    }

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const dist = (isCrit ? 52 : 34) + Math.random() * (isCrit ? 68 : 44);
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * (dist * 0.65) - (evt.kind === "heal" ? 18 : 0);
    const rot = Math.round((Math.random() - 0.5) * 260);
    const scale = (isCrit ? 1.2 : 0.88) + Math.random() * 0.55;

    p.style.setProperty("--tx", `${tx.toFixed(1)}px`);
    p.style.setProperty("--ty", `${ty.toFixed(1)}px`);
    p.style.setProperty("--rot", `${rot}deg`);
    p.style.setProperty("--scale", scale.toFixed(2));
    p.style.left = `${35 + Math.random() * 30}%`;
    p.style.top = `${30 + Math.random() * 40}%`;

    layer.appendChild(p);
  }

  unitEl.appendChild(layer);
  setTimeout(() => layer.remove(), 1050);
}

function spawnFloatingCallout(unitEl, pal, evt) {
  const floatEl = document.createElement("div");
  const isCrit = !!evt.crit;
  const isHeal = evt.kind === "heal";
  const isSummon = evt.kind === "summon";

  floatEl.className = `battle-float-dmg ${isCrit ? "crit" : ""} ${isHeal ? "heal" : ""}`;
  if (isSummon) {
    floatEl.style.color = pal.primary;
    floatEl.style.textShadow = `0 0 10px ${pal.glow}, 0 2px 4px #000`;
    const sumLabel = evt.label || "召唤降临";
    if (sumLabel.length >= 5) {
      floatEl.classList.add("two-lines");
      floatEl.innerHTML = `<div class="float-line-top">${pal.icon} 灵兽助阵</div><div class="float-line-dmg">【${sumLabel}】</div>`;
    } else {
      floatEl.innerHTML = `${pal.icon} 【${sumLabel}】`;
    }
  } else if (isHeal) {
    floatEl.style.color = "#6ef28d";
    floatEl.style.textShadow = "0 0 10px rgba(92,230,139,0.75), 0 2px 4px #000";
    floatEl.innerHTML = `🌿 +${evt.dmg} 气血`;
  } else if (isCrit) {
    floatEl.style.color = "#ffe066";
    floatEl.style.textShadow = `0 0 12px #ff3b3b, 0 0 22px ${pal.glow}, 0 2px 4px #000`;
    floatEl.classList.add("two-lines");
    floatEl.innerHTML = `<div class="float-line-top"><span class="float-skill-tag" style="color:${pal.secondary};">${pal.icon}【${evt.label || pal.name}】</span></div><div class="float-line-dmg">💥 暴击 -${evt.dmg}</div>`;
  } else {
    floatEl.style.color = (evt.kind === "spell" || evt.kind === "skill") ? pal.primary : "#ff9b85";
    floatEl.style.textShadow = `0 0 8px ${pal.glow}, 0 2px 4px #000`;
    const moveLabel = evt.label || "攻击";
    const isLongDmg = moveLabel.length >= 4 || (moveLabel.length + String(evt.dmg).length) >= 6;
    if (isLongDmg) {
      floatEl.classList.add("two-lines");
      floatEl.innerHTML = `<div class="float-line-top"><span class="float-skill-tag" style="color:${pal.secondary};">${pal.icon}【${moveLabel}】</span></div><div class="float-line-dmg">-${evt.dmg}</div>`;
    } else {
      const tag = `<span class="float-skill-tag" style="color:${pal.secondary};">${pal.icon}${moveLabel}</span> `;
      floatEl.innerHTML = `${tag}-${evt.dmg}`;
    }
  }

  unitEl.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 1850);
}

function playBattleVfxSound(evt, pal) {
  try {
    const eng = window.xianxiaAudio;
    if (!eng || eng.isMuted || !eng.ctx || eng.ctx.state !== "running") return;
    const ctx = eng.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = (pal && pal.freq) || 523;

    if (evt.crit) {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.26);
      gain.gain.setValueAtTime(Math.min(0.28, (eng.volume || 0.5) * 0.45), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    } else if (evt.kind === "spell" || evt.kind === "skill") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.18);
      gain.gain.setValueAtTime(Math.min(0.2, (eng.volume || 0.5) * 0.32), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(Math.min(0.14, (eng.volume || 0.5) * 0.22), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    }

    osc.connect(gain);
    gain.connect(eng.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    /* ignore audio errors */
  }
}

function renderBattleActions(u, isLocked) {
  const hasBeast = battle.units.some(x =>
    x.side === "enemy" && x.alive && x.isBeast && !x.tamed
  );
  const activePet = battle.units.find(x =>
    x.side === "player" && x.isPet && x.alive && !x.recalled
  );
  const lockAttr = isLocked ? "disabled" : "";
  const lockClass = isLocked ? "is-waiting" : "";

  const summonOrRecallBtn = activePet
    ? `<button type="button" class="battle-cmd-btn btn-recall is-pet-active" ${lockAttr} onclick="battleAction('recall')" title="收回当前灵兽（${activePet.name}）">收</button>`
    : `<button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('summon')" title="召唤灵兽出战">招</button>`;

  return `<div class="battle-actions ${lockClass}">
    <button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('attack')">攻</button>
    <button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('spell')">法</button>
    <button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('item')">袋</button>
    <button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('defend')">防</button>
    ${summonOrRecallBtn}
    <button type="button" class="battle-cmd-btn" ${lockAttr} onclick="battleAction('flee')">逃</button>
    <button type="button" class="battle-cmd-btn ${hasBeast ? "" : "is-muted"}" ${lockAttr} onclick="battleAction('tame')" title="收服灵兽">驯</button>
  </div>`;
}

function battleAction(type) {
  if (!battle || battle.animating) return;
  const player = battle.order[battle.currentIdx];
  if (!player || !player.isPlayer) return;

  if (type === "attack") {
    showBattleTargetSelect("attack");
    return;
  }
  if (type === "defend" || type === "flee") {
    playerAction(type);
    return;
  }
  if (type === "tame") {
    showBattleTameSelect();
    return;
  }
  if (type === "summon") {
    showBattleSummonSelect();
    return;
  }
  if (type === "recall") {
    showBattleRecallConfirm();
    return;
  }
  if (type === "spell") {
    showBattleSpellSelect();
    return;
  }
  if (type === "item") {
    showBattleItemSelect();
    return;
  }
}

function showBattleRecallConfirm() {
  if (!battle) return;
  const activePet = battle.units.find(x => x.side === "player" && x.isPet && x.alive && !x.recalled);
  if (!activePet) {
    showModal("无出战灵兽", "<p>当前阵中并无存活的伴生灵兽，无需收回。此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  const hpPct = Math.max(0, Math.floor(activePet.hp / Math.max(1, activePet.hpMax) * 100));
  showModal(
    "🐾 收回灵兽",
    `<p>是否施展摄兽灵诀，将伴生灵兽【<b>${activePet.name}</b>】（气血 <b>${activePet.hp}/${activePet.hpMax} · ${hpPct}%</b>）安全收回灵宠囊中？</p>
     <p class="c-dim" style="font-size:12px; margin-top:6px;">收回后可保灵兽免遭强敌致命重创。收回消耗本回合行动。</p>`,
    [
      {
        label: "确认收回",
        fn: () => {
          closeModal();
          playerAction("recall");
        },
      },
      {
        label: "取消",
        fn: closeModal,
      },
    ]
  );
}

/* ============================================================
   选目标
   ============================================================ */

function showBattleTargetSelect(actionType, extra) {
  const player = battle.order[battle.currentIdx];

  let targetType = "enemySingle";
  if (actionType === "spell") {
    const sp = getSpell(extra.spellId);
    targetType = sp ? (sp.target || "enemySingle") : "enemySingle";
  } else if (actionType === "skill") {
    const sk = getCombatSkill(extra.skillId);
    targetType = sk ? (sk.target || "enemySingle") : "enemySingle";
  }

  if (!targetNeedsPick(targetType)) {
    if (actionType === "attack") playerAction("attack");
    else if (actionType === "spell") playerAction("spell", { spellId: extra.spellId });
    else if (actionType === "skill") playerAction("skill", { skillId: extra.skillId });
    return;
  }

  const side = targetType === "allySingle" ? player.side :
               (player.side === "player" ? "enemy" : "player");
  const candidates = battle.units.filter(u =>
    u.side === side && u.alive && !u.escaped && !u.tamed
  );

  if (candidates.length === 0) {
    logBattle("没有可选目标");
    renderBattle();
    return;
  }

  if (candidates.length === 1) {
    const targetId = candidates[0].id;
    if (actionType === "attack") playerAction("attack", { targetId });
    else if (actionType === "spell") playerAction("spell", { spellId: extra.spellId, targetId });
    else if (actionType === "skill") playerAction("skill", { skillId: extra.skillId, targetId });
    return;
  }

  _pendingBattleAction = { actionType, extra };

  const btns = candidates.map(e => {
    const hpPct = Math.max(0, Math.floor(e.hp / e.hpMax * 100));
    return `<button type="button" class="spell-grid-btn span-full" onclick="pickBattleTarget('${e.id}')">
      <span class="spell-btn-title">${e.name}（气血 ${hpPct}%）</span>
    </button>`;
  }).join("");

  showBattleSubmenu("选择目标", `<div class="battle-spell-grid">${btns}</div>`);
}

function pickBattleTarget(targetId) {
  closeBattleSubmenu();
  const pending = _pendingBattleAction;
  _pendingBattleAction = null;
  if (!pending) return;

  const { actionType, extra } = pending;
  if (actionType === "attack") {
    playerAction("attack", { targetId });
  } else if (actionType === "spell") {
    playerAction("spell", { spellId: extra.spellId, targetId });
  } else if (actionType === "skill") {
    playerAction("skill", { skillId: extra.skillId, targetId });
  }
}

/* ============================================================
   法术与功法招式选择（按百艺类型分组、对齐百艺图标、每行最多2个、长名独占一行）
   ============================================================ */

const BATTLE_SPELL_TYPE_ICONS = {
  "剑": "🗡️",
  "刀": "🔪",
  "拳": "👊",
  "掌": "✋",
  "棍": "🥢",
  "鞭": "➰",
  "兽": "🐾",
  "炼丹": "🧪",
  "炼器": "⚔️",
  "阵法": "🔮",
  "符": "📜",
  "通用": "✨",
};

const BATTLE_SPELL_TYPE_NAMES = {
  "剑": "剑道",
  "刀": "刀法",
  "拳": "拳法",
  "掌": "掌法",
  "棍": "棍法",
  "鞭": "鞭法",
  "兽": "御兽",
  "炼丹": "丹道",
  "炼器": "器道",
  "阵法": "阵道",
  "符": "符箓",
  "通用": "通用法术",
};

function getBattleMasteryIcon(type) {
  if (typeof SKILL_ICONS !== "undefined" && SKILL_ICONS[type]) {
    return SKILL_ICONS[type];
  }
  return BATTLE_SPELL_TYPE_ICONS[type] || "✨";
}

function showBattleSpellSelect() {
  const player = battle.order[battle.currentIdx];

  if (isSilenced(player)) {
    showModal("无法施法", "<p>你当前处于【沉默】状态，经脉受阻，无法引导灵力施展仙门法术，此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 1. 检索全部已学通玄法术 (S.spells.learned 与 player.spells)，不因灵力不足而隐藏 */
  const learnedSpellIdSet = new Set([
    ...((S && S.spells && Array.isArray(S.spells.learned)) ? S.spells.learned : []),
    ...(player.spells || []),
  ]);
  const allLearnedSpells = [...learnedSpellIdSet]
    .map(id => typeof getSpell === "function" ? getSpell(id) : null)
    .filter(Boolean);

  /* 2. 检索玩家已学习的拳脚/兵刃武技招式 (S.combatSkills.learned) */
  const learnedSkillIdSet = new Set([
    ...((S && S.combatSkills && Array.isArray(S.combatSkills.learned)) ? S.combatSkills.learned : []),
    ...(player.skills || []),
  ]);
  const allLearnedSkills = [...learnedSkillIdSet]
    .map(id => typeof getCombatSkill === "function" ? getCombatSkill(id) : null)
    .filter(Boolean);

  if (allLearnedSpells.length === 0 && allLearnedSkills.length === 0) {
    showModal("暂无法术", "<p>当前尚未掌握任何法术或武技招式，此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 3. 汇总并按 type 分组（如 剑、拳、掌、刀、棍、通用 分开组） */
  const groupsMap = new Map();
  const preferredOrder = ["剑", "拳", "掌", "刀", "棍", "鞭", "兽", "符", "阵法", "通用"];
  preferredOrder.forEach(t => groupsMap.set(t, []));

  allLearnedSpells.forEach(sp => {
    const typeKey = sp.type || "通用";
    if (!groupsMap.has(typeKey)) groupsMap.set(typeKey, []);
    const elemKey = getSpellElementKey(sp, player);
    const pal = getElementPalette(elemKey);
    const mpNeed = (sp.cost && sp.cost.mp) || 0;
    const enough = player.mp >= mpNeed;
    groupsMap.get(typeKey).push({
      id: sp.id,
      name: sp.name,
      type: typeKey,
      icon: getBattleMasteryIcon(typeKey),
      pal,
      enough,
      onClick: `pickBattleSpell('${sp.id}')`,
    });
  });

  allLearnedSkills.forEach(sk => {
    const typeKey = sk.type || "通用";
    if (!groupsMap.has(typeKey)) groupsMap.set(typeKey, []);
    const elemKey = getSkillElementKey(sk, player);
    const pal = getElementPalette(elemKey);
    const cost = getSkillCost(sk, player);
    const enough = player.hp > cost.hp || (sk.canKill && player.hp >= cost.hp);
    groupsMap.get(typeKey).push({
      id: sk.id,
      name: sk.name,
      type: typeKey,
      icon: getBattleMasteryIcon(typeKey),
      pal,
      enough,
      onClick: `pickBattleCombatSkill('${sk.id}')`,
    });
  });

  /* 4. 渲染各分组：每行最多 2 个法术；若名字较长（>=5字）则独占一行 */
  const groupBlocks = [];
  groupsMap.forEach((items, typeKey) => {
    if (!items || items.length === 0) return;
    const typeIcon = getBattleMasteryIcon(typeKey);
    const typeTitle = BATTLE_SPELL_TYPE_NAMES[typeKey] || `${typeKey}系`;

    const btnsHtml = items.map(item => {
      const isLongName = (item.name || "").length >= 5;
      return `
        <button type="button"
                class="spell-grid-btn ${isLongName ? "span-full" : ""} ${item.enough ? "" : "is-disabled"}"
                style="--spell-color:${item.pal.primary}; --spell-glow:${item.pal.softGlow};"
                onclick="${item.onClick}">
          <span class="spell-btn-icon">${item.icon}</span>
          <span class="spell-btn-title">${item.name}</span>
        </button>
      `;
    }).join("");

    groupBlocks.push(`
      <div class="battle-spell-group">
        <div class="battle-spell-group-header">
          <span class="group-icon">${typeIcon}</span>
          <span class="group-title">${typeTitle}</span>
        </div>
        <div class="battle-spell-grid">
          ${btnsHtml}
        </div>
      </div>
    `);
  });

  const html = `<div class="battle-spell-groups-wrap">${groupBlocks.join("")}</div>`;
  showBattleSubmenu("✨ 选择法术", html);
}

function pickBattleSpell(spellId) {
  const player = battle && battle.order ? battle.order[battle.currentIdx] : null;
  const sp = typeof getSpell === "function" ? getSpell(spellId) : null;
  if (!player || !sp) return;

  const mpNeed = (sp.cost && sp.cost.mp) || 0;
  if (player.mp < mpNeed) {
    showModal("灵力不足", `<p>施展【<b>${sp.name}</b>】需要 <b>${mpNeed}</b> 点灵力（当前灵力：<b>${Math.floor(player.mp)}</b>），此提示不消耗行动回合。</p>`, [{ label: "知晓", fn: closeModal }]);
    return;
  }

  closeBattleSubmenu();
  showBattleTargetSelect("spell", { spellId: spellId });
}

function pickBattleCombatSkill(skillId) {
  const player = battle && battle.order ? battle.order[battle.currentIdx] : null;
  const sk = typeof getCombatSkill === "function" ? getCombatSkill(skillId) : null;
  if (!player || !sk) return;

  const cost = getSkillCost(sk, player);
  const enoughHp = player.hp > cost.hp || (sk.canKill && player.hp >= cost.hp);
  if (!enoughHp) {
    showModal("气血不足", `<p>施展【<b>${sk.name}</b>】需要消耗 <b>${cost.hp}</b> 点气血（当前气血：<b>${Math.floor(player.hp)}</b>），此提示不消耗行动回合。</p>`, [{ label: "知晓", fn: closeModal }]);
    return;
  }

  closeBattleSubmenu();
  showBattleTargetSelect("skill", { skillId: skillId });
}


/* ============================================================
   道具选择
   ============================================================ */

function showBattleItemSelect() {
  const player = battle.order[battle.currentIdx];

  /* 只显示战斗中可用的丹药 */
  const usable = Object.keys(S.inventory).filter(k => {
    const item = ITEMS[k];
    if (!item || item.type !== "pill" || S.inventory[k] <= 0) return false;
    return item.usableIn === "battle" || item.usableIn === "both";
  });

  if (usable.length === 0) {
    showModal("暂无可用道具", "<p>行囊中暂无战斗中可服用的灵丹妙药（如回春丹、回灵丹或解毒丹等），此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  const btns = usable.map(id => {
    const item = ITEMS[id];
    const label = `${item.name}${item.grade ? `·${item.grade}品` : ""} ×${S.inventory[id]}`;
    const isLong = label.length >= 8;
    return `<button type="button" class="spell-grid-btn ${isLong ? "span-full" : ""}" onclick="pickBattleItem('${id}')">
      <span class="spell-btn-icon">💊</span>
      <span class="spell-btn-title">${label}</span>
    </button>`;
  }).join("");

  showBattleSubmenu("💊 选择丹药", `<div class="battle-spell-grid">${btns}</div>`);
}

function pickBattleItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || !item.effect) return;

  /* 需要选敌人的丹药 */
  if (item.effect.type === "inflict") {
    closeBattleSubmenu();
    showBattleItemTargetSelect(itemId);
    return;
  }

  closeBattleSubmenu();
  playerAction("item", { itemId: itemId });
}

/* 丹药选目标 */
function showBattleItemTargetSelect(itemId) {
  const player = battle.order[battle.currentIdx];
  const candidates = battle.units.filter(u =>
    u.side === "enemy" && u.alive && !u.escaped && !u.tamed
  );

  if (candidates.length === 0) {
    logBattle("没有可选目标");
    renderBattle();
    return;
  }
  if (candidates.length === 1) {
    playerAction("item", { itemId, targetId: candidates[0].id });
    return;
  }

  const btns = candidates.map(e => {
    const hpPct = Math.max(0, Math.floor(e.hp / e.hpMax * 100));
    return `<button type="button" class="spell-grid-btn span-full" onclick="pickBattleItemTarget('${itemId}', '${e.id}')">
      <span class="spell-btn-title">${e.name}（气血 ${hpPct}%）</span>
    </button>`;
  }).join("");

  showBattleSubmenu("选择目标", `<div class="battle-spell-grid">${btns}</div>`);
}

function pickBattleItemTarget(itemId, targetId) {
  closeBattleSubmenu();
  playerAction("item", { itemId, targetId });
}

/* ============================================================
   收服选择
   ============================================================ */

function showBattleTameSelect() {
  if (!battle) return;

  /* 1. 检查灵兽苑容量上限 */
  const curPetCount = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list.length : 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + ((S && S.cave && S.cave.beast) || 0));
  if (curPetCount >= maxPets) {
    const beastLv = (S && S.cave && S.cave.beast) || 0;
    showModal("灵兽苑已满", `
      <p>洞府【灵兽苑】（Lv.${beastLv}）已达容量上限（<b>${curPetCount}/${maxPets}</b> 只）！</p>
      <p>仙苑空间不足，无法缔结新灵宠契印。请前往【洞府 > 洞天营造】升级灵兽苑后再试。</p>
      <p class="c-dim" style="font-size:12px; margin-top:6px;">此提示不消耗行动回合。</p>
    `, [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 2. 检查敌方是否存在存活妖兽 */
  const allAliveEnemies = battle.units.filter(u =>
    u.side === "enemy" && u.alive && !u.escaped && !u.tamed
  );
  const beasts = allAliveEnemies.filter(u => u.isBeast);

  if (beasts.length === 0) {
    showModal("敌非灵兽", `
      <p>当前敌方目标皆非灵兽之属（修士、魔修、战傀或鬼煞无法收服为伴生兽）。</p>
      <p class="c-dim" style="font-size:12px; margin-top:6px;">此提示不消耗行动回合。</p>
    `, [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 3. 校验每一只妖兽是否具备驯服可能（炼气一层幼兽且有驯服几率） */
  const candidateChecks = beasts.map(b => {
    const chk = typeof checkTameActionValidity === "function"
      ? checkTameActionValidity(b.id)
      : { ok: (b.realm <= 1 && (b.sub || 1) <= 1 && (b.tameRate || 0) > 0) };
    return { beast: b, check: chk };
  });

  const validCandidates = candidateChecks.filter(c => c.check.ok);

  if (validCandidates.length === 0) {
    const reasonsHtml = candidateChecks.map(c => {
      const desc = c.check.reason ? c.check.reason.replace(/<br>.*/, "") : "凶性太强无法驯服";
      return `<li style="margin-bottom:4px;"><b>${c.beast.name}</b>：${desc}</li>`;
    }).join("");
    showModal("无法驯服", `
      <p>敌方在场妖兽当前皆不可缔结法契：</p>
      <ul style="margin: 8px 0; padding-left: 18px; font-size: 13px; line-height: 1.6;">${reasonsHtml}</ul>
      <p class="c-dim" style="font-size:12px; margin-top:6px;">此提示不消耗行动回合。</p>
    `, [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 4. 若仅有 1 只符合条件的妖兽，直接发起收服 */
  if (validCandidates.length === 1 && beasts.length === 1) {
    playerAction("tame", { targetId: validCandidates[0].beast.id });
    return;
  }

  /* 5. 若有多只妖兽，打开选择面板 */
  const btns = candidateChecks.map(c => {
    const b = c.beast;
    const ok = c.check.ok;
    const rateText = ok ? `收服率 ${(b.tameRate * 100).toFixed(0)}%` : "无法驯服";
    return `
      <button type="button" class="spell-grid-btn span-full ${ok ? "" : "is-disabled"}" onclick="pickBattleTame('${b.id}')">
        <span class="spell-btn-icon">${ok ? "🐾" : "⚠️"}</span>
        <span class="spell-btn-title">${b.name}（${rateText}）</span>
      </button>
    `;
  }).join("");

  showBattleSubmenu("🐾 选择收服目标", `<div class="battle-spell-grid">${btns}</div>`);
}

function pickBattleTame(targetId) {
  closeBattleSubmenu();
  playerAction("tame", { targetId: targetId });
}

/* ============================================================
   子菜单
   ============================================================ */

function showBattleSubmenu(title, html) {
  const container = document.getElementById("battleSubmenu");
  if (!container) return;
  container.innerHTML = `
    <div class="battle-submenu-box">
      <div class="battle-submenu-header">
        <h3>${title}</h3>
      </div>
      <div class="list">${html}</div>
      <button type="button" class="submenu-return-btn" onclick="closeBattleSubmenu()">返回</button>
    </div>
  `;
  container.style.display = "flex";
}

function closeBattleSubmenu() {
  const container = document.getElementById("battleSubmenu");
  if (container) container.style.display = "none";
}

/* ============================================================
   战斗结束结算音效与视觉画面（胜利 / 收服 / 逃走成功 / 战死）
   ============================================================ */

function playBattleSettlementSound(result) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (window.xianxiaAudio && window.xianxiaAudio.isPlaying === false) return;

    const ctx = (window.xianxiaAudio && window.xianxiaAudio.ctx) ? window.xianxiaAudio.ctx : new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    if (result === "win" || result === "tame") {
      /* 凯旋/收服：五声宫商角徵羽上行仙音与金石清响 */
      const notes = result === "tame" ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === notes.length - 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.001, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.11, now + i * 0.08 + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.08 + 0.65);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.68);
      });
    } else if (result === "flee") {
      /* 御风遁走：疾风掠影呼啸音 */
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.38);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (result === "lose") {
      /* 兵败身陨：低沉暮钟嗡鸣 */
      [196, 146.83].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + i * 0.18);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + i * 0.18 + 0.75);
        g.gain.setValueAtTime(0.08, now + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.18 + 0.8);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.82);
      });
    }
  } catch (err) {
    /* 忽略音频受限错误 */
  }
}

function showBattleResult(result, exp, stone, settlementData) {
  const container = document.getElementById("battleScreen");
  if (!container) return;

  playBattleSettlementSound(result);

  const data = settlementData || {
    result,
    rounds: 1,
    exp: exp || 0,
    stone: stone || 0,
    items: [],
    enemies: [],
    newAllies: [],
    survivingAllies: [],
    fallenAllies: [],
    playerStatus: {
      name: (S && S.name) || "道友",
      hp: (S && S.hp) || 0,
      hpMax: (typeof totalMaxHp === "function" ? totalMaxHp() : 100),
      mp: (S && S.mp) || 0,
      mpMax: (typeof totalMaxMp === "function" ? totalMaxMp() : 0),
      killedBy: "强敌",
      killedByMove: "致命一击",
    },
  };

  /* 结局主题视觉配置 */
  const themeMap = {
    win: {
      sealChar: "胜",
      badgeIcon: "🏆",
      title: "凯旋破敌 · 战斗大捷",
      subtitle: "剑气纵横荡群魔，道心澄澈气如虹",
      accentColor: "#f5c84c",
      subColor: "#7fe08a",
      particles: ["✦", "✧", "✨", "⚔️", "🌟"],
    },
    tame: {
      sealChar: "契",
      badgeIcon: "🐾",
      title: "灵契缔结 · 收服成功",
      subtitle: "神识交感化凶顽，再添仙苑护道灵兽",
      accentColor: "#58e6a9",
      subColor: "#f5d061",
      particles: ["🐾", "☯️", "✦", "🌿", "✨"],
    },
    flee: {
      sealChar: "遁",
      badgeIcon: "💨",
      title: "御风遁走 · 逃走成功",
      subtitle: "审时度势借遁光，脱离险境保真元",
      accentColor: "#63d2ff",
      subColor: "#b8ecff",
      particles: ["💨", "🍃", "✧", "〰️", "☁️"],
    },
    lose: {
      sealChar: "陨",
      badgeIcon: "💀",
      title: "兵败身陨 · 道消魂散",
      subtitle: "气血枯竭天光暗，三魂摇落坠幽冥……",
      accentColor: "#ff5c5c",
      subColor: "#d98282",
      particles: ["🩸", "💀", "🥀", "🕯️", "✧"],
    },
  };

  const th = themeMap[result] || themeMap.win;

  /* 生成动态背景粒子 */
  const particlesHtml = Array.from({ length: 16 }).map((_, idx) => {
    const glyph = th.particles[idx % th.particles.length];
    const left = (6 + (idx * 6.1) % 88).toFixed(1);
    const delay = ((idx * 0.23) % 2.4).toFixed(2);
    const dur = (2.6 + (idx % 4) * 0.55).toFixed(2);
    const size = 12 + (idx % 3) * 4;
    return `<span class="settlement-bg-particle" style="left:${left}%; animation-delay:${delay}s; animation-duration:${dur}s; font-size:${size}px; color:${idx % 2 === 0 ? th.accentColor : th.subColor};">${glyph}</span>`;
  }).join("");

  /* 1. 战利品与修为灵石区块（紧凑不滚动） */
  const hasRewards = (result === "win" || result === "tame") || (data.exp > 0 || data.stone > 0 || (data.items && data.items.length > 0));
  let rewardsHtml = "";
  if (hasRewards) {
    const itemsGridHtml = (data.items && data.items.length > 0)
      ? `<div class="settlement-loot-grid">
          ${data.items.map(item => {
            const safeId = String(item.id || "").replace(/'/g, "\\'");
            return `
              <div class="settlement-loot-chip" onclick="if(typeof showItemDetailModal==='function') showItemDetailModal('${safeId}')" title="点击查看【${item.name}】详情">
                <span>${item.icon || "📦"} ${item.name}</span>
                <b>×${item.count || 1}</b>
              </div>
            `;
          }).join("")}
        </div>`
      : "";

    rewardsHtml = `
      <div class="settlement-section" style="padding:10px;">
        <div class="settlement-core-gains">
          <div class="settlement-gain-pill">
            <span class="gain-icon">✨</span>
            <div class="gain-meta">
              <span class="gain-label">每人获得修为</span>
              <b class="gain-val">+${typeof fmt === "function" ? fmt(data.exp) : data.exp}</b>
            </div>
          </div>
          <div class="settlement-gain-pill">
            <span class="gain-icon">💎</span>
            <div class="gain-meta">
              <span class="gain-label">获得灵石</span>
              <b class="gain-val">+${typeof fmt === "function" ? fmt(data.stone) : data.stone}</b>
            </div>
          </div>
        </div>
        ${itemsGridHtml}
      </div>
    `;
  }

  /* 2. 灵兽与伙伴精简结果（不显示剩余气血与长文） */
  let alliesCompactHtml = "";
  const newAllies = data.newAllies || [];
  const survivingAllies = data.survivingAllies || [];
  const fallenAllies = data.fallenAllies || [];
  if (newAllies.length > 0 || survivingAllies.length > 0 || fallenAllies.length > 0) {
    const rows = [];
    newAllies.forEach(a => {
      rows.push(`<div class="settlement-ally-row" style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; font-size:12px;">
        <span>${a.icon || "🐾"} <b>${a.name}</b> <span class="settlement-item-tag good">新收服</span></span>
        <span class="settlement-item-tag gold">${a.realmText || "凡阶"}</span>
      </div>`);
    });
    survivingAllies.forEach(a => {
      const expText = a.expGain > 0 ? `+${a.expGain} 修为` : (a.atCap ? "满级待突破" : "+0 修为");
      const lvlText = a.leveledUp ? `🎉 Lv.${a.oldLvl}➔Lv.${a.newLvl}` : (a.realmText || "");
      rows.push(`<div class="settlement-ally-row" style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; font-size:12px;">
        <span>${a.icon || "🐾"} <b>${a.name}</b> <span class="settlement-item-tag">${lvlText}</span></span>
        <span class="settlement-item-tag good">${expText}</span>
      </div>`);
    });
    fallenAllies.forEach(f => {
      rows.push(`<div class="settlement-ally-row" style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; font-size:12px; color:#ff9494;">
        <span>🪦 <b>${f.name}</b></span>
        <span class="settlement-item-tag bad">${f.permanentDeath ? "阵亡陨落" : "重伤退场"}（无经验）</span>
      </div>`);
    });
    alliesCompactHtml = `
      <div class="settlement-section" style="padding:8px 10px;">
        ${rows.join("")}
      </div>
    `;
  }

  /* 底部操作按钮 */
  const footerBtnHtml = result === "lose"
    ? `<button type="button" class="primary block settlement-action-btn lose-btn" onclick="confirmBattleLoseDeath()">
        💀 兵解归墟 · 结算天命
      </button>`
    : `<button type="button" class="primary block settlement-action-btn" onclick="closeBattleScreen()">
        ${result === "flee" ? "💨 收敛气息 · 离开战场" : "✨ 收纳战果 · 继续仙途"}
      </button>`;

  container.innerHTML = `
    <div class="battle-settlement-stage theme-${result}">
      <div class="settlement-ambient-rays"></div>
      <div class="settlement-particles-layer">${particlesHtml}</div>

      <div class="settlement-card" style="max-height:92dvh; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
        <div class="settlement-hero-header" style="padding:10px 12px;">
          <div class="settlement-seal-wrap">
            <div class="settlement-dao-ring"></div>
            <div class="settlement-seal-stamp seal-${result}">${th.sealChar}</div>
          </div>
          <div class="settlement-title-group">
            <div class="settlement-main-title">
              <span>${th.badgeIcon}</span>
              <span>${th.title}</span>
            </div>
            <div class="settlement-sub-title">${th.subtitle}</div>
          </div>
        </div>

        <div class="settlement-scroll-body" style="overflow:hidden; padding:6px 12px; display:flex; flex-direction:column; gap:8px;">
          ${rewardsHtml}
          ${alliesCompactHtml}
        </div>

        <div class="settlement-footer" style="padding:10px 12px;">
          ${footerBtnHtml}
        </div>
      </div>
    </div>
  `;
  container.style.display = "flex";
}

function confirmBattleLoseDeath() {
  if (window._battleDeathTimer) {
    clearTimeout(window._battleDeathTimer);
    window._battleDeathTimer = null;
  }
  const container = document.getElementById("battleScreen");
  if (container) container.style.display = "none";
  closeBattleSubmenu();
  _pendingBattleAction = null;

  if (S && S.flags && S.flags.adventureCombat) {
    S.flags.adventureCombat = null;
    S.flags.adventure = null;
    S.flags.adventureLog = null;
  }

  if (typeof die === "function") {
    die("战斗失利，身死道消。");
  }
}

function closeBattleScreen() {
  if (window._battleDeathTimer) {
    clearTimeout(window._battleDeathTimer);
    window._battleDeathTimer = null;
  }
  const container = document.getElementById("battleScreen");
  if (container) container.style.display = "none";
  closeBattleSubmenu();
  _pendingBattleAction = null;

  /* 如果是从冒险地进入的战斗，返回冒险界面 */
  if (S.flags && S.flags.adventureCombat) {
    const info = S.flags.adventureCombat;
    S.flags.adventureCombat = null;

    if (info.result === "win" || info.result === "tame") {
      if (typeof adventureLog === "function") {
        adventureLog(`你击败了妖兽，继续前行。`, "good");
      }
    } else if (info.result === "lose") {
      if (typeof adventureLog === "function") {
        adventureLog(`你被击败，被迫退出冒险地。`, "bad");
      }
      S.flags.adventure = null;
      S.flags.adventureLog = null;
      if (typeof checkAdvanceTimeSlot === "function") checkAdvanceTimeSlot();
      save();
      render();
      return;
    } else if (info.result === "flee") {
      if (typeof adventureLog === "function") {
        adventureLog(`你逃出了战斗，回到原点。`, "dim");
      }
    }

    if (typeof renderAdventureScreen === "function") {
      renderAdventureScreen();
      const el = document.getElementById("adventureScreen");
      if (el) el.style.display = "flex";
    }
    return;
  }

  render();
}
/* ============================================================
   召唤选择
   ============================================================ */

function showBattleSummonSelect() {
  if (!battle) return;
  const player = battle.order[battle.currentIdx];
  if (!player) return;

  const petInBattle = battle.units.some(x => x.isPet && x.alive);
  if (petInBattle) {
    showModal("伴生灵兽已在阵中", "<p>你的伴生灵兽已在战阵中协同御敌，无需重复施展召唤术，此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  const allAlivePets = ((S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [])
    .filter(p => p && (p.hp === null || p.hp === undefined || p.hp > 0));
  const skills = typeof getActiveSummonSkills === "function"
    ? getActiveSummonSkills()
    : ((S.combatSkills && S.combatSkills.learned || []).map(id => typeof getSummonSkill === "function" ? getSummonSkill(id) : null).filter(Boolean));

  const primarySkill = skills[0] || { id: "summon_beast", name: "召唤灵兽", cost: { mp: 5 } };

  if (allAlivePets.length === 0) {
    showModal("暂无可出战灵兽", "<p>当前尚未收服伴生灵兽或灵兽已重伤，此提示不消耗行动回合。</p>", [{ label: "知晓", fn: closeModal }]);
    return;
  }

  /* 召唤列表：只显示灵兽名字，与法术详情保持统一字体与网格样式 */
  const petBtns = allAlivePets.map(p => {
    const safeUid = String(p.uid).replace(/'/g, "\\'");
    const isLong = (p.name || "").length >= 5;
    return `<button type="button" class="spell-grid-btn ${isLong ? "span-full" : ""}" onclick="pickBattleSummon('${safeUid}', '${primarySkill.id}')">
      <span class="spell-btn-icon">🐾</span>
      <span class="spell-btn-title">${p.name}</span>
    </button>`;
  }).join("");

  const html = `<div class="battle-spell-grid">${petBtns}</div>`;
  showBattleSubmenu("🐾 选择灵兽召唤", html);
}

function pickBattleSummon(petOrSkillId, explicitSkillId) {
  closeBattleSubmenu();
  const resolvedSkillId = explicitSkillId || petOrSkillId;
  playerAction("summon", { petUid: petOrSkillId, skillId: resolvedSkillId });
}
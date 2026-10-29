/* ============================================================
   systems/battle.js - 战斗核心
   ============================================================ */

let battle = null;

/* ============================================================
   开战
   ============================================================ */

/* ============================================================
   解析敌人专属功法/妖丹属性、法术与暴击配置
   ============================================================ */

function resolveEnemyCombatProfile(base) {
  if (!base) {
    return {
      element: "xue",
      artId: "enemy_xue_art",
      artName: "天妖血煞功",
      spells: ["kuangdao"],
      skills: ["sk_blade1"],
      mpFloor: 35,
      luck: 8,
      critBonus: 0.06,
    };
  }

  const name = String(base.name || "");
  const id = String(base.id || "");
  const resist = base.resistances || {};
  const inflict = base.attackInflict || {};
  const rawSpells = Array.isArray(base.spells) ? base.spells.slice() : [];
  const rawSkills = Array.isArray(base.skills) ? base.skills.slice() : [];

  /* 1. 判定敌人五行/异种灵根属性 */
  let element = base.element || null;
  if (!element) {
    if (
      /冰|寒|霜|雪|冻|凛/.test(name) ||
      /frost|ice|snow/.test(id) ||
      inflict.freeze ||
      (resist.freeze && resist.freeze >= 60)
    ) {
      element = "bing";
    } else if (
      /火|炎|赤|丹霞|阳|烈|焚|熔|烬/.test(name) ||
      /fire|flame|danxia|sun/.test(id) ||
      rawSpells.includes("huojian") ||
      rawSpells.includes("huoyanjian") ||
      rawSpells.includes("lieyanjian") ||
      rawSpells.includes("liehuoquan") ||
      inflict.burn ||
      (resist.burn && resist.burn >= 50)
    ) {
      element = "huo";
    } else if (
      /雷|电|霆|紫电|天威|冤魂|惊蛰/.test(name) ||
      /thunder|lightning|wraith/.test(id)
    ) {
      element = "lei";
    } else if (
      /毒|蛛|蛇|木|草|藤|花|竹|芝|蝎|蜈|守宫|鹿|蜂|蝶|雀|兔/.test(name) ||
      /spider|snake|viper|herb|deer|scorpion|gecko|rabbit|butterfly|sparrow/.test(id) ||
      inflict.poison ||
      (resist.poison && resist.poison >= 50)
    ) {
      element = "mu";
    } else if (
      /水|潭|蟾|蛟|泽|溪|浪|露|潮|渊/.test(name) ||
      /toad|dragonette|water|river/.test(id)
    ) {
      element = "shui";
    } else if (
      /石|岩|熊|山|穿山甲|山甲|猪|猿|猢狲|虫|铁甲|碑|流寇|当家/.test(name) ||
      /pangolin|boar|bear|monkey|beetle|monument|bandit_chief/.test(id) ||
      (resist.stun && resist.stun >= 30)
    ) {
      element = "tu";
    } else if (
      /血|魔|煞|尸|骨|鬼|残剑|邪|狂乱/.test(name) ||
      /corpse|blood|broken_sword|wild/.test(id)
    ) {
      element = "xue";
    } else if (
      /剑|刀|狼|豹|虎|鹰|猬|针|金|兵|斥候|暗哨|战傀/.test(name) ||
      /wolf|leopard|hedgehog|sword|blade|archer|scout/.test(id)
    ) {
      element = "jin";
    } else {
      element = base.isBeast ? "xue" : "jin";
    }
  }

  /* 2. 赋予敌人专属功法/妖丹心法名号 */
  const beastArtMap = {
    jin:  "庚金裂爪妖诀",
    mu:   "青木蚀骨妖典",
    shui: "玄水覆海妖功",
    huo:  "离火焚脉妖诀",
    tu:   "戊土撼岳妖身",
    lei:  "紫电惊蛰妖法",
    bing: "玄冰凝魄妖诀",
    xue:  "天妖血煞真功",
  };
  const cultivatorArtMap = {
    jin:  "太白庚金剑诀",
    mu:   "万木化生真诀",
    shui: "沧溟玄水真诀",
    huo:  "丹霞明火心法",
    tu:   "黑风磐石霸体",
    lei:  "九霄引雷真诀",
    bing: "寒潭玄冰剑诀",
    xue:  "血炼魔煞心经",
  };
  const artName = base.artName || (base.isBeast ? beastArtMap[element] : cultivatorArtMap[element]) || "玄阴煞气诀";

  /* 3. 自动补齐与属性契合的法术与功法招式，确保敌人能施展属性法术与暴击 */
  const elemSpellsMap = {
    huo:  ["huojian", "liehuoquan"],
    bing: ["bingzhang", "lingqi_bo"],
    jin:  ["jianqi_zhan", "kuangdao"],
    mu:   ["lingqi_bo", "saodi"],
    shui: ["bingzhang", "lingqi_bo"],
    tu:   ["bengquan", "saodi"],
    lei:  ["jianqi_zhan", "lingqi_bo"],
    xue:  ["kuangdao", "jianqi_zhan"],
  };
  const elemSkillsMap = {
    huo:  ["sk_palm1", "sk_blade1"],
    bing: ["sk_palm1", "sk_sword1"],
    jin:  ["sk_sword1", "sk_blade1"],
    mu:   ["sk_whip1", "sk_palm1"],
    shui: ["sk_palm1", "sk_sword1"],
    tu:   ["sk_fist1", "sk_staff1"],
    lei:  ["sk_sword1", "sk_fist1"],
    xue:  ["sk_blade1", "sk_fist1"],
  };

  const mergedSpells = new Set(rawSpells);
  const defaultSpells = elemSpellsMap[element] || ["lingqi_bo"];
  defaultSpells.forEach(spId => mergedSpells.add(spId));
  if ((base.realm || 1) >= 2 || (base.sub || 1) >= 6) {
    if (element === "huo") mergedSpells.add("huoyanjian");
    if (element === "jin" || element === "xue") mergedSpells.add("jianqi_zhan");
  }

  const mergedSkills = new Set(rawSkills);
  if (base.isBeast) mergedSkills.add("sk_beast1");
  const defaultSkills = elemSkillsMap[element] || ["sk_fist1"];
  defaultSkills.forEach(skId => mergedSkills.add(skId));
  if ((base.realm || 1) >= 2 || (base.sub || 1) >= 6) {
    if (element === "jin") mergedSkills.add("sk_sword2");
    if (element === "xue" || element === "huo") mergedSkills.add("sk_blade2");
    if (element === "tu" || element === "bing") mergedSkills.add("sk_fist2");
  }

  const realm = Math.max(1, base.realm || 1);
  const sub = Math.max(1, base.sub || 1);
  const mpFloor = Math.max(base.mp || 0, 28 + realm * 18 + sub * 5);
  const luck = base.luck !== undefined ? base.luck : (6 + realm * 4 + Math.floor(sub * 1.5));
  const critBonus = (element === "jin" || element === "lei" || element === "xue" || element === "huo") ? 0.08 : 0.05;

  return {
    element,
    artId: base.artId || (`enemy_art_${element}`),
    artName,
    spells: [...mergedSpells],
    skills: [...mergedSkills],
    mpFloor,
    luck,
    critBonus,
  };
}

/* ============================================================
   开战
   ============================================================ */

function startBattle(enemyDefs) {
  const list = Array.isArray(enemyDefs) && enemyDefs.length > 0 ? enemyDefs : [{ enemyId: "e_wolf" }];
  const enemies = list.map((def, i) => {
    if (!def) return null;
    /* ★ 支持自定义敌人（如榜单 NPC）或直接传入字符串 ID */
    const rawDef = typeof def === "string" ? { enemyId: def } : def;
    const lookupId = rawDef.enemyId || (!rawDef.name && rawDef.id ? rawDef.id : null);
    let base = rawDef.customEnemy || (lookupId ? getEnemyById(lookupId) : rawDef);
    if (!base || !base.name) {
      const fallback = getEnemyById("e_wolf");
      base = fallback ? Object.assign({}, fallback) : {
        id: rawDef.enemyId || ("e_unknown_" + i),
        name: rawDef.name || "荒野妖兽",
        realm: 1,
        sub: 1,
        hp: 80,
        mp: 30,
        atk: 10,
        def: 3,
        speed: 11,
        exp: 35,
        stone: 12,
      };
    } else {
      base = Object.assign({}, base);
    }

    /* 如果没有 hp（榜单 NPC），按境界自动计算 */
    if (!base.hp) {
      base.hp = 80 + (base.sub || 1) * 25 + (base.realm || 0) * 100;
      base.mp = 25 + (base.sub || 1) * 8;
      base.atk = 6 + (base.sub || 1) * 3 + (base.realm || 0) * 5;
      base.def = 2 + (base.sub || 1) * 1 + (base.realm || 0) * 3;
      base.speed = 10 + (base.sub || 1);
      base.exp = base.exp || (20 * (base.realm || 0) + 10 * (base.sub || 1));
      base.stone = base.stone || (30 + 20 * (base.realm || 0));
    }

    const profile = resolveEnemyCombatProfile(base);
    const scale = calcEnemyScale(base.realm || 0);
    const scaledMp = Math.floor(Math.max(base.mp || 0, profile.mpFloor) * scale);

    return {
      id: "enemy_" + i,
      defId: base.id,
      side: "enemy",
      name: base.name,
      realm: base.realm || 0,
      sub: base.sub || 0,
      element: profile.element,
      artId: profile.artId,
      artName: profile.artName,
      hp: Math.floor(base.hp * scale),
      hpMax: Math.floor(base.hp * scale),
      mp: scaledMp,
      mpMax: scaledMp,
      atk: Math.floor(base.atk * scale),
      def: Math.floor(base.def * scale),
      speed: base.speed || 10,
      luck: profile.luck,
      critBonus: profile.critBonus,
      skills: profile.skills,
      spells: profile.spells,
      items: buildEnemyItems(base.items || {}),
      skillLv: { "剑": 5, "刀": 5, "拳": 5, "掌": 5, "棍": 5, "鞭": 5, "兽": 5 },
      ai: base.ai || "simple",
      isBeast: !!base.isBeast,
      tameRate: base.tameRate || 0,
      canFlee: !!base.canFlee,
      fleeRate: base.fleeRate || 0,
      attackInflict: base.attackInflict || null,
      resistances: Object.assign({}, base.resistances || {}),
      exp: Math.floor((base.exp || 0) * scale),
      stone: Math.floor((base.stone || 0) * scale),
      alive: true,
      escaped: false,
      tamed: false,
      defending: false,
      statuses: [],
    };
  }).filter(Boolean);

  const playerUnit = buildPlayerUnit();

  battle = {
    units: [playerUnit, ...enemies],
    order: [],
    currentIdx: 0,
    round: 1,
    log: [],
    pendingPets: [],
    vfxQueue: [],
    tamedPets: [],
    joinedAllies: [],
    lastActorId: null,
    lastActorSide: null,
    lastActionElement: null,
    lastActionLabel: null,
  };

  logBattle(`遭遇：${enemies.map(e => `${e.name}（${e.artName}）`).join("、")}`);
  nextRound();
  save();
  renderBattle();
}

/* 构造玩家单位 */
function buildPlayerUnit() {
  const info = getPlayerRealmInfo();

  const skillLv = {};
  for (const k in S.skills) skillLv[k] = S.skills[k].lvl;

  return {
    id: "player",
    side: "player",
    isPlayer: true,
    name: S.name,
    realm: info.realm,
    sub: info.lvl,

    get hp() { return S.hp; },
    set hp(v) { S.hp = v; },
    get hpMax() { return totalMaxHp(); },
    get mp() { return S.mp; },
    set mp(v) { S.mp = v; },
    get mpMax() { return totalMaxMp(); },
    get atk() { return totalAtk(); },
    get def() { return totalDef(); },
    get speed() { return totalSpeed(); },
    get luck() { return totalLuck(); },

    skills: ((S && S.combatSkills && Array.isArray(S.combatSkills.learned)) ? S.combatSkills.learned : [])
      .filter(id => typeof getCombatSkill === "function" && !!getCombatSkill(id)),
    skillLv: skillLv,
    spells: S.spells ? S.spells.learned.slice() : [],
    items: S.inventory,
    resistances: totalResistances(),
    statuses: S.statuses ? JSON.parse(JSON.stringify(S.statuses)) : [],
    alive: true,
    defending: false,
  };
}

/* ============================================================
   回合流程
   ============================================================ */

function nextRound() {
  if (!battle) return;

  applyPendingPets();

  battle.order = battle.units
    .filter(u => u.alive && !u.escaped && !u.tamed)
    .sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a));

  battle.currentIdx = 0;
  logBattle(`—— 第 ${battle.round} 回合 ——`);
  nextTurn();
}

function nextTurn() {
  if (!battle) return;
  if (checkBattleEnd()) return;

  while (battle.currentIdx < battle.order.length) {
    const u = battle.order[battle.currentIdx];
    if (u.alive && !u.escaped && !u.tamed) break;
    battle.currentIdx++;
  }

  if (battle.currentIdx >= battle.order.length) {
    battle.round++;
    nextRound();
    return;
  }

  const u = battle.order[battle.currentIdx];
  u.defending = false;

  const startLogs = processTurnStart(u);
  startLogs.forEach(l => logBattle(l));

  if (!u.alive) {
    processTurnEnd(u);
    if (!checkBattleEnd()) advanceTurn();
    return;
  }

  if (isSkipTurn(u)) {
    logBattle(`${u.name} 被控制，无法行动`);
    processTurnEnd(u);
    if (battle && !checkBattleEnd()) {
      renderBattle();
      advanceTurn();
    }
    return;
  }

  if (u.isPlayer) {
    battle.animating = false;
    renderBattle();
  } else if (u.isPet) {
    battle.animating = true;
    renderBattle();
    setTimeout(() => petTurn(u), 260);
  } else {
    battle.animating = true;
    renderBattle();
    setTimeout(() => enemyTurn(u), 260);
  }
}

function advanceTurn() {
  if (!battle) return;
  battle.currentIdx++;
  nextTurn();
}

/* ============================================================
   玩家动作
   ============================================================ */

function checkTameActionValidity(targetId) {
  if (!battle) return { ok: false, title: "战斗已结束", reason: "当前并未处于战斗之中。<br><span class=\"c-dim\">此提示不消耗行动回合。</span>" };

  /* 检查灵兽苑容量 */
  const curPetCount = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list.length : 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + ((S && S.cave && S.cave.beast) || 0));
  if (curPetCount >= maxPets) {
    const beastLv = (S && S.cave && S.cave.beast) || 0;
    return {
      ok: false,
      title: "灵兽苑已满",
      reason: `洞府【灵兽苑】（Lv.${beastLv}）已达容量上限（<b>${curPetCount}/${maxPets}</b> 只）！请先前往【洞府 > 洞天营造】扩建灵兽苑或放生灵兽后再行收服。<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  /* 检查目标敌人 */
  let target;
  if (targetId) {
    target = battle.units.find(x => x.id === targetId && x.alive);
  } else {
    target = battle.units.find(x => x.side === "enemy" && x.alive && !x.escaped && !x.tamed);
  }

  if (!target) {
    return {
      ok: false,
      title: "无收服目标",
      reason: `敌阵中已无存活的妖兽目标。<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  if (!target.isBeast) {
    return {
      ok: false,
      title: "非灵兽之属",
      reason: `【<b>${target.name}</b>】非灵兽之属，修士、阴煞鬼修或草木战傀无法缔结御兽法契！<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  if (target.tamed) {
    return {
      ok: false,
      title: "已被驯服",
      reason: `【<b>${target.name}</b>】已被收服，无需重复施展法契。<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  /* 仅炼气1重幼兽妖兽可能被收服，其余必定失败 */
  const canCaptureByRealm = (target.realm === 1 && target.sub === 1) || (target.realm === 0 && target.sub <= 1);
  if (!canCaptureByRealm) {
    return {
      ok: false,
      title: "凶性难驯",
      reason: `【<b>${target.name}</b>】境界已深（高于炼气一层），妖道根基已固，凶性滔天，当前凡品御兽契印无法强行降服！<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  if (target.tameRate !== undefined && target.tameRate <= 0) {
    return {
      ok: false,
      title: "无法驯服",
      reason: `【<b>${target.name}</b>】天性孤傲凶戾，不可结契驯服！<br><span class="c-dim">此提示不消耗行动回合。</span>`,
    };
  }

  return { ok: true, target };
}

function playerAction(action, params) {
  if (!battle || battle.animating) return;
  const u = battle.order[battle.currentIdx];
  if (!u || !u.isPlayer) return;

  params = params || {};

  /* ★ 驯服合规性前置校验：若不能驯服，弹出提示且绝对不消耗回合 */
  if (action === "tame") {
    const check = checkTameActionValidity(params.targetId);
    if (!check.ok) {
      if (typeof showModal === "function") {
        showModal(check.title || "无法驯服", `<p>${check.reason}</p>`, [{ label: "知晓", fn: closeModal }]);
      } else if (typeof logBattle === "function") {
        logBattle(`【无法驯服】${check.reason}`);
      }
      return;
    }
  }

  switch (action) {
    case "attack": doAttack(u, params.targetId); break;
    case "spell":  doSpell(u, params.spellId, params.targetId); break;
    case "skill":  doSkill(u, params.skillId, params.targetId); break;
    case "item":   doItem(u, params.itemId, params.targetId); break;
    case "flee":   doFlee(u); break;
    case "defend": doDefend(u); break;
    case "tame":   doTame(u, params.targetId); break;
    case "summon": doSummon(u, params.petUid || params.skillId, params.skillId); break;
    case "recall":
      if (typeof doRecallPet === "function") {
        doRecallPet(u);
      }
      break;
  }

  if (!battle) return;
  processTurnEnd(u);
  battle.animating = true;
  renderBattle();

  setTimeout(() => {
    if (!battle) return;
    if (!checkBattleEnd()) {
      advanceTurn();
    }
  }, 1850);
}

/* ============================================================
   敌人 AI
   ============================================================ */

function enemyTurn(u) {
  if (!battle || !u.alive) return;

  battle.lastActorId = u.id;
  battle.lastActorSide = "enemy";
  battle.animating = true;

  const action = chooseEnemyAction(u);

  switch (action.type) {
    case "attack": doAttack(u); break;
    case "spell":  doSpell(u, action.spellId); break;
    case "skill":  doSkill(u, action.skillId); break;
    case "item":   doItem(u, action.itemId); break;
    case "flee":   doFlee(u); break;
    case "defend": doDefend(u); break;
  }

  if (!battle) return;
  processTurnEnd(u);
  renderBattle();

  setTimeout(() => {
    if (!battle) return;
    if (!checkBattleEnd()) {
      advanceTurn();
    }
  }, 1850);
}

function chooseEnemyAction(u) {
  const hpRate = u.hp / u.hpMax;

  if (hpRate < AI_CONFIG.healHpThreshold) {
    /* 敌人用回春丹（任意阶任意品） */
    for (const id in u.items) {
      if (u.items[id] <= 0) continue;
      const item = ITEMS[id];
      if (item && item.type === "pill" && item.effect && item.effect.type === "heal") {
        return { type: "item", itemId: id };
      }
    }
  }

  if (u.canFlee && hpRate < AI_CONFIG.fleeHpThreshold && chance(u.fleeRate)) {
    return { type: "flee" };
  }

  /* 收集可用法术与功法招式，让敌人高频施展功法法术与武技 */
  const usableSpells = (!isSilenced(u) && Array.isArray(u.spells))
    ? u.spells.filter(sid => {
        const sp = getSpell(sid);
        return sp && u.mp >= (sp.cost && sp.cost.mp ? sp.cost.mp : 0);
      })
    : [];

  const usableSkills = Array.isArray(u.skills)
    ? u.skills.filter(sid => {
        const sk = getCombatSkill(sid);
        if (!sk) return false;
        const cost = getSkillCost(sk, u);
        return u.hp > Math.max(cost.hp + 2, AI_CONFIG.skillHpThreshold);
      })
    : [];

  const roll = Math.random();
  if (usableSpells.length > 0 && roll < 0.48) {
    return { type: "spell", spellId: pick(usableSpells) };
  }
  if (usableSkills.length > 0 && roll < 0.78) {
    return { type: "skill", skillId: pick(usableSkills) };
  }
  if (usableSpells.length > 0 && usableSkills.length === 0 && roll < 0.65) {
    return { type: "spell", spellId: pick(usableSpells) };
  }

  return { type: "attack" };
}

/* ============================================================
   目标
   ============================================================ */

function getTargetsByType(caster, targetType, pickedTargetId) {
  if (!battle) return [];

  const enemySide = caster.side === "player" ? "enemy" : "player";
  const allySide = caster.side;

  const aliveEnemies = battle.units.filter(u =>
    u.side === enemySide && u.alive && !u.escaped && !u.tamed
  );
  const aliveAllies = battle.units.filter(u =>
    u.side === allySide && u.alive
  );

  switch (targetType) {
    case "enemySingle": {
      if (pickedTargetId) {
        const t = aliveEnemies.find(u => u.id === pickedTargetId);
        return t ? [t] : [];
      }
      return aliveEnemies.length > 0 ? [pick(aliveEnemies)] : [];
    }
    case "enemyAll":
      return aliveEnemies;
    case "allySingle": {
      if (pickedTargetId) {
        const t = aliveAllies.find(u => u.id === pickedTargetId);
        return t ? [t] : [];
      }
      return aliveAllies.length > 0 ? [pick(aliveAllies)] : [];
    }
    case "allyAll":
      return aliveAllies;
    case "all":
      return battle.units.filter(u => u.alive && !u.escaped && !u.tamed);
    default:
      return aliveEnemies.length > 0 ? [pick(aliveEnemies)] : [];
  }
}

function targetNeedsPick(targetType) {
  return targetType === "enemySingle" || targetType === "allySingle";
}

/* ============================================================
   有效属性
   ============================================================ */

function getEffectiveAtk(unit) {
  const mod = getStatusMod(unit);
  return Math.max(1, Math.floor(unit.atk * (1 + mod.atk)));
}

function getEffectiveDef(target, attacker) {
  const mod = getStatusMod(target);
  let def = Math.max(0, Math.floor(target.def * (1 + mod.def)));

  if (attacker && attacker.isPlayer) {
    const hd = getCurrentHeavenDefyingEffect();
    if (hd && hd.armorPierce) def *= (1 - hd.armorPierce);
  }

  return Math.floor(def);
}

function getEffectiveSpeed(unit) {
  const mod = getStatusMod(unit);
  return Math.max(1, Math.floor(unit.speed * (1 + mod.speed)));
}

/* ============================================================
   动作实现
   ============================================================ */

function queueBattleVfx(evt) {
  if (!battle) return;
  if (!battle.vfxQueue) battle.vfxQueue = [];
  battle.vfxQueue.push(evt);
}

function resolveUnitArtTitle(unit) {
  if (!unit) return "玄门心法";
  if (unit.artName) return unit.artName;
  if (unit.isPlayer && typeof getCurrentArt === "function") {
    const art = getCurrentArt();
    if (art && art.name) return art.name;
  }
  if (unit.isPet) return "通灵伴生诀";
  return "妖丹本源诀";
}

/* 解析单位随身法宝/主兵刃灵韵共鸣（用于战斗中法宝助战视觉演出与伤害加持） */
function resolveUnitArtifactResonance(unit, actionKind) {
  if (!unit) return null;
  if (unit.isPlayer && S && S.equipped) {
    const art1Id = S.equipped.artifact1;
    const art2Id = S.equipped.artifact2;
    const weapId = S.equipped.rightHand;
    const pickId = (actionKind === "spell" ? (art1Id || art2Id || weapId) : (weapId || art1Id || art2Id));
    if (pickId && typeof findEquipById === "function") {
      const eq = findEquipById(pickId);
      if (eq && eq.name) {
        return {
          name: eq.name,
          dmgMul: (art1Id || art2Id) ? 0.08 : 0.05,
        };
      }
    }
  }
  if (unit.isPet) {
    return { name: "伴生兽魂契印", dmgMul: 0.05 };
  }
  if (unit.side === "enemy" && ((unit.realm || 1) >= 2 || (unit.sub || 1) >= 5)) {
    return {
      name: unit.isBeast ? "本命妖丹" : "护体煞器",
      dmgMul: 0.05,
    };
  }
  return null;
}

function doAttack(attacker, pickedTargetId) {
  const targets = getTargetsByType(attacker, "enemySingle", pickedTargetId);
  if (targets.length === 0) return;
  const target = targets[0];

  const crit = chance(calcCritRate(attacker));
  let dmg = FORMULA.attackDamage(getEffectiveAtk(attacker), getEffectiveDef(target, attacker));
  const artRes = resolveUnitArtifactResonance(attacker, "attack");
  if (artRes && artRes.dmgMul) {
    dmg = Math.max(1, Math.floor(dmg * (1 + artRes.dmgMul)));
  }
  if (crit) dmg = Math.floor(dmg * FORMULA.critMult);
  const elemKey = typeof getUnitElementKey === "function" ? getUnitElementKey(attacker) : (attacker.element || "neutral");
  const artTitle = resolveUnitArtTitle(attacker);
  const moveLabel = crit ? "会心普攻" : (attacker.side === "enemy" ? "煞气强袭" : "兵刃交击");

  applyDamage(target, dmg, { attackerName: attacker.name, moveName: moveLabel });
  logBattle(`${attacker.name} 催动《${artTitle}》攻击 ${target.name}，造成 ${dmg} 伤害${crit ? "（暴击）" : ""}`);

  if (battle) {
    battle.lastActorId = attacker.id;
    battle.lastActorSide = attacker.side;
    battle.lastActionElement = elemKey;
    battle.lastActionLabel = moveLabel;
  }

  queueBattleVfx({
    kind: "attack",
    attackerId: attacker.id,
    attackerName: attacker.name,
    attackerSide: attacker.side,
    attackerArt: artTitle,
    artifactName: artRes ? artRes.name : null,
    targetId: target.id,
    targetName: target.name,
    targetSide: target.side,
    dmg,
    crit,
    element: elemKey,
    label: moveLabel,
  });

  if (attacker.attackInflict && target.alive) {
    for (const sid in attacker.attackInflict) {
      tryInflictStatus(target, sid, attacker.attackInflict[sid]);
    }
  }
}

/* 战斗中施展法术或武技时，提升对应百艺修道造诣（如剑法法术提升【剑】造诣） */
function gainBattleSkillProficiency(skillKeys, expGain) {
  if (!S || !S.skills || !Array.isArray(skillKeys) || expGain <= 0) return;
  const maxLvl = typeof MAX_SKILL_LVL !== "undefined" ? MAX_SKILL_LVL : 10;
  const lvlExp = typeof SKILL_LVL_EXP !== "undefined" ? SKILL_LVL_EXP : 100;
  const uniqueKeys = [...new Set(skillKeys.filter(Boolean))];
  uniqueKeys.forEach(k => {
    if (!S.skills[k]) return;
    if (S.skills[k].lvl >= maxLvl) {
      S.skills[k].exp = 0;
      return;
    }
    S.skills[k].exp = +((S.skills[k].exp || 0) + expGain).toFixed(2);
    while (S.skills[k].exp >= lvlExp && S.skills[k].lvl < maxLvl) {
      S.skills[k].exp = +(S.skills[k].exp - lvlExp).toFixed(2);
      S.skills[k].lvl++;
      log(`【百艺精进】你在实战中有所顿悟，【${k}】造诣提升至 Lv.${S.skills[k].lvl}！`, "c-gold");
      logBattle(`【百艺精进】【${k}】提升至 Lv.${S.skills[k].lvl}！`);
    }
    if (S.skills[k].lvl >= maxLvl) {
      S.skills[k].exp = 0;
    }
  });
}

function doSpell(caster, spellId, pickedTargetId) {
  const spell = getSpell(spellId);
  if (!spell) return;
  if (caster.mp < spell.cost.mp) return;
  if (isSilenced(caster)) {
    logBattle(`${caster.name} 被沉默，无法施法`);
    return;
  }

  const targetType = spell.target || "enemySingle";
  const targets = getTargetsByType(caster, targetType, pickedTargetId);
  if (targets.length === 0) return;

  caster.mp -= spell.cost.mp;

  /* 玩家施展法术时，增加对应百艺修道造诣（如剑系法术增加【剑】造诣） */
  if (caster.isPlayer) {
    const masteryKeys = [];
    if (spell.type && S && S.skills && S.skills[spell.type]) {
      masteryKeys.push(spell.type);
    }
    if (spell.skillReq && typeof spell.skillReq === "object") {
      Object.keys(spell.skillReq).forEach(k => {
        if (S && S.skills && S.skills[k]) masteryKeys.push(k);
      });
    }
    if (masteryKeys.length > 0) {
      gainBattleSkillProficiency(masteryKeys, 5);
    }
  }

  const bonus = getSpellBonusForUnit(caster);
  const elemKey = typeof getSpellElementKey === "function" ? getSpellElementKey(spell, caster) : (caster.element || "huo");
  const artTitle = resolveUnitArtTitle(caster);
  const artRes = resolveUnitArtifactResonance(caster, "spell");

  if (battle) {
    battle.lastActorId = caster.id;
    battle.lastActorSide = caster.side;
    battle.lastActionElement = elemKey;
    battle.lastActionLabel = spell.name;
  }

  targets.forEach(target => {
    const crit = chance(Math.min(0.65, calcCritRate(caster) + 0.04));
    let dmg = FORMULA.spellDamage(getEffectiveAtk(caster), spell.power, bonus, getEffectiveDef(target, caster));
    if (artRes && artRes.dmgMul) {
      dmg = Math.max(1, Math.floor(dmg * (1 + artRes.dmgMul)));
    }
    if (crit) dmg = Math.floor(dmg * FORMULA.critMult);
    applyDamage(target, dmg, { attackerName: caster.name, moveName: spell.name });
    logBattle(`${caster.name} 运转《${artTitle}》施展法术【${spell.name}】轰击 ${target.name}，造成 ${dmg} 伤害${crit ? "（暴击）" : ""}`);

    queueBattleVfx({
      kind: "spell",
      attackerId: caster.id,
      attackerName: caster.name,
      attackerSide: caster.side,
      attackerArt: artTitle,
      artifactName: artRes ? artRes.name : null,
      targetId: target.id,
      targetName: target.name,
      targetSide: target.side,
      dmg,
      crit,
      element: elemKey,
      label: spell.name,
      isAoE: targets.length > 1,
    });

    if (spell.inflict && target.alive) {
      for (const sid in spell.inflict) {
        tryInflictStatus(target, sid, spell.inflict[sid]);
      }
    }
  });
}

function doSkill(caster, skillId, pickedTargetId) {
  const sk = getCombatSkill(skillId);
  if (!sk) return;

  const cost = getSkillCost(sk, caster);
  if (caster.hp < cost.hp) return;

  const targetType = sk.target || "enemySingle";
  const targets = getTargetsByType(caster, targetType, pickedTargetId);
  if (targets.length === 0) return;

  if (sk.canKill) {
    caster.hp -= cost.hp;
  } else {
    caster.hp = Math.max(BATTLE_CONST.hpFloorNormal, caster.hp - cost.hp);
  }

  /* 玩家施展功法武技时，同样增加对应百艺修道造诣 */
  if (caster.isPlayer) {
    const masteryKeys = [];
    if (sk.type && S && S.skills && S.skills[sk.type]) {
      masteryKeys.push(sk.type);
    }
    if (sk.skillReq && typeof sk.skillReq === "object") {
      Object.keys(sk.skillReq).forEach(k => {
        if (S && S.skills && S.skills[k]) masteryKeys.push(k);
      });
    }
    if (masteryKeys.length > 0) {
      gainBattleSkillProficiency(masteryKeys, 4);
    }
  }

  const elemKey = typeof getSkillElementKey === "function" ? getSkillElementKey(sk, caster) : (caster.element || "jin");
  const artTitle = resolveUnitArtTitle(caster);
  const artRes = resolveUnitArtifactResonance(caster, "skill");

  if (battle) {
    battle.lastActorId = caster.id;
    battle.lastActorSide = caster.side;
    battle.lastActionElement = elemKey;
    battle.lastActionLabel = sk.name;
  }

  targets.forEach(target => {
    const crit = chance(Math.min(0.65, calcCritRate(caster) + 0.03));
    let dmg = FORMULA.skillDamage(getEffectiveAtk(caster), sk.power, getEffectiveDef(target, caster));
    if (artRes && artRes.dmgMul) {
      dmg = Math.max(1, Math.floor(dmg * (1 + artRes.dmgMul)));
    }
    if (crit) dmg = Math.floor(dmg * FORMULA.critMult);
    applyDamage(target, dmg, { attackerName: caster.name, moveName: sk.name });
    logBattle(`${caster.name} 催动《${artTitle}》施展武技【${sk.name}】重创 ${target.name}，造成 ${dmg} 伤害${crit ? "（暴击）" : ""}`);

    queueBattleVfx({
      kind: "skill",
      attackerId: caster.id,
      attackerName: caster.name,
      attackerSide: caster.side,
      attackerArt: artTitle,
      artifactName: artRes ? artRes.name : null,
      targetId: target.id,
      targetName: target.name,
      targetSide: target.side,
      dmg,
      crit,
      element: elemKey,
      label: sk.name,
      isAoE: targets.length > 1,
    });

    if (sk.inflict && target.alive) {
      for (const sid in sk.inflict) {
        tryInflictStatus(target, sid, sk.inflict[sid]);
      }
    }
  });

  if (caster.hp <= 0) {
    caster.hp = 0;
    caster.alive = false;
    logBattle(`${caster.name} 力竭倒下`);
  }
}

/* ============================================================
   使用道具
   ============================================================ */

function doItem(u, itemId, targetId) {
  const item = ITEMS[itemId];
  if (!item || item.type !== "pill" || !item.effect) return;

  if (u.isPlayer) {
    if (!hasItem(itemId)) return;

    if (item.effect.type === "inflict") {
      let target;
      if (targetId) {
        target = battle.units.find(x => x.id === targetId && x.alive);
      } else {
        target = pick(battle.units.filter(x =>
          x.side === "enemy" && x.alive && !x.escaped && !x.tamed
        ));
      }
      if (!target) return;
      tryInflictStatus(target, item.effect.status, item.effect.chance || 0.8);
      logBattle(`${u.name} 使用【${item.name}】`);
      removeItem(itemId, 1);
      return;
    }

    const ok = applyPillEffect(item, u, true);
    if (!ok) return;
    removeItem(itemId, 1);
    return;
  }

  if (!u.items[itemId] || u.items[itemId] <= 0) return;

  if (item.effect.type === "inflict") return;

  applyPillEffect(item, u, true);
  u.items[itemId]--;
  if (u.items[itemId] <= 0) delete u.items[itemId];
}

function applyPillEffect(item, unit, inBattle) {
  const e = item.effect;
  if (!e) return false;

  switch (e.type) {
    case "heal": {
      const v = Math.floor(unit.hpMax * (e.value || 0.5));
      if (unit.hp >= unit.hpMax) return false;
      unit.hp = Math.min(unit.hpMax, unit.hp + v);
      if (inBattle) {
        logBattle(`${unit.name} 使用【${item.name}】，回复 ${v} 气血`);
        queueBattleVfx({
          kind: "heal",
          targetId: unit.id,
          targetName: unit.name,
          dmg: v,
          crit: false,
          element: "mu",
          label: item.name,
        });
      }
      return true;
    }
    case "healMp": {
      const v = Math.floor((unit.mpMax || 0) * (e.value || 0.5));
      if (!unit.mpMax || unit.mp >= unit.mpMax) return false;
      unit.mp = Math.min(unit.mpMax, unit.mp + v);
      if (inBattle) logBattle(`${unit.name} 使用【${item.name}】，回复 ${v} 灵力`);
      return true;
    }
    case "cure": {
      if (!unit.statuses) return false;
      const had = unit.statuses.some(s => s.id === e.status);
      if (!had) return false;
      removeStatus(unit, e.status);
      if (inBattle) logBattle(`${unit.name} 使用【${item.name}】，解除【${getStatusDef(e.status).name}】`);
      return true;
    }
    case "cureAll": {
      if (!unit.statuses) return false;
      const before = unit.statuses.length;
      unit.statuses = unit.statuses.filter(s => {
        const def = getStatusDef(s.id);
        return def && def.type === "buff";
      });
      if (unit.statuses.length === before) return false;
      if (inBattle) logBattle(`${unit.name} 使用【${item.name}】，净化所有负面`);
      return true;
    }
    case "buff": {
      if (!inBattle) return false;
      addStatus(unit, e.statusId, e.turns);
      logBattle(`${unit.name} 使用【${item.name}】`);
      return true;
    }
    case "survive": {
      if (!inBattle) return false;
      if (!unit._survive) unit._survive = [];
      unit._survive.push({ threshold: e.value || 0.3, used: false });
      logBattle(`${unit.name} 使用【${item.name}】，获得濒死保护`);
      return true;
    }
    default:
      return false;
  }
}

function doDefend(u) {
  u.defending = true;
  logBattle(`${u.name} 进入防御姿态`);
}

function doFlee(u) {
  if (u.isPlayer) {
    const enemy = pickTarget(u);
    const rate = calcPlayerFleeRate(u, enemy);
    if (chance(rate)) {
      logBattle("逃跑成功");
      endBattle("flee");
      return;
    }
    logBattle("逃跑失败");
    if (enemy) doAttack(enemy, u.id);
  } else {
    if (!u.canFlee) return;
    if (chance(u.fleeRate)) {
      u.escaped = true;
      logBattle(`${u.name} 逃跑了`);
    } else {
      logBattle(`${u.name} 逃跑失败`);
    }
  }
}

function doTame(u, targetId) {
  let target;
  if (targetId) {
    target = battle.units.find(x =>
      x.id === targetId && x.alive && x.isBeast && !x.tamed
    );
  } else {
    target = pickAliveBeast();
  }
  if (!target) { logBattle("没有可收服的妖兽"); return; }

  /* 检查洞府【灵兽苑】容量上限（0级限1只，每升1级+1只） */
  const curPetCount = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list.length : 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + ((S && S.cave && S.cave.beast) || 0));
  if (curPetCount >= maxPets) {
    const beastLv = (S && S.cave && S.cave.beast) || 0;
    logBattle(`【收服受限】洞府【灵兽苑】（Lv.${beastLv}）最多容纳 ${maxPets} 只灵兽（当前 ${curPetCount}/${maxPets} 只）！请前往【洞府 > 洞天营造】升级灵兽苑。`);
    return;
  }

  /* 仅炼气1重幼兽妖兽可能被收服，其余必定失败 */
  const canCaptureByRealm = (target.realm === 1 && target.sub === 1) || (target.realm === 0 && target.sub <= 1);
  if (!canCaptureByRealm) {
    logBattle(`【收服失败】${target.name}道基已固（高于炼气一层），凶性滔天，凡品契印无法降服，收服必定失败！`);
    return;
  }

  /* 削血加成捕获率 */
  const hpRatio = target.hp / Math.max(1, target.hpMax);
  let rate = target.tameRate || 0.25;
  if (hpRatio <= 0.25) {
    rate += 0.50;
  } else if (hpRatio <= 0.50) {
    rate += 0.30;
  } else if (hpRatio <= 0.75) {
    rate += 0.15;
  }

  if (chance(rate)) {
    target.tamed = true;
    target.alive = false;

    const pet = genPet(target.defId, target.name);
    if (!S.pets) S.pets = { list: [], nextUid: 1 };
    if (!S.pets.list) S.pets.list = [];
    S.pets.list.push(pet);

    if (!S.equipped) S.equipped = {};
    let isAutoEquipped = false;
    if (!S.equipped.pet) {
      S.equipped.pet = pet.uid;
      isAutoEquipped = true;
      logBattle(`【通灵契约】大获成功！你缔结法契收服了【${target.name}】，并立即将其设为出战伴生兽！`);
    } else {
      logBattle(`【通灵契约】大获成功！你缔结法契收服了【${target.name}】（已纳入洞府灵宠囊，可随时换出战）！`);
    }

    const pStats = typeof getPetStats === "function" ? getPetStats(pet) : null;
    const icon = typeof getPetOrAllyIcon === "function" ? getPetOrAllyIcon(target) : "🐾";
    const realmName = (typeof REALMS !== "undefined" && REALMS[pet.realm || 0]) ? REALMS[pet.realm || 0].name : "凡阶";
    if (!battle.tamedPets) battle.tamedPets = [];
    battle.tamedPets.push({
      uid: pet.uid,
      name: pet.name,
      icon,
      roleLabel: isAutoEquipped ? "新收服灵宠 · 已出战" : "新收服灵宠 · 收入仙苑",
      realmText: `${realmName} · Lv.${pet.lvl || 1}`,
      talentText: pStats && pStats.talent && pStats.bloodline
        ? `${pStats.talent.name}天赋 · ${pStats.bloodline.name}`
        : "通灵幼兽",
      atk: pStats ? pStats.atk : target.atk,
      def: pStats ? pStats.def : target.def,
      hpMax: pStats ? pStats.hpMax : target.hpMax,
      isEquipped: isAutoEquipped,
    });
  } else {
    logBattle(`【收服受挫】${target.name}挣脱了契印灵光，收服失败！`);
  }
}

/* ============================================================
   工具
   ============================================================ */

function pickTarget(u) {
  const enemySide = u.side === "player" ? "enemy" : "player";
  const alive = battle.units.filter(x =>
    x.side === enemySide && x.alive && !x.escaped && !x.tamed
  );
  return alive.length > 0 ? pick(alive) : null;
}

function pickAliveBeast() {
  const beasts = battle.units.filter(u =>
    u.side === "enemy" && u.alive && u.isBeast && !u.tamed
  );
  return beasts.length > 0 ? pick(beasts) : null;
}

function getSkillCost(sk, unit) {
  const cost = sk.cost || {};
  let hp = cost.hp || 0;
  if (hp > 0 && hp <= 1) hp = Math.floor(unit.hp * hp);
  return { hp };
}

function getSpellBonusForUnit(u) {
  if (!u) return 0;
  if (u.isPlayer) return getSpellBonus();
  /* 敌人与灵宠同样享受自身功法/妖丹与境界带来的法术威力加成 */
  const realmBonus = Math.max(0, (u.realm || 1) * 0.08);
  const subBonus = Math.max(0, (u.sub || 1) * 0.02);
  return realmBonus + subBonus;
}

function applyDamage(target, dmg, sourceInfo) {
  if (target.isPlayer && target._survive && target._survive.length > 0) {
    const cur = target.hp;
    const after = cur - dmg;
    if (after <= 0) {
      const s = target._survive.find(x => !x.used);
      if (s) {
        s.used = true;
        target.hp = Math.max(1, Math.floor(target.hpMax * (s.threshold || 0.3)));
        logBattle(`${target.name} 的续命丹碎裂，留下一线生机！`);
        return;
      }
    }
  }

  if (target.defending) {
    dmg = Math.floor(dmg * (1 - FORMULA.defendReduce));
    target.defending = false;
  }

  if (target.statuses) {
    const shield = target.statuses.find(s => s.id === "shield");
    if (shield) {
      const def = getStatusDef("shield");
      const sv = def.shieldValue || 0;
      if (sv >= dmg) {
        shield.turns = 0;
        logBattle(`${target.name} 的护盾吸收了全部伤害`);
        return;
      } else {
        dmg -= sv;
        shield.turns = 0;
        logBattle(`${target.name} 的护盾抵消了 ${sv} 伤害`);
      }
    }
  }

  target.hp -= dmg;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    if (sourceInfo && sourceInfo.attackerName) {
      target._killedBy = sourceInfo.attackerName;
      target._killedByMove = sourceInfo.moveName || "致命一击";
    } else if (!target._killedBy) {
      target._killedBy = "伤势毒发";
      target._killedByMove = "持续伤势";
    }
  }
}

function logBattle(text) {
  if (!battle) return;
  battle.log.push(text);
  if (battle.log.length > BATTLE_CONST.logMax) battle.log.shift();
}

/* ============================================================
   胜负与战利品结算构建
   ============================================================ */

function buildLootItemRecord(itemId, count) {
  if (!itemId || count <= 0) return null;
  const details = typeof getItemDetails === "function" ? getItemDetails(itemId, count) : null;
  const raw = (typeof getItem === "function" ? getItem(itemId) : null) || (typeof ITEMS !== "undefined" ? ITEMS[itemId] : null);
  const icon = (details && details.icon)
    || (typeof getItemIcon === "function" ? getItemIcon(raw, itemId) : "📦");
  const name = (details && details.name && details.name !== itemId)
    ? details.name
    : (raw && raw.name ? raw.name : itemId);
  const grade = (details && details.grade !== undefined)
    ? details.grade
    : (raw && raw.grade !== undefined ? raw.grade : null);
  const typeName = (details && details.typeName) || "战利灵物";
  const desc = (details && details.desc) || "战斗缴获之修真灵物";
  return {
    id: itemId,
    name,
    icon,
    count: count || 1,
    grade,
    typeName,
    desc,
  };
}

/* 为击杀敌人结算自然战利品（补充灵材、矿石、丹药或饲灵丸，让战利品列表充实可感） */
function rollNaturalEnemyDrops(enemyUnit) {
  const results = [];
  if (!enemyUnit) return results;

  const realm = Math.max(1, enemyUnit.realm || 1);
  const sub = Math.max(1, enemyUnit.sub || 1);
  const isEliteOrBoss = sub >= 4 || realm >= 2;

  /* 1. 灵草材料掉落 (约 75% 概率) */
  if (chance(isEliteOrBoss ? 0.92 : 0.75) && typeof MAT_BASE !== "undefined" && Array.isArray(MAT_BASE) && MAT_BASE.length > 0) {
    const minG = realm <= 1 ? 1 : (realm === 2 ? 3 : 6);
    const maxG = realm <= 1 ? (sub >= 5 ? 3 : 2) : (realm === 2 ? 5 : 8);
    const matBase = pick(MAT_BASE);
    if (matBase) {
      const g = Math.min(matBase.maxGrade || 9, rndInt(minG, maxG));
      const matId = `${matBase.id}_${g}`;
      const cnt = isEliteOrBoss ? rndInt(1, 2) : 1;
      addItem(matId, cnt);
      const rec = buildLootItemRecord(matId, cnt);
      if (rec) results.push(rec);
    }
  }

  /* 2. 炼器矿石材料掉落 (约 45% 概率) */
  if (chance(isEliteOrBoss ? 0.68 : 0.42) && typeof FORGE_MATERIALS !== "undefined" && Array.isArray(FORGE_MATERIALS) && FORGE_MATERIALS.length > 0) {
    const tierFilter = FORGE_MATERIALS.filter(m => (m.realm || m.tier || 1) <= realm + 1);
    const fMat = pick(tierFilter.length > 0 ? tierFilter : FORGE_MATERIALS);
    if (fMat && fMat.id) {
      const cnt = 1;
      addItem(fMat.id, cnt);
      const rec = buildLootItemRecord(fMat.id, cnt);
      if (rec) results.push(rec);
    }
  }

  /* 3. 妖兽额外掉落饲灵丸或疗伤丹药 (约 40% 概率) */
  if (enemyUnit.isBeast && chance(0.42)) {
    const foodId = "饲灵丸_1阶_1品";
    if (typeof getItem === "function") getItem(foodId);
    addItem(foodId, 1);
    const rec = buildLootItemRecord(foodId, 1);
    if (rec) results.push(rec);
  } else if (!enemyUnit.isBeast && chance(0.45)) {
    const pillTier = Math.min(3, Math.max(1, realm));
    const pillGrade = sub >= 6 ? 2 : 1;
    const pillId = `回春丹_${pillTier}阶_${pillGrade}品`;
    if (typeof getItem === "function") getItem(pillId);
    addItem(pillId, 1);
    const rec = buildLootItemRecord(pillId, 1);
    if (rec) results.push(rec);
  }

  return results;
}

function checkBattleEnd() {
  if (!battle) return true;

  const playerAlive = battle.units.some(u => u.side === "player" && u.alive);
  const enemyAlive = battle.units.some(u =>
    u.side === "enemy" && u.alive && !u.escaped && !u.tamed
  );

  if (!playerAlive) { endBattle("lose"); return true; }
  if (!enemyAlive) {
    const anyTamed = battle.units.some(u => u.side === "enemy" && u.tamed);
    const anyKilled = battle.units.some(u =>
      u.side === "enemy" && !u.alive && !u.tamed && !u.escaped
    );
    if (anyTamed && !anyKilled) {
      endBattle("tame");
    } else {
      endBattle("win");
    }
    return true;
  }
  return false;
}

function endBattle(result) {
  if (!battle) return;

  const b = battle;
  const playerUnit = b.units.find(u => u.isPlayer) || b.units[0];

  /* 汇总敌方单位终态列表（带图标） */
  const enemyRecords = b.units
    .filter(u => u && u.side === "enemy")
    .map(u => {
      const icon = typeof getPetOrAllyIcon === "function" ? getPetOrAllyIcon(u) : (u.isBeast ? "🐾" : "⚔️");
      const realmName = (typeof REALMS !== "undefined" && REALMS[u.realm || 0]) ? REALMS[u.realm || 0].name : "凡人";
      const isDead = !u.alive || u.hp <= 0;
      const statusKey = u.tamed ? "tamed" : u.escaped ? "escaped" : (isDead ? "killed" : "alive");
      const statusLabel = u.tamed ? "已收服" : u.escaped ? "已遁走" : (isDead ? "已击毙" : "存活");
      return {
        id: u.id,
        defId: u.defId,
        name: u.name,
        icon,
        realmText: u.realm > 0 ? `${realmName}·${u.sub || 1}重` : "凡胎",
        statusKey,
        statusLabel,
        hp: u.hp,
        hpMax: u.hpMax,
        exp: u.exp || 0,
        stone: u.stone || 0,
      };
    });

  if (result === "win" || result === "tame") {
    let totalExp = 0, totalStone = 0;
    const killed = [];
    b.units.forEach(u => {
      const isDead = !u.alive || u.hp <= 0;
      if (u.side === "enemy" && isDead && !u.escaped && !u.tamed) {
        u.alive = false;
        totalExp += u.exp || 0;
        totalStone += u.stone || 0;
        killed.push(u);
      } else if (u.side === "enemy" && u.tamed) {
        /* 收服妖兽亦获得基础历练修为与灵石感悟 */
        totalExp += Math.floor((u.exp || 20) * 0.6);
        totalStone += Math.floor((u.stone || 10) * 0.5);
      }
    });
    /* ★ 经验值平分给所有存活的我方单位；阵亡单位不得经验，满级未突破灵兽不加经验 */
    const aliveAllies = b.units.filter(u => u && u.side === "player" && u.alive && u.hp > 0);
    const shareCount = Math.max(1, aliveAllies.length);
    const expPerAliveUnit = Math.floor(totalExp / shareCount);
    const playerExpGain = (playerUnit && playerUnit.alive && playerUnit.hp > 0) ? expPerAliveUnit : 0;

    S.exp += playerExpGain;
    S.stone += totalStone;

    /* 逆天宝物：杀敌叠层 */
    killed.forEach(() => addKillStack());

    /* 逆天宝物：杀敌揭示 */
    if (killed.length > 0) {
      checkHeavenDefyingReveal("kill");
    }

    const deadPets = handlePetsAfterBattle(b.units, killed, expPerAliveUnit);

    /* ★ 战利品掉落（合并配置掉落与自然掉落，并生成带图标的详情条目） */
    const droppedMap = new Map();
    const mergeDropRecord = (rec) => {
      if (!rec || !rec.id) return;
      if (droppedMap.has(rec.id)) {
        droppedMap.get(rec.id).count += rec.count;
      } else {
        droppedMap.set(rec.id, Object.assign({}, rec));
      }
    };

    killed.forEach(enemyUnit => {
      const enemyDef = getEnemyById(enemyUnit.defId);
      let hadCustomDrops = false;
      if (enemyDef && Array.isArray(enemyDef.drops) && enemyDef.drops.length > 0) {
        hadCustomDrops = true;
        enemyDef.drops.forEach(drop => {
          if (!chance(drop.chance || 1)) return;
          if (drop.type === "mat") {
            const grade = rndInt(drop.gradeRange[0], drop.gradeRange[1]);
            const itemId = drop.baseId + "_" + grade;
            addItem(itemId, drop.count);
            mergeDropRecord(buildLootItemRecord(itemId, drop.count));
          } else if (drop.type === "stone") {
            const amount = rndInt(drop.amount[0], drop.amount[1]);
            S.stone += amount;
            totalStone += amount;
          } else if (drop.type === "item") {
            const finalId = typeof resolveAdventureItemId === "function" ? resolveAdventureItemId(drop.id) : drop.id;
            addItem(finalId, drop.count);
            mergeDropRecord(buildLootItemRecord(finalId, drop.count));
          }
        });
      }

      /* 自然战利品掉落 */
      if (!hadCustomDrops) {
        const natDrops = rollNaturalEnemyDrops(enemyUnit);
        natDrops.forEach(mergeDropRecord);
      }
    });

    const droppedItemsList = Array.from(droppedMap.values());
    const droppedItemsText = droppedItemsList.map(d => `${d.icon}${d.name}×${d.count}`);

    if (result === "win") {
      logBattle(`战斗胜利！获得修为 ${playerExpGain}，灵石 ${totalStone}`);
      if (droppedItemsText.length > 0) {
        logBattle(`战利品：${droppedItemsText.join("、")}`);
      }

      /* ★ 榜单战斗胜利 */
      if (S.flags.rankBattle && typeof handleRankBattleWin === "function") {
        handleRankBattleWin();
      }

      /* ★ 小比战斗胜利 */
      if (S.flags.competitionBattle && typeof handleCompetitionWin === "function") {
        handleCompetitionWin();
      }

    } else {
      logBattle(`收服成功！获得修为 ${playerExpGain}，灵石 ${totalStone}`);
    }

    if (deadPets && deadPets.length > 0) {
      const names = deadPets.map(p => p.name).join("、");
      log(`【灵宠陨落】${names} 在战斗中护主力竭而陨落。`, "c-bad");
    }

    /* ★ 如果是从冒险地进入的战斗，记录结果并累计历练收获 */
    if (S.flags && S.flags.adventureCombat) {
      S.flags.adventureCombat.result = result;
      if (typeof recordAdventureGain === "function") {
        recordAdventureGain({ exp: playerExpGain, stone: totalStone });
        droppedItemsList.forEach(d => {
          if (d && d.id && d.count > 0) {
            recordAdventureGain({ itemId: d.id, count: d.count });
          }
        });
      }
    }

    const settlementData = {
      result,
      rounds: b.round || 1,
      exp: playerExpGain,
      totalExp,
      stone: totalStone,
      items: droppedItemsList,
      enemies: enemyRecords,
      newAllies: [...(b.tamedPets || []), ...(b.joinedAllies || [])],
      survivingAllies: (deadPets && deadPets.survivingAllies) || [],
      fallenAllies: (deadPets && deadPets.fallenAllies) || [],
      playerStatus: {
        name: S.name,
        hp: S.hp,
        hpMax: totalMaxHp(),
        mp: S.mp,
        mpMax: totalMaxMp(),
      },
    };

    clearBattleStatuses();
    battle = null;
    save();
    render();
    showBattleResult(result, playerExpGain, totalStone, settlementData);

  } else if (result === "lose") {
    const deadPets = handlePetsAfterBattle(b.units, []);
    if (S.flags && S.flags.adventureCombat) {
      S.flags.adventureCombat.result = "lose";
    }

    /* ★ 榜单战斗失败 */
    if (S.flags.rankBattle && typeof handleRankBattleLose === "function") {
      handleRankBattleLose();
    }

    /* ★ 小比战斗失败 */
    if (S.flags.competitionBattle && typeof handleCompetitionLose === "function") {
      handleCompetitionLose();
    }

    const settlementData = {
      result: "lose",
      rounds: b.round || 1,
      exp: 0,
      stone: 0,
      items: [],
      enemies: enemyRecords,
      newAllies: [],
      survivingAllies: (deadPets && deadPets.survivingAllies) || [],
      fallenAllies: (deadPets && deadPets.fallenAllies) || [],
      playerStatus: {
        name: S.name,
        hp: 0,
        hpMax: totalMaxHp(),
        mp: S.mp,
        mpMax: totalMaxMp(),
        killedBy: (playerUnit && playerUnit._killedBy) || (enemyRecords[0] && enemyRecords[0].name) || "强敌",
        killedByMove: (playerUnit && playerUnit._killedByMove) || "致命重击",
      },
    };

    clearBattleStatuses();

    battle = null;
    save();
    render();
    showBattleResult("lose", 0, 0, settlementData);

    /*
       ★ 修复（P0-3）：
       战败画面展示阵亡详情与特效，玩家可点击【兵解轮回 · 结算因果】立即触发 die()，
       或等待倒计时自动调用 die()（内部会先 checkRevive()，有逆天宝物则免死）。
    */
    if (window._battleDeathTimer) clearTimeout(window._battleDeathTimer);
    window._battleDeathTimer = setTimeout(() => {
      window._battleDeathTimer = null;
      if (typeof confirmBattleLoseDeath === "function") {
        confirmBattleLoseDeath();
      } else if (typeof die === "function") {
        die("战斗失利，身死道消。");
      }
    }, 3800);

  } else if (result === "flee") {
    const deadPets = handlePetsAfterBattle(b.units, []);
    if (S.flags && S.flags.adventureCombat) {
      S.flags.adventureCombat.result = "flee";
    }

    /*
       ★ 修复（P1-4）：
       小比中玩家逃跑时，原代码不调 handleCompetitionLose()，
       导致 S.flags.competitionBattle 永远为 true，下次小比冲突。
       这里补上：逃跑 = 放弃小比，按失败处理（结束本次小比）。
    */
    if (S.flags.rankBattle && typeof handleRankBattleLose === "function") {
      handleRankBattleLose();
    }
    if (S.flags.competitionBattle && typeof handleCompetitionLose === "function") {
      handleCompetitionLose();
    }

    const settlementData = {
      result: "flee",
      rounds: b.round || 1,
      exp: 0,
      stone: 0,
      items: [],
      enemies: enemyRecords,
      newAllies: [...(b.tamedPets || []), ...(b.joinedAllies || [])],
      survivingAllies: (deadPets && deadPets.survivingAllies) || [],
      fallenAllies: (deadPets && deadPets.fallenAllies) || [],
      playerStatus: {
        name: S.name,
        hp: S.hp,
        hpMax: totalMaxHp(),
        mp: S.mp,
        mpMax: totalMaxMp(),
      },
    };

    clearBattleStatuses();
    battle = null;
    save();
    render();
    showBattleResult("flee", 0, 0, settlementData);
  }
}

/* 敌人道具：把模板 id 转成实际物品 id */
function buildEnemyItems(templateItems) {
  const result = {};
  for (const key in templateItems) {
    const val = templateItems[key];
    /* 如果 key 已经是实际物品（含 "_1品" 等后缀），直接用 */
    if (ITEMS[key] && ITEMS[key].type !== "pillTemplate") {
      result[key] = val;
      continue;
    }
    /* 如果是模板 id（如 "回春丹_1阶"），按 1 品生成 */
    const item = typeof getOrCreatePillItem === "function" ? getOrCreatePillItem(key, 1) : null;
    if (item && item.id) result[item.id] = val;
    else result[key] = val;
  }
  return result;
}
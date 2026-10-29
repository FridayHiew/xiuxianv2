/* ============================================================
   core/utils.js - 工具函数
   ============================================================ */

const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "0";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "兆";
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + "亿";
  if (n >= 1e4)  return (n / 1e4).toFixed(2) + "万";
  return Math.floor(n).toString();
}

function subName(zhong) {
  if (zhong <= 3) return "初期";
  if (zhong <= 6) return "中期";
  if (zhong <= 9) return "后期";
  return "圆满";
}

function isBreakPoint(realm, sub) {
  return sub === 3 || sub === 6 || sub === 9;
}

function slotName(slot) {
  return { weapon: "武器", armor: "防具", ring: "饰品" }[slot] || slot;
}

/* 货币 */
function isStoneTier() {
  const rank = S.flags.rank || "杂务";
  return RANKS.indexOf(rank) >= 2;
}
function currencyName() { return isStoneTier() ? "灵石" : "铜钱"; }
function getCurrency()   { return isStoneTier() ? S.stone : S.money; }
function addCurrency(n)  { if (isStoneTier()) S.stone += n; else S.money += n; }
function spendCurrency(n) {
  if (isStoneTier()) {
    if (S.stone < n) return false;
    S.stone -= n; return true;
  } else {
    if (S.money < n) return false;
    S.money -= n; return true;
  }
}

/* 灵根 */
function maxRoot(roots) {
  let mx = 0, key = null;
  for (const k in roots) if (roots[k] > mx) { mx = roots[k]; key = k; }
  return { key, val: mx };
}
function rootRate(roots) {
  const mx = maxRoot(roots);
  if (mx.val === 0) return 0;
  return 0.6 + mx.val * 0.13;
}
function heartRateByRoot(roots) {
  const mx = maxRoot(roots);
  const table = [0, 0.5, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9, 2.3, 2.8];
  return table[Math.min(9, mx.val)] || 0;
}
function genRoots() {
  const roots = {};
  ROOT_TYPES.forEach(r => { roots[r.id] = 0; });

  /* ★ 开局随机生成 0 到 9 灵根 (0品~9品)
     0 = 凡体无灵根(0品), 1~9 = 一品至九品天灵根 */
  const roll = Math.random();
  let maxGrade;
  if (roll < 0.05) {
    maxGrade = 0; // 凡体无灵根 (0品)
  } else if (roll < 0.15) {
    maxGrade = rndInt(1, 2); // 1~2品 下品杂灵根
  } else if (roll < 0.35) {
    maxGrade = rndInt(3, 4); // 3~4品 中品真灵根
  } else if (roll < 0.65) {
    maxGrade = rndInt(5, 6); // 5~6品 上品真灵根
  } else if (roll < 0.85) {
    maxGrade = rndInt(7, 8); // 7~8品 地灵根
  } else {
    maxGrade = 9; // 9品 极品天灵根
  }

  if (maxGrade > 0) {
    // 随机选定主灵根赋予该品阶 (1~9)
    const primaryTypes = [...ROOT_TYPES].sort(() => Math.random() - 0.5);
    roots[primaryTypes[0].id] = maxGrade;

    // 其余辅灵根随机赋予 0 ~ (maxGrade - 1)
    for (let i = 1; i < primaryTypes.length; i++) {
      if (Math.random() < 0.4) {
        roots[primaryTypes[i].id] = rndInt(0, Math.min(maxGrade - 1, 4));
      }
    }
  }

  return roots;
}

/* 心法匹配度 */
function calcArtMatch(art) {
  if (!art) return 50;
  if (art.ignoreMorality) return 95;
  const m = S.morality || 50;

  let match;
  if (art.type === "正") match = m;
  else if (art.type === "邪") match = 100 - m;
  else match = 100 - Math.abs(m - 50) * 2;

  return Math.max(0, Math.min(100, Math.round(match)));
}

/* 本心标签 */
function moralityLabel(m) {
  if (m <= 40) return "邪";
  if (m <= 60) return "中";
  return "正";
}

/* 检查心法本心要求 */
function checkMorality(art) {
  if (!art || art.ignoreMorality) return true;
  const m = S.morality || 50;
  if (art.reqMorality) {
    if (art.reqMorality.min !== undefined && m < art.reqMorality.min) return false;
    if (art.reqMorality.max !== undefined && m > art.reqMorality.max) return false;
    return true;
  }
  if (art.type === "正") return m >= 61;
  if (art.type === "邪") return m <= 40;
  return true;
}

/* 心法本心需求文本（UI） */
function moralityReqText(art) {
  if (art.reqMorality) {
    const parts = [];
    if (art.reqMorality.min !== undefined) parts.push(`本心 ≥ ${art.reqMorality.min}`);
    if (art.reqMorality.max !== undefined) parts.push(`本心 ≤ ${art.reqMorality.max}`);
    return parts.join(" 且 ");
  }
  if (art.type === "正") return "本心 正";
  if (art.type === "邪") return "本心 邪";
  return "无限制";
}

/* 心法查询 */
function getCurrentArt() {
  if (!S || !S.heartArts || !S.heartArts.current) return null;
  return HEART_ARTS.find(a => a.id === S.heartArts.current);
}
function getArtProgress(artId) {
  if (!S || !S.heartArts) return { lvl: 0, exp: 0, proficiency: 0 };
  if (!S.heartArts.progress[artId]) {
    S.heartArts.progress[artId] = { lvl: 0, exp: 0, proficiency: 0 };
  }
  const prog = S.heartArts.progress[artId];
  if (prog.lvl === undefined) prog.lvl = 0;
  if (prog.exp === undefined) prog.exp = 0;
  if (prog.proficiency === undefined) prog.proficiency = 0;
  return prog;
}

/* ============================================================
   玩家境界信息：{ realm, lvl }
   realm: 0=凡人, 1=炼气, 2=筑基, 3=金丹
   lvl: 该境界内的重数（1~10），0 表示凡人

   规则：
   - 每本心法的 realm 表示它属于哪个大境界
   - prog.lvl = 0 表示还没进入该大境界
     · realm=1 且 lvl=0 → 凡人
     · realm=2 且 lvl=0 → 炼气圆满
     · realm=3 且 lvl=0 → 筑基圆满
   - prog.lvl > 0 → 该大境界的 lvl 重
   - 取所有已学心法里能推算出的最高境界
   ============================================================ */
function getPlayerRealmInfo() {
  let bestRealm = 0;
  let bestLvl = 0;

  if (!S || !S.heartArts || !Array.isArray(S.heartArts.learned)) return { realm: 0, lvl: 0 };

  for (const artId of S.heartArts.learned) {
    const art = HEART_ARTS.find(a => a.id === artId);
    const prog = S.heartArts.progress[artId];
    if (!art || !prog) continue;

    const realm = art.realm || 1;

    let r, l;
    if (prog.lvl === 0) {
      r = realm - 1;
      l = r === 1 ? 10 : (r === 2 ? 5 : 3);
      if (r === 0) { r = 0; l = 0; }   /* realm=1 且 lvl=0 → 凡人 */
    } else {
      r = realm;
      l = prog.lvl;
    }

    if (r > bestRealm || (r === bestRealm && l > bestLvl)) {
      bestRealm = r;
      bestLvl = l;
    }
  }

  return { realm: bestRealm, lvl: bestLvl };
}

/* 兼容旧函数 */
function getPlayerRealm() {
  return getPlayerRealmInfo().lvl;
}

/* 获取玩家所属宗门名称（用于剧情动态插值） */
function getPlayerSectName() {
  if (typeof S !== "undefined" && S && S.sect && typeof SECTS !== "undefined") {
    const found = SECTS.find(s => s.id === S.sect);
    if (found) return found.name;
  }
  return "云霄宗";
}

/* 通用修为增长函数：同时写入当前心法进度 prog.exp / prog.proficiency 与 S.exp */
function gainCultivationExp(amount) {
  if (!S || !amount || amount <= 0) return;
  S.exp = (S.exp || 0) + amount;

  const art = getCurrentArt();
  if (!art) return;
  const prog = getArtProgress(art.id);

  /* 若心法尚未满熟练度（如凡人 Lv.0 阶段），先转化为熟练度 */
  if (prog.proficiency < 100) {
    const profGain = Math.max(8, Math.round(amount * 0.35));
    prog.proficiency = Math.min(100, +(prog.proficiency + profGain).toFixed(2));
  }

  /* 若已入门（lvl >= 1），直接增加当前层级的修为 exp */
  if (prog.lvl > 0 && prog.lvl < art.maxLvl) {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    if (curLevelData && curLevelData.expNeed > 0) {
      prog.exp = Math.min(curLevelData.expNeed, (prog.exp || 0) + amount);
    }
  }

  if (typeof recalcPlayerStats === "function") {
    recalcPlayerStats();
  }
}

/* 心法加成（每属性取最高值） */
function getHeartBonus() {
  const bonus = { power: 0, atk: 0, def: 0, mp: 0, hp: 0, speed: 0 };
  if (!S || !S.heartArts || !Array.isArray(S.heartArts.learned)) return bonus;
  for (const artId of S.heartArts.learned) {
    const art = HEART_ARTS.find(a => a.id === artId);
    const prog = S.heartArts.progress[artId];
    if (!art || !prog || prog.lvl <= 0) continue;
    const levelData = art.levels.find(l => l.lvl === prog.lvl);
    if (!levelData) continue;
    if (levelData.power > bonus.power) bonus.power = levelData.power;
    if (levelData.atk   > bonus.atk)   bonus.atk   = levelData.atk;
    if (levelData.def   > bonus.def)   bonus.def   = levelData.def;
    if (levelData.mp    > bonus.mp)    bonus.mp    = levelData.mp;
    if (levelData.hp    > bonus.hp)    bonus.hp    = levelData.hp;
    if ((levelData.speed || 0) > bonus.speed) bonus.speed = levelData.speed || 0;
  }
  return bonus;
}

/* 学心法条件 */
function canLearnArt(artId) {
  const art = HEART_ARTS.find(a => a.id === artId);
  if (!art) return { ok: false, reason: "心法不存在" };
  if (S.heartArts.learned.includes(artId)) return { ok: false, reason: "已学" };

  const playerInfo = getPlayerRealmInfo();

  /* 学筑基心法：需要炼气 10 重圆满 */
  if (art.realm === 2) {
    if (playerInfo.realm < 1 || (playerInfo.realm === 1 && playerInfo.lvl < 10)) {
      return { ok: false, reason: "需炼气 10 重圆满" };
    }
  }
  /* 学金丹心法：需要筑基 5 重圆满 */
  if (art.realm === 3) {
    if (playerInfo.realm < 2 || (playerInfo.realm === 2 && playerInfo.lvl < 5)) {
      return { ok: false, reason: "需筑基 5 重圆满" };
    }
  }

  /* 明火心法：需炼气期以上 */
  if (artId === "minghuo_heart" && playerInfo.realm < 1) {
    return { ok: false, reason: "需炼气期以上" };
  }

  /* 本心 */
  if (!checkMorality(art)) {
    return { ok: false, reason: `本心不足（${moralityReqText(art)}）` };
  }

  /* 灵根 */
  if (maxRoot(S.roots).val < art.reqRoot) {
    return { ok: false, reason: `最高灵根不足（需 ${art.reqRoot}）` };
  }

  return { ok: true };
}



/* 修炼检查 */
function canCultivateHeart() {
  const art = getCurrentArt();
  if (!art) return { ok: false, reason: "没有心法" };

  const playerInfo = getPlayerRealmInfo();
  if (playerInfo.realm < art.realm - 1) {
    return { ok: false, reason: `需${REALMS[art.realm - 1].name}期以上` };
  }
  if (!checkMorality(art)) {
    return { ok: false, reason: `本心不足（${moralityReqText(art)}）` };
  }
  if (maxRoot(S.roots).val < art.reqRoot) {
    return { ok: false, reason: `最高灵根不足（需 ${art.reqRoot}）` };
  }

  const prog = getArtProgress(art.id);
  if (prog.lvl >= art.maxLvl) {
    return { ok: false, reason: `【${art.name}】已满级` };
  }

  return { ok: true };
}

/* 杂务耗时 */
function calcChoreActions(todo, remain) {
  const chore = S.dailyQuest.chore;
  const skillVal = S.choreSkill[chore.id] || 0;
  let reduction = 0;
  if (skillVal >= 100) {
    for (const tid in S.tools) {
      const tool = ITEMS[tid];
      if (tool && tool.chore === chore.id) {
        if (tool.lvl === 3) reduction = Math.max(reduction, todo - 1);
        else if (tool.lvl === 2) reduction = Math.max(reduction, Math.floor(todo / 2));
      }
    }
  }
  const need = Math.max(1, todo - reduction);
  return Math.min(need, remain);
}


/* ========== 属性等级 ========== */

/* 由心法等级算属性等级：每 2 级 = 1 属性点，上限 = ceil(maxLvl/2) */
function calcElementLvl(artLvl, maxLvl) {
  if (artLvl <= 0) return 0;
  const elementMax = Math.ceil(maxLvl / 2);
  return Math.min(elementMax, Math.ceil(artLvl / 2));
}

/* 更新玩家属性等级（取所有已学心法的最高值） */
function updateElementLvl() {
  if (!S.elementLvl) {
    S.elementLvl = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0, lei: 0, bing: 0 };
  }
  ROOT_TYPES.forEach(r => { S.elementLvl[r.id] = 0; });

  for (const artId of S.heartArts.learned) {
    const art = HEART_ARTS.find(a => a.id === artId);
    const prog = S.heartArts.progress[artId];
    if (!art || !prog || !art.element) continue;

    const lvl = calcElementLvl(prog.lvl, art.maxLvl);
    if (lvl > S.elementLvl[art.element]) {
      S.elementLvl[art.element] = lvl;
    }
  }
}


/* ========== 加成 + 残卷 ========== */

/* 心法加成（继承境界）：
   1 + min(当前心法等级, 其他心法最高等级) × 0.1 */
function calcRealmBonus(art) {
  const prog = getArtProgress(art.id);

  let maxOtherLvl = 0;
  for (const artId of S.heartArts.learned) {
    if (artId === art.id) continue;
    const p = S.heartArts.progress[artId];
    if (p && p.lvl > maxOtherLvl) maxOtherLvl = p.lvl;
  }

  const bonusLvl = Math.min(prog.lvl, maxOtherLvl);
  return 1 + bonusLvl * 0.1;
}

/* 按 id 找残卷（跨所有心法） */
function getFragmentById(fragId) {
  const item = ITEMS[fragId];
  if (!item || item.type !== "heartFragment") return null;
  const art = HEART_ARTS.find(a => a.id === item.artId);
  if (!art) return null;
  return {
    fragment: { id: fragId, name: item.name, start: item.start, end: item.end },
    art: art,
  };
}

/*
   ★ A-4：findEquipById 改为直查 ITEMS[id]
   原来用 EQUIPS / ARTIFACTS 两个加载时快照，会与运行时追加（如炼器）不同步。
   直查 ITEMS 是唯一真相源。
*/
function findEquipById(id) {
  const eq = ITEMS[id];
  if (eq && (eq.type === "equip" || eq.type === "artifact")) return eq;
  if (typeof HEAVEN_DEFYING !== "undefined") {
    return HEAVEN_DEFYING.find(x => x.id === id) || null;
  }
  return null;
}


/* ============================================================
   抗性汇总
   ============================================================ */

function totalResistances() {
  const res = {
    poison: 0, burn: 0, bleed: 0,
    stun: 0, freeze: 0, silence: 0, atkDown: 0,
  };

  /* 基础 */
  if (S.resistances) {
    for (const k in S.resistances) {
      res[k] = (res[k] || 0) + S.resistances[k];
    }
  }

  /* 装备 */
  for (const slot in S.equipped) {
    const id = S.equipped[slot];
    if (!id) continue;
    const eq = findEquipById(id);
    if (eq && eq.resist) {
      for (const k in eq.resist) {
        res[k] = (res[k] || 0) + eq.resist[k];
      }
    }
  }

  /* 心法（当前等级） */
  for (const artId of S.heartArts.learned) {
    const art = HEART_ARTS.find(a => a.id === artId);
    if (!art) continue;
    const prog = S.heartArts.progress[artId];
    if (!prog || prog.lvl <= 0) continue;
    const levelData = art.levels.find(l => l.lvl === prog.lvl);
    if (levelData && levelData.resist) {
      for (const k in levelData.resist) {
        res[k] = (res[k] || 0) + levelData.resist[k];
      }
    }
  }

  /* 上限夹紧 -100 ~ 100 */
  for (const k in res) {
    res[k] = Math.max(-100, Math.min(100, res[k]));
  }

  return res;
}

/* ============================================================
   统一道具说明与灵鉴解析器 (Item Details & Lore Engine)
   ============================================================ */

function getItemDetails(id, count) {
  if (!id || id === "undefined" || id === "null") {
    return {
      id: "", name: "无名灵物", type: "other", typeName: "修仙灵物", icon: "📦",
      count: 0, grade: 1, tier: 1, price: 0, desc: "虚无混沌之物。", effectDesc: "",
      reqDesc: "", statChips: [], statusBadge: null, canAction: false, actionLabel: "", actionFn: "", rawItem: null
    };
  }
  const item = (typeof getItem === "function" ? getItem(id) : null) || (typeof ITEMS !== "undefined" && ITEMS[id]) || (typeof findEquipById === "function" ? findEquipById(id) : null) || { name: id, type: "other" };
  const haveCount = count !== undefined ? count : ((S.inventory && S.inventory[id]) || 0);

  const typeNameMap = {
    heartFragment: "心法残卷",
    spellbook: "法术秘籍",
    skillbook: "武道招式",
    summonbook: "通灵召唤",
    equip: "护身法器",
    artifact: "本命法宝",
    heavenDefying: "逆天造化",
    pill: "灵丹妙药",
    pillTemplate: "灵丹妙药",
    food: "灵宠兽粮",
    petBreak: "灵兽破境丹",
    mat: "天材地宝",
    quest: "秘要信物",
    special: "特别重器",
    other: "杂务雅具",
  };

  const icon = (typeof getItemIcon === "function") ? getItemIcon(item, id) : ((typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "📦");
  const typeName = typeNameMap[item.type] || "修仙灵物";

  let desc = item.desc || "";
  let effectDesc = "";
  let reqDesc = "";
  const statChips = [];
  let statusBadge = null;
  let canAction = false;
  let actionLabel = "";
  let actionFn = "";

  /* ----- 1. 心法残卷 (heartFragment) ----- */
  if (item.type === "heartFragment") {
    const art = (typeof HEART_ARTS !== "undefined") ? HEART_ARTS.find(a => a.id === item.artId) : null;
    if (art) {
      const realmName = (typeof REALMS !== "undefined" && REALMS[art.realm]) ? REALMS[art.realm].name : "炼气期";
      const elObj = art.element && (typeof ROOT_TYPES !== "undefined") ? ROOT_TYPES.find(r => r.id === art.element) : null;
      const elText = elObj ? `${elObj.name}灵根` : "五行中立";
      const isStart = item.start === 1;
      const isFull = isStart && (art.baseLearn === art.maxLvl);

      statChips.push({ label: `境·${realmName}`, color: "gold" });
      statChips.push({ label: `道·${art.type}道`, color: art.type === "邪" ? "red" : "cyan" });
      statChips.push({ label: `五行·${elText}`, color: "cyan" });
      statChips.push({ label: `修习·${item.start}~${item.end}重`, color: "green" });

      if (isFull) {
        effectDesc = `【全卷领悟】参悟后直接入门学会心法《${art.name}》，可连续修习至第 ${art.maxLvl} 重大圆满。`;
      } else if (isStart) {
        effectDesc = `【入门领悟】参悟后直接入门学会心法《${art.name}》，开启第 1~${item.end} 重修习上限。`;
      } else {
        effectDesc = `【破境拓展】研读参悟后，可将心法《${art.name}》的修炼上限突破至第 ${item.end} 重。`;
      }

      if (art.levels && art.levels[item.end - 1]) {
        const lvlData = art.levels[item.end - 1];
        effectDesc += `（达第${item.end}重累计增益：攻+${lvlData.atk} 防+${lvlData.def} 灵力+${lvlData.mp} 气血+${lvlData.hp}）`;
      }

      reqDesc = `境界要求：${realmName} | 灵根亲和：${elText}`;

      // 学习状态判定
      const learned = S.heartArts && S.heartArts.learned && S.heartArts.learned.includes(art.id);
      if (!learned) {
        if (isStart) {
          statusBadge = { text: "可参悟入门", color: "good" };
          canAction = true; actionLabel = "参悟入门"; actionFn = `useFragment('${id}')`;
        } else {
          statusBadge = { text: "未获上卷", color: "bad" };
          reqDesc += "（需先参悟上卷起首篇入门）";
        }
      } else {
        const prog = (S.heartArts.progress && S.heartArts.progress[art.id]) || { lvl: 0, maxLearn: art.baseLearn || 3 };
        if (item.start === prog.maxLearn + 1) {
          statusBadge = { text: `可突破至Lv.${item.end}`, color: "good" };
          canAction = true; actionLabel = "突破参悟"; actionFn = `useFragment('${id}')`;
        } else if (item.start <= prog.maxLearn) {
          statusBadge = { text: `已参悟(当前${prog.lvl}/${prog.maxLearn}重)`, color: "warn" };
        } else {
          statusBadge = { text: `需前置修至Lv.${item.start - 1}`, color: "bad" };
          reqDesc += `（当前上限为 Lv.${prog.maxLearn}，需依次参悟前卷）`;
        }
      }

      if (!desc) {
        desc = art.desc ? `「${art.desc}」` : `上乘仙家真诀《${art.name}》，载有通玄真道。`;
      }
    } else {
      desc = desc || `修仙心法真意残卷，记载上乘吐纳法门。`;
      effectDesc = `参悟后可解锁对应修炼重数。`;
    }
  }

  /* ----- 2. 法术秘籍 (spellbook) ----- */
  else if (item.type === "spellbook") {
    const spell = (typeof SPELLS !== "undefined") ? SPELLS.find(s => s.id === item.spellId) : null;
    if (spell) {
      statChips.push({ label: `${spell.type}系法术`, color: "gold" });
      statChips.push({ label: spell.target === "enemyAll" ? "全体攻击" : "单体强袭", color: "cyan" });
      statChips.push({ label: `耗蓝·${spell.cost?.mp || 0}`, color: "cyan" });
      statChips.push({ label: `威力·×${spell.power}`, color: "green" });

      effectDesc = `在战斗中释放【${spell.name}】，消耗 ${spell.cost?.mp || 0} 点灵力造成 ×${spell.power} 倍法术伤害。`;
      if (spell.inflict) {
        const infs = [];
        if (spell.inflict.burn) infs.push(`灼烧(${Math.round(spell.inflict.burn * 100)}%)`);
        if (spell.inflict.bleed) infs.push(`流血(${Math.round(spell.inflict.bleed * 100)}%)`);
        if (spell.inflict.freeze) infs.push(`冰冻(${Math.round(spell.inflict.freeze * 100)}%)`);
        if (infs.length) effectDesc += ` 附带特殊效果：${infs.join("、")}。`;
      }

      const reqParts = [];
      if (spell.elementReq && Object.keys(spell.elementReq).length) {
        for (const k in spell.elementReq) {
          const rObj = typeof ROOT_TYPES !== "undefined" ? ROOT_TYPES.find(r => r.id === k) : null;
          reqParts.push(`${rObj ? rObj.name : k}灵根≥${spell.elementReq[k]}`);
        }
      }
      if (spell.artReq && spell.artReq.length) {
        const artNames = spell.artReq.map(aid => {
          const a = typeof HEART_ARTS !== "undefined" ? HEART_ARTS.find(x => x.id === aid) : null;
          return a ? `《${a.name}》` : aid;
        });
        reqParts.push(`需掌握心法：${artNames.join("、")}`);
      }
      if (spell.skillReq && Object.keys(spell.skillReq).length) {
        for (const k in spell.skillReq) reqParts.push(`${k}法≥${spell.skillReq[k]}级`);
      }
      reqDesc = reqParts.length ? `参悟门槛：${reqParts.join(" | ")}` : "参悟门槛：无特殊限制";

      const has = typeof hasSpell === "function" && hasSpell(spell.id);
      if (has) {
        statusBadge = { text: "已掌握法术", color: "warn" };
      } else {
        const check = typeof canLearnSpell === "function" ? canLearnSpell(spell.id) : { ok: true };
        if (check.ok) {
          statusBadge = { text: "可参悟掌握", color: "good" };
          canAction = true; actionLabel = "参悟法术"; actionFn = `useSpellBook('${id}')`;
        } else {
          statusBadge = { text: check.reason || "条件不足", color: "bad" };
        }
      }
      desc = desc || spell.desc || `记载【${spell.name}】精奥符文的道法秘卷。`;
    }
  }

  /* ----- 3. 技能秘籍 (skillbook) ----- */
  else if (item.type === "skillbook") {
    const sk = (typeof COMBAT_SKILLS !== "undefined") ? COMBAT_SKILLS.find(s => s.id === item.skillId) : null;
    if (sk) {
      statChips.push({ label: `${sk.type}法武学`, color: "gold" });
      statChips.push({ label: `消耗血气·${sk.cost?.hp || 0}`, color: "red" });
      statChips.push({ label: `威力·×${sk.power}`, color: "green" });

      effectDesc = `运转肉身血气施展【${sk.name}】，对目标造成 ×${sk.power} 倍物理攻伐。`;
      const has = S.combatSkills && S.combatSkills.learned && S.combatSkills.learned.includes(sk.id);
      if (has) {
        statusBadge = { text: "已学武学", color: "warn" };
      } else {
        statusBadge = { text: "可参悟研习", color: "good" };
        canAction = true; actionLabel = "参悟招式"; actionFn = `useSkillBook('${id}')`;
      }
      desc = desc || sk.desc || `修仙基本功武学招式秘籍。`;
    }
  }

  /* ----- 4. 召唤秘籍 (summonbook) ----- */
  else if (item.type === "summonbook") {
    statChips.push({ label: "通灵唤神", color: "gold" });
    statChips.push({ label: "助战护道", color: "cyan" });
    effectDesc = "参悟后可掌握专属唤灵神通，于战斗中召唤协同战宠或神兵分担仇恨并造成协同法术伤害。";
    const has = S.combatSkills && S.combatSkills.learned && S.combatSkills.learned.includes(item.summonId);
    if (has) {
      statusBadge = { text: "已掌握通灵", color: "warn" };
    } else {
      statusBadge = { text: "可参悟", color: "good" };
      canAction = true; actionLabel = "参悟唤灵"; actionFn = `useSummonBook('${id}')`;
    }
    desc = desc || "上古御灵师遗留下来的通灵唤神异术。";
  }

  /* ----- 5. 装备 / 法宝 / 逆天宝物 ----- */
  else if (item.type === "equip" || item.type === "artifact" || item.type === "heavenDefying") {
    const slotLabel = (typeof SLOT_NAMES !== "undefined" && SLOT_NAMES[item.slot]) || item.slot || "法器";
    const tg = getItemTierAndGrade(item, id);
    if (item.type !== "heavenDefying") {
      statChips.push({ label: `${tg.grade}品${slotLabel}`, color: tg.grade >= 5 ? "gold" : tg.grade >= 3 ? "purple" : "cyan" });
      statChips.push({ label: `${tg.tier}阶法器`, color: "gold" });
    } else {
      statChips.push({ label: `部位·${slotLabel}`, color: "gold" });
    }

    if (item.atk) statChips.push({ label: `攻+${item.atk}`, color: "orange" });
    if (item.def) statChips.push({ label: `防+${item.def}`, color: "blue" });
    if (item.hp) statChips.push({ label: `血+${item.hp}`, color: "red" });
    if (item.mp) statChips.push({ label: `灵+${item.mp}`, color: "cyan" });
    if (item.speed) statChips.push({ label: `速+${item.speed}`, color: "green" });
    if (item.spellBonus) statChips.push({ label: `法术+${Math.round(item.spellBonus * 100)}%`, color: "purple" });
    if (item.element) {
      const elObj = typeof ROOT_TYPES !== "undefined" ? ROOT_TYPES.find(r => r.id === item.element) : null;
      statChips.push({ label: `亲和·${elObj ? elObj.name : item.element}`, color: "cyan" });
    }

    const effects = [];
    if (item.atk) effects.push(`攻击 +${item.atk}`);
    if (item.def) effects.push(`防御 +${item.def}`);
    if (item.hp) effects.push(`气血上限 +${item.hp}`);
    if (item.mp) effects.push(`灵力上限 +${item.mp}`);
    if (item.speed) effects.push(`身法速度 +${item.speed}`);
    if (item.spellBonus) effects.push(`法术威力加成 +${Math.round(item.spellBonus * 100)}%`);
    effectDesc = `【${tg.tier}阶·${tg.grade}品${slotLabel}】${effects.join("，") || "基础防具法器"}。`;

    const isEquipped = S.equipped && Object.values(S.equipped).includes(id);
    if (isEquipped) {
      statusBadge = { text: "当前佩戴中", color: "good" };
    } else {
      statusBadge = { text: "可装配", color: "cyan" };
      canAction = true; actionLabel = "立即装配"; actionFn = `autoEquip('${id}')`;
    }
    desc = desc || "引天地灵气淬炼而成的修真法器宝物，助益斗法与道体强健。";
  }

  /* ----- 6. 丹药 (pill) ----- */
  else if (item.type === "pill" || item.type === "pillTemplate") {
    if (item.grade !== undefined) statChips.push({ label: `${item.grade}品丹药`, color: item.grade === 5 ? "gold" : "cyan" });
    if (item.tier) {
      const rName = (typeof REALMS !== "undefined" && REALMS[item.tier]) ? REALMS[item.tier].name : `${item.tier}阶`;
      statChips.push({ label: `${rName}适用`, color: "gold" });
    }

    let e = item.effect;
    if (!e || !e.type) {
      const tier = item.tier || 1;
      const grade = item.grade !== undefined ? item.grade : 1;
      const gradePct = [0, 0.2, 0.4, 0.6, 0.8, 1.0][grade] || 0.4;
      const n = item.name || id;
      if (n.includes("回春") || n.includes("回血")) {
        e = { type: "heal", value: Math.round(200 * tier * gradePct) };
        item.effect = e;
      } else if (n.includes("回元") || n.includes("回灵")) {
        e = { type: "healMp", value: Math.round(200 * tier * gradePct) };
        item.effect = e;
      } else if (n.includes("聚气") || n.includes("聚灵") || n.includes("聚凝")) {
        e = { type: "exp", value: Math.round(100 * tier * gradePct) };
        item.effect = e;
      } else if (n.includes("筑基") || n.includes("降尘") || n.includes("破境")) {
        e = { type: "breakBonus", value: 0.2 * gradePct };
        item.effect = e;
      } else if (n.includes("辟谷")) {
        e = { type: "fasting", days: Math.round(30 * gradePct) };
        item.effect = e;
      }
    }

    if (e && e.type) {
      if (e.type === "heal") {
        statChips.push({ label: `回复气血+${fmt(e.value)}`, color: "red" });
        effectDesc = `服下后温润肺腑，瞬间回复 ${fmt(e.value)} 点气血。`;
        desc = `回复气血 +${fmt(e.value)}`;
      } else if (e.type === "healMp") {
        statChips.push({ label: `回复灵力+${fmt(e.value)}`, color: "cyan" });
        effectDesc = `纳气归元，瞬间充盈 ${fmt(e.value)} 点真元灵力。`;
        desc = `回复灵力 +${fmt(e.value)}`;
      } else if (e.type === "exp") {
        statChips.push({ label: `修炼修为+${fmt(e.value)}`, color: "green" });
        effectDesc = `引药力入气海，直接增加 ${fmt(e.value)} 点修炼修为。`;
        desc = `修炼修为 +${fmt(e.value)}`;
      } else if (e.type === "breakBonus") {
        statChips.push({ label: `突破率+${Math.round((e.value || 0) * 100)}%`, color: "gold" });
        effectDesc = `药力护佑心神，下次大境界突破成功率提升 +${Math.round((e.value || 0) * 100)}%。`;
        desc = `破境成功率 +${Math.round((e.value || 0) * 100)}%`;
      } else if (e.type === "fasting") {
        statChips.push({ label: `辟谷${Math.floor(e.days || 0)}天`, color: "cyan" });
        effectDesc = `服下一粒，可辟谷 ${Math.floor(e.days || 0)} 天无需进食。`;
        desc = `辟谷 ${Math.floor(e.days || 0)} 天无需进食`;
      } else if (e.type === "cure") {
        statChips.push({ label: "驱毒疗伤", color: "green" });
        effectDesc = `清除体内特定负面伤势与中毒状态。`;
        desc = `解除异状负面`;
      } else if (e.type === "root") {
        statChips.push({ label: `纯化灵根+${e.value || 1}`, color: "gold" });
        effectDesc = `洗炼全身骨髓与灵根窍穴，纯化道体根基（永久微调提升灵根潜质）。`;
        desc = `洗炼骨髓灵根潜质 +${e.value || 1}`;
      } else if (e.type === "petFood") {
        statChips.push({ label: `饱腹+${e.hunger || 5}`, color: "green" });
        statChips.push({ label: `兽修+${e.exp || 10}`, color: "cyan" });
        effectDesc = `喂养伴生仙兽，回复 ${e.hunger || 5} 饱腹度，提升 ${e.exp || 10} 灵宠修为。`;
        desc = `灵宠饱腹 +${e.hunger || 5}，经验 +${e.exp || 10}`;
      } else if (e.type === "petLoyalty") {
        statChips.push({ label: `灵宠忠诚+${e.value || 10}`, color: "pink" });
        effectDesc = `滋养灵兽本命精魄，提升伴生灵宠忠诚度与战意。`;
        desc = `灵宠忠诚度 +${e.value || 10}`;
      } else if (e.type === "cureAllNonDot") {
        statChips.push({ label: "驱散异状", color: "green" });
        effectDesc = `解除体内眩晕、冰冻、沉默、衰竭等所有非持续伤害负面异状。`;
        desc = `解除非持续性负面状态`;
      } else if (e.type === "reduceEncounter") {
        statChips.push({ label: `隐息匿迹`, color: "cyan" });
        effectDesc = `收敛浑身神光气息，历练探索时减少遭遇强敌的概率。`;
        desc = `敛息隐匿，降低历练遇敌概率`;
      } else if (e.type === "alchemyBuff") {
        statChips.push({ label: `炼丹增幅`, color: "gold" });
        effectDesc = `丹火与神识共鸣，提升下次炼丹的成丹率与出炉产出。`;
        desc = `提升下次炼丹成丹率与产出`;
      } else {
        effectDesc = (item.desc && item.desc !== "undefined") ? item.desc : "玄妙灵丹，蕴含造化药性。";
        desc = (item.desc && item.desc !== "undefined") ? item.desc : "玄妙灵丹，蕴含天地药性。";
      }
    }

    if (item.grade === 0) {
      statusBadge = { text: "废丹不可服", color: "bad" };
      reqDesc = "杂质过甚，药性已变，仅能售于药铺回收。";
      desc = "废弃丹药，丹毒充盈不可服用";
    } else {
      if (item.grade === 5) {
        statChips.push({ label: "纯阳无毒", color: "gold" });
        reqDesc = "无暇绝品，不积累丝毫丹毒。";
        desc += "（纯阳无瑕·无丹毒）";
      } else if (item.danDu) {
        const danDuNum = typeof item.danDu === "number"
          ? item.danDu
          : (typeof item.danDu === "object" ? Number(item.danDu[item.tier || 1] || 0) : Number(item.danDu) || 0);
        if (danDuNum > 0) {
          statChips.push({ label: `丹毒+${danDuNum.toFixed(2)}`, color: "red" });
          reqDesc = `每次服用累积 +${danDuNum.toFixed(2)} 丹毒（过高会阻碍破境）。`;
          desc += `（丹毒+${danDuNum.toFixed(2)}）`;
        }
      }
      if (item.dailyLimit) {
        reqDesc += ` 今日限服 ${item.dailyLimit} 粒。`;
      }
      if (item.usableIn === "battle") {
        statusBadge = { text: "战斗中服用", color: "warn" };
      } else {
        canAction = true; actionLabel = "立即服用"; actionFn = `useItem('${id}')`;
      }
    }
    desc = desc || "灵草与天地玄火于丹炉内百炼而成的固本培元灵丹。";
  }

  /* ----- 7. 材料 (mat) ----- */
  else if (item.type === "mat") {
    const tg = getItemTierAndGrade(item, id);
    statChips.push({ label: `${tg.tier}阶·${tg.grade}品灵材`, color: "gold" });
    statChips.push({ label: "炼丹锻造灵材", color: "cyan" });
    effectDesc = `可投入炼丹炉配制相应品阶灵丹，或于天机鼎作为神兵锻造附灵淬炼之主辅材料。`;
    desc = desc || `${tg.tier} 阶 ${tg.grade} 品天地钟秀之灵物，采摘自崇山灵脉洞天福地。`;
  }

  /* ----- 8. 兽粮与灵兽丹 ----- */
  else if (item.type === "food") {
    statChips.push({ label: `饱腹+${item.hunger || 30}`, color: "green" });
    effectDesc = `在【洞府·灵宠】界面喂养伴生仙兽，回复 ${item.hunger || 30} 点饱腹感并滋养灵兽气血。`;
    desc = desc || "饱含五谷与灵草精华的秘制兽粮。";
  } else if (item.type === "petBreak") {
    const rName = (typeof REALMS !== "undefined" && REALMS[item.realm]) ? REALMS[item.realm].name : "灵宠";
    statChips.push({ label: `助战灵兽突破·${rName}`, color: "gold" });
    effectDesc = `灵宠修炼至 10 重圆满时，服用此丹可破关突破至 ${rName} 境界。`;
    desc = desc || "蕴含上古妖兽精粹与天地化形造化的灵兽突破金丹。";
  }

  /* ----- 9. 杂务工具 / 爱好道具 / 任务道具 ----- */
  else {
    if (item.chore) {
      statChips.push({ label: `杂务·${item.name}`, color: "gold" });
      effectDesc = `提升宗门杂役执行熟练度，熟练满时大幅削减劳作回合耗费。`;
    } else if (item.hobby) {
      statChips.push({ label: `雅物·${item.hobby}`, color: "cyan" });
      effectDesc = `解锁并提升【${item.hobby}】修道雅好，陶冶心性，化解打坐心魔。`;
    } else if (item.type === "quest") {
      statChips.push({ label: "关键剧情信物", color: "purple" });
      effectDesc = "推进主线或支线剧情的重宝机缘信物，不可随意丢弃。";
    } else if (item.type === "special" || id === "sect_chronicle_scroll") {
      statChips.push({ label: "代代相传", color: "purple" });
      statChips.push({ label: "置顶重器", color: "gold" });
      effectDesc = "记载了历代先贤道号、在世年份、身前修为造诣与道陨因果，供后生晚辈以史为鉴。点击可展卷研读列祖青史。";
      canAction = true;
      actionLabel = "📜 研读宗门列祖青史";
      actionFn = "if(typeof openSectChronicleModal==='function') openSectChronicleModal();";
    }
    desc = desc || "修仙者日常历练或游历红尘所得之随身器具。";
  }

  const safeName = (item.name && item.name !== "undefined" && item.name !== "null")
    ? item.name
    : (id && id !== "undefined" && id !== "null" ? id : "修仙灵物");

  const cleanDesc = (desc && desc !== "undefined" && desc !== "null") ? desc : "引天地造化灵气淬炼而成之仙道随身宝物。";
  const cleanEffect = (effectDesc && effectDesc !== "undefined" && effectDesc !== "null") ? effectDesc : cleanDesc;
  const tgInfo = getItemTierAndGrade(item, id);

  return {
    id,
    name: safeName,
    type: item.type,
    typeName,
    icon,
    count: haveCount,
    grade: tgInfo.grade,
    tier: tgInfo.tier,
    tierGradeBadge: tgInfo.badge,
    price: item.price || 0,
    desc: cleanDesc,
    effectDesc: cleanEffect,
    reqDesc,
    statChips,
    statusBadge,
    canAction,
    actionLabel,
    actionFn,
    rawItem: item,
  };
}

/* 统一获取任意物品的【阶 (tier)】与【品 (grade)】及显示标签 */
function getItemTierAndGrade(item, id) {
  if (!item) {
    item = (id && typeof getItem === "function" ? getItem(id) : null) || (id && ITEMS ? ITEMS[id] : null) || {};
  }
  let tier = item.tier !== undefined ? Number(item.tier) : 0;
  let grade = item.grade !== undefined ? Number(item.grade) : 0;

  const t = item.type || "other";
  if (t === "equip" || t === "artifact") {
    if (!grade) {
      const score = (item.atk || 0) + (item.def || 0) + Math.floor((item.hp || 0) / 10);
      grade = score >= 60 ? 6 : score >= 35 ? 4 : score >= 20 ? 3 : score >= 12 ? 2 : 1;
    }
    if (!tier) {
      tier = grade >= 6 ? 3 : grade >= 4 ? 2 : 1;
    }
  } else if (t === "pill" || t === "pillTemplate") {
    if (!tier) tier = 1;
    if (item.grade === undefined) grade = 1;
  } else if (t === "mat") {
    if (!grade && id) {
      const m = String(id).match(/_(\d+)$/);
      if (m) grade = parseInt(m[1], 10);
    }
    if (!grade) grade = 1;
    if (!tier) {
      tier = grade >= 6 ? 3 : grade >= 4 ? 2 : 1;
    }
  } else if (t === "petBreak" || t === "food") {
    if (!tier) tier = (item.realm || 1);
    if (!grade) grade = tier * 2 - 1;
  } else if (t === "heavenDefying") {
    tier = 5;
    grade = 7;
  } else if (t === "heartFragment" || t === "spellbook" || t === "skillbook" || t === "summonbook") {
    if (!tier) tier = item.realm ? item.realm + 1 : 1;
    if (!grade) grade = item.grade || (tier * 2 - 1);
  } else {
    if (!tier) tier = 1;
    if (!grade) grade = 1;
  }

  let badge = `${tier}阶·${grade}品`;
  if (t === "pill" || t === "pillTemplate") {
    badge = grade === 0 ? `${tier}阶·废丹` : `${tier}阶·${grade}品`;
  } else if (t === "heavenDefying") {
    badge = "逆天至宝";
  } else if (t === "special" || id === "sect_chronicle_scroll") {
    badge = "传世重器";
  }

  return { tier, grade, badge };
}

/* 行囊统一排序比较器：严格按【阶 (tier) 从高到低】→【品 (grade) 从高到低】→【战力/价格从高到低】 */
function compareItemsByTierGradeDesc(idA, idB) {
  const itemA = (typeof getItem === "function" ? getItem(idA) : null) || (ITEMS && ITEMS[idA]) || (typeof findEquipById === "function" ? findEquipById(idA) : null) || {};
  const itemB = (typeof getItem === "function" ? getItem(idB) : null) || (ITEMS && ITEMS[idB]) || (typeof findEquipById === "function" ? findEquipById(idB) : null) || {};

  const tgA = getItemTierAndGrade(itemA, idA);
  const tgB = getItemTierAndGrade(itemB, idB);

  if (tgB.tier !== tgA.tier) return tgB.tier - tgA.tier;
  if (tgB.grade !== tgA.grade) return tgB.grade - tgA.grade;

  const scoreA = (itemA.atk || 0) * 4 + (itemA.def || 0) * 4 + (itemA.hp || 0) * 0.5 + (itemA.mp || 0) * 0.5 + (itemA.price || 0);
  const scoreB = (itemB.atk || 0) * 4 + (itemB.def || 0) * 4 + (itemB.hp || 0) * 0.5 + (itemB.mp || 0) * 0.5 + (itemB.price || 0);
  if (scoreB !== scoreA) return scoreB - scoreA;

  const nameA = itemA.name || String(idA);
  const nameB = itemB.name || String(idB);
  return nameA.localeCompare(nameB, "zh-CN");
}

/* 在物品详情弹窗中左右滑动/点击切换到上一个或下一个物品 */
function navigateItemDetailModal(offset) {
  const list = (typeof window !== "undefined" && Array.isArray(window._currentBagSortedIds))
    ? window._currentBagSortedIds
    : [];
  const curId = typeof window !== "undefined" ? window._currentDetailItemId : null;
  if (!curId || list.length <= 1) return;
  const idx = list.indexOf(curId);
  if (idx === -1) return;
  const nextIdx = (idx + offset + list.length) % list.length;
  const nextId = list[nextIdx];
  if (nextId) {
    showItemDetailModal(nextId);
  }
}

/* 为物品详情弹窗绑定左右滑动手势（支持触屏 touch 与鼠标拖拽 swipe） */
function bindItemDetailSwipeGesture() {
  if (typeof document === "undefined") return;
  const modalBox = document.getElementById("modalBox");
  if (!modalBox || modalBox._itemSwipeBound) return;
  modalBox._itemSwipeBound = true;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  modalBox.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  modalBox.addEventListener("touchend", (e) => {
    if (!tracking || !e.changedTouches || e.changedTouches.length === 0) return;
    tracking = false;
    if (!document.querySelector(".item-detail-modal")) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) navigateItemDetailModal(1);
      else navigateItemDetailModal(-1);
    }
  }, { passive: true });

  modalBox.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });

  modalBox.addEventListener("mouseup", (e) => {
    if (!tracking) return;
    tracking = false;
    if (!document.querySelector(".item-detail-modal")) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) navigateItemDetailModal(1);
      else navigateItemDetailModal(-1);
    }
  });
}

/* 弹窗查看道具玉简灵鉴（全景详尽说明 + 支持左右滑动切换上下件） */
function showItemDetailModal(id) {
  if (!id || id === "undefined" || id === "null") {
    log("此道法灵物神韵未明，难以展卷探查。", "c-dim");
    return;
  }
  if (typeof window !== "undefined") {
    window._currentDetailItemId = id;
  }
  const d = getItemDetails(id);
  const chipsHtml = d.statChips.map(c => `<span class="bag-chip ${c.color || ''}">${c.label}</span>`).join(" ");

  const navList = (typeof window !== "undefined" && Array.isArray(window._currentBagSortedIds))
    ? window._currentBagSortedIds
    : [];
  const navIdx = navList.indexOf(id);
  const hasSwipeNav = navIdx !== -1 && navList.length > 1;
  const swipeBarHtml = hasSwipeNav ? `
    <div class="item-detail-swipe-nav" style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; margin-bottom:8px; background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.3); border-radius:4px; font-size:11.5px;">
      <button type="button" class="small" style="padding:2px 8px;" onclick="navigateItemDetailModal(-1)">◀ 上一件</button>
      <span style="color:var(--text-gold);">第 ${navIdx + 1} / ${navList.length} 件 · 可左右滑动切换</span>
      <button type="button" class="small" style="padding:2px 8px;" onclick="navigateItemDetailModal(1)">下一件 ▶</button>
    </div>
  ` : "";

  let body = `
    <div class="item-detail-modal">
      ${swipeBarHtml}
      <div class="item-detail-header">
        <div class="item-detail-icon">${d.icon}</div>
        <div class="item-detail-header-text">
          <div class="item-detail-title">
            <span>${d.name}</span>
            <span class="tag gold" style="font-size:11px;">${d.tierGradeBadge || d.typeName}</span>
            <span class="tag" style="font-size:11px;">${d.typeName}</span>
            ${d.count > 0 ? `<span class="tag" style="background:#20170d; color:var(--text-bright); font-size:11px;">拥有 ×${d.count}</span>` : ""}
          </div>
          <div class="item-detail-chips">${chipsHtml}</div>
        </div>
      </div>

      <div class="item-detail-quote">
        「${(d.desc && d.desc !== 'undefined') ? d.desc : '引天地灵气淬炼而成之仙道随身宝物。'}」
      </div>

      <div class="item-detail-section">
        <div class="item-detail-sec-title">✨ 灵物功用与妙理</div>
        <div class="item-detail-sec-content">${(d.effectDesc && d.effectDesc !== 'undefined') ? d.effectDesc : (d.desc && d.desc !== 'undefined' ? d.desc : '暂无特殊功用记载。')}</div>
      </div>
  `;

  if (d.reqDesc) {
    body += `
      <div class="item-detail-section">
        <div class="item-detail-sec-title">📜 参悟与使用条件</div>
        <div class="item-detail-sec-content" style="color:var(--text-gold);">${d.reqDesc}</div>
      </div>
    `;
  }

  if (d.statusBadge) {
    body += `
      <div class="item-detail-section" style="display:flex; justify-content:space-between; align-items:center;">
        <span class="item-detail-sec-title" style="margin:0;">🔍 当前参悟/佩戴状态</span>
        <span class="tag ${d.statusBadge.color}">${d.statusBadge.text}</span>
      </div>
    `;
  }

  body += `
      <div class="item-detail-price">
        <span>市坊估价：${fmt(d.price)} 灵石/铜钱</span>
        <span style="color:var(--text-dim); font-size:11px;">（可在随身背包或宗门百宝阁处置）</span>
      </div>
    </div>
  `;

  const actions = [];
  if (d.canAction && d.actionLabel && d.actionFn) {
    actions.push({
      label: d.actionLabel,
      primary: true,
      fn: () => {
        closeModal();
        try {
          new Function(d.actionFn)();
        } catch (e) {
          console.error("Action error:", e);
        }
      }
    });
  } else if (d.type === "food" && d.count > 0) {
    actions.push({
      label: "前往喂养灵兽",
      fn: () => {
        closeModal();
        if (typeof closeProfile === "function") closeProfile();
        caveSubPanel = "pet";
        currentTab = "cave";
        render();
      }
    });
  } else if (d.type === "petBreak" && d.count > 0) {
    actions.push({
      label: "前往灵兽突破",
      fn: () => {
        closeModal();
        if (typeof closeProfile === "function") closeProfile();
        caveSubPanel = "pet";
        currentTab = "cave";
        render();
      }
    });
  }

  /* 杂务工具或行囊物品卖出（支持选择数量 + 确认后才卖出） */
  const isToolOwned = !!(d.type === "other" && S.tools && S.tools[id]);
  const isEquippedItem = !!(S.equipped && Object.values(S.equipped).includes(id));
  const canSellFromBag = isToolOwned || (d.count > 0 && d.type !== "quest" && d.type !== "heavenDefying" && !isEquippedItem);

  if (canSellFromBag) {
    const unitPrice = isToolOwned
      ? Math.max(1, Math.floor((d.price || 0) / 2))
      : Math.max(1, Math.floor((d.price || 10) / 2));
    const curUnit = isToolOwned ? currencyName() : "铜钱";
    actions.push({
      label: `卖出 (${unitPrice}${curUnit}/个)`,
      fn: () => {
        openSellQuantityModal(id, 1);
      }
    });
  }

  actions.push({ label: "合上玉简", fn: closeModal });

  showModal(`道具灵鉴 · ${d.name}`, body, actions);
  bindItemDetailSwipeGesture();
}

/* ============================================================
   行囊卖出流程：第1步【选择卖出数量】→ 第2步【确认卖出】→ 执行卖出
   ============================================================ */

function getSellableItemMeta(id) {
  const d = getItemDetails(id);
  const isToolOwned = !!(d.type === "other" && S && S.tools && S.tools[id] && (!S.inventory || !S.inventory[id]));
  const maxCount = isToolOwned ? 1 : ((S && S.inventory && S.inventory[id]) || 0);
  const unitPrice = isToolOwned
    ? Math.max(1, Math.floor((d.price || 0) / 2))
    : Math.max(1, Math.floor((d.price || 10) / 2));
  const curUnit = isToolOwned ? currencyName() : "铜钱";
  return { d, isToolOwned, maxCount, unitPrice, curUnit };
}

function adjustSellModalQty(delta, maxCount, unitPrice, curUnit) {
  const input = document.getElementById("sellQtyInput");
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  if (delta === "max") {
    val = maxCount;
  } else if (delta === "min") {
    val = 1;
  } else {
    val = val + Number(delta || 0);
  }
  val = Math.max(1, Math.min(maxCount, val));
  input.value = val;
  const totalEl = document.getElementById("sellTotalPreview");
  if (totalEl) {
    totalEl.textContent = `${fmt(val * unitPrice)} ${curUnit}`;
  }
}

function onSellQtyInputChange(maxCount, unitPrice, curUnit) {
  const input = document.getElementById("sellQtyInput");
  if (!input) return;
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > maxCount) val = maxCount;
  input.value = val;
  const totalEl = document.getElementById("sellTotalPreview");
  if (totalEl) {
    totalEl.textContent = `${fmt(val * unitPrice)} ${curUnit}`;
  }
}

function openSellQuantityModal(id, initialQty) {
  if (!S) return;
  const meta = getSellableItemMeta(id);
  if (meta.maxCount <= 0) {
    log("行囊中已无此物品可出售。", "c-bad");
    closeModal();
    return;
  }

  const startQty = Math.max(1, Math.min(meta.maxCount, parseInt(initialQty, 10) || 1));
  const initTotal = startQty * meta.unitPrice;
  const safeId = String(id).replace(/'/g, "\\'");

  const body = `
    <div class="card" style="margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="font-size:22px;">${meta.d.icon}</span>
        <div>
          <div style="font-weight:700; color:var(--text-gold); font-size:14px;">${meta.d.name} <span class="tag gold">${meta.d.tierGradeBadge || meta.d.typeName}</span></div>
          <div class="small" style="color:var(--text-dim);">当前持有：<b>×${meta.maxCount}</b>　|　回收单价：<b>${meta.unitPrice} ${meta.curUnit}/个</b></div>
        </div>
      </div>

      <div style="margin:10px 0; padding:8px; background:rgba(0,0,0,0.28); border:1px solid var(--border-gold); border-radius:6px;">
        <div class="small" style="color:var(--text-gold); margin-bottom:6px; text-align:center;">请选择要卖出的数量：</div>
        <div style="display:flex; justify-content:center; align-items:center; gap:6px; flex-wrap:wrap;">
          <button type="button" class="small" onclick="adjustSellModalQty('min', ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">最小(1)</button>
          ${meta.maxCount >= 10 ? `<button type="button" class="small" onclick="adjustSellModalQty(-10, ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">-10</button>` : ""}
          <button type="button" class="small" onclick="adjustSellModalQty(-1, ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">-1</button>
          <input type="number" id="sellQtyInput" min="1" max="${meta.maxCount}" value="${startQty}"
                 oninput="onSellQtyInputChange(${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')"
                 style="width:68px; text-align:center; font-weight:700; font-size:14px; padding:4px;">
          <button type="button" class="small" onclick="adjustSellModalQty(1, ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">+1</button>
          ${meta.maxCount >= 10 ? `<button type="button" class="small" onclick="adjustSellModalQty(10, ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">+10</button>` : ""}
          <button type="button" class="small" onclick="adjustSellModalQty('max', ${meta.maxCount}, ${meta.unitPrice}, '${meta.curUnit}')">全部(${meta.maxCount})</button>
        </div>
      </div>

      <div class="row" style="margin-top:6px;">
        <span>预计总计获得</span>
        <b id="sellTotalPreview" style="color:var(--text-gold); font-size:14px;">${fmt(initTotal)} ${meta.curUnit}</b>
      </div>
    </div>
  `;

  showModal(`🪙 出售灵物 · ${meta.d.name}`, body, [
    {
      label: "下一步：确认卖出",
      primary: true,
      fn: () => {
        const input = document.getElementById("sellQtyInput");
        const qty = Math.max(1, Math.min(meta.maxCount, parseInt(input ? input.value : startQty, 10) || 1));
        openSellConfirmModal(id, qty);
      }
    },
    {
      label: "返回详情",
      fn: () => {
        showItemDetailModal(id);
      }
    },
    { label: "取消", fn: closeModal }
  ]);
}

function openSellConfirmModal(id, qty) {
  if (!S) return;
  const meta = getSellableItemMeta(id);
  if (meta.maxCount <= 0) {
    closeModal();
    return;
  }
  const finalQty = Math.max(1, Math.min(meta.maxCount, parseInt(qty, 10) || 1));
  const totalGain = finalQty * meta.unitPrice;

  const body = `
    <div class="card" style="margin-bottom:8px; border:1px solid var(--border-gold);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:24px;">${meta.d.icon}</span>
        <div>
          <div style="font-weight:700; color:var(--text-gold); font-size:15px;">${meta.d.name}</div>
          <div class="small" style="color:var(--text-dim);">${meta.d.tierGradeBadge || meta.d.typeName}</div>
        </div>
      </div>
      <div class="row"><span>确认卖出数量</span><b>×${finalQty}（持有 ×${meta.maxCount}）</b></div>
      <div class="row"><span>回收单价</span><b>${meta.unitPrice} ${meta.curUnit} / 个</b></div>
      <div class="row"><span>共计可获资财</span><b style="color:var(--text-gold); font-size:14px;">+${fmt(totalGain)} ${meta.curUnit}</b></div>
    </div>
    <p class="small" style="color:var(--c-bad); text-align:center; margin:4px 0 0;">
      ⚠️ 请确认：卖出后该物品将从行囊中扣除，点击【确认卖出】后立即成交。
    </p>
  `;

  showModal(`⚠️ 确认卖出 · ${meta.d.name}`, body, [
    {
      label: `确认卖出 (×${finalQty})`,
      primary: true,
      fn: () => {
        executeConfirmedSell(id, finalQty);
      }
    },
    {
      label: "重选数量",
      fn: () => {
        openSellQuantityModal(id, finalQty);
      }
    },
    { label: "取消", fn: closeModal }
  ]);
}

function executeConfirmedSell(id, qty) {
  if (!S) return;
  const meta = getSellableItemMeta(id);
  if (meta.maxCount <= 0) {
    closeModal();
    return;
  }
  const finalQty = Math.max(1, Math.min(meta.maxCount, parseInt(qty, 10) || 1));
  const totalGain = finalQty * meta.unitPrice;

  if (meta.isToolOwned) {
    delete S.tools[id];
    addCurrency(totalGain);
  } else {
    removeItem(id, finalQty);
    S.money = (S.money || 0) + totalGain;
  }

  closeModal();
  log(`【行囊出售】卖出 ${meta.d.name} ×${finalQty}，获得 ${totalGain} ${meta.curUnit}。`, "c-good");
  save();
  if (typeof renderProfile === "function" && document.getElementById("profileMask")?.classList.contains("show")) {
    renderProfile();
  }
  render();
}

/* ============================================================
   战力评估系统（用于历练与秘境危险度判断）
   ============================================================ */

function calcPlayerCombatPower() {
  if (typeof S === "undefined" || !S) return 0;
  const atk = typeof totalAtk === "function" ? totalAtk() : (S.atk || 5);
  const def = typeof totalDef === "function" ? totalDef() : (S.def || 3);
  const hp = typeof totalMaxHp === "function" ? totalMaxHp() : (S.hpMax || 60);
  const mp = typeof totalMaxMp === "function" ? totalMaxMp() : (S.mpMax || 0);
  const spd = typeof totalSpeed === "function" ? totalSpeed() : (S.speed || 10);
  const info = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: S.realm || 0, lvl: S.sub || 0 };
  
  let power = Math.floor(atk * 4 + def * 5 + hp * 0.8 + mp * 0.5 + spd * 2 + (info.realm || 0) * 150 + (info.lvl || 0) * 20);

  /* 灵宠协同战力 */
  if (S.pets && S.equipped && S.equipped.pet) {
    const pet = (S.pets.list || []).find(p => p.uid === S.equipped.pet);
    if (pet) {
      power += Math.floor((pet.atk || 0) * 2 + (pet.def || 0) * 2 + (pet.hp || 0) * 0.4);
    }
  }
  return Math.max(10, power);
}

function calcEnemyCombatPower(enemy) {
  if (typeof enemy === "string" && typeof getEnemyById === "function") enemy = getEnemyById(enemy);
  if (!enemy) return 0;
  const realm = enemy.realm || 0;
  const sub = enemy.sub || 1;
  const hp = enemy.hp || (80 + sub * 25 + realm * 100);
  const atk = enemy.atk || (6 + sub * 3 + realm * 5);
  const def = enemy.def || (2 + sub * 1 + realm * 3);
  const spd = enemy.speed || (10 + sub);
  const mp = enemy.mp || 0;
  return Math.floor(atk * 4 + def * 5 + hp * 0.8 + mp * 0.5 + spd * 2 + realm * 150 + sub * 20);
}

function calcZoneRecommendedPower(zone) {
  if (!zone) return 0;
  if (zone.layers && zone.layers[0] && zone.layers[0].enemies && zone.layers[0].enemies.length > 0) {
    const enemyPowers = zone.layers[0].enemies.map(id => calcEnemyCombatPower(id)).filter(p => p > 0);
    if (enemyPowers.length > 0) {
      const avg = enemyPowers.reduce((a, b) => a + b, 0) / enemyPowers.length;
      return Math.floor(avg * 1.05);
    }
  }
  const realm = zone.realmMin || 1;
  return Math.floor(realm * 400 + 100);
}

function calcSecretRealmRecommendedPower(ev) {
  if (!ev) return 0;
  const realmMin = ev.realmMin !== undefined ? ev.realmMin : 1;
  if (realmMin === 0) return 180;
  return Math.floor(realmMin * 450 + 50);
}

/* 检查并推进时辰阶段（防止历练或其它耗时行动耗尽行动力后卡死在当前时段） */
function checkAdvanceTimeSlot() {
  if (!S) return false;
  let advanced = false;
  while (S.actionsUsed >= ACTIONS_PER_SLOT && S.hour < 2) {
    S.hour++;
    S.actionsUsed = Math.max(0, S.actionsUsed - ACTIONS_PER_SLOT);
    log(`【时辰流转】进入${HOURS[S.hour]}。`, "c-blue");
    advanced = true;
    if (S.hour === 2) {
      setTimeout(() => {
        if (typeof nightPrompt === "function") nightPrompt();
      }, 400);
    }
  }
  return advanced;
}

if (typeof window !== "undefined") {
  window.checkAdvanceTimeSlot = checkAdvanceTimeSlot;
}
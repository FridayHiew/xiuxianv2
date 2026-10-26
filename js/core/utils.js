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
  const roll = Math.random();
  if (roll < 0.10) {
    roots[pick(ROOT_TYPES).id] = rndInt(8, 9);
  } else if (roll < 0.35) {
    const ks = [...ROOT_TYPES].sort(() => Math.random() - 0.5).slice(0, 2).map(x => x.id);
    ks.forEach(k => roots[k] = rndInt(5, 7));
  } else if (roll < 0.65) {
    const ks = [...ROOT_TYPES].sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.id);
    ks.forEach(k => roots[k] = rndInt(3, 5));
  } else if (roll < 0.90) {
    ["jin", "mu", "shui", "huo", "tu"].forEach(k => roots[k] = rndInt(2, 4));
  } else {
    ROOT_TYPES.forEach(r => { if (chance(0.5)) roots[r.id] = rndInt(1, 3); });
    if (Math.max(...Object.values(roots)) < 1) roots[pick(ROOT_TYPES).id] = rndInt(1, 3);
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
  if (!S.heartArts || !S.heartArts.current) return null;
  return HEART_ARTS.find(a => a.id === S.heartArts.current);
}
function getArtProgress(artId) {
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

  if (!S.heartArts) return { realm: 0, lvl: 0 };

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
  if (!S.heartArts) return bonus;
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
  const item = (typeof ITEMS !== "undefined" && ITEMS[id]) || (typeof findEquipById === "function" ? findEquipById(id) : null) || { name: id, type: "other" };
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
    food: "灵宠兽粮",
    petBreak: "灵兽破境丹",
    mat: "天材地宝",
    quest: "秘要信物",
    other: "杂务雅具",
  };

  const icon = (typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) || "📦";
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
    statChips.push({ label: `部位·${slotLabel}`, color: "gold" });

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
    effectDesc = `【装配属性】${effects.join("，") || "基础防具法器"}。`;

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
  else if (item.type === "pill") {
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
      } else {
        effectDesc = item.desc || "玄妙灵丹，蕴含造化药性。";
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
        statChips.push({ label: `丹毒+${item.danDu.toFixed(2)}`, color: "red" });
        reqDesc = `每次服用累积 +${item.danDu.toFixed(2)} 丹毒（过高会阻碍破境）。`;
        desc += `（丹毒+${item.danDu.toFixed(2)}）`;
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
    if (item.grade) statChips.push({ label: `${item.grade}阶天材地宝`, color: "gold" });
    statChips.push({ label: "炼丹锻造灵材", color: "cyan" });
    effectDesc = `可投入炼丹炉配制相应品阶灵丹，或于天机鼎作为神兵锻造附灵淬炼之主辅材料。`;
    desc = desc || `${item.grade || 1} 阶天地钟秀之灵物，采摘自崇山灵脉洞天福地。`;
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
    }
    desc = desc || "修仙者日常历练或游历红尘所得之随身器具。";
  }

  return {
    id,
    name: item.name || id,
    type: item.type,
    typeName,
    icon,
    count: haveCount,
    grade: item.grade,
    tier: item.tier,
    price: item.price || 0,
    desc,
    effectDesc,
    reqDesc,
    statChips,
    statusBadge,
    canAction,
    actionLabel,
    actionFn,
    rawItem: item,
  };
}

/* 弹窗查看道具玉简灵鉴（全景详尽说明） */
function showItemDetailModal(id) {
  const d = getItemDetails(id);
  const chipsHtml = d.statChips.map(c => `<span class="bag-chip ${c.color || ''}">${c.label}</span>`).join(" ");

  let body = `
    <div class="item-detail-modal">
      <div class="item-detail-header">
        <div class="item-detail-icon">${d.icon}</div>
        <div class="item-detail-header-text">
          <div class="item-detail-title">
            <span>${d.name}</span>
            <span class="tag gold" style="font-size:11px;">${d.typeName}</span>
            ${d.count > 0 ? `<span class="tag" style="background:#20170d; color:var(--text-bright); font-size:11px;">拥有 ×${d.count}</span>` : ""}
          </div>
          <div class="item-detail-chips">${chipsHtml}</div>
        </div>
      </div>

      <div class="item-detail-quote">
        「${d.desc}」
      </div>

      <div class="item-detail-section">
        <div class="item-detail-sec-title">✨ 灵物功用与妙理</div>
        <div class="item-detail-sec-content">${d.effectDesc || "暂无特殊效果记载。"}</div>
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

  /* 杂务工具半价卖出 */
  if (d.type === "other" && S.tools && S.tools[id]) {
    const sellPrice = Math.floor((d.price || 0) / 2);
    actions.push({
      label: `卖出 (${sellPrice}${currencyName()})`,
      fn: () => {
        closeModal();
        if (typeof sellTool === "function") sellTool(id);
        render();
      }
    });
  } else if ((d.type === "pill" || d.type === "mat" || d.type === "equip") && d.count > 0 && !(S.equipped && Object.values(S.equipped).includes(id))) {
    const sellPrice = Math.max(1, Math.floor((d.price || 10) / 2));
    actions.push({
      label: `出售1个 (${sellPrice}铜钱)`,
      fn: () => {
        closeModal();
        if (typeof sellItemToMarket === "function") {
          sellItemToMarket(id);
        } else {
          removeItem(id, 1);
          S.money = (S.money || 0) + sellPrice;
          log(`出售 ${d.name} ×1，获得 ${sellPrice} 铜钱。`, "c-good");
          save(); render();
        }
      }
    });
  }

  actions.push({ label: "合上玉简", fn: closeModal });

  showModal(`道具灵鉴 · ${d.name}`, body, actions);
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
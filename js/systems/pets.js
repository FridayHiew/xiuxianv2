/* ============================================================
   systems/pets.js - 灵宠系统（饲灵丸版）
   ============================================================ */

/* ============================================================
   生成灵宠（收服时）
   ============================================================ */

function getMaxPetCapacity() {
  const beastLv = (S && S.cave && typeof S.cave.beast === "number")
    ? Math.min(10, Math.max(0, S.cave.beast))
    : 0;
  /* 0级只能有1只灵兽，每升1级加1只（当前版本最高3级可养4只，最高10级可养11只） */
  return 1 + beastLv;
}

function canAddMorePets() {
  const curCount = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list.length : 0;
  const maxCap = getMaxPetCapacity();
  return curCount < maxCap;
}

function releasePet(uid) {
  if (!S || !S.pets || !Array.isArray(S.pets.list)) return;
  const idx = S.pets.list.findIndex(p => p.uid === uid);
  if (idx === -1) return;
  const pet = S.pets.list[idx];
  S.pets.list.splice(idx, 1);
  if (S.equipped && S.equipped.pet === uid) {
    S.equipped.pet = S.pets.list.length > 0 ? S.pets.list[0].uid : null;
  }
  log(`【放生灵兽】你解除了与【${pet.name}】的伴生法契，任其回归山林。`, "c-dim");
  save();
  if (typeof renderProfile === "function") renderProfile();
  render();
}

function genPet(defId, name) {
  const talent = randomPetTalent();
  const bloodline = pick(PET_BLOODLINES);

  return {
    uid: "pet_" + S.pets.nextUid++,
    defId: defId,
    name: name,
    talent: talent.id,
    bloodline: bloodline.id,
    lvl: 1,
    realm: 0,
    exp: 0,
    hp: null,
    hunger: 100,
    loyalty: 50,      /* ★ 新增：忠诚度 */
    foodStorage: {},
  };
}

/* ============================================================
   属性计算
   ============================================================ */

function getPetStats(pet) {
  if (!pet) return null;
  const base = (typeof getEnemyById === "function" ? getEnemyById(pet.defId) : null) || {
    hp: 70, mp: 20, atk: 10, def: 3, speed: 13, skills: [], spells: [], resistances: {}
  };

  const talent = getPetTalent(pet.talent);
  const bloodline = getPetBloodline(pet.bloodline);

  const lvlScale = 1 + ((pet.lvl || 1) - 1) * 0.2;
  const realmScale = Math.pow(1.6, pet.realm || 0);
  const scale = lvlScale * realmScale * talent.growth;

  let hpMax = Math.max(10, Math.floor((base.hp || 70) * scale));
  let mpMax = Math.floor((base.mp || 20) * scale);
  let atk = Math.max(1, Math.floor((base.atk || 10) * scale));
  let def = Math.max(0, Math.floor((base.def || 3) * scale));
  let speed = Math.max(1, Math.floor((base.speed || 12) * (1 + ((pet.lvl || 1) - 1) * 0.05)));

  const hunger = pet.hunger !== undefined ? pet.hunger : 100;
  let hungerMod = 0;
  if (hunger >= 80) hungerMod = 0;
  else if (hunger >= 40) hungerMod = -0.1;
  else hungerMod = -0.3;

  atk = Math.max(1, Math.floor(atk * (1 + hungerMod)));
  def = Math.max(0, Math.floor(def * (1 + hungerMod)));
  speed = Math.max(1, Math.floor(speed * (1 + hungerMod)));

  const resistances = Object.assign({}, base.resistances || {});
  for (const k in bloodline.resistBonus) {
    resistances[k] = (resistances[k] || 0) + bloodline.resistBonus[k];
  }
  for (const k in resistances) {
    resistances[k] = Math.max(-100, Math.min(100, resistances[k]));
  }

  return {
    name: pet.name,
    lvl: pet.lvl || 1,
    realm: pet.realm || 0,
    hpMax, mpMax, atk, def, speed,
    skills: base.skills || [],
    spells: base.spells || [],
    resistances,
    bloodline,
    talent,
  };
}

/* ============================================================
   自动检索玩家已装备与备战的灵魂 / 召唤物列表
   ============================================================ */

function getEquippedSoulList() {
  if (!S) return [];
  const allPets = (S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];
  const alivePets = allPets.filter(p => p && (p.hp === null || p.hp === undefined || p.hp > 0));

  const equippedIds = new Set();
  if (S.equipped) {
    if (S.equipped.pet) equippedIds.add(String(S.equipped.pet));
    if (Array.isArray(S.equipped.souls)) {
      S.equipped.souls.forEach(id => { if (id) equippedIds.add(String(id)); });
    }
    if (Array.isArray(S.equipped.summons)) {
      S.equipped.summons.forEach(id => { if (id) equippedIds.add(String(id)); });
    }
  }

  let equippedList = alivePets.filter(p => equippedIds.has(String(p.uid)) || p.equipped === true);

  /* 若玩家拥有健康召唤物但尚未标记出战，自动将首只召唤物加入已装备槽位 */
  if (equippedList.length === 0 && alivePets.length > 0) {
    if (!S.equipped) S.equipped = {};
    S.equipped.pet = alivePets[0].uid;
    equippedList = [alivePets[0]];
  }

  return equippedList;
}

function getStandbySoulList() {
  if (!S) return [];
  const allPets = (S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];
  const alivePets = allPets.filter(p => p && (p.hp === null || p.hp === undefined || p.hp > 0));
  const equippedUids = new Set(getEquippedSoulList().map(p => String(p.uid)));
  return alivePets.filter(p => !equippedUids.has(String(p.uid)));
}

/* 获取玩家当前主修的召唤技能（确保必有一门可用召唤术） */
function getActiveSummonSkills() {
  const learnedIds = (S && S.combatSkills && Array.isArray(S.combatSkills.learned))
    ? S.combatSkills.learned
    : [];
  const seen = new Set();
  const skills = [];

  learnedIds.forEach(id => {
    const sk = typeof getSummonSkill === "function" ? getSummonSkill(id) : null;
    if (sk && !seen.has(sk.id)) {
      seen.add(sk.id);
      skills.push(sk);
    }
  });

  if (skills.length === 0 && typeof getSectSummonSkill === "function") {
    const fallback = getSectSummonSkill(S ? S.sect : null);
    if (fallback) skills.push(fallback);
  }
  return skills;
}

/* ============================================================
   战斗单位构造
   ============================================================ */

function buildPetUnit(targetUid, skillObj) {
  const allPets = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];
  let pet = null;

  if (targetUid !== undefined && targetUid !== null) {
    pet = allPets.find(p => String(p.uid) === String(targetUid));
  }
  if (!pet && S && S.equipped && S.equipped.pet) {
    pet = allPets.find(p => String(p.uid) === String(S.equipped.pet));
  }
  if (!pet) {
    const equippedList = getEquippedSoulList();
    if (equippedList.length > 0) pet = equippedList[0];
  }

  if (pet) {
    const stats = getPetStats(pet);
    if (!stats) return null;
    if (pet.hp !== null && pet.hp !== undefined && pet.hp <= 0) return null;

    let hpMax = stats.hpMax;
    let atk = stats.atk;
    let def = stats.def;
    let speed = stats.speed;

    /* 根据调用的召唤技能赋予法契加成 */
    if (skillObj) {
      if (skillObj.id === "summon_blood") {
        atk = Math.max(1, Math.floor(atk * 1.25));
      } else if (skillObj.id === "summon_soul") {
        atk = Math.max(1, Math.floor(atk * 1.15));
        speed = Math.max(1, Math.floor(speed * 1.15));
      } else if (skillObj.id === "summon_puppet") {
        hpMax = Math.max(10, Math.floor(hpMax * 1.3));
        def = Math.max(1, Math.floor(def * 1.3));
      }
    }

    const curHp = (pet.hp !== null && pet.hp !== undefined) ? Math.min(pet.hp, hpMax) : hpMax;

    return {
      id: "pet_" + pet.uid,
      side: "player",
      isPet: true,
      petUid: pet.uid,
      name: pet.name,
      realm: stats.realm,
      sub: stats.lvl,

      hp: curHp,
      hpMax: hpMax,
      mp: stats.mpMax,
      mpMax: stats.mpMax,
      atk: atk,
      def: def,
      speed: speed,
      luck: 5,

      skills: stats.skills,
      spells: stats.spells,
      items: {},
      resistances: stats.resistances,
      statuses: [],

      alive: true,
      defending: false,
    };
  }

  /* 若没有实体灵宠但施展了招魂帆/机关术/血脉召唤术，凝聚对应战魂助阵 */
  if (skillObj) {
    const info = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: 0, lvl: 1 };
    const pAtk = typeof totalAtk === "function" ? totalAtk() : 10;
    const pDef = typeof totalDef === "function" ? totalDef() : 5;
    const pHp  = typeof totalMaxHp === "function" ? totalMaxHp() : 80;
    const pSpd = typeof totalSpeed === "function" ? totalSpeed() : 12;

    const spiritTemplates = {
      summon_soul:   { name: "幽冥战魂", hpMult: 0.75, atkMult: 0.95, defMult: 0.70, spdMult: 1.15 },
      summon_puppet: { name: "玄铁机关傀儡", hpMult: 1.20, atkMult: 0.75, defMult: 1.25, spdMult: 0.85 },
      summon_blood:  { name: "远古血脉真灵", hpMult: 0.85, atkMult: 1.15, defMult: 0.80, spdMult: 1.05 },
      summon_beast:  { name: "通灵护法兽魂", hpMult: 0.85, atkMult: 0.85, defMult: 0.85, spdMult: 1.00 },
    };
    const tpl = spiritTemplates[skillObj.id] || spiritTemplates.summon_beast;
    const maxHp = Math.max(30, Math.floor(pHp * tpl.hpMult));

    return {
      id: "pet_spirit_" + skillObj.id,
      side: "player",
      isPet: true,
      petUid: null,
      name: tpl.name,
      realm: info.realm,
      sub: info.lvl,
      hp: maxHp,
      hpMax: maxHp,
      mp: 20,
      mpMax: 20,
      atk: Math.max(5, Math.floor(pAtk * tpl.atkMult)),
      def: Math.max(1, Math.floor(pDef * tpl.defMult)),
      speed: Math.max(5, Math.floor(pSpd * tpl.spdMult)),
      luck: 5,
      skills: [],
      spells: [],
      items: {},
      resistances: {},
      statuses: [],
      alive: true,
      defending: false,
    };
  }

  return null;
}

/* ============================================================
   召唤
   ============================================================ */

function doSummon(caster, petOrSkillId, explicitSkillId) {
  if (!battle) return;
  if (battle.units.some(u => u.isPet && u.alive)) {
    logBattle("场上已有召唤物并肩作战。");
    return;
  }

  const allPets = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];
  const matchedPet = allPets.find(p => String(p.uid) === String(petOrSkillId));

  /* 解析本次调用的召唤术技能 */
  const activeSkills = getActiveSummonSkills();
  const skill = (typeof getSummonSkill === "function" && (getSummonSkill(explicitSkillId) || getSummonSkill(petOrSkillId)))
    || activeSkills[0]
    || { id: "summon_beast", name: "召唤灵兽", cost: { mp: 5 } };

  const mpCost = (skill && skill.cost && skill.cost.mp !== undefined) ? skill.cost.mp : 5;
  /* 扣除灵力（若凡人期或灵力不足则消耗当前剩余灵力，不阻断召唤响应） */
  const actualMpCost = Math.min(Math.max(0, caster.mp || 0), mpCost);

  let targetPetUid = null;
  if (matchedPet) {
    targetPetUid = matchedPet.uid;
    S.equipped = S.equipped || {};
    S.equipped.pet = matchedPet.uid;
  } else {
    const equippedList = getEquippedSoulList();
    if (equippedList.length > 0) {
      targetPetUid = equippedList[0].uid;
      S.equipped = S.equipped || {};
      S.equipped.pet = targetPetUid;
    }
  }

  const petUnit = buildPetUnit(targetPetUid, skill);
  if (!petUnit) {
    logBattle("没有可部署的灵魂或伴生灵宠（请先在洞府中整备或医治）。");
    return;
  }

  caster.mp = Math.max(0, (caster.mp || 0) - actualMpCost);

  if (caster.isPlayer && typeof gainBattleSkillProficiency === "function") {
    gainBattleSkillProficiency(["兽"], 4);
  }

  /* 清理阵营中任何残留的已收回或阵亡的灵宠单位，确保场上仅存在 1 只灵宠 */
  battle.units = battle.units.filter(u => !(u.side === "player" && u.isPet));
  battle.order = battle.order.filter(u => !(u.side === "player" && u.isPet));

  /* 立即加入战场与行动序列 */
  battle.units.push(petUnit);
  const skillLabel = skill && skill.name ? skill.name : "通灵召唤";
  logBattle(`【${skillLabel}】${caster.name} 掐诀催动召唤术，【${petUnit.name}】应召降临战场！`);

  if (typeof queueBattleVfx === "function") {
    const sumElem = skill && skill.id === "summon_blood" ? "xue"
      : skill && skill.id === "summon_soul" ? "lei"
      : skill && skill.id === "summon_puppet" ? "tu"
      : (typeof getUnitElementKey === "function" ? getUnitElementKey(caster) : "jin");
    queueBattleVfx({
      kind: "summon",
      attackerId: caster.id,
      targetId: petUnit.id,
      targetName: petUnit.name,
      dmg: 0,
      crit: false,
      element: sumElem,
      label: skillLabel,
    });
  }

  /* 立即将召唤物插入到当前回合后续行动序列中 */
  const currIdx = battle.currentIdx;
  const remainingOrder = battle.order.slice(currIdx + 1);
  remainingOrder.push(petUnit);
  remainingOrder.sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a));
  battle.order = [...battle.order.slice(0, currIdx + 1), ...remainingOrder];
}

/* ============================================================
   收回在场灵兽 (摄兽归囊)
   ============================================================ */

function doRecallPet(caster) {
  if (!battle) return;
  const petUnit = battle.units.find(u => u.side === "player" && u.isPet && u.alive && !u.recalled);
  if (!petUnit) {
    if (typeof logBattle === "function") logBattle("场上暂无已出战灵兽可收回。");
    return;
  }

  petUnit.alive = false;
  petUnit.recalled = true;

  /* 从行动序列中移除该灵兽 */
  battle.order = battle.order.filter(u => u.id !== petUnit.id);
  if (battle.currentIdx >= battle.order.length) {
    battle.currentIdx = Math.max(0, battle.order.length - 1);
  }

  /* 同步灵兽当前气血并存入 S.pets.list，保全灵兽 */
  if (petUnit.petUid && S && S.pets && Array.isArray(S.pets.list)) {
    const pet = S.pets.list.find(p => p.uid === petUnit.petUid);
    if (pet) {
      pet.hp = Math.max(1, Math.floor(petUnit.hp || 1));
    }
  }

  /* ★ 保存到 recalledPets 队列供战后结算灵宠收益，并直接从战场单位列表移除（直接从画面消失，不以dim状态残留） */
  battle.recalledPets = battle.recalledPets || [];
  battle.recalledPets.push(petUnit);
  battle.units = battle.units.filter(u => u.id !== petUnit.id);

  const casterName = (caster && caster.name) || "你";
  if (typeof logBattle === "function") {
    logBattle(`【摄兽灵诀】${casterName} 掐诀念咒，伴生灵兽【${petUnit.name}】化作一道清光安然收回灵宠囊中！`);
  }

  if (typeof queueBattleVfx === "function") {
    queueBattleVfx({
      kind: "summon",
      attackerId: (caster && caster.id) || "player",
      targetId: petUnit.id,
      targetName: petUnit.name,
      dmg: 0,
      crit: false,
      element: "neutral",
      label: "收回灵兽",
    });
  }
}


function applyPendingPets() {
  if (!battle || !battle.pendingPets) return;
  if (battle.pendingPets.length === 0) return;

  battle.pendingPets.forEach(p => {
    logBattle(`${p.name} 咆哮策应！`);
  });
  battle.pendingPets = [];

  battle.order = battle.units
    .filter(u => u.alive && !u.escaped && !u.tamed)
    .sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a));
}

/* ============================================================
   灵宠 AI
   ============================================================ */

function petTurn(u) {
  if (!battle || !u.alive) return;

  battle.lastActorId = u.id;
  battle.lastActorSide = "player";
  battle.animating = true;

  const action = choosePetAction(u);

  switch (action.type) {
    case "attack": doAttack(u); break;
    case "spell":  doSpell(u, action.spellId); break;
    case "skill":  doSkill(u, action.skillId); break;
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

function choosePetAction(u) {
  if (Array.isArray(u.spells) && u.spells.length > 0 && u.mp >= 8 && chance(0.45)) {
    const sid = pick(u.spells);
    const sp = getSpell(sid);
    if (sp && u.mp >= sp.cost.mp) {
      return { type: "spell", spellId: sid };
    }
  }
  if (Array.isArray(u.skills) && u.skills.length > 0 && chance(0.42)) {
    const sid = pick(u.skills);
    const sk = getCombatSkill(sid);
    if (sk) {
      return { type: "skill", skillId: sid };
    }
  }
  return { type: "attack" };
}

/* ============================================================
   根据名称与定义ID解析灵宠/妖兽/队友专属图标
   ============================================================ */
function getPetOrAllyIcon(unitOrPet) {
  if (!unitOrPet) return "🐾";
  const text = `${unitOrPet.name || ""} ${unitOrPet.defId || ""} ${unitOrPet.id || ""}`;
  if (/狐|fox/.test(text)) return "🦊";
  if (/狼|wolf/.test(text)) return "🐺";
  if (/蛇|蟒|蚺|标|snake|viper|python|serpent/.test(text)) return "🐍";
  if (/蛛|spider/.test(text)) return "🕷️";
  if (/兔|rabbit/.test(text)) return "🐇";
  if (/雀|鹰|鸦|鹏|鸟|金乌|sparrow|eagle|crow|roc/.test(text)) return "🦅";
  if (/穿山甲|犀|甲虫|守宫|蜥|pangolin|rhino|beetle|lizard|gecko/.test(text)) return "🦎";
  if (/蟾|蛙|toad/.test(text)) return "🐸";
  if (/蝶|蜂|butterfly|bee/.test(text)) return "🦋";
  if (/猬|hedgehog/.test(text)) return "🦔";
  if (/猪|boar/.test(text)) return "🐗";
  if (/熊|bear/.test(text)) return "🐻";
  if (/猢狲|猿|猴|monkey|ape/.test(text)) return "🦍";
  if (/虎|豹|tiger|leopard/.test(text)) return "🐅";
  if (/龙|蛟|螭|dragon/.test(text)) return "🐉";
  if (/鹿|deer/.test(text)) return "🦌";
  if (/犬|狗|犼|hound/.test(text)) return "🐕";
  if (/蝎|蜈|scorpion|centipede/.test(text)) return "🦂";
  if (/蝠|bat/.test(text)) return "🦇";
  if (/花|草|芝|藤|菇|flower|vine|mushroom|mandrake/.test(text)) return "🌺";
  if (/魂|鬼|尸|魅|判官|幽冥|soul|ghost|wraith|corpse|ghoul/.test(text)) return "👻";
  if (/傀|机关|铁卫|俑|飞刃|puppet|golem|wheel/.test(text)) return "🤖";
  if (/血脉|真灵|blood/.test(text)) return "🩸";
  if (unitOrPet.side === "player" && !unitOrPet.isPet) return "🧙";
  if (unitOrPet.isBeast === false) return "⚔️";
  return "🐾";
}

/* ============================================================
   战后处理（汇总存活灵宠/队友与阵亡灵宠/队友详情及图标）
   ============================================================ */

function handlePetsAfterBattle(battleUnits, killedEnemies, sharedExpPerUnit) {
  const deadPets = [];
  const survivingAllies = [];
  const fallenAllies = [];

  const petList = (S && S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];

  /* 合并战后单位与中途安全收回至囊中的灵宠，确保收回的灵宠也能顺利结算历练收益并保留存活状态 */
  const allUnits = [...(battleUnits || [])];
  if (typeof battle !== "undefined" && battle && Array.isArray(battle.recalledPets)) {
    battle.recalledPets.forEach(rp => {
      if (!allUnits.some(u => u.id === rp.id)) {
        allUnits.push(rp);
      }
    });
  }

  allUnits.forEach(u => {
    if (!u || u.side !== "player" || u.isPlayer) return;

    const icon = getPetOrAllyIcon(u);
    const realmName = (typeof REALMS !== "undefined" && REALMS[u.realm || 0])
      ? REALMS[u.realm || 0].name
      : "凡阶";

    if (u.isPet && u.petUid) {
      const pet = petList.find(p => p.uid === u.petUid);
      if (!pet) return;

      const talentObj = typeof getPetTalent === "function" ? getPetTalent(pet.talent) : null;
      const bloodObj = typeof getPetBloodline === "function" ? getPetBloodline(pet.bloodline) : null;
      const talentName = talentObj ? talentObj.name : "凡品";
      const bloodlineName = bloodObj ? bloodObj.name : "寻常血脉";

      const isUnitAlive = (u.alive || u.recalled) && (u.hp > 0 || u.recalled);
      if (isUnitAlive) {
        pet.hp = Math.max(1, Math.floor(u.hp || pet.hp || 1));
        const oldLvl = pet.lvl || 1;
        const isAtMaxLvl = (pet.lvl || 1) >= 10;

        let petExp = 0;
        if (!isAtMaxLvl) {
          if (sharedExpPerUnit !== undefined) {
            petExp = Math.max(0, Math.floor(sharedExpPerUnit));
          } else {
            (killedEnemies || []).forEach(e => {
              petExp += Math.floor((e.exp || 0) * 0.5);
            });
          }
          if (petExp > 0) {
            pet.exp = (pet.exp || 0) + petExp;
            let need = petExpNeed(pet.lvl);
            while (pet.exp >= need && pet.lvl < 10) {
              pet.exp -= need;
              pet.lvl++;
              need = petExpNeed(pet.lvl);
            }
            if (pet.lvl >= 10) {
              pet.lvl = 10;
              pet.exp = 0;
            }
          }
        } else {
          /* 灵兽满级（Lv.10）未突破时，不能增加经验值 */
          petExp = 0;
          pet.exp = 0;
        }

        survivingAllies.push({
          uid: pet.uid,
          name: pet.name,
          icon,
          roleLabel: "伴生灵宠",
          realmText: `${realmName} · Lv.${pet.lvl}`,
          talentText: `${talentName} · ${bloodlineName}`,
          oldLvl,
          newLvl: pet.lvl,
          leveledUp: pet.lvl > oldLvl,
          isMaxLvl: pet.lvl >= 10,
          expGain: petExp,
          hp: u.hp,
          hpMax: u.hpMax,
        });
      } else {
        u.alive = false;
        pet.hp = 0;
        pet.icon = icon;
        pet.slainBy = u._killedBy || "强敌围攻";
        pet.slainByMove = u._killedByMove || "致命重创";
        deadPets.push(pet);

        fallenAllies.push({
          uid: pet.uid,
          name: pet.name,
          icon,
          roleLabel: "伴生灵宠",
          realmText: `${realmName} · Lv.${pet.lvl || 1}`,
          talentText: `${talentName} · ${bloodlineName}`,
          hpMax: u.hpMax,
          slainBy: u._killedBy || "强敌围攻",
          slainByMove: u._killedByMove || "致命重击",
          permanentDeath: true,
          fateDesc: `遭【${u._killedBy || "强敌"}】以【${u._killedByMove || "致命一击"}】重创，护主心切力战而陨，已从仙苑名录除名`,
        });
      }
      return;
    }

    /* 临时召唤灵 / 助战队友单位 */
    const roleLabel = u.isPet ? "通灵召唤战魂" : "助战同道队友";
    if (u.alive && u.hp > 0) {
      survivingAllies.push({
        uid: u.id,
        name: u.name,
        icon,
        roleLabel,
        realmText: `${realmName} · ${u.sub || 1}重`,
        talentText: "法契助阵",
        oldLvl: u.sub || 1,
        newLvl: u.sub || 1,
        leveledUp: false,
        expGain: 0,
        hp: u.hp,
        hpMax: u.hpMax,
      });
    } else {
      fallenAllies.push({
        uid: u.id,
        name: u.name,
        icon,
        roleLabel,
        realmText: `${realmName} · ${u.sub || 1}重`,
        talentText: u.isPet ? "召唤灵体" : "同道挚友",
        hpMax: u.hpMax,
        slainBy: u._killedBy || "强敌围攻",
        slainByMove: u._killedByMove || "致命重击",
        permanentDeath: !u.isPet,
        fateDesc: u.isPet
          ? `遭【${u._killedBy || "强敌"}】击溃灵体，战魂消散归墟（日后可重新施术召唤）`
          : `遭【${u._killedBy || "强敌"}】以【${u._killedByMove || "致命重击"}】击败倒地`,
      });
    }
  });

  if (deadPets.length > 0 && S && S.pets && Array.isArray(S.pets.list)) {
    S.pets.list = S.pets.list.filter(p => !deadPets.includes(p));
    if (S.equipped && deadPets.some(p => p.uid === S.equipped.pet)) {
      S.equipped.pet = null;
    }
  }

  deadPets.survivingAllies = survivingAllies;
  deadPets.fallenAllies = fallenAllies;
  return deadPets;
}

/* ============================================================
   灵宠突破
   ============================================================ */

function canBreakPet(pet) {
  if (pet.lvl < 10) return { ok: false, reason: "需 Lv.10 圆满" };

  const talent = getPetTalent(pet.talent);
  if (pet.realm >= talent.maxRealm) {
    return { ok: false, reason: `天赋所限，最高${REALMS[talent.maxRealm].name}期` };
  }

  const petBreakId = "petBreak_" + (pet.realm + 1);
  const item = ITEMS[petBreakId];
  if (!item) return { ok: false, reason: "无法突破" };

  const have = S.inventory[petBreakId] || 0;
  if (have < 1) {
    return { ok: false, reason: `需 ${item.name} ×1（当前 ${have}）` };
  }

  return { ok: true, itemId: petBreakId, item };
}

function breakPet(petUid) {
  const pet = S.pets.list.find(p => p.uid === petUid);
  if (!pet) return;

  const check = canBreakPet(pet);
  if (!check.ok) { log(`灵宠突破失败：${check.reason}`, "c-bad"); return; }

  removeItem(check.itemId, 1);

  pet.realm++;
  pet.lvl = 1;
  pet.exp = 0;
  pet.hp = null;

  const realmName = REALMS[pet.realm].name;
  log(`【灵宠突破】${pet.name} 突破到 ${realmName}期！`, "c-gold");
  save(); renderProfile();
  showActionModal("灵宠突破成功", [
    `${pet.name} 达到 ${realmName}·1重`,
    `消耗 ${check.item.name} ×1`,
  ]);
}

/* ============================================================
   出战 / 休息
   ============================================================ */

function equipPet(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;
  if (pet.hp !== null && pet.hp <= 0) {
    log("灵宠已重伤，无法出战", "c-bad");
    return;
  }
  S.equipped.pet = uid;
  log(`【灵宠】${pet.name} 出战。`, "c-gold");
  save(); renderProfile();
}

function unequipPet() {
  S.equipped.pet = null;
  log("收回灵宠。", "c-normal");
  save(); renderProfile();
}

/* ============================================================
   每日处理（饲灵丸自动喂食）
   ============================================================ */

function processDailyPets() {
  if (!S.pets || !S.pets.list) return [];

  const deadPets = [];

  S.pets.list.forEach(pet => {
    if (pet.hunger === undefined) pet.hunger = 100;
    if (pet.loyalty === undefined) pet.loyalty = 50;
    if (!pet.foodStorage) pet.foodStorage = {};

    pet.hunger = Math.max(0, pet.hunger - rndInt(5, 20));

    /* ★ 自动喂食：从 foodStorage 里找任意饲灵丸 */
    for (const fid in pet.foodStorage) {
      if (pet.foodStorage[fid] <= 0) continue;
      const food = (typeof getItem === "function" ? getItem(fid) : null) || ITEMS[fid];
      if (!food) continue;
      const isPetFood = (food.effect && food.effect.type === "petFood") || food.type === "food" || String(food.name || fid).includes("饲灵丸");
      if (!isPetFood) continue;

      while (pet.hunger < 100 && (pet.foodStorage[fid] || 0) > 0) {
        pet.foodStorage[fid]--;
        if (pet.foodStorage[fid] <= 0) delete pet.foodStorage[fid];

        /* 饥饿回复 */
        const gainH = (food.effect && food.effect.hunger) || food.hunger || 25;
        pet.hunger = Math.min(100, pet.hunger + gainH);

        /* 修为增加（满级未突破时不加经验） */
        const gainExp = (food.effect && food.effect.exp) || 0;
        if (gainExp > 0 && (pet.lvl || 1) < 10) {
          pet.exp += gainExp;
          let need = petExpNeed(pet.lvl);
          while (pet.exp >= need && pet.lvl < 10) {
            pet.exp -= need;
            pet.lvl++;
            need = petExpNeed(pet.lvl);
          }
          if (pet.lvl >= 10) {
            pet.lvl = 10;
            pet.exp = 0;
          }
        } else if ((pet.lvl || 1) >= 10) {
          pet.exp = 0;
        }
      }
      if (pet.hunger >= 100) break;
    }

    if (pet.hunger <= 0) {
      deadPets.push(pet);
    }
  });

  if (deadPets.length > 0) {
    const deadUids = new Set(deadPets.map(p => p.uid));
    S.pets.list = S.pets.list.filter(p => !deadUids.has(p.uid));
    if (S.equipped && S.equipped.pet && deadUids.has(S.equipped.pet)) {
      S.equipped.pet = null;
    }
    deadPets.forEach(dp => {
      log(`【灵宠饿死】灵宠【${dp.name}】因久未进食饥饿归天，已从仙苑名录去除。`, "c-bad");
    });
  }

  return deadPets;
}

/* 检查并去除已经饿死的灵兽 */
function cleanDeadPets() {
  if (!S || !S.pets || !S.pets.list) return;
  const deadPets = S.pets.list.filter(p => (p.hunger !== undefined && p.hunger <= 0));
  if (deadPets.length > 0) {
    const deadUids = new Set(deadPets.map(p => p.uid));
    S.pets.list = S.pets.list.filter(p => !deadUids.has(p.uid));
    if (S.equipped && S.equipped.pet && deadUids.has(S.equipped.pet)) {
      S.equipped.pet = null;
    }
  }
}

/* ============================================================
   喂食（饲灵丸）
   ============================================================ */

function feedPet(uid, foodId, count = 1) {
  cleanDeadPets();
  if (!S.pets || !S.pets.list) return;
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;
  const food = (typeof getItem === "function" ? getItem(foodId) : null) || ITEMS[foodId];
  if (!food) return;

  /* 接受饲灵丸与兽粮 */
  const isPetFood = (food.effect && food.effect.type === "petFood") || food.type === "food" || String(food.name || foodId).includes("饲灵丸");
  if (!isPetFood) {
    log("只能喂食饲灵丸或灵兽口粮。", "c-bad");
    return;
  }

  const have = S.inventory[foodId] || 0;
  if (have <= 0) { log("没有这种饲灵丸。", "c-bad"); return; }
  const toAdd = Math.min(have, count || 1);
  removeItem(foodId, toAdd);
  if (typeof triggerDailyTask === "function") triggerDailyTask("garden");

  if (!pet.foodStorage) pet.foodStorage = {};
  pet.foodStorage[foodId] = (pet.foodStorage[foodId] || 0) + toAdd;

  const gainH = (food.effect && food.effect.hunger) || food.hunger || 25;
  const gainExp = (food.effect && food.effect.exp) || 0;

  /* 灵宠按需进食：吃多少，食碗才扣除多少库存 */
  let eaten = 0;
  while (pet.hunger < 100 && (pet.foodStorage[foodId] || 0) > 0) {
    pet.foodStorage[foodId]--;
    if (pet.foodStorage[foodId] <= 0) delete pet.foodStorage[foodId];
    eaten++;
    pet.hunger = Math.min(100, (pet.hunger || 0) + gainH);
    if (gainExp > 0 && (pet.lvl || 1) < 10) {
      pet.exp = (pet.exp || 0) + gainExp;
      let need = petExpNeed(pet.lvl);
      while (pet.exp >= need && pet.lvl < 10) {
        pet.exp -= need;
        pet.lvl++;
        log(`【灵宠升级】${pet.name} 升级到 Lv.${pet.lvl}！`, "c-gold");
        need = petExpNeed(pet.lvl);
      }
      if (pet.lvl >= 10) {
        pet.lvl = 10;
        pet.exp = 0;
      }
    } else if ((pet.lvl || 1) >= 10) {
      pet.exp = 0;
    }
  }

  const remainingInBowl = (pet.foodStorage && pet.foodStorage[foodId]) || 0;
  if (eaten > 0) {
    log(`给 ${pet.name} 食碗添入 ${toAdd} 颗【${food.name}】，${pet.name} 进食 ${eaten} 颗，饱腹达 ${pet.hunger}/100，碗内留存 ${remainingInBowl} 颗。`, "c-good");
  } else {
    log(`已将 ${toAdd} 颗【${food.name}】添入 ${pet.name} 食碗备用（灵宠当前饱腹，碗内现有 ${remainingInBowl} 颗）。`, "c-good");
  }

  save(); render();
  /* 实时刷新喂食弹窗，让玩家即刻看见碗的库存与背包变化 */
  const mask = document.getElementById("modalMask");
  if (mask && mask.classList.contains("show") && typeof openPetFeed === "function") {
    openPetFeed(uid);
  }
}

function renamePet(uid, newName) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;
  newName = (newName || "").trim().slice(0, 8);
  if (!newName) return;
  pet.name = newName;
  log(`灵宠改名为 ${newName}。`, "c-good");
  save(); render();
}

/* 买饲灵丸（只卖一阶，售价 30 铜钱） */
function buyPetFood(itemId = "饲灵丸_1阶", count = 1) {
  count = Math.max(1, parseInt(count, 10) || 1);
  const price = 30 * count;
  if ((S.money || 0) < price) {
    log(`铜钱不足（需 ${price} 铜钱，当前持有 ${S.money || 0} 钱）。`, "c-bad");
    return;
  }
  S.money -= price;

  let fid = "饲灵丸_1阶_基础";
  const created = typeof getOrCreatePillItem === "function" ? getOrCreatePillItem("饲灵丸_1阶", 1) : null;
  if (created && created.id) {
    fid = created.id;
    created.effect = { type: "petFood", hunger: 25, exp: 50 };
    created.desc = "一阶灵兽口粮，专为幼年仙宠研磨，服用可恢复25饱腹并增长道行。";
  } else {
    ITEMS[fid] = {
      id: fid,
      name: "饲灵丸",
      type: "pill",
      tier: 1,
      grade: 1,
      price: 30,
      usableIn: "field",
      effect: { type: "petFood", hunger: 25, exp: 50 },
      desc: "一阶灵兽口粮，专为幼年仙宠研磨，服用可恢复25饱腹并增长道行。"
    };
  }

  addItem(fid, count);
  log(`花费 ${price} 铜钱购买了【饲灵丸 (一阶)】×${count}。`, "c-good");
  save(); render();
}
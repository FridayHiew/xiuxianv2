/* ============================================================
   core/migrate.js - 存档迁移与字段兜底
   ------------------------------------------------------------
   从 main.js 抽出，单独维护。
   ============================================================ */

/* ============================================================
   旧档字段合并（items/mat/equips/fragments/artifacts）
   ============================================================ */
function migrateInventory(S) {
  if (!S.inventory) S.inventory = {};

  const merge = (obj) => {
    if (!obj) return;
    for (const k in obj) {
      if (!obj[k]) continue;
      const n = (typeof obj[k] === "number") ? obj[k] : 1;
      S.inventory[k] = (S.inventory[k] || 0) + n;
    }
  };

  merge(S.items);
  merge(S.mat);
  merge(S.equips);
  merge(S.fragments);
  if (S.artifacts && S.artifacts.owned) merge(S.artifacts.owned);

  delete S.items;
  delete S.mat;
  delete S.equips;
  delete S.fragments;
  delete S.artifacts;
  delete S.mounts;
}

/* ============================================================
   全量字段兜底（从 boot() 抽出）
   ============================================================ */
function applySaveDefaults(S) {
  /* 炼器装备恢复 */
  if (S.forgedItems) {
    for (const id in S.forgedItems) {
      ITEMS[id] = S.forgedItems[id];
      if (typeof registerItemToBucket === "function") {
        registerItemToBucket(id);
      }
    }
  } else {
    S.forgedItems = {};
  }

  /* 旧档字段合并 */
  migrateInventory(S);

  /* 基础字段 */
  if (!S.inventory) S.inventory = {};
  /* 清理并预热背包内的所有灵物道具，杜绝 undefined */
  for (const id in S.inventory) {
    if (!id || id === "undefined" || id === "null" || S.inventory[id] <= 0) {
      delete S.inventory[id];
      continue;
    }
    if (typeof getItem === "function") {
      getItem(id);
    }
  }
  if (!S.tools) S.tools = {};
  for (const tid in S.tools) {
    if (!tid || tid === "undefined" || tid === "null" || !S.tools[tid]) {
      delete S.tools[tid];
      continue;
    }
    if (typeof getItem === "function") {
      getItem(tid);
    }
  }
  if (S.flags && S.flags.auction && Array.isArray(S.flags.auction.stock)) {
    const badStock = S.flags.auction.stock.some(g => !g || !g.itemId || g.itemId === "undefined" || g.itemId === "null");
    if (badStock) {
      if (typeof generateAuctionStock === "function") {
        S.flags.auction.stock = generateAuctionStock();
      } else {
        S.flags.auction.stock = S.flags.auction.stock.filter(g => g && g.itemId && g.itemId !== "undefined" && g.itemId !== "null");
      }
    }
  }
  if (!S.hobbies) S.hobbies = [];
  if (!S.hobbySkill) S.hobbySkill = {};

  /* 灵石池合并 */
  if (S.inventory && S.inventory["灵石"]) {
    S.stone = (S.stone || 0) + S.inventory["灵石"];
    delete S.inventory["灵石"];
  }
  if (S.stone === undefined) S.stone = 0;

  /* 本心 */
  if (S.morality === undefined) {
    if (S.talent) {
      S.morality = Math.round((S.talent.zheng + (100 - S.talent.xie)) / 2);
    } else {
      S.morality = 50;
    }
  }
  delete S.talent;

  /* 星期 */
  if (S.weekday === undefined) S.weekday = 3;

  /* 状态 / 抗性 */
  if (!S.statuses) S.statuses = [];
  if (!S.resistances) {
    S.resistances = {
      poison: 0, burn: 0, bleed: 0,
      stun: 0, freeze: 0, silence: 0, atkDown: 0,
    };
  }

  /* 心法 */
  if (!S.elementLvl) S.elementLvl = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0, lei: 0, bing: 0 };
  if (S.dao === undefined) S.dao = 0;
  if (!S.heartArts) S.heartArts = { current: null, learned: [], progress: {} };
  if (!S.heartArts.progress) S.heartArts.progress = {};

  /* 法术 */
  if (!S.spells) S.spells = { learned: [] };

  /* 技能 */
  if (!S.combatSkills) S.combatSkills = { learned: [] };
  /* 召唤仙剑全部迁移为召唤灵兽 */
  if (S.combatSkills.learned.includes("summon_sword")) {
    S.combatSkills.learned = S.combatSkills.learned.filter(s => s !== "summon_sword");
    if (!S.combatSkills.learned.includes("summon_beast")) {
      S.combatSkills.learned.push("summon_beast");
    }
  }
  if (!S.combatSkills.learned.includes("summon_beast")) {
    S.combatSkills.learned.push("summon_beast");
  }

  if (S.inventory && S.inventory["book_summon_sword"]) {
    const cnt = S.inventory["book_summon_sword"];
    delete S.inventory["book_summon_sword"];
    S.inventory["book_summon_beast"] = (S.inventory["book_summon_beast"] || 0) + cnt;
  }

  /* 仅保留玩家实际选择的入门拳脚与兵刃招式（清理旧版误塞的全部基础招式） */
  if (!S.combatSkills) S.combatSkills = { learned: [] };
  const starterUnarmedIds = ["sk_fist1", "sk_palm1", "sk_leg1"];
  const starterWeaponIds = ["sk_sword1", "sk_blade1", "sk_staff1", "sk_whip1"];
  if (S.learnedArts && typeof S.learnedArts === "object") {
    const chosenUnarmed = starterUnarmedIds.filter(id => S.learnedArts[id]);
    if (chosenUnarmed.length > 0) {
      const keepU = chosenUnarmed[chosenUnarmed.length - 1];
      S.combatSkills.learned = S.combatSkills.learned.filter(id => !starterUnarmedIds.includes(id) || id === keepU);
      if (!S.combatSkills.learned.includes(keepU)) S.combatSkills.learned.push(keepU);
    }
    const chosenWeapon = starterWeaponIds.filter(id => S.learnedArts[id]);
    if (chosenWeapon.length > 0) {
      const keepW = chosenWeapon[chosenWeapon.length - 1];
      S.combatSkills.learned = S.combatSkills.learned.filter(id => !starterWeaponIds.includes(id) || id === keepW);
      if (!S.combatSkills.learned.includes(keepW)) S.combatSkills.learned.push(keepW);
    }
  }

  /* 伴生灵兽白狐 defId 兼容迁移 */
  if (S.pets && Array.isArray(S.pets.list)) {
    S.pets.list.forEach(p => {
      if (p.name === "伴生白狐" && (p.defId === "e_wolf" || !p.defId)) {
        p.defId = "e_white_fox";
      }
    });
  }

  /* 装备 */
  if (!S.equipped) S.equipped = {};
  EQUIP_SLOTS.forEach(s => {
    if (S.equipped[s] === undefined) S.equipped[s] = null;
  });
  delete S.equipped.weapon;
  delete S.equipped.armor;
  delete S.equipped.ring;

  /* 灵宠 */
  if (!S.pets) S.pets = { list: [], nextUid: 1 };
  if (!S.pets.list) S.pets.list = [];
  if (S.pets.nextUid === undefined) S.pets.nextUid = S.pets.list.length + 1;
  if (S.pets.list.length === 0 && typeof genPet === "function") {
    const startPet = genPet("e_wolf", "伴生白狐");
    startPet.talent = "t_spirit";
    S.pets.list.push(startPet);
    if (!S.equipped.pet) S.equipped.pet = startPet.uid;
  }
  if (S.pets.owned) {
    for (const defId in S.pets.owned) {
      const count = S.pets.owned[defId] === true ? 1 : S.pets.owned[defId];
      for (let i = 0; i < count; i++) {
        const enemy = getEnemyById(defId);
        S.pets.list.push({
          uid: "pet_" + S.pets.nextUid++,
          defId: defId,
          name: enemy ? enemy.name : defId,
          talent: "fan",
          bloodline: "none",
          lvl: 1,
          realm: 0,
          exp: 0,
          hp: null,
          hunger: 100,
          foodStorage: {},
        });
      }
    }
    delete S.pets.owned;
  }
  S.pets.list.forEach(pet => {
    if (pet.hunger === undefined) pet.hunger = 100;
    if (!pet.foodStorage) pet.foodStorage = {};
    if (!pet.talent) pet.talent = "fan";
    if (!pet.bloodline) pet.bloodline = "none";
    if (pet.realm === undefined) pet.realm = 0;
    if (pet.lvl === undefined) pet.lvl = 1;
    if (pet.exp === undefined) pet.exp = 0;
    if (pet.loyalty === undefined) pet.loyalty = 50;
  });

  /* 逆天宝物 */
  if (!S.heavenDefying) {
    S.heavenDefying = { owned: {}, stages: {}, killStacks: 0, reviveCooldown: 0, liquid: 0 };
  }
  if (!S.heavenDefying.owned) S.heavenDefying.owned = {};
  if (!S.heavenDefying.stages) S.heavenDefying.stages = {};
  if (S.heavenDefying.killStacks === undefined) S.heavenDefying.killStacks = 0;
  if (S.heavenDefying.reviveCooldown === undefined) S.heavenDefying.reviveCooldown = 0;
  if (S.heavenDefying.liquid === undefined) S.heavenDefying.liquid = 0;

  /* flags */
  if (!S.flags) S.flags = {};
  if (!S.flags.festivalYear) S.flags.festivalYear = {};
  if (!S.flags.npcDailyInteraction) S.flags.npcDailyInteraction = {};
  if (!S.flags.npcDailyGift) S.flags.npcDailyGift = {};
  if (!S.flags.npcDailyDay) S.flags.npcDailyDay = S.day;
  if (!S.flags.story) S.flags.story = { year1000: {}, year1001: {}, year1002: {}, year1003: {}, year1004: {} };
  if (!S.flags.secretRealm) S.flags.secretRealm = { opened: false, completed: false, gotOrb: false };
  if (S.flags.lastSundayDay === undefined) S.flags.lastSundayDay = 0;
  if (S.peak === undefined) S.peak = null;
  if (S.master === undefined) S.master = null;
  if (S.meditateCount === undefined) S.meditateCount = 1;
  if (!S.cave) S.cave = { level: 0, alchemy: 0, forge: 0, beast: 0, garden: 0, spirit: 0 };
  if (S.cave.forge === undefined) S.cave.forge = 0;
  if (S.cave.beast === undefined) S.cave.beast = 0;
  if (S.cave.alchemy === undefined) S.cave.alchemy = 0;
  if (S.cave.garden === undefined) S.cave.garden = 0;
  if (S.cave.spirit === undefined) S.cave.spirit = 0;
  if (!S.flags.auction) S.flags.auction = { refreshDay: 0, stock: [], bought: {} };
  if (!S.flags.compRecord) S.flags.compRecord = {};
  if (S.flags.competition === undefined) S.flags.competition = null;
  if (S.flags.competitionBattle === undefined) S.flags.competitionBattle = false;

  /* 榜单 */
  if (!S.flags.dailyChallenge) S.flags.dailyChallenge = 0;
  if (!S.flags.activeTasks) S.flags.activeTasks = [];
  if (!S.flags.listenedThisWeek) S.flags.listenedThisWeek = "";

  if (S.poison === undefined) S.poison = 0;
  if (!S.flags.fastingDays) S.flags.fastingDays = 0;
  if (!S.flags.reduceEncounter) S.flags.reduceEncounter = 0;
  if (!S.flags.knownRecipes) S.flags.knownRecipes = {};
  if (!S.flags.knownForgeRecipes) S.flags.knownForgeRecipes = {};
}

/* ============================================================
   存档版本检查
   ============================================================ */
function isSaveTooOld(saved) {
  if (!saved || typeof saved !== "object") return true;
  return !saved.heartArts;
}
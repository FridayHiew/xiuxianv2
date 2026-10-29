/* ============================================================
   systems/character.js - 角色创建 / 入门
   ============================================================ */

const RANDOM_DAO_NAMES = [
  "云逸", "长生", "青虚", "太玄", "问道", "灵素", "若尘", "凌霄",
  "玄玑", "紫阳", "墨渊", "玉衡", "沧澜", "天枢", "玄真", "清微",
  "丹青", "素心", "南华", "守拙", "无极", "知秋", "扶摇", "飞鸿"
];

function randomizeName() {
  const input = document.getElementById("nameInput");
  if (!input) return;
  const picked = RANDOM_DAO_NAMES[Math.floor(Math.random() * RANDOM_DAO_NAMES.length)];
  input.value = picked;
}

function createCharacter() {
  const name = (document.getElementById("nameInput").value || "无名").slice(0, 8);
  const gender = document.getElementById("genderInput").value;
  const month = parseInt(document.getElementById("monthInput").value) || 1;
  const day = parseInt(document.getElementById("dayInput").value) || 1;

  if (window.xianxiaAudio && !window.xianxiaAudio.isPlaying) {
    window.xianxiaAudio.play();
  }

  const ie = ((month + day) % 2 === 0) ? "E" : "I";
  const luck = rndInt(0, 9);
  const skillTalent = SKILL_TALENTS[(month + day) % SKILL_TALENTS.length];

  const morality = rndInt(45, 60);

  const aptSeed = (month * 31 + day * 7 + luck) % 100;
  let apt;
  if (aptSeed < 40) apt = APTITUDES[0];
  else if (aptSeed < 70) apt = APTITUDES[1];
  else if (aptSeed < 88) apt = APTITUDES[2];
  else if (aptSeed < 97) apt = APTITUDES[3];
  else apt = APTITUDES[4];

  const hobbyCount = rndInt(1, 2);
  const shuffledHobbies = [...ALL_HOBBIES].sort(() => Math.random() - 0.5);
  const hobbies = shuffledHobbies.slice(0, hobbyCount);

  S = {
    name, gender, ie,
    birthday: { month, day },
    roots: genRoots(),
    sect: null,
    peak: null,
    master: null,
    aptitude: apt.id,
    realm: 0, sub: 0, exp: 0,
    hp: 60, hpMax: 60,
    mp: 0, mpMax: 0,
    atk: 5, def: 3, speed: 10,
    luck,
    morality,
    skillTalent,

    heartArts: {
      current: null,
      learned: [],
      progress: {},
    },

    elementLvl: { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0, lei: 0, bing: 0 },
    dao: 0,

    spells: {
      learned: [],
    },
    combatSkills: {
      learned: ["summon_beast"],
    },

    statuses: [],
    resistances: {
      poison: 0, burn: 0, bleed: 0,
      stun: 0, freeze: 0, silence: 0, atkDown: 0,
    },

    skills: SKILLS.reduce((o, k) => { o[k] = { lvl: 0, exp: 0 }; return o; }, {}),
    choreSkill: {},
    hobbies,
    hobbySkill: hobbies.reduce((o, h) => { o[h] = 0; return o; }, {}),
    mood: 0,
    life: 12, lifeMax: rnd(12.5, 80),
    day: 1, hour: 0, actionsUsed: 0,
    weekday: 3,
    money: 300,
    stone: 0,
    contrib: 0,

    inventory: {},
    equipped: {
      head: null, rightHand: null, leftHand: null, body: null, shoes: null,
      accessory1: null, accessory2: null,
      artifact1: null, artifact2: null, artifact3: null,
      pet: null, mount: null, heavenDefying: null,
    },
    tools: {},

    arts: [], arts2: [],
    learnedArts: {},
    npcs: [], npcMap: {},
    metNpcs: {},
    lovers: [],

    pets: {
      list: [],
      nextUid: 1,
    },

    /* 逆天宝物 */
    heavenDefying: {
      owned: {},
      stages: {},
      killStacks: 0,
      reviveCooldown: 0,
      liquid: 0,
    },

    flags: {
      rank: "杂务",
      rootRevealed: false,
      sectJoined: false,
      hungerStreak: 0,
      breakAttemptedToday: false,
      lastPayDay: 0,
      npcDailyInteraction: {},
      npcDailyGift: {},
      npcDailyDay: 1,
      introDone: false,
      festivalYear: {},
      story: {
        year1000: {},
        year1001: {},
        year1002: {},
        year1003: {},
        year1004: {},
      },
      secretRealm: { opened: false, completed: false, gotOrb: false },
      lastSundayDay: 0,
      lastStoryStage: "1000",
    },
    dailyQuest: null,
    lastTime: Date.now(),
    cave: { level: 0, alchemy: 0, forge: 0, beast: 0, garden: 0, spirit: 0 },
    meditateCount: 1,
  };

  S.stone = 0; /* ★ 开局无灵石 */
  S.inventory["e_armor1"] = 1;
  S.equipped.body = "e_armor1";
  if (!S.skills) S.skills = {};
  if (!S.flags) S.flags = {};
  S.flags.knownRecipes = {};
  S.flags.knownForgeRecipes = {};

  document.getElementById("creationPanel").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  const dateInfo = getDateInfo();
  const lunarMonths = (typeof LUNAR_MONTHS !== "undefined" && Array.isArray(LUNAR_MONTHS))
    ? LUNAR_MONTHS
    : ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
  log(`【${name}】，${gender}，生于${lunarMonths[month-1]}${day}日。`, "c-gold");
  log(`当前：逍遥 ${dateInfo.year} 年 · ${dateInfo.monthName}${dateInfo.day}日`, "c-blue");
  log(`本心：${moralityLabel(morality)}（${morality}）`, "c-blue");
  log(`爱好：${hobbies.join("、")}`, "c-purple");
  log("你身怀先祖秘宝【太渊道玉】，来到了修仙界山门前……", "c-dim");

  save();
  render();

  setTimeout(() => showOpeningPlot(), 400);
}

function showOpeningPlot() {
  const body = `
    <p>数日前，雷雨交加，你所在的云渊古族惨遭九幽魔宗屠戮，血火冲天。</p>
    <p>危难之际，先祖将一枚温润却布满禁制的古朴青玉——<b>【太渊道玉】</b>塞入你怀中，拼死为你撕开一道遁天灵符。</p>
    <p>逃至这片仙山脚下，灵气氤氲，瑞彩千条。各大仙门正值三年一度的开山大典，无数凡胎少年在此寻访长生之机。</p>
    <p class="small" style="color:var(--text-gold);">（道玉微鸣，似乎与这片仙山地脉有着千丝万缕的宿命渊源……）</p>
  `;
  showModal("开篇序章 · 云渊血誓", body, [
    { label: "怀玉求仙 · 前往山门测灵殿", primary: true, fn: () => { closeModal(); assignSect(); } }
  ]);
}

function assignSect() {
  const sectId = pick(SECTS).id;
  const sect = SECTS.find(s => s.id === sectId);
  const body = `
    <p>测灵石碑散发九彩玄光，外门值守仙师抚须颔首：</p>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <b style="color:var(--text-gold); font-size:15px;">🏔️ ${sect.name}（${sect.camp}）</b>
        <div>
          <span class="tag gold">${sect.specialty}</span>
          <span class="tag">Lv.${sect.level}</span>
        </div>
      </div>
      <div class="small" style="color:#d4c4b0; margin-bottom:4px;">特色：<b>${sect.specialty}（皆修通灵御兽）</b>　镇派心法：<b>${sect.art}</b></div>
      <div class="small" style="color:var(--text-dim); line-height:1.5;">${sect.desc}</div>
    </div>
    <p class="small">天命已定，你将拜入【${sect.name}】成为一名杂务弟子，踏上凡胎争渡长生路！</p>
  `;

  showModal("天道机缘 · 随机拜入宗门", body, [
    { label: `遵循天命 · 拜入【${sect.name}】`, fn: () => { closeModal(); joinSect(sectId); } },
    { label: "逆天改运 · 重新随机", fn: () => { closeModal(); assignSect(); } },
  ]);
}

function joinSect(sectId) {
  const sect = SECTS.find(s => s.id === sectId);
  S.sect = sectId;
  S.flags.sectJoined = true;
  S.flags.rank = "杂务";

  const sectArt = HEART_ARTS.find(a => a.sect === sectId);
  S.arts2.push(sectArt ? sectArt.id : sect.art);

  S.flags.lastPayDay = S.day;

  /* ★ 授予宗门代代相传之先祖青史录（在背包「特别」分类始终置顶） */
  if (typeof giveSectChronicleItem === "function") {
    giveSectChronicleItem();
  }

  closeModal();
  log(`【拜入门派】你怀揣【太渊道玉】，正式成为【${sect.name}】的一名外门杂务弟子。`, "c-gold");

  initNPCs();
  setTimeout(() => introRitual(), 400);
}

function introRitual() {
  const sect = SECTS.find(s => s.id === S.sect);
  const zhishi = S.npcs.find(n => n.role === "执事" && n.alive);
  if (zhishi) S.metNpcs[zhishi.id] = true;

  const candidates = S.npcs.filter(n => n.alive && n.tier === "杂务" && n.id !== (zhishi && zhishi.id));
  const sameTime = candidates.slice(0, 3);
  sameTime.forEach(n => { S.metNpcs[n.id] = true; });

  /* 给开局心法 + 召唤技能 */
  giveStartingArt();
  giveStartingSummonSkill();
  const startArt = getCurrentArt();

  const body = `
    <p>外门执事<b>严老</b>上下打量了你一眼，扔给你一套【${sect.name}】青色粗布弟子服与一本泛黄秘册：</p>
    <p class="small">「别以为进了${sect.name}就能一步登天！外门从杂务做起，这是《${startArt.name}》上卷，先把心法熟练度打坐练满，再谈引气入体！」</p>
    <p>「此外，这是本门代代相传的<b>《宗门先祖青史策》</b>（已收纳于随身【道具 > 特别】置顶）。上面记载了历代先贤前驱的道号、在世年份、身前修为造诣与道陨因果，后辈弟子当以史为鉴！」</p>
    <p>「山野妖兽环伺，老夫依例传你一套<b>【拳脚功夫】</b>与一套<b>【武器招式】</b>防身，免得外出采药丢了性命！」</p>
    <p>此时，内门师姐<b>陆雪涵</b>恰好经过院门，温婉一笑，低声叮嘱你：</p>
    <p class="small" style="color:var(--text-gold);">「小师弟，你怀中之物灵韵非凡，切莫在外门魁首<b>墨无痕</b>面前显露。闲暇时可随时在【主线道途】查看你的仙途指引。」</p>
    <hr style="border-color:#2a2216;margin:8px 0;">
    <p class="small">与你同日入门的杂务同门：</p>
    <div style="margin-top:6px;">
      ${sameTime.map(n => `<span class="tag ${n.gender === "女" ? "pink" : "blue"}">${n.name}（${n.role}）</span>`).join(" ")}
    </div>
  `;
  showModal("入门仪式 · 杂务弟子", body, [
    { label: "承蒙指点 · 随严老修习基本功", primary: true, fn: () => {
        closeModal();
        chooseIntroUnarmed(sameTime, startArt);
      } }
  ]);
}

let _introSelectionCtx = { sameTime: [], startArt: null, unarmedName: "" };

function chooseIntroUnarmed(sameTime, startArt) {
  _introSelectionCtx = { sameTime: sameTime || [], startArt: startArt || null, unarmedName: "" };
  showModal("杂务执事传授 · 挑选入门拳脚功夫", `
    <p>严老负手踱步，沉声说道：</p>
    <p>「凡胎入道，筋骨皮肉乃修行之基。传功殿只传上乘心法与法术，这入门基本功便由老夫在此传授于你。你想学哪一门拳脚护身？」</p>
    <p class="small" style="color:var(--text-gold); margin-bottom:6px;">（直接点击下方任意一项即可拜受修习）</p>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroUnarmed('拳', '猛虎伏山拳', 'sk_fist1')">
      <div><b>👊 猛虎伏山拳</b>：专注刚猛拳劲，拳法 Lv.1，领悟招式【直拳】（消耗血气，单体攻伐）。</div>
    </button>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroUnarmed('掌', '落花穿云掌', 'sk_palm1')">
      <div><b>✋ 落花穿云掌</b>：气纳丹田以柔克刚，掌法 Lv.1，领悟招式【推掌】（消耗血气，单体柔击）。</div>
    </button>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroUnarmed('拳', '连环旋风腿', 'sk_leg1')">
      <div><b>🦵 连环旋风腿</b>：腿随心走步疾风劲，拳法 Lv.1，领悟招式【连环旋风腿】（群体横扫踢击，消耗少量气血）。</div>
    </button>
  `, []);
}

function learnIntroUnarmed(skillKey, artName, combatSkillId, sameTime, startArt) {
  closeModal();
  const resolvedSameTime = sameTime !== undefined ? sameTime : (_introSelectionCtx && _introSelectionCtx.sameTime);
  const resolvedStartArt = startArt !== undefined ? startArt : (_introSelectionCtx && _introSelectionCtx.startArt);

  if (!S.skills) S.skills = SKILLS.reduce((o, k) => { o[k] = { lvl: 0, exp: 0 }; return o; }, {});
  if (!S.skills[skillKey]) S.skills[skillKey] = { lvl: 0, exp: 0 };
  S.skills[skillKey].lvl = Math.max(1, S.skills[skillKey].lvl);

  /* 移除其他未选的入门拳脚，仅保留所选拳脚功法 */
  const starterUnarmedIds = ["sk_fist1", "sk_palm1", "sk_leg1"];
  if (!S.combatSkills) S.combatSkills = { learned: [] };
  S.combatSkills.learned = S.combatSkills.learned.filter(id => !starterUnarmedIds.includes(id));
  S.combatSkills.learned.push(combatSkillId);

  if (!S.learnedArts) S.learnedArts = {};
  starterUnarmedIds.forEach(id => { delete S.learnedArts[id]; });
  S.learnedArts[combatSkillId] = true;

  if (!S.flags) S.flags = {};
  S.flags.introUnarmedArt = { name: artName, skillId: combatSkillId, skillKey };

  log(`【执事传功】杂务执事严老向你耐心传授了《${artName}》，你的【${skillKey}法】达到 Lv.1，领悟了防身招式！`, "c-gold");
  setTimeout(() => chooseIntroWeapon(resolvedSameTime, resolvedStartArt, artName), 250);
}

function chooseIntroWeapon(sameTime, startArt, unarmedName) {
  _introSelectionCtx = {
    sameTime: sameTime !== undefined ? sameTime : (_introSelectionCtx && _introSelectionCtx.sameTime),
    startArt: startArt !== undefined ? startArt : (_introSelectionCtx && _introSelectionCtx.startArt),
    unarmedName: unarmedName || (_introSelectionCtx && _introSelectionCtx.unarmedName) || "入门拳脚",
  };
  showModal("杂务执事传授 · 挑选随身兵刃武器", `
    <p>严老抚须点头：「好一门《${_introSelectionCtx.unarmedName}》！徒手既定，兵刃乃手足之延展。兵器房中尚有宗门发配的三样随身家伙，挑一件趁手兵刃与招式吧！」</p>
    <p class="small" style="color:var(--text-gold); margin-bottom:6px;">（直接点击下方任意一项即可拜受修习）</p>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroWeapon('剑', '青锋剑法', 'sk_sword1', 'e_sword1')">
      <div><b>🗡️ 青锋剑法</b>：剑法 Lv.1，领悟招式【基础剑招】，获赠并装备【青锋剑】（攻+5）。</div>
    </button>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroWeapon('刀', '开山刀法', 'sk_blade1', 'e_blade1')">
      <div><b>🔪 开山刀法</b>：刀法 Lv.1，领悟招式【劈砍】，获赠并装备【精铁刀】（攻+5）。</div>
    </button>
    <button type="button" class="block" style="text-align:left; justify-content:flex-start; padding:10px 12px; margin:8px 0; border:1px solid var(--border-gold); height:auto; line-height:1.5;" onclick="learnIntroWeapon('棍', '齐眉棍法', 'sk_staff1', 'e_staff1')">
      <div><b>🥢 齐眉棍法</b>：棍法 Lv.1，领悟招式【横扫】（群攻横扫），获赠并装备【熟铜棍】（攻+5）。</div>
    </button>
  `, []);
}

function learnIntroWeapon(skillKey, weaponArtName, combatSkillId, weaponItemId, sameTime, startArt, unarmedName) {
  closeModal();
  const resolvedSameTime = sameTime !== undefined ? sameTime : (_introSelectionCtx && _introSelectionCtx.sameTime);

  if (!S.skills) S.skills = SKILLS.reduce((o, k) => { o[k] = { lvl: 0, exp: 0 }; return o; }, {});
  if (!S.skills[skillKey]) S.skills[skillKey] = { lvl: 0, exp: 0 };
  S.skills[skillKey].lvl = Math.max(1, S.skills[skillKey].lvl);

  /* 移除其他未选的入门兵刃招式，仅保留所选兵刃招式 */
  const starterWeaponIds = ["sk_sword1", "sk_blade1", "sk_staff1", "sk_whip1"];
  if (!S.combatSkills) S.combatSkills = { learned: [] };
  S.combatSkills.learned = S.combatSkills.learned.filter(id => !starterWeaponIds.includes(id));
  S.combatSkills.learned.push(combatSkillId);

  if (!S.learnedArts) S.learnedArts = {};
  starterWeaponIds.forEach(id => { delete S.learnedArts[id]; });
  S.learnedArts[combatSkillId] = true;

  if (!S.flags) S.flags = {};
  S.flags.introWeaponArt = { name: weaponArtName, skillId: combatSkillId, skillKey, weaponItemId };

  /* 赠送并装备武器 */
  addItem(weaponItemId, 1);
  if (!S.equipped) S.equipped = {};
  S.equipped.rightHand = weaponItemId;

  const weaponObj = ITEMS[weaponItemId] || { name: "兵器" };
  log(`【执事传功】严老向你演练传授了《${weaponArtName}》，并赠予随身兵刃【${weaponObj.name}】，你的【${skillKey}法】达到 Lv.1！`, "c-gold");

  S.flags.introDone = true;
  const sect = SECTS.find(s => s.id === S.sect);
  log(`【入门礼毕】你穿上${sect.name}弟子服，修得拳脚与随身兵刃，主线【第一章：云渊遗孤 · 凡胎问道】正式开启！`, "c-gold");
  if (resolvedSameTime && resolvedSameTime.length > 0) {
    log(`【同期】你结识了 ${resolvedSameTime.map(n => n.name).join("、")}。`, "c-blue");
  }
  save(); render();
  /* 引导新手弟子巡礼各大殿宇 */
  setTimeout(() => startBeginnerGuide(0), 400);
}

/* ============================================================
   新手指南系统 (Beginner Guide · 师姐引渡巡礼六大仙境)
   ============================================================ */

function startBeginnerGuide(step = 0) {
  const guideSteps = [
    {
      title: "仙门引渡 · 陆雪涵师姐指引",
      tab: "day",
      body: `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <div style="font-size:32px;">👩‍🌾</div>
          <div>
            <b style="color:var(--text-gold); font-size:15px;">陆雪涵师姐</b>
            <div class="small" style="color:var(--text-dim);">内门温婉师姐 · 前来引渡初入门庭的你</div>
          </div>
        </div>
        <p>「小师弟，恭喜你正式拜入仙门！凡俗初临修真界，对山中诸峰恐多有陌生。且由师姐带你游览各处殿宇，知悉日常修道规矩。」</p>
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第一处：【日常】长卷</b>
          <p class="small" style="margin-top:4px;">· 每日分为上午、下午与夜晚，各有<b>3 次行动</b>机会。<br>
          · 晨起可做执事堂差事、演武场对练，夜深可回房安歇迎朝阳。<br>
          <span style="color:#f2cf7e; font-weight:bold;">✨ 特别叮嘱（周末规矩）：</span><br>
          宗门体恤门人，<b>周末（周六、周日）全天休沐，不应该有繁重杂务</b>！届时【宗门传功】将取代今日任务，长老于传功堂开坛讲道，听讲可获巨额修为与心法感悟！</p>
        </div>
      `,
      btn: "跟随师姐 · 前往【宗门】殿宇 ▶"
    },
    {
      title: "仙门引渡 · 宗门诸殿与坊市",
      tab: "sect",
      body: `
        <p>师姐领你御风来到主峰之上，俯瞰万丈云海：</p>
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第二处：【宗门】万象殿宇</b>
          <p class="small" style="margin-top:4px;">
          · <b>宗门大殿</b>：查看门规与晋升考核（杂务 ➔ 门外 ➔ 门内 ➔ 真传）。<br>
          · <b>传功殿</b>：兑换高深心法典籍。<br>
          · <b>修真坊市</b>：在杂役铺与百宝楼购买丹药符箓、法宝兵刃，亦可向宗门缴纳贡品赚取灵石。
          </p>
        </div>
      `,
      btn: "跟随师姐 · 参观【洞府】清池 ▶"
    },
    {
      title: "仙门引渡 · 灵山洞府与练气时日",
      tab: "cave",
      body: `
        <p>山腰青竹掩映处，一间静谧洞府散发幽幽灵光：</p>
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第三处：【洞府】清池静室</b>
          <p class="small" style="margin-top:4px;">
          · <b>蒲团吐纳</b>：在洞府中央打坐吐纳运转周天，是修为与心法突破的核心。<br>
          · <b>百草药园</b>：可挑选种子种植灵草，<b>灵园神异，一日抵凡俗一年</b>，年份越久灵药品质越高！<br>
          · <b>灵兽仙苑</b>：照料伴生白狐与随身灵宠，记得每日以【饲灵丸】喂食，切莫使其饥饿饿死。<br>
          · <b>天机造化</b>：温养先天至宝【太渊道玉】，蕴养通天逆天威能。
          </p>
        </div>
        <div class="card" style="border:1px solid #7c6237; margin:8px 0; background:rgba(44,30,16,0.5);">
          <b style="color:#f2cf7e;">⏳ 师姐修行心得：一般人需要多久才能练气成功？</b>
          <p class="small" style="color:#e0d0b8; margin-top:4px; line-height:1.5;">
          「小师弟莫要心急，凡胎入道最忌揠苗助长。寻常凡人资质平平，通常需在洞府静室<b>吐纳潜修三至五个月（百余日周天运转）</b>方能感应天地灵气、洗髓引气入体；<br>
          若是天生灵根超群、道骨清奇，再辅以聚气灵丹与灵石相助，<b>一两个月（数十日）</b>亦能破关练气成功！」
          </p>
        </div>
      `,
      btn: "跟随师姐 · 眺望九州【历练】山河 ▶"
    },
    {
      title: "仙门引渡 · 九州历练与山门禁令",
      tab: "adventureMap",
      body: `
        <p>师姐指向远处浩瀚苍茫的九州山河万里画卷：</p>
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第四处：【历练】山河长卷</b>
          <p class="small" style="margin-top:4px;">
          · 九州险地林立，自迷雾森林至天渊道窟，步步机缘亦步步凶险！<br>
          <span style="color:#f2cf7e; font-weight:bold;">🔒 山门戒律：</span><br>
          「山外妖魔凶厉，杂务弟子根骨尚未成型，<b>宗门严格规定：唯有晋升【门外弟子】之后方准下山历练</b>！在此之前历练入口将处于封闭戒备状态，小师弟且先在门中好生苦修。」
          </p>
        </div>
      `,
      btn: "跟随师姐 · 结交天下【道友】 ▶"
    },
    {
      title: "仙门引渡 · 寻访天下【道友】",
      tab: "social",
      body: `
        <p>师姐笑靥如花，为你引荐门中同道：</p>
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第五处：【道友】同道仙缘</b>
          <p class="small" style="margin-top:4px;">
          修仙非独行孤舟。与同门道友坐而论道、赠送仙礼，可突破深厚羁绊：<br>
          · <b>Lv.1 萍水相逢 / Lv.2 泛泛之交</b>：日常温言寒暄与奇闻异象。<br>
          · <b>Lv.3 志同道合</b>：可相互<b>切磋对战</b>，检验兵刃道法！<br>
          · <b>Lv.4 莫逆之交</b>：可<b>邀请一同下山历练</b>（有几率应允或婉拒）。<br>
          · <b>Lv.5 生死与共</b>：可<b>结拜为金兰挚友</b>，清晨偶有飞剑传书送来贴心回赠礼物！<br>
          · <b>Lv.6 金兰道侣</b>：可缔结生死契约<b>双修共进</b>，且邀请历练<b>必然答应</b>！
          </p>
        </div>
      `,
      btn: "跟随师姐 · 梳理行囊与主线道途 ▶"
    },
    {
      title: "仙门引渡 · 行囊、主线与修仙启程",
      tab: "bag",
      body: `
        <div class="card" style="border:1px solid var(--border-gold); margin:8px 0; background:rgba(0,0,0,0.3);">
          <b style="color:#85d68d;">📍 第六处：【行囊】法宝与【主线道途】</b>
          <p class="small" style="margin-top:4px;">
          · <b>行囊</b>：随时吞服灵丹治愈疗伤、佩戴高阶法器神兵、参悟心法残卷秘籍。<br>
          · <b>主线道途</b>：探寻你怀中【太渊道玉】的惊天大秘，完成各章仙途目标可得巨额赏赐！<br>
          · <b>每日任务</b>：日常完成打坐、照料药园、拜会道友，即可收获灵石与修行宝箱！
          </p>
        </div>
        <p style="color:var(--text-gold); font-size:13px; margin-top:8px;">「好啦小师弟，仙途漫漫，道阻且长。去开启你的第一天仙修人生吧！」</p>
      `,
      btn: "拜别师姐 · 正式开启仙途"
    }
  ];

  if (step >= guideSteps.length) {
    closeModal();
    S.flags.guideCompleted = true;
    switchTab("day");
    save();
    render();
    setTimeout(() => morningPrompt(), 300);
    return;
  }

  const cur = guideSteps[step];
  if (cur.tab) {
    switchTab(cur.tab);
  }

  showModal(cur.title, cur.body, [
    {
      label: cur.btn,
      primary: true,
      fn: () => {
        closeModal();
        startBeginnerGuide(step + 1);
      }
    },
    ...(step > 0 ? [{
      label: "跳过向导",
      fn: () => {
        closeModal();
        S.flags.guideCompleted = true;
        switchTab("day");
        save();
        render();
        setTimeout(() => morningPrompt(), 300);
      }
    }] : [])
  ]);
}



function giveStartingSummonSkill() {
  const skill = getSectSummonSkill(S.sect) || { id: "summon_beast" };
  if (!S.combatSkills) S.combatSkills = { learned: [] };
  if (!S.combatSkills.learned.includes(skill.id)) {
    S.combatSkills.learned.push(skill.id);
  }
  if (!S.combatSkills.learned.includes("summon_beast")) {
    S.combatSkills.learned.push("summon_beast");
  }

  /* 通灵御兽道统：入门赠予一只白狐灵兽 */
  if (!S.pets) S.pets = { list: [], nextUid: 1 };
  if (!S.pets.list) S.pets.list = [];
  if (S.pets.list.length === 0 && typeof genPet === "function") {
    const startPet = genPet("e_white_fox", "伴生白狐");
    startPet.talent = "zhong";
    startPet.bloodline = "bing";
    S.pets.list.push(startPet);
  }
  if (!S.equipped) S.equipped = {};
  if (!S.equipped.pet && S.pets.list.length > 0) {
    S.equipped.pet = S.pets.list[0].uid;
  }
  log(`【伴生灵兽】宗门引渡，你收纳并装备了通灵伴生兽与召唤术！`, "c-gold");
}

/* 开局赠送基础心法 */
function giveStartingArt() {
  const artId = "lianqi_basic";
  const art = HEART_ARTS.find(a => a.id === artId);

  S.heartArts.learned.push(artId);
  S.heartArts.current = artId;
  S.heartArts.progress[artId] = {
    lvl: 0,
    exp: 0,
    proficiency: 0,
    maxLearn: 3,
  };

  updateElementLvl();
}
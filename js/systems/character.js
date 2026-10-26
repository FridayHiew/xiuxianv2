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
    roots: null,
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
      learned: [],
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
    cave: { level: 0, alchemy: 0, garden: 0, spirit: 0 },
    meditateCount: 1,
  };

  S.stone = 10; 
  S.inventory["e_armor1"] = 1;

  document.getElementById("creationPanel").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  const dateInfo = getDateInfo();
  log(`【${name}】，${gender}，生于${LUNAR_MONTHS[month-1]}${day}日。`, "c-gold");
  log(`当前：逍遥 ${dateInfo.year} 年 · ${dateInfo.monthName}${dateInfo.day}日`, "c-blue");
  log(`本心：${moralityLabel(morality)}（${morality}）`, "c-blue");
  log(`爱好：${hobbies.join("、")}`, "c-purple");

  updateProfileIcon();
  setTimeout(() => introStory(), 300);
}

function introStory() {
  showModal("序章 · 云渊遗孤与太渊道玉", `
    <p>三日前，雷雨如注，黑衣魔修夜袭云渊古族，满谷火光冲天。</p>
    <p>危急关头，族中长辈将一枚温润古朴的青色玉佩——<b>【太渊道玉】</b>塞入你怀中，推你入后山暗道逃生。</p>
    <p>你在山林中昏迷醒来，正逢一位仙门高人御风路过。他感应到你胸前道玉牵动的先天灵气，眸光微震：</p>
    <p style="color:var(--text-gold);">「奇哉！你虽是凡胎之躯，体内却已被古玉引动灵根。小家伙，可愿随老夫踏入仙门？」</p>
  `, [{ label: "叩拜随行", fn: () => { closeModal(); revealRoot(); } }]);
}

function revealRoot() {
  S.roots = genRoots();
  S.flags.rootRevealed = true;
  log(`【灵根觉醒】太渊道玉微鸣，测出你身怀修仙灵根！`, "c-gold");

  showModal("灵根感应 · 道玉微鸣", `
    <p>仙门高人取出一枚测灵晶石置于你掌心，你怀中的<b>【太渊道玉】</b>一热，晶石顿时泛起耀眼灵光。</p>
    <p>「果真是身具灵根的修真苗子！只是此地测灵石品阶有限，尚难窥清你灵根深浅。」</p>
    <p class="small">（凡尘测灵石仅能验出灵根有无，拜入宗门潜修后方能逐步显化真威。）</p>
  `, [{ label: "天道机缘 · 随机拜入宗门", fn: () => { closeModal(); assignSect(); } }]);
}

// 开局随机分配宗门
function assignSect() {
  const sect = pick(SECTS);
  confirmSect(sect.id);
}

function confirmSect(sectId) {
  const sect = SECTS.find(s => s.id === sectId);
  if (!sect) return;

  const campClass = sect.camp === "正道" ? "good" : sect.camp === "邪道" ? "bad" : "gold";

  const body = `
    <p>天机莫测，道法自然。高人引动你怀中的<b>【太渊道玉】</b>向浩瀚天地占算机缘，青玉华光一闪，冥冥中指引了你此生的宿命道统：</p>
    <div class="card" style="margin:10px 0; border:1.5px solid var(--border-gold); background:linear-gradient(135deg,#24180c,#140d06); padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <b style="font-size:16px; color:var(--text-gold);">${sect.name}</b>
        <div>
          <span class="tag ${campClass}">${sect.camp}</span>
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
    <p>「此外，山野妖兽环伺。老夫身为杂务执事，依例传你一套<b>【拳脚功夫】</b>与一套<b>【武器招式】</b>防身，免得外出采药丢了性命！」</p>
    <p>此时，内门师姐<b>陆雪涵</b>恰好经过院门，温婉一笑，低声叮嘱你：</p>
    <p class="small" style="color:var(--text-gold);">「小师弟，你怀中之物灵韵非凡，切莫在外门魁首<b>墨无痕</b>面前显露。闲暇时可随时在【主线剧情】查看你的仙途指引。」</p>
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

function chooseIntroUnarmed(sameTime, startArt) {
  const sect = SECTS.find(s => s.id === S.sect);
  showModal("杂务执事传授 · 挑选入门拳脚功夫", `
    <p>严老负手踱步，沉声说道：</p>
    <p>「凡胎入道，筋骨皮肉乃修行之基。传功殿只传上乘心法与法术，这入门基本功便由老夫在此传授于你。你想学哪一门拳脚护身？」</p>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>👊 猛虎伏山拳</b>：专注刚猛拳劲，拳法 Lv.1，领悟招式【直拳】（消耗血气，单体攻伐）。</div>
    </div>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>✋ 落花穿云掌</b>：气纳丹田以柔克刚，掌法 Lv.1，领悟招式【推掌】（消耗血气，单体柔击）。</div>
    </div>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>🦵 连环旋风腿</b>：腿随心走步疾风劲，拳法 Lv.1，领悟招式【直拳】（归入拳脚路数）。</div>
    </div>
  `, [
    { label: "研习【猛虎伏山拳】", fn: () => learnIntroUnarmed("拳", "猛虎伏山拳", "sk_fist1", sameTime, startArt) },
    { label: "研习【落花穿云掌】", fn: () => learnIntroUnarmed("掌", "落花穿云掌", "sk_palm1", sameTime, startArt) },
    { label: "研习【连环旋风腿】", fn: () => learnIntroUnarmed("拳", "连环旋风腿", "sk_fist1", sameTime, startArt) },
  ]);
}

function learnIntroUnarmed(skillKey, artName, combatSkillId, sameTime, startArt) {
  closeModal();
  if (!S.skills) S.skills = SKILLS.reduce((o, k) => { o[k] = { lvl: 0, exp: 0 }; return o; }, {});
  if (!S.skills[skillKey]) S.skills[skillKey] = { lvl: 0, exp: 0 };
  S.skills[skillKey].lvl = Math.max(1, S.skills[skillKey].lvl);

  if (!S.combatSkills) S.combatSkills = { learned: [] };
  if (!S.combatSkills.learned.includes(combatSkillId)) {
    S.combatSkills.learned.push(combatSkillId);
  }
  if (!S.learnedArts) S.learnedArts = {};
  S.learnedArts[combatSkillId] = true;

  log(`【执事传功】杂务执事严老向你耐心传授了《${artName}》，你的【${skillKey}法】达到 Lv.1，领悟了防身招式！`, "c-gold");
  setTimeout(() => chooseIntroWeapon(sameTime, startArt, artName), 250);
}

function chooseIntroWeapon(sameTime, startArt, unarmedName) {
  showModal("杂务执事传授 · 挑选随身兵刃武器", `
    <p>严老抚须点头：「好一门《${unarmedName}》！徒手既定，兵刃乃手足之延展。兵器房中尚有宗门发配的四样随身家伙，挑一件趁手兵刃与招式吧！」</p>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>🗡️ 青锋剑法</b>：剑法 Lv.1，领悟招式【基础剑招】，获赠并装备【青锋剑】（攻+5）。</div>
    </div>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>🔪 开山刀法</b>：刀法 Lv.1，领悟招式【劈砍】，获赠并装备【精铁刀】（攻+5）。</div>
    </div>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>🥢 齐眉棍法</b>：棍法 Lv.1，领悟招式【横扫】（群攻横扫），获赠并装备【熟铜棍】（攻+5）。</div>
    </div>
    <div class="card" style="margin:8px 0; border:1px solid var(--border-gold);">
      <div><b>🪢 灵蛇鞭法</b>：鞭法 Lv.1，领悟招式【鞭击】，获赠并装备【软皮鞭】（攻+5）。</div>
    </div>
  `, [
    { label: "修习【青锋剑法】", fn: () => learnIntroWeapon("剑", "青锋剑法", "sk_sword1", "e_sword1", sameTime, startArt, unarmedName) },
    { label: "修习【开山刀法】", fn: () => learnIntroWeapon("刀", "开山刀法", "sk_blade1", "e_blade1", sameTime, startArt, unarmedName) },
    { label: "修习【齐眉棍法】", fn: () => learnIntroWeapon("棍", "齐眉棍法", "sk_staff1", "e_staff1", sameTime, startArt, unarmedName) },
    { label: "修习【灵蛇鞭法】", fn: () => learnIntroWeapon("鞭", "灵蛇鞭法", "sk_whip1", "e_whip1", sameTime, startArt, unarmedName) },
  ]);
}

function learnIntroWeapon(skillKey, weaponArtName, combatSkillId, weaponItemId, sameTime, startArt, unarmedName) {
  closeModal();
  if (!S.skills) S.skills = SKILLS.reduce((o, k) => { o[k] = { lvl: 0, exp: 0 }; return o; }, {});
  if (!S.skills[skillKey]) S.skills[skillKey] = { lvl: 0, exp: 0 };
  S.skills[skillKey].lvl = Math.max(1, S.skills[skillKey].lvl);

  if (!S.combatSkills) S.combatSkills = { learned: [] };
  if (!S.combatSkills.learned.includes(combatSkillId)) {
    S.combatSkills.learned.push(combatSkillId);
  }
  if (!S.learnedArts) S.learnedArts = {};
  S.learnedArts[combatSkillId] = true;

  /* 赠送并装备武器 */
  addItem(weaponItemId, 1);
  if (!S.equipped) S.equipped = {};
  S.equipped.rightHand = weaponItemId;

  const weaponObj = ITEMS[weaponItemId] || { name: "兵器" };
  log(`【执事传功】严老向你演练传授了《${weaponArtName}》，并赠予随身兵刃【${weaponObj.name}】，你的【${skillKey}法】达到 Lv.1！`, "c-gold");

  S.flags.introDone = true;
  const sect = SECTS.find(s => s.id === S.sect);
  log(`【入门礼毕】你穿上${sect.name}弟子服，修得拳脚与随身兵刃，主线【第一章：云渊遗孤 · 凡胎问道】正式开启！`, "c-gold");
  if (sameTime && sameTime.length > 0) {
    log(`【同期】你结识了 ${sameTime.map(n => n.name).join("、")}。`, "c-blue");
  }
  save(); render();
  setTimeout(() => morningPrompt(), 300);
}

function giveStartingSummonSkill() {
  const skill = getSectSummonSkill(S.sect);
  if (skill) {
    if (!S.combatSkills) S.combatSkills = { learned: [] };
    if (!S.combatSkills.learned.includes(skill.id)) {
      S.combatSkills.learned.push(skill.id);
    }
  }

  /* 通灵御兽道统：入门赠予一只白狐灵兽 */
  if (!S.pets) S.pets = { list: [], nextUid: 1 };
  if (!S.pets.list) S.pets.list = [];
  if (S.pets.list.length === 0 && typeof genPet === "function") {
    const startPet = genPet("e_wolf", "伴生白狐");
    startPet.talent = "t_spirit";
    S.pets.list.push(startPet);
    if (!S.equipped) S.equipped = {};
    if (!S.equipped.pet) S.equipped.pet = startPet.uid;
    log(`【伴生灵兽】宗门引渡，你收纳了通灵伴生兽【${startPet.name}】！`, "c-gold");
  }
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
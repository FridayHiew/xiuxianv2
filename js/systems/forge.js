/* ============================================================
   systems/forge.js - 炼器核心逻辑
   ============================================================ */

/* ============================================================
   基础查询
   ============================================================ */

function getForgeCaveLv() {
  return (S.cave && S.cave.forge) || 0;
}

function getForgeSkillLv() {
  return (S.skills && S.skills["炼器"] && S.skills["炼器"].lvl) || 0;
}

function isForgeUnlocked() {
  return getForgeCaveLv() >= 1;
}

/* 炼器谱是否已掌握（开局不掌握任何炼器谱，需在宗门兑换或机缘获取） */
function isForgeRecipeKnown(recipeId) {
  return !!(S && S.flags && S.flags.knownForgeRecipes && S.flags.knownForgeRecipes[recipeId]);
}

/* 获取炼器谱的境界阶位（0=凡人, 1=炼气, 2=筑基, 3=金丹, 4=元婴） */
function getForgeRecipeRealm(recipe) {
  if (!recipe) return 0;
  if (recipe.realm !== undefined) return recipe.realm;
  const g = recipe.grade || 1;
  if (g <= 1) return 0;
  if (g <= 3) return 1;
  if (g <= 5) return 2;
  if (g === 6) return 3;
  return 4;
}

/* 宗门是否允许兑换该炼器谱（严格限制：金丹期 realm <= 3 及以下，且品级 <= 6品） */
function isForgeRecipeExchangeableInSect(recipe) {
  if (!recipe) return false;
  const realm = getForgeRecipeRealm(recipe);
  const grade = recipe.grade || 1;
  return realm <= 3 && grade <= 6;
}

/* 计算炼器谱在宗门兑换所需贡献值 */
function getForgeRecipeExchangePrice(recipe) {
  if (!recipe) return 50;
  if (recipe.price !== undefined && recipe.price > 0) return recipe.price;
  const realm = getForgeRecipeRealm(recipe);
  const grade = recipe.grade || 1;
  const isArtifact = recipe.slot === "artifact" || recipe.slot === "rightHand";
  if (realm === 0) return isArtifact ? 35 : 25;
  if (realm === 1) return (isArtifact ? 80 : 65) + (grade - 2) * 25;
  if (realm === 2) return (isArtifact ? 220 : 180) + (grade - 4) * 50;
  if (realm === 3) return isArtifact ? 480 : 400;
  return 1000;
}

/* ============================================================
   百艺造诣通用查询与经验晋升（炼器 / 炼丹 / 百艺通用）
   ============================================================ */
function getCraftMasteryInfo(skillName) {
  if (!S.skills) S.skills = {};
  if (!S.skills[skillName]) S.skills[skillName] = { lvl: 0, exp: 0 };
  const sk = S.skills[skillName];
  const lvl = sk.lvl || 0;
  const exp = +(sk.exp || 0).toFixed(1);
  const maxExp = typeof SKILL_LVL_EXP !== "undefined" ? SKILL_LVL_EXP : 100;
  const maxLvl = typeof MAX_SKILL_LVL !== "undefined" ? MAX_SKILL_LVL : 10;
  const isMax = lvl >= maxLvl;
  const pct = isMax ? 100 : Math.max(0, Math.min(100, Math.round((exp / maxExp) * 100)));

  let title = "未入门径";
  if (lvl >= 10) title = "通天造化";
  else if (lvl >= 9) title = "一代宗师";
  else if (lvl >= 7) title = "登峰造极";
  else if (lvl >= 5) title = "炉火纯青";
  else if (lvl >= 3) title = "熟能生巧";
  else if (lvl >= 1) title = "初窥门径";

  return { lvl, exp, maxExp, maxLvl, isMax, pct, title };
}

function gainSkillExp(skillName, rawExp) {
  if (!S.skills) S.skills = {};
  if (!S.skills[skillName]) S.skills[skillName] = { lvl: 0, exp: 0 };
  const sk = S.skills[skillName];
  const maxExp = typeof SKILL_LVL_EXP !== "undefined" ? SKILL_LVL_EXP : 100;
  const maxLvl = typeof MAX_SKILL_LVL !== "undefined" ? MAX_SKILL_LVL : 10;

  let inc = rawExp;
  const art = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  if (art && art.bonus) {
    if (art.bonus.skill === skillName) inc *= (1 + art.bonus.bonus);
    else if (art.bonus.all) inc *= (1 + art.bonus.all);
  }
  inc = +inc.toFixed(1);

  const oldLvl = sk.lvl || 0;
  if (oldLvl >= maxLvl) {
    sk.exp = maxExp;
    return { added: 0, leveledUp: false, oldLvl, newLvl: oldLvl, curExp: sk.exp };
  }

  sk.exp = +(sk.exp + inc).toFixed(1);
  let leveledUp = false;
  while (sk.exp >= maxExp && sk.lvl < maxLvl) {
    sk.exp = +(sk.exp - maxExp).toFixed(1);
    sk.lvl++;
    leveledUp = true;
    const info = getCraftMasteryInfo(skillName);
    log(`【造诣突破】你的【${skillName}造诣】精进至 Lv.${sk.lvl}（${info.title}）！`, "c-gold");
  }
  if (sk.lvl >= maxLvl) {
    sk.exp = maxExp;
  }

  return { added: inc, leveledUp, oldLvl, newLvl: sk.lvl, curExp: sk.exp };
}

/* 炼器造诣成功率加成：每级 +1.5%，且 Lv.3/6/9/10 额外里程碑突破 */
function getForgeSkillBonusRate(lvl) {
  const skillLv = lvl !== undefined ? lvl : getForgeSkillLv();
  if (skillLv <= 0) return 0;
  let bonus = skillLv * 0.015;
  if (skillLv >= 10) bonus += 0.08;
  else if (skillLv >= 9) bonus += 0.06;
  else if (skillLv >= 6) bonus += 0.04;
  else if (skillLv >= 3) bonus += 0.02;
  return +bonus.toFixed(3);
}

/* ============================================================
   成功率公式
   ------------------------------------------------------------
   基础成功率（配方） 
   + 炼器房加成：(Lv - 1) × 5%
   + 炼器造诣加成：每级 +1.5% + 阶位突破加成
   + 心情加成
   ============================================================ */

function calcForgeRate(recipe) {
  let rate = recipe.rate || 0.5;

  /* 炼器房 */
  const caveLv = getForgeCaveLv();
  if (caveLv >= 1) {
    rate += (caveLv - 1) * 0.05;
  }

  /* 炼器造诣 */
  rate += getForgeSkillBonusRate();

  /* 聚火丹 buff */
  if (S.flags.forgeBuff && S.flags.forgeBuff.rate) {
    rate += S.flags.forgeBuff.rate;
  }

  /* 心情 */
  if (S.mood >= 1) rate += 0.03;
  else if (S.mood <= -1) rate -= 0.05;

  return Math.max(0.05, Math.min(0.98, rate));
}

/* ============================================================
   品级随机与材料检查
   ------------------------------------------------------------
   炼器产出品级随机（1品~5品，造诣越高高品率越高，参考炼丹 rollPillGrade 逻辑）
   ============================================================ */

function rollForgeGrade() {
  const lv = getForgeSkillLv();
  const boost = lv * 0.015; /* Lv.10 最高提供 +15% 高品偏移 */
  const r = Math.random() + boost;
  if (r < 0.45) return 1;
  if (r < 0.75) return 2;
  if (r < 0.90) return 3;
  if (r < 0.97) return 4;
  return 5;
}

function checkForgeMaterial(recipe) {
  const list = [];
  let allOk = true;
  const recipeRealm = getForgeRecipeRealm(recipe);
  const tier = recipe.tier || (recipeRealm <= 1 ? 1 : recipeRealm) || 1;

  for (const baseId in recipe.mats) {
    const need = recipe.mats[baseId];
    /* 材料品阶按配方阶位决定：1阶装备消耗1阶材料，2阶装备消耗2阶材料 */
    const itemId = baseId + "_" + tier;
    const have = (S.inventory && S.inventory[itemId]) || 0;
    const ok = have >= need;
    if (!ok) allOk = false;
    list.push({ itemId, baseId, tier, need, have, ok });
  }

  /* 灵石检查 */
  const stoneOk = S.stone >= (recipe.spiritStone || 0);

  return { ok: allOk && stoneOk, list, stoneOk };
}

/* ============================================================
   炼器
   ============================================================ */
function doForge(recipeId) {
  if (!isForgeUnlocked()) {
    log("炼器房尚未解锁（需先在洞府设施中升级）。", "c-bad");
    return;
  }

  const recipe = getForgeRecipe(recipeId);
  if (!recipe) { log("配方不存在。", "c-bad"); return; }

  if (!isForgeRecipeKnown(recipeId)) {
    log(`你尚未掌握【${recipe.name}】炼器谱，请先前往宗门【丹方阁】或【装备铺】兑换器谱。`, "c-bad");
    return;
  }

  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }

  /* 材料检查 */
  const check = checkForgeMaterial(recipe);
  if (!check.ok) {
    log("材料或灵石不足，无法炼器。", "c-bad");
    return;
  }

  /* 弹确认 */
  const recipeRealm = getForgeRecipeRealm(recipe);
  const tier = recipe.tier || (recipeRealm <= 1 ? 1 : recipeRealm) || 1;
  const rate = calcForgeRate(recipe);
  const expPreview = 10 + tier * 5;
  showModal(`炼制 · ${recipe.name}`, `
    <p>器胚阶位：<span class="tag gold">${tier} 阶器胚（锻造成器可得 1~5 品）</span></p>
    <p>成器概率：<b style="color:var(--text-gold);">${(rate * 100).toFixed(1)}%</b>（成器可获炼器造诣 +${expPreview}）</p>
    <div class="card">
      ${check.list.map(m => `<div class="row"><span>${m.baseId}_${m.tier}</span><span>${m.need}（有 ${m.have}）</span></div>`).join("")}
      <div class="row"><span>灵石</span><span>${recipe.spiritStone}（有 ${S.stone}）</span></div>
    </div>
    <p class="small">消耗 1 行动。成器时同等材料可能淬炼出 1品~5品 装备（品质受炼器造诣加持）。</p>
  `, [
    { label: "取消", fn: closeModal },
    { label: "开始炼制", primary: true, fn: () => { closeModal(); executeForge(recipe); } },
  ]);
}

function executeForge(recipe) {
  const recipeRealm = getForgeRecipeRealm(recipe);
  const tier = recipe.tier || (recipeRealm <= 1 ? 1 : recipeRealm) || 1;

  /* 扣材料（按阶位） */
  for (const baseId in recipe.mats) {
    const need = recipe.mats[baseId];
    const itemId = baseId + "_" + tier;
    removeItem(itemId, need);
  }
  /* 扣灵石 */
  S.stone -= recipe.spiritStone || 0;

  /* 消耗 1 行动 */
  S.actionsUsed++;

  /* 成功率判定 */
  const rate = calcForgeRate(recipe);
  const success = chance(rate);

  /* 炸炉判定：失败时 3% 概率炸炉 */
  const exploded = !success && chance(0.03);

  const detail = [];
  let forgedEquip = null;

  if (success) {
    /* 随机产出 1品~5品 装备（参考炼丹逻辑） */
    const rolledGrade = rollForgeGrade();
    forgedEquip = generateForgedEquip(recipe, rolledGrade);
    addItem(forgedEquip.id, 1);

    /* 炼器造诣熟练度：按法器阶位与产出品级获得 */
    const rawGain = 10 + tier * 5 + rolledGrade * 2;
    const gainRes = gainSkillExp("炼器", rawGain);

    log(`【炼器成功】你炼出了【${forgedEquip.name}】（${tier}阶·${rolledGrade}品）！炼器造诣经验 +${gainRes.added}。`, "c-gold");
    detail.push(`成器：${forgedEquip.name}`);
    detail.push(`阶品：${tier} 阶 · ${rolledGrade} 品`);
    if (forgedEquip.affixes && forgedEquip.affixes.length > 0) {
      detail.push(`器纹：${forgedEquip.affixes.map(a => a.name).join("、")}`);
    }
    detail.push(`炼器造诣经验 +${gainRes.added}${gainRes.leveledUp ? `（突破至 Lv.${gainRes.newLvl}！）` : `（${gainRes.curExp}/100）`}`);
  } else {
    /* 失败亦有锤炼感悟 */
    const failRawGain = 4 + tier * 2;
    const gainRes = gainSkillExp("炼器", failRawGain);

    if (exploded) {
      const dmg = Math.floor(totalMaxHp() * 0.15);
      S.hp = Math.max(1, S.hp - dmg);
      S.mood = Math.max(-2, S.mood - 1);
      log(`【炼器失败】炸炉！气血 -${dmg}，心情 -1。总结火候得炼器经验 +${gainRes.added}。`, "c-bad");
      detail.push("炼器失败：炸炉！");
      detail.push(`气血 -${dmg}，心情 -1`);
    } else {
      log(`【炼器失败】材料尽毁，未能成器，但复盘锤法获得炼器造诣经验 +${gainRes.added}。`, "c-bad");
      detail.push("炼器失败：材料损毁");
    }
    detail.push(`吃一堑长一智：炼器造诣经验 +${gainRes.added}${gainRes.leveledUp ? `（突破至 Lv.${gainRes.newLvl}！）` : `（${gainRes.curExp}/100）`}`);
  }

  const reachedNight = (S.actionsUsed >= ACTIONS_PER_SLOT && S.hour < 2);
  if (reachedNight) {
    S.hour++;
    S.actionsUsed = 0;
    log(`【时间】进入${HOURS[S.hour]}。`, "c-blue");
  }

  if (typeof window !== "undefined") window._isForgingActive = true;
  save();
  render();

  const rarityTheme = getForgeMaterialRarityTheme(recipe);

  /* 播放 10 秒炼器炉微弱荧光与进度条动画 */
  triggerForgeAnimationModal(recipe, () => {
    if (typeof window !== "undefined") window._isForgingActive = false;
    render();
    if (success && forgedEquip) {
      playForgeSuccessSfx(rarityTheme.rarityLevel);
      triggerForgeSuccessFullscreenFlash(rarityTheme);
      showForgedEquipModal(forgedEquip);
    } else {
      playForgeFailSfx();
      showActionModal("炼器结束", detail);
    }
    if (reachedNight && S.hour === 2) {
      setTimeout(() => { nightPrompt(); }, 500);
    }
  });
}

/* ============================================================
   打铁铸剑台 SVG 图标（替代原本的丹瓶图标）
   ============================================================ */
function renderForgeAnvilSvg() {
  return `
    <svg class="forge-anvil-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="打铁铸剑台">
      <!-- 铁砧底座与台面 -->
      <path d="M14 48H50L45 41H19L14 48Z" fill="#3A352F" stroke="#C9A84C" stroke-width="1.5"/>
      <path d="M18 41H46V35H54C54 31 48 29 43 29H11L6 33L18 36V41Z" fill="#524B42" stroke="#E5C467" stroke-width="1.6"/>
      <!-- 铁砧上赤红发亮的剑胚 -->
      <path d="M16 28.5L44 28.5L49 26.5L44 24.5L16 24.5Z" fill="#FF9E3D" stroke="#FFF2B2" stroke-width="1.2"/>
      <!-- 锤击火花迸射 -->
      <g class="forge-hit-burst">
        <circle cx="31" cy="24" r="2.2" fill="#FFF7C2"/>
        <path d="M31 16L31 21M23 19L27 23M39 19L35 23M22 26L26 25M40 26L36 25" stroke="#7FFFE8" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <!-- 挥动的打铁重锤 -->
      <g class="forge-hammer-group">
        <line x1="46" y1="28" x2="29" y2="13" stroke="#A67C46" stroke-width="3.2" stroke-linecap="round"/>
        <rect x="22" y="8" width="13" height="8" rx="1.8" transform="rotate(-40 22 8)" fill="#6E7885" stroke="#F0D78C" stroke-width="1.5"/>
      </g>
    </svg>
  `;
}

/* ============================================================
   根据炼器材料稀有度计算进度条与荧光主题
   ============================================================ */
function getForgeMaterialRarityTheme(recipe) {
  const mats = (recipe && recipe.mats) || {};
  const matKeys = Object.keys(mats);
  const grade = (recipe && recipe.grade) || 1;

  if (matKeys.includes("天金") || matKeys.includes("天地灵乳") || grade >= 6) {
    return {
      barClass: "rarity-gold",
      label: "仙品天金 · 绝世神材",
      rarityLevel: 4,
    };
  }
  if (matKeys.includes("秘银") || matKeys.includes("火精枣") || matKeys.includes("寒血果") || grade >= 4) {
    return {
      barClass: "rarity-purple",
      label: "上品秘银 · 罕见灵材",
      rarityLevel: 3,
    };
  }
  if (matKeys.includes("寒铁") || matKeys.includes("赤铜") || matKeys.includes("妖兽精血") || grade >= 2) {
    return {
      barClass: "rarity-blue",
      label: "精炼寒铁 · 凝气良材",
      rarityLevel: 2,
    };
  }
  return {
    barClass: "rarity-green",
    label: "百炼玄铁 · 基础凡材",
    rarityLevel: 1,
  };
}

/* ============================================================
   炼器打铁与成器音效合成 (Web Audio API)
   ============================================================ */
function getForgeAudioCtx() {
  try {
    if (typeof window === "undefined") return null;
    if (window.xianxiaAudio && window.xianxiaAudio.ctx) {
      if (window.xianxiaAudio.ctx.state === "suspended") {
        window.xianxiaAudio.ctx.resume().catch(() => {});
      }
      return window.xianxiaAudio.ctx;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!window._forgeAudioCtx) {
      window._forgeAudioCtx = new AudioCtx();
    }
    if (window._forgeAudioCtx.state === "suspended") {
      window._forgeAudioCtx.resume().catch(() => {});
    }
    return window._forgeAudioCtx;
  } catch (e) {
    return null;
  }
}

/* 打铁锤击清脆金铁交鸣声 */
function playForgeHammerSfx(step) {
  const ctx = getForgeAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 620 + (step || 0) * 45;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, now + 0.18);

    overtone.type = "sine";
    overtone.frequency.setValueAtTime(baseFreq * 2.4, now);
    overtone.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.24);
    overtone.stop(now + 0.24);
  } catch (e) { /* ignore */ }
}

/* 炼器成功：清越剑鸣金钟共鸣 + 五声仙韵爬音 */
function playForgeSuccessSfx(rarityLevel) {
  const ctx = getForgeAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [587.33, 659.25, 739.99, 880.00, 1174.66]; // D5, E5, F#5, A5, D6
    const count = Math.min(notes.length, 3 + (rarityLevel || 1));

    for (let i = 0; i < count; i++) {
      const start = now + i * 0.085;
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(notes[i], start);

      sub.type = "triangle";
      sub.frequency.setValueAtTime(notes[i] * 2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.85);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      sub.start(start);
      osc.stop(start + 0.9);
      sub.stop(start + 0.9);
    }
  } catch (e) { /* ignore */ }
}

function playForgeFailSfx() {
  const ctx = getForgeAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) { /* ignore */ }
}

/* ============================================================
   炼器成功全屏荧光闪烁特效
   ============================================================ */
function triggerForgeSuccessFullscreenFlash(rarityTheme) {
  if (typeof document === "undefined" || !document.body) return;
  const barClass = (rarityTheme && rarityTheme.barClass) || "rarity-green";
  const flashEl = document.createElement("div");
  flashEl.className = `forge-fullscreen-flash ${barClass}`;
  flashEl.innerHTML = `<div class="forge-flash-ring"></div>`;
  document.body.appendChild(flashEl);

  setTimeout(() => {
    if (flashEl && flashEl.parentNode) {
      flashEl.parentNode.removeChild(flashEl);
    }
  }, 1600);
}

/* ============================================================
   炼器炉微弱荧光与 10 秒进度条动画
   ============================================================ */
function triggerForgeAnimationModal(recipe, onComplete) {
  const gradeNames = ["", "凡品", "下品", "中品", "上品", "极品", "灵品", "仙品"];
  const gName = gradeNames[recipe.grade] || `${recipe.grade}品`;
  const rarityTheme = getForgeMaterialRarityTheme(recipe);
  const matSummary = Object.entries(recipe.mats || {})
    .map(([k, v]) => `${k}_${recipe.grade}品×${v}`)
    .join(" + ");

  const html = `
    <div class="forge-furnace-stage is-forging" style="margin-bottom:8px;">
      <div class="forge-spark s1"></div>
      <div class="forge-spark s2"></div>
      <div class="forge-spark s3"></div>
      <div class="forge-spark s4"></div>
      <div class="forge-furnace-vessel">
        <div class="forge-rune-ring"></div>
        <div class="forge-core-aura"></div>
        <span class="forge-cauldron-ico">${renderForgeAnvilSvg()}</span>
      </div>
      <div class="forge-furnace-title">天机铸剑台 · 百炼淬器</div>
      <span class="forge-rarity-pill ${rarityTheme.barClass}">灵材稀有度：${rarityTheme.label}</span>
      <div class="forge-furnace-status" id="forgeStatusText">✨ 引地脉灵火入炉，炉壁泛起幽微荧光...</div>
      <div class="forge-progress-track ${rarityTheme.barClass}">
        <div class="forge-progress-fill ${rarityTheme.barClass}" id="forgeProgressFill"></div>
        <div class="forge-progress-label" id="forgePercentText">0% · 剩余 10.0秒</div>
      </div>
    </div>
    <div style="text-align:center; font-size:12px; color:var(--text-dim); font-family:var(--font-serif);">
      正在锻造 <b style="color:var(--text-gold);">【${gName}·${recipe.name}】</b>（投入：${matSummary}）
    </div>
  `;

  showModal("天机铸剑台 · 锤炼法器", html, []);
  playForgeHammerSfx(0);

  let pct = 0;
  /* 每次炼器读条 10 秒：100 步 × 100ms = 10000ms */
  const interval = setInterval(() => {
    const fillElem = document.getElementById("forgeProgressFill");
    const percentElem = document.getElementById("forgePercentText");
    const statusElem = document.getElementById("forgeStatusText");
    const caveStatusElem = document.getElementById("caveForgeFurnaceStatus");

    if (!fillElem && !percentElem && !statusElem) {
      clearInterval(interval);
      if (typeof window !== "undefined") window._isForgingActive = false;
      return;
    }

    pct += 1;
    if (pct > 100) pct = 100;

    if (pct === 20 || pct === 45 || pct === 70 || pct === 90) {
      playForgeHammerSfx(Math.floor(pct / 20));
    }

    const remainSec = Math.max(0, ((100 - pct) * 0.1)).toFixed(1);
    if (fillElem) fillElem.style.width = pct + "%";
    if (percentElem) percentElem.innerText = `${pct}% · 剩余 ${remainSec}秒`;

    let stageMsg = "✨ 引地脉灵火入炉，炉壁泛起幽微荧光...";
    if (pct < 20) stageMsg = "✨ 引地脉灵火入炉，炉壁泛起幽微荧光...";
    else if (pct < 40) stageMsg = "🔥 投入百炼五金灵材，荧光随火势徐徐流转...";
    else if (pct < 60) stageMsg = "⚒️ 铁砧千锤百炼去芜存菁，剑胚隐现微弱荧光...";
    else if (pct < 80) stageMsg = "🔮 铭刻周天护道阵纹，炉心荧光与灵气共鸣...";
    else if (pct < 98) stageMsg = "⚡ 灵泉淬锋敛尽浮华，法器宝光即将大成...";
    else stageMsg = "🌟 金铁交鸣，荧光漫天，神兵法器出世！";

    if (statusElem) statusElem.innerText = stageMsg;
    if (caveStatusElem) caveStatusElem.innerText = `${stageMsg} (${pct}%)`;

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        closeModal();
        if (onComplete) onComplete();
      }, 350);
    }
  }, 100);
}

/* ============================================================
   生成装备（支持 1~5品 动态随机生成，参考炼丹品级体系）
   ============================================================ */
function generateForgedEquip(recipe, rolledGrade) {
  const recipeRealm = getForgeRecipeRealm(recipe);
  const tier = recipe.tier || (recipeRealm <= 1 ? 1 : recipeRealm) || 1;
  const grade = rolledGrade || (typeof rollForgeGrade === "function" ? rollForgeGrade() : (recipe.grade || 1));
  const gradeNames = ["", "凡品", "下品", "中品", "上品", "极品", "灵品", "仙品"];
  const gradePrefix = gradeNames[grade] || `${grade}品`;

  /* 品级属性缩放系数：1品 0.70x, 2品 0.85x, 3品 1.00x, 4品 1.25x, 5品 1.55x */
  const gradeMult = [0, 0.70, 0.85, 1.00, 1.25, 1.55][grade] || 1;

  /* 基础属性（按配方基准属性乘上品级系数） */
  const baseAtk = recipe.atk !== undefined ? Math.round(recipe.atk * gradeMult) : (
    recipe.slot === "rightHand" ? Math.round((tier * 8 + grade * 3) * gradeMult) :
    recipe.slot === "artifact"  ? Math.round((tier * 5 + grade * 2) * gradeMult) :
    recipe.slot === "accessory" ? Math.round((tier * 2 + grade) * gradeMult) : 0
  );
  const baseDef = recipe.def !== undefined ? Math.round(recipe.def * gradeMult) : (
    recipe.slot === "body"      ? Math.round((tier * 6 + grade * 2) * gradeMult) :
    recipe.slot === "leftHand"  ? Math.round((tier * 5 + grade * 2) * gradeMult) :
    recipe.slot === "head"      ? Math.round((tier * 4 + grade) * gradeMult) :
    recipe.slot === "shoes"     ? Math.round((tier * 3 + grade) * gradeMult) :
    recipe.slot === "artifact"  ? Math.round((tier * 3 + grade) * gradeMult) : 0
  );
  const baseHp = recipe.hp !== undefined ? Math.round(recipe.hp * gradeMult) : (
    recipe.slot === "body"      ? Math.round((tier * 25 + grade * 10) * gradeMult) :
    recipe.slot === "leftHand"  ? Math.round((tier * 18 + grade * 6) * gradeMult) :
    recipe.slot === "head"      ? Math.round((tier * 15 + grade * 5) * gradeMult) :
    recipe.slot === "accessory" ? Math.round((tier * 20 + grade * 5) * gradeMult) :
    recipe.slot === "shoes"     ? Math.round((tier * 12 + grade * 4) * gradeMult) : 0
  );
  const baseMp = recipe.mp !== undefined ? Math.round(recipe.mp * gradeMult) : (
    recipe.slot === "accessory" ? Math.round((tier * 12 + grade * 5) * gradeMult) :
    recipe.slot === "head"      ? Math.round((tier * 8 + grade * 3) * gradeMult) :
    recipe.slot === "body"      ? Math.round((tier * 8 + grade * 3) * gradeMult) : 0
  );

  /* 词条按实际 roll 出的品级生成 */
  const affixes = rollAffixes(grade);

  /* 生成唯一 id（避免和旧装备冲突） */
  const id = `forged_${recipe.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const isArtifact = recipe.slot === "artifact";

  const equip = {
    id: id,
    type: isArtifact ? "artifact" : "equip",
    name: `${gradePrefix}·${recipe.name}`,
    slot: recipe.slot,
    tier: tier,
    grade: grade,
    atk: Math.max(recipe.atk !== undefined && recipe.atk > 0 ? 1 : 0, baseAtk),
    def: Math.max(recipe.def !== undefined && recipe.def > 0 ? 1 : 0, baseDef),
    hp: Math.max(recipe.hp !== undefined && recipe.hp > 0 ? 1 : 0, baseHp),
    mp: Math.max(recipe.mp !== undefined && recipe.mp > 0 ? 1 : 0, baseMp),
    ...(isArtifact ? {
      element: recipe.element || "jin",
      spellBonus: +( (recipe.spellBonus || (grade * 0.04)) * (0.8 + grade * 0.1) ).toFixed(2),
    } : {}),
    price: (tier * 50 + grade * 30),
    desc: `${recipe.desc ? recipe.desc + " " : ""}${gradePrefix}百炼精铸（${tier}阶·${grade}品，附 ${affixes.length} 道器纹词条）`,
    affixes: affixes,
    forged: true,
  };

  /* 注册到 ITEMS */
  ITEMS[id] = equip;
  /* ★ A-1：同步桶 */
  if (typeof registerItemToBucket === "function") {
    registerItemToBucket(id);
  }

  /* ★ 存到 S.forgedItems（存档持久化） */
  if (!S.forgedItems) S.forgedItems = {};
  S.forgedItems[id] = equip;

  return equip;
}

/* ============================================================
   展示装备详情
   ============================================================ */
function showForgedEquipModal(equip) {
  const affixHtml = (equip.affixes || []).map(a =>
    `<div class="row"><span>${a.name}</span><b>${formatAffixValue(a)}</b></div>`
  ).join("") || "<p class='empty'>无词条</p>";

  showModal("炼器成功", `
    <div style="text-align:center; margin-bottom:10px;">
      <div style="font-size:36px;">⚒️</div>
      <div style="font-family:var(--font-serif); color:var(--text-gold); font-size:16px; letter-spacing:2px; margin-top:6px;">
        ${equip.name}
      </div>
    </div>
    <div class="card">
      <div class="row"><span>阶位品级</span><b>${equip.tier || 1} 阶 · ${equip.grade} 品</b></div>
      <div class="row"><span>部位</span><b>${SLOT_NAMES[equip.slot] || equip.slot}</b></div>
      <div class="row"><span>攻击</span><b>+${equip.atk || 0}</b></div>
      <div class="row"><span>防御</span><b>+${equip.def || 0}</b></div>
      <div class="row"><span>气血</span><b>+${equip.hp || 0}</b></div>
      <div class="row"><span>灵力</span><b>+${equip.mp || 0}</b></div>
    </div>
    <h4>词条</h4>
    <div class="card">${affixHtml}</div>
  `, [
    { label: "收下", primary: true, fn: closeModal },
  ]);
}

/* 词条数值格式化 */
function formatAffixValue(affix) {
  let str = affix.format;
  str = str.replace("%s", affix.value);
  str = str.replace("%d", affix.value);
  return str;
}

/* ============================================================
   词条属性聚合（供 totalAtk 等函数调用）
   ============================================================ */

/* 从所有已装备的物品中汇总词条属性 */
function getAffixBonuses() {
  const bonus = {
    atk: 0, def: 0, hpMax: 0, mpMax: 0,
    critRate: 0, critMult: 0,
    lifesteal: 0, reflect: 0, spellBonus: 0, hitRate: 0, hpRegen: 0,
  };

  if (!S.equipped) return bonus;

  for (const slot in S.equipped) {
    const id = S.equipped[slot];
    if (!id) continue;
    const eq = ITEMS[id];
    if (!eq || !eq.affixes) continue;

    eq.affixes.forEach(a => {
      if (bonus[a.stat] !== undefined) {
        bonus[a.stat] += a.value;
      }
    });
  }

  return bonus;
}

/* 存储袋 / 战利品中产出的随机装备（用于冒险地/秘境掉落） */
function randomForgedEquip(grade) {
  const pool = FORGE_RECIPES.filter(r => r.grade === grade);
  if (pool.length === 0) return null;
  const recipe = pick(pool);
  return generateForgedEquip(recipe);
}

/* ============================================================
   洞府 / 宗门：炼器造诣与炼丹造诣专修研习面板
   ============================================================ */
function openCraftStudyModal(skillName) {
  const targetSkill = skillName || "炼器";
  const info = getCraftMasteryInfo(targetSkill);
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const useStone = typeof isStoneTier === "function" ? isStoneTier() : false;
  const costAmt = useStone ? 5 : 50;
  const costName = useStone ? "灵石" : "铜钱";
  const curAmt = useStone ? (S.stone || 0) : (S.money || 0);

  if (!S.flags.craftMasterTaughtDay) S.flags.craftMasterTaughtDay = {};
  const taughtToday = S.flags.craftMasterTaughtDay[targetSkill] === S.day;

  const isForge = targetSkill === "炼器";
  const icon = isForge ? "⚒️" : "🔥";
  const bonusDesc = isForge
    ? `当前加成：锻造成功率 <b>+${(getForgeSkillBonusRate(info.lvl) * 100).toFixed(1)}%</b>${info.lvl >= 9 ? ' · 必定额外+1词条' : info.lvl >= 5 ? ' · 50%概率额外+1词条' : '（Lv.5解锁额外词条几率）'}`
    : `当前加成：成丹率 <b>+${(typeof getAlchemySkillBonusRate === 'function' ? (getAlchemySkillBonusRate(info.lvl) * 100).toFixed(1) : (info.lvl * 1.5).toFixed(1))}%</b> · 单炉增产 <b>+${typeof getAlchemySkillBonusOutput === 'function' ? getAlchemySkillBonusOutput(info.lvl).toFixed(1) : '0.0'} 粒</b> · 高品丹率提升`;

  const html = `
    <div class="card" style="margin-bottom:10px;">
      <div class="row">
        <span><b>${icon} ${targetSkill}造诣 · Lv.${info.lvl}</b></span>
        <span class="tag gold">${info.title}</span>
      </div>
      <div class="craft-progress-track" style="margin:6px 0 4px;">
        <div class="craft-progress-fill" style="width:${info.pct}%;"></div>
      </div>
      <div class="row" style="font-size:11px; color:var(--text-dim);">
        <span>当前熟练进度</span>
        <b>${info.isMax ? '已臻圆满 (MAX)' : `${info.exp} / ${info.maxExp} (${info.pct}%)`}</b>
      </div>
      <div class="small" style="color:var(--text-gold); margin-top:6px;">${bonusDesc}</div>
    </div>

    <div class="card" style="margin-bottom:8px;">
      <div style="font-size:12px; color:#d8b878; line-height:1.6;">
        <b>💡 提升【${targetSkill}造诣】的四大途径：</b><br>
        1. <b>开炉实战</b>：每次${isForge ? '锻造法器（15~45点/次，失败亦有感悟）' : '开炉炼丹（每粒成丹6~12点，废丹亦有感悟）'}自动提升。<br>
        2. <b>专修苦练</b>：在下方选择炉前控火或耗材试手，快速精进造诣。<br>
        3. <b>名宿指点</b>：每日可耗 30 宗门贡献向丹器长老请益独门秘技（不耗行动）。<br>
        4. <b>宗门差事与百艺</b>：在【宗门 > 杂务 / 演武百艺】中选修${targetSkill}差事与百艺。
      </div>
    </div>
    <p class="small">本时段剩余行动：<b>${remain}/${ACTIONS_PER_SLOT}</b> · 宗门贡献：<b>${S.contrib}</b> · ${costName}：<b>${curAmt}</b></p>
  `;

  const actions = [];
  if (!info.isMax) {
    actions.push({
      label: `${isForge ? '⚒️ 淬火习艺' : '🔥 控火演练'} (耗1行动 · 经验+18~26)`,
      primary: true,
      disabled: remain <= 0,
      fn: () => { closeModal(); executeCraftStudy(targetSkill, "basic"); }
    });
    actions.push({
      label: `${isForge ? '🪙 废铁百炼试手' : '🌿 百草药理试炼'} (耗1行动+${costAmt}${costName} · 经验+32~45)`,
      disabled: remain <= 0 || curAmt < costAmt,
      fn: () => { closeModal(); executeCraftStudy(targetSkill, "material"); }
    });
    actions.push({
      label: `📜 请益宗门${targetSkill}名宿 (${taughtToday ? '今日已请教' : '耗30贡献 · 不耗行动 · 经验+55'})`,
      disabled: taughtToday || S.contrib < 30,
      fn: () => { closeModal(); executeCraftStudy(targetSkill, "master"); }
    });
  }
  actions.push({ label: "返回", fn: closeModal });

  showModal(`${icon} 专修【${targetSkill}造诣】`, html, actions);
}

function executeCraftStudy(skillName, mode) {
  const info = getCraftMasteryInfo(skillName);
  if (info.isMax) {
    log(`你的【${skillName}造诣】已臻通天造化圆满之境！`, "c-gold");
    return;
  }

  const isForge = skillName === "炼器";

  if (mode === "master") {
    if (!S.flags.craftMasterTaughtDay) S.flags.craftMasterTaughtDay = {};
    if (S.flags.craftMasterTaughtDay[skillName] === S.day) {
      log(`今日已向长老请教过${skillName}之道，贪多嚼不烂，明日再来吧。`, "c-bad");
      return;
    }
    if (S.contrib < 30) {
      log("宗门贡献不足（需 30 贡献）。", "c-bad");
      return;
    }
    S.contrib -= 30;
    S.flags.craftMasterTaughtDay[skillName] = S.day;
    const res = gainSkillExp(skillName, 55);
    const after = getCraftMasteryInfo(skillName);
    log(`【名宿指点】你耗费 30 贡献向宗门长老请益${skillName}真解，茅塞顿开，${skillName}造诣经验 +${res.added}！`, "c-gold");
    save(); render();
    showActionModal(`名宿指点 · ${skillName}造诣`, [
      `消耗：30 宗门贡献（不消耗行动）`,
      `${skillName}造诣经验 +${res.added}`,
      `当前境界：Lv.${after.lvl}（${after.title} · ${after.exp}/${after.maxExp}）`,
      ...(res.leveledUp ? [`🎉 恭喜！${skillName}造诣突破至 Lv.${after.lvl}！`] : []),
    ]);
    return;
  }

  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }

  const useStone = typeof isStoneTier === "function" ? isStoneTier() : false;
  const costAmt = useStone ? 5 : 50;
  const costName = useStone ? "灵石" : "铜钱";

  let rawGain = 0;
  let modeTitle = "";
  const detail = [];

  if (mode === "material") {
    if (useStone) {
      if ((S.stone || 0) < costAmt) { log("灵石不足。", "c-bad"); return; }
      S.stone -= costAmt;
    } else {
      if ((S.money || 0) < costAmt) { log("铜钱不足。", "c-bad"); return; }
      S.money -= costAmt;
    }
    rawGain = rndInt(32, 45);
    modeTitle = isForge ? "废铁百炼试手" : "百草药理试炼";
    detail.push(`耗费：${costAmt} ${costName} + 1 行动`);
  } else {
    rawGain = rndInt(18, 26);
    modeTitle = isForge ? "炉前淬火习艺" : "丹房控火演练";
    detail.push(`消耗：1 行动`);
  }

  S.actionsUsed++;
  if (typeof triggerDailyTask === "function") triggerDailyTask("practice");

  const res = gainSkillExp(skillName, rawGain);
  const after = getCraftMasteryInfo(skillName);

  log(`【${modeTitle}】你潜心钻研${skillName}之道，${skillName}造诣经验 +${res.added}（Lv.${after.lvl} · ${after.exp}/100）。`, "c-gold");
  detail.push(`${skillName}造诣经验 +${res.added}`);
  detail.push(`当前造诣：Lv.${after.lvl}【${after.title}】（${after.exp}/${after.maxExp}）`);
  if (res.leveledUp) {
    detail.push(`🎉 突破晋升：${skillName}造诣提升至 Lv.${after.lvl}！`);
  }

  if (typeof consumeAction === "function") {
    consumeAction(() => showActionModal(modeTitle, detail));
  } else {
    save(); render();
    showActionModal(modeTitle, detail);
  }
}
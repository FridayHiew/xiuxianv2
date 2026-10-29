/* ============================================================
   systems/cultivate.js - 修炼 / 突破 / 属性计算
   ============================================================ */

/* ============================================================
   属性（含逆天宝物）
   ============================================================ */

function totalAtk() {
  let a = S.atk;
  for (const slot in S.equipped) {
    if (slot === "heavenDefying") continue;
    const id = S.equipped[slot];
    if (id) {
      const eq = findEquipById(id);
      if (eq) a += eq.atk || 0;
    }
  }
  a += getHeartBonus().atk;

  /* ★ 词条加成 */
  if (typeof getAffixBonuses === "function") {
    const ab = getAffixBonuses();
    a += ab.atk;
  }

  /* 逆天宝物 */
  const hd = getCurrentHeavenDefyingEffect();
  if (hd) {
    if (hd.atkMul) a *= (1 + hd.atkMul);
    if (hd.special === "killStack") a *= (1 + (S.heavenDefying.killStacks || 0) * 0.01);
  }

  /* 血煞丹 buff */
  if (S.flags.bloodRage && S.flags.bloodRage.atkMul) {
    a *= (1 + S.flags.bloodRage.atkMul);
  }

  return Math.floor(a);
}

function totalDef() {
  let d = S.def;
  for (const slot in S.equipped) {
    if (slot === "heavenDefying") continue;
    const id = S.equipped[slot];
    if (id) {
      const eq = findEquipById(id);
      if (eq) d += eq.def || 0;
    }
  }
  d += getHeartBonus().def;

    /* ★ 词条加成 */
  if (typeof getAffixBonuses === "function") {
    const ab = getAffixBonuses();
    d += ab.def;
  }

  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.defMul) d *= (1 + hd.defMul);

  return Math.floor(d);
}

function getCritRate() {
  let rate = 0.05 + (totalLuck() || 0) * 0.01;

  /* ★ 词条加成 */
  if (typeof getAffixBonuses === "function") {
    rate += getAffixBonuses().critRate / 100;
  }

  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.critRate) rate += hd.critRate;
  return Math.min(0.5, rate);
}

function totalSpeed() {
  let sp = S.speed || 10;
  for (const slot in S.equipped) {
    if (slot === "heavenDefying") continue;
    const id = S.equipped[slot];
    if (id) {
      const eq = findEquipById(id);
      if (eq) sp += eq.speed || 0;
    }
  }
  sp += (getHeartBonus().speed || 0);
  return sp;
}

function totalMaxHp() {
  let hp = S.hpMax + getHeartBonus().hp;

  /* ★ 词条加成 */
  if (typeof getAffixBonuses === "function") {
    hp += getAffixBonuses().hpMax;
  }

  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.hpMul) hp *= (1 + hd.hpMul);
  return Math.floor(hp);
}

function totalMaxMp() {
  const info = getPlayerRealmInfo();
  /* 凡人境界灵力上限为 0 */
  if (info.realm === 0) return 0;

  let mp = S.mpMax + getHeartBonus().mp;
  
  /* ★ 词条加成 */
  if (typeof getAffixBonuses === "function") {
    mp += getAffixBonuses().mpMax;
  }
  
  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.mpMul) mp *= (1 + hd.mpMul);
  
  return Math.floor(mp);
}

/* 幸运（含逆天宝物） */
function totalLuck() {
  let l = S.luck || 0;
  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.luckBonus) l += hd.luckBonus;
  return l;
}

/* 修炼速度（含逆天宝物 / 丹药 buff） */
function cultivateGain() {
  const art = getCurrentArt();
  const rr = rootRate(S.roots);
  const match = art ? calcArtMatch(art) : 50;
  const matchBonus = 0.5 + match / 100;

  let caveSpirit;
  const rank = S.flags.rank || "杂务";
  if (rank === "杂务" || rank === "门外") caveSpirit = 1;
  else caveSpirit = 1 + S.cave.spirit;

  let base = 5 * rr * matchBonus * caveSpirit;
  base *= [0.5, 0.8, 1.0, 1.2, 1.5][S.mood + 2];
  if ((S.flags.hungerStreak || 0) >= 3) base *= 0.8;

  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.cultivateMul) base *= (1 + hd.cultivateMul);

  /* 修炼丹药 buff（凝神丹 / 悟道丹） */
  if (S.flags.cultivateBuff && S.flags.cultivateBuff.mul) {
    base *= S.flags.cultivateBuff.mul;
  }

  return base;
}

/* 打坐 */
function doCultivate(count) {
  count = count || 1;
  const remain = ACTIONS_PER_SLOT - S.actionsUsed;
  count = Math.min(count, remain);
  if (count <= 0) return;

  const check = canCultivateHeart();
  if (!check.ok) { log(`无法修炼：【${check.reason}】`, "c-bad"); return; }

  const art = getCurrentArt();
  const prog = getArtProgress(art.id);

  let totalHeart = 0;
  let totalExp = 0;
  let stopped = false;
  let fragmentStop = false;

  const realmBonus = calcRealmBonus(art);

  /* 丹药修炼 buff */
  let pillBuffMul = 1;
  if (S.flags.cultivateBuff && S.flags.cultivateBuff.mul) {
    pillBuffMul = S.flags.cultivateBuff.mul;
  }

  for (let i = 0; i < count; i++) {
    if (S.actionsUsed >= ACTIONS_PER_SLOT) { stopped = true; break; }

    const rr = heartRateByRoot(S.roots);
    const inc = rnd(0.15, 0.6) * rr;
    prog.proficiency = Math.min(100, prog.proficiency + inc);
    totalHeart += inc;


        if (prog.proficiency >= 100) {
          const curLevelData = art.levels.find(l => l.lvl === prog.lvl);

          if (prog.lvl === 0) {
            /* Lv.0：不涨修为，等突破 */
          } else if (curLevelData && prog.lvl < art.maxLvl) {
            /* ★ 允许在当前等级内把修为涨满 */
            if (prog.exp < curLevelData.expNeed) {
              const expGain = 10 * rr * realmBonus * pillBuffMul * rnd(0.9, 1.1);
              prog.exp += expGain;
              totalExp += expGain;
              if (prog.exp >= curLevelData.expNeed) {
                prog.exp = curLevelData.expNeed;
              }
            } else {
              /* 修为已满，且遇到了残卷上限 */
              if (prog.lvl >= prog.maxLearn) {
                fragmentStop = true;
              }
            }
          }
        }

    S.actionsUsed++;
  }

  recalcPlayerStats();

  /* 打坐触发每日功课与逆天宝物揭示 */
  if (typeof triggerDailyTask === "function") triggerDailyTask("meditate");
  checkHeavenDefyingReveal("meditate");

  const detail = [];
  if (totalHeart > 0) detail.push(`心法熟练度 +${totalHeart.toFixed(1)}`);
  if (totalExp > 0) {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    const need = curLevelData ? curLevelData.expNeed : 0;
    detail.push(`修为增长 +${fmt(totalExp)}（${fmt(prog.exp)}/${fmt(need)}）`);
  }
  if (fragmentStop) detail.push(`⚠ 已达当前心法上限，需参悟后续卷册`);
  if (stopped) detail.push("感悟圆满，可尝试突破关隘");

  log(`打坐 ${count} 次，修道精进。`, "c-good");

  if (S.actionsUsed >= ACTIONS_PER_SLOT && S.hour < 2) {
    S.hour++;
    S.actionsUsed = 0;
    log(`【时间】进入${HOURS[S.hour]}。`, "c-blue");
    if (S.hour === 2) setTimeout(() => { nightPrompt(); }, 300);
  }
  /* ★ 打坐结束，气血灵力回满 */
  S.hp = totalMaxHp();
  S.mp = totalMaxMp();

  save(); render();
  showActionModal("打坐修炼", detail);
}

/* 属性重算 */
function recalcPlayerStats() {
  const info = getPlayerRealmInfo();
  const hb = getHeartBonus();

  const baseHp = 60 + info.lvl * 25 + Math.max(0, info.realm - 1) * 100;
  S.hpMax = baseHp + hb.hp;
  S.hp = Math.min(S.hp, totalMaxHp());
  if (S.hp < 0) S.hp = 0;

  if (info.realm === 0) {
    S.mpMax = 0;
    S.mp = 0;
  } else {
    const baseMp = 20 + info.lvl * 6 + Math.max(0, info.realm - 1) * 50;
    S.mpMax = baseMp + hb.mp;
    S.mp = Math.min(S.mp, totalMaxMp());
    if (S.mp < 0) S.mp = 0;
  }
}

/* 灵石修炼 */
function cultivateWithStoneItem() {
  const info = getPlayerRealmInfo();
  if (info.realm === 0) { log("凡人阶段无法使用灵石辅助。", "c-bad"); return; }
  if (S.stone < 1) { log("灵石不足。", "c-bad"); return; }
  if (S.actionsUsed >= ACTIONS_PER_SLOT) { log("本时段行动已用完。", "c-bad"); return; }

  const check = canCultivateHeart();
  if (!check.ok) { log(`无法修炼：【${check.reason}】`, "c-bad"); return; }

  S.actionsUsed++;
  S.stone -= 1;

  const art = getCurrentArt();
  const prog = getArtProgress(art.id);

  if (prog.proficiency < 100) {
    log("熟练度未满 100，灵石修炼无效。", "c-bad");
    S.stone += 1;
    S.actionsUsed--;
    return;
  }

  const rr = heartRateByRoot(S.roots);
  const gain = 30 * rr * rnd(0.9, 1.1);
  const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
  if (prog.lvl > 0 && curLevelData && prog.lvl < art.maxLvl) {
    prog.exp = Math.min(prog.exp + gain, curLevelData.expNeed);
    log(`使用灵石修炼，修为 +${fmt(gain)}。`, "c-gold");
  } else {
    log("当前心法无法通过灵石提升。", "c-bad");
    S.stone += 1;
    S.actionsUsed--;
    return;
  }

  recalcPlayerStats();
  consumeAction(() => showActionModal("灵石修炼", [`修为 +${fmt(gain)}`, `灵石 -1`]));
}

/* ========== 突破 ========== */

const BREAK_POINTS = [0, 3, 6];

function isBreakPoint(lvl) {
  return BREAK_POINTS.includes(lvl);
}

function calcBreakRate() {
  const art = getCurrentArt();
  const mx = maxRoot(S.roots);
  const match = calcArtMatch(art);

  let rate = 0;
  rate += mx.val * 0.04;
  rate += (match - 50) / 1000;
  rate += (totalLuck() || 0) * 0.02;

  const realmPenalty = (art.realm || 1) * 0.05;
  rate -= realmPenalty;

  if (S.mood > 0) rate += S.mood * 0.03;
  else if (S.mood < 0) rate += S.mood * 0.05;

  /* 逆天宝物 */
  const hd = getCurrentHeavenDefyingEffect();
  if (hd && hd.breakRate) rate += hd.breakRate;

  /* 突破丹药 buff（破境丹 / 筑基丹 / 结金丹等） */
  if (S.flags.pillBuff && S.flags.pillBuff.breakBonus) {
    rate += S.flags.pillBuff.breakBonus;
  }

  return Math.max(0.05, Math.min(0.99, rate));
}


function tryBreak() {
  const art = getCurrentArt();
  if (!art) { log("没有心法。", "c-bad"); return; }
  const prog = getArtProgress(art.id);

  /* ★ 残卷上限判断 */
  if (prog.lvl >= prog.maxLearn) {
    log(`【${art.name}】已达当前残卷上限 Lv.${prog.maxLearn}，请先寻得后续残卷。`, "c-bad");
    return;
  }

  if (S.poison >= 100) {
    log("丹毒已满，境界永久锁定，无法突破。", "c-bad");
    return;
  }

  if (!isBreakPoint(prog.lvl)) {
    if (prog.lvl >= art.maxLvl) {
      log("心法已满级，请换更高境界的心法。", "c-bad");
      return;
    }
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    if (!curLevelData || prog.exp < curLevelData.expNeed) {
      log("修为尚未圆满。", "c-bad");
      return;
    }
    doLevelUp(prog.lvl + 1);
    return;
  }

  if (prog.lvl === 0) {
    if (prog.proficiency < 100) { log("熟练度尚未圆满。", "c-bad"); return; }
  } else {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    if (!curLevelData || prog.exp < curLevelData.expNeed) {
      log("修为尚未圆满。", "c-bad");
      return;
    }
  }

  if (S.flags.breakAttemptedToday) { log("今日已尝试突破。", "c-bad"); return; }

  const check = canCultivateHeart();
  if (!check.ok) { log(`无法突破：【${check.reason}】`, "c-bad"); return; }

  const rate = calcBreakRate();
  const mx = maxRoot(S.roots);
  const moodEmoji = MOOD_EMOJI[S.mood + 2];

  /* 丹药加成展示 */
  const pillBonus = (S.flags.pillBuff && S.flags.pillBuff.breakBonus) || 0;
  const isBigBreak = prog.lvl === 0;

  let title = "突破";
  let desc = "";
  let tribName = "周天冲关";
  if (prog.lvl === 0) {
    const fromName = art.realm === 1 ? "凡人" : REALMS[art.realm - 1].name + "圆满";
    const toName = REALMS[art.realm].name;
    title = `渡劫破境 · ${fromName} → ${toName}`;
    tribName = art.realm >= 2 ? `九霄【${toName}】雷劫` : `引气入体 · 叩问仙门`;
    desc = `你心法《${art.name}》已臻圆满，即将引发【${tribName}】，重塑仙躯道基！`;
  } else if (prog.lvl === 3) {
    title = `突破 · ${REALMS[art.realm].name}初期 → 中期`;
    tribName = `${REALMS[art.realm].name}中期 · 冲脉关隘`;
    desc = `你${REALMS[art.realm].name}初期真元盈满，可运转周天冲击中期关隘。`;
  } else if (prog.lvl === 6) {
    title = `突破 · ${REALMS[art.realm].name}中期 → 后期`;
    tribName = `${REALMS[art.realm].name}后期 · 玄关天堑`;
    desc = `你${REALMS[art.realm].name}中期炉火纯青，即将叩击后期瓶颈。`;
  }

  const statusChips = [];
  if (mx.val >= 7) statusChips.push('<span class="tag gold">天灵根道基</span>');
  else if (mx.val >= 4) statusChips.push('<span class="tag blue">灵根充沛</span>');
  else statusChips.push('<span class="tag">道基稳固</span>');

  if (totalLuck() >= 10) statusChips.push('<span class="tag gold">福缘深厚</span>');
  else statusChips.push('<span class="tag blue">气运相随</span>');

  if (S.mood > 0) statusChips.push(`<span class="tag good">心境澄明 ${moodEmoji}</span>`);
  else if (S.mood < 0) statusChips.push(`<span class="tag bad">心浮气躁 ${moodEmoji}</span>`);
  else statusChips.push(`<span class="tag">心平气和 ${moodEmoji}</span>`);

  if (pillBonus > 0) {
    statusChips.push(`<span class="tag gold">灵丹护体 +${Math.round(pillBonus * 100)}%</span>`);
  }

  const ratePct = Math.round(rate * 100);
  const rateColor = ratePct >= 70 ? "#7fe08a" : ratePct >= 45 ? "var(--text-gold)" : "#ff7b6b";

  showModal(title, `
    <div class="trib-prep-wrap">
      <div class="trib-sky-banner ${isBigBreak ? "is-major-trib" : "is-minor-trib"}">
        <svg class="trib-sky-svg" viewBox="0 0 360 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tribSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${isBigBreak ? '#1e3a42' : '#1b3b36'}" />
              <stop offset="60%" stop-color="#274f48" />
              <stop offset="100%" stop-color="#19302c" />
            </linearGradient>
            <radialGradient id="tribSunGlow" cx="50%" cy="38%" r="48%">
              <stop offset="0%" stop-color="rgba(248, 216, 130, 0.55)" />
              <stop offset="60%" stop-color="rgba(102, 214, 190, 0.2)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
          </defs>
          <rect width="360" height="100" fill="url(#tribSkyGrad)" />
          <circle cx="180" cy="40" r="65" fill="url(#tribSunGlow)" />
          <!-- 青绿远山 -->
          <path d="M0,100 L0,68 Q45,38 92,62 T185,48 T275,60 T360,46 L360,100 Z" fill="rgba(46, 98, 86, 0.55)" />
          <path d="M0,100 L0,78 Q60,55 120,74 T240,62 T360,72 L360,100 Z" fill="rgba(28, 62, 55, 0.8)" />
          <!-- 劫雷金电纹 -->
          <polyline points="168,6 155,34 176,36 160,72" fill="none" stroke="#ffe58f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.88" />
          <polyline points="205,12 194,38 208,40 196,66" fill="none" stroke="#7ce8ff" stroke-width="1.5" stroke-linecap="round" opacity="0.75" />
        </svg>
        <div class="trib-sky-overlay">
          <div class="trib-sky-badge">${isBigBreak ? "⚡ 天地异象 · 渡劫破境" : "☯ 周天运转 · 贯通玄关"}</div>
          <div class="trib-sky-title">${tribName}</div>
        </div>
      </div>

      <p style="font-size:13px; color:#f0e6d2; margin:8px 0 10px; text-align:center;">${desc}</p>

      <div class="trib-rate-panel">
        <div style="font-size:11.5px; color:var(--text-dim); letter-spacing:1px;">当前基础破关把握</div>
        <div style="font-size:30px; font-weight:800; color:${rateColor}; margin:4px 0; font-family:var(--font-serif); text-shadow:0 0 12px rgba(242,207,120,0.35);">${ratePct}%</div>
        <div style="display:flex; justify-content:center; gap:5px; flex-wrap:wrap; margin-top:6px;">
          ${statusChips.join(" ")}
        </div>
      </div>

      <p class="small" style="color:var(--text-dim); line-height:1.5; text-align:center; margin-top:8px;">
        💡 开启【三段式渡劫冲关仪式】可在天劫降临时抉择应对之策，最高额外提升 <b>+15%</b> 破境成功率或抵御反噬！
      </p>
    </div>
  `, [
    { label: "🌩️ 运转法阵 · 渡劫冲关（互动加成）", primary: true, fn: () => startTribulationCeremony(rate) },
    { label: "⚡ 凝神直接破境", fn: () => doBreakAttempt(rate) },
    { label: "暂缓破关", fn: closeModal },
  ]);
}

/* ============================================================
   三段式天劫/冲关互动仪式（天威雷音 + 抉择加成 + 全屏青绿水墨金莲异象）
   ============================================================ */

let _tribState = null;

function playTribulationSfx(mode) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (window.xianxiaAudio && window.xianxiaAudio.isMuted) return;
    const ctx = (window.xianxiaAudio && window.xianxiaAudio.ctx) ? window.xianxiaAudio.ctx : new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    if (mode === "thunder") {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.42);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } else if (mode === "success") {
      const notes = [392, 493.88, 587.33, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === notes.length - 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        g.gain.setValueAtTime(0.001, now + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.13, now + idx * 0.09 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.09 + 0.85);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.88);
      });
    } else {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.22);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (e) { /* ignore */ }
}

function startTribulationCeremony(baseRate) {
  const art = getCurrentArt();
  if (!art) return;
  const prog = getArtProgress(art.id);
  const isBigBreak = prog.lvl === 0;
  const toRealmName = REALMS[art.realm] ? REALMS[art.realm].name : "仙道";

  const eqWeapon = S.equipped && S.equipped.rightHand ? findEquipById(S.equipped.rightHand) : null;
  const eqArt1 = S.equipped && S.equipped.artifact1 ? findEquipById(S.equipped.artifact1) : null;
  const artifactTitle = (eqArt1 && eqArt1.name) || (eqWeapon && eqWeapon.name) || "护身灵器";

  _tribState = {
    step: 1,
    maxSteps: 3,
    baseRate,
    bonusRate: 0,
    shieldBacklash: false,
    extraPoisonCleanse: 0,
    moodBoost: 0,
    logs: [],
    isBigBreak,
    artName: art.name,
    toRealmName,
    artifactTitle,
  };

  playTribulationSfx("thunder");
  renderTribulationStageModal();
}

function renderTribulationStageModal() {
  if (!_tribState) return;
  const st = _tribState;
  const curRate = Math.max(0.05, Math.min(0.99, st.baseRate + st.bonusRate));
  const ratePct = Math.round(curRate * 100);

  const stageConfigs = [
    {
      step: 1,
      badge: st.isBigBreak ? "第一重天劫 · 劫云聚顶" : "第一关 · 灵气潮涌",
      title: st.isBigBreak ? "九霄青冥雷云压境" : "丹田气海奔涌冲击",
      desc: st.isBigBreak
        ? `苍穹之上青紫劫云翻涌，天地灵气化作漩涡灌入百会穴，《${st.artName}》真元急剧震荡！`
        : `你盘膝运功，《${st.artName}》真气沿着奇经八脉奔腾咆哮，直逼玄关壁垒！`,
      choices: [
        {
          id: "surge",
          icon: "⚡",
          name: "强行催动十二正经",
          sub: "耗损 10% 当前气血以霸道真元强冲关隘（成功率 +7%）",
        },
        {
          id: "steady",
          icon: "☯️",
          name: "太极抱元 · 顺势引导",
          sub: "以柔克刚梳理暴走灵气，稳步蓄势（成功率 +4%）",
        },
        {
          id: "stone",
          icon: "💎",
          name: S.stone >= 5 ? "燃碎 5 块灵石布聚灵护阵" : "借洞天清气护持",
          sub: S.stone >= 5
            ? "消耗 5 块灵石化作精纯灵雾助阵（成功率 +6%，免除本重震荡）"
            : "凝神守一吸纳山间青绿灵气（成功率 +4%）",
        },
      ],
    },
    {
      step: 2,
      badge: st.isBigBreak ? "第二重天劫 · 紫电叩心" : "第二关 · 心魔幻象",
      title: st.isBigBreak ? "天威煌煌 · 劫雷淬体" : "识海波澜 · 道心叩问",
      desc: st.isBigBreak
        ? `一道青金劫雷轰然劈落！电光映照青绿仙山，体内浊气与经脉同时承受天威洗礼！`
        : `玄关松动之际，往昔修行执念化作幻象浮现识海，企图扰乱你的周天运转！`,
      choices: [
        {
          id: "artifact",
          icon: "🛡️",
          name: `祭出【${st.artifactTitle}】护脉`,
          sub: "灵器宝光流转全身，若冲关失利可大幅减轻气血反噬（成功率 +5%，护脉免伤）",
        },
        {
          id: "temper",
          icon: "🔥",
          name: "引劫雷/真火淬炼丹毒",
          sub: "借天威炽盛之力焚烧体内淤积丹毒（成功率 +4%，突破后额外排毒 +5）",
        },
        {
          id: "daoheart",
          icon: "🗡️",
          name: "剑心通明 · 斩灭妄念",
          sub: "一念喝破虚妄，道心澄澈如镜（成功率 +6%）",
        },
      ],
    },
    {
      step: 3,
      badge: st.isBigBreak ? "第三重天劫 · 金莲开泰" : "第三关 · 万流归宗",
      title: st.isBigBreak ? "破而后立 · 凝铸仙基" : "真元归一 · 冲破天堑",
      desc: st.isBigBreak
        ? `最后一重天威化作漫天青绿甘霖与瑞彩金光，只需最后一鼓作气，即可跃入【${st.toRealmName}】之境！`
        : `瓶颈壁垒已布满裂纹，丹田气海光芒大盛，只差临门一脚便可彻底贯通！`,
      choices: [
        {
          id: "allin",
          icon: "🌟",
          name: "万流归宗 · 全力破境！",
          sub: "倾尽毕生感悟轰开仙门大道（最终成功率再 +5%，立即结算破境）",
        },
        {
          id: "lotus",
          icon: "🪷",
          name: "步步生莲 · 润物无声",
          sub: "引天地瑞气滋养神魂与气血（成功率 +3%，回复 20% 气血并结算破境）",
        },
      ],
    },
  ];

  const cfg = stageConfigs[st.step - 1] || stageConfigs[0];

  const stepsHtml = [1, 2, 3].map(idx => {
    const cls = idx < st.step ? "done" : idx === st.step ? "active" : "";
    return `<div class="trib-step-dot ${cls}"><span>第${idx}重</span></div>`;
  }).join(`<div class="trib-step-line"></div>`);

  const logsHtml = st.logs.length > 0
    ? `<div class="trib-mini-log">${st.logs.map(l => `<div>${l}</div>`).join("")}</div>`
    : "";

  const choicesHtml = cfg.choices.map(c => `
    <button type="button" class="trib-choice-btn" onclick="chooseTribulationOption('${c.id}')">
      <span class="trib-c-icon">${c.icon}</span>
      <div class="trib-c-body">
        <div class="trib-c-name">${c.name}</div>
        <div class="trib-c-sub">${c.sub}</div>
      </div>
    </button>
  `).join("");

  showModal(`🌩️ 渡劫冲关 · ${cfg.badge}`, `
    <div class="tribulation-stage-card">
      <div class="trib-progress-steps">${stepsHtml}</div>

      <div class="trib-sky-canvas stage-${st.step}">
        <div class="trib-cloud-layer"></div>
        <svg class="trib-lightning-svg" viewBox="0 0 320 84" preserveAspectRatio="none">
          <path d="M0,84 L0,54 Q55,28 110,48 T220,36 T320,44 L320,84 Z" fill="rgba(42, 92, 82, 0.5)" />
          <polyline class="trib-bolt-line" points="${st.step === 1 ? '145,4 132,32 152,35 138,74' : st.step === 2 ? '165,2 148,30 172,32 150,62 168,80' : '160,6 156,42 164,42 160,78'}"
                    fill="none" stroke="${st.step === 3 ? '#9ef5d4' : '#ffe27a'}" stroke-width="2.6" stroke-linecap="round" />
        </svg>
        <div class="trib-stage-caption">
          <div class="tsc-title">${cfg.title}</div>
          <div class="tsc-rate">当前破境把握：<b>${ratePct}%</b> ${st.bonusRate > 0 ? `<span class="tsc-bonus">(+${Math.round(st.bonusRate * 100)}%)</span>` : ""}</div>
        </div>
      </div>

      <p class="trib-stage-desc">${cfg.desc}</p>
      ${logsHtml}
      <div class="trib-choices-list">${choicesHtml}</div>
    </div>
  `, []);
}

function chooseTribulationOption(choiceId) {
  if (!_tribState) return;
  const st = _tribState;

  if (choiceId === "surge") {
    const costHp = Math.max(1, Math.floor(S.hp * 0.1));
    S.hp = Math.max(1, S.hp - costHp);
    st.bonusRate += 0.07;
    st.logs.push(`⚡ 强催经脉（气血 -${costHp}），破境把握提升 +7%！`);
    playTribulationSfx("thunder");
  } else if (choiceId === "steady") {
    st.bonusRate += 0.04;
    st.logs.push(`☯️ 太极抱元梳理真气，破境把握提升 +4%！`);
    playTribulationSfx("chime");
  } else if (choiceId === "stone") {
    if (S.stone >= 5) {
      S.stone -= 5;
      st.bonusRate += 0.06;
      st.logs.push(`💎 燃碎 5 块灵石化作青绿灵雾助阵，破境把握 +6%！`);
    } else {
      st.bonusRate += 0.04;
      st.logs.push(`🌬️ 吐纳山间清气护持心脉，破境把握 +4%！`);
    }
    playTribulationSfx("chime");
  } else if (choiceId === "artifact") {
    st.bonusRate += 0.05;
    st.shieldBacklash = true;
    st.logs.push(`🛡️ 【${st.artifactTitle}】灵光护体，破境把握 +5%，且可抵御反噬重创！`);
    playTribulationSfx("chime");
  } else if (choiceId === "temper") {
    st.bonusRate += 0.04;
    st.extraPoisonCleanse += 5;
    st.logs.push(`🔥 引天威真火淬炼经脉，破境把握 +4%，突破排毒大幅增加！`);
    playTribulationSfx("thunder");
  } else if (choiceId === "daoheart") {
    st.bonusRate += 0.06;
    st.logs.push(`🗡️ 剑心通明斩灭识海妄念，破境把握 +6%！`);
    playTribulationSfx("chime");
  } else if (choiceId === "allin") {
    st.bonusRate += 0.05;
  } else if (choiceId === "lotus") {
    st.bonusRate += 0.03;
    const heal = Math.floor(totalMaxHp() * 0.2);
    S.hp = Math.min(totalMaxHp(), S.hp + heal);
  }

  if (st.step < st.maxSteps) {
    st.step++;
    renderTribulationStageModal();
  } else {
    const finalRate = Math.max(0.05, Math.min(0.99, st.baseRate + st.bonusRate));
    const opts = {
      shieldBacklash: st.shieldBacklash,
      extraPoisonCleanse: st.extraPoisonCleanse,
      ceremonyLogs: st.logs.slice(),
    };
    _tribState = null;
    doBreakAttempt(finalRate, opts);
  }
}

/* 全屏「青绿仙山·金莲开泰」破境异象演出 */
function playBreakthroughGrandVfx(infoObj) {
  if (typeof document === "undefined") return;
  const old = document.getElementById("breakthroughGrandStage");
  if (old) old.remove();

  playTribulationSfx("success");

  const isBig = !!(infoObj && infoObj.isBigBreak);
  const realmTitle = (infoObj && infoObj.realmName) || "大道精进";
  const artTitle = (infoObj && infoObj.artName) || "玄门真诀";
  const poem = isBig
    ? "九霄雷尽青峰翠，一朝破境金莲开"
    : "周天运转真元满，百尺竿头更上层";

  const stage = document.createElement("div");
  stage.id = "breakthroughGrandStage";
  stage.className = `breakthrough-grand-stage ${isBig ? "major-realm" : "minor-realm"}`;

  const petals = ["🪷", "✦", "✧", "☯", "✨", "🍃"];
  const particlesHtml = Array.from({ length: 18 }).map((_, i) => {
    const left = (5 + (i * 5.3) % 90).toFixed(1);
    const delay = ((i * 0.14) % 1.4).toFixed(2);
    const dur = (1.8 + (i % 3) * 0.45).toFixed(2);
    const sym = petals[i % petals.length];
    return `<span class="bt-lotus-petal" style="left:${left}%; animation-delay:${delay}s; animation-duration:${dur}s;">${sym}</span>`;
  }).join("");

  stage.innerHTML = `
    <div class="bt-grand-backdrop"></div>
    <div class="bt-grand-bagua">
      <svg viewBox="0 0 200 200" class="bt-bagua-svg">
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(245, 212, 132, 0.55)" stroke-width="1.5" stroke-dasharray="6 4" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(126, 238, 210, 0.5)" stroke-width="1.2" />
        <polygon points="100,16 160,40 184,100 160,160 100,184 40,160 16,100 40,40" fill="none" stroke="rgba(245, 212, 132, 0.4)" stroke-width="1.2" />
      </svg>
    </div>
    <div class="bt-particles-wrap">${particlesHtml}</div>
    <div class="bt-grand-plaque">
      <div class="bt-seal-stamp">${isBig ? "破境" : "精进"}</div>
      <div class="bt-grand-sub">《${artTitle}》功成圆满</div>
      <div class="bt-grand-realm">${realmTitle}</div>
      <div class="bt-grand-poem">${poem}</div>
    </div>
  `;

  stage.addEventListener("click", () => stage.remove());
  document.body.appendChild(stage);
  setTimeout(() => {
    if (stage && stage.parentNode) stage.remove();
  }, 2400);
}

function doBreakAttempt(rate, ceremonyOpts) {
  closeModal();
  S.flags.breakAttemptedToday = true;
  ceremonyOpts = ceremonyOpts || {};

  const art = getCurrentArt();
  const prog = getArtProgress(art.id);
  const isLv0 = prog.lvl === 0;

  /* 突破成功后清除丹药加成 */
  const clearPillBuff = () => {
    if (S.flags.pillBuff && S.flags.pillBuff.breakBonus) {
      delete S.flags.pillBuff.breakBonus;
    }
  };

  if (Math.random() < rate) {
    /* ★ 记录突破前等级，用于判断大/小境界 */
    const lvlBefore = prog.lvl;

    prog.lvl += 1;
    prog.exp = 0;
    if (isLv0) prog.proficiency = 100;

    recalcPlayerStats();
    updateElementLvl();

    /* ★ 排毒：大境界 5~12，小境界 1~3 + 渡劫淬体额外排毒 */
    const isBigBreak = (lvlBefore === 0);
    const baseCleanse = isBigBreak ? rndInt(5, 12) : rndInt(1, 3);
    const poisonReduce = baseCleanse + (ceremonyOpts.extraPoisonCleanse || 0);
    let poisonDetail = "";
    if (S.poison > 0) {
      const beforePoison = S.poison;
      S.poison = Math.max(0, S.poison - poisonReduce);
      const actualReduce = beforePoison - S.poison;
      poisonDetail = `天威涤荡丹毒 -${actualReduce.toFixed(2)}（当前 ${S.poison.toFixed(2)}/100）`;
    }

    const info = getPlayerRealmInfo();
    const realmName = info.realm === 0 ? "凡人" : `${REALMS[info.realm].name}·${subName(info.lvl)}${info.lvl}重`;

    log(`【突破成功】${art.name} 达到 Lv.${prog.lvl}，晋升境界：${realmName}！`, "c-gold");

    /* 全屏青绿水墨·金莲开泰天象演出 */
    playBreakthroughGrandVfx({
      isBigBreak,
      realmName,
      artName: art.name,
    });

    S.mood = Math.min(2, S.mood + 1);

    if (isLv0) {
      S.hp = totalMaxHp();
      S.mp = totalMaxMp();
      if (isLv0 && info.realm > 0) S.lifeMax = REALMS[info.realm].life;
    }

    /* 清除丹药加成 */
    clearPillBuff();

    /* 突破触发逆天宝物揭示 */
    checkHeavenDefyingReveal("breakthrough");

    save(); render();
    showActionModal("🌟 破境大成 · 天降瑞彩", [
      `心法《${art.name}》突破至 Lv.${prog.lvl}`,
      `当前境界：${realmName}`,
      isLv0 ? `寿元上限跃升至 ${S.lifeMax} 载，气血真元圆满充盈` : `真元凝练，四维战力全面精进`,
      "道心通达，心境 +1",
      poisonDetail,
    ].filter(Boolean), () => {
      if (typeof checkRealmStoryTrigger === "function") {
        checkRealmStoryTrigger();
      }
    });
  } else {
    const shielded = !!ceremonyOpts.shieldBacklash;
    if (isLv0) prog.proficiency = Math.max(0, prog.proficiency - (shielded ? 15 : 30));
    else prog.exp = Math.max(0, Math.floor(prog.exp * (shielded ? 0.72 : 0.5)));

    const hpLossRatio = shielded ? 0.12 : 0.3;
    S.hp -= Math.floor(S.hpMax * hpLossRatio);
    if (!shielded) {
      S.mood = Math.max(-2, S.mood - 1);
    }

    /* 失败也消耗丹药加成 */
    clearPillBuff();

    log(`【突破受挫】${art.name} 冲关受阻${shielded ? "（幸得灵器护脉减轻反噬）" : "，气血受损"}。`, "c-bad");
    save(); render();
    if (S.hp <= 0) { die("突破失败，气血耗尽而亡。"); return; }
    showActionModal("⚡ 冲关受挫 · 调息再战", [
      "瓶颈壁垒坚固，周身真气激荡反噬",
      shielded ? "🛡️ 幸得护身灵器抵御天威，反噬损耗大幅减轻！" : (isLv0 ? "心法熟练度有所回退" : "部分散逸真元需重新打坐凝聚"),
      shielded ? "道心未损，调息片刻即可择日再战" : "气血与心境略受震荡，宜服丹温养后再战",
    ]);
  }
}

function doLevelUp(nextLvl) {
  const art = getCurrentArt();
  const prog = getArtProgress(art.id);

  prog.lvl = nextLvl;
  prog.exp = 0;

  recalcPlayerStats();
  updateElementLvl();

  const info = getPlayerRealmInfo();
  const realmName = `${REALMS[info.realm].name}·${subName(info.lvl)}${info.lvl}重`;

  playBreakthroughGrandVfx({
    isBigBreak: false,
    realmName,
    artName: art.name,
  });

  log(`【提升】${art.name} 达到 Lv.${prog.lvl}，境界：${realmName}`, "c-good");
  save(); render();
  showActionModal("✨ 境界精进", [
    `心法《${art.name}》达到 Lv.${prog.lvl}`,
    `境界：${realmName}`,
  ], () => {
    if (typeof checkRealmStoryTrigger === "function") {
      checkRealmStoryTrigger();
    }
  });
}
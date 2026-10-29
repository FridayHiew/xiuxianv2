/* ============================================================
   systems/alchemy.js - 炼丹系统（品级版）
   ============================================================ */

/* ============================================================
   基础查询
   ============================================================ */

function getAlchemyCaveLv() {
  return (S.cave && S.cave.alchemy) || 0;
}

function getAlchemySkillLv() {
  return (S.skills && S.skills["炼丹"] && S.skills["炼丹"].lvl) || 0;
}

function isAlchemyUnlocked() {
  return getAlchemyCaveLv() >= 1;
}

/* ============================================================
   丹方解锁
   ============================================================ */

function isRecipeKnown(recipeId) {
  return !!(S.flags && S.flags.knownRecipes && S.flags.knownRecipes[recipeId]);
}

function unlockRecipe(recipeId, cost) {
  if (isRecipeKnown(recipeId)) return { ok: false, reason: "已解锁" };
  const recipe = getRecipe(recipeId);
  if (!recipe) return { ok: false, reason: "丹方不存在" };
  if (S.contrib < cost) return { ok: false, reason: "贡献不足" };

  S.contrib -= cost;
  if (!S.flags.knownRecipes) S.flags.knownRecipes = {};
  S.flags.knownRecipes[recipeId] = true;

  log(`【丹方阁】解锁丹方《${recipe.name}》（${cost} 贡献）。`, "c-gold");
  return { ok: true };
}

/* ============================================================
   产出与成丹率公式（含炼丹造诣平滑加成）
   ============================================================ */

function getAlchemySkillBonusOutput(lvl) {
  const lv = lvl !== undefined ? lvl : getAlchemySkillLv();
  if (lv >= 10) return 3.0;
  if (lv >= 9) return 2.0;
  if (lv >= 6) return 1.5;
  if (lv >= 3) return 1.0;
  if (lv >= 1) return 0.5;
  return 0;
}

function getAlchemySkillBonusRate(lvl) {
  const lv = lvl !== undefined ? lvl : getAlchemySkillLv();
  return +(lv * 0.015).toFixed(3);
}

function calcAlchemyOutput() {
  const caveLv = getAlchemyCaveLv();
  let bonus = 0;

  if (caveLv >= 1) bonus += (caveLv - 1) * 0.5;

  bonus += getAlchemySkillBonusOutput();

  if (S.flags.alchemyBuff && S.flags.alchemyBuff.output > 0) {
    bonus += S.flags.alchemyBuff.output;
  }

  if (S.mood >= 1) bonus += 0.5;

  return Math.max(1, Math.min(12, Math.floor(1 + bonus)));
}

/* 炼丹成功率（不含品级惩罚，品级由 roll 决定） */
function calcAlchemyRate(recipeId) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return 0;

  let rate = recipe.rate || 0.5;
  rate += getAlchemySkillBonusRate();

  if (S.flags.alchemyBuff && S.flags.alchemyBuff.rate > 0) {
    rate += S.flags.alchemyBuff.rate;
  }

  if (S.mood >= 1) rate += 0.03;
  else if (S.mood <= -1) rate -= 0.05;

  return Math.max(0.05, Math.min(0.99, rate));
}

/* ============================================================
   品级分布（受炼丹造诣加成：造诣越高，3~5品高阶灵丹出丹率越高）
   ============================================================ */

function rollPillGrade() {
  const lv = getAlchemySkillLv();
  const boost = lv * 0.015; /* Lv.10 最高提供 +15% 高品偏移 */
  const r = Math.random() + boost;
  if (r < 0.50) return 1;
  if (r < 0.80) return 2;
  if (r < 0.94) return 3;
  if (r < 0.985) return 4;
  return 5;
}

/* ============================================================
   材料检查
   ============================================================ */

function checkAlchemyMaterial(recipeId, count) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return { ok: false, list: [] };

  const list = [];
  let allOk = true;

  for (const baseId in recipe.mat) {
    const perOne = recipe.mat[baseId];
    const need = perOne * count;
    const itemId = `${baseId}_${recipe.tier}`;
    const have = (S.inventory && S.inventory[itemId]) || 0;
    const ok = have >= need;
    if (!ok) allOk = false;
    list.push({ itemId, baseId, need, have, ok });
  }

  return { ok: allOk, list };
}

/* ============================================================
   炼丹
   ============================================================ */

function doAlchemy(recipeId) {
  if (!isAlchemyUnlocked()) {
    log("炼丹房尚未解锁（需先在洞府设施中升级）。", "c-bad");
    return;
  }

  if (!isRecipeKnown(recipeId)) {
    log("尚未解锁该丹方，请到宗门【丹方阁】购买。", "c-bad");
    return;
  }

  const recipe = getRecipe(recipeId);
  if (!recipe) { log("丹方不存在。", "c-bad"); return; }

  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }

  const maxOutput = calcAlchemyOutput();

  const check = checkAlchemyMaterial(recipeId, maxOutput);
  if (!check.ok) {
    let canDo = 0;
    for (let c = maxOutput; c >= 1; c--) {
      if (checkAlchemyMaterial(recipeId, c).ok) {
        canDo = c;
        break;
      }
    }
    if (canDo <= 0) {
      log("材料不足，无法炼丹。", "c-bad");
      return;
    }
    showModal("材料不足", `
      <p>你想炼 <b>${maxOutput}</b> 粒，但材料不足。</p>
      <p>当前最多可炼 <b>${canDo}</b> 粒。</p>
      <p class="small">是否炼 ${canDo} 粒？</p>
    `, [
      { label: `炼 ${canDo} 粒`, fn: () => { closeModal(); executeAlchemy(recipeId, canDo); } },
      { label: "取消", fn: closeModal },
    ]);
    return;
  }

  executeAlchemy(recipeId, maxOutput);
}

function executeAlchemy(recipeId, count) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return;

  /* 扣材料 */
  for (const baseId in recipe.mat) {
    const need = recipe.mat[baseId] * count;
    const itemId = `${baseId}_${recipe.tier}`;
    removeItem(itemId, need);
  }

  /* 逐粒判定 */
  const rate = calcAlchemyRate(recipeId);
  let templateId = recipe.name;
  if (!ITEMS[templateId]) {
    templateId = recipe.name.replace(/_\d+阶$/, "") + "_" + recipe.tier + "阶";
  }
  if (!ITEMS[templateId]) {
    templateId = recipe.name.replace(/_\d+阶$/, "");
  }

  /* 品级统计 */
  const gradeCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 0; i < count; i++) {
    if (chance(rate)) {
      /* 成功 → roll 品级 */
      const g = rollPillGrade();
      gradeCount[g]++;
    } else {
      /* 失败 → 0 品 */
      gradeCount[0]++;
    }
  }

  /* 添加物品 */
  const detail = [];
  const itemNames = [];
  for (let g = 0; g <= 5; g++) {
    if (gradeCount[g] <= 0) continue;
    const item = getOrCreatePillItem(templateId, g);
    if (!item) continue;
    const targetItemId = item.id || (templateId + "_" + g + "品");
    if (!item.id) item.id = targetItemId;
    ITEMS[targetItemId] = item;
    addItem(targetItemId, gradeCount[g]);
    itemNames.push(`${item.name} ×${gradeCount[g]}`);
  }

  /* 消耗 1 行动 */
  S.actionsUsed++;

  /* 炼丹造诣熟练度：每粒成丹 +(4 + 阶数×2)，每粒废丹亦有 +2 控火感悟 */
  const successCount = count - gradeCount[0];
  const perSuccessExp = 4 + (recipe.tier || 1) * 2;
  const rawExp = successCount * perSuccessExp + (gradeCount[0] || 0) * 2;
  let expGainRes = { added: rawExp, leveledUp: false, newLvl: getAlchemySkillLv(), curExp: 0 };

  if (typeof gainSkillExp === "function") {
    expGainRes = gainSkillExp("炼丹", rawExp);
  } else {
    if (!S.skills["炼丹"]) S.skills["炼丹"] = { lvl: 0, exp: 0 };
    S.skills["炼丹"].exp = +(S.skills["炼丹"].exp + rawExp).toFixed(1);
    while (S.skills["炼丹"].exp >= SKILL_LVL_EXP && S.skills["炼丹"].lvl < MAX_SKILL_LVL) {
      S.skills["炼丹"].exp = +(S.skills["炼丹"].exp - SKILL_LVL_EXP).toFixed(1);
      S.skills["炼丹"].lvl++;
      expGainRes.leveledUp = true;
      expGainRes.newLvl = S.skills["炼丹"].lvl;
      log(`【造诣突破】你的【炼丹造诣】提升到 Lv.${S.skills["炼丹"].lvl}！`, "c-gold");
    }
    expGainRes.curExp = S.skills["炼丹"].exp;
  }

  log(`炼丹 ${count} 粒：成功 ${successCount} 粒（${itemNames.join("、") || "无"}）${gradeCount[0] > 0 ? "，失败 " + gradeCount[0] + " 粒" : ""}，炼丹造诣经验 +${expGainRes.added}。`, successCount > 0 ? "c-gold" : "c-bad");

  /* 若跨时段 */
  if (S.actionsUsed >= ACTIONS_PER_SLOT && S.hour < 2) {
    S.hour++;
    S.actionsUsed = 0;
    log(`【时间】进入${HOURS[S.hour]}。`, "c-blue");
    if (S.hour === 2) setTimeout(() => { nightPrompt(); }, 300);
  }

  save(); render();

  /* 结算弹窗内容 */
  const lines = [];
  lines.push(`丹方：${recipe.name}（${recipe.tier} 阶）`);
  lines.push(`投入：${count} 份材料`);
  lines.push(`成功率：${(rate * 100).toFixed(1)}%`);
  lines.push(`—— 产出 ——`);
  for (let g = 5; g >= 0; g--) {
    if (gradeCount[g] <= 0) continue;
    const label = g === 0 ? "废丹" : `${g} 品`;
    lines.push(`${label}：${gradeCount[g]} 粒`);
  }
  lines.push(`炼丹造诣经验 +${expGainRes.added}${expGainRes.leveledUp ? `（突破至 Lv.${expGainRes.newLvl}！）` : `（${expGainRes.curExp}/100）`}`);
  lines.push(`消耗 1 行动`);

  /* 播放平滑流光炼丹动画与水墨氤氲成功特效 */
  triggerAlchemyAnimationModal(recipe.name, count, () => {
    if (successCount > 0) {
      showAlchemySuccessModal(recipe, count, successCount, gradeCount, rate, itemNames, expGainRes);
    } else {
      showActionModal("炼丹结束 · 控火感悟", lines);
    }
  });
}

/* ============================================================
   炼丹大吉：水墨氤氲特效结算弹窗 (Ink-Spread Alchemy Results Modal)
   ============================================================ */
function showAlchemySuccessModal(recipe, count, successCount, gradeCount, rate, itemNames, expGainRes) {
  const gradeLabels = ["废丹", "一品", "二品", "三品", "四品", "五品·极品"];
  const gradeColors = ["#888", "#5fb865", "#3498db", "#9b59b6", "#e67e22", "#f1c40f"];

  let pillPillsHtml = "";
  for (let g = 5; g >= 1; g--) {
    if (gradeCount[g] <= 0) continue;
    const isGold = g >= 4;
    pillPillsHtml += `
      <span class="alchemy-pill-chip" style="border-color:${gradeColors[g]}; ${isGold ? 'box-shadow: 0 0 10px rgba(241,196,15,0.45);' : ''}">
        <span style="font-size:14px;">${isGold ? '✨💊' : '💊'}</span>
        <b style="color:${gradeColors[g]};">${gradeLabels[g]}</b> ×${gradeCount[g]}
      </span>
    `;
  }
  if (gradeCount[0] > 0) {
    pillPillsHtml += `
      <span class="alchemy-pill-chip" style="opacity:0.65; border-color:#555;">
        <span>💨</span>
        <span style="color:#888;">废丹</span> ×${gradeCount[0]}
      </span>
    `;
  }

  const addedExp = expGainRes ? expGainRes.added : (successCount * 6);
  const lvlUpText = (expGainRes && expGainRes.leveledUp) ? ` · 🎉 突破至 Lv.${expGainRes.newLvl}！` : "";

  const html = `
    <div class="alchemy-success-wrapper">
      <div class="alchemy-ink-spread"></div>
      <div class="alchemy-ink-spread-ring"></div>
      
      <div class="alchemy-success-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px dashed #3a2b18; padding-bottom:6px;">
          <div style="font-size:15px; font-weight:700; color:var(--text-gold); font-family:var(--font-serif); display:flex; align-items:center; gap:6px;">
            <span>🌟</span>
            <span>丹成九转 · 异香满室</span>
          </div>
          <span class="tag gold" style="font-size:11px;">丹方契合 ${(rate * 100).toFixed(0)}%</span>
        </div>

        <div style="font-size:12.5px; color:#c4b494; margin-bottom:10px; line-height:1.5;">
          鼎盖揭启，紫气东来，水墨氤氲漫散！共计投入 <b>${count}</b> 份灵材，凝炼出灵丹 <b>${successCount}</b> 粒：
        </div>

        <div style="margin-bottom:12px; display:flex; flex-wrap:wrap; gap:4px;">
          ${pillPillsHtml}
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid #3d2f1f; border-radius:6px; padding:6px 10px; font-size:11.5px; color:#d8b878; display:flex; justify-content:space-between; align-items:center;">
          <span>✨ 炼丹造诣经验 +${addedExp}${lvlUpText}</span>
          <span>消耗 1 行动</span>
        </div>
      </div>
    </div>
  `;

  showModal("炼丹大吉 · 丹香凝露", html, [
    { label: "收入储物袋", primary: true, fn: () => { closeModal(); save(); render(); } }
  ]);
}

/* ============================================================
   平滑流光炼丹进度条动画
   ============================================================ */

function triggerAlchemyAnimationModal(recipeName, count, onComplete) {
  const html = `
    <div class="alchemy-anim-container">
      <div class="alchemy-furnace-wrap">
        <span class="alchemy-furnace-icon">🔥</span>
      </div>
      <div class="alchemy-status-text" id="alchemyStatusText">🔥 灵火引升，鼎炉渐热...</div>
      <div class="alchemy-progress-track">
        <div class="alchemy-progress-fill" id="alchemyProgressFill"></div>
        <div class="alchemy-percent-text" id="alchemyPercentText">0%</div>
      </div>
    </div>
    <div style="text-align:center; font-size:12px; color:var(--text-dim); font-family:var(--font-serif);">
      正在炼制 <b style="color:var(--text-gold);">${recipeName}</b> × ${count} 粒，九转三昧真火催化中...
    </div>
  `;

  showModal("九转紫府炉 · 炼化灵丹", html, []);

  let pct = 0;
  const interval = setInterval(() => {
    const fillElem = document.getElementById("alchemyProgressFill");
    const percentElem = document.getElementById("alchemyPercentText");
    const statusElem = document.getElementById("alchemyStatusText");

    if (!fillElem && !percentElem && !statusElem) {
      clearInterval(interval);
      return;
    }

    pct += 1;
    if (pct > 100) pct = 100;

    if (fillElem) fillElem.style.width = pct + "%";
    if (percentElem) percentElem.innerText = pct + "%";

    if (statusElem) {
      if (pct < 18) statusElem.innerText = "🔥 灵火引升，紫府鼎炉徐徐加温...";
      else if (pct < 38) statusElem.innerText = "🌿 投灵草天材，药萃精华渐次消融...";
      else if (pct < 62) statusElem.innerText = "💨 文武火相济，三昧真火淬除杂质...";
      else if (pct < 82) statusElem.innerText = "✨ 纳气聚灵，鼎内药力徐徐凝结...";
      else if (pct < 98) statusElem.innerText = "🔮 九转归一，神芒吞吐丹丸即成...";
      else statusElem.innerText = "🌟 鼎盖揭启，异香扑鼻，金丹出世！";
    }

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        closeModal();
        if (onComplete) onComplete();
      }, 400);
    }
  }, 50);
}

/* ============================================================
   丹方详情弹窗
   ============================================================ */

function showRecipeDetail(recipeId) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return;

  const matText = Object.entries(recipe.mat)
    .map(([base, cnt]) => `${base}_${recipe.tier} ×${cnt}`).join(" + ");

  let template = ITEMS[recipe.name];
  if (!template) template = ITEMS[recipe.name.replace(/_\d+阶$/, "") + "_" + recipe.tier + "阶"];
  if (!template) template = ITEMS[recipe.name.replace(/_\d+阶$/, "")];

  let effectLine = recipe.desc || "—";
  if (template && template.baseEffect && template.baseEffect[recipe.tier]) {
    effectLine += `（5 品满值效果: ${template.baseEffect[recipe.tier]}）`;
  }

  showModal(`${recipe.name} · 详情`, `
    <p><b>阶位：</b>${recipe.tier} 阶</p>
    <p><b>可产品级：</b>1 ~ ${recipe.maxGrade || 5} 品</p>
    <p><b>配方：</b>${matText}</p>
    <p><b>效果：</b>${effectLine}</p>
    <p class="small">基础成功率：${(recipe.rate * 100).toFixed(0)}%</p>
    <p class="small">品级分布：1品 50%，2品 30%，3品 15%，4品 4%，5品 1%</p>
    <p class="small">失败产出：0 品废丹</p>
  `, [{ label: "关闭", fn: closeModal }]);
}

/* ============================================================
   点击"炼" → 直接开始炼丹
   ============================================================ */

function showRecipeGradeSelect(recipeId) {
  const recipe = getRecipe(recipeId);
  if (!recipe) return;
  if (!isRecipeKnown(recipeId)) {
    log("尚未解锁该丹方。", "c-bad");
    return;
  }

  const output = calcAlchemyOutput();
  const check = checkAlchemyMaterial(recipeId, 1);
  const rate = calcAlchemyRate(recipeId);

  const matLines = check.list.map(m => {
    const color = m.ok ? "#7fbf5f" : "#d05a4a";
    return `<span style="color:${color};">${m.baseId}_${recipe.tier} ×${m.need}（有 ${m.have}）</span>`;
  }).join(" + ");

  showModal(`炼制 ${recipe.name}`, `
    <p class="small">${recipe.tier} 阶丹药，每炼一次产出 ${output} 粒</p>
    <p><b>成功率：</b>${(rate * 100).toFixed(1)}%</p>
    <div class="card">
      <div class="small">${matLines}</div>
    </div>
    <p class="small">品级分布：1品 50%，2品 30%，3品 15%，4品 4%，5品 1%</p>
    <p class="small">失败产出：0 品废丹</p>
  `, [
    { label: "取消", fn: closeModal },
    { label: check.ok ? `开始炼制` : "材料不足", primary: true, fn: () => {
      if (!check.ok) return;
      closeModal();
      doAlchemy(recipeId);
    }},
  ]);
}

/* ============================================================
   Buff 处理
   ============================================================ */

function applyAlchemyBuff(pill) {
  if (!pill.effect) return;
  const key = pill.effect.key;
  if (key === "alchemyBuff") {
    if (!S.flags.alchemyBuff) S.flags.alchemyBuff = {};
    S.flags.alchemyBuff.rate = Math.max(S.flags.alchemyBuff.rate || 0, pill.effect.rate || 0);
    S.flags.alchemyBuff.output = Math.max(S.flags.alchemyBuff.output || 0, pill.effect.output || 0);
    log(`【凝火丹】炼丹成功率 +${(S.flags.alchemyBuff.rate * 100).toFixed(0)}%，产出 +${S.flags.alchemyBuff.output}。`, "c-gold");
  }
}

function processDailyAlchemyBuff() {
  if (S.flags.alchemyBuff) {
    delete S.flags.alchemyBuff;
  }
}
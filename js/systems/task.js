/* ============================================================
   systems/task.js - 任务系统
   ============================================================ */

/* ============================================================
   接取任务
   ============================================================ */
function acceptTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) { log("任务不存在。", "c-bad"); return; }

  /* 检查当前是否有未完成任务 */
  if (S.flags.activeTasks && S.flags.activeTasks.length > 0) {
    showModal("任务冲突", `
      <p>你有未完成的任务，必须先完成才能接取新任务。</p>
    `, [{ label: "好", fn: closeModal }]);
    return;
  }

  /* 初始化 */
  if (!S.flags.activeTasks) S.flags.activeTasks = [];
  S.flags.activeTasks.push({
    id: task.id,
    startDay: S.day,
    expireDay: S.day + (task.deadline || 3),
    progress: 0,
  });

  log(`【任务】接取了任务：${task.name}`, "c-gold");
  save(); render();

  showModal("接取任务", `
    <p>已接取任务：<b>${task.name}</b></p>
    <p class="small">${task.desc}</p>
    <p class="small">截止日期：第 ${S.day + (task.deadline || 3)} 天</p>
  `, [{ label: "知道了", fn: closeModal }]);
}

/* ============================================================
   完成任务
   ============================================================ */
function completeTask(taskId) {
  if (!S.flags.activeTasks) return;
  const task = getTaskById(taskId);
  const idx = S.flags.activeTasks.findIndex(t => t.id === taskId);
  if (idx < 0) return;

  S.flags.activeTasks.splice(idx, 1);

  /* 发放奖励 */
  const r = task.rewards || {};
  const detail = [];

  if (r.stone) { S.stone += r.stone; detail.push(`灵石 +${r.stone}`); }
  if (r.contrib) { S.contrib += r.contrib; detail.push(`贡献 +${r.contrib}`); }
  if (r.exp) { S.exp += r.exp; detail.push(`修为 +${r.exp}`); }
  if (r.items) {
    for (const id in r.items) {
      /* ★ 如果是模板 id（如 "回春丹_2阶"），先 getOrCreatePillItem 注册 */
      let finalId = id;
      if (ITEMS[id] && ITEMS[id].type === "pillTemplate" && typeof getOrCreatePillItem === "function") {
        const item = getOrCreatePillItem(id, 1);
        if (item && item.id) finalId = item.id;
      } else if (!ITEMS[id] && typeof getOrCreatePillItem === "function") {
        const mPill = String(id).match(/^(.*?)_(\d+)品$/);
        const item = mPill ? getOrCreatePillItem(mPill[1], parseInt(mPill[2], 10)) : getOrCreatePillItem(id, 1);
        if (item && item.id) finalId = item.id;
      }
      addItem(finalId, r.items[id]);
      const itObj = (typeof getItem === "function" ? getItem(finalId) : null) || ITEMS[finalId];
      const name = itObj ? itObj.name : finalId;
      detail.push(`${name} ×${r.items[id]}`);
    }
  }

  log(`【任务完成】${task.name}`, "c-gold");
  save(); render();
  showActionModal(`任务完成 · ${task.name}`, detail);
}

/* ============================================================
   失败任务（每日检查）
   ============================================================ */
function checkExpiredTasks() {
  if (!S.flags.activeTasks || S.flags.activeTasks.length === 0) return;

  const expired = [];
  S.flags.activeTasks.forEach(t => {
    if (S.day >= t.expireDay) {
      expired.push(t);
    }
  });

  if (expired.length === 0) return;

  expired.forEach(t => {
    const task = getTaskById(t.id);
    if (!task) return;

    /* 扣惩罚 */
    const p = task.penalty || {};
    if (p.stone) S.stone = Math.max(0, S.stone - p.stone);
    if (p.contrib) S.contrib = Math.max(0, S.contrib - p.contrib);
    if (p.mood) S.mood = Math.max(-2, S.mood + p.mood);

    log(`【任务失败】${task.name}（未完成）`, "c-bad");

    /* 从激活列表移除 */
    const idx = S.flags.activeTasks.findIndex(x => x.id === t.id);
    if (idx >= 0) S.flags.activeTasks.splice(idx, 1);
  });

  save();
}

/* ============================================================
   宗门巡逻（随机战斗）
   ============================================================ */
function doPatrol() {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }
  S.actionsUsed++;

  /* 30% 概率遇敌 */
  if (chance(0.3)) {
    const enemy = pick(FIGHT_ENEMIES.normal);
    log(`【巡逻】你遇到了一只 ${enemy.name}！`, "c-bad");
    showModal("巡逻遇敌", `
      <p>守卫山脚时，突然出现一只<b>${enemy.name}</b>！</p>
    `, [
      { label: "迎战", primary: true, fn: () => {
        closeModal();
        startBattle([{ enemyId: enemy.id }]);
      }},
    ]);
  } else {
    log("【巡逻】山脚一切平静。", "c-dim");
    showActionModal("巡逻", ["山脚平静无事"]);
    consumeAction();
  }
}

/* ============================================================
   传功堂听讲（周末宗门传功大典）
   ============================================================ */
function doListenLecture() {
  if (S.weekday !== 0 && S.weekday !== 6) {
    log("传功大典仅在周末（周六/周日）开坛讲道。", "c-bad");
    return;
  }
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }
  if (S.flags.listenedDay === S.day) {
    log("今日已入座聆听长老讲道，不可贪多务得。", "c-bad");
    return;
  }

  S.actionsUsed++;
  S.flags.listenedDay = S.day;

  /* 涨所有基本功 +2~3 */
  const detail = [];
  SKILLS.forEach(k => {
    if (!S.skills[k]) S.skills[k] = { lvl: 0, exp: 0 };
    const inc = rndInt(2, 3);
    S.skills[k].exp += inc;
    while (S.skills[k].exp >= SKILL_LVL_EXP && S.skills[k].lvl < MAX_SKILL_LVL) {
      S.skills[k].exp -= SKILL_LVL_EXP;
      S.skills[k].lvl++;
    }
  });
  detail.push("所有兵刃拳脚技能 +2~3 经验");

  /* 涨当前心法熟练度 +5 与修为经验 +60 */
  const art = getCurrentArt();
  if (art) {
    const prog = getArtProgress(art.id);
    prog.proficiency = Math.min(100, prog.proficiency + 5);
    detail.push(`当前心法熟练度 +5`);
  }
  const expGain = rndInt(40, 70);
  if (typeof gainCultivationExp === "function") gainCultivationExp(expGain);
  detail.push(`领悟天道玄音：修为经验 +${expGain}`);
  S.dao = (S.dao || 0) + 1;
  detail.push(`道心 +1`);

  log(`【传功大典】聆听长老玄音灌顶，修为经验 +${expGain}，道心 +1，诸法精进！`, "c-gold");
  consumeAction(() => showActionModal("传功大典听讲", detail));
}

/* 周的 key（用于判断本周是否听讲） */
function getWeekKey() {
  const d = getDateInfo();
  return `${d.year}-W${Math.floor(S.day / 7)}`;
}
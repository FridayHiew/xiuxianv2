/* ============================================================
   systems/chores.js - 杂务 / 日常
   ============================================================ */

/* 杂务熟练度增长 +0.5~1.0，有工具 +0.5 */
function gainChoreSkill(chore, amount = 1) {
  const cur = S.choreSkill[chore.id] || 0;
  let inc = rnd(0.5, 1.0) * amount;

  for (const tid in S.tools) {
    const tool = ITEMS[tid];
    if (tool && tool.chore === chore.id) inc += 0.5 * amount;
  }

  inc = +inc.toFixed(2);
  S.choreSkill[chore.id] = Math.min(100, +(cur + inc).toFixed(2));

  const skillGains = [];
  for (const k in chore.gain) {
    if (S.skills[k]) {
      S.skills[k].exp = +(S.skills[k].exp + chore.gain[k] * amount).toFixed(2);
      let leveled = false;
      while (S.skills[k].exp >= SKILL_LVL_EXP && S.skills[k].lvl < MAX_SKILL_LVL) {
        S.skills[k].exp = +(S.skills[k].exp - SKILL_LVL_EXP).toFixed(2);
        S.skills[k].lvl++;
        log(`【技能提升】你的 ${k} 提升到 Lv.${S.skills[k].lvl}！`, "c-gold");
        leveled = true;
      }
      skillGains.push(`${k} +${(chore.gain[k] * amount).toFixed(1)}${leveled ? " (升级!)" : ""}`);
    }
  }
  return { inc, skillGains };
}

/* 执行今日杂务 */
function doChore() {
  const q = S.dailyQuest;
  if (!q || q.done >= q.amount) { log("今日杂务已完成。", "c-normal"); return; }
  if (S.actionsUsed >= ACTIONS_PER_SLOT) { log("本时段行动已用完。", "c-bad"); return; }
  if (S.hour === 2) { log("晚上不做杂务。", "c-bad"); return; }

  const remain = ACTIONS_PER_SLOT - S.actionsUsed;
  const todo = Math.min(q.amount - q.done, remain);

  const chore = q.chore;
  const actualNeed = calcChoreActions(todo, remain);

  let totalInc = 0;
  const detail = [];
  for (let i = 0; i < todo; i++) {
    q.done++;
    const { inc } = gainChoreSkill(chore, 1);
    totalInc += inc;
  }
  S.actionsUsed += actualNeed;
  S.choresUsedTotal = (S.choresUsedTotal || 0) + todo;
  if (typeof triggerDailyTask === "function") triggerDailyTask("chore");

  const rank = S.flags.rank || "杂务";
  if (rank !== "杂务") {
    S.contrib += 1;
  }

  const isCompleted = q.done >= q.amount;

  if (isCompleted) {
    log(`今日【${chore.name}】已全部完成，熟练度 +${totalInc.toFixed(1)}%。`, "c-good");
  } else {
    log(`执行【${chore.name}】，熟练度 +${totalInc.toFixed(1)}%（${q.done}/${q.amount}）。`, "c-normal");
  }

  if (typeof checkAdvanceTimeSlot === "function") {
    checkAdvanceTimeSlot();
  } else if (S.actionsUsed >= ACTIONS_PER_SLOT && S.hour < 2) {
    S.hour++;
    S.actionsUsed = 0;
    log(`【时间】进入${HOURS[S.hour]}。`, "c-blue");
    if (S.hour === 2) setTimeout(() => { nightPrompt(); }, 300);
  }

  save(); render();

  if (isCompleted) {
    showActionModal("杂务圆满", [
      `今日【${chore.name}】已全部完成！`,
      `熟练度 +${totalInc.toFixed(1)}%`,
      rank !== "杂务" ? "宗门贡献 +1" : "今日免费用膳资格已获得",
    ]);
  }
}

/* 打零工 */
function doPartTime() {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) { log("本时段行动已用完。", "c-bad"); return; }
  S.actionsUsed++;
  S.choresUsedTotal = (S.choresUsedTotal || 0) + 1;
  if (typeof triggerDailyTask === "function") triggerDailyTask("chore");
  const rank = S.flags.rank || "杂务";
  const chores = rank === "杂务" ? CHORES_FAN : rank === "门外" ? CHORES_MENWAI : CHORES_MENNEI;
  const chore = pick(chores);
  const { inc, skillGains } = gainChoreSkill(chore, 1);

  let moneyGain = 0, stoneGain = 0;
  const art = getCurrentArt();
  const moneyBonus = (art && art.bonus && art.bonus.money) ? art.bonus.money : 0;

  if (isStoneTier()) {
    stoneGain = Math.floor(rndInt(3, 8) * (1 + moneyBonus));
    S.stone += stoneGain;
  } else {
    moneyGain = Math.floor(rndInt(2, 6) * (1 + moneyBonus));
    S.money += moneyGain;
  }

  log(`你打了一份零工（${chore.name}）。`, "c-normal");
  const detail = [`零工：${chore.name}`, `熟练 +${inc}（${S.choreSkill[chore.id].toFixed(2)}%）`];
  skillGains.forEach(s => detail.push(`技能 ${s}`));
  if (stoneGain > 0) detail.push(`灵石 +${stoneGain}`);
  if (moneyGain > 0) detail.push(`铜钱 +${moneyGain}`);

  consumeAction(() => showActionModal("打零工", detail));
}

/* 清晨执事安排任务 */
function morningPrompt() {
  if (morningPrompted) return;
  if (S.hour !== 0) return;
  if (S.dailyQuest) return;
  morningPrompted = true;

  /* ★ 周末不应该有杂务，宗门传功取代今日任务 */
  const isWeekend = S.weekday === 0 || S.weekday === 6;
  if (isWeekend) {
    S.dailyQuest = null;
    log(`【宗门法筵】今日为周${WEEKDAYS[S.weekday]}休沐，执事堂不设杂务。宗门传功取代今日任务，诸位弟子可前往听法受业！`, "c-gold");
    return;
  }

  const rank = S.flags.rank || "杂务";
  let chores;

  if (rank === "杂务") chores = CHORES_FAN;
  else if (rank === "门外") chores = CHORES_MENWAI;
  else {
    /* 门内/真传：按峰分配 */
    chores = CHORES_MENNEI;
    if (S.peak === "luoxia") chores = [CHORES_MENNEI.find(c => c.id === "lianyao")];       // 落霞峰-炼丹
    else if (S.peak === "wenjian") chores = [CHORES_MENNEI.find(c => c.id === "lianqi")];   // 问剑峰-炼器
    else if (S.peak === "wangyue") chores = [CHORES_MENNEI.find(c => c.id === "zhenfa")];   // 望月峰-阵法
    else if (S.peak === "tingtao") chores = [CHORES_MENNEI.find(c => c.id === "xunshou")];  // 听涛峰-御兽
    else chores = CHORES_MENNEI;
    chores = chores.filter(Boolean);
  }

  const chore = pick(chores);

  let giver;
  if (rank === "杂务") {
    giver = S.npcs.find(n => n.role === "执事" && n.alive);
  } else {
    giver = S.npcs.find(n => (n.role === "长老" || n.role === "峰主" || n.role === "门外长老") && n.alive);
  }

  let amount;
  if (giver) {
    if (giver.aff >= 70) amount = rndInt(1, 3);
    else if (giver.aff >= 40) amount = rndInt(3, 6);
    else if (giver.aff >= 20) amount = rndInt(5, 9);
    else amount = rndInt(8, 12);
  } else {
    amount = rndInt(4, 8);
  }
  S.dailyQuest = { chore, amount, done: 0 };

  const quoteFn = pick(ZHISHI_QUOTES);
  const q = quoteFn(amount, chore.name);
  log(`【${giver ? giver.role : "长老"}】今日安排：${chore.name} ×${amount}。`, "c-gold");

  showModal(`${giver ? giver.role : "长老"}安排`, `
    <p>${giver ? giver.name : "长老"}：</p>
    <p class="${q.tone}" style="font-size:14px;">${q.text}</p>
    <p class="small">今日任务：<b>${chore.name} × ${amount}</b></p>
  `, [{ label: "知道了", fn: () => { closeModal(); render(); } }]);
}

/* 夜晚晚餐 */
function nightPrompt() {
  if (nightPrompted) return;
  if (S.hour !== 2) return;
  nightPrompted = true;

  const done = S.dailyQuest && S.dailyQuest.done >= S.dailyQuest.amount;
  const isWeekend = S.weekday === 0 || S.weekday === 6;
  const canFree = done || isWeekend;

  let body, actions;
  if (canFree) {
    body = `<p>傍晚的食堂热气腾腾，灵香扑鼻。</p><p>${isWeekend ? '周末休沐法筵，宗门犒赏弟子，' : '今日杂务圆满，'}<b>可免费享用灵膳</b>。</p>`;
    actions = [{ label: "享用灵膳（免费）", fn: () => { eatDinner(true); } }];
  } else {
    const cur = getCurrency();
    if (cur >= 50) {
      body = `<p>暮色苍茫，宗门炊烟袅袅。</p>
        <p>今日杂务未毕，用膳需付 <b>50 ${currencyName()}</b>。</p>
        <p class="small">囊中结余：${cur} ${currencyName()}</p>`;
      actions = [
        { label: `付 50 ${currencyName()}用膳`, fn: () => { eatDinner(false); } },
        { label: "回屋调息", fn: () => { skipDinner(); } },
      ];
    } else {
      body = `<p>暮色苍茫，囊中结余不足用膳，只能先行回洞府调息辟谷。</p>`;
      actions = [{ label: "回洞府调息", fn: () => { skipDinner(); } }];
    }
  }
  showModal("膳堂晚膳", body, actions);
}

function eatDinner(free) {
  const cost = 50;
  if (!free) {
    if (!spendCurrency(cost)) {
      log("钱不够。", "c-bad");
      closeModal(); render();
      return;
    }
  }

  S.mood = Math.min(2, S.mood + 1);
  S.flags.hungerStreak = 0;

  const hpGain = Math.floor(totalMaxHp() * 0.1);
  const mpGain = Math.floor(totalMaxMp() * 0.1);
  S.hp = Math.min(totalMaxHp(), S.hp + hpGain);
  S.mp = Math.min(totalMaxMp(), S.mp + mpGain);

  log(`你在食堂吃了一顿晚餐，心情 +1，气血 +${hpGain}，灵力 +${mpGain}。`, "c-good");

  const detail = [
    `心情 +1`,
    free ? "免费" : `${currencyName()} -${cost}`,
    `气血 +${hpGain}`,
    `灵力 +${mpGain}`,
  ];

  if (chance(0.4)) {
    const npc = pickAliveNPC();
    if (npc) {
      npc.aff += 2;
      S.metNpcs[npc.id] = true;
      log(`你在食堂遇到 ${npc.name}，聊了几句，好感+2。`, "c-blue");
      detail.push(`遇到 ${npc.name}，好感 +2`);
    }
  }

  closeModal();
  showActionModal("晚餐", detail, () => {
    save(); render();
    /* ★ 平缓过渡，避免过快跳转 */
    setTimeout(() => hobbyPrompt(), 900);
  });
}

/*
   ★ 辟谷丹修复：辟谷期间无饥饿惩罚
*/
function skipDinner() {
  /* 辟谷丹生效：不扣心情，不累加饥饿天数 */
  if (S.flags.fastingDays && S.flags.fastingDays > 0) {
    S.flags.fastingDays--;
    log(`【辟谷】辟谷中，无饥饿惩罚（剩余 ${S.flags.fastingDays} 天）。`, "c-good");
    closeModal();
    showActionModal("辟谷", [
      `辟谷中，无饥饿惩罚`,
      `剩余 ${S.flags.fastingDays} 天`,
    ], () => {
      save(); render();
      setTimeout(() => hobbyPrompt(), 900);
    });
    return;
  }

  S.mood = Math.max(-2, S.mood - 1);
  S.flags.hungerStreak = (S.flags.hungerStreak || 0) + 1;
  log(`你饿着肚子回到屋里。心情-1（连续 ${S.flags.hungerStreak} 天）`, "c-bad");

  const detail = ["心情 -1", `连续饿肚子 ${S.flags.hungerStreak} 天`];
  if (S.flags.hungerStreak >= 3) {
    S.hp -= 10;
    log(`【虚弱】气血 -10。`, "c-bad");
    detail.push("虚弱：气血 -10");
    if (S.hp <= 0) { closeModal(); die("饥寒交迫，倒在了屋中。"); return; }
  }
  closeModal();
  showActionModal("饿肚子", detail, () => {
    save(); render();
    setTimeout(() => hobbyPrompt(), 900);
  });
}

/* 爱好（35% 触发，带插图与5秒倒计时确认） */
function hobbyPrompt() {
  if (hobbyPrompted) return;
  hobbyPrompted = true;
  if (!S.hobbies || S.hobbies.length === 0) return;
  if (!chance(0.35)) return;

  const remain = ACTIONS_PER_SLOT - S.actionsUsed;
  if (remain <= 0) return;

  const hobby = pick(S.hobbies);
  const quote = HOBBY_QUOTES[hobby] || `你花时间在【${hobby}】上，神思悠远，心平气和。`;
  S.actionsUsed++;
  S.hobbySkill[hobby] = Math.min(100, (S.hobbySkill[hobby] || 0) + rnd(0.1, 0.5));
  S.mood = Math.min(2, S.mood + 1);

  log(`【爱好】你花时间在【${hobby}】上。`, "c-pink");
  log(`  心情 +1，${hobby} 熟练度提升。`, "c-good");

  save(); render();

  /* 弹出晚膳后爱好模态框，带视觉插图和5秒倒计时限制 */
  const hobbyBody = `
    <div style="margin-bottom:12px; border-radius:8px; overflow:hidden; border:1px solid var(--border-gold); position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
      <img src="./src/assets/images/cave_cultivation_1792114544316.jpg" style="width:100%; height:135px; object-fit:cover; display:block;" alt="${hobby}">
      <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(14,10,7,0.95)); padding:8px 12px; color:#f0d080; font-family:var(--font-serif); font-size:14px; font-weight:600;">
        🏮 暮色余晖 · 闲雅【${hobby}】
      </div>
    </div>
    <p style="font-size:13.5px; line-height:1.6; color:#c4b494; margin-bottom:10px;">${quote}</p>
    <div style="background:rgba(0,0,0,0.3); border:1px solid #3d2f1f; border-radius:6px; padding:8px 12px; font-size:12px; color:#d8b878; margin-bottom:14px;">
      ✨ 心情 +1 · ${hobby} 熟练度提升 · 消耗 1 行动（剩 ${ACTIONS_PER_SLOT - S.actionsUsed}）
    </div>
    <div style="text-align:center;">
      <button id="hobbyCountdownBtn" class="primary block" disabled style="opacity:0.6; cursor:not-allowed; padding:10px; font-size:14px;">
        ⏳ 品味闲情 (5s)
      </button>
    </div>
  `;

  showModal(`晚餐后 · ${hobby}`, hobbyBody, []);

  // 5 秒倒计时逻辑
  let cd = 5;
  const btn = document.getElementById("hobbyCountdownBtn");
  const timer = setInterval(() => {
    cd--;
    const currentBtn = document.getElementById("hobbyCountdownBtn");
    if (!currentBtn) {
      clearInterval(timer);
      return;
    }
    if (cd > 0) {
      currentBtn.innerText = `⏳ 品味闲情 (${cd}s)`;
    } else {
      clearInterval(timer);
      currentBtn.innerText = "✨ 怡然领受 · 收心安歇";
      currentBtn.disabled = false;
      currentBtn.style.opacity = "1";
      currentBtn.style.cursor = "pointer";
      currentBtn.onclick = () => {
        closeModal();
        render();
      };
    }
  }, 1000);
}

/* 月俸（15 天一次） */
function checkMonthlyPay() {
  if (S.day > 0 && S.day % 15 === 0 && S.flags.lastPayDay !== S.day) {
    const rank = S.flags.rank || "杂务";
    const realmMultiplier = 1 + S.realm * 0.5;
    const basePay = RANK_PAY[rank] || 10;
    const pay = Math.floor(basePay * realmMultiplier);
    addCurrency(pay);
    S.flags.lastPayDay = S.day;
    log(`【月俸】第 ${S.day} 天，你领取了俸禄：${pay} ${currencyName()}。`, "c-gold");
  }
}

/* 节日 */
function checkFestival() {
  const fest = getFestival();
  if (!fest) return;
  const di = getDateInfo();
  const key = `${di.year}-${fest.name}`;
  if (S.flags.festivalYear[key]) return;
  S.flags.festivalYear[key] = true;

  const rank = S.flags.rank || "杂务";
  const base = FESTIVAL_BASE;
  const rankBonus = FESTIVAL_RANK_BONUS[rank] || 10;
  const contribBonus = Math.floor(S.contrib * 0.1 * rnd(0.5, 1.5));
  const amount = base + rankBonus + contribBonus;

  if (rank === "杂务") {
    S.money += amount;
    log(`【节日·${fest.name}】宗门派发 ${amount} 铜钱！`, "c-gold");
    showModal(`节日 · ${fest.name}`, `
      <p>今日是<b>${fest.name}</b>，宗门大派利是。</p>
      <p>你收到 <b>${amount} 铜钱</b>（基础 ${base} + 身份 ${rankBonus} + 贡献 ${contribBonus}）。</p>
      <p class="small">祝你${fest.bonus}愉快！</p>
    `, [{ label: "谢谢", fn: closeModal }]);
  } else {
    S.stone += amount;
    log(`【节日·${fest.name}】宗门派发 ${amount} 灵石！`, "c-gold");
    showModal(`节日 · ${fest.name}`, `
      <p>今日是<b>${fest.name}</b>，宗门大派利是。</p>
      <p>你收到 <b>${amount} 灵石</b>（基础 ${base} + 身份 ${rankBonus} + 贡献 ${contribBonus}）。</p>
      <p class="small">祝你${fest.bonus}愉快！</p>
    `, [{ label: "谢谢", fn: closeModal }]);
  }
}
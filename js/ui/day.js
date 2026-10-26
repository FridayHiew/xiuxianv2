/* ============================================================
   ui/day.js - 日常仙镇水墨面板 (参照上传图2：水墨城镇 + 圆形印章交互)
   ============================================================ */

function hourLabelHTML() {
  const cls = S.hour === 0 ? "h-morning" : S.hour === 1 ? "h-noon" : "h-night";
  return `<span class="hour-label ${cls}">${HOURS[S.hour]}</span>`;
}

function renderDay() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const isMennei = RANKS.indexOf(rank) >= 2;
  const dq = S.dailyQuest;
  const dqDone = dq ? dq.done >= dq.amount : true;
  const dqText = dq
    ? `今日指派：${dq.chore.name}（${dq.done}/${dq.amount}）`
    : "今日杂务已毕";

  const activeTasks = (S.flags && S.flags.activeTasks) || [];

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻时辰牌匾与小圆章 HUD -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">日常</span>
            第 ${S.day} 天 · 周${WEEKDAYS[S.weekday]} ${hourLabelHTML()}
          </div>
          <div class="plaque-sub">本时段剩余行动：<b>${remain}/${ACTIONS_PER_SLOT}</b> · ${dqText}</div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal glow" onclick="switchTab('story')" title="主线道途">
            <span>道途</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="switchTab('social')" title="仙友同道">
            <span>仙友</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="openDebugModal()" title="测试与调试秘术">
            <span>玄机</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的宽幅仙镇日常长卷 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="center">
        <div class="ink-scene-canvas day-town-panorama ink-panorama-world">
          <img class="ink-scene-bg" src="./src/assets/images/alchemy_pavilion_1792114547274.jpg" alt="仙门坊镇日常画卷" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">仙门日常</div>

          <!-- 左街坊镇圆章：今日杂务、宗门任务、山门巡弋 -->
          <button type="button" class="ink-seal-node pos-tl ${!dqDone && S.hour !== 2 && remain > 0 ? 'glow-node' : ''}" onclick="onDayChoreNodeClick()">
            <span class="node-char">
              务
              <em class="seal-red-stamp">${!dqDone ? `${dq.done}/${dq.amount}` : '已毕'}</em>
            </span>
            <span class="node-caption">${!dqDone ? dq.chore.name : '今日杂务'}</span>
            <span class="node-sub-hint">每日指派差事</span>
          </button>

          <button type="button" class="ink-seal-node pos-ml" onclick="${rank === '杂务' ? 'openChoreSelector()' : 'openTaskSelector()'}">
            <span class="node-char">
              令
              <em class="seal-red-stamp">${rank === '杂务' ? '劳作' : '悬赏'}</em>
            </span>
            <span class="node-caption">${rank === '杂务' ? '自由劳作' : `宗门任务${activeTasks.length ? '(' + activeTasks.length + ')' : ''}`}</span>
            <span class="node-sub-hint">赚取铜钱贡献</span>
          </button>

          <button type="button" class="ink-seal-node pos-bl" onclick="openDailyPatrolOrLectureModal()">
            <span class="node-char">
              巡
              <em class="seal-red-stamp">${S.weekday === 0 ? '讲道' : '巡山'}</em>
            </span>
            <span class="node-caption">${S.weekday === 0 ? '传功听讲' : '山门巡弋'}</span>
            <span class="node-sub-hint">长老讲道与巡查</span>
          </button>

          <!-- 中央镇心台：夜晚安歇或主线快捷卷轴 -->
          <div class="day-center-stage">
            ${S.hour === 2 ? `
              <button type="button" class="day-sleep-seal-btn ${remain <= 0 ? 'pulse' : ''}" onclick="sleepToNextDay()">
                <span class="sleep-moon">🌙</span>
                <span class="sleep-txt">${remain <= 0 ? '夜深安歇 · 迎明日朝阳' : '提前安歇入梦'}</span>
              </button>
            ` : `
              <div class="day-center-banner" onclick="switchTab('story')" title="点击查看主线道途">
                <div class="dcb-title">📜 仙途机缘 · 尘世历心</div>
                <div class="dcb-sub">左右滑动长卷查看各项日常差事与演武修行，或点此推进主线剧情 ▸</div>
              </div>
            `}
          </div>

          <!-- 右街演武圆章：吐纳修炼、演武百艺、下山游历 -->
          <button type="button" class="ink-seal-node pos-tr" onclick="gotoCultivate()">
            <span class="node-char">
              修
              <em class="seal-red-stamp">周天</em>
            </span>
            <span class="node-caption">吐纳修炼</span>
            <span class="node-sub-hint">精进心法修为</span>
          </button>

          <button type="button" class="ink-seal-node pos-mr" onclick="openDailyPracticeModal()">
            <span class="node-char">
              武
              <em class="seal-red-stamp">百艺</em>
            </span>
            <span class="node-caption">演武百艺</span>
            <span class="node-sub-hint">同门切磋与研习</span>
          </button>

          <button type="button" class="ink-seal-node pos-br ${!isMennei ? 'locked-node' : ''}" onclick="openDailyExploreOrSecludeModal()">
            <span class="node-char">
              探
              <em class="seal-red-stamp">${isMennei ? '红尘' : '内门'}</em>
            </span>
            <span class="node-caption">${rank === '真传' ? '游历/闭关' : '下山游历'}</span>
            <span class="node-sub-hint">山外红尘寻访机缘</span>
          </button>
        </div>
      </div>

      <!-- 底部横向长卷导览罗盘 -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn" data-pos="left" onclick="panPanorama('left')">◀ 西坊·差事</button>
        <button type="button" class="pano-compass-btn active" data-pos="center" onclick="panPanorama('center')">🏮 镇心·仙途</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">东苑·演武 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}

function onDayChoreNodeClick() {
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  if (S.hour === 2) {
    showModal("🌙 夜色已深", `<p>夜间执事堂已歇，无法交接今日指派杂务。你可打坐吐纳或安歇入梦。</p>`, [{ label: "知晓了", fn: closeModal }]);
    return;
  }
  if (S.dailyQuest && S.dailyQuest.done < S.dailyQuest.amount) {
    if (remain <= 0) {
      log("本时段行动已用完。", "c-bad");
      return;
    }
    doChore();
  } else {
    openChoreSelector();
  }
}

function openDailyPatrolOrLectureModal() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const actions = [];

  if (S.weekday === 0 && remain > 0) {
    actions.push({
      label: "📖 传功堂听讲 (耗1行动)",
      primary: true,
      fn: () => { closeModal(); doListenLecture(); }
    });
  }
  if (RANKS.indexOf(rank) >= 1 && remain > 0) {
    actions.push({
      label: "🛡️ 宗门巡逻 (耗1行动)",
      primary: actions.length === 0,
      fn: () => { closeModal(); doPatrol(); }
    });
  }
  actions.push({ label: "返回", fn: closeModal });

  showModal("⛩️ 山门巡弋与讲道", `
    <p>今日为<b>周${WEEKDAYS[S.weekday]}</b>，本时段剩余行动：<b>${remain}</b>。</p>
    <p class="small">· 门外及以上弟子可参与【宗门巡逻】获取宗门贡献与偶遇机缘。<br>· 每逢周日，长老于传功堂开坛讲道，听讲可获修为与心法感悟。</p>
  `, actions);
}

function openDailyPracticeModal() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const actions = [];

  if (rank !== "杂务" && remain > 0) {
    actions.push({
      label: "⚔️ 同门对练基本功 (耗1行动)",
      primary: true,
      fn: () => { closeModal(); doDuel(); }
    });
  }
  if (RANKS.indexOf(rank) >= 2 && remain > 0) {
    actions.push({
      label: "📜 研习修真百艺 (耗1行动)",
      fn: () => { closeModal(); doAction("practice"); }
    });
  }
  actions.push({ label: "查看百艺熟练", fn: () => { closeModal(); openProfileSubModal("法术"); } });
  actions.push({ label: "返回", fn: closeModal });

  showModal("⚔️ 演武场与百艺研习", `
    <p>演武场上剑气纵横，弟子们正在切磋武学与修真百艺（剩余行动：<b>${remain}</b>）。</p>
    <p class="small">· 门外及以上弟子可与同门【对练基本功】提升兵刃拳脚熟练。<br>· 门内及以上弟子可【练习技能】精进炼丹、炼器、阵法等百艺。</p>
  `, actions);
}

function openDailyExploreOrSecludeModal() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  if (RANKS.indexOf(rank) < 2) {
    showModal("🔒 山门禁令", `<p>需晋升【门内弟子】后方可获准独自下山红尘游历探索。</p>`, [{ label: "知晓了", fn: closeModal }]);
    return;
  }

  const actions = [];
  if (remain > 0) {
    actions.push({
      label: "🌄 下山红尘探索 (耗1行动)",
      primary: true,
      fn: () => { closeModal(); doAction("explore"); }
    });
  }
  if (rank === "真传" && remain > 0) {
    actions.push({
      label: "🧘 潜心闭关苦修",
      fn: () => { closeModal(); openSeclusion(); }
    });
  }
  actions.push({ label: "前往九州历练图", fn: () => { closeModal(); switchTab("adventureMap"); } });
  actions.push({ label: "返回", fn: closeModal });

  showModal("🌄 下山游历与闭关", `
    <p>山外红尘广阔，偶有奇遇机缘（剩余行动：<b>${remain}</b>）。</p>
  `, actions);
}

function openDebugModal() {
  showModal("🛠️ 洞察玄机 · 测试与调试秘术", `
    <p class="small">以下为开发者快捷调试指令，点击立即生效：</p>
    <div class="debug-btn-grid" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
      <button class="debug" onclick="debugComplete()">圆满当前心法</button>
      <button class="debug" onclick="debugAddProficiency()">熟练度满</button>
      <button class="debug" onclick="debugAddMoney()">铜钱 +1000</button>
      <button class="debug" onclick="debugAddStone()">灵石 +1000</button>
      <button class="debug" onclick="debugAddContrib()">贡献 +100</button>
      <button class="debug" onclick="debugAddFragment()">随机残卷</button>
      <button class="debug" onclick="toggleDebugRoot()">显示灵根</button>
      <button class="debug" onclick="closeModal(); debugStartBattleMulti()">测试群战</button>
      <button class="debug" onclick="closeModal(); debugStartBattle()">测试战斗</button>
      <button class="debug" onclick="debugFullHeal()">气血灵力全满</button>
      <button class="debug" onclick="debugPromoteToMennei()">晋升门内</button>
      <button class="debug" onclick="closeModal(); debugAddMaterial()">加材料</button>
      <button class="debug" onclick="closeModal(); debugAddRecipe()">加丹方</button>
      <button class="debug" onclick="closeModal(); debugResetGame()" style="background:#5a1a1a; border-color:#903030;">清空数据重置</button>
    </div>
  `, [{ label: "关闭", fn: closeModal }]);
}

function gotoCultivate() {
  const mainHomeTabs = ["profile", "adventureMap", "day", "sect", "cave", "bag"];
  if (mainHomeTabs.includes(currentTab)) {
    lastMainTab = currentTab;
  }
  currentTab = "cultivatePage";
  render();
}

function doAction(type) {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }
  if (type === "partTime") return doPartTime();
  else if (type === "explore") {
    const rank = S.flags.rank || "杂务";
    if (RANKS.indexOf(rank) < 2) { log("你还未获准下山。", "c-bad"); return; }
    S.actionsUsed++;
    doExplore();
  }
  else if (type === "garden") {
    S.actionsUsed++;
    /* 药园收获：按玩家境界掉 1~3 品材料 */
    const count = rndInt(1, 3);
    const range = getMaterialGradeRange();
    /* 药园偏向低级材料 */
    const grade = Math.min(range.max, Math.max(1, range.min));
    const matBase = pick(["洗骨花", "草木灰", "清泉水"]);
    const itemId = `${matBase}_${grade}`;
    addItem(itemId, count);
    const item = ITEMS[itemId];
    const gradeText = item && item.grade ? `${item.grade}品` : "";
    log(`你打理药园，收获 ${item ? item.name : matBase}${gradeText} ×${count}。`, "c-good");
    consumeAction(() => showActionModal("打理药园", [
      `收获：${item ? item.name : matBase}（${gradeText}）×${count}`,
    ]));
  }
  else if (type === "practice") {
    S.actionsUsed++;
    const k = pick(SKILLS);
    let inc = rnd(0.05, 0.2);
    const art = getCurrentArt();
    if (art && art.bonus) {
      if (art.bonus.skill === k) inc *= (1 + art.bonus.bonus);
      else if (art.bonus.all) inc *= (1 + art.bonus.all);
    }
    inc = +inc.toFixed(2);
    S.skills[k].exp = +(S.skills[k].exp + inc).toFixed(2);
    let leveled = false;
    while (S.skills[k].exp >= SKILL_LVL_EXP && S.skills[k].lvl < MAX_SKILL_LVL) {
      S.skills[k].exp -= SKILL_LVL_EXP;
      S.skills[k].lvl++;
      log(`【技能提升】你的 ${k} 提升到 Lv.${S.skills[k].lvl}！`, "c-gold");
      leveled = true;
    }
    log(`练习 ${k}，熟练 +${inc}。`, "c-normal");
    const detail = [`${k} 熟练 +${inc}（${S.skills[k].exp.toFixed(2)}/100）`];
    if (leveled) detail.push(`${k} 升级到 Lv.${S.skills[k].lvl}！`);
    consumeAction(() => showActionModal("练习技能 · " + k, detail));
  }
}

function consumeAction(onDone) {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    if (S.hour < 2) {
      S.hour++;
      S.actionsUsed = 0;
      log(`【时间】进入${HOURS[S.hour]}。`, "c-blue");
      if (S.hour === 2) setTimeout(() => { nightPrompt(); }, 300);
    }
  }
  save();
  render();
  if (onDone) onDone();
}

function sleepToNextDay() {
  newDay();
}

/* 新一天 */

function newDay() {
  if (S.dailyQuest && S.dailyQuest.done < S.dailyQuest.amount) {
    const missing = S.dailyQuest.amount - S.dailyQuest.done;
    const zhishi = S.npcs.find(n => n.role === "执事" && n.alive);
    if (zhishi) {
      zhishi.aff = Math.max(0, zhishi.aff - missing * 2);
      log(`【执事】未完成昨日任务，好感 -${missing * 2}。`, "c-bad");
    }
    S.mood = Math.max(-2, S.mood - 1);
  }

  S.dailyQuest = null;
  S.actionsUsed = 0;
  S.flags.breakAttemptedToday = false;
  S.day++;
  S.hour = 0;
  S.weekday = (S.weekday + 1) % 7;
  S.life += 1 / 365;
  morningPrompted = false;
  nightPrompted = false;
  hobbyPrompted = false;

  S.flags.npcDailyInteraction = {};
  S.flags.npcDailyGift = {};
  S.flags.npcDailyDay = S.day;

  /* 仙友羁绊晨间关怀与反哺 */
  if (typeof triggerDailySocialPerks === "function") {
    triggerDailySocialPerks();
  }

  /* ★ 辟谷丹天数递减 */
  if (S.flags.fastingDays && S.flags.fastingDays > 0) {
    S.flags.fastingDays--;
    if (S.flags.fastingDays === 0) {
      log("【辟谷】辟谷结束。", "c-normal");
    }
  }

  /* ★ 隐息丹天数递减（30 天） */
  if (S.flags.reduceEncounter && S.flags.reduceEncounter > 0) {
    S.flags.reduceEncounterDays = (S.flags.reduceEncounterDays || 30) - 1;
    if (S.flags.reduceEncounterDays <= 0) {
      S.flags.reduceEncounter = 0;
      S.flags.reduceEncounterDays = 0;
      log("【隐息丹】效果结束。", "c-normal");
    }
  }

  /* 榜单：重置每日挑战次数 */
  S.flags.dailyChallenge = 0;

  /* 榜单：每日被挑战 */
  if (typeof processDailyRankChallenge === "function") {
    processDailyRankChallenge();
  }

  if (S.life >= S.lifeMax) { die("寿元耗尽，坐化于洞府之中。"); return; }

  /* 处理残留 DOT */
  if (processDailyStatus()) return;

  /* 灵宠日常 */
  const deadPets = processDailyPets();
  if (deadPets.length > 0) {
    setTimeout(() => {
      showModal("灵宠饿死", `<p>${deadPets.map(p => p.name).join("、")} 因饥饿而死。</p>`, [
        { label: "知道了", fn: closeModal }
      ]);
    }, 500);
  }

  /* 逆天宝物日常 */
  if (typeof processDailyHeavenDefying === "function") {
    processDailyHeavenDefying();
  }

  /* 丹药 buff 每日清理 */
  processDailyPillBuff();

  /* 秘境：每月第 5 天检查 */
  if (typeof checkMonthlySecretRealm === "function") {
    checkMonthlySecretRealm();
  }
  if (typeof checkPendingSecretRealmExpire === "function") {
    checkPendingSecretRealmExpire();
  }
  if (typeof checkExpiredTasks === "function") {
    checkExpiredTasks();
  }

  checkMonthlyPay();
  checkFestival();

  /* 宗门小比（每月 15 号） */
  if (typeof checkMonthlyCompetition === "function") {
    checkMonthlyCompetition();
  }

  if (S.day % 365 === 0) {
    log(`【新年】又是一年过去，你已 ${Math.floor(S.life)} 岁。`, "c-gold");
    S.mood = Math.min(2, S.mood + 1);
    refreshNPCs();
  }

  /* 剧情事件 */
  checkSundayEvent();
  checkSectCompetition();
  checkUnionCompetition();
  checkSecretRealm();
  checkMasterDeath();
  checkFinalBattle();

  if (S.flags.story.year1004 && S.flags.story.year1004.final) {
    return;
  }

  morningPrompt();
  render();
}


/* ============================================================
   每日清理丹药 buff
   ============================================================ */

function processDailyPillBuff() {
  /* 修炼 buff：扣天数 */
  if (S.flags.cultivateBuff) {
    S.flags.cultivateBuff.days = (S.flags.cultivateBuff.days || 0) - 1;
    if (S.flags.cultivateBuff.days <= 0) {
      delete S.flags.cultivateBuff;
    }
  }

  /* 血煞丹 buff：扣天数 */
  if (S.flags.bloodRage) {
    S.flags.bloodRage.days = (S.flags.bloodRage.days || 0) - 1;
    if (S.flags.bloodRage.days <= 0) {
      delete S.flags.bloodRage;
    }
  }

  /* 突破加成 buff：一次性，新一天清除 */
  if (S.flags.pillBuff && S.flags.pillBuff.breakBonus) {
    /* 保留，等突破时消耗（见 cultivate.js 的 calcBreakRate） */
    /* 这里不动 */
  }

  /* 炼丹 buff：凝火丹（新一天清除） */
  if (S.flags.alchemyBuff) {
    if (typeof processDailyAlchemyBuff === "function") {
      processDailyAlchemyBuff();
    } else {
      delete S.flags.alchemyBuff;
    }
  }

  /* 炼器 buff */
  if (S.flags.forgeBuff) delete S.flags.forgeBuff;
  if (S.flags.forgeProtect) delete S.flags.forgeProtect;

  /* 灵宠每日 buff 相关（保留） */
}

function checkSickness() {
  const risk = (S.mood < -1 ? 0.1 : 0);
  if (chance(risk)) {
    S.hp -= 10;
    S.mood = Math.max(-2, S.mood - 1);
    log("【生病】气血 -10。", "c-bad");
    if (S.hp <= 0) die("积劳成疾，病逝于床榻。");
  }
}


/* ============================================================
   杂务/任务选择弹窗
   ============================================================ */

function openChoreSelector() {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) { log("行动已用完。", "c-bad"); return; }

  const chores = [
    { id: "chai", name: "砍柴", skill: "刀" },
    { id: "tiao", name: "挑水", skill: "掌" },
    { id: "cai",  name: "种菜", skill: "掌" },
    { id: "ji",   name: "养鸡", skill: "兽" }
  ];

  const html = chores.map(c => `
    <button class="block" onclick="startManualChore('${c.id}')">
      ${c.name}（练${c.skill}）
    </button>
  `).join("");

  showModal("选择杂务", `<p>你要做什么活？</p>${html}`, [
    { label: "取消", fn: closeModal }
  ]);
}

function startManualChore(choreId) {
  closeModal();
  const chore = CHORES_FAN.find(c => c.id === choreId);
  if (!chore) return;

  S.actionsUsed++;
  S.choresUsedTotal = (S.choresUsedTotal || 0) + 1;
  const { inc, skillGains } = gainChoreSkill(chore, 1);

  /* 给一点点铜钱作为打杂收入 */
  const moneyGain = rndInt(2, 6);
  S.money += moneyGain;

  log(`你花了些时间【${chore.name}】。`, "c-normal");
  const detail = [`熟练 +${inc}`, `铜钱 +${moneyGain}`];
  skillGains.forEach(s => detail.push(`技能 ${s}`));

  consumeAction(() => showActionModal("打杂结束", detail));
}

function openTaskSelector() {
  if (S.flags.activeTasks && S.flags.activeTasks.length > 0) {
    showModal("提示", `<p>你有未完成的任务，请先完成。</p>`, [{ label: "好", fn: closeModal }]);
    return;
  }
  
  const available = getAvailableTasks();
  if (available.length === 0) {
    showModal("提示", `<p>当前没有可接取的任务。</p>`, [{ label: "好", fn: closeModal }]);
    return;
  }

  const html = available.map(t => `
    <div class="card">
      <b>${t.name}</b> <span class="tag">截止 ${t.deadline} 天</span>
      <div class="small">${t.desc}</div>
      <button class="block" onclick="closeModal(); acceptTask('${t.id}')">接取任务</button>
    </div>
  `).join("");

  showModal("宗门任务", html, [{ label: "关闭", fn: closeModal }]);
}


function openSeclusion() {
  showModal("闭关", `
    <p>选择闭关天数（1~30）：</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
      ${[1, 3, 7, 15, 30].map(d =>
        `<button onclick="closeModal(); startSeclusion(${d})">${d} 天</button>`
      ).join("")}
    </div>
  `, [{ label: "取消", fn: closeModal }]);
}
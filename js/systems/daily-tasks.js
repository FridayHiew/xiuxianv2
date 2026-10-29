/* ============================================================
   systems/daily-tasks.js - 每日修行任务与功课活跃度系统
   ============================================================ */

const DAILY_TASK_CONFIG = [
  {
    id: "meditate",
    name: "晨曦吐纳",
    desc: "静坐凝神，运转心法完成 1 次周天吐纳修炼",
    points: 20,
    icon: "🧘",
    targetTab: "cave",
    actionHint: "前往吐纳"
  },
  {
    id: "chore",
    name: "勤勉劳作",
    desc: "完成宗门指派杂务、下山打零工或周末参加宗门传功",
    points: 20,
    icon: "📜",
    targetTab: "day",
    actionHint: "前往宗门"
  },
  {
    id: "practice",
    name: "演武研习",
    desc: "前往校场切磋对练，或研习修真百艺 1 次",
    points: 20,
    icon: "⚔️",
    targetTab: "day",
    actionHint: "前往演武"
  },
  {
    id: "social",
    name: "道友交谊",
    desc: "拜访宗门仙友同道，进行 1 次机缘对白交流或心意馈赠",
    points: 20,
    icon: "🤝",
    targetTab: "social",
    actionHint: "拜访道友"
  },
  {
    id: "garden",
    name: "灵草药圃",
    desc: "在洞府百草园播种采收灵植，或喂养看护灵宠 1 次",
    points: 20,
    icon: "🌱",
    targetTab: "cave",
    actionHint: "打理洞府"
  }
];

const DAILY_TASK_CHESTS = [
  {
    target: 40,
    label: "40活跃宝匣",
    rewardText: "铜钱 ×60 · 聚气丹 ×1 · 修为 +50",
    claim: () => {
      S.money = (S.money || 0) + 60;
      if (typeof addItem === "function") addItem("聚气丹_1阶", 1);
      if (typeof gainCultivationExp === "function") gainCultivationExp(50);
      return ["铜钱 +60", "获得【聚气丹·1阶】×1", "修为经验 +50"];
    }
  },
  {
    target: 80,
    label: "80活跃宝匣",
    rewardText: "灵草 ×2 · 饲灵丸 ×2 · 修为 +100",
    claim: () => {
      if (typeof addItem === "function") {
        addItem("灵草_1阶", 2);
        addItem("饲灵丸_1阶", 2);
      }
      if (typeof gainCultivationExp === "function") gainCultivationExp(100);
      return ["获得【灵草·1阶】×2", "获得【饲灵丸·1阶】×2", "修为经验 +100"];
    }
  },
  {
    target: 100,
    label: "100大圆满宝匣",
    rewardText: "灵石 ×2（或铜钱200）· 洗髓丹 ×1 · 修为 +200",
    claim: () => {
      const isStone = typeof isStoneTier === "function" ? isStoneTier() : (S.realm >= 1);
      if (isStone) {
        S.stone = (S.stone || 0) + 2;
      } else {
        S.money = (S.money || 0) + 200;
      }
      if (typeof addItem === "function") addItem("洗髓丹_1阶", 1);
      if (typeof gainCultivationExp === "function") gainCultivationExp(200);
      S.dao = (S.dao || 0) + 2;
      return [
        isStone ? "灵石 +2" : "铜钱 +200",
        "获得【洗髓丹·1阶】×1",
        "修为经验 +200",
        "道心 +2"
      ];
    }
  }
];

/* 保证状态有效 */
function ensureDailyTasksState() {
  if (!S) return null;
  if (!S.dailyTasks || S.dailyTasks.day !== S.day) {
    S.dailyTasks = {
      day: S.day,
      progress: {
        meditate: 0,
        chore: 0,
        practice: 0,
        social: 0,
        garden: 0
      },
      claimed: {
        40: false,
        80: false,
        100: false
      }
    };
  }
  return S.dailyTasks;
}

/* 记录并达成某项日常任务 */
function triggerDailyTask(type) {
  const dt = ensureDailyTasksState();
  if (!dt) return;
  if (!dt.progress[type]) {
    dt.progress[type] = 1;
    const task = DAILY_TASK_CONFIG.find(t => t.id === type);
    if (task) {
      log(`【每日功课】达成【${task.name}】！活跃度 +${task.points}。`, "c-gold");
    }
    save();
  }
}

/* 计算当前总活跃度 */
function getDailyActivityPoints() {
  const dt = ensureDailyTasksState();
  if (!dt) return 0;
  let pts = 0;
  DAILY_TASK_CONFIG.forEach(t => {
    if (dt.progress[t.id]) pts += t.points;
  });
  return Math.min(100, pts);
}

/* 打开每日任务面板模态框 */
function openDailyTasksModal() {
  const dt = ensureDailyTasksState();
  const currentPts = getDailyActivityPoints();

  let chestsHtml = `
    <div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:14px;">
  `;

  DAILY_TASK_CHESTS.forEach(c => {
    const isClaimed = dt.claimed[c.target];
    const canClaim = currentPts >= c.target && !isClaimed;

    chestsHtml += `
      <div style="flex:1; background:rgba(0,0,0,0.4); border:1px solid ${canClaim ? 'var(--border-gold)' : '#3d2f1f'}; border-radius:6px; padding:8px; text-align:center;">
        <div style="font-size:20px; margin-bottom:2px;">${isClaimed ? '🎁✓' : (canClaim ? '✨🎁' : '🔒')}</div>
        <div style="font-weight:600; font-size:12px; color:var(--text-gold);">${c.target} 活跃</div>
        <div style="font-size:10px; color:#c4b494; margin:4px 0; line-height:1.3;">${c.rewardText}</div>
        ${isClaimed
          ? `<span style="font-size:11px; color:var(--text-dim);">已领取</span>`
          : canClaim
            ? `<button class="primary small block" onclick="claimDailyTaskChest(${c.target})">领赏</button>`
            : `<span style="font-size:10px; color:#888;">需${c.target}活跃</span>`
        }
      </div>
    `;
  });
  chestsHtml += `</div>`;

  let tasksHtml = `<div style="display:flex; flex-direction:column; gap:8px;">`;
  DAILY_TASK_CONFIG.forEach(t => {
    const isDone = !!dt.progress[t.id];
    tasksHtml += `
      <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(20,15,10,0.85); border:1px solid #3d2f1f; border-radius:6px; padding:8px 12px;">
        <div style="display:flex; align-items:center; gap:8px; flex:1;">
          <div style="font-size:20px;">${t.icon}</div>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <b style="color:var(--text-gold); font-size:13px;">${t.name}</b>
              <span class="tag gold" style="font-size:10px; padding:1px 4px;">+${t.points} 活跃</span>
            </div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:2px;">${t.desc}</div>
          </div>
        </div>
        <div>
          ${isDone
            ? `<span style="color:#5fb865; font-size:12px; font-weight:600;">✓ 已达成</span>`
            : `<button class="small" onclick="closeModal(); gotoDailyTaskTarget('${t.targetTab}')">${t.actionHint} ▶</button>`
          }
        </div>
      </div>
    `;
  });
  tasksHtml += `</div>`;

  const body = `
    <div style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:13px; color:#d8b878;">今日修行功课完成度</span>
        <span style="font-size:14px; font-weight:700; color:var(--text-gold);">${currentPts} / 100 活跃度</span>
      </div>
      <div style="width:100%; height:8px; background:#1b140c; border:1px solid #3a2b18; border-radius:4px; overflow:hidden;">
        <div style="width:${currentPts}%; height:100%; background:linear-gradient(90deg, #b07d3b, #f39c12); transition:width 0.3s;"></div>
      </div>
    </div>

    ${chestsHtml}

    <div style="font-size:12px; font-weight:600; color:var(--text-gold); margin:10px 0 6px;">每日功课清单</div>
    ${tasksHtml}
  `;

  showModal("📜 每日功课 · 活跃修持", body, [
    { label: "知晓了", fn: closeModal }
  ]);
}

/* 领取活跃度宝箱 */
function claimDailyTaskChest(target) {
  const dt = ensureDailyTasksState();
  if (!dt || dt.claimed[target]) return;
  const currentPts = getDailyActivityPoints();
  if (currentPts < target) return;

  const chest = DAILY_TASK_CHESTS.find(c => c.target === target);
  if (!chest) return;

  dt.claimed[target] = true;
  const rewards = chest.claim();

  log(`【每日宝箱】开启【${chest.label}】！${rewards.join("，")}`, "c-gold");
  save();
  render();
  openDailyTasksModal();
}

/* 跳转任务页面 */
function gotoDailyTaskTarget(targetTab) {
  if (targetTab === "cave") {
    gotoCultivate();
  } else if (targetTab === "social") {
    switchTab("social");
  } else {
    switchTab("day");
  }
}

if (typeof window !== "undefined") {
  window.triggerDailyTask = triggerDailyTask;
  window.openDailyTasksModal = openDailyTasksModal;
  window.claimDailyTaskChest = claimDailyTaskChest;
  window.gotoDailyTaskTarget = gotoDailyTaskTarget;
}

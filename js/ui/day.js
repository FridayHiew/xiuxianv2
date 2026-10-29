/* ============================================================
   ui/day.js - 仙途主线道图水墨画卷 (五章圆章 + 今日功课 + 支线奇遇 + 道友同道)
   ============================================================ */

function hourLabelHTML() {
  const cls = S.hour === 0 ? "h-morning" : S.hour === 1 ? "h-noon" : "h-night";
  return `<span class="hour-label ${cls}">${HOURS[S.hour]}</span>`;
}

function openStoryChapterDetail(chapId) {
  const sp = typeof ensureStoryProgressState === "function"
    ? ensureStoryProgressState()
    : (S.flags.storyProgress || { chapterId: 1, unlockedChapters: { 1: true }, completedQuests: {} });
  const activeChapId = sp.chapterId || 1;
  const isUnlocked = !!(sp.unlockedChapters && sp.unlockedChapters[chapId]) || chapId <= activeChapId;
  const chap = (typeof STORY_CHAPTERS !== "undefined" && STORY_CHAPTERS)
    ? STORY_CHAPTERS.find(c => c.id === chapId)
    : null;

  if (!isUnlocked && chap) {
    const fmtFn = typeof formatStoryText === "function" ? formatStoryText : (s => s || "");
    showModal(`🔒 第 ${chap.id} 章未开启 · ${fmtFn(chap.title)}`, `
      <p><b>${fmtFn(chap.subtitle || "")}</b>（${fmtFn(chap.location || "太源仙境")}）</p>
      <p class="small" style="color:var(--text-gold);">开启条件：${fmtFn(chap.triggerConditionText || "完成前一章全部主线目标或突破对应大境界")}</p>
      <p class="small" style="color:var(--text-dim); margin-top:6px;">请先达成当前章节目标或精进修为境界，即可水到渠成解锁此章宏篇。</p>
    `, [{ label: "弟子知晓了", fn: closeModal }]);
    return;
  }

  if (typeof selectStoryChapter === "function" && chapId) {
    currentSelectedChapterId = chapId;
  }
  daySubPanel = "chapter";
  render();
}

function closeDaySubPanel() {
  daySubPanel = null;
  render();
}

function openChapterSideStoriesModal(chapId) {
  if (typeof STORY_CHAPTERS === "undefined" || !STORY_CHAPTERS) return;
  const sp = typeof ensureStoryProgressState === "function"
    ? ensureStoryProgressState()
    : (S.flags.storyProgress || { chapterId: 1, sideStoriesDone: {} });
  const targetId = chapId || sp.chapterId || 1;
  const chap = STORY_CHAPTERS.find(c => c.id === targetId) || STORY_CHAPTERS[0];
  const fmtFn = typeof formatStoryText === "function" ? formatStoryText : (s => s || "");
  const sideList = (chap && chap.sideStories) || [];

  if (sideList.length === 0) {
    showModal("📖 支线奇遇", `<p>当前章节暂无额外支线奇遇。</p>`, [{ label: "返回", fn: closeModal }]);
    return;
  }

  const rowsHtml = sideList.map(side => {
    const isDone = !!(sp.sideStoriesDone && sp.sideStoriesDone[side.id]);
    const rw = side.reward || {};
    const rwTags = [];
    if (rw.stone) rwTags.push(`灵石 +${rw.stone}`);
    if (rw.exp) rwTags.push(`修为 +${rw.exp}`);
    if (rw.contrib) rwTags.push(`贡献 +${rw.contrib}`);
    if (rw.dao) rwTags.push(`道心 +${rw.dao}`);
    if (rw.item) {
      const itName = typeof getStoryRewardItemName === "function" ? getStoryRewardItemName(rw.item) : rw.item;
      rwTags.push(`获得【${itName}】`);
    }
    return `
      <div class="card" style="margin-bottom:8px;">
        <div class="row">
          <div>
            <span>${side.avatar || '📖'}</span>
            <b>${fmtFn(side.title)}</b>
            <span class="tag">${fmtFn(side.npc)}</span>
          </div>
          <button class="${isDone ? 'small' : 'primary small'}" onclick="closeModal(); openSideStoryModal(${chap.id}, '${side.id}', 0)">
            ${isDone ? '✓ 回顾奇遇' : '💬 触发奇遇 ▶'}
          </button>
        </div>
        <div class="small" style="color:var(--text-dim); margin-top:4px;">${fmtFn(side.summary)}</div>
        <div class="small" style="color:var(--text-gold); margin-top:4px;">机缘赏赐：${rwTags.join(" · ")}</div>
      </div>
    `;
  }).join("");

  showModal(`📖 ${fmtFn(chap.title)} · 支线奇遇与人物羁绊`, `
    <p class="small">尘世历心，与同门师长及红尘故人结下因果机缘：</p>
    ${rowsHtml}
  `, [
    { label: "进入本章详情", fn: () => { closeModal(); openStoryChapterDetail(chap.id); } },
    { label: "关闭", fn: closeModal }
  ]);
}

function renderDay() {
  /* 若已点开某章详情，直接渲染全屏章节详情页 */
  if (daySubPanel === "chapter" && typeof renderStoryUI === "function") {
    return renderStoryUI();
  }

  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));

  /* 同步修为境界自动解锁 */
  if (typeof checkRealmStoryTrigger === "function") {
    checkRealmStoryTrigger({ silent: true });
  }

  const sp = typeof ensureStoryProgressState === "function"
    ? ensureStoryProgressState()
    : (S.flags.storyProgress || { chapterId: 1, unlockedChapters: { 1: true }, completedQuests: {}, sideStoriesDone: {} });
  const summary = typeof getStoryOverallSummary === "function"
    ? getStoryOverallSummary()
    : { totalPct: 0, doneItems: 0, totalItems: 1, nextRealmHint: null };

  const activeChapId = sp.chapterId || 1;
  const chapters = (typeof STORY_CHAPTERS !== "undefined" && STORY_CHAPTERS) ? STORY_CHAPTERS : [];
  const activeChap = chapters.find(c => c.id === activeChapId) || chapters[0] || { id: 1, title: "第一章 · 凡胎引气", subtitle: "太源仙门启道", quests: [], sideStories: [] };

  /* 今日功课进度统计 */
  const dt = typeof ensureDailyTasksState === "function" ? ensureDailyTasksState() : null;
  const defs = (typeof DAILY_TASK_DEFS !== "undefined" && DAILY_TASK_DEFS) ? DAILY_TASK_DEFS : [];
  let dtDoneCount = 0;
  let dtClaimable = 0;
  if (dt && defs.length > 0) {
    defs.forEach(d => {
      const p = dt.progress[d.id] || 0;
      if (p >= d.target) {
        dtDoneCount++;
        if (!dt.claimed[d.id]) dtClaimable++;
      }
    });
  }
  const dtStamp = dtClaimable > 0 ? "可领" : `${dtDoneCount}/${defs.length || 5}`;

  /* 当前章节支线奇遇统计 */
  const sideList = activeChap.sideStories || [];
  let sideDoneCount = 0;
  sideList.forEach(s => {
    if (sp.sideStoriesDone && sp.sideStoriesDone[s.id]) sideDoneCount++;
  });
  const sideStamp = sideList.length > 0
    ? (sideDoneCount < sideList.length ? `${sideDoneCount}/${sideList.length}` : "已毕")
    : "奇遇";

  /* 辅助生成第 1~5 章圆章节点 */
  const chapPositions = {
    1: { pos: "pos-tl", char: "初", shortTitle: "第一章·引气" },
    2: { pos: "pos-ml", char: "潜", shortTitle: "第二章·外门" },
    3: { pos: "pos-bl", char: "筑", shortTitle: "第三章·筑基" },
    4: { pos: "pos-tr", char: "陵", shortTitle: "第四章·古陵" },
    5: { pos: "pos-mr", char: "丹", shortTitle: "第五章·金丹" },
  };

  const renderChapSealNode = (chapId) => {
    const cfg = chapPositions[chapId];
    const chap = chapters.find(c => c.id === chapId);
    if (!cfg || !chap) return "";
    const isUnlocked = !!(sp.unlockedChapters && sp.unlockedChapters[chap.id]) || chap.id <= activeChapId;
    const totalQ = (chap.quests && chap.quests.length) || 1;
    let doneQ = 0;
    let readyToClaim = false;
    (chap.quests || []).forEach(q => {
      if (sp.completedQuests && sp.completedQuests[q.id]) doneQ++;
      else if (typeof isQuestCompleted === "function" && isQuestCompleted(q)) readyToClaim = true;
    });
    const isCleared = doneQ >= totalQ;
    const isCurrent = chap.id === activeChapId;

    let stampText = "未启";
    if (isUnlocked) {
      if (readyToClaim) stampText = "可领";
      else if (isCleared) stampText = "圆满";
      else stampText = `${doneQ}/${totalQ}`;
    }

    const fmtFn = typeof formatStoryText === "function" ? formatStoryText : (s => s || "");
    const cleanSubtitle = fmtFn(chap.subtitle || chap.maxRealmName || "");

    return `
      <button type="button"
              class="ink-seal-node ${cfg.pos} ${!isUnlocked ? 'locked-node' : ''} ${(isCurrent || readyToClaim) && isUnlocked ? 'glow-node' : ''}"
              onclick="openStoryChapterDetail(${chap.id})">
        <span class="node-char">
          ${cfg.char}
          <em class="seal-red-stamp">${stampText}</em>
        </span>
        <span class="node-caption">${cfg.shortTitle}</span>
        <span class="node-sub-hint">${isUnlocked ? cleanSubtitle : '境界/前章解锁'}</span>
      </button>
    `;
  };

  /* 当前章节下一目标提示 */
  const nextQuest = (activeChap.quests || []).find(q => !(sp.completedQuests && sp.completedQuests[q.id]));
  const fmtFn = typeof formatStoryText === "function" ? formatStoryText : (s => s || "");
  const nextQuestText = nextQuest
    ? `当前道途目标：${fmtFn(nextQuest.name)}`
    : `本章主线目标已全部达成`;

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻时辰牌匾与小圆章 HUD -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">仙途</span>
            第 ${S.day} 天 · 周${WEEKDAYS[S.weekday]} ${hourLabelHTML()}
          </div>
          <div class="plaque-sub">太源道图 <b>${summary.totalPct}%</b> · 本时段剩余行动：<b>${remain}/${ACTIONS_PER_SLOT}</b></div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal ${dtClaimable > 0 ? 'glow' : ''}" onclick="openDailyTasksModal()" title="今日功课与活跃宝箱">
            <span>功课</span>
          </button>
          <button type="button" class="ink-mini-seal glow" onclick="openStoryChapterDetail(${activeChap.id})" title="当前主线章节">
            <span>第${activeChap.id}章</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="switchTab('social')" title="道友同道">
            <span>道友</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="openDebugModal()" title="测试与调试秘术">
            <span>玄机</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的宽幅仙途道图水墨长卷 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="left">
        <div class="ink-scene-canvas day-town-panorama ink-panorama-world">
          <img class="ink-scene-bg day-xiantu-bg" src="./src/assets/images/xianxia_bg_banner_1792114543496.jpg" alt="太源仙途千里仙山道图" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">太源仙途</div>

          <!-- 左卷圆章：第一章、第二章、第三章 -->
          ${renderChapSealNode(1)}
          ${renderChapSealNode(2)}
          ${renderChapSealNode(3)}

          <!-- 中轴上圆章：今日功课 -->
          <button type="button" class="ink-seal-node pos-center-top ${dtClaimable > 0 || dtDoneCount < (defs.length || 5) ? 'glow-node' : ''}" onclick="openDailyTasksModal()">
            <span class="node-char">
              功
              <em class="seal-red-stamp">${dtStamp}</em>
            </span>
            <span class="node-caption">今日功课</span>
            <span class="node-sub-hint">每日修行活跃赏赐</span>
          </button>

          <!-- 中央道心台：夜晚安歇或当前章节主线画心 -->
          <div class="day-center-stage">
            ${S.hour === 2 ? `
              <button type="button" class="day-sleep-seal-btn ${remain <= 0 ? 'pulse' : ''}" onclick="sleepToNextDay()">
                <span class="sleep-moon">🌙</span>
                <span class="sleep-txt">${remain <= 0 ? '夜深安歇 · 迎明日朝阳' : '提前安歇入梦'}</span>
              </button>
            ` : `
              <div class="day-center-banner" onclick="openStoryChapterDetail(${activeChap.id})" title="点击进入当前主线章节详情">
                <div class="dcb-title">📜 ${fmtFn(activeChap.title)}</div>
                <div class="dcb-sub">${nextQuestText} · 点击展开章节剧场与目标 ▸</div>
              </div>
            `}
          </div>

          <!-- 中轴下圆章：支线奇遇 -->
          <button type="button" class="ink-seal-node pos-center-bottom ${sideDoneCount < sideList.length ? 'glow-node' : ''}" onclick="openChapterSideStoriesModal(${activeChap.id})">
            <span class="node-char">
              缘
              <em class="seal-red-stamp">${sideStamp}</em>
            </span>
            <span class="node-caption">支线奇遇</span>
            <span class="node-sub-hint">人物羁绊与机缘</span>
          </button>

          <!-- 右卷圆章：第四章、第五章、道友同道 -->
          ${renderChapSealNode(4)}
          ${renderChapSealNode(5)}

          <button type="button" class="ink-seal-node pos-br" onclick="switchTab('social')">
            <span class="node-char">
              友
              <em class="seal-red-stamp">羁绊</em>
            </span>
            <span class="node-caption">道友同道</span>
            <span class="node-sub-hint">仙侣同门交互</span>
          </button>
        </div>
      </div>

      <!-- 底部横向长卷导览罗盘 -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn active" data-pos="left" onclick="panPanorama('left')">◀ 初途·筑基</button>
        <button type="button" class="pano-compass-btn" data-pos="center" onclick="panPanorama('center')">🏮 道心·功课</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">古陵·金丹 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}

/* 宗门【杂务/差事】圆章综合交互弹窗（含今日指派杂务、自由劳作、宗门悬赏任务、宗门事务熟练） */
function openSectChoreAndTaskModal() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const isWeekend = (S.weekday === 0 || S.weekday === 6);
  const dq = S.dailyQuest;
  const dqDone = dq ? dq.done >= dq.amount : true;
  const activeTasks = (S.flags && S.flags.activeTasks) || [];

  if (isWeekend) {
    openWeekendLectureModal();
    return;
  }

  const actions = [];
  if (!dqDone && S.hour !== 2 && remain > 0) {
    actions.push({
      label: `🧹 执行今日指派：${dq.chore.name} (${dq.done}/${dq.amount})`,
      primary: true,
      fn: () => { closeModal(); onDayChoreNodeClick(); }
    });
  }
  if (remain > 0 && S.hour !== 2) {
    actions.push({
      label: "🪓 自由劳作打杂 (赚铜钱/练基本功)",
      primary: dqDone,
      fn: () => { closeModal(); openChoreSelector(); }
    });
  }
  if (rank !== "杂务") {
    actions.push({
      label: `📋 宗门悬赏任务 ${activeTasks.length ? '(进行中 ' + activeTasks.length + ')' : ''}`,
      fn: () => { closeModal(); openTaskSelector(); }
    });
  }
  actions.push({
    label: "📊 查看杂务熟练度一览",
    fn: () => { closeModal(); openSectSubPanel("宗门事务"); }
  });
  actions.push({ label: "返回", fn: closeModal });

  const statusLine = S.hour === 2
    ? `<span style="color:var(--c-bad);">夜色已深，执事堂已歇，明日再来交接差事。</span>`
    : (!dqDone
      ? `今日执事指派：<b>${dq.chore.name}（${dq.done}/${dq.amount}）</b>，完成后可获贡献与掌事好感。`
      : `今日指派差事已圆满完成！你可继续自由劳作或接取宗门悬赏任务。`);

  showModal("🧹 宗门执事堂 · 杂务与悬赏", `
    <p>${statusLine}</p>
    <p class="small">本时段剩余行动：<b>${remain}/${ACTIONS_PER_SLOT}</b></p>
  `, actions);
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

/* 周末传功讲道模态框（周末取代今日任务） */
function openWeekendLectureModal() {
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  if (S.hour === 2) {
    showModal("🌙 夜深法筵散", `<p>夜幕低垂，长老讲道法筵已闭坛。同门师兄弟皆已回屋调息。</p>`, [{ label: "知晓了", fn: closeModal }]);
    return;
  }
  if (remain <= 0) {
    log("本时段行动已用完。", "c-bad");
    return;
  }

  showModal("📖 宗门周末传功大典", `
    <p>今日乃<b>周${WEEKDAYS[S.weekday]}</b>休沐，宗门不派杂务，长春堂与主峰长老大开法筵，为全宗弟子传授大道玄音！</p>
    <div style="background:rgba(0,0,0,0.3); border:1px solid #3d2f1f; border-radius:6px; padding:10px; margin:8px 0; font-size:12px; color:#d8b878; line-height:1.5;">
      ✨ <b>传功收益</b>：消耗 1 行动，聆听长老讲经传法，可获得大量【修为经验】、【心法熟练】与【道心】，有几率获得长老亲自灌顶指点！
    </div>
  `, [
    {
      label: "🧘 虔心入座听讲 (耗1行动)",
      primary: true,
      fn: () => {
        closeModal();
        if (typeof triggerDailyTask === "function") triggerDailyTask("chore");
        doListenLecture();
      }
    },
    { label: "暂缓前往", fn: closeModal }
  ]);
}

/* 山门巡弋模态框（独立巡山） */
function openMountainPatrolModal() {
  const rank = S.flags.rank || "杂务";
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));

  if (remain <= 0) {
    log("本时段行动已用完。", "c-bad");
    return;
  }

  showModal("🛡️ 山门巡弋防务", `
    <p>太源仙山绵延千里，外围偶有宵小、散修魔头或低阶妖兽窥探。</p>
    <div style="background:rgba(0,0,0,0.3); border:1px solid #3d2f1f; border-radius:6px; padding:10px; margin:8px 0; font-size:12px; color:#c4b494; line-height:1.5;">
      · 巡视山门哨卡与后山防护大阵，震慑宵小凶兽。<br>
      · 消耗 1 行动，获得<b>宗门贡献 +1~2</b>、<b>兵刃实战经验</b>与<b>偶遇机缘盘缠</b>。
    </div>
  `, [
    {
      label: "⚔️ 开始巡山防务 (耗1行动)",
      primary: true,
      fn: () => {
        closeModal();
        if (typeof triggerDailyTask === "function") triggerDailyTask("chore");
        doPatrol();
      }
    },
    { label: "返回", fn: closeModal }
  ]);
}

function openDailyPatrolOrLectureModal() {
  if (S.weekday === 0 || S.weekday === 6) {
    openWeekendLectureModal();
  } else {
    openMountainPatrolModal();
  }
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
    if (typeof triggerDailyTask === "function") triggerDailyTask("garden");
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
    if (typeof triggerDailyTask === "function") triggerDailyTask("practice");
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
  else if (type === "meditate") {
    doCultivate(1);
  }
}

function consumeAction(onDone) {
  if (typeof checkAdvanceTimeSlot === "function") {
    checkAdvanceTimeSlot();
  } else if (S.actionsUsed >= ACTIONS_PER_SLOT) {
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

  /* 重置与初始化每日功课 */
  if (typeof ensureDailyTasksState === "function") {
    ensureDailyTasksState();
  }

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

  const rank = S.flags.rank || "杂务";
  const rankIdx = RANKS.indexOf(rank);
  const allChores = [...CHORES_FAN];
  if (rankIdx >= 1 && typeof CHORES_MENWAI !== "undefined") {
    allChores.push(...CHORES_MENWAI);
  }
  if (rankIdx >= 2 && typeof CHORES_MENNEI !== "undefined") {
    allChores.push(...CHORES_MENNEI);
  }

  const html = allChores.map(c => {
    const gainText = Object.entries(c.gain || {}).map(([k, v]) => `${k}+${v}`).join("、");
    return `
      <button class="block" style="margin-bottom:6px;" onclick="startManualChore('${c.id}')">
        ${c.name}（精进：${gainText || c.skill}）
      </button>
    `;
  }).join("");

  showModal("选择宗门杂务与百艺劳作", `<p class="small">选择要执行的差事（消耗 1 行动，提升事务熟练与对应百艺造诣）：</p>${html}`, [
    { label: "取消", fn: closeModal }
  ]);
}

function startManualChore(choreId) {
  closeModal();
  const allChores = [
    ...(typeof CHORES_FAN !== "undefined" ? CHORES_FAN : []),
    ...(typeof CHORES_MENWAI !== "undefined" ? CHORES_MENWAI : []),
    ...(typeof CHORES_MENNEI !== "undefined" ? CHORES_MENNEI : []),
  ];
  const chore = allChores.find(c => c.id === choreId);
  if (!chore) return;

  S.actionsUsed++;
  S.choresUsedTotal = (S.choresUsedTotal || 0) + 1;
  if (typeof triggerDailyTask === "function") triggerDailyTask("chore");
  const { inc, skillGains } = gainChoreSkill(chore, 1);

  /* 按身份给予铜钱或灵石劳作补贴 */
  const detail = [`杂务熟练 +${inc}%`];
  if (typeof isStoneTier === "function" && isStoneTier()) {
    const stoneGain = rndInt(2, 5);
    S.stone += stoneGain;
    detail.push(`灵石 +${stoneGain}`);
  } else {
    const moneyGain = rndInt(5, 12);
    S.money += moneyGain;
    detail.push(`铜钱 +${moneyGain}`);
  }

  log(`你完成了宗门差事【${chore.name}】。`, "c-normal");
  skillGains.forEach(s => detail.push(`造诣精进：${s}`));

  consumeAction(() => showActionModal("差事完成 · " + chore.name, detail));
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
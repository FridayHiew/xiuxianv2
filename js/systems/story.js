/* ============================================================
   systems/story.js - 修为境界驱动的剧情章节自动触发、对白剧场、支线奇遇与事件系统
   ============================================================ */

/* 动态文本插值：将 {playerName} 与 {sectName} 替换为玩家当前道号与所属宗门 */
function formatStoryText(str) {
  if (!str || typeof str !== "string") return str || "";
  const pName = (typeof S !== "undefined" && S && S.name) ? S.name : "云逸";
  const sName = (typeof getPlayerSectName === "function") ? getPlayerSectName() : "云霄宗";
  return str.replace(/\{playerName\}/g, pName).replace(/\{sectName\}/g, sName);
}

/* 解析并生成奖励物品 ID（支持心法残卷、静态装备与动态品级丹药） */
function resolveStoryRewardItemId(rawId) {
  if (!rawId) return null;
  if (typeof getOrCreatePillItem === "function") {
    const m = rawId.match(/^(.+)_([0-5])品$/);
    if (m) {
      const created = getOrCreatePillItem(m[1], parseInt(m[2], 10));
      if (created) {
        ITEMS[rawId] = created;
        return created.id || rawId;
      }
    }
    if (typeof ITEMS !== "undefined" && ITEMS[rawId] && ITEMS[rawId].type === "pillTemplate") {
      const created = getOrCreatePillItem(rawId, 2);
      if (created) return created.id || (rawId + "_2品");
    }
  }
  if (typeof getItem === "function") {
    const it = getItem(rawId);
    if (it) return it.id || rawId;
  }
  return rawId;
}

/* 获取奖励物品的可读名称 */
function getStoryRewardItemName(rawId) {
  if (!rawId) return "";
  const finalId = resolveStoryRewardItemId(rawId);
  const it = (typeof getItem === "function" ? getItem(finalId) : null) || (typeof ITEMS !== "undefined" ? ITEMS[finalId] : null);
  if (it && it.name) return it.name;
  return rawId;
}

/* 确保主线剧情状态结构完整 */
function ensureStoryProgressState() {
  if (!S) return null;
  if (!S.flags) S.flags = {};
  if (!S.flags.dungeonsCleared) S.flags.dungeonsCleared = {};
  if (!S.flags.storyProgress) {
    S.flags.storyProgress = {
      chapterId: 1,
      unlockedChapters: { 1: true },
      dialogueCursor: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      completedQuests: {},
      choicesMade: {},
      sideStoriesDone: {},
      milestonesTriggered: {},
      showAllDialogues: false
    };
  }
  const sp = S.flags.storyProgress;
  if (!sp.unlockedChapters) sp.unlockedChapters = { 1: true };
  if (!sp.unlockedChapters[1]) sp.unlockedChapters[1] = true;
  if (!sp.dialogueCursor) sp.dialogueCursor = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!sp.completedQuests) sp.completedQuests = {};
  if (!sp.choicesMade) sp.choicesMade = {};
  if (!sp.sideStoriesDone) sp.sideStoriesDone = {};
  if (!sp.milestonesTriggered) sp.milestonesTriggered = {};
  return sp;
}

/* 判断玩家当前修为是否达到指定 (triggerRealm, triggerLvl) */
function isRealmReached(targetRealm, targetLvl) {
  if (typeof getPlayerRealmInfo !== "function" || !S) return false;
  const info = getPlayerRealmInfo();
  if (info.realm > targetRealm) return true;
  if (info.realm === targetRealm && info.lvl >= (targetLvl || 0)) return true;
  return false;
}

/* 根据当前修为境界计算应当解锁的最高章节 ID */
function getMaxUnlockedChapterByRealm() {
  if (typeof STORY_CHAPTERS === "undefined" || !STORY_CHAPTERS) return 1;
  let maxChap = 1;
  STORY_CHAPTERS.forEach(ch => {
    const trRealm = ch.triggerRealm !== undefined ? ch.triggerRealm : ch.minRealm;
    const trLvl = ch.triggerLvl !== undefined ? ch.triggerLvl : 0;
    if (isRealmReached(trRealm, trLvl)) {
      maxChap = Math.max(maxChap, ch.id);
    }
  });
  return maxChap;
}

/* 获取下一个尚未触发的修为章节/里程碑提示 */
function getNextRealmTriggerHint() {
  if (typeof STORY_CHAPTERS === "undefined" || !S) return null;
  const sp = ensureStoryProgressState();
  for (let i = 0; i < STORY_CHAPTERS.length; i++) {
    const ch = STORY_CHAPTERS[i];
    if (!sp.unlockedChapters[ch.id]) {
      return {
        chapterId: ch.id,
        title: formatStoryText(ch.title),
        conditionText: formatStoryText(ch.triggerConditionText || `达到${REALMS[ch.triggerRealm || 1].name}期`)
      };
    }
  }
  return null;
}

/* ============================================================
   核心：根据修为境界自动触发特定剧情章节与境界奇遇
   ============================================================ */
function checkRealmStoryTrigger(options) {
  if (!S || typeof STORY_CHAPTERS === "undefined") return false;
  options = options || {};
  const silent = !!options.silent;
  const sp = ensureStoryProgressState();
  let newlyTriggered = [];

  /* 1. 检查所有章节的修为触发门槛 */
  STORY_CHAPTERS.forEach(chap => {
    const trRealm = chap.triggerRealm !== undefined ? chap.triggerRealm : chap.minRealm;
    const trLvl = chap.triggerLvl !== undefined ? chap.triggerLvl : 0;

    if (isRealmReached(trRealm, trLvl) && !sp.unlockedChapters[chap.id]) {
      sp.unlockedChapters[chap.id] = true;
      if (chap.id > sp.chapterId) {
        sp.chapterId = chap.id;
      }
      if (typeof currentSelectedChapterId !== "undefined") {
        currentSelectedChapterId = chap.id;
      }
      log(`【主线开启】修为精进，自动触发主线【${formatStoryText(chap.title)}】！`, "c-gold");
    }
  });

  /* 2. 检查修为境界里程碑奇遇 (REALM_STORY_MILESTONES) */
  if (typeof REALM_STORY_MILESTONES !== "undefined" && Array.isArray(REALM_STORY_MILESTONES)) {
    REALM_STORY_MILESTONES.forEach(ms => {
      if (sp.milestonesTriggered[ms.id]) return;
      if (isRealmReached(ms.realm, ms.lvl)) {
        sp.milestonesTriggered[ms.id] = true;

        /* 发放里程碑奖励 */
        const rewardParts = [];
        if (ms.reward) {
          if (ms.reward.stone) {
            S.stone = (S.stone || 0) + ms.reward.stone;
            rewardParts.push(`灵石 +${ms.reward.stone}`);
          }
          if (ms.reward.contrib) {
            S.contrib = (S.contrib || 0) + ms.reward.contrib;
            rewardParts.push(`宗门贡献 +${ms.reward.contrib}`);
          }
          if (ms.reward.dao) {
            S.dao = (S.dao || 0) + ms.reward.dao;
            rewardParts.push(`道心 +${ms.reward.dao}`);
          }
          if (ms.reward.exp) {
            if (typeof gainCultivationExp === "function") gainCultivationExp(ms.reward.exp);
            else S.exp = (S.exp || 0) + ms.reward.exp;
            rewardParts.push(`修为 +${ms.reward.exp}`);
          }
        }

        if (ms.unlockChapter) {
          sp.unlockedChapters[ms.unlockChapter] = true;
          if (ms.unlockChapter > sp.chapterId) {
            sp.chapterId = ms.unlockChapter;
          }
          if (typeof currentSelectedChapterId !== "undefined") {
            currentSelectedChapterId = ms.unlockChapter;
          }
        }

        log(`${formatStoryText(ms.title)} — ${rewardParts.join("，")}`, "c-gold");
        newlyTriggered.push({ milestone: ms, rewardText: rewardParts.join(" · ") });
      }
    });
  }

  if (newlyTriggered.length > 0) {
    save();
    if (!silent) {
      const latest = newlyTriggered[newlyTriggered.length - 1];
      showRealmMilestoneModal(latest.milestone, latest.rewardText);
      return true;
    }
  }

  return false;
}

/* 境界突破触发的沉浸式剧情对白弹窗 */
function showRealmMilestoneModal(ms, rewardText) {
  if (!ms) return;
  const unlockChap = ms.unlockChapter
    ? STORY_CHAPTERS.find(c => c.id === ms.unlockChapter)
    : null;

  const html = `
    <div class="story-cutscene-modal">
      <div class="story-cutscene-speaker-row">
        <div class="story-cutscene-avatar">${ms.avatar || "✨"}</div>
        <div>
          <div class="story-cutscene-speaker">${formatStoryText(ms.speaker || "天道仙音")}</div>
          <div class="small" style="color:var(--text-dim);">修为境界感应 · 仙途奇遇</div>
        </div>
      </div>
      <div class="story-cutscene-text">${formatStoryText(ms.text)}</div>
      ${unlockChap ? `
        <div class="story-cutscene-unlock-box">
          <div style="font-size:11px; color:var(--text-gold);">📜 已自动开启新主线章节</div>
          <div style="font-size:14px; font-weight:700; color:var(--text-bright); margin-top:2px;">${formatStoryText(unlockChap.title)}</div>
          <div class="small" style="color:var(--text-dim); margin-top:2px;">📍 ${formatStoryText(unlockChap.location || "")}</div>
        </div>
      ` : ""}
      ${rewardText ? `
        <div class="story-cutscene-reward">
          🎁 境界机缘赏赐：<b>${rewardText}</b>
        </div>
      ` : ""}
    </div>
  `;

  const actions = [];
  if (unlockChap) {
    actions.push({
      label: "前往新章节剧场",
      fn: () => {
        closeModal();
        currentTab = "story";
        if (typeof currentSelectedChapterId !== "undefined") {
          currentSelectedChapterId = unlockChap.id;
        }
        render();
        openChapterDialogueModal(unlockChap.id, 0);
      }
    });
  }
  actions.push({
    label: "继续修行",
    fn: () => {
      closeModal();
      render();
    }
  });

  showModal(formatStoryText(ms.title || "修为破关 · 仙途剧情"), html, actions);
}

/* 打开章节沉浸式对白剧场弹窗（逐句播放） */
function openChapterDialogueModal(chapId, stepIdx) {
  const sp = ensureStoryProgressState();
  const targetId = chapId || sp.chapterId || 1;
  const chapter = STORY_CHAPTERS.find(c => c.id === targetId) || STORY_CHAPTERS[0];
  if (!chapter || !chapter.dialogues || chapter.dialogues.length === 0) return;

  const idx = Math.max(0, Math.min(stepIdx || 0, chapter.dialogues.length - 1));
  sp.dialogueCursor[chapter.id] = idx;
  const dlg = chapter.dialogues[idx];
  const total = chapter.dialogues.length;

  const html = `
    <div class="story-cutscene-modal">
      <div class="story-cutscene-meta">
        <span>${formatStoryText(dlg.sceneTag || chapter.title)}</span>
        <span>对白 ${idx + 1} / ${total}</span>
      </div>
      <div class="story-cutscene-speaker-row">
        <div class="story-cutscene-avatar">${dlg.avatar || "🧙‍♂️"}</div>
        <div>
          <div class="story-cutscene-speaker">${formatStoryText(dlg.speaker)}</div>
          <div class="small" style="color:var(--text-dim);">${formatStoryText(dlg.role || "修真同道")} · ${formatStoryText(dlg.emotion || "神色肃穆")}</div>
        </div>
      </div>
      <div class="story-cutscene-text">${formatStoryText(dlg.text)}</div>
    </div>
  `;

  const actions = [];
  if (idx > 0) {
    actions.push({
      label: "◀ 上一幕",
      fn: () => openChapterDialogueModal(chapter.id, idx - 1)
    });
  }
  if (idx < total - 1) {
    actions.push({
      label: "下一幕 ▶",
      fn: () => openChapterDialogueModal(chapter.id, idx + 1)
    });
  } else {
    actions.push({
      label: "完成品读",
      fn: () => {
        closeModal();
        save();
        render();
      }
    });
  }

  showModal(`🎬 仙途剧场 · ${formatStoryText(chapter.location || chapter.title)}`, html, actions);
}

/* 打开章节支线奇遇 / 人物羁绊互动剧场弹窗 */
function openSideStoryModal(chapId, sideId, stepIdx) {
  const sp = ensureStoryProgressState();
  const chapter = STORY_CHAPTERS.find(c => c.id === chapId);
  if (!chapter || !chapter.sideStories) return;
  const side = chapter.sideStories.find(s => s.id === sideId);
  if (!side || !side.scenes || side.scenes.length === 0) return;

  const idx = Math.max(0, Math.min(stepIdx || 0, side.scenes.length - 1));
  const scene = side.scenes[idx];
  const total = side.scenes.length;
  const isDone = !!sp.sideStoriesDone[side.id];

  const html = `
    <div class="story-cutscene-modal">
      <div class="story-cutscene-meta">
        <span>${formatStoryText(side.title)}</span>
        <span>片段 ${idx + 1} / ${total}</span>
      </div>
      <div class="story-cutscene-speaker-row">
        <div class="story-cutscene-avatar">${scene.avatar || side.avatar || "✨"}</div>
        <div>
          <div class="story-cutscene-speaker">${formatStoryText(scene.speaker)}</div>
          <div class="small" style="color:var(--text-dim);">章节支线奇遇 · 羁绊秘闻</div>
        </div>
      </div>
      <div class="story-cutscene-text">${formatStoryText(scene.text)}</div>
      ${idx === total - 1 && !isDone ? `
        <div class="story-cutscene-reward">
          🎁 完成此番奇遇可获机缘赏赐！
        </div>
      ` : ""}
    </div>
  `;

  const actions = [];
  if (idx > 0) {
    actions.push({
      label: "◀ 上一句",
      fn: () => openSideStoryModal(chapId, sideId, idx - 1)
    });
  }
  if (idx < total - 1) {
    actions.push({
      label: "下一句 ▶",
      fn: () => openSideStoryModal(chapId, sideId, idx + 1)
    });
  } else {
    actions.push({
      label: isDone ? "关闭回顾" : "🎁 领受奇遇机缘",
      fn: () => {
        if (!sp.sideStoriesDone[side.id]) {
          sp.sideStoriesDone[side.id] = true;
          const rw = side.reward || {};
          const parts = [];
          if (rw.stone) { S.stone = (S.stone || 0) + rw.stone; parts.push(`灵石 +${rw.stone}`); }
          if (rw.contrib) { S.contrib = (S.contrib || 0) + rw.contrib; parts.push(`贡献 +${rw.contrib}`); }
          if (rw.dao) { S.dao = (S.dao || 0) + rw.dao; parts.push(`道心 +${rw.dao}`); }
          if (rw.exp) {
            if (typeof gainCultivationExp === "function") gainCultivationExp(rw.exp);
            else S.exp = (S.exp || 0) + rw.exp;
            parts.push(`修为 +${rw.exp}`);
          }
          if (rw.item) {
            const finalId = resolveStoryRewardItemId(rw.item);
            if (finalId && ITEMS[finalId]) {
              addItem(finalId, 1);
              parts.push(`获得 ${ITEMS[finalId].name}`);
            }
          }
          log(`【支线奇遇】完成${formatStoryText(side.title)}，${parts.join("，")}！`, "c-gold");
        }
        closeModal();
        save();
        render();
      }
    });
  }

  showModal(`📖 ${formatStoryText(side.title)}`, html, actions);
}

/* 判断章节任务是否完成 */
function isQuestCompleted(quest) {
  if (!S || !quest) return false;
  if (quest.targetType === "choreCount") {
    return (S.choresUsedTotal || 0) >= quest.need;
  }
  if (quest.targetType === "realm") {
    return isRealmReached(quest.needRealm, quest.needLvl);
  }
  if (quest.targetType === "dungeon") {
    return !!(S.flags.dungeonsCleared && S.flags.dungeonsCleared[quest.dungeonId]);
  }
  if (quest.targetType === "rank") {
    const curIdx = RANKS.indexOf(S.flags.rank || "杂务");
    const reqIdx = RANKS.indexOf(quest.needRank || "门外");
    return curIdx >= reqIdx;
  }
  if (quest.targetType === "skill") {
    const lvl = (S.skills && S.skills[quest.skillName] && S.skills[quest.skillName].lvl) || 0;
    return lvl >= quest.needLvl;
  }
  if (quest.targetType === "item") {
    const have = (S.inventory && S.inventory[quest.itemId]) || 0;
    return have >= (quest.needCount || 1);
  }
  if (quest.targetType === "contrib") {
    return (S.contrib || 0) >= quest.needContrib;
  }
  return false;
}

/* 获取章节任务的实时进度文本与百分比 */
function getQuestProgressInfo(quest) {
  if (!S || !quest) return { text: "0 / 1", pct: 0 };
  if (quest.targetType === "choreCount") {
    const cur = Math.min(quest.need, S.choresUsedTotal || 0);
    return { text: `${cur} / ${quest.need} 次`, pct: Math.min(100, Math.round((cur / quest.need) * 100)) };
  }
  if (quest.targetType === "realm") {
    const info = getPlayerRealmInfo();
    const curText = info.realm === 0 ? "凡人" : `${REALMS[info.realm].name}${info.lvl}重`;
    const reqText = `${REALMS[quest.needRealm].name}${quest.needLvl}重`;
    const done = isRealmReached(quest.needRealm, quest.needLvl);
    return { text: `${curText} / 目标 ${reqText}`, pct: done ? 100 : Math.min(90, info.realm * 35 + info.lvl * 5) };
  }
  if (quest.targetType === "dungeon") {
    const done = !!(S.flags.dungeonsCleared && S.flags.dungeonsCleared[quest.dungeonId]);
    return { text: done ? "已通关秘境" : "尚未通关", pct: done ? 100 : 0 };
  }
  if (quest.targetType === "rank") {
    const curRank = S.flags.rank || "杂务";
    const done = isQuestCompleted(quest);
    return { text: `当前：${curRank} / 目标：${quest.needRank}`, pct: done ? 100 : 40 };
  }
  if (quest.targetType === "contrib") {
    const cur = Math.min(quest.needContrib, S.contrib || 0);
    return { text: `${cur} / ${quest.needContrib} 贡献`, pct: Math.min(100, Math.round((cur / quest.needContrib) * 100)) };
  }
  const done = isQuestCompleted(quest);
  return { text: done ? "已达成" : "进行中", pct: done ? 100 : 20 };
}

/* 计算主线总体进度摘要（供主界面与剧情面板调用） */
function getStoryOverallSummary() {
  const sp = ensureStoryProgressState();
  if (!sp || typeof STORY_CHAPTERS === "undefined") {
    return { totalPct: 0, activeChapter: null, activeDialogue: null, completedTasks: 0, totalTasks: 1 };
  }

  /* 同步修为解锁状态（静默检查） */
  checkRealmStoryTrigger({ silent: true });

  let totalItems = 0;
  let doneItems = 0;

  STORY_CHAPTERS.forEach(ch => {
    ch.quests.forEach(q => {
      totalItems++;
      if (sp.completedQuests[q.id] || isQuestCompleted(q)) doneItems++;
    });
    if (ch.choice) {
      totalItems++;
      if (sp.choicesMade[ch.id]) doneItems++;
    }
    if (ch.sideStories) {
      ch.sideStories.forEach(ss => {
        totalItems++;
        if (sp.sideStoriesDone && sp.sideStoriesDone[ss.id]) doneItems++;
      });
    }
  });

  const totalPct = totalItems > 0 ? Math.min(100, Math.round((doneItems / totalItems) * 100)) : 0;
  const activeChap = STORY_CHAPTERS.find(c => c.id === sp.chapterId) || STORY_CHAPTERS[0];
  const cursor = sp.dialogueCursor[activeChap.id] || 0;
  const activeDialogue = activeChap.dialogues[cursor] || activeChap.dialogues[0];

  /* 寻找当前章节第一个未领奖的任务 */
  const nextQuest = activeChap.quests.find(q => !sp.completedQuests[q.id]) || activeChap.quests[0];

  return {
    totalPct,
    doneItems,
    totalItems,
    activeChapter: activeChap,
    activeDialogue,
    dialogueIdx: cursor,
    dialogueTotal: activeChap.dialogues.length,
    nextQuest,
    nextRealmHint: getNextRealmTriggerHint()
  };
}

/* ============================================================
   保留原有社交/日常事件与秘境兼容函数
   ============================================================ */

function pickDialogue(npc) {
  if (!npc) return null;
  const stage = typeof getStoryStage === "function" ? getStoryStage() : "1000";
  const rank = S.flags.rank || "杂务";

  const candidates = (typeof DIALOGUES !== "undefined" ? DIALOGUES : []).filter(d => {
    if (d.stage !== "any" && d.stage !== stage) return false;
    if (RANKS.indexOf(rank) < RANKS.indexOf(d.playerRank)) return false;
    if (d.speaker !== npc.role && d.speaker !== npc.tier) return false;
    return true;
  });

  if (candidates.length === 0) return null;
  return pick(candidates).text;
}

function checkSundayEvent() {
  if (S.weekday !== 0) return;
  if (S.flags.lastSundayDay === S.day) return;
  S.flags.lastSundayDay = S.day;

  if (typeof SUNDAY_EVENTS === "undefined") return;
  const stage = typeof getStoryStage === "function" ? getStoryStage() : "1000";
  const candidates = SUNDAY_EVENTS.filter(e => e.stage === stage);
  if (candidates.length === 0) return;

  const ev = pick(candidates);
  log(`【闲谈】${ev.text}`, "c-blue");

  showModal("周日闲谈", `
    <p>你在院中遇到几位同门。</p>
    <p>他们正在低声讨论。</p>
    <p class="small">${ev.text}</p>
  `, [{ label: "继续", fn: closeModal }]);
}

function checkSectCompetition() {
  const d = getDateInfo();
  if (d.month !== 6 || d.day !== 1) return;

  const bucket = "year" + d.year;
  if (!S.flags.story[bucket]) S.flags.story[bucket] = {};
  const key = `${d.year}-sect`;
  if (S.flags.story[bucket][key]) return;
  S.flags.story[bucket][key] = true;

  const rank = S.flags.rank || "杂务";
  if (rank === "杂务") {
    showModal("宗内比拼 · 观战", `
      <p>6 月 1 日，宗门大殿。</p>
      <p>长老站在高台上：「一年一度的宗内比拼，现在开始。」</p>
      <p>你站在人群外，看着台上的师兄师姐比试。</p>
      <p class="small">你暗下决心：明年，我也要上台。</p>
    `, [{ label: "继续", fn: closeModal }]);
  } else {
    showModal("宗内比拼 · 参赛", `
      <p>6 月 1 日，宗门大殿。</p>
      <p>你走上擂台，与同门切磋剑道，获益良多。</p>
    `, [{ label: "继续", fn: closeModal }]);
  }
}

function checkUnionCompetition() {
  const d = getDateInfo();
  if (d.month !== 8 || d.day !== 1) return;

  const bucket = "year" + d.year;
  if (!S.flags.story[bucket]) S.flags.story[bucket] = {};
  const key = `${d.year}-union`;
  if (S.flags.story[bucket][key]) return;
  S.flags.story[bucket][key] = true;

  const rank = S.flags.rank || "杂务";
  if (rank === "杂务") {
    showModal("联盟比拼 · 观战", `
      <p>8 月 1 日，联盟会场。</p>
      <p>各宗门精英齐聚，剑气纵横。</p>
    `, [{ label: "继续", fn: closeModal }]);
  } else {
    showModal("联盟比拼", `
      <p>8 月 1 日，联盟会场。</p>
      <p>你作为本门代表登台亮相，见识了天下英豪。</p>
    `, [{ label: "继续", fn: closeModal }]);
  }
}

function checkSecretRealm() {
  const d = getDateInfo();
  if (d.year !== 1003 || d.month !== 10 || d.day !== 1) return;
  if (S.flags.secretRealm && S.flags.secretRealm.opened) return;
  if (!S.flags.secretRealm) S.flags.secretRealm = {};
  S.flags.secretRealm.opened = true;

  if (typeof triggerStorySecretRealm === "function") {
    triggerStorySecretRealm();
  }
}

function enterSecretRealm() {
  enterAdventure("realm_danxia");
}

function checkMasterDeath() {
  const d = getDateInfo();
  if (d.year !== 1003 || d.month !== 11 || d.day !== 1) return;
  const key = `1003-master-death`;
  if (!S.flags.story.year1003) S.flags.story.year1003 = {};
  if (S.flags.story.year1003[key]) return;
  S.flags.story.year1003[key] = true;

  if (S.flags.rank !== "真传" || !S.master) return;
  const master = S.npcMap[S.master];
  if (!master) return;

  showModal("师父重伤", `
    <p>11 月 1 日，深夜。</p>
    <p>师父被抬回了宗门：「秘境深处……太渊魔尊遗念蠢蠢欲动……」</p>
  `, [{ label: "继续", fn: closeModal }]);
}

function checkFinalBattle() {
  const d = getDateInfo();
  if (d.year !== 1004 || d.month !== 4 || d.day !== 1) return;
  if (!S.flags.story.year1004) S.flags.story.year1004 = {};
  if (S.flags.story.year1004.final) return;
  S.flags.story.year1004.final = true;

  if (typeof triggerFinalBattle === "function") {
    triggerFinalBattle();
  }
}

if (typeof window !== "undefined") {
  window.formatStoryText = formatStoryText;
  window.resolveStoryRewardItemId = resolveStoryRewardItemId;
  window.getStoryRewardItemName = getStoryRewardItemName;
  window.ensureStoryProgressState = ensureStoryProgressState;
  window.checkRealmStoryTrigger = checkRealmStoryTrigger;
  window.openChapterDialogueModal = openChapterDialogueModal;
  window.openSideStoryModal = openSideStoryModal;
  window.isQuestCompleted = isQuestCompleted;
  window.getQuestProgressInfo = getQuestProgressInfo;
  window.getStoryOverallSummary = getStoryOverallSummary;
}
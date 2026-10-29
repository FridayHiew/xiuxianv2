/* ============================================================
   ui/story.js - 主线剧情界面与主界面故事进度/互动对白对话框组件
   ============================================================ */

let currentSelectedChapterId = null;

function fmtStory(str) {
  return typeof formatStoryText === "function" ? formatStoryText(str) : (str || "");
}

function renderStoryUI() {
  if (typeof STORY_CHAPTERS === "undefined" || !STORY_CHAPTERS) {
    return `<div class="card"><p class="empty">剧情章节数据未加载。</p></div>`;
  }

  const sp = typeof ensureStoryProgressState === "function"
    ? ensureStoryProgressState()
    : (S.flags.storyProgress || { chapterId: 1, unlockedChapters: { 1: true }, dialogueCursor: {}, completedQuests: {}, choicesMade: {}, sideStoriesDone: {} });

  /* 同步修为境界自动解锁 */
  if (typeof checkRealmStoryTrigger === "function") {
    checkRealmStoryTrigger({ silent: true });
  }

  const summary = typeof getStoryOverallSummary === "function"
    ? getStoryOverallSummary()
    : { totalPct: 0, doneItems: 0, totalItems: 1, nextRealmHint: null };

  const activeChapId = sp.chapterId || 1;
  const viewChapId = currentSelectedChapterId || activeChapId;
  const chapter = STORY_CHAPTERS.find(c => c.id === viewChapId) || STORY_CHAPTERS[0];

  const dlgList = chapter.dialogues || [];
  const curDlgIdx = Math.max(0, Math.min(sp.dialogueCursor[chapter.id] || 0, Math.max(0, dlgList.length - 1)));
  const currentDlg = dlgList[curDlgIdx] || { speaker: "天道仙音", role: "引路人", avatar: "✨", emotion: "肃穆", text: "前路漫漫，唯道心永恒。" };

  const playerInfo = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: 0, lvl: 0 };
  const playerRealmStr = playerInfo.realm === 0
    ? "凡胎肉体"
    : `${REALMS[playerInfo.realm].name} · ${subName(playerInfo.lvl)}${playerInfo.lvl}重`;

  let html = "";

  /* 1. 顶部全局修仙故事进度看板 */
  html += `
    <div class="story-master-progress-card">
      <div class="story-master-top">
        <div>
          <div class="story-master-label">太源道图 · 修仙总进度</div>
          <div class="story-master-sub">当前境界：<b>${playerRealmStr}</b> · 已达成 ${summary.doneItems} / ${summary.totalItems} 项道途节点</div>
        </div>
        <div class="story-master-pct">${summary.totalPct}%</div>
      </div>
      <div class="story-master-bar-track">
        <div class="story-master-bar-fill" style="width:${summary.totalPct}%;"></div>
      </div>
      <div class="story-trigger-hint-row">
        ${summary.nextRealmHint
          ? `<span>🔮 境界触发预告：<b>${fmtStory(summary.nextRealmHint.title)}</b>（${fmtStory(summary.nextRealmHint.conditionText)}）</span>`
          : `<span>👑 已解锁全部五章主线宏篇 · 登临金丹初期大道</span>`}
      </div>
    </div>
  `;

  /* 2. 章节节点切换栏 */
  html += `<div class="story-tabs-bar">`;
  STORY_CHAPTERS.forEach(chap => {
    const isUnlocked = !!(sp.unlockedChapters && sp.unlockedChapters[chap.id]) || chap.id <= activeChapId;
    const isActive = chap.id === chapter.id;
    const isCleared = chap.quests.every(q => sp.completedQuests[q.id]);
    html += `
      <button class="story-tab-btn ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}"
              onclick="selectStoryChapter(${chap.id})" ${!isUnlocked ? 'disabled' : ''}>
        <span>第${chap.id}章</span>
        <span class="small">${!isUnlocked ? '🔒 未开启' : (isCleared ? '✓ 已圆满' : '进行中')}</span>
      </button>
    `;
  });
  html += `</div>`;

  /* 3. 当前章节视觉横幅 */
  html += `
    <div class="story-chapter-banner" style="margin-top:16px; min-height:165px; padding:24px 16px 16px; background-image: linear-gradient(180deg, rgba(6,12,8,0.25) 0%, rgba(8,16,11,0.94) 100%), url('${chapter.bgImage}');">
      <div class="story-banner-content">
        <div class="story-banner-tag" style="margin-top:8px; margin-bottom:8px; display:inline-block; padding:3px 8px; background:rgba(0,0,0,0.45); border-radius:4px; border:1px solid rgba(212,163,71,0.3);">📍 ${fmtStory(chapter.location || '云霄仙境')} · 本章上限：${fmtStory(chapter.maxRealmName)}</div>
        <h2 class="story-banner-title">${fmtStory(chapter.title)}</h2>
        <div class="story-banner-sub">${fmtStory(chapter.subtitle || '')} · ${fmtStory(chapter.triggerConditionText || '')}</div>
      </div>
    </div>
  `;

  /* 4. 章节剧情梗概 */
  html += `
    <div class="card story-overview-card">
      <div class="story-desc-text">${fmtStory(chapter.desc)}</div>
    </div>
  `;

  /* 5. 核心：互动式对白对话框 (Interactive Dialogue Box) */
  html += `
    <div class="story-dialogue-box-header">
      <h4 class="story-section-title" style="margin:0;">💬 仙途剧场 · 互动对白对话框</h4>
      <div class="story-dialogue-controls-top">
        <button class="small" onclick="openChapterDialogueModal(${chapter.id}, ${curDlgIdx})">🎬 剧场弹窗</button>
        <button class="small" onclick="toggleShowAllStoryDialogues()">${sp.showAllDialogues ? '收起全部台词' : '📜 展开全部台词'}</button>
      </div>
    </div>

    <div class="story-interactive-dialog-box">
      <div class="story-dialog-stage">
        <div class="story-dialog-portrait-wrap">
          <div class="story-dialog-portrait">${currentDlg.avatar || "🧙‍♂️"}</div>
          <div class="story-dialog-step-badge">第 ${curDlgIdx + 1} / ${dlgList.length} 幕</div>
        </div>
        <div class="story-dialog-main">
          <div class="story-dialog-speaker-bar">
            <span class="story-dialog-speaker-name">${fmtStory(currentDlg.speaker)}</span>
            <span class="story-dialog-speaker-meta">${fmtStory(currentDlg.sceneTag ? currentDlg.sceneTag + " · " : "")}${fmtStory(currentDlg.role || "修真人物")} · ${fmtStory(currentDlg.emotion || "肃穆")}</span>
          </div>
          <div class="story-dialog-quote-text">${fmtStory(currentDlg.text)}</div>
        </div>
      </div>

      <div class="story-dialog-footer-bar">
        <div class="story-dialog-dots">
          ${dlgList.map((d, i) => `
            <span class="story-dialog-dot ${i === curDlgIdx ? 'active' : ''}" onclick="setStoryDialogueIndex(${chapter.id}, ${i})" title="${fmtStory(d.sceneTag || ('第 ' + (i + 1) + ' 幕'))}"></span>
          `).join("")}
        </div>
        <div class="story-dialog-nav-btns">
          <button class="small" onclick="stepStoryDialogue(${chapter.id}, -1)" ${curDlgIdx <= 0 ? 'disabled' : ''}>◀ 上一幕</button>
          <button class="primary small" onclick="stepStoryDialogue(${chapter.id}, 1)">
            ${curDlgIdx < dlgList.length - 1 ? '下一幕对白 ▶' : '↻ 重新品读'}
          </button>
        </div>
      </div>
    </div>
  `;

  /* 可选展开的全部台词回顾 */
  if (sp.showAllDialogues) {
    html += `<div class="story-dialogue-list">`;
    dlgList.forEach((dlg, idx) => {
      html += `
        <div class="story-dialogue-card ${idx === curDlgIdx ? 'active-line' : ''}" onclick="setStoryDialogueIndex(${chapter.id}, ${idx})" style="cursor:pointer;">
          <div class="story-avatar">${dlg.avatar}</div>
          <div class="story-dialogue-body">
            <div class="story-speaker">${fmtStory(dlg.speaker)} <span class="small" style="color:var(--text-dim); font-weight:400;">· ${fmtStory(dlg.sceneTag || dlg.role || '')}</span></div>
            <div class="story-text">${fmtStory(dlg.text)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  /* 6. 新增：章节支线奇遇与人物羁绊 (Side Stories) */
  if (chapter.sideStories && chapter.sideStories.length > 0) {
    html += `<h4 class="story-section-title">📖 章节支线奇遇 · 人物羁绊</h4>`;
    html += `<div class="story-quest-list">`;
    chapter.sideStories.forEach(side => {
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

      html += `
        <div class="card story-quest-card ${isDone ? 'quest-done' : ''}">
          <div class="story-quest-header">
            <div class="story-quest-title">
              <span>${side.avatar || '📖'}</span>
              <b>${fmtStory(side.title)}</b>
              <span class="tag">${fmtStory(side.npc)}</span>
            </div>
            <div>
              <button class="${isDone ? 'small' : 'primary small'}" onclick="openSideStoryModal(${chapter.id}, '${side.id}', 0)">
                ${isDone ? '✓ 回顾奇遇' : '💬 触发奇遇 ▶'}
              </button>
            </div>
          </div>
          <div class="small" style="color:var(--text-dim); margin-top:4px;">${fmtStory(side.summary)}</div>
          <div class="small" style="color:var(--text-gold); margin-top:4px;">机缘赏赐：${rwTags.join(" · ")}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  /* 7. 命运抉择 */
  if (chapter.choice) {
    const choiceMade = sp.choicesMade[chapter.id];
    html += `<h4 class="story-section-title">⚖️ 章节命运抉择</h4>`;
    html += `<div class="card story-choice-card">`;
    html += `<div class="story-choice-title">${fmtStory(chapter.choice.title)}</div>`;
    html += `<div class="story-choice-desc">${fmtStory(chapter.choice.desc)}</div>`;

    if (choiceMade) {
      const chosenOpt = choiceMade === 'A' ? chapter.choice.optionA : chapter.choice.optionB;
      html += `
        <div class="story-choice-done">
          <div>已定道心抉择：<b>${fmtStory(chosenOpt.label)}</b></div>
          <div class="small" style="color:var(--text-gold); margin-top:4px;">机缘反馈：${fmtStory(chosenOpt.rewardText)}</div>
        </div>
      `;
    } else {
      html += `
        <div class="story-choice-actions">
          <button class="story-choice-btn" onclick="makeStoryChoice(${chapter.id}, 'A')">
            <div><b>选项一：${fmtStory(chapter.choice.optionA.label)}</b></div>
            <div class="small" style="color:var(--text-gold); margin-top:2px;">${fmtStory(chapter.choice.optionA.rewardText)}</div>
          </button>
          <button class="story-choice-btn" onclick="makeStoryChoice(${chapter.id}, 'B')">
            <div><b>选项二：${fmtStory(chapter.choice.optionB.label)}</b></div>
            <div class="small" style="color:var(--text-gold); margin-top:2px;">${fmtStory(chapter.choice.optionB.rewardText)}</div>
          </button>
        </div>
      `;
    }
    html += `</div>`;
  }

  /* 8. 章节修真目标任务列表 */
  html += `<h4 class="story-section-title">🎯 章节主线目标</h4>`;
  html += `<div class="story-quest-list">`;
  let completedCount = 0;

  chapter.quests.forEach(q => {
    const isDone = isQuestCompleted(q);
    const isClaimed = !!sp.completedQuests[q.id];
    if (isClaimed) completedCount++;

    const progInfo = typeof getQuestProgressInfo === "function"
      ? getQuestProgressInfo(q)
      : { text: isDone ? "已达成" : "进行中", pct: isDone ? 100 : 0 };

    const rewardTags = [];
    if (q.reward.stone) rewardTags.push(`灵石 +${q.reward.stone}`);
    if (q.reward.contrib) rewardTags.push(`贡献 +${q.reward.contrib}`);
    if (q.reward.exp) rewardTags.push(`修为 +${q.reward.exp}`);
    if (q.reward.item) {
      const itemName = typeof getStoryRewardItemName === "function" ? getStoryRewardItemName(q.reward.item) : q.reward.item;
      rewardTags.push(`获得【${itemName}】`);
    }

    html += `
      <div class="card story-quest-card ${isClaimed ? 'quest-done' : ''}">
        <div class="story-quest-header">
          <div class="story-quest-title">
            <span>${isClaimed ? '✅' : (isDone ? '🌟' : '📌')}</span>
            <b>${fmtStory(q.name)}</b>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            ${isClaimed
              ? `<span class="small" style="color:var(--c-good); font-weight:600;">已领赏</span>`
              : isDone
                ? `<button class="primary small" onclick="claimStoryQuestReward('${q.id}', ${chapter.id})">领取赏赐</button>`
                : `<button class="small" onclick="navigateToStoryQuest('${q.id}', ${chapter.id})">前往完成 ▶</button>`
            }
          </div>
        </div>
        <div class="small" style="color:var(--text-dim); margin-top:4px;">${fmtStory(q.desc)}</div>
        <div class="story-quest-prog-row">
          <div class="story-quest-prog-bar">
            <div class="story-quest-prog-fill" style="width:${isClaimed ? 100 : progInfo.pct}%;"></div>
          </div>
          <span class="story-quest-prog-text">${progInfo.text}</span>
        </div>
        <div class="small" style="color:var(--text-gold); margin-top:4px;">赏赐：${rewardTags.join(" · ")}</div>
      </div>
    `;
  });
  html += `</div>`;

  /* 9. 开启下一章按钮 */
  if (completedCount >= chapter.quests.length && chapter.id < STORY_CHAPTERS.length) {
    const nextChap = STORY_CHAPTERS.find(c => c.id === chapter.id + 1);
    html += `
      <div style="margin-top:14px; text-align:center;">
        <button class="primary block" style="font-size:15px; padding:12px;" onclick="advanceStoryChapter(${chapter.id + 1})">
          ✨ 本章目标圆满 · 开启【${nextChap ? fmtStory(nextChap.title) : '下一章'}】
        </button>
      </div>
    `;
  }

  const topTabsHtml = `
    <div class="fs-rect-tabs">
      ${STORY_CHAPTERS.map(chap => {
        const isUnlocked = !!(sp.unlockedChapters && sp.unlockedChapters[chap.id]) || chap.id <= activeChapId;
        const isActive = chap.id === chapter.id;
        return `
          <button type="button"
                  class="fs-rect-tab ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}"
                  onclick="openStoryChapterDetail(${chap.id})"
                  title="${fmtStory(chap.title)}">
            第${chap.id}章
          </button>
        `;
      }).join("")}
      <button type="button" class="fs-rect-tab" onclick="openDailyTasksModal()">功课</button>
      <button type="button" class="fs-rect-tab" onclick="switchTab('social')">道友</button>
    </div>
  `;

  return `
    <div class="fs-detail-page">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(topTabsHtml, "太源道图 · 仙途") : topTabsHtml}
      <div class="fs-detail-scroll-body">
        ${html}
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("returnFromDetailPage()") : ""}
    </div>
  `;
}

/* ============================================================
   嵌入在【历练日常】主界面的故事进度与实时对白组件
   ============================================================ */
function renderMainStoryBannerWidget() {
  if (typeof STORY_CHAPTERS === "undefined" || !S) return "";
  const sp = typeof ensureStoryProgressState === "function" ? ensureStoryProgressState() : null;
  if (!sp) return "";

  const summary = typeof getStoryOverallSummary === "function" ? getStoryOverallSummary() : null;
  if (!summary || !summary.activeChapter) return "";

  const chap = summary.activeChapter;
  const dlg = summary.activeDialogue || chap.dialogues[0];
  const quest = summary.nextQuest;
  const questProg = quest && typeof getQuestProgressInfo === "function"
    ? getQuestProgressInfo(quest)
    : { text: "", pct: 0 };

  return `
    <div class="main-story-widget-card">
      <div class="main-story-widget-top">
        <div class="main-story-widget-title-wrap">
          <span class="main-story-badge">主线进度 ${summary.totalPct}%</span>
          <b class="main-story-chap-name">${fmtStory(chap.title)}</b>
        </div>
        <button class="small" onclick="openStoryChapterDetail(${chap.id})">进入主线剧场 ▶</button>
      </div>

      <div class="main-story-dialog-mini">
        <div class="main-story-dialog-avatar">${dlg.avatar || "🧙‍♂️"}</div>
        <div class="main-story-dialog-content">
          <div class="main-story-dialog-speaker">
            <b>${fmtStory(dlg.speaker)}</b>
            <span class="small" style="color:var(--text-dim);">（${fmtStory(dlg.sceneTag || ('对白 ' + (summary.dialogueIdx + 1) + '/' + summary.dialogueTotal))}）</span>
          </div>
          <div class="main-story-dialog-line">${fmtStory(dlg.text)}</div>
        </div>
        <button class="small" onclick="stepStoryDialogue(${chap.id}, 1)" title="切换下一幕对白">💬 下一幕</button>
      </div>

      ${quest ? `
        <div class="main-story-quest-strip">
          <span>🎯 当前目标：<b>${fmtStory(quest.name)}</b>（${questProg.text}）</span>
          ${summary.nextRealmHint ? `<span class="small" style="color:var(--text-gold);">${fmtStory(summary.nextRealmHint.conditionText)}</span>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

/* ============================================================
   交互控制函数
   ============================================================ */

function selectStoryChapter(chapId) {
  currentSelectedChapterId = chapId;
  render();
}

function stepStoryDialogue(chapId, delta) {
  const sp = ensureStoryProgressState();
  const chapter = STORY_CHAPTERS.find(c => c.id === chapId);
  if (!chapter || !chapter.dialogues || chapter.dialogues.length === 0) return;

  const total = chapter.dialogues.length;
  let cur = sp.dialogueCursor[chapId] || 0;
  cur += delta;
  if (cur >= total) cur = 0;
  if (cur < 0) cur = total - 1;

  sp.dialogueCursor[chapId] = cur;
  save();
  render();
}

function setStoryDialogueIndex(chapId, idx) {
  const sp = ensureStoryProgressState();
  sp.dialogueCursor[chapId] = idx;
  save();
  render();
}

function toggleShowAllStoryDialogues() {
  const sp = ensureStoryProgressState();
  sp.showAllDialogues = !sp.showAllDialogues;
  save();
  render();
}

function navigateToStoryQuest(questId, chapId) {
  const chap = STORY_CHAPTERS.find(c => c.id === chapId);
  if (!chap) return;
  const quest = chap.quests.find(q => q.id === questId);
  if (!quest) return;

  if (typeof closeDaySubPanel === "function") {
    daySubPanel = null;
  }

  if (quest.targetType === "dungeon" && quest.dungeonId) {
    currentTab = "adventureMap";
    render();
    enterAdventure(quest.dungeonId);
    return;
  }

  if (quest.targetType === "choreCount" || quest.targetType === "rank" || quest.targetType === "contrib") {
    switchTab("sect");
    return;
  }

  if (quest.targetType === "realm") {
    if (typeof gotoCultivate === "function") gotoCultivate();
    else switchTab("cave");
    return;
  }

  if (quest.actionTab) {
    if (quest.actionTab === "day") {
      switchTab("sect");
    } else {
      switchTab(quest.actionTab);
    }
  }
}

function claimStoryQuestReward(questId, chapId) {
  const sp = ensureStoryProgressState();
  const chap = STORY_CHAPTERS.find(c => c.id === chapId);
  if (!chap) return;
  const quest = chap.quests.find(q => q.id === questId);
  if (!quest) return;

  if (sp.completedQuests[questId]) return;
  sp.completedQuests[questId] = true;

  const rewardParts = [];
  if (quest.reward.stone) {
    S.stone = (S.stone || 0) + quest.reward.stone;
    rewardParts.push(`灵石 +${quest.reward.stone}`);
  }
  if (quest.reward.contrib) {
    S.contrib = (S.contrib || 0) + quest.reward.contrib;
    rewardParts.push(`宗门贡献 +${quest.reward.contrib}`);
  }
  if (quest.reward.exp) {
    if (typeof gainCultivationExp === "function") gainCultivationExp(quest.reward.exp);
    else S.exp = (S.exp || 0) + quest.reward.exp;
    rewardParts.push(`修为 +${quest.reward.exp}`);
  }
  if (quest.reward.item) {
    const finalId = typeof resolveStoryRewardItemId === "function"
      ? resolveStoryRewardItemId(quest.reward.item)
      : quest.reward.item;
    if (finalId && ITEMS[finalId]) {
      addItem(finalId, 1);
      rewardParts.push(`获得【${ITEMS[finalId].name}】`);
      if (ITEMS[finalId].type === "heartFragment") {
        rewardParts.push(`（可在【道 > 背包 > 秘籍】中参悟）`);
      }
    }
  }

  log(`【主线赏赐】完成【${fmtStory(quest.name)}】，${rewardParts.join("，")}！`, "c-gold");

  /* 如果本章全部任务均已领赏，自动解锁下一章 */
  const allClaimed = chap.quests.every(q => sp.completedQuests[q.id]);
  if (allClaimed && chap.id < STORY_CHAPTERS.length) {
    const nextId = chap.id + 1;
    sp.unlockedChapters[nextId] = true;
    log(`【章节圆满】${fmtStory(chap.title)} 目标全部达成，已解锁第 ${nextId} 章！`, "c-gold");
  }

  save();
  render();
  showActionModal("主线赏赐领取成功", rewardParts);
}

function makeStoryChoice(chapId, optionKey) {
  const sp = ensureStoryProgressState();
  const chap = STORY_CHAPTERS.find(c => c.id === chapId);
  if (!chap || !chap.choice) return;

  const opt = optionKey === 'A' ? chap.choice.optionA : chap.choice.optionB;
  sp.choicesMade[chapId] = optionKey;

  if (opt.morality) S.morality = Math.max(0, Math.min(100, (S.morality || 50) + opt.morality));
  if (opt.dao) S.dao = (S.dao || 0) + opt.dao;
  if (opt.stone) S.stone = (S.stone || 0) + opt.stone;

  log(`【命运抉择】选择【${fmtStory(opt.label)}】！${fmtStory(opt.rewardText)}`, "c-gold");
  save();
  render();
}

function advanceStoryChapter(nextChapId) {
  const sp = ensureStoryProgressState();
  sp.unlockedChapters[nextChapId] = true;
  sp.chapterId = nextChapId;
  currentSelectedChapterId = nextChapId;
  log(`【主线推进】正式踏入第 ${nextChapId} 章主线剧情！`, "c-gold");
  save();
  render();
  if (typeof openChapterDialogueModal === "function") {
    openChapterDialogueModal(nextChapId, 0);
  }
}

if (typeof window !== "undefined") {
  window.renderStoryUI = renderStoryUI;
  window.renderMainStoryBannerWidget = renderMainStoryBannerWidget;
  window.selectStoryChapter = selectStoryChapter;
  window.stepStoryDialogue = stepStoryDialogue;
  window.setStoryDialogueIndex = setStoryDialogueIndex;
  window.toggleShowAllStoryDialogues = toggleShowAllStoryDialogues;
  window.navigateToStoryQuest = navigateToStoryQuest;
}

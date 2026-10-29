/* ============================================================
   ui/cave.js - 洞府页面（水墨全景 + 五大对齐详情页 + 5秒吐纳呼吸特效 + 左右滑动切换）
   ============================================================ */

const CAVE_DETAIL_TABS = [
  { id: "facility", name: "聚灵阵", title: "聚灵阵与洞天营造" },
  { id: "alchemy",  name: "炼丹房", title: "紫府丹房" },
  { id: "forge",    name: "炼器室", title: "天机器室" },
  { id: "pet",      name: "灵兽苑", title: "灵兽仙苑" },
  { id: "garden",   name: "百草园", title: "百草灵园" },
];

let currentSelectedSeedId = "seed_xigu";
let _caveTunaInterval = null;

function getCaveTabs() {
  return CAVE_DETAIL_TABS.map(t => ({
    id: t.id,
    name: t.name,
    locked: false,
  }));
}

function switchCaveTab(t) {
  currentCaveTab = t;
  caveSubPanel = t;
  render();
}

/* 左右滑动或点击切换洞府详情子页面（如：聚灵阵 -> 炼丹房 -> 炼器室 -> 灵兽苑 -> 百草园） */
function swipeCaveSubPanel(offset) {
  const validIds = CAVE_DETAIL_TABS.map(t => t.id);
  let curIdx = validIds.indexOf(caveSubPanel || currentCaveTab || "facility");
  if (curIdx === -1) curIdx = 0;
  const nextIdx = (curIdx + offset + validIds.length) % validIds.length;
  const nextTab = validIds[nextIdx];
  caveSubPanel = nextTab;
  currentCaveTab = nextTab;
  render();
}

/* 为洞府详情页面绑定左右滑动手势（支持触屏 touch 与鼠标拖拽 swipe） */
function bindCavePageSwipeGesture() {
  if (typeof document === "undefined") return;
  const pageEl = document.querySelector("#panelContent .fs-detail-page");
  if (!pageEl || pageEl._caveSwipeBound) return;
  pageEl._caveSwipeBound = true;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  const handleHorizontalSwipe = (dx, dy) => {
    if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
    /* 顺畅在（聚灵阵、炼丹房、炼器室、灵兽苑、百草园）5个tab之间循环滑动切换 */
    if (dx < 0) {
      swipeCaveSubPanel(1);
    } else {
      swipeCaveSubPanel(-1);
    }
  };

  pageEl.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  pageEl.addEventListener("touchend", (e) => {
    if (!tracking || !e.changedTouches || e.changedTouches.length === 0) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    handleHorizontalSwipe(dx, dy);
  }, { passive: true });

  pageEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });

  pageEl.addEventListener("mouseup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) >= 56) {
      handleHorizontalSwipe(dx, dy);
    }
  });
}

/* ============================================================
   洞府打坐吐纳：5秒周天呼吸特效
   ============================================================ */

function playTunaBreathSfx() {
  try {
    if (typeof window === "undefined") return;
    const ctx = (window.xianxiaAudio && window.xianxiaAudio.ctx)
      || (typeof getForgeAudioCtx === "function" ? getForgeAudioCtx() : null);
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 2.2);
    osc.frequency.exponentialRampToValueAtTime(196, now + 4.8);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 4.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 5.0);
  } catch (e) { /* ignore */ }
}

function startCaveTunaBreathing() {
  if (!S) return;
  if (typeof window !== "undefined" && window._isCaveTunaBreathing) {
    return;
  }
  const remain = ACTIONS_PER_SLOT - (S.actionsUsed || 0);
  if (remain <= 0) {
    log("本时段行动已用完，无法继续吐纳。", "c-bad");
    return;
  }
  if (typeof canCultivateHeart === "function") {
    const check = canCultivateHeart();
    if (!check.ok) {
      log(`无法吐纳修炼：【${check.reason}】`, "c-bad");
      return;
    }
  }

  if (typeof window !== "undefined") {
    window._isCaveTunaBreathing = true;
    window._caveTunaPct = 0;
    window._caveTunaStageText = "🌬️ 吸纳灵气 · 引天地清气入体...";
  }

  playTunaBreathSfx();
  render();

  if (_caveTunaInterval) {
    clearInterval(_caveTunaInterval);
    _caveTunaInterval = null;
  }

  let step = 0;
  const totalSteps = 50; /* 50 × 100ms = 5000ms (5秒) */

  _caveTunaInterval = setInterval(() => {
    step++;
    const pct = Math.min(100, Math.round((step / totalSteps) * 100));
    const remainSec = Math.max(0, ((totalSteps - step) * 0.1)).toFixed(1);

    let stageText = "🌬️ 吸纳灵气 · 引天地清气入体...";
    let phaseSub = "深吸 · 灵气汇聚奇经八脉";
    if (pct < 40) {
      stageText = "🌬️ 吸纳灵气 · 引天地清气入体...";
      phaseSub = `吸气纳灵 · 剩余 ${remainSec}秒`;
    } else if (pct < 72) {
      stageText = "☯️ 屏息凝神 · 周天搬运炼化真元...";
      phaseSub = `周天运转 · 剩余 ${remainSec}秒`;
    } else {
      stageText = "✨ 吐故纳新 · 万流归宗沉入丹田...";
      phaseSub = `呼气归元 · 剩余 ${remainSec}秒`;
    }

    if (typeof window !== "undefined") {
      window._caveTunaPct = pct;
      window._caveTunaStageText = stageText;
    }

    const statusEl = typeof document !== "undefined" ? document.getElementById("caveTunaBreathStatus") : null;
    const fillEl = typeof document !== "undefined" ? document.getElementById("caveTunaBreathFill") : null;
    const timeEl = typeof document !== "undefined" ? document.getElementById("caveTunaBreathTime") : null;

    if (statusEl) statusEl.textContent = stageText;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (timeEl) timeEl.textContent = phaseSub;

    if (step >= totalSteps) {
      clearInterval(_caveTunaInterval);
      _caveTunaInterval = null;
      if (typeof window !== "undefined") {
        window._isCaveTunaBreathing = false;
        window._caveTunaPct = 0;
      }
      if (typeof doCultivate === "function") {
        doCultivate(1);
      }
    }
  }, 100);
}

/* ============================================================
   灵兽苑 UI（对齐炼丹房页面设计 + 0级1只每升1级+1只容量限制）
   ============================================================ */

function renderCavePet() {
  const beastLv = (S.cave && S.cave.beast) || 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + beastLv);
  const petList = (S.pets && Array.isArray(S.pets.list)) ? S.pets.list : [];
  const curPets = petList.length;
  const activePet = (S.equipped && S.equipped.pet)
    ? petList.find(p => p.uid === S.equipped.pet)
    : null;
  const moodEmoji = MOOD_EMOJI[(S.mood || 0) + 2] || "😐";
  const moodName = MOOD_NAMES[(S.mood || 0) + 2] || "平静";
  const capPct = Math.min(100, Math.round((curPets / Math.max(1, maxPets)) * 100));

  let html = `
    <div class="card">
      <div class="row">
        <span>灵兽苑 Lv.${beastLv} / 10</span>
        <b>容量上限 ${curPets} / ${maxPets} 只</b>
      </div>
      <div class="craft-progress-track" style="margin:4px 0;">
        <div class="craft-progress-fill" style="width:${capPct}%;"></div>
      </div>
      <div class="row" style="margin-bottom:4px;">
        <span class="small" style="color:var(--text-dim);">当前灵兽容量：${curPets} / ${maxPets} 只</span>
        <button type="button" class="primary small" onclick="openBuyPetFood()">🥣 购买饲灵丸</button>
      </div>
    </div>
  `;

  html += `<h4>随行伴生灵兽 (${curPets} / ${maxPets})</h4>`;
  html += `<p class="small">点击灵兽条目即可查看详细属性、喂食添粮、改名、突破或切换出战状态。</p>`;

  if (petList.length === 0) {
    html += `<p class="empty">尚未收服伴生灵兽（可在野外历练战斗中对炼气一层幼兽施展【收服】）。</p>`;
    return html;
  }

  html += `<div class="parchment-list-wrap">`;
  petList.forEach(pet => {
    const talent = getPetTalent(pet.talent);
    const bloodline = getPetBloodline(pet.bloodline);
    const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡阶";
    const equipped = S.equipped && S.equipped.pet === pet.uid;
    const hunger = Math.floor(pet.hunger !== undefined ? pet.hunger : 100);
    const icon = typeof getPetOrAllyIcon === "function" ? getPetOrAllyIcon(pet) : "🐾";

    let totalBowlCount = 0;
    for (const fid in (pet.foodStorage || {})) {
      if (pet.foodStorage[fid] > 0) totalBowlCount += pet.foodStorage[fid];
    }

    const tierCls = pet.realm >= 2 ? "tier-gold" : pet.realm >= 1 ? "tier-purple" : "tier-blue";

    html += `
      <div class="parchment-item-row" onclick="openPetDetail('${pet.uid}')" title="点击查看【${pet.name}】详情与操作">
        <div class="p-row-left">
          <div class="p-row-icon">${icon}</div>
          <span class="p-row-name ${tierCls}">${pet.name}</span>
          <span class="p-row-badge">饱腹${hunger}/100 · 碗余${totalBowlCount}</span>
        </div>
        <div class="fs-card-right-group" onclick="event.stopPropagation();">
          <button type="button" class="small" style="padding:2px 7px; font-size:11px;" onclick="openPetFeed('${pet.uid}')">喂食</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  return html;
}

/* 保留兼容旧调用 */
function renderPetCard(pet) {
  return "";
}

/* ========== 灵兽详细弹窗（集成喂食、改名、突破、出战/休息） ========== */

function openPetDetail(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;
  const stats = getPetStats(pet);
  const talent = getPetTalent(pet.talent);
  const bloodline = getPetBloodline(pet.bloodline);
  const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡人";
  const equipped = S.equipped && S.equipped.pet === pet.uid;

  const bowlItems = [];
  let totalBowlCount = 0;
  for (const fid in (pet.foodStorage || {})) {
    const cnt = pet.foodStorage[fid];
    if (cnt > 0) {
      const f = (typeof getItem === "function" ? getItem(fid) : null) || ITEMS[fid];
      bowlItems.push(`${f ? f.name : fid} ×${cnt}`);
      totalBowlCount += cnt;
    }
  }

  const resistHtml = Object.keys(stats.resistances || {}).map(k => {
    const def = getStatusDef(k);
    const name = def ? def.name : k;
    const v = stats.resistances[k];
    return `<div class="row"><span>${name}抗性</span><b>${resistLabel(v)}（${v}）</b></div>`;
  }).join("");

  const actions = [
    {
      label: equipped ? "收回休息" : "⚔️ 派遣出战",
      primary: true,
      fn: () => {
        if (equipped) unequipPet();
        else equipPet(uid);
        closeModal();
        render();
      }
    },
  ];

  if (pet.lvl >= 10) {
    actions.push({
      label: "⚡ 境界突破",
      fn: () => { closeModal(); breakPet(uid); }
    });
  }

  showModal("🐾 灵宠灵鉴 · " + pet.name, `
    <div class="card">
      <div class="row">
        <span>灵宠名字</span>
        <b>${pet.name} <button type="button" class="small" style="margin-left:6px;padding:1px 8px;font-size:0.75rem;vertical-align:middle;" onclick="openPetRename('${pet.uid}')">改名</button></b>
      </div>
      <div class="row"><span>天赋资质</span><b>${talent.name}（${talent.desc}）</b></div>
      <div class="row"><span>先天血脉</span><b>${bloodline.name}</b></div>
      <div class="row"><span>当前境界</span><b>${realmText}·${pet.lvl}重${equipped ? '（出战中）' : ''}</b></div>
      <div class="row"><span>修为进度</span><b>${pet.exp} / ${petExpNeed(pet.lvl)}</b></div>
      <div class="row"><span>饱腹状态</span><b>${Math.floor(pet.hunger || 0)} / 100</b></div>
      <div class="row"><span>食碗库存</span><b>${totalBowlCount > 0 ? bowlItems.join("、") : "空（请及时添粮）"}</b></div>
    </div>
    <h4>四维战力属性</h4>
    <div class="card">
      <div class="row"><span>攻击</span><b>${stats.atk}</b></div>
      <div class="row"><span>防御</span><b>${stats.def}</b></div>
      <div class="row"><span>身法</span><b>${stats.speed}</b></div>
      <div class="row"><span>气血</span><b>${stats.hpMax}</b></div>
      <div class="row"><span>灵力</span><b>${stats.mpMax}</b></div>
    </div>
    <h4>异象抗性</h4>
    <div class="card">${resistHtml || "<p class='empty'>无特殊抗性</p>"}</div>
  `, actions, { showCloseX: true });
}

/* ========== 改名 ========== */

function openPetRename(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;

  showModal("灵宠赐名", `
    <p>当前名字：<b>${pet.name}</b></p>
    <input id="petNameInput" value="${pet.name}" maxlength="8" style="width:100%;padding:6px;">
    <p class="small">最多 8 个字</p>
  `, [
    {
      label: "确定",
      primary: true,
      fn: () => {
        const inputEl = document.getElementById("petNameInput");
        const name = inputEl ? inputEl.value : pet.name;
        renamePet(uid, name);
        closeModal();
        openPetDetail(uid);
      }
    },
    { label: "取消", fn: () => { closeModal(); openPetDetail(uid); } },
  ], { showCloseX: true });
}

/* ========== 喂食 ========== */

function openPetFeed(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;

  /* 背包里所有饲灵丸与灵兽口粮 */
  const allFoods = [];
  for (const id in S.inventory) {
    if (!id || id === "undefined" || S.inventory[id] <= 0) continue;
    const item = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id];
    if (!item) continue;
    const isPetPill = (item.type === "pill" || item.type === "pillTemplate") && item.effect && item.effect.type === "petFood";
    const isFood = item.type === "food" || String(item.name || id).includes("饲灵丸");
    if (isPetPill || isFood) {
      allFoods.push({ id, item });
    }
  }

  /* 统计当前食碗里所有口粮 */
  const bowlItems = [];
  let totalBowlCount = 0;
  for (const fid in (pet.foodStorage || {})) {
    const cnt = pet.foodStorage[fid];
    if (cnt > 0) {
      const f = (typeof getItem === "function" ? getItem(fid) : null) || ITEMS[fid];
      bowlItems.push(`${f ? f.name : fid} ×${cnt}`);
      totalBowlCount += cnt;
    }
  }
  const bowlText = totalBowlCount > 0
    ? `<span style="color:#d8b878; font-weight:600;">共 ${totalBowlCount} 颗（${bowlItems.join("、")}）</span>`
    : `<span style="color:var(--c-bad);">当前为空（请添入口粮备用）</span>`;

  const availableFoods = allFoods.map(({ id, item }) => {
    const have = S.inventory[id] || 0;
    const stored = (pet.foodStorage && pet.foodStorage[id]) || 0;
    const hungerGain = (item.effect && item.effect.hunger) || item.hunger || 25;
    const expGain = (item.effect && item.effect.exp) || 0;
    return `
      <div class="row" style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed #3a2b18;">
        <div>
          <b>${item.name}</b> <span class="tag good">饱腹 +${hungerGain}</span>${expGain > 0 ? ` <span class="tag gold">修为 +${expGain}</span>` : ''}
          <div class="small" style="color:var(--text-dim); margin-top:2px;">背包拥有：<b>${have}</b>　|　碗内存量：<b style="color:#d8b878;">${stored}</b></div>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button class="primary small" onclick="feedPet('${uid}', '${id}', 1)" ${have <= 0 ? "disabled" : ""}>添入碗中 1</button>
          ${have >= 5 ? `<button class="small" onclick="feedPet('${uid}', '${id}', 5)">添入 5</button>` : ''}
        </div>
      </div>
    `;
  }).join("") || `<p class="empty">背包里暂无饲灵丸或灵兽口粮。<br><span class="small" style="color:var(--text-dim);">可前往【洞府 > 炼丹房】炼制饲灵丸，或在下方直接采买一阶口粮。</span></p>`;

  showModal("🥣 灵兽食碗 · " + pet.name, `
    <div class="card" style="margin-bottom:10px;">
      <div class="row">
        <span>当前饱腹状态</span>
        <b>${Math.floor(pet.hunger || 0)} / 100</b>
      </div>
      <div class="row" style="margin-top:4px;">
        <span>🥣 食碗库存余量</span>
        ${bowlText}
      </div>
      <div class="small" style="color:var(--text-dim); margin-top:6px; line-height:1.4;">
        💡 <b>饲养说明</b>：将饲灵丸放入食碗后，灵宠饥饿时会自动进食；若当前饥饿，放入时即时进食补足饱腹，余量保留在食碗中，按需消耗，不会遗失。
      </div>
    </div>

    <h4>从行囊添入兽粮</h4>
    <div class="card">${availableFoods}</div>
  `, [
    { label: "购买一阶饲灵丸", fn: () => { openBuyPetFood(); } },
    { label: "完成", fn: closeModal }
  ]);
}

/* ========== 买兽粮（只卖一阶，售价 30 铜钱） ========== */
function openBuyPetFood() {
  const money = S.money || 0;
  const canBuy1 = money >= 30;
  const canBuy5 = money >= 150;

  showModal("购买饲灵丸 · 仙兽口粮", `
    <div class="card" style="margin-bottom:8px;">
      <div class="row">
        <span><b>饲灵丸 (一阶)</b></span>
        <span class="tag gold">30 铜钱 / 颗</span>
      </div>
      <p class="small" style="color:var(--text-dim); margin-top:4px;">
        专为幼年仙宠研磨的一阶灵药口粮。服用后饱腹 +25，增长道行修为。
      </p>
      <div class="row" style="margin-top:8px;">
        <span>当前所携凡俗铜钱：</span>
        <b style="color:var(--text-gold); font-size:14px;">${money} 钱</b>
      </div>
    </div>
  `, [
    {
      label: "购买 1 颗 (30 铜钱)",
      primary: true,
      disabled: !canBuy1,
      fn: () => {
        buyPetFood("饲灵丸_1阶", 1);
        openBuyPetFood();
      }
    },
    {
      label: "购买 5 颗 (150 铜钱)",
      disabled: !canBuy5,
      fn: () => {
        buyPetFood("饲灵丸_1阶", 5);
        openBuyPetFood();
      }
    },
    { label: "关闭", fn: closeModal }
  ]);
}

/* ============================================================
   炼丹房 UI (基准模板：顶部加成造诣卡 + 极简名字行 + 点击弹窗炼制)
   ============================================================ */

function renderCaveAlchemy() {
  if (typeof isAlchemyUnlocked !== "function") {
    return `<p class="empty">炼丹系统未加载。</p>`;
  }

  const caveLv = getAlchemyCaveLv();
  const skillLv = getAlchemySkillLv();
  const output = calcAlchemyOutput();
  const moodEmoji = MOOD_EMOJI[(S.mood || 0) + 2] || "😐";
  const moodName = MOOD_NAMES[(S.mood || 0) + 2] || "平静";

  const caveBonus = caveLv >= 1 ? (caveLv - 1) * 0.5 : 0;
  const skillOutputBonus = typeof getAlchemySkillBonusOutput === "function" ? getAlchemySkillBonusOutput(skillLv) : (skillLv >= 9 ? 2 : skillLv >= 6 ? 1 : skillLv >= 3 ? 0.5 : 0);
  const skillRateBonus = typeof getAlchemySkillBonusRate === "function" ? getAlchemySkillBonusRate(skillLv) : (skillLv * 0.01);
  const alchemyMastery = typeof getCraftMasteryInfo === "function"
    ? getCraftMasteryInfo("炼丹")
    : { lvl: skillLv, exp: (S.skills?.["炼丹"]?.exp || 0), maxExp: 100, pct: Math.round(S.skills?.["炼丹"]?.exp || 0), title: "初窥门径", isMax: skillLv >= 10 };

  let html = `
    <div class="card">
      <div class="row">
        <span>紫府丹房 Lv.${caveLv} / 10 加成</span>
        <b>${caveLv >= 1 ? `+${caveBonus.toFixed(1)} 粒` : `未开辟（可在聚灵阵升级）`}</b>
      </div>
      <div class="row">
        <span>炼丹造诣 Lv.${alchemyMastery.lvl} <span class="tag gold">${alchemyMastery.title}</span></span>
        <b>成丹 +${(skillRateBonus * 100).toFixed(1)}% · 产量 +${skillOutputBonus.toFixed(1)} 粒</b>
      </div>
      <div class="craft-progress-track" style="margin:4px 0;">
        <div class="craft-progress-fill" style="width:${alchemyMastery.pct}%;"></div>
      </div>
      <div class="row" style="margin-bottom:4px;">
        <span class="small" style="color:var(--text-dim);">丹道熟练：${alchemyMastery.isMax ? '已臻圆满 (MAX)' : `${alchemyMastery.exp} / ${alchemyMastery.maxExp}`}</span>
        <button type="button" class="primary small" onclick="openCraftStudyModal('炼丹')">🔥 钻研丹道 / 提升造诣</button>
      </div>
      <div class="row"><span>单炉最大成丹</span><b>${output} 粒</b></div>
    </div>`;

  if (typeof RECIPES === "undefined" || !RECIPES) {
    return html + `<p class="empty">丹方数据未加载。</p>`;
  }

  const knownRecipes = RECIPES.filter(r => isRecipeKnown(r.id));

  html += `<h4>已掌握丹方 (${knownRecipes.length})</h4>`;
  html += `<p class="small">按境界分类归整，点击丹方查看药材并开炉炼丹（未习得丹方可前往宗门【丹方阁】兑换）。</p>`;

  if (knownRecipes.length === 0) {
    html += `<p class="empty">尚未解锁任何丹方。</p>`;
    return html;
  }

  const ALCHEMY_REALM_DEFS = [
    { key: "r3", realm: 3, name: "金丹", label: "金丹期丹方" },
    { key: "r2", realm: 2, name: "筑基", label: "筑基期丹方" },
    { key: "r1", realm: 1, name: "练气", label: "练气期丹方" },
  ];

  const getAlchemyRecipeRealm = (recipe) => {
    if (!recipe) return 1;
    if (recipe.realm !== undefined) return recipe.realm;
    const tier = recipe.tier || 1;
    return tier >= 3 ? 3 : tier >= 2 ? 2 : 1;
  };

  ALCHEMY_REALM_DEFS.forEach(sec => {
    const secList = knownRecipes.filter(r => getAlchemyRecipeRealm(r) === sec.realm);
    const isCollapsed = !!alchemyRealmCollapsed[sec.key];

    html += `
      <div class="parchment-group-header" onclick="toggleAlchemyRealmSublist('${sec.key}')" style="display:flex; justify-content:space-between; align-items:center; padding:7px 12px; margin:8px 0 4px; background:rgba(216,184,120,0.12); border-left:3px solid #c9a84c; border-radius:4px; cursor:pointer;" title="点击展开/收起${sec.name}期丹方">
        <span><b style="color:var(--text-gold);">${sec.name}期丹方</b> <span class="small" style="color:var(--text-dim);">(${secList.length} 方)</span></span>
        <span id="alchemy-arrow-${sec.key}" class="small" style="color:var(--text-dim);">${isCollapsed ? '展开 ▾' : '收起 ▴'}</span>
      </div>
      <div id="alchemy-sublist-${sec.key}" style="display:${isCollapsed ? 'none' : 'block'};">
    `;

    if (secList.length === 0) {
      html += `<p class="empty" style="padding:6px 0; font-size:12px;">暂无已掌握的${sec.name}期丹方。</p>`;
    } else {
      html += `<div class="parchment-list-wrap" style="margin-bottom:8px;">`;
      secList.forEach(recipe => {
        const checkOne = checkAlchemyMaterial(recipe.id, 1, 1);
        const anyMaterial = checkOne.ok;

        html += `
          <div class="parchment-item-row" onclick="openAlchemyRecipeModal('${recipe.id}')" title="点击查看《${recipe.name}》丹方详情与炼制">
            <div class="p-row-left">
              <div class="p-row-icon">🔥</div>
              <span class="p-row-name ${recipe.tier >= 3 ? 'tier-gold' : recipe.tier >= 2 ? 'tier-purple' : 'tier-blue'}">${recipe.name}</span>
              <span class="p-row-badge">${recipe.tier || 1}阶灵丹</span>
            </div>
            <span class="p-row-count" style="color:${anyMaterial ? '#2e6b34' : '#8a5a44'};">${anyMaterial ? '可开炉 ▸' : '缺药材 ▸'}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  return html;
}

let currentAlchemyRealmTab = "all";
let alchemyRealmCollapsed = {};

function switchAlchemyRealmTab(tab) {
  currentAlchemyRealmTab = "all";
  render();
}

function toggleAlchemyRealmSublist(key) {
  alchemyRealmCollapsed[key] = !alchemyRealmCollapsed[key];
  const collapsed = !!alchemyRealmCollapsed[key];
  if (typeof document !== "undefined") {
    const listEl = document.getElementById("alchemy-sublist-" + key);
    const arrowEl = document.getElementById("alchemy-arrow-" + key);
    if (listEl) {
      listEl.style.display = collapsed ? "none" : "block";
      if (arrowEl) arrowEl.textContent = collapsed ? "展开 ▾" : "收起 ▴";
      return;
    }
  }
  render();
}

function openAlchemyRecipeModal(recipeId) {
  const recipe = typeof RECIPES !== "undefined" ? RECIPES.find(r => r.id === recipeId) : null;
  if (!recipe) return;
  const matText = Object.entries(recipe.mat)
    .map(([base, cnt]) => `${base} ×${cnt}`).join(" + ");
  const checkOne = checkAlchemyMaterial(recipe.id, 1, 1);

  showModal(`🔥 丹方灵鉴 · ${recipe.name}`, `
    <div class="card">
      <div class="row"><span>丹方品阶</span><b>${recipe.tier || 1} 阶灵丹（1~${recipe.maxGrade || 5}品）</b></div>
      <div class="row"><span>基础成丹率</span><b>${(recipe.rate * 100).toFixed(0)}%</b></div>
      <div class="row"><span>所需主辅药</span><b>${matText}</b></div>
    </div>
    <p class="small">${recipe.desc || "古传丹道秘方，凝天地灵粹成丹。"}</p>
  `, checkOne.ok ? [{
    label: "🔥 选品开炉炼丹",
    primary: true,
    fn: () => { closeModal(); showRecipeGradeSelect(recipe.id); }
  }] : [], { showCloseX: true });
}


/* ============================================================
   炼器室 UI (已按境界金丹 ＞ 筑基 ＞ 练气 ＞ 凡人分层，支持 Tab 与 Sublist 筛选)
   ============================================================ */
let currentForgeRealmTab = "all";
let forgeRealmCollapsed = {};

function switchForgeTab(tab) {
  currentForgeRealmTab = "all";
  render();
}

function toggleForgeRealmSublist(key) {
  forgeRealmCollapsed[key] = !forgeRealmCollapsed[key];
  const collapsed = !!forgeRealmCollapsed[key];
  if (typeof document !== "undefined") {
    const listEl = document.getElementById("forge-sublist-" + key);
    const arrowEl = document.getElementById("forge-arrow-" + key);
    if (listEl) {
      listEl.style.display = collapsed ? "none" : "block";
      if (arrowEl) arrowEl.textContent = collapsed ? "展开 ▾" : "收起 ▴";
      return;
    }
  }
  render();
}

function renderCaveForge() {
  if (typeof isForgeUnlocked !== "function") {
    return `<p class="empty">炼器系统未加载。</p>`;
  }

  const caveLv = getForgeCaveLv();
  const skillLv = getForgeSkillLv();
  const forgeBonusRate = typeof getForgeSkillBonusRate === "function"
    ? getForgeSkillBonusRate(skillLv)
    : (skillLv >= 9 ? 0.15 : skillLv >= 6 ? 0.10 : skillLv >= 3 ? 0.05 : 0);
  const forgeMastery = typeof getCraftMasteryInfo === "function"
    ? getCraftMasteryInfo("炼器")
    : { lvl: skillLv, exp: (S.skills?.["炼器"]?.exp || 0), maxExp: 100, pct: Math.round(S.skills?.["炼器"]?.exp || 0), title: "初窥门径", isMax: skillLv >= 10 };

  const caveRateBonus = caveLv >= 1 ? (caveLv - 1) * 5 : 0;
  const knownForgeList = (typeof FORGE_RECIPES !== "undefined" && FORGE_RECIPES)
    ? FORGE_RECIPES.filter(r => typeof isForgeRecipeKnown === "function" ? isForgeRecipeKnown(r.id) : false)
    : [];

  let html = `
    <div class="card">
      <div class="row">
        <span>天机器室 Lv.${caveLv} / 10 加成</span>
        <b>${caveLv >= 1 ? `+${caveRateBonus.toFixed(0)}%` : `未开辟（可在聚灵阵升级）`}</b>
      </div>
      <div class="row">
        <span>炼器造诣 Lv.${forgeMastery.lvl} <span class="tag gold">${forgeMastery.title}</span></span>
        <b>成功率 +${(forgeBonusRate * 100).toFixed(1)}%${forgeMastery.lvl >= 9 ? ' · 词条+1' : forgeMastery.lvl >= 5 ? ' · 50%词条+1' : ''}</b>
      </div>
      <div class="craft-progress-track" style="margin:4px 0;">
        <div class="craft-progress-fill" style="width:${forgeMastery.pct}%;"></div>
      </div>
      <div class="row" style="margin-bottom:4px;">
        <span class="small" style="color:var(--text-dim);">器道熟练：${forgeMastery.isMax ? '已臻圆满 (MAX)' : `${forgeMastery.exp} / ${forgeMastery.maxExp}`}</span>
        <button type="button" class="primary small" onclick="openCraftStudyModal('炼器')">⚒️ 淬火习艺 / 提升造诣</button>
      </div>
      <div class="row"><span>已掌握炼器谱</span><b>${knownForgeList.length} 卷</b></div>
    </div>`;

  if (typeof FORGE_RECIPES === "undefined" || !FORGE_RECIPES) {
    return html + `<p class="empty">炼器配方未加载。</p>`;
  }

  html += `<h4>已掌握炼器谱 (${knownForgeList.length} 卷)</h4>`;
  html += `<p class="small">按境界分类归整，从高到低排列。点击器谱查看锻造材料与成功率（同阶材料可炼出 1~5 品装备）。</p>`;

  if (knownForgeList.length === 0) {
    html += `
      <p class="empty">尚未掌握任何炼器谱（开局无器谱，需前往宗门兑换）。</p>
      <div style="text-align:center; margin-top:8px;">
        <button type="button" class="primary small" onclick="closeCaveSubPanel(); switchTab('sect'); currentSectTab='丹方阁'; sectSubPanel='丹方阁'; if(typeof switchRecipeShopMode==='function') switchRecipeShopMode('forge'); render();">
          📜 前往宗门【丹方阁·炼器图谱】兑换
        </button>
      </div>
    `;
    return html;
  }

  const FORGE_REALM_DEFS = [
    { key: "r3", realm: 3, name: "金丹", label: "金丹期器谱" },
    { key: "r2", realm: 2, name: "筑基", label: "筑基期器谱" },
    { key: "r1", realm: 1, name: "练气", label: "练气期器谱" },
    { key: "r0", realm: 0, name: "凡人", label: "凡人器谱" },
  ];

  const slotLabels = {
    rightHand: "兵器", leftHand: "左手", head: "头部",
    body: "衣服", shoes: "鞋子", accessory: "玉佩", artifact: "法宝"
  };

  FORGE_REALM_DEFS.forEach(sec => {
    const secRecipes = knownForgeList.filter(r => {
      const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(r) : (r.realm || 0);
      return rm === sec.realm;
    });
    const isCollapsed = !!forgeRealmCollapsed[sec.key];

    html += `
      <div class="parchment-group-header" onclick="toggleForgeRealmSublist('${sec.key}')" style="display:flex; justify-content:space-between; align-items:center; padding:7px 12px; margin:8px 0 4px; background:rgba(216,184,120,0.12); border-left:3px solid #c9a84c; border-radius:4px; cursor:pointer;" title="点击展开/收起${sec.name}${sec.realm > 0 ? '期器谱' : '器谱'}">
        <span><b style="color:var(--text-gold);">${sec.name}${sec.realm > 0 ? '期器谱' : '器谱'}</b> <span class="small" style="color:var(--text-dim);">(${secRecipes.length} 卷)</span></span>
        <span id="forge-arrow-${sec.key}" class="small" style="color:var(--text-dim);">${isCollapsed ? '展开 ▾' : '收起 ▴'}</span>
      </div>
      <div id="forge-sublist-${sec.key}" style="display:${isCollapsed ? 'none' : 'block'};">
    `;

    if (secRecipes.length === 0) {
      html += `<p class="empty" style="padding:6px 0; font-size:12px;">暂无已掌握的${sec.name}${sec.realm > 0 ? '期器谱' : '器谱'}。</p>`;
    } else {
      html += `<div class="parchment-list-wrap" style="margin-bottom:8px;">`;
      secRecipes.forEach(recipe => {
        const check = checkForgeMaterial(recipe);
        const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(recipe) : (recipe.realm || 0);
        const tierNum = recipe.tier || (rm <= 1 ? 1 : rm);
        const sLabel = slotLabels[recipe.slot] || (SLOT_NAMES && SLOT_NAMES[recipe.slot]) || recipe.slot;
        html += `
          <div class="parchment-item-row" onclick="openForgeRecipeModal('${recipe.id}')">
            <div class="p-row-left">
              <div class="p-row-icon">⚒️</div>
              <span class="p-row-name ${rm >= 3 ? 'tier-gold' : rm >= 2 ? 'tier-purple' : rm >= 1 ? 'tier-blue' : 'tier-green'}">${recipe.name}</span>
              <span class="p-row-badge">${tierNum}阶器胚 · 1~5品 · ${sLabel}</span>
            </div>
            <span class="p-row-count" style="color:${check.ok ? '#2e6b34' : '#8a5a44'};">${check.ok ? '可铸造 ▸' : '缺灵材 ▸'}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  return html;
}

function openForgeRecipeModal(recipeId) {
  const recipe = typeof FORGE_RECIPES !== "undefined" ? FORGE_RECIPES.find(r => r.id === recipeId) : null;
  if (!recipe) return;
  const rate = calcForgeRate(recipe);
  const check = checkForgeMaterial(recipe);
  const rm = typeof getForgeRecipeRealm === "function" ? getForgeRecipeRealm(recipe) : (recipe.realm || 0);
  const tierNum = recipe.tier || (rm <= 1 ? 1 : rm);
  const slotLabels = {
    rightHand: "兵器", leftHand: "左手", head: "头部",
    body: "衣服", shoes: "鞋子", accessory: "玉佩", artifact: "法宝"
  };

  const matLines = check.list.map(m => {
    const color = m.ok ? "#7fbf5f" : "#d05a4a";
    return `<div class="row"><span>${m.baseId}（${m.tier || tierNum}阶灵材）</span><b style="color:${color};">需 ${m.need}（拥有 ${m.have}）</b></div>`;
  }).join("");

  const stoneColor = check.stoneOk ? "#7fbf5f" : "#d05a4a";
  const sLabel = slotLabels[recipe.slot] || (SLOT_NAMES && SLOT_NAMES[recipe.slot]) || recipe.slot;

  showModal(`⚒️ 炼器谱 · ${recipe.name}`, `
    <div class="card">
      ${recipe.setName ? `<div class="row"><span>所属套装</span><b>${recipe.setName}</b></div>` : ""}
      <div class="row"><span>法器部位 / 阶位</span><b>${sLabel} · ${tierNum} 阶器胚（成器 1~5 品）</b></div>
      <div class="row"><span>成器成功率</span><b>${(rate * 100).toFixed(1)}%</b></div>
      <div class="row"><span>消耗灵石</span><b style="color:${stoneColor};">${recipe.spiritStone} 灵石（拥有 ${S.stone}）</b></div>
      ${matLines}
    </div>
    <p class="small">以同阶灵材千锤淬炼，成器时根据天道火候随机化生 1品~5品 装备（品质受炼器造诣加持）。</p>
  `, check.ok ? [{
    label: `⚒️ 立即开炉炼制 (${(rate * 100).toFixed(0)}%)`,
    primary: true,
    fn: () => { closeModal(); doForge(recipe.id); }
  }] : [], { showCloseX: true });
}


/* ============================================================
   百草园 UI（重新设计：对齐炼丹房页面设计，全页内联交互，无任何弹窗 prompt）
   ============================================================ */

const GARDEN_SEEDS = [
  { id: "seed_xigu", name: "洗骨草种", herbName: "洗骨草", icon: "🌱", needDays: 1, costMoney: 20, desc: "初阶灵草，1天成熟（折合1年份），可入药炼制一品洗髓灵丹。" },
  { id: "seed_ningqi", name: "凝气芝种", herbName: "凝气芝", icon: "🍄", needDays: 3, costMoney: 50, desc: "聚灵仙芝，3天成熟（折合3年份），成熟后年份越久灵韵越足。" },
  { id: "seed_ziling", name: "紫灵参种", herbName: "紫灵参", icon: "🌿", needDays: 5, costMoney: 120, desc: "玄妙灵根，5天成熟（折合5年份），可大幅精进心法修为。" },
  { id: "seed_xuanyang", name: "玄阳参种", herbName: "玄阳参", icon: "🏵️", needDays: 7, costMoney: 240, desc: "至阳仙草，7天成熟（折合7年份），炼制筑基与破境神丹之主材。" },
  { id: "seed_zaohua", name: "造化果种", herbName: "造化果", icon: "✨", needDays: 10, costMoney: 500, desc: "夺天地造化之极品仙树种，10天成熟（折合10年份），年份越长越可得极品灵药！" },
];

function selectGardenSeed(seedId) {
  if (GARDEN_SEEDS.some(s => s.id === seedId)) {
    currentSelectedSeedId = seedId;
    render();
  }
}

function ensureGardenPlots() {
  if (!S.cave) S.cave = {};
  const gardenLv = Math.min(10, Math.max(0, S.cave.garden || 0));
  const plotCount = 3 + gardenLv;
  if (!S.cave.gardenPlots || !Array.isArray(S.cave.gardenPlots)) {
    S.cave.gardenPlots = [];
  }
  while (S.cave.gardenPlots.length < plotCount) {
    S.cave.gardenPlots.push(null);
  }
  if (S.cave.gardenPlots.length > plotCount) {
    S.cave.gardenPlots.length = plotCount;
  }
  return S.cave.gardenPlots;
}

/* 兼容旧入口：不再弹 prompt/modal，直接切入洞府百草园详情子页 */
function openCaveGardenModal() {
  openCaveSubPanel("garden");
}

function openSeedSelector(plotIdx) {
  plantSeedInPlot(plotIdx, currentSelectedSeedId);
}

function plantSeedInPlot(plotIdx, seedId) {
  const targetSeedId = seedId || currentSelectedSeedId || "seed_xigu";
  const seed = GARDEN_SEEDS.find(s => s.id === targetSeedId) || GARDEN_SEEDS[0];
  if (!seed) return;
  if ((S.money || 0) < seed.costMoney) {
    log(`铜钱不足（播种【${seed.name}】需 ${seed.costMoney} 铜钱，当前持有 ${S.money || 0} 钱）。`, "c-bad");
    return;
  }
  S.money -= seed.costMoney;

  const plots = ensureGardenPlots();
  plots[plotIdx] = {
    seedId: seed.id,
    herbName: seed.herbName,
    icon: seed.icon,
    plantDay: S.day || 1,
    needDays: seed.needDays,
  };

  log(`【百草播种】花费 ${seed.costMoney} 铜钱，在仙田第 ${plotIdx + 1} 畦播下【${seed.name}】（需 ${seed.needDays} 年生息）。`, "c-gold");
  if (typeof triggerDailyTask === "function") triggerDailyTask("garden");
  save();
  render();
}

function plantAllEmptyPlots() {
  const seed = GARDEN_SEEDS.find(s => s.id === currentSelectedSeedId) || GARDEN_SEEDS[0];
  if (!seed) return;
  const plots = ensureGardenPlots();
  let planted = 0;
  for (let i = 0; i < plots.length; i++) {
    if (!plots[i]) {
      if ((S.money || 0) < seed.costMoney) break;
      S.money -= seed.costMoney;
      plots[i] = {
        seedId: seed.id,
        herbName: seed.herbName,
        icon: seed.icon,
        plantDay: S.day || 1,
        needDays: seed.needDays,
      };
      planted++;
    }
  }
  if (planted > 0) {
    if (typeof triggerDailyTask === "function") triggerDailyTask("garden");
    log(`【百草满播】共在 ${planted} 畦空置仙田中播下【${seed.name}】！`, "c-gold");
    save();
    render();
  } else {
    log(`没有空置仙田或铜钱不足（需 ${seed.costMoney} 铜钱/畦）。`, "c-bad");
  }
}

function harvestGardenPlot(plotIdx) {
  const plots = ensureGardenPlots();
  const plot = plots[plotIdx];
  if (!plot) return;

  const currYears = Math.max(0, (S.day || 1) - (plot.plantDay || S.day));
  if (currYears < plot.needDays) {
    log(`【${plot.herbName}】尚未成熟，需至少生息 ${plot.needDays} 年（当前 ${currYears} 年）。`, "c-bad");
    return;
  }

  /* 根据年份结算品级与产出 */
  const grade = Math.min(5, Math.max(1, 1 + Math.floor(currYears / 3)));
  const count = Math.min(6, Math.max(1, 1 + Math.floor(currYears / 2)));
  const matBase = plot.herbName.includes("参") ? "洗骨花" : plot.herbName.includes("芝") ? "草木灰" : "清泉水";
  const itemId = `${matBase}_${grade}`;

  addItem(itemId, count);
  plots[plotIdx] = null;

  log(`【百草丰收】采摘了生息【${currYears} 年】的【${plot.herbName}】，收获 ${count} 株 ${grade} 品【${matBase}】！`, "c-good");
  save();
  render();
}

function harvestAllMaturePlots() {
  const plots = ensureGardenPlots();
  let harvestedPlots = 0;
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (!p) continue;
    const currYears = Math.max(0, (S.day || 1) - (p.plantDay || S.day));
    if (currYears >= p.needDays) {
      const grade = Math.min(5, Math.max(1, 1 + Math.floor(currYears / 3)));
      const count = Math.min(6, Math.max(1, 1 + Math.floor(currYears / 2)));
      const matBase = p.herbName.includes("参") ? "洗骨花" : p.herbName.includes("芝") ? "草木灰" : "清泉水";
      addItem(`${matBase}_${grade}`, count);
      plots[i] = null;
      harvestedPlots++;
    }
  }
  if (harvestedPlots > 0) {
    log(`【百草全收】一键采收了 ${harvestedPlots} 畦成熟灵药！`, "c-good");
    save();
    render();
  } else {
    log("当前暂无已成熟的灵田作物。", "c-dim");
  }
}

function clearGardenPlot(plotIdx) {
  const plots = ensureGardenPlots();
  if (!plots[plotIdx]) return;
  const oldName = plots[plotIdx].herbName;
  plots[plotIdx] = null;
  log(`【药园整理】铲除了第 ${plotIdx + 1} 畦仙田的【${oldName}】，仙田恢复空置。`, "c-dim");
  save();
  render();
}

function renderCaveGarden() {
  const plots = ensureGardenPlots();
  const gardenLv = (S.cave && S.cave.garden) || 0;
  const selectedSeed = GARDEN_SEEDS.find(s => s.id === currentSelectedSeedId) || GARDEN_SEEDS[0];
  const moodEmoji = MOOD_EMOJI[(S.mood || 0) + 2] || "😐";
  const moodName = MOOD_NAMES[(S.mood || 0) + 2] || "平静";

  let plantedCount = 0;
  let matureCount = 0;
  plots.forEach(p => {
    if (p) {
      plantedCount++;
      const yrs = Math.max(0, (S.day || 1) - (p.plantDay || S.day));
      if (yrs >= p.needDays) matureCount++;
    }
  });
  const emptyCount = plots.length - plantedCount;
  const plotPct = Math.min(100, Math.round((plantedCount / Math.max(1, plots.length)) * 100));

  let html = `
    <div class="card">
      <div class="row">
        <span>百草药园</span>
        <b>Lv.${gardenLv} / 10</b>
      </div>
      <div class="row">
        <span>洞天岁月流速 <span class="tag gold">一日一年</span></span>
        <b>药龄越深品阶越高</b>
      </div>
      <div class="craft-progress-track" style="margin:4px 0;">
        <div class="craft-progress-fill" style="width:${plotPct}%;"></div>
      </div>
      <div class="row" style="margin-bottom:4px; justify-content:flex-end;">
        <div style="display:flex; gap:6px;">
          <button type="button" class="small" onclick="harvestAllMaturePlots()" ${matureCount > 0 ? "" : "disabled"}>🌿 一键采收(${matureCount})</button>
          <button type="button" class="primary small" onclick="plantAllEmptyPlots()" ${emptyCount > 0 ? "" : "disabled"}>🌱 一键满播</button>
        </div>
      </div>
      <div class="row"><span>当前选定灵种</span><b>${selectedSeed.icon} ${selectedSeed.name}（${selectedSeed.costMoney}钱 · ${selectedSeed.needDays}年成株）</b></div>
    </div>
  `;

  /* 种子选择切换栏（对齐炼器室/行囊切换条，免弹窗直接选种） */
  html += `<div class="om-bag-tabs" style="margin:8px 0;">`;
  GARDEN_SEEDS.forEach(s => {
    html += `
      <button type="button" class="om-bag-tab ${selectedSeed.id === s.id ? 'active' : ''}" onclick="selectGardenSeed('${s.id}')">
        ${s.icon} ${s.name}(${s.costMoney}钱)
      </button>
    `;
  });
  html += `</div>`;

  html += `<h4>百草仙田 (${plots.length} 畦)</h4>`;
  html += `<p class="small">点击空置仙田即可直接播下【${selectedSeed.name}】；灵株成熟后点击即可直接采摘入囊。</p>`;

  html += `<div class="parchment-list-wrap">`;
  plots.forEach((p, idx) => {
    if (!p) {
      const canAfford = (S.money || 0) >= selectedSeed.costMoney;
      html += `
        <div class="parchment-item-row" onclick="plantSeedInPlot(${idx}, '${selectedSeed.id}')" title="点击播下【${selectedSeed.name}】">
          <div class="p-row-left">
            <div class="p-row-icon">🌱<span class="p-icon-qty">${idx + 1}畦</span></div>
            <span class="p-row-name tier-green">第 ${idx + 1} 畦仙田 · 空置沃土</span>
          </div>
          <div class="fs-card-right-group" onclick="event.stopPropagation();">
            <button type="button" class="fs-card-buy-btn" onclick="plantSeedInPlot(${idx}, '${selectedSeed.id}')" ${canAfford ? "" : "disabled"}>
              播种
            </button>
          </div>
        </div>
      `;
    } else {
      const currYears = Math.max(0, (S.day || 1) - (p.plantDay || S.day));
      const isMature = currYears >= p.needDays;
      const previewGrade = Math.min(5, Math.max(1, 1 + Math.floor(currYears / 3)));
      const previewCount = Math.min(6, Math.max(1, 1 + Math.floor(currYears / 2)));

      html += `
        <div class="parchment-item-row" onclick="${isMature ? `harvestGardenPlot(${idx})` : ''}" title="${isMature ? '点击立即采摘成熟灵药' : '灵株生息中'}">
          <div class="p-row-left">
            <div class="p-row-icon">${p.icon}<span class="p-icon-qty">${currYears}年</span></div>
            <span class="p-row-name ${isMature ? 'tier-gold' : 'tier-blue'}">第 ${idx + 1} 畦 · ${p.herbName}</span>
            <span class="p-row-badge">${isMature ? `已成熟 · 预计${previewGrade}品×${previewCount}` : `生息中 (${currYears}/${p.needDays}年)`}</span>
          </div>
          <div class="fs-card-right-group" onclick="event.stopPropagation();">
            <button type="button" class="small" style="padding:2px 7px; font-size:11px;" onclick="clearGardenPlot(${idx})">铲除</button>
            ${isMature
              ? `<button type="button" class="fs-card-buy-btn" onclick="harvestGardenPlot(${idx})">采摘</button>`
              : `<span class="p-row-count" style="color:#8a5a44;">未满 ▸</span>`}
          </div>
        </div>
      `;
    }
  });
  html += `</div>`;

  return html;
}


/* ============================================================
   洞府全景与五大子页面渲染
   ============================================================ */

function openCaveSubPanel(sub) {
  caveSubPanel = sub || "facility";
  currentCaveTab = caveSubPanel;
  render();
}

function closeCaveSubPanel() {
  caveSubPanel = null;
  render();
}

function renderCaveFacility(c) {
  const maxLv = typeof CAVE_MAX_LEVEL === "number" ? CAVE_MAX_LEVEL : 10;
  const verCap = typeof CAVE_VERSION_MAX_LEVEL === "number" ? CAVE_VERSION_MAX_LEVEL : 3;
  const beastLv = c.beast || 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + beastLv);

  const up = (key, icon, name, desc, baseCost) => {
    const lvl = c[key] || 0;
    const price = baseCost * (lvl + 1);
    const isVerMax = lvl >= verCap;
    const isTotalMax = lvl >= maxLv;
    const canBuy = !isVerMax && !isTotalMax && (S.stone || 0) >= price;
    return `
      <div class="parchment-item-row" onclick="${canBuy ? `upgradeCave('${key}', ${price})` : ''}">
        <div class="p-row-left">
          <div class="p-row-icon">${icon}<span class="p-icon-qty">Lv.${lvl}/${maxLv}</span></div>
          <span class="p-row-name tier-gold">${name}</span>
          <span class="p-row-badge">${desc}</span>
        </div>
        <div class="fs-card-right-group">
          ${isVerMax
            ? `<span class="fs-card-cost" style="color:var(--text-dim);">Lv.${lvl}/${maxLv}</span>
               <button type="button" class="fs-card-buy-btn" disabled>已满级</button>`
            : `<span class="fs-card-cost">💎 ${price}</span>
               <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); upgradeCave('${key}', ${price})" ${canBuy ? "" : "disabled"}>
                 升级
               </button>`}
        </div>
      </div>
    `;
  };

  return `
    <div class="card">
      <div class="row"><span>洞府品阶</span><b>Lv.${c.level || 0} / ${maxLv}（灵气浓度 ${1 + (c.spirit || 0)} 阶）</b></div>
      <div class="row"><span>灵兽苑容量</span><b>Lv.${beastLv} / ${maxLv}</b></div>
    </div>
    <div class="parchment-sec-header">洞天营造</div>
    <div class="parchment-list-wrap">
      ${up("spirit",  "🌌", "聚灵法阵", "加速吐纳修炼效率", 120)}
      ${up("alchemy", "🔥", "紫府丹房", "提升单炉成丹产量", 50)}
      ${up("forge",   "⚒️", "天机器室", "提升法器锻造成功率", 60)}
      ${up("beast",   "🐾", "灵兽苑",   `灵兽上限 ${maxPets} 只`, 50)}
      ${up("garden",  "🌿", "百草药园", `仙田上限 ${3 + (c.garden || 0)} 畦`, 40)}
    </div>
  `;
}

function renderCave() {
  const c = S.cave || {};
  const rank = S.flags.rank || "杂务";
  const isMennei = RANKS.indexOf(rank) >= 2;

  /* 如果打开了洞府详情子面板，渲染全屏宣纸详情界面 + 顶部分类栏 + 左右滑动切换条 + 左下角【返回】圆章 */
  if (caveSubPanel) {
    const curIdx = Math.max(0, CAVE_DETAIL_TABS.findIndex(t => t.id === caveSubPanel));
    const curTabObj = CAVE_DETAIL_TABS[curIdx] || CAVE_DETAIL_TABS[0];
    const prevTabObj = CAVE_DETAIL_TABS[(curIdx - 1 + CAVE_DETAIL_TABS.length) % CAVE_DETAIL_TABS.length];
    const nextTabObj = CAVE_DETAIL_TABS[(curIdx + 1) % CAVE_DETAIL_TABS.length];

    const tabsHtml = `
      <div class="fs-rect-tabs" style="display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:4px;">
        ${CAVE_DETAIL_TABS.map(t => `
          <button type="button"
                  class="fs-rect-tab ${caveSubPanel === t.id ? 'active' : ''}"
                  style="padding:0.24rem 0.15rem !important; text-align:center; justify-content:center;"
                  onclick="openCaveSubPanel('${t.id}')"
                  title="${t.name}">
            ${t.name}
          </button>
        `).join("")}
      </div>
    `;

    const swipeHintHtml = `
      <div class="om-bag-hint cave-swipe-hint" style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px;">
        <button type="button" class="small" style="padding:1px 7px; font-size:11px;" onclick="swipeCaveSubPanel(-1)">◀ ${prevTabObj.name}</button>
        <span>左右滑动切换</span>
        <button type="button" class="small" style="padding:1px 7px; font-size:11px;" onclick="swipeCaveSubPanel(1)">${nextTabObj.name} ▶</button>
      </div>
    `;

    let bodyHtml = swipeHintHtml;
    let centerAction = "";

    if (caveSubPanel === "facility") {
      bodyHtml += renderCaveFacility(c);
    } else if (caveSubPanel === "alchemy") {
      bodyHtml += renderCaveAlchemy();
    } else if (caveSubPanel === "forge") {
      bodyHtml += renderCaveForge();
    } else if (caveSubPanel === "pet") {
      centerAction = `<button type="button" class="fs-bottom-action-btn" onclick="openBuyPetFood()">购买饲灵丸</button>`;
      bodyHtml += renderCavePet();
    } else if (caveSubPanel === "garden") {
      bodyHtml += renderCaveGarden();
    }

    return `
      <div class="fs-detail-page">
        ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, curTabObj.title) : tabsHtml}
        <div class="fs-detail-scroll-body">
          ${bodyHtml}
        </div>
        ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("closeCaveSubPanel()", centerAction) : ""}
      </div>
    `;
  }

  /* 全景水墨卷轴洞府视图（已移除右上角3个按钮） */
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : { lvl: 0, exp: 0, proficiency: 0 };
  const playerInfo = getPlayerRealmInfo();
  const isFan = playerInfo.realm === 0;
  const realmText = isFan
    ? "凡胎肉体"
    : `${REALMS[playerInfo.realm].name}·${subName(playerInfo.lvl)}${playerInfo.lvl}重`;

  let progressRatio = 0;
  let progressLabel = "";
  if (art) {
    if (isFan || prog.lvl === 0) {
      progressRatio = Math.min(100, prog.proficiency || 0);
      progressLabel = `熟练 ${progressRatio.toFixed(0)}%`;
    } else {
      const ld = art.levels ? art.levels.find(l => l.lvl === prog.lvl) : null;
      const need = ld && ld.expNeed ? ld.expNeed : 100;
      progressRatio = Math.min(100, ((prog.exp || 0) / need) * 100);
      progressLabel = `${fmt(prog.exp || 0)} / ${fmt(need)}`;
    }
  }

  const activePet = S.equipped && S.equipped.pet ? (S.pets?.list?.find(p => p.uid === S.equipped.pet)) : null;
  const petCount = (S.pets && S.pets.list) ? S.pets.list.length : 0;
  const maxPets = typeof getMaxPetCapacity === "function" ? getMaxPetCapacity() : (1 + (c.beast || 0));
  const remainActions = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const isBreathing = !!(typeof window !== "undefined" && window._isCaveTunaBreathing);
  const breathPct = (typeof window !== "undefined" && window._caveTunaPct) || 0;
  const breathText = (typeof window !== "undefined" && window._caveTunaStageText) || "🌬️ 吸纳灵气 · 引天地清气入体...";

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻悬浮题跋 HUD（已去掉右上角3个按钮） -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">洞府</span>
            ${isMennei ? `紫府洞天 Lv.${c.level || 0}` : '外门清修庐'}
          </div>
          <div class="plaque-sub">灵气 ${1 + (c.spirit || 0)} 阶 · 主修《${art ? art.name : '未修心法'}》</div>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的宽幅水墨长卷画心 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="left">
        <div class="ink-scene-canvas cave-panorama ink-panorama-world">
          <img class="ink-scene-bg" src="./src/assets/images/cave_cultivation_1792114544316.jpg" alt="修真洞府水墨画卷" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">洞天福地</div>

          <!-- 左阙仙峰圆章：聚灵法阵、紫府丹房、百草药园 -->
          <button type="button" class="ink-seal-node pos-tl" onclick="openCaveSubPanel('facility')">
            <span class="node-char">
              聚
              <em class="seal-red-stamp">Lv.${c.spirit || 0}</em>
            </span>
            <span class="node-caption">聚灵法阵</span>
            <span class="node-sub-hint">洞天营造上限10级</span>
          </button>

          <button type="button" class="ink-seal-node pos-ml" onclick="openCaveSubPanel('alchemy')">
            <span class="node-char">
              丹
              <em class="seal-red-stamp">Lv.${c.alchemy || 0}</em>
            </span>
            <span class="node-caption">紫府丹房</span>
            <span class="node-sub-hint">开炉淬炼灵丹</span>
          </button>

          <button type="button" class="ink-seal-node pos-bl" onclick="openCaveSubPanel('garden')">
            <span class="node-char">
              药
              <em class="seal-red-stamp">Lv.${c.garden || 0}</em>
            </span>
            <span class="node-caption">百草药园</span>
            <span class="node-sub-hint">灵植培育采收</span>
          </button>

          <!-- 中枢清池莲台打坐修士 + 5秒吐纳呼吸特效 + 快捷吐纳/破境双圆章 -->
          <div class="cave-meditate-center ${isBreathing ? 'is-tuna-breathing' : ''}" id="caveMeditateCenter">
            <div class="lotus-halo-outer" onclick="gotoCultivate()"></div>
            <div class="lotus-halo-inner" onclick="gotoCultivate()"></div>
            ${isBreathing ? `
              <div class="tuna-breath-aura-wrap">
                <div class="tuna-breath-ring r1"></div>
                <div class="tuna-breath-ring r2"></div>
                <div class="tuna-breath-ring r3"></div>
                <span class="tuna-qi-mote m1">✦</span>
                <span class="tuna-qi-mote m2">✧</span>
                <span class="tuna-qi-mote m3">✦</span>
                <span class="tuna-qi-mote m4">✧</span>
              </div>
            ` : ''}
            <div class="meditate-avatar-disc ${isBreathing ? 'breathing-disc' : ''}" onclick="gotoCultivate()" title="点击查看功法详情与突破">
              <img src="./src/assets/images/cultivator_avatar_1792114545622.jpg" alt="${S.name}" referrerPolicy="no-referrer">
            </div>
            <div class="meditate-status-pill" onclick="gotoCultivate()">
              <span class="pulse-dot"></span>
              <span id="caveTunaBreathStatus">${isBreathing ? breathText : `周天运转中 · 剩余行动 ${remainActions}`}</span>
            </div>
            ${isBreathing ? `
              <div class="tuna-breath-progress-bar">
                <div class="tuna-breath-progress-fill" id="caveTunaBreathFill" style="width:${breathPct}%;"></div>
                <span class="tuna-breath-progress-txt" id="caveTunaBreathTime">吐纳调息中 · 5.0秒</span>
              </div>
            ` : `
              <div class="meditate-realm-bar" onclick="gotoCultivate()">
                <div class="meditate-realm-fill" style="width:${progressRatio}%"></div>
                <span class="meditate-realm-txt">${realmText}（${progressLabel}）</span>
              </div>
            `}
            <div class="cave-center-seal-actions">
              <button type="button" class="cave-action-seal ${isBreathing ? 'active-breathing' : ''}" onclick="startCaveTunaBreathing()" ${(remainActions <= 0 || isBreathing) ? 'disabled' : ''} title="耗费1次行动进行5秒周天呼吸吐纳">
                <span class="cas-char">${isBreathing ? '纳气' : '吐纳'}</span>
                <span class="cas-sub">${isBreathing ? '呼吸运转中' : '耗1行动'}</span>
              </button>
              <button type="button" class="cave-action-seal primary-seal" onclick="gotoCultivate()" title="进入心法切换与破境">
                <span class="cas-char">破境</span>
                <span class="cas-sub">心法参悟</span>
              </button>
            </div>
          </div>

          <!-- 右阙灵峰圆章：造化灵宝、天机器室、灵兽仙苑 -->
          <button type="button" class="ink-seal-node pos-tr" onclick="openZaohuaModal()">
            <span class="node-char">
              命
              <em class="seal-red-stamp">至宝</em>
            </span>
            <span class="node-caption">造化灵宝</span>
            <span class="node-sub-hint">先天灵根气运</span>
          </button>

          <button type="button" class="ink-seal-node pos-mr" onclick="openCaveSubPanel('forge')">
            <span class="node-char">
              器
              <em class="seal-red-stamp">Lv.${c.forge || 0}</em>
            </span>
            <span class="node-caption">天机器室</span>
            <span class="node-sub-hint">百炼神兵法器</span>
          </button>

          <button type="button" class="ink-seal-node pos-br" onclick="openCaveSubPanel('pet')">
            <span class="node-char">
              兽
              <em class="seal-red-stamp">${petCount}/${maxPets}</em>
            </span>
            <span class="node-caption">${activePet ? activePet.name : '灵兽仙苑'}</span>
            <span class="node-sub-hint">Lv.${c.beast || 0} · 限${maxPets}只</span>
          </button>
        </div>
      </div>

      <!-- 底部横向长卷导览罗盘 (支持左右滑动与一键定位) -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn active" data-pos="left" onclick="panPanorama('left')">◀ 左阙·丹药</button>
        <button type="button" class="pano-compass-btn" data-pos="center" onclick="panPanorama('center')">☯ 中枢·莲台</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">右阙·器兽 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}
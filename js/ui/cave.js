/* ============================================================
   ui/cave.js - 洞府页面
   ============================================================ */

function getCaveTabs() {
  const alchemyUnlocked = (typeof isAlchemyUnlocked === "function")
    ? isAlchemyUnlocked()
    : ((S.cave && S.cave.alchemy) || 0) >= 1;
  const forgeUnlocked = (typeof isForgeUnlocked === "function")
    ? isForgeUnlocked()
    : ((S.cave && S.cave.forge) || 0) >= 1;

  return [
    { id: "facility", name: "洞府设施", locked: false },
    { id: "alchemy",  name: "炼丹房",   locked: !alchemyUnlocked },
    { id: "forge",    name: "炼器房",   locked: !forgeUnlocked },
    { id: "pet",      name: "灵兽",     locked: false },
  ];
}

function switchCaveTab(t) {
  currentCaveTab = t;
  render();
}

/* ========== 灵兽页 ========== */

function renderCavePet() {
  if (!S.pets || !S.pets.list || S.pets.list.length === 0) {
    return `<p class="empty">尚未收服灵宠。</p>`;
  }
  return S.pets.list.map(pet => renderPetCard(pet)).join("");
}

function renderPetCard(pet) {
  const stats = getPetStats(pet);
  const talent = getPetTalent(pet.talent);
  const bloodline = getPetBloodline(pet.bloodline);
  const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡人";
  const need = petExpNeed(pet.lvl);
  const equipped = S.equipped.pet === pet.uid;
  const hungerPct = Math.max(0, Math.min(100, pet.hunger || 0));

  const foods = ["food_low", "food_mid", "food_high"].map(fid => {
    const f = ITEMS[fid];
    if (!f) return "";
    const count = (pet.foodStorage && pet.foodStorage[fid]) || 0;
    return `<div class="small">${f.name}：${count}</div>`;
  }).join("");

  return `<div class="card">
    <b>${pet.name}</b>
    <span class="tag">${talent.name}</span>
    <span class="tag">${bloodline.name}血脉</span>
    ${equipped ? '<span class="tag good">出战</span>' : ''}

    <div class="small">境界：${realmText}·${pet.lvl}重</div>
    <div class="small">修为：${pet.exp}/${need}</div>

    <div class="bar-row">
      <span class="label">饥饿</span>
      <div class="bar-wrap"><div class="bar-fill" style="width:${hungerPct}%;background:#e8a040;"></div>
        <div class="bar-text">${Math.floor(pet.hunger || 0)}/100</div></div>
    </div>

    ${stats ? `<div class="small">攻 ${stats.atk}　防 ${stats.def}　速 ${stats.speed}　血 ${stats.hpMax}</div>` : ""}

    <div class="small" style="margin-top:4px;">兽粮：</div>
    ${foods}

    <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">
      <button onclick="openPetDetail('${pet.uid}')">详细</button>
      <button onclick="openPetRename('${pet.uid}')">改名</button>
      <button onclick="openPetFeed('${pet.uid}')">喂食</button>
      ${pet.lvl >= 10 ? `<button onclick="breakPet('${pet.uid}')">突破</button>` : ""}
      ${!equipped
        ? `<button onclick="equipPet('${pet.uid}')">出战</button>`
        : `<button onclick="unequipPet()">休息</button>`}
    </div>
  </div>`;
}

/* ========== 详细 ========== */

function openPetDetail(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;
  const stats = getPetStats(pet);
  const talent = getPetTalent(pet.talent);
  const bloodline = getPetBloodline(pet.bloodline);
  const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡人";

  const resistHtml = Object.keys(stats.resistances || {}).map(k => {
    const def = getStatusDef(k);
    const name = def ? def.name : k;
    const v = stats.resistances[k];
    return `<div class="row"><span>${name}抗性</span><b>${resistLabel(v)}（${v}）</b></div>`;
  }).join("");

  showModal("灵宠详细", `
    <h4>${pet.name}</h4>
    <div class="card">
      <div class="row"><span>天赋</span><b>${talent.name}（${talent.desc}）</b></div>
      <div class="row"><span>血脉</span><b>${bloodline.name}</b></div>
      <div class="row"><span>境界</span><b>${realmText}·${pet.lvl}重</b></div>
      <div class="row"><span>修为</span><b>${pet.exp}/${petExpNeed(pet.lvl)}</b></div>
      <div class="row"><span>饥饿</span><b>${Math.floor(pet.hunger || 0)}/100</b></div>
    </div>
    <h4>属性</h4>
    <div class="card">
      <div class="row"><span>攻</span><b>${stats.atk}</b></div>
      <div class="row"><span>防</span><b>${stats.def}</b></div>
      <div class="row"><span>速</span><b>${stats.speed}</b></div>
      <div class="row"><span>气血</span><b>${stats.hpMax}</b></div>
      <div class="row"><span>灵力</span><b>${stats.mpMax}</b></div>
    </div>
    <h4>抗性</h4>
    <div class="card">${resistHtml || "<p class='empty'>无</p>"}</div>
  `, [{ label: "关闭", fn: closeModal }]);
}

/* ========== 改名 ========== */

function openPetRename(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;

  showModal("改名", `
    <p>当前名字：${pet.name}</p>
    <input id="petNameInput" value="${pet.name}" maxlength="8" style="width:100%;padding:6px;">
    <p class="small">最多 8 个字</p>
  `, [
    { label: "确定", fn: () => {
        const name = document.getElementById("petNameInput").value;
        renamePet(uid, name);
        closeModal();
      } },
    { label: "取消", fn: closeModal },
  ]);
}

/* ========== 喂食 ========== */

function openPetFeed(uid) {
  const pet = S.pets.list.find(p => p.uid === uid);
  if (!pet) return;

  /* 背包里所有饲灵丸 */
  const allFoods = [];
  for (const id in S.inventory) {
    if (S.inventory[id] <= 0) continue;
    const item = ITEMS[id];
    if (item && item.type === "pill" && item.effect && item.effect.type === "petFood") {
      allFoods.push(item);
    }
  }

  const availableFoods = allFoods.map(f => {
    const have = S.inventory[f.id] || 0;
    const stored = (pet.foodStorage && pet.foodStorage[f.id]) || 0;
    return `<div class="row">
      <span>${f.name}（饥饿 +5，修为 +${f.effect.exp || 0}）</span>
      <span>背包 ${have}　库存 ${stored}
        <button onclick="feedPet('${uid}', '${f.id}')" ${have <= 0 ? "disabled" : ""}>放入 1</button>
      </span>
    </div>`;
  }).join("") || "<p class='empty'>背包里没有饲灵丸。</p>";

  showModal("喂食 " + pet.name, `
    <p>当前饥饿度：${Math.floor(pet.hunger || 0)}/100</p>
    <h4>放入兽粮</h4>
    <div class="card">${availableFoods}</div>
  `, [{ label: "关闭", fn: closeModal }]);
}

/* ========== 买兽粮 ========== */
function openBuyPetFood() {
  const cur = getCurrency();

  /* 列出所有可买的饲灵丸（1~9 阶） */
  const petFoods = [];
  for (let t = 1; t <= 9; t++) {
    const templateId = "饲灵丸_" + t + "阶";
    const item = getOrCreatePillItem(templateId, 1);
    if (item) petFoods.push(item);
  }

  const html = petFoods.map(f => {
    return `<div class="row">
      <span>${f.name}（饥饿 +5，修为 +${f.effect.exp || 0}）</span>
      <span>
        <button onclick="buyPetFood('${f.id}')" ${cur < (f.price || 10) ? "disabled" : ""}>
          ${f.price || 10} ${currencyName()}
        </button>
      </span>
    </div>`;
  }).join("");

  showModal("购买饲灵丸", `
    <p>当前${currencyName()}：${cur}</p>
    <div class="card">${html}</div>
  `, [{ label: "关闭", fn: closeModal }]);
}

/* ============================================================
   炼丹房 UI (极简名字行 + 点击弹窗炼制)
   ============================================================ */

function renderCaveAlchemy() {
  if (typeof isAlchemyUnlocked !== "function") {
    return `<p class="empty">炼丹系统未加载。</p>`;
  }

  const rank = S.flags.rank || "杂务";
  if (RANKS.indexOf(rank) < 2) {
    return `<p class="empty">需晋升【门内弟子】并开辟炼丹房后方可开炉炼丹。</p>`;
  }

  if (!isAlchemyUnlocked()) {
    return `<p class="empty">炼丹房尚未解锁，请先在【聚灵设施】中升级炼丹房。</p>`;
  }

  const caveLv = getAlchemyCaveLv();
  const skillLv = getAlchemySkillLv();
  const output = calcAlchemyOutput();
  const moodEmoji = MOOD_EMOJI[S.mood + 2];
  const moodName = MOOD_NAMES[S.mood + 2];

  const caveBonus = caveLv >= 1 ? (caveLv - 1) * 0.5 : 0;
  let skillBonus = 0;
  if (skillLv >= 9) skillBonus = 2;
  else if (skillLv >= 6) skillBonus = 1;
  else if (skillLv >= 3) skillBonus = 0.5;

  let html = `
    <div class="card">
      <div class="row"><span>紫府丹房 Lv.${caveLv} 加成</span><b>+${caveBonus.toFixed(1)} 粒</b></div>
      <div class="row"><span>炼丹造诣 Lv.${skillLv}</span><b>+${skillBonus.toFixed(1)} 粒</b></div>
      <div class="row"><span>道心 ${moodName} ${moodEmoji}</span><b>${S.mood >= 1 ? "+0.5 粒" : "无"}</b></div>
      <div class="row"><span>单炉最大成丹</span><b>${output} 粒</b></div>
    </div>`;

  if (typeof RECIPES === "undefined" || !RECIPES) {
    return html + `<p class="empty">丹方数据未加载。</p>`;
  }

  const knownRecipes = RECIPES.filter(r => isRecipeKnown(r.id));

  html += `<h4>已掌握丹方 (${knownRecipes.length})</h4>`;
  html += `<p class="small">点击丹方名称即可查看所需药材并开炉炼制（未习得丹方可前往宗门【丹方阁】兑换）。</p>`;

  if (knownRecipes.length === 0) {
    html += `<p class="empty">尚未解锁任何丹方。</p>`;
    return html;
  }

  html += `<div class="parchment-list-wrap">`;
  knownRecipes.forEach(recipe => {
    const checkOne = checkAlchemyMaterial(recipe.id, 1, 1);
    const anyMaterial = checkOne.ok;

    html += `
      <div class="parchment-item-row" onclick="openAlchemyRecipeModal('${recipe.id}')" title="点击查看《${recipe.name}》丹方详情与炼制">
        <div class="p-row-left">
          <div class="p-row-icon">🔥</div>
          <span class="p-row-name ${recipe.tier >= 2 ? 'tier-blue' : 'tier-green'}">${recipe.name}</span>
          <span class="p-row-badge">${recipe.tier || 1}阶</span>
        </div>
        <span class="p-row-count" style="color:${anyMaterial ? '#2e6b34' : '#8a5a44'};">${anyMaterial ? '可开炉 ▸' : '缺药材 ▸'}</span>
      </div>
    `;
  });
  html += `</div>`;

  return html;
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
  `, [
    ...(checkOne.ok ? [{
      label: "🔥 选品开炉炼丹",
      primary: true,
      fn: () => { closeModal(); showRecipeGradeSelect(recipe.id); }
    }] : []),
    { label: "查看各品级药材", fn: () => { closeModal(); showRecipeDetail(recipe.id); } },
    { label: "合上丹方", fn: closeModal }
  ]);
}


/* ============================================================
   炼器房 UI (极简名字行 + 点击弹窗炼制)
   ============================================================ */
function renderCaveForge() {
  if (typeof isForgeUnlocked !== "function") {
    return `<p class="empty">炼器系统未加载。</p>`;
  }

  const rank = S.flags.rank || "杂务";
  if (RANKS.indexOf(rank) < 2) {
    return `<p class="empty">需晋升【门内弟子】并开辟炼器房后方可铸造法器。</p>`;
  }

  if (!isForgeUnlocked()) {
    return `<p class="empty">炼器房尚未解锁，请先在【聚灵设施】中升级炼器房。</p>`;
  }

  const caveLv = getForgeCaveLv();
  const skillLv = getForgeSkillLv();
  const moodEmoji = MOOD_EMOJI[S.mood + 2];
  const moodName = MOOD_NAMES[S.mood + 2];

  let html = `
    <div class="card">
      <div class="row"><span>天机器室 Lv.${caveLv} 加成</span><b>+${((caveLv - 1) * 5).toFixed(0)}%</b></div>
      <div class="row"><span>炼器造诣 Lv.${skillLv}</span><b>${
        skillLv >= 9 ? "+15%" : skillLv >= 6 ? "+10%" : skillLv >= 3 ? "+5%" : "无"
      }</b></div>
      <div class="row"><span>道心 ${moodName} ${moodEmoji}</span><b>${S.mood >= 1 ? "+3%" : S.mood <= -1 ? "-5%" : "无"}</b></div>
    </div>`;

  if (typeof FORGE_RECIPES === "undefined" || !FORGE_RECIPES) {
    return html + `<p class="empty">炼器配方未加载。</p>`;
  }

  html += `<h4>神兵法器图谱 (${FORGE_RECIPES.length})</h4>`;
  html += `<p class="small">点击图谱名字查看锻造材料与成功率（每次铸造消耗 1 行动）。</p>`;

  const gradeNames = ["", "凡品", "下品", "中品", "上品", "极品", "灵品", "仙品"];
  html += `<div class="parchment-list-wrap">`;
  FORGE_RECIPES.forEach(recipe => {
    const check = checkForgeMaterial(recipe);
    const gName = gradeNames[recipe.grade] || (recipe.grade + "品");
    html += `
      <div class="parchment-item-row" onclick="openForgeRecipeModal('${recipe.id}')">
        <div class="p-row-left">
          <div class="p-row-icon">⚒️</div>
          <span class="p-row-name ${recipe.grade >= 4 ? 'tier-purple' : 'tier-blue'}">${recipe.name}</span>
          <span class="p-row-badge">${gName}</span>
        </div>
        <span class="p-row-count" style="color:${check.ok ? '#2e6b34' : '#8a5a44'};">${check.ok ? '可铸造 ▸' : '缺灵材 ▸'}</span>
      </div>
    `;
  });
  html += `</div>`;

  return html;
}

function openForgeRecipeModal(recipeId) {
  const recipe = typeof FORGE_RECIPES !== "undefined" ? FORGE_RECIPES.find(r => r.id === recipeId) : null;
  if (!recipe) return;
  const rate = calcForgeRate(recipe);
  const check = checkForgeMaterial(recipe);
  const gradeNames = ["", "凡品", "下品", "中品", "上品", "极品", "灵品", "仙品"];

  const matLines = check.list.map(m => {
    const color = m.ok ? "#7fbf5f" : "#d05a4a";
    return `<div class="row"><span>${m.baseId}_${m.grade}品</span><b style="color:${color};">需 ${m.need}（拥有 ${m.have}）</b></div>`;
  }).join("");

  const stoneColor = check.stoneOk ? "#7fbf5f" : "#d05a4a";

  showModal(`⚒️ 器谱灵鉴 · ${recipe.name}`, `
    <div class="card">
      <div class="row"><span>法器品阶</span><b>${gradeNames[recipe.grade] || recipe.grade + "品"}</b></div>
      <div class="row"><span>锻造成功率</span><b>${(rate * 100).toFixed(1)}%</b></div>
      <div class="row"><span>消耗灵石</span><b style="color:${stoneColor};">${recipe.spiritStone} 灵石（拥有 ${S.stone}）</b></div>
      ${matLines}
    </div>
    <p class="small">${recipe.desc || "引地火淬炼百金，铸就护道法器。"}</p>
  `, [
    ...(check.ok ? [{
      label: `⚒️ 立即开炉炼制 (${(rate * 100).toFixed(0)}%)`,
      primary: true,
      fn: () => { closeModal(); doForge(recipe.id); }
    }] : []),
    { label: "合上图谱", fn: closeModal }
  ]);
}


/* ============================================================
   洞府全景与子抽屉渲染 (参照上传图1：水墨洞天 + 圆形书法印章)
   ============================================================ */

function openCaveSubPanel(sub) {
  const rank = S.flags.rank || "杂务";
  if ((sub === "facility" || sub === "alchemy" || sub === "forge") && RANKS.indexOf(rank) < 2) {
    showModal("🔒 洞府禁制未开", `
      <p>你当前身份为<b>【${rank}】</b>，尚未获赐独立内门灵峰洞府。</p>
      <p>晋升为<b>【门内弟子】</b>后，即可开辟聚灵阵、紫府丹房与天机器室！</p>
      <p class="small">（目前你仍可在洞府全景中央点击修士打坐吐纳，或点击【兽】管理伴生灵兽。）</p>
    `, [{ label: "知晓了", fn: closeModal }]);
    return;
  }
  caveSubPanel = sub;
  currentCaveTab = sub;
  render();
}

function closeCaveSubPanel() {
  caveSubPanel = null;
  render();
}

function openCaveGardenModal() {
  const rank = S.flags.rank || "杂务";
  if (RANKS.indexOf(rank) < 2) {
    showModal("🌿 百草药园", `<p>晋升【门内弟子】后方可开辟私人百草药园，每日采摘灵草。</p>`, [{ label: "关闭", fn: closeModal }]);
    return;
  }
  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  const gardenLv = (S.cave && S.cave.garden) || 0;
  showModal("🌿 百草药园 · 灵植采摘", `
    <div class="card">
      <div class="row"><span>药园等级</span><b>Lv.${gardenLv}</b></div>
      <div class="row"><span>当前剩余行动</span><b>${remain} / ${ACTIONS_PER_SLOT}</b></div>
    </div>
    <p class="small">耗费 1 次行动悉心打理药园，可收获洗骨花、草木灰、清泉水等炼丹灵材。</p>
  `, [
    ...(remain > 0 ? [{
      label: "🌿 打理采摘 (耗1行动)",
      primary: true,
      fn: () => { closeModal(); doAction("garden"); }
    }] : []),
    { label: "升级药园设施", fn: () => { closeModal(); openCaveSubPanel("facility"); } },
    { label: "返回", fn: closeModal }
  ]);
}

function renderCave() {
  const c = S.cave || {};
  const rank = S.flags.rank || "杂务";
  const isMennei = RANKS.indexOf(rank) >= 2;

  /* 如果打开了洞府子面板，渲染全屏宣纸详情界面 + 顶部石刻/宣纸分类切换栏 + 左下角【返回】圆章 */
  if (caveSubPanel) {
    const titles = {
      facility: "聚灵阵与洞府设施",
      alchemy:  "紫府丹房",
      forge:    "天机器室",
      pet:      "灵兽仙苑",
    };
    const sealTabs = [
      { id: "facility", name: "聚灵阵", locked: !isMennei },
      { id: "alchemy",  name: "炼丹房", locked: !isMennei },
      { id: "forge",    name: "炼器室", locked: !isMennei },
      { id: "pet",      name: "灵兽苑", locked: false },
    ];
    const tabsHtml = `
      <div class="fs-rect-tabs">
        ${sealTabs.map(t => `
          <button type="button"
                  class="fs-rect-tab ${caveSubPanel === t.id ? 'active' : ''} ${t.locked ? 'locked' : ''}"
                  onclick="openCaveSubPanel('${t.id}')"
                  title="${t.name}">
            ${t.name}
          </button>
        `).join("")}
        <button type="button" class="fs-rect-tab ${!isMennei ? 'locked' : ''}" onclick="openCaveGardenModal()" title="百草园">
          百草园
        </button>
      </div>
    `;

    let bodyHtml = "";
    let centerAction = "";

    if (caveSubPanel === "facility") {
      const up = (key, icon, name, desc, cost) => {
        const lvl = c[key] || 0;
        const price = cost * (lvl + 1);
        const canBuy = S.stone >= price;
        return `
          <div class="parchment-item-row" onclick="upgradeCave('${key}', ${price})">
            <div class="p-row-left">
              <div class="p-row-icon">${icon}<span class="p-icon-qty">Lv.${lvl}</span></div>
              <span class="p-row-name tier-gold">${name}</span>
              <span class="p-row-badge">${desc}</span>
            </div>
            <div class="fs-card-right-group">
              <span class="fs-card-cost">💎 ${price}</span>
              <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); upgradeCave('${key}', ${price})" ${canBuy ? "" : "disabled"}>
                升级
              </button>
            </div>
          </div>
        `;
      };
      bodyHtml += `
        <div class="card">
          <div class="row"><span>洞府品阶</span><b>Lv.${c.level || 0}（灵气浓度 ${1 + (c.spirit || 0)} / 11）</b></div>
          <div class="row"><span>持有灵石</span><b>${fmt(S.stone)} 块</b></div>
        </div>
        <div class="parchment-sec-header">洞天营造</div>
        <div class="parchment-list-wrap">
          ${up("spirit",  "🌌", "聚灵法阵", "加速吐纳", 120)}
          ${up("alchemy", "🔥", "紫府丹房", "炼丹加成", 50)}
          ${up("forge",   "⚒️", "天机器室", "铸器加成", 60)}
          ${up("garden",  "🌿", "百草药园", "灵植产出", 40)}
        </div>
      `;
    } else if (caveSubPanel === "alchemy") {
      bodyHtml += renderCaveAlchemy();
    } else if (caveSubPanel === "forge") {
      bodyHtml += renderCaveForge();
    } else if (caveSubPanel === "pet") {
      centerAction = `<button type="button" class="fs-bottom-action-btn" onclick="openBuyPetFood()">购买饲灵丸</button>`;
      bodyHtml += `
        <div class="parchment-sec-header">随行伴生灵兽</div>
        ${renderCavePet()}
      `;
    }

    return `
      <div class="fs-detail-page">
        ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, titles[caveSubPanel] || "洞府") : tabsHtml}
        <div class="fs-detail-scroll-body">
          ${bodyHtml}
        </div>
        ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("closeCaveSubPanel()", centerAction) : ""}
      </div>
    `;
  }

  /* 全景水墨卷轴洞府视图 */
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
  const remainActions = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));

  return `
    <div class="ink-panorama-viewport">
      <div class="ink-scroll-roller top"></div>

      <!-- 顶部常驻悬浮题跋与小圆章 HUD (不随左右滑动偏移) -->
      <div class="ink-panorama-hud">
        <div class="ink-scene-plaque">
          <div class="plaque-main">
            <span class="cinnabar-tag">洞府</span>
            ${isMennei ? `紫府洞天 Lv.${c.level || 0}` : '外门清修庐'}
          </div>
          <div class="plaque-sub">灵气 ${1 + (c.spirit || 0)} 阶 · 主修《${art ? art.name : '未修心法'}》</div>
        </div>

        <div class="ink-top-right-seals">
          <button type="button" class="ink-mini-seal" onclick="openProfileSubModal('爱好')" title="道心雅趣">
            <span>逸趣</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="switchTab('story')" title="主线道途">
            <span>主线</span>
          </button>
          <button type="button" class="ink-mini-seal" onclick="switchTab('social')" title="仙友同道">
            <span>道友</span>
          </button>
        </div>
      </div>

      <!-- 可左右滑动/拖拽的宽幅水墨长卷画心 -->
      <div class="ink-panorama-scroll scrollable-landscape" data-init-align="center">
        <div class="ink-scene-canvas cave-panorama ink-panorama-world">
          <img class="ink-scene-bg" src="./src/assets/images/cave_cultivation_1792114544316.jpg" alt="修真洞府水墨画卷" referrerPolicy="no-referrer">
          <div class="ink-scene-wash-overlay"></div>
          <div class="ink-watermark-vertical">洞天福地</div>

          <!-- 左阙仙峰圆章：聚灵法阵、紫府丹房、百草药园 -->
          <button type="button" class="ink-seal-node pos-tl ${!isMennei ? 'locked-node' : ''}" onclick="openCaveSubPanel('facility')">
            <span class="node-char">
              聚
              <em class="seal-red-stamp">${isMennei ? `Lv.${c.spirit || 0}` : '未开'}</em>
            </span>
            <span class="node-caption">聚灵法阵</span>
            <span class="node-sub-hint">吐纳效率加成</span>
          </button>

          <button type="button" class="ink-seal-node pos-ml ${!isMennei ? 'locked-node' : ''}" onclick="openCaveSubPanel('alchemy')">
            <span class="node-char">
              丹
              <em class="seal-red-stamp">${isMennei ? `Lv.${c.alchemy || 0}` : '未开'}</em>
            </span>
            <span class="node-caption">紫府丹房</span>
            <span class="node-sub-hint">开炉淬炼灵丹</span>
          </button>

          <button type="button" class="ink-seal-node pos-bl ${!isMennei ? 'locked-node' : ''}" onclick="openCaveGardenModal()">
            <span class="node-char">
              药
              <em class="seal-red-stamp">${isMennei ? `Lv.${c.garden || 0}` : '未开'}</em>
            </span>
            <span class="node-caption">百草药园</span>
            <span class="node-sub-hint">每日采摘灵草</span>
          </button>

          <!-- 中枢清池莲台打坐修士 + 快捷吐纳/破境双圆章 -->
          <div class="cave-meditate-center">
            <div class="lotus-halo-outer" onclick="gotoCultivate()"></div>
            <div class="lotus-halo-inner" onclick="gotoCultivate()"></div>
            <div class="meditate-avatar-disc" onclick="gotoCultivate()" title="点击查看功法详情与突破">
              <img src="./src/assets/images/cultivator_avatar_1792114545622.jpg" alt="${S.name}" referrerPolicy="no-referrer">
            </div>
            <div class="meditate-status-pill" onclick="gotoCultivate()">
              <span class="pulse-dot"></span>
              <span>周天运转中 · 剩余行动 ${remainActions}</span>
            </div>
            <div class="meditate-realm-bar" onclick="gotoCultivate()">
              <div class="meditate-realm-fill" style="width:${progressRatio}%"></div>
              <span class="meditate-realm-txt">${realmText}（${progressLabel}）</span>
            </div>
            <div class="cave-center-seal-actions">
              <button type="button" class="cave-action-seal" onclick="doAction('meditate')" ${remainActions <= 0 ? 'disabled' : ''} title="耗费1次行动立即打坐吐纳">
                <span class="cas-char">吐纳</span>
                <span class="cas-sub">耗1行动</span>
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

          <button type="button" class="ink-seal-node pos-mr ${!isMennei ? 'locked-node' : ''}" onclick="openCaveSubPanel('forge')">
            <span class="node-char">
              器
              <em class="seal-red-stamp">${isMennei ? `Lv.${c.forge || 0}` : '未开'}</em>
            </span>
            <span class="node-caption">天机器室</span>
            <span class="node-sub-hint">百炼神兵法器</span>
          </button>

          <button type="button" class="ink-seal-node pos-br" onclick="openCaveSubPanel('pet')">
            <span class="node-char">
              兽
              <em class="seal-red-stamp">${activePet ? '出战' : `${petCount}只`}</em>
            </span>
            <span class="node-caption">${activePet ? activePet.name : '灵兽仙苑'}</span>
            <span class="node-sub-hint">豢养伴生灵宠</span>
          </button>
        </div>
      </div>

      <!-- 底部横向长卷导览罗盘 (支持左右滑动与一键定位) -->
      <div class="ink-panorama-compass">
        <button type="button" class="pano-compass-btn" data-pos="left" onclick="panPanorama('left')">◀ 左阙·丹药</button>
        <button type="button" class="pano-compass-btn active" data-pos="center" onclick="panPanorama('center')">☯ 中枢·莲台</button>
        <button type="button" class="pano-compass-btn" data-pos="right" onclick="panPanorama('right')">右阙·器兽 ▶</button>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}
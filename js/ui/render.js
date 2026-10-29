/* ============================================================
   ui/render.js - 主渲染入口
   ============================================================ */

let _lastPanoramaKey = null;
const _savedPanoramaScroll = {};
const _savedVerticalScroll = {};

function getPanoramaStateKey() {
  const sub = currentTab === "sect" ? (sectSubPanel || "main")
            : currentTab === "cave" ? (caveSubPanel || "main")
            : "main";
  return `${currentTab}:${sub}`;
}

function render() {
  if (!S) return;
  renderStatus();
  renderTabs();
  if (typeof renderFloatingLog === "function") {
    renderFloatingLog();
  }

  const box = document.getElementById("panelContent");
  if (!box) return;

  /* 记录当前横向长卷或人物立轴纵向滚动位置 */
  const oldScroller = box.querySelector(".scrollable-landscape, .ink-panorama-scroll");
  if (oldScroller && _lastPanoramaKey) {
    _savedPanoramaScroll[_lastPanoramaKey] = oldScroller.scrollLeft;
  }
  const oldVScroller = box.querySelector(".char-stage-view.scrollable-portrait");
  if (oldVScroller && _lastPanoramaKey) {
    _savedVerticalScroll[_lastPanoramaKey] = oldVScroller.scrollTop;
  }

  /* 记录当前全屏详情滚动位置 */
  const oldDetailScroller = box.querySelector(".fs-detail-scroll-body");
  const savedDetailScroll = oldDetailScroller ? oldDetailScroller.scrollTop : 0;

  const nextKey = getPanoramaStateKey();
  const isSameKey = (nextKey === _lastPanoramaKey);
  _lastPanoramaKey = nextKey;

  if (currentTab === "profile") box.innerHTML = renderProfileMainPage();
  else if (currentTab === "adventureMap") box.innerHTML = renderAdventureMapPage();
  else if (currentTab === "day") box.innerHTML = renderDay();
  else if (currentTab === "sect") box.innerHTML = renderSect();
  else if (currentTab === "cave") box.innerHTML = renderCave();
  else if (currentTab === "bag") box.innerHTML = renderBagMainPage();
  else if (currentTab === "story") box.innerHTML = renderStoryUI();
  else if (currentTab === "social") box.innerHTML = renderSocial();
  else if (currentTab === "cultivatePage") box.innerHTML = renderCultivatePage();
  else box.innerHTML = renderCave();

  if (savedDetailScroll > 0) {
    const newDetailScroller = box.querySelector(".fs-detail-scroll-body");
    if (newDetailScroller) {
      newDetailScroller.scrollTop = savedDetailScroll;
    }
  }

  if (typeof syncFullScreenDetailChrome === "function") {
    syncFullScreenDetailChrome();
  }

  initPanoramaScroll(box, nextKey, isSameKey);
  initVerticalStageScroll(box, nextKey, isSameKey);
  if (currentTab === "bag" && typeof bindBagPageSwipeGesture === "function") {
    bindBagPageSwipeGesture();
  }
  if (currentTab === "cave" && caveSubPanel && typeof bindCavePageSwipeGesture === "function") {
    bindCavePageSwipeGesture();
  }
}

function initVerticalStageScroll(box, stateKey, isSameKey) {
  const scroller = box.querySelector(".char-stage-view.scrollable-portrait");
  if (!scroller) return;

  if (isSameKey && typeof _savedVerticalScroll[stateKey] === "number") {
    requestAnimationFrame(() => {
      scroller.scrollTop = _savedVerticalScroll[stateKey];
    });
  }

  scroller.addEventListener("scroll", () => {
    _savedVerticalScroll[stateKey] = scroller.scrollTop;
  }, { passive: true });

  /* 支持桌面端鼠标上下拖拽立轴长卷 + 原生滚轮/触屏滑动 */
  let isDown = false;
  let startY = 0;
  let startScrollTop = 0;
  let moved = false;

  const finishDrag = () => {
    if (!isDown) return;
    isDown = false;
    scroller.classList.remove("dragging");
  };

  scroller.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    moved = false;
    startY = e.pageY;
    startScrollTop = scroller.scrollTop;
    scroller.classList.add("dragging");
  });

  scroller.addEventListener("mouseleave", finishDrag);
  scroller.addEventListener("mouseup", finishDrag);

  scroller.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const walkY = e.pageY - startY;
    if (Math.abs(walkY) > 6) {
      moved = true;
      e.preventDefault();
      scroller.scrollTop = startScrollTop - walkY * 1.15;
    }
  });

  scroller.addEventListener("click", (e) => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
      moved = false;
    }
  }, true);
}

function initPanoramaScroll(box, stateKey, isSameKey) {
  const scroller = box.querySelector(".scrollable-landscape, .ink-panorama-scroll");
  if (!scroller) return;

  const applyInitialScroll = () => {
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    if (maxScroll <= 0) return;

    scroller.style.scrollBehavior = "auto";
    if (isSameKey && typeof _savedPanoramaScroll[stateKey] === "number") {
      scroller.scrollLeft = _savedPanoramaScroll[stateKey];
    } else {
      /* 洞府、仙途、宗门、历练等按进去后默认展示最左边 */
      scroller.scrollLeft = 0;
    }
    requestAnimationFrame(() => {
      scroller.style.scrollBehavior = "";
    });
    updatePanoramaCompass(scroller);
  };

  requestAnimationFrame(applyInitialScroll);

  scroller.addEventListener("scroll", () => {
    _savedPanoramaScroll[stateKey] = scroller.scrollLeft;
    updatePanoramaCompass(scroller);
  }, { passive: true });

  /* 桌面端鼠标拖拽平移支持 + 松手后触发 scroll-snap 平滑归位 */
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;

  const finishDrag = () => {
    if (!isDown) return;
    isDown = false;
    scroller.classList.remove("dragging");
    if (moved) {
      /* 松开鼠标时根据当前位置平滑吸附至最近画卷分阙 */
      const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      const ratio = scroller.scrollLeft / maxScroll;
      if (scroller.querySelector(".adv-wide-world")) {
        const steps = 4;
        const idx = Math.round(ratio * steps);
        scroller.scrollTo({ left: (idx / steps) * maxScroll, behavior: "smooth" });
      } else {
        let target = maxScroll / 2;
        if (ratio < 0.33) target = 0;
        else if (ratio > 0.67) target = maxScroll;
        scroller.scrollTo({ left: target, behavior: "smooth" });
      }
    }
  };

  scroller.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    moved = false;
    startX = e.pageX - scroller.offsetLeft;
    startScrollLeft = scroller.scrollLeft;
    scroller.classList.add("dragging");
  });

  scroller.addEventListener("mouseleave", finishDrag);
  scroller.addEventListener("mouseup", finishDrag);

  scroller.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const x = e.pageX - scroller.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 6) {
      moved = true;
      e.preventDefault();
      scroller.scrollLeft = startScrollLeft - walk * 1.15;
    }
  });

  scroller.addEventListener("click", (e) => {
    if (moved) {
      e.stopPropagation();
      e.preventDefault();
      moved = false;
    }
  }, true);
}

function updatePanoramaCompass(scroller) {
  const wrap = scroller.closest(".ink-panorama-viewport") || scroller.parentElement;
  if (!wrap) return;
  const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
  const ratio = scroller.scrollLeft / maxScroll;
  const btns = wrap.querySelectorAll(".pano-compass-btn");
  btns.forEach(btn => {
    const pos = btn.dataset.pos;
    const active = (pos === "left" && ratio < 0.33) ||
                   (pos === "center" && ratio >= 0.33 && ratio <= 0.67) ||
                   (pos === "right" && ratio > 0.67);
    btn.classList.toggle("active", active);
  });
}

function panPanorama(pos) {
  const scroller = document.querySelector("#panelContent .scrollable-landscape, #panelContent .ink-panorama-scroll");
  if (!scroller) return;
  const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  let target = maxScroll / 2;
  if (pos === "left") target = 0;
  else if (pos === "right") target = maxScroll;
  scroller.scrollTo({ left: target, behavior: "smooth" });
}

/* ========== Debug ========== */
function debugComplete() {
  const art = getCurrentArt();
  if (!art) { log("没有心法。", "c-bad"); return; }
  const prog = getArtProgress(art.id);
  prog.proficiency = 100;
  if (prog.lvl === 0) {
    /* 凡人：直接可突破 */
  } else if (prog.lvl < art.maxLvl) {
    const curLevelData = art.levels.find(l => l.lvl === prog.lvl);
    if (curLevelData) prog.exp = curLevelData.expNeed;
  }
  log(`[DEBUG] ${art.name} 熟练度 100，修为满`, "c-gold");
  save(); render();
}

function debugStartBattle() {
  const options = [];
  for (const tier in FIGHT_ENEMIES) {
    FIGHT_ENEMIES[tier].forEach(e => {
      options.push({ label: `${e.name}（${tier}）`, fn: () => {
        closeModal();
        startBattle([{ enemyId: e.id }]);
      }});
    });
  }
  options.push({ label: "取消", fn: closeModal });

  showModal("测试战斗 · 选择敌人", "<p>选一个敌人开战：</p>", options);
}

function debugFullHeal() {
  S.hp = totalMaxHp();
  S.mp = totalMaxMp();
  log(`[DEBUG] 气血、灵力全满`, "c-gold");
  save(); render();
}

function debugRestoreHp() {
  S.hp = totalMaxHp();
  log(`[DEBUG] 气血全满`, "c-gold");
  save(); render();
}

function debugRestoreMp() {
  S.mp = totalMaxMp();
  log(`[DEBUG] 灵力全满`, "c-gold");
  save(); render();
}

function debugPromoteToMennei() {
  S.flags.rank = "门内";
  if (!S.peak) {
    S.peak = pick(PEAKS).id;
  }
  addNPCsForRank("门内");
  log("[DEBUG] 晋升门内", "c-gold");
  save(); render();
}

function debugStartBattleMulti() {
  const options = [
    { label: "1 只野狼", fn: () => { closeModal(); startBattle([{ enemyId: "e_wolf" }]); } },
    { label: "2 只（野狼 + 白鳞幼蛇）", fn: () => { closeModal(); startBattle([
      { enemyId: "e_wolf" }, { enemyId: "e_white_snake_tiny" }
    ]); } },
    { label: "3 只（野狼 + 白鳞幼蛇 + 钢鬃黑野猪）", fn: () => { closeModal(); startBattle([
      { enemyId: "e_wolf" }, { enemyId: "e_white_snake_tiny" }, { enemyId: "e_boar_iron" }
    ]); } },
    { label: "取消", fn: closeModal },
  ];
  showModal("测试群战", "<p>选择怪物数量：</p>", options);
}

function debugAddMoney() {
  S.money += 1000;
  log("[DEBUG] 铜钱 +1000", "c-gold");
  save(); render();
}

function debugAddStone() {
  S.stone += 1000;
  log("[DEBUG] 灵石 +1000", "c-gold");
  save(); render();
}

function debugAddProficiency() {
  const art = getCurrentArt();
  if (!art) { log("[DEBUG] 没有心法", "c-bad"); return; }
  const prog = getArtProgress(art.id);
  prog.proficiency = 100;
  log(`[DEBUG] ${art.name} 熟练度设为 100`, "c-gold");
  save(); render();
}

function debugAddContrib() {
  S.contrib += 100;
  log("[DEBUG] 宗门贡献 +100", "c-gold");
  save(); render();
}

function toggleDebugRoot() {
  debugShowRoot = !debugShowRoot;
  log(`[DEBUG] 灵根显示：${debugShowRoot ? "开" : "关"}`, "c-gold");
  render();
}

/* ========== Debug：加材料（含炼器材料与炼丹材料） ========== */

function debugAddMaterial() {
  const forgeMats = (typeof FORGE_MATERIALS_BASE !== "undefined" && Array.isArray(FORGE_MATERIALS_BASE))
    ? FORGE_MATERIALS_BASE
    : [];
  const herbMats = (typeof MAT_BASE !== "undefined" && Array.isArray(MAT_BASE))
    ? MAT_BASE
    : [];

  if (forgeMats.length === 0 && herbMats.length === 0) {
    log("[DEBUG] 材料数据未加载", "c-bad");
    return;
  }

  const options = [];

  /* 快捷一键添加全部炼器灵材（包含炼器配方所需的草木灰/妖兽精血/火精枣/寒血果/天地灵乳） */
  options.push({
    label: "★ 一键满配全部【炼器材料】（1~7品 各+50）",
    primary: true,
    fn: () => {
      closeModal();
      const forgeAuxIds = ["草木灰", "妖兽精血", "火精枣", "寒血果", "天地灵乳"];
      forgeMats.forEach(m => {
        for (let g = 1; g <= (m.maxGrade || 7); g++) {
          addItem(`${m.id}_${g}`, 50);
        }
      });
      forgeAuxIds.forEach(auxId => {
        for (let g = 1; g <= 7; g++) {
          if (ITEMS[`${auxId}_${g}`]) addItem(`${auxId}_${g}`, 50);
        }
      });
      log("[DEBUG] 已添加全部炼器五金灵材及辅料（1~7品 各×50）", "c-gold");
      save(); render();
    },
  });

  /* 快捷一键添加全部炼丹药材 */
  options.push({
    label: "★ 一键满配全部【炼丹药材】（各品级 +50）",
    fn: () => {
      closeModal();
      herbMats.forEach(m => {
        for (let g = 1; g <= m.maxGrade; g++) {
          addItem(`${m.id}_${g}`, 50);
        }
      });
      log("[DEBUG] 已添加全部炼丹灵草药材（各品级 ×50）", "c-gold");
      save(); render();
    },
  });

  /* 单独选择炼器材料 */
  forgeMats.forEach(m => {
    const ico = m.icon || "⚒️";
    options.push({
      label: `${ico} 【炼器】${m.name}（1~${m.maxGrade} 品）`,
      fn: () => { closeModal(); debugAddMaterialGrade(m); },
    });
  });

  /* 单独选择炼丹/通用材料 */
  herbMats.forEach(m => {
    const ico = m.icon || (typeof getItemIcon === "function" ? getItemIcon(m, m.id) : "🌿");
    options.push({
      label: `${ico} 【灵材】${m.name}（1~${m.maxGrade} 品）`,
      fn: () => { closeModal(); debugAddMaterialGrade(m); },
    });
  });

  options.push({ label: "取消", fn: closeModal });

  showModal("加材料 · 选择炼器或炼丹材料", "<p>选择要加入行囊的炼器五金或天材地宝：</p>", options);
}

function debugAddMaterialGrade(mat) {
  /* 第二步：选品级 */
  const options = [];
  options.push({
    label: `★ 全部品级（1~${mat.maxGrade}品）各 +50`,
    primary: true,
    fn: () => {
      closeModal();
      for (let g = 1; g <= mat.maxGrade; g++) {
        addItem(`${mat.id}_${g}`, 50);
      }
      log(`[DEBUG] 获得 ${mat.name}（1~${mat.maxGrade}品）各 ×50`, "c-gold");
      save(); render();
    },
  });
  for (let g = 1; g <= mat.maxGrade; g++) {
    options.push({
      label: `${g} 品`,
      fn: () => { closeModal(); debugAddMaterialCount(mat, g); },
    });
  }
  options.push({ label: "取消", fn: closeModal });

  showModal(`加材料 · ${mat.name}`, "<p>选择品级：</p>", options);
}

function debugAddMaterialCount(mat, grade) {
  /* 第三步：选数量 */
  const itemId = mat.id + "_" + grade;
  const amounts = [1, 10, 100];
  const options = amounts.map(n => ({
    label: `+${n}`,
    fn: () => {
      closeModal();
      addItem(itemId, n);
      log(`[DEBUG] 获得 ${mat.name}_${grade} ×${n}`, "c-gold");
      save(); render();
    },
  }));
  options.push({
    label: "+1000",
    fn: () => {
      closeModal();
      addItem(itemId, 1000);
      log(`[DEBUG] 获得 ${mat.name}_${grade} ×1000`, "c-gold");
      save(); render();
    },
  });
  options.push({ label: "取消", fn: closeModal });

  showModal(`加材料 · ${mat.name}（${grade} 品）`, "<p>选择数量：</p>", options);
}

/* ========== Debug：加丹方 / 炼器谱 ========== */

function debugAddRecipe() {
  const unknownAlchemy = (typeof RECIPES !== "undefined" && RECIPES)
    ? RECIPES.filter(r => !isRecipeKnown(r.id))
    : [];
  const unknownForge = (typeof FORGE_RECIPES !== "undefined" && FORGE_RECIPES)
    ? FORGE_RECIPES.filter(r => (typeof isForgeRecipeExchangeableInSect === "function" ? isForgeRecipeExchangeableInSect(r) : (r.grade || 1) <= 6) && !(typeof isForgeRecipeKnown === "function" && isForgeRecipeKnown(r.id)))
    : [];

  if (unknownAlchemy.length === 0 && unknownForge.length === 0) {
    log("[DEBUG] 已解锁全部丹方与金丹期及以下炼器谱", "c-gold");
    return;
  }

  const options = [];

  if (unknownForge.length > 0) {
    options.push({
      label: `★ 一键解锁全部【金丹及以下炼器谱】（${unknownForge.length} 个）`,
      primary: true,
      fn: () => {
        closeModal();
        if (!S.flags.knownForgeRecipes) S.flags.knownForgeRecipes = {};
        unknownForge.forEach(r => { S.flags.knownForgeRecipes[r.id] = true; });
        log(`[DEBUG] 解锁全部金丹及以下炼器谱（${unknownForge.length} 个）`, "c-gold");
        save(); render();
      },
    });
  }

  if (unknownAlchemy.length > 0) {
    options.push({
      label: `★ 一键解锁全部【丹方】（${unknownAlchemy.length} 个）`,
      fn: () => {
        closeModal();
        if (!S.flags.knownRecipes) S.flags.knownRecipes = {};
        RECIPES.forEach(r => { S.flags.knownRecipes[r.id] = true; });
        log(`[DEBUG] 解锁全部丹方（${RECIPES.length} 个）`, "c-gold");
        save(); render();
      },
    });
  }

  unknownForge.forEach(r => {
    options.push({
      label: `⚒️ 器谱：《${r.name}》（${r.grade}品）`,
      fn: () => {
        closeModal();
        if (!S.flags.knownForgeRecipes) S.flags.knownForgeRecipes = {};
        S.flags.knownForgeRecipes[r.id] = true;
        log(`[DEBUG] 解锁炼器谱《${r.name}》`, "c-gold");
        save(); render();
      },
    });
  });

  unknownAlchemy.forEach(r => {
    options.push({
      label: `💊 丹方：《${r.name}》（${r.tier} 阶）`,
      fn: () => {
        closeModal();
        if (!S.flags.knownRecipes) S.flags.knownRecipes = {};
        S.flags.knownRecipes[r.id] = true;
        log(`[DEBUG] 解锁丹方《${r.name}》`, "c-gold");
        save(); render();
      },
    });
  });

  options.push({ label: "取消", fn: closeModal });

  showModal("加丹方 / 炼器谱 · 未解锁列表", `<p>未解锁炼器谱 ${unknownForge.length} 个 · 未解锁丹方 ${unknownAlchemy.length} 个：</p>`, options);
}


/* ========== 结局 ========== */

/*
   ★ 修复（P0-2）：
   原 die() 死亡后调 save()，会把「已死角色」写回 localStorage。
   如果玩家在死亡弹窗时刷新页面，boot() 会读到 hp=0 的存档，角色诈尸复活。
   改为：删角色档 + 不 save() + 把 S 置空（防止 beforeunload 又 save）。
*/
function die(reason) {
  /* 逆天宝物：免死 */
  if (typeof checkRevive === "function" && checkRevive()) {
    save(); render();
    return;
  }

  /* ★ 记录宗门先祖青史：在清除 S 前将玩家名字、仙历年份、生前境界、死因写入宗门历史 */
  if (typeof recordSectChronicleEntry === "function") {
    recordSectChronicleEntry(reason);
  }

  const name = (S && S.name) || "道友";
  const life = Math.floor((S && S.life) || 16);

  /* ① 删角色档：一命通关核心 */
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* ignore */ }

  /* ② 先把 S 置空，再弹窗，防止 beforeunload 把死亡角色写回 */
  if (S) S.hp = 0;
  S = null;

  /* ③ 弹死亡与轮回界面：仅保留轮回重开按钮，不出现返回因果结算或青史按钮 */
  showModal("身死道消", `
    <p style="font-size:14px; line-height:1.7;">${reason}</p>
    <div style="background:rgba(212,163,71,0.08); border:1px solid rgba(212,163,71,0.25); border-radius:6px; padding:8px 12px; margin:10px 0;">
      <p style="margin:2px 0;">道号：<b>${name}</b>　享年：<b>${life}</b> 岁</p>
      <p class="small" style="color:var(--text-gold); margin:4px 0 0;">📜 前世生平因果已载入宗门实录。转世拜入宗门后，可在随身道具【特别】中随时研读历祖先贤与前世青史！</p>
    </div>
  `, [
    { label: "轮回转世 · 重开一生", primary: true, fn: () => { closeModal(); resetGame(); } },
  ]);
}

function win() {
  showModal("飞升成仙", `<p>你渡过天劫，白日飞升！</p>`, [
    { label: "重开一生", fn: () => { closeModal(); resetGame(); } }
  ]);
}

function debugAddFragment() {
  const frag = getRandomFragment();
  if (!frag) { log("[DEBUG] 无残卷", "c-bad"); return; }
  addFragment(frag.fragment.id, 1);
  log(`[DEBUG] 获得 ${frag.fragment.name}`, "c-gold");
  save(); render();
}

function debugAddHeavenDefying() {
  const allHd = HEAVEN_DEFYING.filter(h => !S.heavenDefying.owned[h.id]);
  if (allHd.length === 0) { log("[DEBUG] 已拥有全部逆天宝物", "c-bad"); return; }
  const hd = pick(allHd);
  addHeavenDefying(hd.id);
  const disp = getHeavenDefyingDisplay(hd.id);
  log(`[DEBUG] 获得逆天宝物：${disp.name}`, "c-gold");
  save(); render();
}

function debugResetGame() {
  showModal("确认清空数据重置", "<p>是否确定清空当前所有存档与游戏数据，并重新开辟道途？</p>", [
    { label: "确定清空", fn: () => { closeModal(); resetGame(); } },
    { label: "取消", fn: closeModal }
  ]);
}
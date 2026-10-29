/* ============================================================
   ui/profile.js - 角色面板
   ============================================================ */

const FALLBACK_LUNAR_MONTHS = [
  "正月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "冬月", "腊月",
];

function getSafeLunarMonths() {
  if (typeof LUNAR_MONTHS !== "undefined" && Array.isArray(LUNAR_MONTHS)) {
    return LUNAR_MONTHS;
  }
  if (typeof window !== "undefined" && Array.isArray(window.LUNAR_MONTHS)) {
    return window.LUNAR_MONTHS;
  }
  return FALLBACK_LUNAR_MONTHS;
}

function initCreationPanel() {
  const lunarMonths = getSafeLunarMonths();
  const m = document.getElementById("monthInput");
  if (m) {
    m.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = lunarMonths[i - 1];
      if (i === 6) o.selected = true;
      m.appendChild(o);
    }
  }
  const d = document.getElementById("dayInput");
  if (d) {
    d.innerHTML = "";
    for (let i = 1; i <= 30; i++) {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = i + "日";
      d.appendChild(o);
    }
  }
}

function openProfile() {
  if (!S) return;
  renderProfile();
  document.getElementById("profileMask").classList.add("show");
  if (typeof syncFullScreenDetailChrome === "function") {
    syncFullScreenDetailChrome();
  }
}
function closeProfile() {
  document.getElementById("profileMask").classList.remove("show");
  if (typeof syncFullScreenDetailChrome === "function") {
    syncFullScreenDetailChrome();
  }
}
function switchProfileTab(t) {
  currentProfileTab = t;
  renderProfile();
}
function switchBagTab(t) {
  currentBagTab = t;
  renderProfile();
}

let currentSpellFilter = "all";
let currentEquipFilter = "all";

function switchSpellFilter(f) {
  currentSpellFilter = f;
  renderProfile();
}

function switchEquipFilter(f) {
  currentEquipFilter = f;
  renderProfile();
}

/* ============================================================
   图表与槽位映射常量
   ============================================================ */

const SLOT_ICONS = {
  head: "👑", rightHand: "⚔️", leftHand: "🛡️", body: "🥋", shoes: "👢",
  accessory1: "📿", accessory2: "💍",
  artifact1: "🔮", artifact2: "🪞", artifact3: "🪔",
  pet: "🐾", mount: "🐎", heavenDefying: "☯️",
};

const RESIST_MAP = {
  poison:  { icon: "☠️", name: "抗毒" },
  burn:    { icon: "🔥", name: "抗灼" },
  bleed:   { icon: "🩸", name: "抗创" },
  stun:    { icon: "💫", name: "抗眩" },
  freeze:  { icon: "❄️", name: "抗冻" },
  silence: { icon: "🔇", name: "抗默" },
  atkDown: { icon: "📉", name: "抗衰" },
};

const CHORE_ICONS = {
  tiao: "💧", chai: "🪓", cai: "🥬", ji: "🐔",
  lingshou: "🐾", lingyao: "🌿", daqiao: "🔨", cangjing: "📜",
  lianyao: "🧪", lianqi: "⚔️", xunshou: "🐺", zhenfa: "🔮",
  c_kanchai: "🪓", c_tiaoshui: "💧", c_saodi: "🧹", c_caiyao: "🌿",
  c_liandan: "🧪", c_xunshan: "🏔️", c_hufa: "🛡️", c_zhongzhi: "🌾",
  c_sishou: "🥩", c_bushou: "🐾", c_zhenfa: "🔮", c_jiangjing: "📖",
};

const HOBBY_ICONS = {
  "琴": "🪕", "棋": "♟️", "书": "📖", "画": "🎨",
  "花": "🌸", "钓": "🎣", "酒": "🍶", "茶": "🍵",
  "剑舞": "⚔️", "养鸟": "🦜", "养猫": "🐱", "养狗": "🐕",
  "下棋": "♟️", "抚琴": "🪕", "品茗": "🍵", "钓鱼": "🎣",
  "赏月": "🌕", "读书": "📖", "莳花": "🌸", "饮酒": "🍶",
  "试剑": "⚔️", "参禅": "🧘", "观星": "🔭", "作画": "🎨",
};

const SKILL_ICONS = {
  "剑": "🗡️", "刀": "🔪", "拳": "👊", "掌": "✋", "棍": "🥢", "鞭": "➰",
  "兽": "🐾", "炼丹": "🧪", "炼器": "⚔️", "阵法": "🔮", "符": "📜",
};

const SPELL_ICONS = {
  "剑": "🗡️", "刀": "🔪", "拳": "👊", "掌": "✋", "棍": "🥢", "鞭": "➰",
  "兽": "🐾", "炼丹": "🧪", "炼器": "⚔️", "阵法": "🔮", "符": "📜", "通用": "✨",
};

const ITEM_TYPE_ICONS = {
  pill: "💊", petBreak: "🔮", food: "🍖", mat: "🌿", equip: "⚔️",
  armor: "🥋", body: "🥋", cloth: "🥋",
  artifact: "🪞", heartFragment: "📜", spellbook: "📖", summonbook: "📜",
  heavenDefying: "☯️", quest: "🏷️", other: "📦",
};

/* ============================================================
   角色信息 (Mobile 友好精简看板)
   ============================================================ */

function renderProfileInfo() {
  const sect = S.sect ? SECTS.find(x => x.id === S.sect) : null;
  const peak = S.peak ? PEAKS.find(p => p.id === S.peak) : null;
  const master = S.master ? S.npcMap[S.master] : null;
  const apt = APTITUDES.find(a => a.id === S.aptitude) || APTITUDES[0];
  const playerInfo = getPlayerRealmInfo();
  const realmText = playerInfo.realm === 0 ? "凡胎肉体" :
    `${REALMS[playerInfo.realm].name} · ${subName(playerInfo.lvl)}${playerInfo.lvl}重`;

  const lifeRatio = Math.max(0, Math.min(100, Math.round((S.life / (S.lifeMax || 100)) * 100)));

  // 五行灵根
  const rootColors = { jin: "#f0cf78", mu: "#5fb865", shui: "#5da8eb", huo: "#db4c3b", tu: "#c29153" };
  let maxRootKey = "jin";
  let maxRootVal = -1;
  if (S.roots) {
    Object.keys(S.roots).forEach(k => {
      if (S.roots[k] > maxRootVal) {
        maxRootVal = S.roots[k];
        maxRootKey = k;
      }
    });
  }

  const rootDisplay = debugShowRoot
    ? `<div class="root-gems-bar">
        ${ROOT_TYPES.map(x => {
          const v = S.roots[x.id] || 0;
          const isDom = x.id === maxRootKey;
          const c = rootColors[x.id] || '#d4a347';
          return `<div class="root-gem-chip ${isDom ? 'dominant' : ''}" title="${x.name}属性灵根">
            <div class="root-gem-name" style="color:${c};">${x.name}${isDom ? '★' : ''}</div>
            <div class="root-gem-bar-mini">
              <div class="root-gem-bar-fill" style="width:${Math.min(100, v * 10)}%; background:${c};"></div>
            </div>
            <div class="root-gem-val">${v}</div>
          </div>`;
        }).join("")}
      </div>`
    : `<p class="small" style="padding:4px 0; color:var(--text-dim); text-align:center;">✨ 暗藏玄机（入高阶宗门或服用测灵丹方可洞察详细）</p>`;

  const hdDisp = S.equipped.heavenDefying ? getHeavenDefyingDisplay(S.equipped.heavenDefying) : null;
  const activePet = S.equipped.pet ? (S.pets?.list?.find(p => p.uid === S.equipped.pet)) : null;

  return `
    <div class="profile-hero-hud">
      <div class="profile-hero-avatar">
        <img src="./src/assets/images/cultivator_avatar_1792114545622.jpg" alt="${S.name}" referrerPolicy="no-referrer">
      </div>
      <div class="profile-hero-info">
        <div class="profile-hero-name-row">
          <span class="profile-hero-name">${S.name}</span>
          <span class="profile-hero-realm-tag">${realmText}</span>
          <span class="tag gold">${sect ? sect.name + ' · ' + (S.flags.rank || '杂务') : '暂无宗门'}</span>
        </div>
        <div class="profile-hero-subline">
          <div class="profile-hero-life-bar" title="寿元消耗">
            <span>寿元</span>
            <div class="life-mini-track">
              <div class="life-mini-fill" style="width:${lifeRatio}%;"></div>
            </div>
            <span style="color:var(--text-bright);">${Math.floor(S.life)}/${S.lifeMax}岁</span>
          </div>
          <span>道心: <b style="color:var(--text-gold);">${moralityLabel(S.morality)}</b></span>
          <span>气运: <b style="color:#5fb865;">${S.luck}</b></span>
        </div>
      </div>
    </div>

    <h4>战斗神能看板</h4>
    <div class="stat-tile-grid">
      <div class="stat-tile">
        <div class="stat-tile-header"><span>⚔️</span><span>攻击</span></div>
        <div class="stat-tile-value">${totalAtk()}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>🛡️</span><span>防御</span></div>
        <div class="stat-tile-value">${totalDef()}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>⚡</span><span>身法速度</span></div>
        <div class="stat-tile-value">${totalSpeed()}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>🎯</span><span>会心暴击</span></div>
        <div class="stat-tile-value">${(getCritRate() * 100).toFixed(1)}%</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>❤️</span><span>气血上限</span></div>
        <div class="stat-tile-value">${totalMaxHp()}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>💧</span><span>灵力上限</span></div>
        <div class="stat-tile-value">${totalMaxMp()}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>🍀</span><span>天命气运</span></div>
        <div class="stat-tile-value">${S.luck}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-header"><span>🪙</span><span>资财</span></div>
        <div class="stat-tile-value">${S.stone}石 / ${S.money}钱</div>
      </div>
    </div>

    ${renderCompactDaoQuadRow(true)}

    <h4>仙门道统与身世</h4>
    <div class="dao-meta-grid">
      <div class="dao-meta-item">
        <span class="lbl">🏔️ 宗门峰脉</span>
        <span class="val">${sect ? sect.name + ' · ' + (peak ? peak.name : '主峰') : '无门无派'}</span>
      </div>
      <div class="dao-meta-item">
        <span class="lbl">🥋 传道恩师</span>
        <span class="val">${master ? master.name : '尚无明师'}</span>
      </div>
      <div class="dao-meta-item">
        <span class="lbl">🌟 根骨资质</span>
        <span class="val">${apt.name} (限${REALMS[apt.maxRealm].name})</span>
      </div>
      <div class="dao-meta-item">
        <span class="lbl">🎖️ 宗门功绩</span>
        <span class="val">${S.contrib} 点</span>
      </div>
      <div class="dao-meta-item">
        <span class="lbl">📅 生辰干支</span>
        <span class="val">${getSafeLunarMonths()[S.birthday.month - 1]}${S.birthday.day}日 (${S.ie})</span>
      </div>
      <div class="dao-meta-item">
        <span class="lbl">☯️ 命格气数</span>
        <span class="val">${S.flags.destinyTitle || '凡胎问道'} (${S.morality >= 0 ? '+' : ''}${S.morality})</span>
      </div>
    </div>

    <h4>宿命五行灵根</h4>
    <div class="card" style="padding:6px 8px;">${rootDisplay}</div>

    <h4>异象抗性</h4>
    <div class="card" style="padding:6px 8px;">
      <div class="resist-badge-cluster">
        ${Object.keys(S.resistances || {}).map(k => {
          const meta = RESIST_MAP[k] || { icon: "🛡️", name: k };
          const val = (S.resistances && S.resistances[k]) || 0;
          const cls = val >= 100 ? "immune" : val > 0 ? "high" : "low";
          return `<div class="resist-badge ${cls}" title="${meta.name}抗性: ${val}">
            <span>${meta.icon}</span>
            <span>${meta.name}</span>
            <b>${val > 0 ? '+' + val : '0'}</b>
          </div>`;
        }).join("")}
      </div>
    </div>

    <h4>随行造化与灵宠</h4>
    <div class="companion-preview-grid">
      <div class="companion-preview-card">
        <div class="companion-preview-icon">☯️</div>
        <div class="companion-preview-text">
          <div class="companion-preview-title">${hdDisp ? hdDisp.name : '（暂无逆天造化）'}</div>
          <div class="companion-preview-sub">${hdDisp ? hdDisp.desc : '通天机缘，可遇不可求'}</div>
        </div>
      </div>
      <div class="companion-preview-card">
        <div class="companion-preview-icon">🐾</div>
        <div class="companion-preview-text">
          <div class="companion-preview-title">${activePet ? activePet.name + ' (出战)' : '（暂无出战灵宠）'}</div>
          <div class="companion-preview-sub">${activePet ? `${REALMS[activePet.realm]?.name || '灵兽'} · ${activePet.lvl}重` : '随身灵宠共 ' + (S.pets?.list?.length || 0) + ' 只'}</div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   装备 (仙躯道体人形八卦阵与交互式槽位配置)
   ============================================================ */

function renderProfileEquip() {
  let html = `
    <div style="text-align:center; margin-bottom:8px;">
      <h4 style="margin:0 0 2px; font-family:var(--font-serif); color:var(--text-gold);">仙躯道体 · 装备矩阵</h4>
      <div class="small" style="color:var(--text-dim);">点击任意仙躯槽位卡片，可直接检索并装配契合宝物</div>
    </div>
  `;

  html += `<div class="paperdoll-container">`;

  html += `
    <div class="paperdoll-center-avatar">
      <div class="paperdoll-avatar-img">
        <img src="./src/assets/images/cultivator_avatar_1792114545622.jpg" alt="${S.name}" referrerPolicy="no-referrer">
      </div>
      <div style="font-family:var(--font-serif); font-size:13px; color:var(--text-gold); font-weight:700; margin-top:3px;">${S.name}</div>
      <div class="small" style="color:var(--text-dim);">战力总和: <b style="color:var(--text-bright);">${totalAtk() + totalDef()}</b></div>
    </div>
  `;

  html += `<div class="gear-matrix-doll">`;

  EQUIP_SLOTS.forEach(s => {
    const id = S.equipped[s];
    let name = "点击配置";
    let sub = SLOT_NAMES[s];
    let isEquipped = !!id;

    if (id) {
      if (s === "heavenDefying") {
        const disp = getHeavenDefyingDisplay(id);
        name = disp ? disp.name : id;
        sub = "逆天造化";
      } else if (s === "pet") {
        const p = S.pets?.list?.find(pt => pt.uid === id);
        name = p ? p.name : id;
        sub = "出战灵宠";
      } else {
        const eq = findEquipById(id);
        if (eq) {
          name = eq.name;
          const stats = [];
          if (eq.atk) stats.push(`攻+${eq.atk}`);
          if (eq.def) stats.push(`防+${eq.def}`);
          sub = stats.join(" ") || SLOT_NAMES[s];
        } else {
          name = id;
        }
      }
    }

    const icon = SLOT_ICONS[s] || "⚔️";
    html += `
      <div class="gear-slot-card ${isEquipped ? 'has-item' : ''}" onclick="openSlotSelector('${s}')" title="点击配置${SLOT_NAMES[s]}">
        <div class="gear-slot-info">
          <div class="gear-slot-icon">${icon}</div>
          <div class="gear-slot-detail">
            <div class="gear-slot-meta">${SLOT_NAMES[s]}</div>
            <div class="gear-slot-name" style="${isEquipped ? '' : 'color:var(--text-muted); font-weight:normal; font-size:12px;'}">${name}</div>
            <div class="small" style="color:var(--text-dim);">${isEquipped ? sub : '空位 (点击装配)'}</div>
          </div>
        </div>
        <span class="tag" style="font-size:10px; background:#20170d; color:var(--text-gold);">更换</span>
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}

function openSlotSelector(slotKey) {
  const currentId = S.equipped[slotKey];
  let title = `选择【${SLOT_NAMES[slotKey]}】装配`;
  let body = "";

  if (currentId) {
    let curName = currentId;
    if (slotKey === "heavenDefying") {
      const d = getHeavenDefyingDisplay(currentId);
      if (d) curName = d.name;
    } else if (slotKey === "pet") {
      const p = S.pets?.list?.find(pt => pt.uid === currentId);
      if (p) curName = `${p.name}（${REALMS[p.realm]?.name || '凡兽'}·${p.lvl}重）`;
    } else {
      const eq = findEquipById(currentId);
      if (eq) curName = eq.name;
    }
    body += `
      <div class="parchment-item-row equipped-banner" onclick="${slotKey !== 'pet' && slotKey !== 'heavenDefying' ? `showItemDetailModal('${currentId}')` : ''}">
        <div class="p-row-left">
          <div class="p-row-icon">${SLOT_ICONS[slotKey] || '⚔️'}</div>
          <span class="p-row-name tier-gold">【当前佩戴】${curName}</span>
        </div>
        <button class="small" onclick="event.stopPropagation(); unequipSlotAndClose('${slotKey}')">卸下</button>
      </div>
    `;
  }

  body += `<div class="small" style="margin:8px 0 6px; color:var(--text-gold);">点击物品名字查看详情，或直接装配：</div>`;
  let candidatesCount = 0;
  let candidatesHtml = `<div class="parchment-list-wrap">`;

  if (slotKey === "heavenDefying") {
    Object.keys(S.heavenDefying.owned || {}).forEach(id => {
      if (!S.heavenDefying.owned[id]) return;
      candidatesCount++;
      const disp = getHeavenDefyingDisplay(id);
      if (!disp) return;
      candidatesHtml += `
        <div class="parchment-item-row" onclick="selectAndEquip('${slotKey}', '${id}', 'heaven')">
          <div class="p-row-left">
            <div class="p-row-icon">☯️</div>
            <span class="p-row-name tier-gold">${disp.name}</span>
          </div>
          <span class="p-row-count">点击装配</span>
        </div>
      `;
    });
  } else if (slotKey === "pet") {
    (S.pets?.list || []).forEach(pet => {
      if (pet.uid === S.equipped.pet) return;
      candidatesCount++;
      const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡兽";
      candidatesHtml += `
        <div class="parchment-item-row" onclick="selectAndEquip('${slotKey}', '${pet.uid}', 'pet')">
          <div class="p-row-left">
            <div class="p-row-icon">🐾</div>
            <span class="p-row-name tier-purple">${pet.name}（${realmText}·${pet.lvl}重）</span>
          </div>
          <span class="p-row-count">点击出战</span>
        </div>
      `;
    });
  } else {
    let targetType = "equip";
    let targetSlotFilter = null;
    if (slotKey.startsWith("artifact")) {
      targetType = "artifact";
    } else if (slotKey.startsWith("accessory")) {
      targetSlotFilter = "accessory";
    } else {
      targetSlotFilter = slotKey;
    }

    const equippedIds = Object.values(S.equipped).filter(Boolean);
    const matchingIds = [];
    ["equip", "artifact"].forEach(t => {
      const ids = getItemsByType(t);
      ids.forEach(id => {
        if (!hasItem(id) || equippedIds.includes(id)) return;
        const eq = ITEMS[id];
        if (!eq) return;

        let match = false;
        if (targetSlotFilter === "accessory") {
          if (eq.slot === "accessory") match = true;
        } else if (targetType === "artifact") {
          if (eq.type === "artifact" || eq.slot === "artifact") match = true;
        } else {
          if (eq.slot === targetSlotFilter) match = true;
        }

        if (match) matchingIds.push(id);
      });
    });

    if (typeof compareItemsByTierGradeDesc === "function") {
      matchingIds.sort(compareItemsByTierGradeDesc);
    }

    matchingIds.forEach(id => {
      const eq = ITEMS[id];
      if (!eq) return;
      candidatesCount++;
      const tierCls = getItemTierColorClass(eq);
      const tg = typeof getItemTierAndGrade === "function" ? getItemTierAndGrade(eq, id) : { badge: `${eq.tier || 1}阶·${eq.grade || 1}品` };
      candidatesHtml += `
        <div class="parchment-item-row" onclick="showItemDetailModal('${id}')" title="点击查看【${eq.name}】详情">
          <div class="p-row-left">
            <div class="p-row-icon">${typeof getItemIcon === 'function' ? getItemIcon(eq, id) : (eq.slot === 'body' ? '🥋' : '⚔️')}</div>
            <span class="p-row-name ${tierCls}">${eq.name}</span>
            <span class="p-row-badge">${tg.badge}</span>
          </div>
          <button class="small" onclick="event.stopPropagation(); selectAndEquip('${slotKey}', '${id}', 'normal')">装配</button>
        </div>
      `;
    });
  }

  candidatesHtml += `</div>`;

  if (candidatesCount === 0) {
    body += `<p class="empty">行囊中暂无可装配至此处的宝物。</p>`;
  } else {
    body += candidatesHtml;
  }

  showModal(title, body, [
    { label: "关闭", fn: () => closeModal() }
  ]);
}

function unequipSlotAndClose(slotKey) {
  if (slotKey === "pet") {
    unequipPet();
  } else {
    unequip(slotKey);
  }
  closeModal();
  renderProfile();
}

function selectAndEquip(slotKey, itemId, type) {
  if (type === "heaven") {
    equipHeavenDefying(itemId);
  } else if (type === "pet") {
    equipPet(itemId);
  } else {
    S.equipped[slotKey] = itemId;
    const item = ITEMS[itemId];
    log(`装配 ${item ? item.name : itemId} 到 ${SLOT_NAMES[slotKey] || slotKey}。`, "c-good");
    save();
  }
  closeModal();
  renderProfile();
  render();
}

function findFreeSlot(item) {
  const accept = SLOT_ACCEPT[item.slot] || [item.slot];
  for (const s of accept) {
    if (!S.equipped[s]) return s;
  }
  return accept[0];
}

function autoEquip(itemId) {
  if (!hasItem(itemId)) { log("没有这件装备", "c-bad"); return; }
  const item = ITEMS[itemId];
  if (!item) return;
  const slot = findFreeSlot(item);
  S.equipped[slot] = itemId;
  log(`装配 ${item.name} 到 ${SLOT_NAMES[slot] || slot}。`, "c-good");
  save(); renderProfile(); render();
}

function unequip(slot) {
  S.equipped[slot] = null;
  save(); renderProfile(); render();
}

/* ============================================================
   主渲染 (可滑动图文标签)
   ============================================================ */

function renderProfile() {
  if (!S) return;

  const profileTabMeta = {
    "角色信息": { label: "道体" },
    "心法":     { label: "心法" },
    "法术":     { label: "法术" },
    "命格":     { label: "命格" },
    "装备":     { label: "装备" },
    "背包":     { label: "背包" },
    "杂务":     { label: "百艺" },
    "爱好":     { label: "雅趣" },
  };

  const tabsHtml = `
    <div class="fs-rect-tabs">
      ${PROFILE_TABS.map(t => {
        const m = profileTabMeta[t] || { label: t };
        return `<button type="button" class="fs-rect-tab ${currentProfileTab === t ? 'active' : ''}" onclick="switchProfileTab('${t}')">${m.label}</button>`;
      }).join("")}
    </div>
  `;

  let bodyHtml = "";
  if (currentProfileTab === "角色信息") bodyHtml = renderProfileInfo();
  else if (currentProfileTab === "心法") bodyHtml = renderProfileHeart();
  else if (currentProfileTab === "法术") bodyHtml = renderProfileSpells();
  else if (currentProfileTab === "命格") bodyHtml = renderProfileDestiny();
  else if (currentProfileTab === "装备") bodyHtml = renderProfileEquip();
  else if (currentProfileTab === "背包") bodyHtml = renderProfileBag();
  else if (currentProfileTab === "杂务") bodyHtml = renderProfileChores();
  else if (currentProfileTab === "爱好") bodyHtml = renderProfileHobbies();
  else bodyHtml = renderProfileInfo();

  let centerBtn = "";
  if (currentProfileTab === "装备") {
    centerBtn = `<button type="button" class="fs-bottom-action-btn" onclick="autoEquipBest(); renderProfile();">一键择优装备</button>`;
  } else if (currentProfileTab === "心法") {
    centerBtn = `<button type="button" class="fs-bottom-action-btn" onclick="closeProfile(); gotoCultivate();">打坐吐纳</button>`;
  }

  const html = `
    <div class="fs-detail-page" style="overflow-y: auto; height: 100vh;">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, "道体详览") : tabsHtml}
      <div class="fs-detail-scroll-body profile-content" style="overflow-y: auto; height: 100vh;">
        ${bodyHtml}
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("closeProfile()", centerBtn) : ""}
    </div>
  `;

  document.getElementById("profileBox").innerHTML = html;
}

function renderProfileDestiny() {
  const aptObj = (typeof APTITUDES !== "undefined" && APTITUDES.find(a => a.id === S.aptitude)) || (typeof APTITUDES !== "undefined" ? APTITUDES[0] : null);
  const rootRows = ROOT_TYPES.map(r => {
    const v = S.roots ? (S.roots[r.id] || 0) : 0;
    const revealed = debugShowRoot || (S.flags && S.flags.rootRevealed);
    return `
      <div class="parchment-item-row">
        <div class="p-row-left">
          <div class="p-row-icon">☯</div>
          <span class="p-row-name tier-gold">${r.name}属性先天灵根</span>
        </div>
        <span class="p-row-count">${revealed ? `${v} 品` : '暗藏玄机'}</span>
      </div>
    `;
  }).join("");

  const hdList = Object.keys(S.heavenDefying?.owned || {}).filter(k => S.heavenDefying.owned[k]);
  const hdHtml = hdList.length > 0
    ? hdList.map(id => {
        const d = getHeavenDefyingDisplay(id);
        const eq = S.equipped.heavenDefying === id;
        return `
          <div class="parchment-item-row" onclick="selectAndEquip('heavenDefying', '${id}', 'heaven'); renderProfile();">
            <div class="p-row-left">
              <div class="p-row-icon">☯️</div>
              <span class="p-row-name tier-gold">${d ? d.name : id}</span>
              ${eq ? '<span class="p-row-badge">佩戴中</span>' : ''}
            </div>
            <button type="button" class="fs-card-buy-btn" onclick="event.stopPropagation(); selectAndEquip('heavenDefying', '${id}', 'heaven'); renderProfile();">
              ${eq ? '已装配' : '装配'}
            </button>
          </div>
        `;
      }).join("")
    : `<p class="empty">尚无逆天造化宝物，可在天机秘境或红尘奇遇中寻获。</p>`;

  return `
    <h4>先天气运与根骨</h4>
    <div class="card">
      <div class="row"><span>根骨资质</span><b>${aptObj ? `${aptObj.name}（上限 ${REALMS[aptObj.maxRealm].name}）` : '凡胎'}</b></div>
      <div class="row"><span>命格称号</span><b>${(S.flags && S.flags.destinyTitle) || '凡胎问道'}</b></div>
      <div class="row"><span>天命气运</span><b>${S.luck}</b></div>
      <div class="row"><span>道心善恶</span><b>${moralityLabel(S.morality)} (${S.morality >= 0 ? '+' : ''}${S.morality})</b></div>
    </div>
    <h4>先天五行灵根</h4>
    <div class="parchment-list-wrap">${rootRows}</div>
    <h4>逆天造化至宝</h4>
    <div class="parchment-list-wrap">${hdHtml}</div>
    <h4>随身伴生灵兽</h4>
    ${renderPetsList()}
  `;
}

/* ============================================================
   使用道具（按 effect 分派）
   ============================================================ */
function useItem(name) {
  if (!hasItem(name)) return;
  let item = (typeof getItem === "function" ? getItem(name) : null) || ITEMS[name];
  if (!item && typeof getOrCreatePillItem === "function") {
    const m = name.match(/^(.*?)_(\d+)品$/);
    if (m) item = getOrCreatePillItem(m[1], parseInt(m[2], 10));
  }
  if (!item) return;

  /* 自动修复可能缺失 effect 属性的丹药 */
  const isPillType = item.type === "pill" || item.type === "pillTemplate";
  if (isPillType && (!item.effect || !item.effect.type)) {
    const tier = item.tier || 1;
    const grade = item.grade !== undefined ? item.grade : 1;
    const gradePct = [0, 0.2, 0.4, 0.6, 0.8, 1.0][grade] || 0.4;
    const n = item.name || name;
    if (n.includes("回春") || n.includes("回血") || n.includes("淬体")) {
      item.effect = { type: "heal", value: Math.round(200 * tier * gradePct) };
    } else if (n.includes("回元") || n.includes("回灵") || n.includes("凝神")) {
      item.effect = { type: "healMp", value: Math.round(200 * tier * gradePct) };
    } else if (n.includes("聚气") || n.includes("聚灵") || n.includes("聚凝")) {
      item.effect = { type: "exp", value: Math.round(100 * tier * gradePct) };
    } else if (n.includes("筑基") || n.includes("降尘") || n.includes("破境")) {
      item.effect = { type: "breakBonus", value: +(0.2 * gradePct).toFixed(2) };
    } else if (n.includes("辟谷")) {
      item.effect = { type: "fasting", days: Math.round(30 * gradePct) };
    } else if (n.includes("洗髓")) {
      item.effect = { type: "root", value: 1 };
    }
  }

  if (!isPillType || !item.effect || !item.effect.type) {
    log(`【${item.name || name}】效果尚未实现。`, "c-bad");
    return;
  }

  /* 0 品废丹不能吃 */
  if (item.grade === 0) {
    log("废丹丹毒淤积，无法服用，只能售于药铺回收。", "c-bad");
    return;
  }

  if (item.usableIn === "battle") {
    log(`【${item.name}】只能在战斗中使用。`, "c-bad");
    return;
  }

  /* 境界检查 */
  const pInfo = getPlayerRealmInfo();
  if (item.tier && item.tier > pInfo.realm + 1) {
    log(`境界不足，无法服用【${item.name}】（需 ${item.tier} 阶）`, "c-bad");
    return;
  }

  /* 丹毒衰减（5 品跳过） */
  const isGrade5 = item.grade === 5;
  const danDuMul = isGrade5 ? 1.0 : (1 - S.poison / 100 * 0.5);

  const e = item.effect;
  const detail = [];
  let consumed = false;

  switch (e.type) {
    case "heal": {
      const baseV = e.value;
      const finalV = Math.floor(baseV * danDuMul);
      if (S.hp >= totalMaxHp()) { log("气血已满。", "c-bad"); return; }
      S.hp = Math.min(totalMaxHp(), S.hp + finalV);
      detail.push(`气血 +${finalV}${danDuMul < 1 ? `（丹毒衰减 ×${danDuMul.toFixed(2)}）` : ""}`);
      consumed = true;
      break;
    }
    case "healMp": {
      const baseV = e.value;
      const finalV = Math.floor(baseV * danDuMul);
      if (S.mp >= totalMaxMp()) { log("灵力已满。", "c-bad"); return; }
      S.mp = Math.min(totalMaxMp(), S.mp + finalV);
      detail.push(`灵力 +${finalV}${danDuMul < 1 ? `（丹毒衰减 ×${danDuMul.toFixed(2)}）` : ""}`);
      consumed = true;
      break;
    }
    case "cure": {
      const had = S.statuses.some(s => s.id === e.status);
      if (!had) { log("没有该状态。", "c-bad"); return; }
      S.statuses = S.statuses.filter(s => s.id !== e.status);
      detail.push(`解除【${getStatusDef(e.status).name}】`);
      consumed = true;
      break;
    }
    case "cureAllNonDot": {
      const before = S.statuses.length;
      S.statuses = S.statuses.filter(s => {
        const def = getStatusDef(s.id);
        return def && def.type === "buff" || (def && def.dot);
      });
      detail.push(`解除 ${before - S.statuses.length} 个非 dot 负面`);
      consumed = true;
      break;
    }
    case "exp": {
      if (item.dailyLimit) {
        if (!S.flags.pillDaily) S.flags.pillDaily = {};
        const key = `${item.baseId}_${S.day}`;
        const used = S.flags.pillDaily[key] || 0;
        if (used >= item.dailyLimit) {
          log(`【${item.name}】今日已达上限（${item.dailyLimit} 粒）。`, "c-bad");
          return;
        }
        S.flags.pillDaily[key] = used + 1;
      }
      const finalV = Math.floor(e.value * danDuMul);
      S.exp += finalV;
      detail.push(`修为 +${fmt(finalV)}${danDuMul < 1 ? `（丹毒衰减 ×${danDuMul.toFixed(2)}）` : ""}`);
      consumed = true;
      break;
    }
    case "breakBonus": {
      if (!S.flags.pillBuff) S.flags.pillBuff = {};
      const finalV = e.value * danDuMul;
      S.flags.pillBuff.breakBonus = (S.flags.pillBuff.breakBonus || 0) + finalV;
      detail.push(`突破率 +${(finalV * 100).toFixed(0)}%（下次突破消耗）`);
      consumed = true;
      break;
    }
    case "fasting": {
      S.flags.fastingDays = (S.flags.fastingDays || 0) + Math.floor(e.days);
      detail.push(`辟谷 ${Math.floor(e.days)} 天`);
      consumed = true;
      break;
    }
    case "reduceEncounter": {
      S.flags.reduceEncounter = e.value;
      detail.push(`减少遇敌 ${(e.value * 100).toFixed(0)}%（30 天）`);
      consumed = true;
      break;
    }
    case "petFood": {
      /* 灵兽粮，由 feedPet 处理，不走 useItem */
      log(`【${item.name}】请在灵宠界面喂食。`, "c-bad");
      return;
    }
    case "petLoyalty": {
      const petUid = S.equipped.pet;
      if (!petUid) { log("没有出战灵宠。", "c-bad"); return; }
      const pet = S.pets.list.find(p => p.uid === petUid);
      if (!pet) { log("出战灵宠不存在。", "c-bad"); return; }
      if (pet.loyalty === undefined) pet.loyalty = 50;
      pet.loyalty = Math.min(100, pet.loyalty + e.value);
      detail.push(`${pet.name} 忠诚度 +${e.value}（当前 ${pet.loyalty}）`);
      consumed = true;
      break;
    }
    case "root": {
      if (S.roots) {
        const keys = Object.keys(S.roots).filter(k => S.roots[k] > 0);
        const targetRoot = keys.length > 0 ? keys[0] : "jin";
        S.roots[targetRoot] = (S.roots[targetRoot] || 0) + (e.value || 1);
      }
      detail.push(`洗筋伐髓，灵根潜质提升 +${e.value || 1}`);
      consumed = true;
      break;
    }
    case "mood": {
      S.mood = Math.min(2, (S.mood || 0) + (e.value || 1));
      detail.push(`心境平复，心情提升`);
      consumed = true;
      break;
    }
    case "age": {
      S.maxAge = (S.maxAge || 80) + (e.value || 50);
      detail.push(`寿元上限 +${e.value || 50}`);
      consumed = true;
      break;
    }
    case "pending": {
      log(`【${item.name}】效果尚未实现。`, "c-bad");
      return;
    }
    case "special": {
      handleSpecialPill(item, e, detail);
      consumed = true;
      break;
    }
    case "petSpecial": {
      handlePetSpecialPill(item, e, detail);
      consumed = true;
      break;
    }
    default:
      log(`【${item.name}】暂未实现效果。`, "c-bad");
      return;
  }

  if (!consumed) return;

  /* 丹毒累加（5 品不积累） */
  if (!isGrade5 && item.danDu > 0) {
    S.poison = Math.min(100, (S.poison || 0) + item.danDu);
    detail.push(`丹毒 +${item.danDu.toFixed(2)}（当前 ${S.poison.toFixed(2)}/100）`);
    if (S.poison >= 100) {
      detail.push("⚠ 丹毒已满，境界永久锁定！");
    }
  }

  removeItem(name, 1);
  log(`使用 ${item.name}。`, "c-good");
  save(); renderProfile(); render();

  if (detail.length > 0) {
    showActionModal(`使用 ${item.name}`, detail);
  }
}

function handleSpecialPill(item, e, detail) {
  switch (e.key) {
    case "alchemyBuff":
      if (typeof applyAlchemyBuff === "function") {
        applyAlchemyBuff(item);
      } else {
        if (!S.flags.alchemyBuff) S.flags.alchemyBuff = {};
        S.flags.alchemyBuff.rate = Math.max(S.flags.alchemyBuff.rate || 0, e.rate || 0);
        S.flags.alchemyBuff.output = Math.max(S.flags.alchemyBuff.output || 0, e.output || 0);
      }
      detail.push(`炼丹成功率 +${(e.rate * 100).toFixed(0)}%，产出 +${e.output}`);
      break;
    case "forgeBuff":
      if (!S.flags.forgeBuff) S.flags.forgeBuff = {};
      S.flags.forgeBuff.rate = Math.max(S.flags.forgeBuff.rate || 0, e.rate || 0);
      detail.push(`炼器成功率 +${(e.rate * 100).toFixed(0)}%`);
      break;
    case "forgeProtect":
      S.flags.forgeProtect = true;
      detail.push(`炼器防炸炉（下次生效）`);
      break;
    case "cultivateBuff":
      if (!S.flags.cultivateBuff) S.flags.cultivateBuff = {};
      S.flags.cultivateBuff.mul = Math.max(S.flags.cultivateBuff.mul || 0, e.mul || 1.5);
      S.flags.cultivateBuff.days = Math.max(S.flags.cultivateBuff.days || 0, e.days || 1);
      detail.push(`修炼 ×${e.mul}，持续 ${e.days} 天`);
      break;
    case "extraAction":
      S.actionsUsed = Math.max(0, S.actionsUsed - e.value);
      detail.push(`额外行动 +${e.value}`);
      break;
    case "bloodRage":
      if (!S.flags.bloodRage) S.flags.bloodRage = {};
      S.flags.bloodRage.atkMul = e.atkMul;
      S.flags.bloodRage.days = e.days || 1;
      S.hp = Math.max(1, S.hp - Math.floor(totalMaxHp() * e.hpCost));
      detail.push(`攻击 +${(e.atkMul * 100).toFixed(0)}%，气血 -${(e.hpCost * 100).toFixed(0)}%`);
      break;
    case "lifesteal":
      S.flags.lifesteal = e.value;
      detail.push(`击杀回血 ${(e.value * 100).toFixed(0)}%`);
      break;
    case "antiDeviation":
    case "fixRoot":
    case "stabilizeJindan":
    case "youth":
    case "protectBreak":
    case "revive":
      detail.push(`（效果已生效）`);
      break;
    default:
      detail.push(`（特殊效果：${e.key}）`);
  }
}

function handlePetSpecialPill(item, e, detail) {
  const petUid = S.equipped.pet;
  if (!petUid) {
    detail.push("（没有出战灵宠，效果无效）");
    return;
  }
  const pet = S.pets.list.find(p => p.uid === petUid);
  if (!pet) {
    detail.push("（出战灵宠不存在）");
    return;
  }

  switch (e.key) {
    case "rerollTalent": {
      const old = getPetTalent(pet.talent).name;
      const t = randomPetTalent();
      pet.talent = t.id;
      detail.push(`${pet.name} 天赋重掷：${old} → ${t.name}`);
      break;
    }
    case "rerollBloodline": {
      const old = getPetBloodline(pet.bloodline).name;
      const b = pick(PET_BLOODLINES);
      pet.bloodline = b.id;
      detail.push(`${pet.name} 血脉重掷：${old} → ${b.name}`);
      break;
    }
    case "expUp":
      pet.exp += e.value;
      detail.push(`${pet.name} 修为 +${e.value}`);
      break;
    case "hungerFull":
      pet.hunger = 100;
      detail.push(`${pet.name} 饥饿回满`);
      break;
    case "hpUp":
    case "defUp":
    case "atkUp":
    case "speedUp":
      detail.push(`${pet.name} ${e.key} +${e.value}（未实装）`);
      break;
    default:
      detail.push(`（灵兽效果：${e.key}）`);
  }
}

function sellTool(id) {
  const it = ITEMS[id];
  if (!it) return;
  const price = Math.floor((it.price || 0) / 2);
  addCurrency(price);
  delete S.tools[id];
  log(`卖出 ${it.name}，获得 ${price} ${currencyName()}。`, "c-good");
  save(); renderProfile();
}

/* ============================================================
   心法
   ============================================================ */

function renderProfileHeart() {
  const art = getCurrentArt();
  const prog = art ? getArtProgress(art.id) : { lvl: 0, exp: 0, proficiency: 0 };
  const match = art ? calcArtMatch(art) : 0;
  const playerInfo = getPlayerRealmInfo();
  const isFan = playerInfo.realm === 0;
  const hb = getHeartBonus();

  let html = "";

  if (art) {
    const curLevelData = art.levels ? art.levels.find(l => l.lvl === prog.lvl) : null;
    const need = curLevelData ? curLevelData.expNeed : 100;
    const expPct = Math.min(100, Math.round(((prog.exp || 0) / (need || 1)) * 100));
    const elName = art.element ? (ROOT_TYPES.find(r => r.id === art.element)?.name || "") : "";
    const elLvl = art.element ? calcElementLvl(prog.lvl, art.maxLvl) : 0;

    html += `
      <h4>当前运转心法</h4>
      <div class="heart-featured-card">
        <div class="heart-featured-top">
          <div>
            <span class="heart-featured-title">📖 ${art.name}</span>
            <span class="tag gold">${art.type}</span>
            ${art.category ? `<span class="tag">${art.category}</span>` : ''}
            ${elName ? `<span class="tag" style="background:#2d1e0d; color:#f0cf78;">${elName}系</span>` : ''}
          </div>
          <span class="tag good">⚡ 运转中</span>
        </div>

        <div style="margin: 6px 0;">
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
            <span>${isFan ? '熟练参悟' : `心法境界: Lv.${prog.lvl} / ${art.maxLvl}`}</span>
            <span style="color:var(--text-gold);">${isFan ? prog.proficiency.toFixed(1) + '%' : `${fmt(prog.exp)} / ${fmt(need)} (${expPct}%)`}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${isFan ? prog.proficiency : expPct}%;"></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-dim); margin-top:4px;">
          <span>契合道心: <b style="color:${match >= 80 ? '#5fb865' : 'var(--text-gold)'};">${match}%</b></span>
          ${elName ? `<span>五行增益: <b style="color:var(--text-gold);">${elName} +${elLvl}</b></span>` : ''}
          <span>熟练度: <b style="color:var(--text-bright);">${prog.proficiency.toFixed(1)}%</b></span>
        </div>

        <div class="heart-bonus-strip">
          <div class="heart-bonus-item">
            <div style="color:var(--text-dim);">威力</div>
            <div class="v">×${hb.power}</div>
          </div>
          <div class="heart-bonus-item">
            <div style="color:var(--text-dim);">攻击</div>
            <div class="v">+${hb.atk}</div>
          </div>
          <div class="heart-bonus-item">
            <div style="color:var(--text-dim);">防御</div>
            <div class="v">+${hb.def}</div>
          </div>
          <div class="heart-bonus-item">
            <div style="color:var(--text-dim);">气血</div>
            <div class="v">+${hb.hp}</div>
          </div>
          <div class="heart-bonus-item">
            <div style="color:var(--text-dim);">灵力</div>
            <div class="v">+${hb.mp}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <h4>当前运转心法</h4>
      <div class="card" style="text-align:center; padding:12px;">
        <p class="empty" style="margin:0;">暂未运转心法，请在下方点击心法【运转】。</p>
      </div>
    `;
  }

  html += `<h4>五行心境属性</h4>
    <div class="element-mastery-strip">
      ${ROOT_TYPES.map(r => {
        const v = S.elementLvl ? (S.elementLvl[r.id] || 0) : 0;
        const colors = { jin: "#f0cf78", mu: "#5fb865", shui: "#5da8eb", huo: "#db4c3b", tu: "#c29153" };
        return `<div class="element-mastery-chip">
          <span class="el-name" style="color:${colors[r.id] || 'var(--text-dim)'};">${r.name}</span>
          <span class="el-val">${v}</span>
        </div>`;
      }).join("")}
    </div>`;

  html += `<h4>已学心法宝库</h4>`;
  if (!S.heartArts.learned || S.heartArts.learned.length === 0) {
    html += `<p class="empty">尚未习得任何心法，可前往宗门藏经阁或探索机缘寻觅秘籍。</p>`;
  } else {
    html += `<div class="heart-learned-grid">`;
    S.heartArts.learned.forEach(artId => {
      const a = HEART_ARTS.find(x => x.id === artId);
      if (!a) return;
      const p = getArtProgress(artId);
      const isCurrent = S.heartArts.current === artId;
      const el = a.element ? ROOT_TYPES.find(r => r.id === a.element)?.name : null;

      html += `
        <div class="heart-learned-card ${isCurrent ? 'is-active' : ''}">
          <div class="heart-learned-header">
            <span class="heart-learned-title">
              <span>${a.name}</span>
            </span>
            ${isCurrent
              ? '<span class="tag good">使用中</span>'
              : `<button class="small" onclick="switchHeartArt('${artId}')">运转</button>`}
          </div>
          <div class="heart-learned-meta">
            <span class="tag">${a.type}</span>
            ${el ? `<span class="tag" style="color:#f0cf78;">${el}</span>` : ''}
            <span>${p.lvl === 0 ? `熟练 ${p.proficiency.toFixed(0)}%` : `Lv.${p.lvl}/${a.maxLvl}`}</span>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  return html;
}

/* ============================================================
   法术（可筛选 + 紧凑图文条目，包含通玄法术与已学拳脚/兵刃招式）
   ============================================================ */

function getCombinedLearnedSpellsAndSkills() {
  const result = [];
  const seenIds = new Set();

  /* 1. 已学法术 (S.spells.learned) */
  const learnedSpells = typeof listLearnedSpells === "function" ? listLearnedSpells() : [];
  learnedSpells.forEach(sp => {
    if (!sp || seenIds.has(sp.id)) return;
    seenIds.add(sp.id);
    const check = typeof canUseSpell === "function" ? canUseSpell(sp.id) : { ok: true };
    result.push({
      id: sp.id,
      name: sp.name,
      type: sp.type || "通用",
      target: sp.target || "enemySingle",
      costText: `💧 ${sp.cost && sp.cost.mp ? sp.cost.mp : 0}`,
      power: sp.power || 1,
      desc: sp.desc || "",
      usable: check,
      isCombatSkill: false,
    });
  });

  /* 2. 开局及后续习得的拳脚/兵刃武技 (S.combatSkills.learned) */
  const starterArtTitleMap = {
    sk_fist1:  "猛虎伏山拳",
    sk_palm1:  "落花穿云掌",
    sk_leg1:   "连环旋风腿",
    sk_sword1: "青锋剑法",
    sk_blade1: "开山刀法",
    sk_staff1: "齐眉棍法",
    sk_whip1:  "灵蛇鞭法",
  };
  const learnedSkillIds = (S && S.combatSkills && Array.isArray(S.combatSkills.learned)) ? S.combatSkills.learned : [];
  learnedSkillIds.forEach(id => {
    if (!id || seenIds.has(id)) return;
    const sk = typeof getCombatSkill === "function" ? getCombatSkill(id) : null;
    if (!sk) return;
    seenIds.add(sk.id);

    let ok = true;
    let reason = "";
    if (sk.skillReq) {
      for (const k in sk.skillReq) {
        const lvl = (S.skills && S.skills[k] && S.skills[k].lvl) || 0;
        if (lvl < sk.skillReq[k]) {
          ok = false;
          reason = `${k} 需 Lv.${sk.skillReq[k]}`;
          break;
        }
      }
    }

    const hpCost = (sk.cost && sk.cost.hp) || 0;
    const costText = hpCost > 0 && hpCost < 1
      ? `❤️ ${Math.round(hpCost * 100)}%血`
      : `❤️ ${hpCost}`;
    const artTitle = starterArtTitleMap[sk.id];
    const displayName = artTitle && artTitle !== sk.name ? `${artTitle}·${sk.name}` : sk.name;

    result.push({
      id: sk.id,
      name: displayName,
      rawName: sk.name,
      type: sk.type || "通用",
      target: sk.target || "enemySingle",
      costText,
      power: sk.power || 1,
      desc: sk.desc || "",
      usable: { ok, reason },
      isCombatSkill: true,
    });
  });

  return result;
}

function renderProfileSpells() {
  let html = "";

  const spellFilters = [
    { id: "all", name: "全部" },
    { id: "jian", name: "🗡️ 剑法" },
    { id: "quan", name: "👊 拳掌" },
    { id: "dao", name: "🔪 刀棍" },
    { id: "general", name: "✨ 通用" },
    { id: "skills", name: "📜 百艺" },
  ];

  html += `<div class="filter-pills-bar">`;
  spellFilters.forEach(f => {
    html += `<button type="button" class="filter-pill ${currentSpellFilter === f.id ? 'active' : ''}" onclick="switchSpellFilter('${f.id}')">${f.name}</button>`;
  });
  html += `</div>`;

  if (currentSpellFilter !== "skills") {
    const learnedSpells = getCombinedLearnedSpellsAndSkills();
    let filteredSpells = learnedSpells;

    if (currentSpellFilter === "jian") {
      filteredSpells = learnedSpells.filter(s => s.type === "剑");
    } else if (currentSpellFilter === "quan") {
      filteredSpells = learnedSpells.filter(s => s.type === "拳" || s.type === "掌");
    } else if (currentSpellFilter === "dao") {
      filteredSpells = learnedSpells.filter(s => s.type === "刀" || s.type === "棍");
    } else if (currentSpellFilter === "general") {
      filteredSpells = learnedSpells.filter(s => s.type === "通用" || !["剑", "拳", "掌", "刀", "棍"].includes(s.type));
    }

    html += `<h4>已学通玄法术 (${filteredSpells.length})</h4>`;
    if (filteredSpells.length === 0) {
      html += `<p class="empty">此门类下暂无修习法术。</p>`;
    } else {
      filteredSpells.forEach(sp => {
        const usable = sp.usable || { ok: true };
        const icon = SPELL_ICONS[sp.type] || SKILL_ICONS[sp.type] || "✨";
        const tl = {
          enemySingle: "敌单", enemyAll: "敌全",
          allySingle: "我单", allyAll: "我全", all: "全体",
        }[sp.target || "enemySingle"] || "敌单";

        html += `
          <div class="spell-tile-compact">
            <div class="spell-tile-left">
              <div class="spell-icon-box">${icon}</div>
              <div class="spell-tile-main">
                <div class="spell-tile-top">
                  <span class="spell-name">${sp.name}</span>
                  <span class="tag">${tl}</span>
                  <span class="spell-cost-chip">${sp.costText}</span>
                  <span class="spell-power-chip">💥 ×${sp.power}</span>
                </div>
                <div class="spell-desc-line" title="${sp.desc}">${sp.desc}</div>
              </div>
            </div>
            <div style="flex-shrink:0;">
              ${usable.ok ? '<span class="tag good">可用</span>' : `<span class="tag bad">${usable.reason}</span>`}
            </div>
          </div>
        `;
      });
    }
  }

  if (currentSpellFilter === "all" || currentSpellFilter === "skills") {
    html += `<h4>百艺修道造诣</h4>`;
    html += `<div class="craft-micro-grid">`;
    SKILLS.forEach(k => {
      const sk = S.skills[k] || { lvl: 0, exp: 0 };
      const icon = SKILL_ICONS[k] || "📜";
      html += `
        <div class="craft-micro-card">
          <div class="craft-micro-header">
            <span class="craft-micro-title">
              <span>${icon}</span>
              <span>${k}</span>
            </span>
            <span class="craft-micro-lvl">Lv.${sk.lvl}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${sk.exp || 0}%;"></div>
          </div>
          <div style="font-size:10px; color:var(--text-dim); text-align:right;">${(sk.exp || 0).toFixed(1)}/100</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  return html;
}

/* ============================================================
   杂务（2列看板式微卡片）
   ============================================================ */

function renderProfileChores() {
  const all = [...CHORES_FAN, ...CHORES_MENWAI, ...CHORES_MENNEI];
  return `
    <h4>仙门劳作与杂务熟练</h4>
    <div class="chore-dashboard-grid">
      ${all.map(c => {
        const v = S.choreSkill[c.id] || 0;
        const icon = CHORE_ICONS[c.id] || "📜";
        const isMaster = v >= 80;
        const stage = v >= 100 ? "大圆满" : v >= 60 ? "精通" : v >= 30 ? "熟练" : "初涉";
        return `
          <div class="chore-dash-card ${isMaster ? 'mastered' : ''}">
            <div class="chore-dash-icon">${icon}</div>
            <div class="chore-dash-info">
              <div class="chore-dash-title-row">
                <span class="chore-dash-title">${c.name}</span>
                <span class="chore-dash-pct">${v.toFixed(1)}%</span>
              </div>
              <div class="craft-progress-track">
                <div class="craft-progress-fill" style="width:${Math.min(100, v)}%;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-dim); margin-top:2px;">
                <span>耗时 ${c.baseTime}时</span>
                <span style="color:${isMaster ? 'var(--text-gold)' : 'var(--text-dim)'};">${stage}</span>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ============================================================
   爱好
   ============================================================ */

function renderProfileHobbies() {
  if (!S.hobbies || S.hobbies.length === 0) {
    return `
      <h4>道心雅趣</h4>
      <p class="empty">尚无涉猎之闲情雅致。可在日常生活中机缘顿悟。</p>
    `;
  }

  let html = `<h4>已修雅趣（最多 3 门）</h4>`;
  S.hobbies.forEach(h => {
    const v = S.hobbySkill[h] || 0;
    const icon = HOBBY_ICONS[h] || "🍵";
    const quote = (typeof HOBBY_QUOTES !== "undefined" && HOBBY_QUOTES[h]) ? HOBBY_QUOTES[h] : "修身养性，道法自然。";

    html += `
      <div class="hobby-feature-card">
        <div class="hobby-feature-icon">${icon}</div>
        <div class="hobby-feature-body">
          <div class="hobby-feature-title-row">
            <span class="hobby-feature-name">${h}</span>
            <span class="hobby-feature-score">造诣: ${v.toFixed(1)}</span>
          </div>
          <div class="craft-progress-track">
            <div class="craft-progress-fill" style="width:${Math.min(100, v * 2)}%;"></div>
          </div>
          <div class="hobby-feature-quote">「${quote}」</div>
        </div>
      </div>
    `;
  });

  html += `<p class="small" style="color:var(--text-dim); margin-top:4px;">💡 爱好在晚餐后自发触发修习（35%几率），消耗 1 行动，能有效舒缓心绪，提升心境。</p>`;

  const unlearnedHobbies = (typeof ALL_HOBBIES !== "undefined" ? ALL_HOBBIES : []).filter(h => !S.hobbies.includes(h));
  if (unlearnedHobbies.length > 0) {
    html += `<h4>涉猎百雅</h4>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
        ${unlearnedHobbies.map(h => {
          const icon = HOBBY_ICONS[h] || "🔹";
          return `<div class="tag" style="background:#151009; border:1px solid #302416; padding:3px 8px;">${icon} ${h}</div>`;
        }).join("")}
      </div>`;
  }

  return html;
}

/* ============================================================
   背包（7 tab + 紧凑图文条目）
   ============================================================ */

function renderProfileBag() {
  const bagTabIcons = {
    "特别": "✨",
    "装备": "⚔️",
    "心法·法术": "📖",
    "秘籍": "📜",
    "丹药": "💊",
    "材料": "🌿",
    "逆天宝物": "☯️",
    "任务道具": "🏷️",
    "其他": "📦",
  };

  let html = `<div class="subtabs scrollable">`;
  BAG_TABS.forEach(t => {
    const icon = bagTabIcons[t] || "📦";
    html += `<div class="subtab ${currentBagTab === t ? 'active' : ''}" onclick="switchBagTab('${t}')">${icon} ${t}</div>`;
  });
  html += `</div>`;

  if (currentBagTab === "特别") {
    html += renderInventoryByType("special");
  }
  else if (currentBagTab === "丹药") {
    html += renderInventoryByType("pill");
    html += renderInventoryByType("petBreak", true);
    html += renderInventoryByType("food", true);
  }
  else if (currentBagTab === "材料") {
    html += renderInventoryByType("mat");
  }
  else if (currentBagTab === "装备") {
    html += renderInventoryByType("equip");
    html += renderInventoryByType("artifact", true);
  }
  else if (currentBagTab === "心法·法术" || currentBagTab === "秘籍") {
    html += renderInventoryByType("heartFragment");
    html += renderInventoryByType("spellbook", true);
    html += renderInventoryByType("skillbook", true);
    html += renderInventoryByType("summonbook", true);
  }
  else if (currentBagTab === "逆天宝物") {
    html += renderInventoryByType("heavenDefying");
  }
  else if (currentBagTab === "任务道具") {
    html += renderInventoryByType("quest");
  }
  else if (currentBagTab === "其他") {
    html += renderInventoryByType("other");
  }

  return html;
}

/* ============================================================
   ★ 补回：renderInventoryByType + renderItemActions ★
   ============================================================ */

function getItemTierColorClass(item) {
  if (!item) return "tier-green";
  const g = item.grade || item.tier || 1;
  if (item.type === "heavenDefying" || g >= 5) return "tier-gold";
  if (item.type === "artifact" || item.type === "heartFragment" || g === 4) return "tier-purple";
  if (item.type === "spellbook" || item.type === "skillbook" || g === 3) return "tier-blue";
  if (g === 0) return "tier-dim";
  return "tier-green";
}

function renderInventoryByType(type, shortTitle) {
  let ids = [];
  if (type === "pill") {
    // 包含所有 S.inventory 中是 pill 或 pillTemplate 的物品
    ids = Object.keys(S.inventory || {}).filter(id => {
      if (!id || id === "undefined" || id === "null" || S.inventory[id] <= 0) return false;
      const it = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id];
      return it && (it.type === "pill" || it.type === "pillTemplate");
    });
  } else if (type === "special") {
    // 特别道具分类：确保宗门青史策始终常驻并置顶
    if (S && S.sect && typeof ensureSectChronicleItem === "function") {
      ensureSectChronicleItem();
    }
    ids = Object.keys(S.inventory || {}).filter(id => {
      if (!id || id === "undefined" || id === "null" || S.inventory[id] <= 0) return false;
      const it = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id];
      return it && (it.type === "special" || it.pinned || id === "sect_chronicle_scroll");
    });
    // 若已拜入宗门但在背包中遗漏，直接置入列表
    if (S && S.sect && !ids.includes("sect_chronicle_scroll")) {
      ids.unshift("sect_chronicle_scroll");
    }
  } else {
    ids = getItemsByType(type).filter(id => id && id !== "undefined" && S.inventory[id] > 0);
  }

  if (ids.length === 0) return shortTitle ? "" : `<p class="empty">此分类下暂无灵物道具。</p>`;

  const typeNames = {
    special: "特别重器",
    pill: "丹药",
    petBreak: "灵宠突破丹",
    food: "兽粮",
    mat: "天材地宝",
    equip: "装备",
    artifact: "法宝",
    heartFragment: "心法残卷",
    spellbook: "法术秘籍",
    summonbook: "通灵秘籍",
    heavenDefying: "逆天宝物",
    quest: "任务信物",
    other: "杂务雅具",
  };

  let html = shortTitle ? `<div class="parchment-sec-header">${typeNames[type] || type}</div>` : "";
  html += `<div class="parchment-list-wrap">`;

  /* 置顶优先 (always on top)，其余按阶 (tier)、品 (grade) 从高到低排序 */
  const sorted = [...ids].sort((a, b) => {
    const ia = (typeof getItem === "function" ? getItem(a) : null) || ITEMS[a] || {};
    const ib = (typeof getItem === "function" ? getItem(b) : null) || ITEMS[b] || {};
    const isPinnedA = !!(ia.pinned || a === "sect_chronicle_scroll");
    const isPinnedB = !!(ib.pinned || b === "sect_chronicle_scroll");
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;

    if (typeof compareItemsByTierGradeDesc === "function") {
      return compareItemsByTierGradeDesc(a, b);
    }
    if ((ib.tier || 1) !== (ia.tier || 1)) return (ib.tier || 1) - (ia.tier || 1);
    return (ib.grade || 1) - (ia.grade || 1);
  });

  if (typeof window !== "undefined") {
    window._currentBagSortedIds = sorted;
  }

  sorted.forEach(id => {
    const item = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id] || (typeof findEquipById === "function" ? findEquipById(id) : null) || { name: id, type };
    const count = (S.inventory && S.inventory[id]) || 1;
    const icon = typeof getItemIcon === "function" ? getItemIcon(item, id) : ((ITEM_TYPE_ICONS && ITEM_TYPE_ICONS[item.type]) || "📦");
    const tierCls = getItemTierColorClass(item);
    const isEq = S.equipped && Object.values(S.equipped).includes(id);
    const isPinned = item.pinned || id === "sect_chronicle_scroll";
    const safeName = (item.name && item.name !== "undefined" && item.name !== "null") ? item.name : (id !== "undefined" ? id : "修仙灵物");
    const tg = typeof getItemTierAndGrade === "function" ? getItemTierAndGrade(item, id) : { badge: `${item.tier || 1}阶·${item.grade || 1}品` };
    const clickFn = (id === "sect_chronicle_scroll")
      ? "openSectChronicleModal()"
      : `showItemDetailModal('${id}')`;

    html += `
      <div class="parchment-item-row ${isPinned ? 'pinned-item-row' : ''}" onclick="${clickFn}" title="点击查阅【${safeName}】详情">
        <div class="p-row-left">
          <div class="p-row-icon">${icon}</div>
          <span class="p-row-name ${tierCls}">${safeName}</span>
          ${isPinned ? '<span class="p-row-badge pinned-gold">📜 宗门传世 · 置顶</span>' : `<span class="p-row-badge">${tg.badge}</span>`}
          ${isEq ? '<span class="p-row-badge">已佩</span>' : ''}
        </div>
        <span class="p-row-count">${isPinned ? '【研读】' : `x${count}`}</span>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function renderItemActions(id, item) {
  return "";
}

/* ============================================================
   灵宠列表
   ============================================================ */

function renderPetsList() {
  if (!S.pets || !S.pets.list || S.pets.list.length === 0) {
    return `<p class="empty">尚未收服灵宠，可在历练或机缘中收服伴生灵兽。</p>`;
  }

  const equippedUid = S.equipped.pet;

  return `<div class="parchment-list-wrap">` + S.pets.list.map(pet => {
    const isEquipped = pet.uid === equippedUid;
    const realmText = REALMS[pet.realm] ? REALMS[pet.realm].name : "凡兽";

    return `
      <div class="parchment-item-row" onclick="openPetDetail('${pet.uid}')">
        <div class="p-row-left">
          <div class="p-row-icon">🐾</div>
          <span class="p-row-name tier-purple">${pet.name}（${realmText}·${pet.lvl}重）</span>
          ${isEquipped ? '<span class="p-row-badge">出战</span>' : ''}
        </div>
        <span class="p-row-count">详情 ▸</span>
      </div>
    `;
  }).join("") + `</div>`;
}

/* ============================================================
   【人物】主视图 (参照上传图4：一念逍遥式水墨人物与右侧法宝槽)
   ============================================================ */

function scrollCharStageTo(pos) {
  const scroller = document.querySelector("#panelContent .char-stage-view");
  if (!scroller) return;
  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  let target = 0;
  if (pos === "mid") target = Math.round(maxScroll * 0.48);
  else if (pos === "bottom") target = maxScroll;
  scroller.scrollTo({ top: target, behavior: "smooth" });
}

function renderProfileMainPage() {
  if (!S) return "";
  const playerInfo = getPlayerRealmInfo();
  const realmText = playerInfo.realm === 0
    ? "凡胎肉体"
    : `${REALMS[playerInfo.realm].name}·${subName(playerInfo.lvl)}${playerInfo.lvl}重`;
  const sect = S.sect ? SECTS.find(x => x.id === S.sect) : null;
  const peak = S.peak && typeof PEAKS !== "undefined" ? PEAKS.find(p => p.id === S.peak) : null;
  const master = S.master && S.npcMap ? S.npcMap[S.master] : null;
  const apt = (typeof APTITUDES !== "undefined" && APTITUDES.find(a => a.id === S.aptitude)) || (typeof APTITUDES !== "undefined" ? APTITUDES[0] : { name: "凡胎", maxRealm: 1 });
  const rank = S.flags.rank || "杂务";
  const power = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : (totalAtk() * 4 + totalDef() * 5);

  const maxHp = totalMaxHp() || 1;
  const maxMp = totalMaxMp() || 1;
  const hpPct = Math.max(0, Math.min(100, (S.hp / maxHp) * 100));
  const mpPct = Math.max(0, Math.min(100, (S.mp / maxMp) * 100));

  /* 右侧 2×5 核心穿戴槽位 */
  const mainSlots = [
    { key: "rightHand", label: "主兵刃" },
    { key: "leftHand",  label: "副手盾" },
    { key: "head",      label: "发冠" },
    { key: "body",      label: "道袍" },
    { key: "shoes",     label: "步履" },
    { key: "accessory1", label: "玉佩" },
    { key: "artifact1", label: "法宝一" },
    { key: "artifact2", label: "法宝二" },
    { key: "pet",       label: "灵兽" },
    { key: "heavenDefying", label: "造化" },
  ];

  const slotsHtml = mainSlots.map(s => {
    const id = S.equipped ? S.equipped[s.key] : null;
    let itemName = s.label;
    let hasItem = false;
    let icon = SLOT_ICONS[s.key] || "⚔️";

    if (id) {
      hasItem = true;
      if (s.key === "pet") {
        const p = S.pets?.list?.find(pt => pt.uid === id);
        itemName = p ? p.name : "灵兽";
      } else if (s.key === "heavenDefying") {
        const d = typeof getHeavenDefyingDisplay === "function" ? getHeavenDefyingDisplay(id) : null;
        itemName = d ? d.name : "逆天";
      } else {
        const eq = findEquipById(id);
        itemName = eq ? eq.name : id;
      }
    }

    return `
      <div class="om-equip-cell ${hasItem ? 'equipped' : 'empty'}" onclick="openSlotSelector('${s.key}')" title="点击更换【${SLOT_NAMES[s.key] || s.label}】">
        <div class="om-equip-cell-ico">${icon}</div>
        <div class="om-equip-cell-name">${itemName}</div>
      </div>
    `;
  }).join("");

  /* 中卷：主修心法与五行灵根数据 */
  const curArt = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  const artProg = curArt ? getArtProgress(curArt.id) : { lvl: 0, exp: 0, proficiency: 0 };
  const artMatch = curArt && typeof calcArtMatch === "function" ? calcArtMatch(curArt) : 0;
  const hb = typeof getHeartBonus === "function" ? getHeartBonus() : { power: 1, atk: 0, def: 0, hp: 0, mp: 0 };
  const isFan = playerInfo.realm === 0;
  const curLevelData = curArt && curArt.levels ? curArt.levels.find(l => l.lvl === artProg.lvl) : null;
  const artNeed = curLevelData ? curLevelData.expNeed : 100;
  const artExpPct = isFan
    ? Math.min(100, Math.round(artProg.proficiency || 0))
    : Math.min(100, Math.round(((artProg.exp || 0) / (artNeed || 1)) * 100));

  const rootColors = { jin: "#f0cf78", mu: "#5fb865", shui: "#5da8eb", huo: "#db4c3b", tu: "#c29153" };
  let maxRootKey = "jin";
  let maxRootVal = -1;
  if (S.roots) {
    Object.keys(S.roots).forEach(k => {
      if (S.roots[k] > maxRootVal) {
        maxRootVal = S.roots[k];
        maxRootKey = k;
      }
    });
  }
  const rootRevealed = debugShowRoot || (S.flags && S.flags.rootRevealed);
  const rootGemsHtml = ROOT_TYPES.map(x => {
    const v = S.roots ? (S.roots[x.id] || 0) : 0;
    const isDom = x.id === maxRootKey;
    const c = rootColors[x.id] || "#d4a347";
    return `
      <div class="root-gem-chip ${isDom && rootRevealed ? 'dominant' : ''}">
        <div class="root-gem-name" style="color:${c};">${x.name}${isDom && rootRevealed ? '★' : ''}</div>
        <div class="root-gem-bar-mini">
          <div class="root-gem-bar-fill" style="width:${rootRevealed ? Math.min(100, v * 10) : 35}%; background:${c};"></div>
        </div>
        <div class="root-gem-val">${rootRevealed ? v : '玄'}</div>
      </div>
    `;
  }).join("");

  const hdDisp = S.equipped && S.equipped.heavenDefying ? getHeavenDefyingDisplay(S.equipped.heavenDefying) : null;
  const activePet = S.equipped && S.equipped.pet ? (S.pets?.list?.find(p => p.uid === S.equipped.pet)) : null;

  /* 下卷：已习法术与百艺预览 */
  const learnedSpells = typeof getCombinedLearnedSpellsAndSkills === "function"
    ? getCombinedLearnedSpellsAndSkills()
    : (typeof listLearnedSpells === "function" ? listLearnedSpells() : []);
  const topSpellsHtml = learnedSpells.length > 0
    ? learnedSpells.slice(0, 4).map(sp => {
        const icon = SPELL_ICONS[sp.type] || SKILL_ICONS[sp.type] || "✨";
        return `
          <div class="char-mini-pill-card" onclick="openProfileSubModal('法术')">
            <span class="cmp-ico">${icon}</span>
            <div class="cmp-info">
              <div class="cmp-name">${sp.name}</div>
              <div class="cmp-sub">${sp.type}系 · 威力×${sp.power}</div>
            </div>
          </div>
        `;
      }).join("")
    : `<div class="empty" style="padding:0.4rem 0; grid-column: 1 / -1;">尚未修习通玄法术，可前往藏经阁参悟</div>`;

  const resistBadgesHtml = Object.keys(RESIST_MAP).map(k => {
    const meta = RESIST_MAP[k];
    const val = (S.resistances && S.resistances[k]) || 0;
    const cls = val >= 100 ? "immune" : val > 0 ? "high" : "low";
    return `
      <div class="resist-badge ${cls}">
        <span>${meta.icon}</span>
        <span>${meta.name}</span>
        <b>${val > 0 ? '+' + val : '0'}</b>
      </div>
    `;
  }).join("");

  return `
    <div class="char-vertical-viewport">
      <div class="ink-scroll-roller top"></div>

      <div class="char-stage-view scrollable-portrait" style="overflow-y: auto; height: 100vh;">
        <!-- ================= 上卷：仙躯法相与四象总纲 ================= -->
        <div class="char-top-banner">
          <div class="char-title-block">
            <div class="char-sect-badge">${sect ? sect.name : '散修'} · ${rank}</div>
            <div class="char-name-line">
              <span class="char-main-name">${S.name}</span>
              <span class="char-realm-pill">${realmText}</span>
            </div>
          </div>
          <div class="char-power-seal" onclick="openProfileSubModal('角色信息')" title="点击查看八维属性详情">
            <span class="taiji-spin">☯</span>
            <div class="power-text-col">
              <span class="power-lbl">战力</span>
              <span class="power-num">${fmt(power)}</span>
            </div>
          </div>
        </div>

        <!-- 中部主舞台：左侧修士法相立绘 + 右侧随身法宝披挂 -->
        <div class="char-middle-stage">
          <div class="char-stage-bg">
            <img src="./src/assets/images/xianxia_bg_banner_1792114543496.jpg" alt="仙山背景" referrerPolicy="no-referrer">
            <div class="char-stage-mist"></div>
          </div>

          <!-- 左侧：修士法相立绘 -->
          <div class="char-center-figure" onclick="gotoCultivate()" title="点击进入打坐修炼">
            <div class="char-aura-ring"></div>
            <div class="char-portrait-frame">
              <img src="./src/assets/images/cultivator_avatar_1792114545622.jpg" alt="${S.name}" referrerPolicy="no-referrer">
            </div>
            <div class="char-figure-caption">寿元 ${Math.floor(S.life)}/${Math.floor(S.lifeMax)} 载<br>道心 ${moralityLabel(S.morality)}</div>
          </div>

          <!-- 右侧：随身法宝装备阁 -->
          <div class="char-right-equips">
            <div class="char-wing-title">⚔️ 随身法器披挂</div>
            <div class="om-equip-grid">
              ${slotsHtml}
            </div>
            <button type="button" class="om-auto-equip-btn" onclick="autoEquipBest()">✨ 一键择优装备</button>
          </div>
        </div>

        <!-- 气血、真元、属性详情与紧随其下一行的【术·命·艺·功】四象行 -->
        <div class="char-bottom-stats-panel">
          <div class="char-vitals-bars">
            <div class="char-vital-row">
              <span class="v-lbl">气血</span>
              <div class="v-track">
                <div class="v-fill hp" style="width:${hpPct}%"></div>
                <span class="v-num">${Math.floor(S.hp)} / ${maxHp}</span>
              </div>
            </div>
            <div class="char-vital-row">
              <span class="v-lbl">真元</span>
              <div class="v-track">
                <div class="v-fill mp" style="width:${mpPct}%"></div>
                <span class="v-num">${Math.floor(S.mp)} / ${maxMp}</span>
              </div>
            </div>
          </div>

          <div class="char-core-quad">
            <div class="quad-item"><span>攻击</span><b>${totalAtk()}</b></div>
            <div class="quad-item"><span>防御</span><b>${totalDef()}</b></div>
            <div class="quad-item"><span>身法</span><b>${totalSpeed()}</b></div>
            <div class="quad-item"><span>会心</span><b>${(getCritRate() * 100).toFixed(0)}%</b></div>
            <button type="button" class="quad-detail-btn" onclick="openProfileSubModal('角色信息')">属性详情 ▸</button>
          </div>

          <!-- 属性详情下一行：术、命、艺、功 紧凑四象行 -->
          ${renderCompactDaoQuadRow(false)}
        </div>

        <!-- 纵向卷轴下滑导览提示条 -->
        <button type="button" class="char-vscroll-cue" onclick="scrollCharStageTo('mid')">
          <span>⬇ 上下滑动立轴长卷 · 纵览心法灵根与道统身世 ⬇</span>
        </button>

        <!-- ================= 中卷：主修心法与五行灵根 ================= -->
        <div class="char-vscroll-section">
          <div class="char-vsec-header">
            <span class="char-vsec-title">📖 主修心法与周天运转</span>
            <button type="button" class="char-vsec-more" onclick="openProfileSubModal('心法')">心法详览 ▸</button>
          </div>

          ${curArt ? `
            <div class="char-art-scroll-card" onclick="openProfileSubModal('心法')">
              <div class="casc-top">
                <div>
                  <span class="casc-name">${curArt.name}</span>
                  <span class="tag gold">${curArt.type}</span>
                </div>
                <span class="tag good">⚡ 运转中 · 契合 ${artMatch}%</span>
              </div>
              <div class="casc-prog-row">
                <span>${isFan ? `熟练度 ${artProg.proficiency.toFixed(1)}%` : `第 ${artProg.lvl}/${curArt.maxLvl} 重`}</span>
                <span style="color:var(--text-gold);">${isFan ? '满百可破境' : `${fmt(artProg.exp || 0)} / ${fmt(artNeed)} (${artExpPct}%)`}</span>
              </div>
              <div class="craft-progress-track">
                <div class="craft-progress-fill" style="width:${artExpPct}%;"></div>
              </div>
              <div class="heart-bonus-strip">
                <div class="heart-bonus-item"><div>威力</div><div class="v">×${hb.power}</div></div>
                <div class="heart-bonus-item"><div>攻击</div><div class="v">+${hb.atk}</div></div>
                <div class="heart-bonus-item"><div>防御</div><div class="v">+${hb.def}</div></div>
                <div class="heart-bonus-item"><div>气血</div><div class="v">+${hb.hp}</div></div>
                <div class="heart-bonus-item"><div>灵力</div><div class="v">+${hb.mp}</div></div>
              </div>
            </div>
          ` : `
            <div class="char-art-scroll-card empty-art" onclick="openProfileSubModal('心法')">
              <span>暂未运转主修心法 · 点击前往【心法】装配运转</span>
            </div>
          `}

          <div class="char-vsec-header" style="margin-top:0.35rem;">
            <span class="char-vsec-title">🌟 先天五行灵根与随身造化</span>
            <button type="button" class="char-vsec-more" onclick="openZaohuaModal()">命格造化 ▸</button>
          </div>

          <div class="root-gems-bar" style="margin:0.15rem 0 0.35rem;">
            ${rootGemsHtml}
          </div>

          <div class="companion-preview-grid" style="margin:0;">
            <div class="companion-preview-card" onclick="openSlotSelector('heavenDefying')" style="cursor:pointer;">
              <div class="companion-preview-icon">☯️</div>
              <div class="companion-preview-text">
                <div class="companion-preview-title">${hdDisp ? hdDisp.name : '暂无逆天造化'}</div>
                <div class="companion-preview-sub">${hdDisp ? hdDisp.desc : '点击配置随身逆天造化宝物'}</div>
              </div>
            </div>
            <div class="companion-preview-card" onclick="openSlotSelector('pet')" style="cursor:pointer;">
              <div class="companion-preview-icon">🐾</div>
              <div class="companion-preview-text">
                <div class="companion-preview-title">${activePet ? `${activePet.name} (出战)` : '暂无出战灵宠'}</div>
                <div class="companion-preview-sub">${activePet ? `${REALMS[activePet.realm]?.name || '灵兽'} · ${activePet.lvl}重` : `伴生灵兽共 ${S.pets?.list?.length || 0} 只 · 点击配置`}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= 下卷：仙门道统、法术神通与异象抗性 ================= -->
        <div class="char-vscroll-section">
          <div class="char-vsec-header">
            <span class="char-vsec-title">🏔️ 仙门道统与身世命数</span>
            <button type="button" class="char-vsec-more" onclick="openProfileSubModal('角色信息')">完整档案 ▸</button>
          </div>

          <div class="dao-meta-grid" style="margin:0.15rem 0 0.35rem;">
            <div class="dao-meta-item">
              <span class="lbl">🏔️ 宗门峰脉</span>
              <span class="val">${sect ? sect.name + '·' + (peak ? peak.name : '主峰') : '散修无派'}</span>
            </div>
            <div class="dao-meta-item">
              <span class="lbl">🥋 传道恩师</span>
              <span class="val">${master ? master.name : '尚无明师'}</span>
            </div>
            <div class="dao-meta-item">
              <span class="lbl">🌟 根骨资质</span>
              <span class="val">${apt.name} (限${REALMS[apt.maxRealm]?.name || '仙'})</span>
            </div>
            <div class="dao-meta-item">
              <span class="lbl">🍀 天命气运</span>
              <span class="val">${S.luck} 点</span>
            </div>
            <div class="dao-meta-item">
              <span class="lbl">📅 生辰干支</span>
              <span class="val">${LUNAR_MONTHS[(S.birthday?.month || 1) - 1]}${S.birthday?.day || 1}日</span>
            </div>
            <div class="dao-meta-item">
              <span class="lbl">☠️ 体内丹毒</span>
              <span class="val">${(S.poison || 0).toFixed(1)} / 100</span>
            </div>
          </div>

          <div class="char-vsec-header">
            <span class="char-vsec-title">🗡️ 已修通玄法术 (${learnedSpells.length}门)</span>
            <button type="button" class="char-vsec-more" onclick="openProfileSubModal('法术')">全部法术 ▸</button>
          </div>
          <div class="char-mini-pill-grid">
            ${topSpellsHtml}
          </div>

          <div class="char-vsec-header" style="margin-top:0.35rem;">
            <span class="char-vsec-title">🛡️ 仙躯异象抗性</span>
          </div>
          <div class="resist-badge-cluster" style="margin:0.15rem 0 0.35rem;">
            ${resistBadgesHtml}
          </div>

          <button type="button" class="char-vscroll-top-btn" onclick="scrollCharStageTo('top')">
            ▲ 卷轴归位 · 回到顶部仙躯法相
          </button>
        </div>
      </div>

      <div class="ink-scroll-roller bottom"></div>
    </div>
  `;
}

function renderCompactDaoQuadRow(inModal) {
  if (!S) return "";
  const spellCount = typeof getCombinedLearnedSpellsAndSkills === "function"
    ? getCombinedLearnedSpellsAndSkills().length
    : (typeof listLearnedSpells === "function" ? listLearnedSpells().length : 0);
  const aptObj = (typeof APTITUDES !== "undefined" && APTITUDES.find(a => a.id === S.aptitude)) || (typeof APTITUDES !== "undefined" ? APTITUDES[0] : null);
  const aptLabel = aptObj ? aptObj.name : (S.flags?.destinyTitle || "凡胎问道");

  let maxSkillLvl = 0;
  let topSkillName = "";
  if (typeof SKILLS !== "undefined" && S.skills) {
    SKILLS.forEach(k => {
      const lv = S.skills[k]?.lvl || 0;
      if (lv > maxSkillLvl) {
        maxSkillLvl = lv;
        topSkillName = k;
      }
    });
  }
  const craftSub = maxSkillLvl > 0 ? `${topSkillName} Lv.${maxSkillLvl}` : "百艺杂务";

  const curArt = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  const artSub = curArt ? curArt.name : "暂未运转";

  return `
    <div class="char-dao-seal-row ${inModal ? 'in-detail-modal' : ''}">
      <button type="button" class="char-dao-row-btn seal-shu" onclick="openProfileSubModal('法术')" title="查看法术神通">
        <span class="char-dao-seal-circle">术</span>
        <div class="char-dao-seal-meta">
          <span class="char-dao-seal-label">法术神通</span>
          <span class="char-dao-seal-sub">已修 ${spellCount} 门</span>
        </div>
      </button>
      <button type="button" class="char-dao-row-btn seal-ming" onclick="openZaohuaModal()" title="查看先天命格与造化">
        <span class="char-dao-seal-circle">命</span>
        <div class="char-dao-seal-meta">
          <span class="char-dao-seal-label">先天命格</span>
          <span class="char-dao-seal-sub">${aptLabel}</span>
        </div>
      </button>
      <button type="button" class="char-dao-row-btn seal-yi" onclick="openProfileSubModal('杂务')" title="查看修真百艺与杂务">
        <span class="char-dao-seal-circle">艺</span>
        <div class="char-dao-seal-meta">
          <span class="char-dao-seal-label">修真百艺</span>
          <span class="char-dao-seal-sub">${craftSub}</span>
        </div>
      </button>
      <button type="button" class="char-dao-row-btn seal-gong" onclick="openProfileSubModal('心法')" title="查看主修心法">
        <span class="char-dao-seal-circle">功</span>
        <div class="char-dao-seal-meta">
          <span class="char-dao-seal-label">主修心法</span>
          <span class="char-dao-seal-sub">${artSub}</span>
        </div>
      </button>
    </div>
  `;
}

function openProfileSubModal(tabName) {
  currentProfileTab = tabName || "角色信息";
  openProfile();
}

function openZaohuaModal() {
  openProfileSubModal("命格");
}

function autoEquipBest() {
  if (!S || !S.inventory) return;
  let equippedCount = 0;

  const scoreItem = (eq) => (eq.atk || 0) * 4 + (eq.def || 0) * 5 + (eq.hp || 0) * 0.8 + (eq.mp || 0) * 0.5 + (eq.speed || 0) * 2;
  const allCandidateIds = [...getItemsByType("equip"), ...getItemsByType("artifact")].filter(id => S.inventory[id] > 0);

  const slotChecks = [
    { slot: "rightHand", match: eq => eq.slot === "rightHand" },
    { slot: "leftHand",  match: eq => eq.slot === "leftHand" },
    { slot: "head",      match: eq => eq.slot === "head" },
    { slot: "body",      match: eq => eq.slot === "body" },
    { slot: "shoes",     match: eq => eq.slot === "shoes" },
    { slot: "accessory1", match: eq => eq.slot === "accessory" },
    { slot: "artifact1", match: eq => eq.type === "artifact" || eq.slot === "artifact" },
  ];

  slotChecks.forEach(sc => {
    const usedIds = Object.values(S.equipped).filter(Boolean);
    const curId = S.equipped[sc.slot];
    const curScore = curId && ITEMS[curId] ? scoreItem(ITEMS[curId]) : -1;

    let bestId = null;
    let bestScore = curScore;
    allCandidateIds.forEach(id => {
      if (usedIds.includes(id)) return;
      const eq = ITEMS[id];
      if (!eq || !sc.match(eq)) return;
      const s = scoreItem(eq);
      if (s > bestScore) {
        bestScore = s;
        bestId = id;
      }
    });

    if (bestId) {
      S.equipped[sc.slot] = bestId;
      equippedCount++;
    }
  });

  if (equippedCount > 0) {
    log(`【一键装备】已自动为你择优佩戴 ${equippedCount} 件随身法器！`, "c-gold");
    save(); render();
  } else {
    log("当前已佩戴行囊中最优法器装备。", "c-normal");
  }
}

/* ============================================================
   【行囊】主视图 (删除“全部”，按阶·品从高到低排序，支持左右滑动切换分类页)
   ============================================================ */

const BAG_CATEGORY_FILTERS = [
  { id: "special", label: "特别" },
  { id: "equip",   label: "装备" },
  { id: "arts",    label: "心法·法术" },
  { id: "pill",    label: "丹药" },
  { id: "mat",     label: "材料" },
];

function switchBagFilter(f) {
  currentBagFilter = f;
  render();
}

/* 左右滑动或点击切换下一个/上一个行囊分类页面 */
function swipeBagCategory(offset) {
  const validIds = BAG_CATEGORY_FILTERS.map(f => f.id);
  let curIdx = validIds.indexOf(currentBagFilter);
  if (curIdx === -1) curIdx = 0;
  const nextIdx = (curIdx + offset + validIds.length) % validIds.length;
  currentBagFilter = validIds[nextIdx];
  render();
}

/* 为行囊页面绑定左右滑动手势（支持触屏 touch 与鼠标拖拽 swipe 切换到相邻分类页） */
function bindBagPageSwipeGesture() {
  if (typeof document === "undefined") return;
  const bagEl = document.querySelector("#panelContent .om-bag-parchment");
  if (!bagEl || bagEl._bagSwipeBound) return;
  bagEl._bagSwipeBound = true;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  bagEl.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  bagEl.addEventListener("touchend", (e) => {
    if (!tracking || !e.changedTouches || e.changedTouches.length === 0) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx < 0) swipeBagCategory(1);
      else swipeBagCategory(-1);
    }
  }, { passive: true });

  bagEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });

  bagEl.addEventListener("mouseup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx < 0) swipeBagCategory(1);
      else swipeBagCategory(-1);
    }
  });
}

function renderBagArtsLearnedSection() {
  if (!S) return "";
  let html = "";

  /* 1. 已习得心法（按境界从高到低排序） */
  const learnedArtIds = (S.heartArts && Array.isArray(S.heartArts.learned)) ? S.heartArts.learned.slice() : [];
  const learnedArts = learnedArtIds
    .map(id => (typeof HEART_ARTS !== "undefined" ? HEART_ARTS.find(a => a.id === id) : null))
    .filter(Boolean)
    .sort((a, b) => (b.realm || 1) - (a.realm || 1));

  if (learnedArts.length > 0) {
    html += `<div class="parchment-sec-header">已修心法 (${learnedArts.length})</div>`;
    html += `<div class="parchment-list-wrap">`;
    learnedArts.forEach(art => {
      const prog = getArtProgress(art.id);
      const isCur = S.heartArts && S.heartArts.current === art.id;
      const tierNum = art.realm || 1;
      const gradeNum = Math.max(1, tierNum * 2 - 1);
      const tierCls = tierNum >= 3 ? "tier-gold" : tierNum === 2 ? "tier-purple" : "tier-blue";
      const progTxt = prog.lvl === 0 ? `熟练 ${prog.proficiency.toFixed(0)}%` : `Lv.${prog.lvl}/${art.maxLvl}`;
      html += `
        <div class="parchment-item-row" onclick="openProfileSubModal('心法')" title="点击查看《${art.name}》心法详情">
          <div class="p-row-left">
            <div class="p-row-icon">📜</div>
            <span class="p-row-name ${tierCls}">《${art.name}》</span>
            <span class="p-row-badge">${tierNum}阶·${gradeNum}品</span>
            ${isCur ? '<span class="p-row-badge">运转中</span>' : ''}
          </div>
          <span class="p-row-count">${progTxt} ▸</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  /* 2. 已习得法术与武道神通 */
  const learnedSpells = typeof getCombinedLearnedSpellsAndSkills === "function"
    ? getCombinedLearnedSpellsAndSkills()
    : (typeof listLearnedSpells === "function" ? listLearnedSpells() : []);
  if (learnedSpells.length > 0) {
    html += `<div class="parchment-sec-header">已学通玄法术 (${learnedSpells.length})</div>`;
    html += `<div class="parchment-list-wrap">`;
    learnedSpells.forEach(sp => {
      const icon = SPELL_ICONS[sp.type] || SKILL_ICONS[sp.type] || "✨";
      const tierNum = sp.power >= 2.5 ? 3 : sp.power >= 1.7 ? 2 : 1;
      const gradeNum = sp.power >= 2.5 ? 5 : sp.power >= 1.7 ? 3 : 1;
      const tierCls = tierNum >= 3 ? "tier-gold" : tierNum === 2 ? "tier-purple" : "tier-blue";
      html += `
        <div class="parchment-item-row" onclick="openProfileSubModal('法术')" title="点击查看【${sp.name}】法术详情">
          <div class="p-row-left">
            <div class="p-row-icon">${icon}</div>
            <span class="p-row-name ${tierCls}">${sp.name}</span>
            <span class="p-row-badge">${tierNum}阶·${gradeNum}品·${sp.type}系</span>
          </div>
          <span class="p-row-count">威力×${sp.power} ▸</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  return html;
}

function renderBagMainPage() {
  if (!S) return "";
  const filters = BAG_CATEGORY_FILTERS;
  if (!filters.some(f => f.id === currentBagFilter)) {
    currentBagFilter = "special";
  }

  /* 拜入宗门后确保青史录在随身背包中常驻 */
  if (S && S.sect && typeof ensureSectChronicleItem === "function") {
    ensureSectChronicleItem();
  }

  if (S.inventory) {
    delete S.inventory["undefined"];
    delete S.inventory["null"];
    delete S.inventory[""];
  }
  if (S.tools) {
    delete S.tools["undefined"];
    delete S.tools["null"];
    delete S.tools[""];
  }

  const allInvIds = Object.keys(S.inventory || {}).filter(id => id && id !== "undefined" && id !== "null" && S.inventory[id] > 0);
  /* 合并随身工具 S.tools（若不在 inventory 中） */
  const toolIds = Object.keys(S.tools || {}).filter(id => id && id !== "undefined" && id !== "null" && S.tools[id] && !S.inventory[id]);

  const combined = [
    ...allInvIds.map(id => ({ id, count: S.inventory[id], isTool: false })),
    ...toolIds.map(id => ({ id, count: 1, isTool: true })),
  ];

  /* 拜入宗门后若 special 分类遗漏青史录，自动补入 */
  if (S && S.sect && !combined.some(e => e.id === "sect_chronicle_scroll")) {
    combined.unshift({ id: "sect_chronicle_scroll", count: 1, isTool: false });
  }

  const filtered = combined.filter(entry => {
    if (!entry.id || entry.id === "undefined" || entry.id === "null") return false;
    const item = (typeof getItem === "function" ? getItem(entry.id) : null) || ITEMS[entry.id] || (typeof findEquipById === "function" ? findEquipById(entry.id) : null) || { type: "other" };
    const t = item.type || "other";
    if (currentBagFilter === "equip") return t === "equip" || t === "artifact" || t === "heavenDefying";
    if (currentBagFilter === "arts") return ["heartFragment", "spellbook", "skillbook", "summonbook"].includes(t);
    if (currentBagFilter === "pill") return t === "pill" || t === "pillTemplate" || t === "food" || t === "petBreak";
    if (currentBagFilter === "mat") return t === "mat";
    if (currentBagFilter === "special") {
      return ["special", "quest", "other"].includes(t) || item.pinned || entry.id === "sect_chronicle_scroll";
    }
    return false;
  });

  /* 置顶优先 (always on top)，其余按【阶 (tier) 从高到低】、【品 (grade) 从高到低】排序 */
  filtered.sort((entryA, entryB) => {
    const itemA = (typeof getItem === "function" ? getItem(entryA.id) : null) || ITEMS[entryA.id] || {};
    const itemB = (typeof getItem === "function" ? getItem(entryB.id) : null) || ITEMS[entryB.id] || {};
    const isPinnedA = !!(itemA.pinned || entryA.id === "sect_chronicle_scroll");
    const isPinnedB = !!(itemB.pinned || entryB.id === "sect_chronicle_scroll");
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;

    if (typeof compareItemsByTierGradeDesc === "function") {
      return compareItemsByTierGradeDesc(entryA.id, entryB.id);
    }
    return 0;
  });

  if (typeof window !== "undefined") {
    window._currentBagSortedIds = filtered.map(e => e.id);
  }

  let rowsHtml = "";
  const extraArtsHtml = currentBagFilter === "arts" ? renderBagArtsLearnedSection() : "";

  if (filtered.length === 0 && !extraArtsHtml) {
    rowsHtml = `<div class="parchment-empty">此分类下暂无灵物（可左右滑动切换分类）</div>`;
  } else {
    if (currentBagFilter === "arts" && filtered.length > 0) {
      rowsHtml += `<div class="parchment-sec-header">行囊心法残卷与法术秘籍 (${filtered.length})</div>`;
    }
    rowsHtml += filtered.map(entry => {
      const id = entry.id;
      const item = (typeof getItem === "function" ? getItem(id) : null) || ITEMS[id] || (typeof findEquipById === "function" ? findEquipById(id) : null) || { name: id, type: "other" };
      const icon = typeof getItemIcon === "function" ? getItemIcon(item, id) : ((ITEM_TYPE_ICONS && ITEM_TYPE_ICONS[item.type]) || "📦");
      const tierCls = getItemTierColorClass(item);
      const isEquipped = S.equipped && Object.values(S.equipped).includes(id);
      const isPinned = item.pinned || id === "sect_chronicle_scroll";
      const safeName = (item.name && item.name !== "undefined" && item.name !== "null") ? item.name : (id !== "undefined" ? id : "修仙灵物");
      const tg = typeof getItemTierAndGrade === "function" ? getItemTierAndGrade(item, id) : { badge: `${item.tier || 1}阶·${item.grade || 1}品` };
      const clickFn = (id === "sect_chronicle_scroll")
        ? "openSectChronicleModal()"
        : `showItemDetailModal('${id}')`;

      return `
        <div class="parchment-item-row ${isPinned ? 'pinned-item-row' : ''}" onclick="${clickFn}" title="点击查阅【${safeName}】">
          <div class="p-row-left">
            <div class="p-row-icon">${icon}</div>
            <span class="p-row-name ${tierCls}">${safeName}</span>
            ${isPinned ? '<span class="p-row-badge pinned-gold">📜 宗门传世 · 置顶</span>' : `<span class="p-row-badge">${tg.badge}</span>`}
            ${isEquipped ? '<span class="p-row-badge">已装</span>' : ''}
          </div>
          <span class="p-row-count">${isPinned ? '【研读】' : `x${entry.count}`}</span>
        </div>
      `;
    }).join("");
    if (extraArtsHtml) {
      rowsHtml += extraArtsHtml;
    }
  }

  const curFilterIdx = filters.findIndex(f => f.id === currentBagFilter);
  const prevFilter = filters[(curFilterIdx - 1 + filters.length) % filters.length];
  const nextFilter = filters[(curFilterIdx + 1) % filters.length];

  return `
    <div class="om-bag-parchment">
      <div class="om-bag-tabs">
        ${filters.map(f => `
          <button type="button" class="om-bag-tab ${currentBagFilter === f.id ? 'active' : ''}" onclick="switchBagFilter('${f.id}')">
            ${f.label}
          </button>
        `).join("")}
      </div>

      <div class="om-bag-hint" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <button type="button" class="small" style="padding:1px 7px; font-size:11px;" onclick="swipeBagCategory(-1)">◀ ${prevFilter.label}</button>
        <span>左右滑动切换页面</span>
        <button type="button" class="small" style="padding:1px 7px; font-size:11px;" onclick="swipeBagCategory(1)">${nextFilter.label} ▶</button>
      </div>

      <div class="om-bag-scroll-list">
        ${rowsHtml}
      </div>

      <div class="om-bag-footer">
        <button type="button" class="om-bag-sell-btn" onclick="openBatchSellModal()">📦 清理废丹/闲置</button>
        <span class="om-bag-capacity">当前分类 ${filtered.length} 件 · 总计 ${combined.length} / 200</span>
      </div>
    </div>
  `;
}

function openBatchSellModal() {
  const wastePills = Object.keys(S.inventory || {}).filter(id => {
    if (S.inventory[id] <= 0) return false;
    const it = ITEMS[id];
    return it && it.type === "pill" && it.grade === 0;
  });

  let totalGain = 0;
  let totalCount = 0;
  wastePills.forEach(id => {
    totalCount += S.inventory[id];
    totalGain += S.inventory[id] * 2;
  });

  showModal("📦 行囊整理 · 清理废丹", `
    <p>可在行囊中点击任意物品查看详情，自选数量并确认出售。</p>
    <p>当前行囊中共有 <b>${wastePills.length}</b> 种（共 <b>${totalCount}</b> 粒）废丹（0品丹药，不可服用）。</p>
  `, [
    ...(wastePills.length > 0 ? [{
      label: `回收全部废丹 (+${totalGain}铜钱)`,
      primary: true,
      fn: () => {
        showModal("⚠️ 确认卖出全部废丹", `
          <p>确认将行囊中全部 <b>${totalCount}</b> 粒废丹卖出回收，共获得 <b style="color:var(--text-gold);">${totalGain} 铜钱</b> 吗？</p>
        `, [
          {
            label: "确认卖出",
            primary: true,
            fn: () => {
              wastePills.forEach(id => { delete S.inventory[id]; });
              S.money = (S.money || 0) + totalGain;
              log(`一键清理全部废丹，回收获得 ${totalGain} 铜钱。`, "c-good");
              closeModal();
              save(); render();
            }
          },
          { label: "取消", fn: () => openBatchSellModal() }
        ]);
      }
    }] : []),
    { label: "关闭", fn: closeModal }
  ]);
}
/* ============================================================
   systems/secret-realm.js - 秘境核心逻辑
   ============================================================ */

/* ============================================================
   每月第 5 天检查 A 组秘境
   ============================================================ */
function checkMonthlySecretRealm() {
  const d = getDateInfo();
  if (d.day !== 5) return;

  /* 已有一个待进入的 A 组秘境？ */
  if (S.flags.pendingSecretRealm) return;

  /* 35% 几率自然出现 */
  if (!chance(0.35)) return;

  /* 抽一个 A 组 */
  const ev = pickSecretEventFromGroup("A");
  if (!ev) return;

  const validDays = ev.validDays || 3;
  S.flags.pendingSecretRealm = {
    id: ev.id,
    group: "A",
    appearDay: S.day,
    expireDay: S.day + validDays,
  };

  log(`【秘境】你感应到一处秘境开启：${ev.name}`, "c-gold");

  showModal("🌀 秘境开启", `
    <p>你忽然感到天地灵气一阵波动，远处霞光隐现。</p>
    <p>有一处<span class="gold">天机秘境</span>在你附近开启了：</p>
    <div class="card">
      <b>${ev.icon || "🌀"} ${ev.name}</b>
      <div class="small" style="margin-top:4px; color:var(--text-dim);">有效期 ${validDays} 天 · 建议及时前往探索</div>
    </div>
    <p class="small">可在【宗门/历练 > 秘境】或【洞府 > 秘境】前往探索。</p>
  `, [
    { label: "立即前往", primary: true, fn: () => {
      closeModal();
      enterSecretRealmById(ev.id, { fromPending: true });
    }},
    { label: "稍后探索", fn: closeModal },
  ]);
}

/* 主动寻访天机：消耗 1 行动 + 50 灵石推演 A 组秘境线索 */
function seekSecretRealm() {
  if (S.flags.pendingSecretRealm) {
    showModal("已有秘境线索", `<p>当前已有开启中的秘境线索，请先前往探索。</p>`, [
      { label: "知道了", primary: true, fn: closeModal }
    ]);
    return;
  }

  const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
  if (remain < 1) {
    showModal("行动不足", `<p>寻访天机需要消耗 <b>1</b> 点行动，本时段剩余行动不足。</p>`, [
      { label: "知道了", primary: true, fn: closeModal }
    ]);
    return;
  }

  const costStone = 50;
  if ((S.stone || 0) < costStone) {
    showModal("灵石不足", `<p>推演天机秘境需耗费 <b>${costStone} 灵石</b>布设寻灵盘，你当前灵石不足。</p>`, [
      { label: "知道了", primary: true, fn: closeModal }
    ]);
    return;
  }

  S.stone -= costStone;
  S.actionsUsed = (S.actionsUsed || 0) + 1;

  if (chance(0.75)) {
    const ev = pickSecretEventFromGroup("A");
    if (ev) {
      const validDays = ev.validDays || 3;
      S.flags.pendingSecretRealm = {
        id: ev.id,
        group: "A",
        appearDay: S.day,
        expireDay: S.day + validDays,
      };
      log(`【寻访天机】你耗费 ${costStone} 灵石推演灵脉，成功寻得秘境【${ev.name}】！`, "c-gold");
      save();
      render();
      showModal("🧭 寻得秘境线索", `
        <p>寻灵盘金光大盛，指向一处隐秘的空间裂隙！</p>
        <div class="card">
          <b>${ev.icon || "🌀"} ${ev.name}</b>
          <div class="small" style="margin-top:4px; color:var(--text-dim);">有效期 ${validDays} 天 · 每次探索耗 2 行动</div>
        </div>
      `, [
        { label: "立即进入秘境", primary: true, fn: () => {
          closeModal();
          enterSecretRealmById(ev.id, { fromPending: true });
        }},
        { label: "返回列表", fn: () => {
          closeModal();
          if (typeof checkAdvanceTimeSlot === "function") checkAdvanceTimeSlot();
          if (typeof openSecretRealmListModal === "function") openSecretRealmListModal();
        }}
      ]);
      return;
    }
  }

  /* 25% 未寻得秘境，但偶有所悟获修为补偿 */
  const expGain = rndInt(35, 65) * Math.max(1, (S.realm || 0) + 1);
  if (typeof gainCultivationExp === "function") gainCultivationExp(expGain);
  else S.exp = (S.exp || 0) + expGain;

  log(`【寻访天机】虽未寻得空间裂隙，但感悟天地灵机，修为 +${expGain}。`, "c-blue");
  save();
  render();
  showModal("🧭 寻访天机", `
    <p>你布下寻灵盘推演半晌，附近灵脉平稳，暂未发现开启的秘境裂隙。</p>
    <p class="small" style="color:var(--c-good);">不过在推演天地灵机时偶有所悟，获得 <b>修为 +${fmt(expGain)}</b>。</p>
  `, [
    { label: "知道了", primary: true, fn: () => {
      closeModal();
      if (typeof checkAdvanceTimeSlot === "function") checkAdvanceTimeSlot();
    }}
  ]);
}

/* 检查过期 */
function checkPendingSecretRealmExpire() {
  const p = S.flags.pendingSecretRealm;
  if (!p) return;
  if (S.day >= p.expireDay) {
    const ev = getSecretEventById(p.id);
    S.flags.pendingSecretRealm = null;
    if (ev) log(`【秘境关闭】${ev.name} 已消失。`, "c-bad");
  }
}

/* ============================================================
   进入秘境
   ============================================================ */
function enterSecretRealmById(id, opts) {
  opts = opts || {};
  const ev = getSecretEventById(id);
  if (!ev) { log(`秘境不存在：${id}`, "c-bad"); return; }

  /* 行动检查 */
  if (opts.costAction !== false) {
    const remain = Math.max(0, ACTIONS_PER_SLOT - (S.actionsUsed || 0));
    if (remain < 2) {
      log("本时段行动不足（探索秘境需 2 行动）。", "c-bad");
      showModal("行动不足", `
        <p>探索秘境【<b>${ev.name}</b>】需要消耗 <b>2</b> 点行动。</p>
        <p class="small" style="color:var(--text-dim);">本时段剩余行动：<b>${remain} / ${ACTIONS_PER_SLOT}</b>，请先休息或进入下一时段后再来。</p>
      `, [
        { label: "知道了", primary: true, fn: closeModal }
      ]);
      return;
    }
  }

  /* 战力对比检查 */
  if (!opts.forceConfirm) {
    const info = getPlayerRealmInfo();
    const playerPower = typeof calcPlayerCombatPower === "function" ? calcPlayerCombatPower() : 0;
    const recPower = typeof calcSecretRealmRecommendedPower === "function" ? calcSecretRealmRecommendedPower(ev) : 0;
    const isUnderRealm = ev.realmMin !== undefined && info.realm < ev.realmMin;
    const isWeakPower = playerPower < recPower;

    if (isUnderRealm || isWeakPower) {
      const realmText = (ev.realmMin !== undefined && REALMS[ev.realmMin]?.name) || "炼气";
      let warnDetail = "";
      if (isUnderRealm && isWeakPower) {
        warnDetail = `此秘境灵压浩大！适宜境界为 <b>${realmText}</b> 以上，建议探索战力达 <b>${recPower}</b>。<br>你当前战力为 <b>${playerPower}</b>，道行尚浅，擅入恐难取全功。`;
      } else if (isWeakPower) {
        warnDetail = `此秘境暗藏玄机，建议探索战力为 <b>${recPower}</b>。<br>你当前战力为 <b>${playerPower}</b>，稍显勉强。`;
      } else {
        warnDetail = `此秘境适宜境界为 <b>${realmText}</b>。<br>你当前战力为 <b>${playerPower}</b>，因境界差距可能受禁制威压影响。`;
      }

      showModal("⚠️ 秘境涉险示警", `
        <div class="card" style="border: 1.5px solid #d05a4a; background: rgba(50, 20, 20, 0.45); padding: 12px; margin-bottom: 8px;">
          <b style="color: #e06c75; font-size: 14px;">【${ev.name}】灵威莫测</b>
          <div class="small" style="margin-top: 6px; line-height: 1.5; color: #f0cfcb;">
            ${warnDetail}
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 12px;">
            <span>当前战力：<b style="color:#e06c75;">☯ ${fmt(playerPower)}</b></span>
            <span>建议战力：<b style="color:#d8b878;">☯ ${fmt(recPower)}</b></span>
          </div>
        </div>
        <p class="small" style="color: var(--text-dim);">秘境奇遇伴随因果抉择，请问道友是否执意探寻？</p>
      `, [
        { label: "暂缓前往", fn: closeModal },
        { label: "执意探寻 · 进入秘境", primary: true, fn: () => {
          closeModal();
          const nextOpts = Object.assign({}, opts, { forceConfirm: true });
          enterSecretRealmById(id, nextOpts);
        }}
      ]);
      return;
    }
  }

  if (opts.costAction !== false) {
    S.actionsUsed = (S.actionsUsed || 0) + 2;
  }

  /* 初始化状态 */
  S.flags.currentSecretRealm = {
    id: id,
    sceneKey: ev.start,
    totalRewards: [],
    lastStepRewards: [],
    stepCount: 1,
  };

  /* 清 pending */
  if (opts.fromPending) {
    S.flags.pendingSecretRealm = null;
  }

  log(`【秘境】你踏入了 ${ev.name}。`, "c-gold");
  save();
  openSecretScreen();
}

function leaveSecretRealm(isFinished = true) {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;
  const ev = getSecretEventById(cur.id);

  if (isFinished) {
    if (!S.flags.secretCleared) S.flags.secretCleared = {};
    S.flags.secretCleared[cur.id] = true;
  }

  /* 汇总奖励 */
  const totalExp = cur.totalRewards
    .filter(r => r.type === "修为")
    .reduce((s, r) => s + r.amount, 0);
  const totalStone = cur.totalRewards
    .filter(r => r.type === "灵石")
    .reduce((s, r) => s + r.amount, 0);
  const totalCost = cur.totalRewards
    .filter(r => r.type === "消耗")
    .reduce((s, r) => s + r.amount, 0);

  const itemLines = [];
  cur.totalRewards.forEach(r => {
    if (r.type === "获得") itemLines.push(r.amount);
  });

  let body = `
    <div class="card" style="margin-bottom:8px;">
      <div style="text-align:center; font-weight:bold; color:var(--text-gold); margin-bottom:6px;">
        ${isFinished ? `✨ 【${ev ? ev.name : "秘境"}】探索圆满` : `🚪 暂离【${ev ? ev.name : "秘境"}】`}
      </div>
      <div class="row"><span>获得修为</span><b style="color:var(--c-blue);">+${fmt(totalExp)}</b></div>
      <div class="row"><span>获得灵石</span><b style="color:var(--text-gold);">+${fmt(totalStone)}${totalCost > 0 ? `（消耗 ${fmt(totalCost)}）` : ""}</b></div>
    </div>
  `;

  if (itemLines.length > 0) {
    body += `
      <div class="small" style="margin-bottom:4px; color:var(--text-dim);">所得机缘与宝物：</div>
      <div class="detail-list">
        ${itemLines.map(r => `<div>· ${r}</div>`).join("")}
      </div>
    `;
  } else if (totalExp === 0 && totalStone === 0) {
    body += `<p class="small" style="text-align:center; color:var(--text-dim);">此番秘境之行平淡如水，未曾取走宝物。</p>`;
  }

  showModal(isFinished ? "📜 秘境机缘结算" : "离开秘境", body, [
    { label: "收入囊中", primary: true, fn: () => {
      closeModal();
      S.flags.currentSecretRealm = null;
      closeSecretScreen();
      if (typeof checkAdvanceTimeSlot === "function") {
        checkAdvanceTimeSlot();
      }
      save();
      render();
    }},
  ]);
}

/* ============================================================
   秘境场景推进
   ============================================================ */
function secretChoose(idx) {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;
  const ev = getSecretEventById(cur.id);
  if (!ev) return;
  const scene = ev.scenes[cur.sceneKey];
  if (!scene || !scene.choices[idx]) return;

  const choice = scene.choices[idx];

  /* 检查是否需要消耗灵石 */
  if (choice.reward && choice.reward.stone && choice.reward.stone < 0) {
    const needStone = Math.abs(choice.reward.stone);
    if ((S.stone || 0) < needStone) {
      showModal("灵石不足", `
        <p>此抉择需要耗费 <b>${needStone} 灵石</b>，你当前仅有 <b>${S.stone || 0} 灵石</b>。</p>
      `, [
        { label: "另作打算", primary: true, fn: closeModal }
      ]);
      return;
    }
  }

  /* 结算本步机缘并内联展示，不再每步弹窗打断剧情流 */
  cur.lastStepRewards = [];
  if (choice.reward) {
    cur.lastStepRewards = applySecretReward(choice.reward);
  }

  advanceSecretAfterChoice(choice);
}

function advanceSecretAfterChoice(choice) {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;

  /* flag 设置 */
  if (choice.reward && choice.reward.flag) {
    S.flags[choice.reward.flag] = true;
  }

  if (choice.next === "END") {
    leaveSecretRealm(true);
  } else {
    cur.sceneKey = choice.next;
    cur.stepCount = (cur.stepCount || 1) + 1;
    save();
    renderSecretScreen();
  }
}

/* ============================================================
   奖励处理（标准化物品 ID 与中文名称）
   ============================================================ */
function resolveSecretItemInfo(rawId) {
  if (!rawId) return { id: rawId, name: rawId, icon: "📦" };
  /* 兼容旧中文别名 */
  const aliasMap = {
    "灵兽丹·凡": "petBreak_1",
    "灵兽丹·灵": "petBreak_2",
    "灵兽丹·玄": "petBreak_3",
  };
  const normId = aliasMap[rawId] || rawId;
  const def = (typeof ITEMS !== "undefined" && ITEMS[normId]) ? ITEMS[normId] : null;
  if (def) {
    return { id: def.id || normId, name: def.name || normId, icon: def.icon || "📦" };
  }
  return { id: normId, name: rawId, icon: "📦" };
}

function applySecretReward(reward) {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return [];
  const stepLines = [];

  if (reward.exp) {
    if (typeof gainCultivationExp === "function") gainCultivationExp(reward.exp);
    else S.exp = (S.exp || 0) + reward.exp;
    cur.totalRewards.push({ type: "修为", amount: reward.exp });
    stepLines.push(`✨ 修为 +${fmt(reward.exp)}`);
  }
  if (reward.stone) {
    if (reward.stone > 0) {
      S.stone = (S.stone || 0) + reward.stone;
      cur.totalRewards.push({ type: "灵石", amount: reward.stone });
      stepLines.push(`💎 灵石 +${fmt(reward.stone)}`);
    } else {
      S.stone = Math.max(0, (S.stone || 0) + reward.stone);
      cur.totalRewards.push({ type: "消耗", amount: -reward.stone });
      stepLines.push(`💎 消耗灵石 ${fmt(-reward.stone)}`);
    }
  }
  if (reward.mat) {
    const baseId = reward.mat;
    const gradeRange = reward.gradeRange || [1, 1];
    const grade = rndInt(gradeRange[0], gradeRange[1]);
    const count = reward.count || 1;
    const fullMatId = baseId + "_" + grade;
    addItem(fullMatId, count);
    const info = resolveSecretItemInfo(fullMatId);
    const label = `${info.icon} ${info.name} ×${count}`;
    cur.totalRewards.push({ type: "获得", amount: label });
    stepLines.push(`🎁 获得 ${label}`);
  }
  if (reward.item) {
    const count = reward.count || 1;
    const info = resolveSecretItemInfo(reward.item);
    addItem(info.id, count);
    const label = `${info.icon} ${info.name} ×${count}`;
    cur.totalRewards.push({ type: "获得", amount: label });
    stepLines.push(`🎁 获得 ${label}`);
  }
  if (reward.note) {
    cur.totalRewards.push({ type: "获得", amount: `📜 ${reward.note}` });
    stepLines.push(`📜 ${reward.note}`);
  }

  return stepLines;
}

/* ============================================================
   UI 控制
   ============================================================ */
function openSecretScreen() {
  if (typeof renderSecretScreen === "function") {
    renderSecretScreen();
    const el = document.getElementById("secretScreen");
    if (el) el.style.display = "flex";
  }
}

function closeSecretScreen() {
  const el = document.getElementById("secretScreen");
  if (el) el.style.display = "none";
}

/* ============================================================
   C 组：1003 年剧情触发
   ============================================================ */
function triggerStorySecretRealm() {
  const ev = pickSecretEventFromGroup("C");
  if (!ev) return;

  if (!S.flags.storyCUsed) S.flags.storyCUsed = [];
  if (S.flags.storyCUsed.includes(ev.id)) return;
  S.flags.storyCUsed.push(ev.id);

  log(`【剧情】秘境开启：${ev.name}`, "c-gold");
  showModal("剧情秘境", `
    <p>长老将你叫到一旁，低声说：</p>
    <p class="small">「秘境入口已经开启，你且前去探索。」</p>
    <div class="card">
      <b>${ev.name}</b>
    </div>
  `, [
    { label: "前往", primary: true, fn: () => {
      closeModal();
      enterSecretRealmById(ev.id, { costAction: false });
    }},
    { label: "暂不前往", fn: closeModal },
  ]);
}
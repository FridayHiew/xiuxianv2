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

  /* 30% 几率出现 */
  if (!chance(0.30)) return;

  /* 抽一个 A 组 */
  const ev = pickSecretEventFromGroup("A");
  if (!ev) return;

  /* 记录 */
  const validDays = ev.validDays || 3;
  S.flags.pendingSecretRealm = {
    id: ev.id,
    group: "A",
    appearDay: S.day,
    expireDay: S.day + validDays,
  };

  log(`【秘境】你感应到一处秘境开启：${ev.name}`, "c-gold");

  showModal("秘境开启", `
    <p>你忽然感到天地灵气一阵波动。</p>
    <p>似乎有一处<span class="gold">秘境</span>在你附近开启了：</p>
    <div class="card">
      <b>${ev.name}</b>
      <div class="small">${ev.name} · 有效期 ${validDays} 天</div>
    </div>
    <p class="small">可在【洞府 > 秘境】前往探索。</p>
  `, [
    { label: "知道了", fn: closeModal },
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
    if (S.actionsUsed + 2 > ACTIONS_PER_SLOT) {
      log("本时段行动不足（需 2 行动）。", "c-bad");
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
        warnDetail = `此秘境灵压浩大！适宜境界为 <b>${realmText}</b> 以上，建议探索战力达 <b>${recPower}</b>。<br>你当前战力为 <b>${playerPower}</b>，道行尚浅，擅入极易遭遇禁制凶煞！`;
      } else if (isWeakPower) {
        warnDetail = `此秘境暗藏杀机，建议探索战力为 <b>${recPower}</b>。<br>你当前战力为 <b>${playerPower}</b>，稍显孱弱，涉险极易负伤受创。`;
      } else {
        warnDetail = `此秘境适宜境界为 <b>${realmText}</b>。<br>你当前战力为 <b>${playerPower}</b>，但因大境界差距，恐受秘境重力与威压限制。`;
      }

      showModal("⚠️ 秘境涉险示警", `
        <div class="card" style="border: 1.5px solid #d05a4a; background: rgba(50, 20, 20, 0.45); padding: 12px; margin-bottom: 8px;">
          <b style="color: #e06c75; font-size: 15px;">【${ev.name}】灵威莫测</b>
          <div class="small" style="margin-top: 6px; line-height: 1.6; color: #f0cfcb;">
            ${warnDetail}
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 13px;">
            <span>当前战力：<b style="color:#e06c75;">${playerPower}</b></span>
            <span>建议战力：<b style="color:#d8b878;">${recPower}</b></span>
          </div>
        </div>
        <p class="small" style="color: var(--text-dim);">秘境奇遇往往伴随莫大劫数，请问道友是否执意探寻？</p>
      `, [
        { label: "暂缓前往", fn: closeModal },
        { label: "执意探寻 · 依然进入", primary: true, fn: () => {
          closeModal();
          const nextOpts = Object.assign({}, opts, { forceConfirm: true });
          enterSecretRealmById(id, nextOpts);
        }}
      ]);
      return;
    }
  }

  if (opts.costAction !== false) {
    S.actionsUsed += 2;
  }

  /* 初始化状态 */
  S.flags.currentSecretRealm = {
    id: id,
    sceneKey: ev.start,
    totalRewards: [],
  };

  /* 清 pending */
  if (opts.fromPending) {
    S.flags.pendingSecretRealm = null;
  }

  log(`【秘境】你进入了 ${ev.name}。`, "c-gold");
  save();
  openSecretScreen();
}

function leaveSecretRealm() {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;
  const ev = getSecretEventById(cur.id);

  /* 汇总奖励 */
  const totalExp = cur.totalRewards
    .filter(r => r.type === "修为")
    .reduce((s, r) => s + r.amount, 0);
  const totalStone = cur.totalRewards
    .filter(r => r.type === "灵石")
    .reduce((s, r) => s + r.amount, 0);

  const rewardList = [];
  if (totalExp) rewardList.push(`修为 +${totalExp}`);
  if (totalStone) rewardList.push(`灵石 +${totalStone}`);
  cur.totalRewards.forEach(r => {
    if (r.type === "获得") rewardList.push(r.amount);
  });

  let body = `
    <p style="text-align:center;">你离开了【${ev.name}】。</p>
  `;
  if (rewardList.length > 0) {
    body += `<div class="detail-list">`;
    rewardList.forEach(r => { body += `<div>${r}</div>`; });
    body += `</div>`;
  }

  showModal("秘境结束", body, [
    { label: "确定", primary: true, fn: () => {
      closeModal();
      S.flags.currentSecretRealm = null;
      closeSecretScreen();
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

  /* 奖励 */
  if (choice.reward) {
    applySecretReward(choice.reward);
    showSecretRewardModal(choice.reward, () => {
      advanceSecretAfterChoice(choice);
    });
    return;
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
    leaveSecretRealm();
  } else {
    cur.sceneKey = choice.next;
    save();
    renderSecretScreen();
  }
}

/* ============================================================
   奖励处理
   ============================================================ */
function applySecretReward(reward) {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;

  if (reward.exp) {
    if (typeof gainCultivationExp === "function") gainCultivationExp(reward.exp);
    else S.exp = (S.exp || 0) + reward.exp;
    cur.totalRewards.push({ type: "修为", amount: reward.exp });
  }
  if (reward.stone) {
    if (reward.stone > 0) {
      S.stone += reward.stone;
      cur.totalRewards.push({ type: "灵石", amount: reward.stone });
    } else {
      /* 负数（花费） */
      S.stone = Math.max(0, S.stone + reward.stone);
      cur.totalRewards.push({ type: "消耗", amount: -reward.stone });
    }
  }
  if (reward.mat) {
    const baseId = reward.mat;
    const gradeRange = reward.gradeRange || [1, 1];
    const grade = rndInt(gradeRange[0], gradeRange[1]);
    const count = reward.count || 1;
    addItem(baseId + "_" + grade, count);
    cur.totalRewards.push({ type: "获得", amount: `${baseId}（${grade}品）×${count}` });
  }
  if (reward.item) {
    const count = reward.count || 1;
    addItem(reward.item, count);
    cur.totalRewards.push({ type: "获得", amount: `${reward.item} ×${count}` });
  }
  if (reward.note) {
    cur.totalRewards.push({ type: "获得", amount: reward.note });
  }
}

function showSecretRewardModal(reward, onClose) {
  const lines = [];
  if (reward.exp)   lines.push(`修为 +${reward.exp}`);
  if (reward.stone) lines.push(reward.stone > 0 ? `灵石 +${reward.stone}` : `灵石 ${reward.stone}`);
  if (reward.mat)   lines.push(`材料：${reward.mat}（${(reward.gradeRange || [1,1]).join("~")}品）×${reward.count || 1}`);
  if (reward.item)  lines.push(`道具：${reward.item} ×${reward.count || 1}`);
  if (reward.note)  lines.push(`${reward.note}`);

  showModal("机缘", `
    <p style="text-align:center;">你获得了：</p>
    <div class="detail-list">
      ${lines.map(l => `<div>${l}</div>`).join("")}
    </div>
  `, [
    { label: "继续", primary: true, fn: () => { closeModal(); if (onClose) onClose(); } },
  ]);
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
  /* 随机抽 C 组一个 */
  const ev = pickSecretEventFromGroup("C");
  if (!ev) return;

  /* 记录到 flags（避免重复） */
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
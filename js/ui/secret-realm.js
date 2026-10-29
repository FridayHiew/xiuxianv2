/* ============================================================
   ui/secret-realm.js - 秘境界面（剧情场景与内联机缘）
   ============================================================ */

function renderSecretScreen() {
  const cur = S.flags.currentSecretRealm;
  if (!cur) return;
  const ev = getSecretEventById(cur.id);
  if (!ev) return;
  const scene = ev.scenes[cur.sceneKey];
  if (!scene) return;

  /* 顶部标题 */
  const titleEl = document.getElementById("secretTitle");
  const subEl = document.getElementById("secretSub");
  if (titleEl) titleEl.textContent = `${ev.icon || "📜"} ${ev.name}`;
  if (subEl) subEl.textContent = `第 ${cur.stepCount || 1} 幕 · ${scene.title || ""}`;

  /* 顶部状态与收获栏 */
  renderSecretHudBar();

  /* 卡片与上一步机缘反馈 */
  const card = document.getElementById("secretCard");
  const stepRewards = cur.lastStepRewards || [];
  const stepGainHtml = stepRewards.length > 0 ? `
    <div class="secret-step-gain">
      <span class="gain-tag">上步所得</span>
      <span class="gain-items">${stepRewards.join(" · ")}</span>
    </div>
  ` : "";

  card.innerHTML = `
    ${stepGainHtml}
    <div class="scene-visual">${scene.visual || "📜"}</div>
    <div class="story-title">${scene.title || ""}</div>
    <div class="story-text">
      ${(scene.text || []).map(p => `<p>${p}</p>`).join("")}
    </div>
  `;
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "storyIn .35s cubic-bezier(.2,.8,.3,1)";

  /* 选项 */
  const list = document.getElementById("secretChoiceList");
  if (!scene.choices || scene.choices.length === 0) {
    list.innerHTML = "";
    return;
  }
  let html = "";
  scene.choices.forEach((c, i) => {
    const isEnd = c.next === "END";
    const cls = [
      "story-choice",
      c.special ? "special" : "",
      isEnd ? "exit-choice" : "",
    ].filter(Boolean).join(" ");

    const badgeInfo = getSecretChoiceBadge(c, isEnd);

    html += `
      <button class="${cls}" onclick="onSecretChoose(${i})">
        <span class="choice-num">${i + 1}</span>
        <span class="choice-text">
          ${c.label}
          ${c.reward && c.reward.note ? ` <span style="color:var(--text-gold); font-size:10.5px;">（${c.reward.note}）</span>` : ""}
        </span>
        ${badgeInfo ? `<span class="secret-choice-badge ${badgeInfo.cls}">${badgeInfo.text}</span>` : ""}
      </button>
    `;
  });
  list.innerHTML = html;
}

function renderSecretHudBar() {
  const cur = S.flags.currentSecretRealm;
  let hudEl = document.getElementById("secretHudBar");
  if (!hudEl) {
    const header = document.querySelector("#secretScreen .secret-header");
    if (header) {
      hudEl = document.createElement("div");
      hudEl.id = "secretHudBar";
      hudEl.className = "secret-hud-bar";
      header.insertAdjacentElement("afterend", hudEl);
    }
  }
  if (!hudEl || !cur) return;

  const totalExp = (cur.totalRewards || [])
    .filter(r => r.type === "修为")
    .reduce((s, r) => s + r.amount, 0);
  const totalStone = (cur.totalRewards || [])
    .filter(r => r.type === "灵石")
    .reduce((s, r) => s + r.amount, 0);
  const gainCount = (cur.totalRewards || []).filter(r => r.type === "获得").length;

  hudEl.innerHTML = `
    <div class="secret-hud-left">
      <span>💎 灵石 <b>${fmt(S.stone || 0)}</b></span>
      <span>·</span>
      <span>已获修为 <b style="color:var(--c-blue);">+${fmt(totalExp)}</b></span>
      ${totalStone > 0 ? `<span>·</span><span>秘境灵石 <b style="color:var(--text-gold);">+${fmt(totalStone)}</b></span>` : ""}
      ${gainCount > 0 ? `<span>·</span><span>宝物 <b style="color:#9be29b;">${gainCount}件</b></span>` : ""}
    </div>
    <button type="button" class="secret-retreat-btn" onclick="onSecretLeave()">🚪 暂离</button>
  `;
}

function getSecretChoiceBadge(choice, isEnd) {
  if (isEnd) return { text: "离开结算", cls: "end" };
  if (choice.special) return { text: "特殊因果", cls: "special" };
  if (choice.reward) {
    if (choice.reward.stone && choice.reward.stone < 0) {
      return { text: `耗 ${Math.abs(choice.reward.stone)} 灵石`, cls: "cost" };
    }
    return { text: "机缘", cls: "reward" };
  }
  return null;
}

function onSecretChoose(i) {
  secretChoose(i);
}

function onSecretLeave() {
  showModal("暂离秘境", `
    <p>确定要提前离开当前秘境吗？</p>
    <p class="small" style="color:var(--text-dim);">已获得的修为与宝物将予以保留，但未探索的后续机缘将随之消散。</p>
  `, [
    { label: "继续探索", fn: closeModal },
    { label: "确定离开", primary: true, fn: () => {
      closeModal();
      leaveSecretRealm(false);
    }}
  ]);
}
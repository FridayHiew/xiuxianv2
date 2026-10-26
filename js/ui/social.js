/* ============================================================
   ui/social.js - 仙友同道录面板（好感度等级机制 / 动态交互 / 自由馈赠）
   ============================================================ */

function renderSocial() {
  const met = S.npcs.filter(n => n.alive && S.metNpcs[n.id]);
  const tiers = ["杂务", "门外", "门内", "长老", "其他宗门"];

  // 好感度层阶说明清单
  const tiersGuide = [
    { lvl: "Lv.1 萍水相逢", hint: "基础问候" },
    { lvl: "Lv.2 泛泛之交", hint: "演武+15%、探问八卦" },
    { lvl: "Lv.3 志同道合", hint: "论道+25%、晨间回赠" },
    { lvl: "Lv.4 莫逆之交", hint: "高人点拨、心魔排解" },
    { lvl: "Lv.5 生死与共", hint: "赠礼+30%、金兰道侣盟誓" },
    { lvl: "Lv.6 金兰道侣", hint: "双修+15%、心魔抗性、天道反哺" },
  ];

  let html = `
    <div class="social-header-banner" style="margin-bottom:12px; padding:10px 14px; background:linear-gradient(135deg, rgba(34,24,14,0.92), rgba(20,15,10,0.92)); border:1px solid var(--border-gold); border-radius:var(--radius-md);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0; color:var(--text-gold); font-family:var(--font-serif); font-size:16px;">
          🤝 仙友同道录 (${met.length} 位结识)
        </h3>
        <span style="font-size:11px; color:var(--text-dim);">每日可进行动态机缘交流与自选馈赠</span>
      </div>
      <div style="font-size:12px; color:#c4b494; margin-top:6px; line-height:1.4;">
        修真逆天，知交为伴。与仙友坐而论道、参演兵刃、探听异象或赠送丹药道书，皆可突破好感等级，解锁专属特权庇护。
      </div>

      <!-- 好感度层阶图谱 -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; padding-top:6px; border-top:1px dashed #3a2b18;">
        ${tiersGuide.map(g => `
          <div style="font-size:10px; background:rgba(0,0,0,0.3); border:1px solid #3d2f1f; border-radius:3px; padding:2px 6px; color:#baa88c;">
            <b style="color:var(--text-gold);">${g.lvl}</b>: ${g.hint}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  if (met.length === 0) {
    html += `
      <div class="empty" style="text-align:center; padding:30px 16px; background:#140f0a; border:1px dashed #3a2b18; border-radius:8px;">
        <div style="font-size:24px; margin-bottom:8px;">🍃</div>
        <div style="color:var(--text-gold); font-size:14px; font-weight:bold; margin-bottom:4px;">尚无深交之同门</div>
        <div style="color:var(--text-dim); font-size:12px;">你正潜心修持。可在执事堂杂务、宗门演武大比或四方历练机缘中结识更多同道仙友。</div>
      </div>
    `;
  } else {
    tiers.forEach(t => {
      const list = met.filter(n => n.tier === t || (t === "其他宗门" && n.otherSect));
      if (list.length === 0) return;
      html += `<div class="parchment-sec-header">${t}（${list.length} 人）</div>`;
      list.forEach(n => {
        const otherSect = n.otherSect ? ` <span class="tag">${n.otherSect}</span>` : '';
        const realmText = n.realm === 0 ? "凡人" : `${REALMS[n.realm]?.name || '筑基'}·${subName(n.sub)}${n.sub}重`;
        const interacted = hasInteractedToday(n.id);
        const gifted = hasGiftedToday(n.id);
        const acted = interacted && gifted;
        const rel = typeof getNpcRelation === "function" ? getNpcRelation(n.aff) : { level: 1, stage: "萍水相逢", class: "dim", icon: "🌱", perkSummary: "日常寒暄" };
        const bondTag = n.isCompanion ? ` <span class="tag pink">💍 道侣</span>` : (n.isSworn ? ` <span class="tag gold">⚔️ 金兰</span>` : '');

        html += `
          <div class="npc-card ${acted ? 'interacted' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:4px;">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                <span class="name">${n.name}</span>
                ${bondTag}
                <span class="tag lvl-${rel.level}">${rel.icon} Lv.${rel.level} ${rel.stage}</span>
                <span class="tag">${n.role}</span>
                <span class="tag ${n.gender === "女" ? "pink" : "blue"}">${n.gender}</span>
                <span class="tag">${realmText}</span>
                ${otherSect}
              </div>
              <span class="aff" style="font-size:12px; color:var(--text-gold2); font-weight:600;">好感 ${n.aff}/100</span>
            </div>

            <div class="aff-bar-track" style="margin-bottom:4px;">
              <div class="aff-bar-fill" style="width:${n.aff}%;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; color:#9e8e75; margin-bottom:5px;">
              <span>${rel.affNextText || ''}</span>
              <span class="perk-tag">特权: ${rel.perkSummary}</span>
            </div>

            <div class="meta" style="font-size:11px; color:var(--text-dim); margin-bottom:6px; line-height:1.4;">
              性情：${n.traits.join("、")}　悟性：${n.talent}　气度：${n.ie === 'E' ? '外向健谈' : '内向深沉'}　仪态：${n.looks}/10
            </div>

            <div style="display:flex; gap:8px; margin-top:6px;">
              <button onclick="openInteract('${n.id}')" ${interacted ? "disabled" : ""} style="flex:1; padding:5px 8px; font-size:12px;">
                ${interacted ? "✓ 今日已交流" : "💬 动态机缘交流"}
              </button>
              <button onclick="openGiftModal('${n.id}')" ${gifted ? "disabled" : ""} style="flex:1; padding:5px 8px; font-size:12px;">
                ${gifted ? "✓ 今日已馈赠" : "🎁 自由馈赠心意"}
              </button>
            </div>
          </div>`;
      });
    });
  }

  const topTabsHtml = `
    <div class="fs-rect-tabs">
      <button type="button" class="fs-rect-tab" onclick="switchTab('story')">主线道途</button>
      <button type="button" class="fs-rect-tab active">仙友同道</button>
    </div>
  `;

  return `
    <div class="fs-detail-page">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(topTabsHtml, "仙友同道录") : topTabsHtml}
      <div class="fs-detail-scroll-body">
        ${html}
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("returnFromDetailPage()") : ""}
    </div>
  `;
}
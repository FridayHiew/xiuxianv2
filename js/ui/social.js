/* ============================================================
   ui/social.js - 道友录面板（紧凑单行行布局 / 头像 / 特权交互）
   ============================================================ */

function renderSocial() {
  const met = S.npcs.filter(n => n.alive && S.metNpcs[n.id]);
  const tiers = ["杂务", "门外", "门内", "长老", "其他宗门"];

  // 好感度层阶说明清单
  const tiersGuide = [
    { lvl: "Lv.1 萍水相逢", hint: "日常问候" },
    { lvl: "Lv.2 泛泛之交", hint: "演武+15%、宗门见闻" },
    { lvl: "Lv.3 志同道合", hint: "可切磋对战、论道+25%" },
    { lvl: "Lv.4 莫逆之交", hint: "可邀请历练(有几率婉拒)" },
    { lvl: "Lv.5 金兰好友", hint: "结为挚友、清晨偶尔送礼" },
    { lvl: "Lv.6 金兰道侣", hint: "可双修同参、历练必应" },
  ];

  let html = `
    <div class="social-header-banner" style="margin-bottom:12px; padding:10px 14px; background:linear-gradient(135deg, rgba(34,24,14,0.92), rgba(20,15,10,0.92)); border:1px solid var(--border-gold); border-radius:var(--radius-md);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0; color:var(--text-gold); font-family:var(--font-serif); font-size:16px;">
          🤝 道友同道 (${met.length} 位结识)
        </h3>
        <span style="font-size:11px; color:var(--text-dim);">每日结交、切磋对战、历练邀约与知己双修</span>
      </div>
      <div style="font-size:12px; color:#c4b494; margin-top:6px; line-height:1.4;">
        修真逆天，知交为伴。与道友坐而论道、切磋比试或同游历练，突破好感阶层即可解锁深厚特权庇护。
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
        <div style="color:var(--text-gold); font-size:14px; font-weight:bold; margin-bottom:4px;">尚无深交之道友</div>
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
        const realmText = n.realm === 0 ? "凡人" : `${REALMS[n.realm]?.name || '修者'}·${subName(n.sub)}${n.sub}重`;
        const interacted = hasInteractedToday(n.id);
        const gifted = hasGiftedToday(n.id);
        const acted = interacted && gifted;
        const rel = typeof getNpcRelation === "function" ? getNpcRelation(n.aff) : { level: 1, stage: "萍水相逢", class: "dim", icon: "🌱", perkSummary: "日常问候" };
        const bondTag = n.isCompanion ? ` <span class="tag pink">💍 道侣</span>` : (n.isSworn ? ` <span class="tag gold">⚔️ 金兰</span>` : '');
        const avatarIcon = n.gender === "女" ? "🧚‍♀️" : "🧑‍🌾";

        // 单行紧凑道友卡片（含头像、基本境界信息、好感与交互操作）
        html += `
          <div class="npc-compact-row ${acted ? 'interacted' : ''}" onclick="openNpcActionSheet('${n.id}')" style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; margin-bottom:6px; background:linear-gradient(90deg, rgba(32,23,15,0.9), rgba(20,15,10,0.85)); border:1px solid #3d2f1f; border-radius:6px; cursor:pointer; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0; overflow:hidden;">
              <div class="npc-avatar-circle" style="width:34px; height:34px; min-width:34px; border-radius:50%; background:linear-gradient(135deg, #2a1f14, #120d09); border:1.5px solid ${n.gender === '女' ? '#e08ca3' : '#d8b878'}; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 0 6px rgba(0,0,0,0.5);">
                ${avatarIcon}
              </div>
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px; min-width:0;">
                <span class="name" style="font-weight:600; color:var(--text-gold); font-size:13px;">${n.name}</span>
                ${bondTag}
                <span class="tag lvl-${rel.level}" style="font-size:10px; padding:1px 4px;">${rel.icon} Lv.${rel.level} ${rel.stage}</span>
                <span class="tag ${n.gender === "女" ? "pink" : "blue"}" style="font-size:10px; padding:1px 4px;">${n.gender}</span>
                <span class="tag" style="font-size:10px; padding:1px 4px;">${realmText}</span>
                ${otherSect}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
              <span class="aff" style="font-size:11px; color:var(--text-gold2); font-weight:600;">好感 ${n.aff}/100</span>
              <button type="button" class="small" onclick="event.stopPropagation(); openNpcActionSheet('${n.id}')" style="padding:3px 8px; font-size:11px;">
                ${acted ? '✓ 拜访' : '⚡ 交互'}
              </button>
            </div>
          </div>`;
      });
    });
  }

  const topTabsHtml = `
    <div class="fs-rect-tabs">
      <button type="button" class="fs-rect-tab" onclick="switchTab('story')">主线道途</button>
      <button type="button" class="fs-rect-tab active">道友</button>
    </div>
  `;

  return `
    <div class="fs-detail-page">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(topTabsHtml, "道友录") : topTabsHtml}
      <div class="fs-detail-scroll-body">
        ${html}
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("returnFromDetailPage()") : ""}
    </div>
  `;
}
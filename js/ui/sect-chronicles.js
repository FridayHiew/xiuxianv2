/* ============================================================
   ui/sect-chronicles.js - 宗门先祖青史录展卷界面
   古朴宣纸与竹简装裱，详尽展示玩家历世先贤的道号、年份、境界与死因
   ============================================================ */

function openSectChronicleModal() {
  const records = typeof getSectChronicles === "function" ? getSectChronicles() : [];

  const curSectObj = (typeof SECTS !== "undefined" && Array.isArray(SECTS) && S && S.sect)
    ? SECTS.find(s => s.id === S.sect)
    : null;
  const curSectName = curSectObj
    ? curSectObj.name
    : ((records[0] && records[0].sectName) ? records[0].sectName : "太源仙宗");

  let listHtml = "";

  if (records.length === 0) {
    listHtml = `
      <div class="chronicle-empty-box">
        <div class="empty-icon">📜</div>
        <div class="empty-title">【青史初卷 · 待载英杰】</div>
        <p class="empty-desc">
          此乃【${curSectName}】代代传世之无上青史宝卷，专为铭刻历代门人先贤之道途因果。<br>
          卷内尚无任何先贤身陨或坐化之笔墨。道友今世拜入门下，乃本代首位开辟道途之天骄弟子！<br>
          愿道友道心长青、破境飞升，永不入此道陨青史！
        </p>
      </div>
    `;
  } else {
    listHtml = records.map((rec, index) => {
      const isLatest = index === 0;
      return `
        <div class="chronicle-card ${isLatest ? 'is-latest' : ''}">
          <div class="chronicle-card-head">
            <div class="chronicle-head-left">
              <span class="chronicle-gen-seal">第 ${rec.gen} 代先贤</span>
              <span class="chronicle-ancestor-name">「${rec.name}」</span>
              ${isLatest ? '<span class="chronicle-latest-tag">前世因果</span>' : ''}
            </div>
            <span class="chronicle-realm-pill">${rec.realmName}</span>
          </div>

          <div class="chronicle-grid">
            <div class="chronicle-grid-item">
              <span class="cg-label">仙历纪年：</span>
              <span class="cg-val">仙历第 ${rec.year} 年（在世 ${rec.day} 日）</span>
            </div>
            <div class="chronicle-grid-item">
              <span class="cg-label">享年岁数：</span>
              <span class="cg-val">${rec.age} 岁</span>
            </div>
            <div class="chronicle-grid-item">
              <span class="cg-label">门派归属：</span>
              <span class="cg-val">${rec.sectName}（${rec.sectRank || '外门弟子'}）</span>
            </div>
            ${rec.petName ? `
            <div class="chronicle-grid-item">
              <span class="cg-label">伴生灵兽：</span>
              <span class="cg-val">🐾 ${rec.petName}</span>
            </div>` : ''}
          </div>

          <div class="chronicle-cause-row">
            <span class="cause-tag">💀 身陨因由</span>
            <span class="cause-text">${rec.deathReason}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  const modalBody = `
    <div class="sect-chronicle-container">
      <!-- 历代卷目列表 -->
      <div class="chronicle-scroll-list">
        ${listHtml}
      </div>
    </div>
  `;

  const modalActions = [
    { label: "合上青史卷", fn: closeModal },
  ];

  showModal("📜 宗门先祖青史策", modalBody, modalActions);
}

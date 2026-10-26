/* ============================================================
   core/log.js - 日志与底部半透明修仙传音栏
   ============================================================ */

function log(text, cls = "c-normal") {
  logBuffer.push({ text, cls });
  if (logBuffer.length > 300) logBuffer.shift();

  logUnread++;
  const badge = document.getElementById("logBadge");
  const icon = document.getElementById("logIcon");
  if (badge) {
    badge.textContent = logUnread > 99 ? "99+" : logUnread;
    if (icon) icon.classList.add("has-new");
  }
  renderFloatingLog();
}

function renderFloatingLog() {
  const wrap = document.getElementById("floatingLogWrap");
  if (!wrap) return;

  const recent = logBuffer.slice(-3);
  const linesHtml = recent.length > 0
    ? recent.map(l => `<div class="flog-line ${l.cls}">${l.text}</div>`).join("")
    : `<div class="flog-line c-normal">【仙途】水墨长卷徐徐展开，点击任意印章开始修道……</div>`;

  if (typeof floatingLogMinimized !== "undefined" && floatingLogMinimized) {
    const last = recent[recent.length - 1];
    wrap.innerHTML = `
      <div class="floating-log-bar minimized" onclick="openLog()" title="点击查看完整修仙日志">
        <span class="flog-tag">传音</span>
        <span class="flog-single ${last ? last.cls : 'c-normal'}">${last ? last.text : '暂无传音日志'}</span>
        <button type="button" class="flog-toggle-btn" onclick="toggleFloatingLog(event)" title="展开日志框">▲</button>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div class="floating-log-bar" onclick="openLog()" title="点击展开完整机缘日志">
      <div class="flog-lines">${linesHtml}</div>
      <div class="flog-side-controls">
        <button type="button" class="flog-toggle-btn" onclick="toggleFloatingLog(event)" title="折叠日志框">▼</button>
        <span class="flog-more">全卷</span>
      </div>
    </div>
  `;
}

function toggleFloatingLog(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  floatingLogMinimized = !floatingLogMinimized;
  renderFloatingLog();
}

function openLog() {
  logUnread = 0;
  const badge = document.getElementById("logBadge");
  const icon = document.getElementById("logIcon");
  if (badge) badge.textContent = "0";
  if (icon) icon.classList.remove("has-new");

  const html = logBuffer.map(l => `<div class="log-entry-line ${l.cls}">${l.text}</div>`).join("")
             || '<div class="c-normal">暂无日志。</div>';

  const tabsHtml = `
    <div class="fs-rect-tabs">
      <button type="button" class="fs-rect-tab active">仙途机缘日志</button>
    </div>
  `;

  document.getElementById("logBox").innerHTML = `
    <div class="fs-detail-page">
      ${typeof renderFullScreenTopBar === "function" ? renderFullScreenTopBar(tabsHtml, "仙途机缘日志") : tabsHtml}
      <div class="fs-detail-scroll-body log-content" id="logContent">
        <div class="parchment-sec-header">修真传音录</div>
        <div class="card log-scroll-card">${html}</div>
      </div>
      ${typeof renderFullScreenBottomBar === "function" ? renderFullScreenBottomBar("closeLog()") : `<button onclick="closeLog()">返回</button>`}
    </div>
  `;
  document.getElementById("logMask").classList.add("show");
  if (typeof syncFullScreenDetailChrome === "function") {
    syncFullScreenDetailChrome();
  }

  setTimeout(() => {
    const el = document.getElementById("logContent");
    if (el) el.scrollTop = el.scrollHeight;
  }, 10);
}

function closeLog() {
  document.getElementById("logMask").classList.remove("show");
  if (typeof syncFullScreenDetailChrome === "function") {
    syncFullScreenDetailChrome();
  }
}
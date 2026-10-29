/* ============================================================
   js/core/pwa.js - 《修仙人生》PWA 运行控制器
   包括 Service Worker 注册、桌面/手机一键安装与离线感知
   ============================================================ */

(function () {
  let _deferredInstallPrompt = window.__pwaDeferredPrompt || null;
  let _isInstalled = false;

  // 监听来自 index.html 早先注册的 beforeinstallprompt
  window.__onPwaPromptReady = function (e) {
    _deferredInstallPrompt = e;
    updateInstallButtonVisibility();
  };

  // 检测是否已处于 PWA 全屏/独立 App 模式
  function checkIsStandalone() {
    const isMediaStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isNavStandalone = window.navigator && window.navigator.standalone === true;
    return !!(isMediaStandalone || isNavStandalone);
  }

  // 检测是否为 iOS 设备 (Safari 不支持 beforeinstallprompt，需引导手动添加)
  function checkIsIOS() {
    const ua = (window.navigator && window.navigator.userAgent) ? window.navigator.userAgent.toLowerCase() : '';
    return /iphone|ipad|ipod/.test(ua);
  }

  // 检测是否为 Android 安卓设备
  function checkIsAndroid() {
    const ua = (window.navigator && window.navigator.userAgent) ? window.navigator.userAgent.toLowerCase() : '';
    return /android/.test(ua);
  }

  // 检测是否处于微信、QQ、微博等第三方 App 内置网页视图中（内置视图完全禁用 PWA 安装）
  function checkIsInAppBrowser() {
    const ua = (window.navigator && window.navigator.userAgent) ? window.navigator.userAgent.toLowerCase() : '';
    return /micromessenger|weibo|qq\/|line\/|fbav|instagram|toutiaomicroapp/.test(ua);
  }

  // 更新顶栏 PWA 安装按钮的显示状态
  function updateInstallButtonVisibility() {
    const btn = document.getElementById('pwaInstallBtn');
    if (!btn) return;

    _isInstalled = checkIsStandalone();

    // 若已是独立 App 打开，隐藏安装按钮
    if (_isInstalled) {
      btn.style.display = 'none';
      return;
    }

    // 只要有 deferredPrompt 或是移动端/桌面浏览器，皆展示方便道友点击
    btn.style.display = 'inline-flex';
  }

  // 离线状态浮层提示
  function updateOnlineStatus(isOnline) {
    let el = document.getElementById('pwaOfflineIndicator');
    if (!isOnline) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'pwaOfflineIndicator';
        el.className = 'pwa-offline-banner';
        el.innerHTML = `
          <span class="offline-dot"></span>
          <span class="offline-text">道友处于离线闭关中 · 已启用本地仙境缓存</span>
        `;
        document.body.appendChild(el);
      }
      el.style.display = 'flex';
    } else {
      if (el) {
        el.style.display = 'none';
      }
    }
  }

  // 检测是否处于内嵌 Iframe (如 AI Studio 预览环境，浏览器安全策略禁止在 iframe 中弹出 PWA 安装)
  function checkIsInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // 全局调用的安装入口
  window.handlePwaInstallClick = async function () {
    _isInstalled = checkIsStandalone();
    if (_isInstalled) {
      if (typeof showModal === 'function') {
        showModal('已安装修仙人生', '<p>道友当前已在修仙人生独立 App 中修真，无需重复安装。</p>', [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    const curUrl = window.location.href;

    // 1. 若处于微信、QQ、微博、Line 等第三方应用内置 WebView 中（这些内置 WebView 不支持直接安装 PWA）
    if (checkIsInAppBrowser()) {
      if (typeof showModal === 'function') {
        showModal('📲 请在系统浏览器中打开安装', `
          <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
            <div style="background: rgba(212, 163, 71, 0.12); border: 1px solid rgba(212, 163, 71, 0.35); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px;">
              <b style="color: #ffe6a3;">💡 提示：当前处于应用内置浏览器中</b>
              <p style="margin: 4px 0 0; font-size: 12px; color: #d6c8b0;">微信、QQ、微博等内置浏览器受系统安全限制，<b>无法直接将网页安装为独立桌面 App</b>。需使用系统原生浏览器打开。</p>
            </div>

            <p style="margin-bottom: 8px;"><b>只需两步即可安装为手机桌面 App：</b></p>
            <ol style="padding-left: 20px; margin-bottom: 12px;">
              <li>点击右上角的「<b>···</b>」或「<b>⋮</b>」更多菜单；</li>
              <li>选择 <b>【在浏览器中打开】</b>（推荐使用 Chrome 谷歌浏览器）；</li>
              <li>在系统浏览器中打开后，点击顶栏 <b>【📲 安装】</b> 即可一键生成桌面 App！</li>
            </ol>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span id="pwaCopyHint" class="c-dim" style="font-size: 12px;">也可复制链接粘贴至手机 Chrome 打开</span>
              <button type="button" class="small" onclick="window.copyAppUrl()">📋 复制链接</button>
            </div>
          </div>
        `, [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    // 2. 若处于编辑器内嵌 Iframe 预览窗口中，浏览器禁止在子框架内安装 PWA
    if (checkIsInIframe()) {
      if (typeof showModal === 'function') {
        showModal('📲 安装《修仙人生》至主屏幕/桌面', `
          <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
            <div style="background: rgba(212, 163, 71, 0.12); border: 1px solid rgba(212, 163, 71, 0.35); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px;">
              <b style="color: #ffe6a3;">💡 提示：当前处于内嵌预览窗口中</b>
              <p style="margin: 4px 0 0; font-size: 12px; color: #d6c8b0;">现代浏览器（Chrome/Safari/Edge）出于安全规范，<b>禁止在内嵌网页（Iframe）中直接安装 PWA</b>。必须在浏览器独立标签页中打开进行安装。</p>
            </div>

            <p style="margin-bottom: 8px;"><b>只需两步即可安装为独立 App：</b></p>
            <ol style="padding-left: 20px; margin-bottom: 12px;">
              <li>点击下方按钮在浏览器独立标签页中打开修仙人生；</li>
              <li>在新页面打开后，点击浏览器地址栏右侧的 <b>【安装应用】</b> 图标（⊕ 或 🖥️）或点击顶栏 <b>【📲 安装】</b> 按钮完成安装！</li>
            </ol>

            <a href="${curUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #c99c4c, #996f26); color: #0f1c19; font-weight: bold; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 8px 0 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              🚀 在浏览器新标签页中打开《修仙人生》
            </a>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span id="pwaCopyHint" class="c-dim" style="font-size: 12px;">也可复制链接粘贴至手机或浏览器</span>
              <button type="button" class="small" onclick="window.copyAppUrl()">📋 复制链接</button>
            </div>
          </div>
        `, [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    // 3. Chromium / Android / Edge 支持原生态安装弹窗
    const promptEvent = _deferredInstallPrompt || window.__pwaDeferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          _deferredInstallPrompt = null;
          window.__pwaDeferredPrompt = null;
          updateInstallButtonVisibility();
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      return;
    }

    // 4. Android 安卓手机专属指引（当浏览器尚未直接触发 beforeinstallprompt 事件时）
    if (checkIsAndroid()) {
      if (typeof showModal === 'function') {
        showModal('📲 安卓手机安装《修仙人生》', `
          <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
            <div style="background: rgba(45, 122, 98, 0.15); border: 1px solid rgba(77, 182, 149, 0.4); border-radius: 6px; padding: 10px 12px; margin-bottom: 12px;">
              <b style="color: #6ee7b7;">📱 安卓手机一键安装至桌面</b>
              <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">修仙人生已完全适配安卓 PWA 标准（配备 192x192 与 512x512 水墨自适应图标及离线仙境缓存）。</p>
            </div>

            <p style="margin-bottom: 8px;"><b>只需在安卓手机浏览器中操作：</b></p>
            <ol style="padding-left: 20px; margin-bottom: 12px;">
              <li>点击手机浏览器右上角的「<b>⋮</b>」（三个点）菜单按钮；</li>
              <li>在下拉菜单中找到并点击 <b>【安装应用】</b> 或 <b>【添加到主屏幕】</b>（Add to Home screen）；</li>
              <li>点击 <b>【安装】</b>，手机桌面将即刻生成《修仙人生》专属 App 图标！</li>
            </ol>
            <p style="font-size: 12px; color: #d6c8b0; margin-bottom: 10px;">💡 推荐使用 <b>Chrome 谷歌浏览器</b> 或 <b>Edge 浏览器</b> 打开，可自动生成如同原生 APK 般的独立全屏修真体验。</p>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span id="pwaCopyHint" class="c-dim" style="font-size: 12px;">如需在手机 Chrome 中打开可复制链接</span>
              <button type="button" class="small" onclick="window.copyAppUrl()">📋 复制链接</button>
            </div>
          </div>
        `, [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    // 5. iOS Safari 引导说明
    if (checkIsIOS()) {
      if (typeof showModal === 'function') {
        showModal('📲 安装《修仙人生》至主屏幕', `
          <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
            <p style="margin-bottom: 8px;">在 iPhone / iPad 上只需两步，即可拥有全屏无遮挡的原生修真体验：</p>
            <ol style="padding-left: 20px; margin-bottom: 10px;">
              <li>点击 Safari 浏览器底部栏中间的 <b>【分享】</b> 图标（方框带向上箭头 <b>⎋</b>）；</li>
              <li>在弹出菜单中向下滑动，找到并点击 <b>【添加到主屏幕】</b>（<b>➕</b>）；</li>
              <li>点击右上角 <b>【添加】</b> 完成！</li>
            </ol>
            <p class="c-gold" style="font-size: 12px;">完成后即可像独立 App 一样随时在桌面打开修仙人生！</p>
          </div>
        `, [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    // 6. 通用桌面端浏览器引导（Chrome / Edge 等若尚未触发 beforeinstallprompt）
    if (typeof showModal === 'function') {
      showModal('📲 安装《修仙人生》到桌面', `
        <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
          <p>道友可点击浏览器地址栏右侧的 <b>【安装应用】图标（⊕ 或 🖥️）</b>，或点击浏览器右上角「<b>⋮ 菜单</b>」>「<b>保存并分享 / 安装《修仙人生》</b>」，即可直接安装到电脑桌面与开始菜单，享受全屏沉浸修仙！</p>
        </div>
      `, [{ label: '知晓', fn: closeModal }]);
    }
  };

  // 复制当前游戏 URL 辅助方法
  window.copyAppUrl = function () {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          if (typeof log === 'function') log('【仙法传讯】应用链接已复制至剪贴板，可粘贴至浏览器直接打开安装！', 'c-gold');
          const hint = document.getElementById('pwaCopyHint');
          if (hint) hint.textContent = '✅ 已成功复制！请粘贴至外部浏览器直接打开安装';
        });
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        const hint = document.getElementById('pwaCopyHint');
        if (hint) hint.textContent = '✅ 已成功复制！请粘贴至外部浏览器直接打开安装';
      }
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // 注册 Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      const doRegister = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
            // 自动检查更新
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        doRegister();
      } else {
        window.addEventListener('load', doRegister);
      }
    }
  }

  // 事件监听绑定
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    updateInstallButtonVisibility();
  });

  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    _isInstalled = true;
    updateInstallButtonVisibility();
    if (typeof log === 'function') {
      log('【仙府落成】《修仙人生》已成功安装至道友设备主屏幕！', 'c-good');
    }
  });

  window.addEventListener('online', () => updateOnlineStatus(true));
  window.addEventListener('offline', () => updateOnlineStatus(false));

  // 页面加载就绪初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      registerServiceWorker();
      updateInstallButtonVisibility();
      if (!navigator.onLine) updateOnlineStatus(false);
    });
  } else {
    registerServiceWorker();
    updateInstallButtonVisibility();
    if (!navigator.onLine) updateOnlineStatus(false);
  }
})();

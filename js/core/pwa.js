/* ============================================================
   js/core/pwa.js - 《修仙人生》PWA 运行控制器
   包括 Service Worker 注册、桌面/手机一键安装与离线感知
   ============================================================ */

(function () {
  let _deferredInstallPrompt = null;
  let _isInstalled = false;

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

    // 只要有 deferredPrompt 或是 iOS 或常规浏览器，皆展示方便道友点击
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

  // 全局调用的安装入口
  window.handlePwaInstallClick = async function () {
    _isInstalled = checkIsStandalone();
    if (_isInstalled) {
      if (typeof showModal === 'function') {
        showModal('已安装修仙人生', '<p>道友当前已在修仙人生独立 App 中修真，无需重复安装。</p>', [{ label: '知晓', fn: closeModal }]);
      }
      return;
    }

    // 1. Chromium / Android / Edge 支持原生态安装弹窗
    if (_deferredInstallPrompt) {
      try {
        _deferredInstallPrompt.prompt();
        const choice = await _deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          _deferredInstallPrompt = null;
          updateInstallButtonVisibility();
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      return;
    }

    // 2. iOS Safari 引导说明
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

    // 3. 通用桌面端浏览器引导（Chrome / Edge 等若尚未触发 beforeinstallprompt）
    if (typeof showModal === 'function') {
      showModal('📲 安装《修仙人生》到桌面', `
        <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-base);">
          <p>道友可点击浏览器地址栏右侧的 <b>【安装应用】图标（⊕ 或 🖥️）</b>，即可将《修仙人生》直接安装到电脑桌面与开始菜单，享受全屏沉浸修仙！</p>
        </div>
      `, [{ label: '知晓', fn: closeModal }]);
    }
  };

  // 注册 Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
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
      });
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

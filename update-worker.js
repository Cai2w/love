// 优化Service Worker更新函数
function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        // 检查更新频率提高
        registration.update()
          .then(() => {
            // 尝试强制激活新的Service Worker
            if (registration.waiting) {
              console.log('有新版本的Service Worker等待激活');
              // 通知Service Worker更新
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          })
          .catch(error => {
            console.error('更新Service Worker失败:', error);
          });
      }
    });
  }
}

// 高频检查更新
function setupPeriodicChecks() {
  // 页面可见时检查更新
  let checkInterval;
  
  function startChecks() {
    // 清除旧定时器
    if (checkInterval) clearInterval(checkInterval);
    
    // 每10分钟检查一次更新
    checkInterval = setInterval(() => {
      console.log('定期检查Service Worker更新');
      updateServiceWorker();
    }, 10 * 60 * 1000); // 10分钟
    
    // 立即执行一次检查
    updateServiceWorker();
  }
  
  function stopChecks() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }
  
  // 页面可见性变化时
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('页面可见，开始检查更新');
      startChecks();
    } else {
      console.log('页面不可见，暂停检查更新');
      stopChecks();
    }
  });
  
  // 页面加载后立即开始检查
  if (document.visibilityState === 'visible') {
    startChecks();
  }
}

// 在页面加载后设置自动更新机制
window.addEventListener('load', () => {
  // 立即尝试更新
  updateServiceWorker();
  
  // 设置定期检查
  setupPeriodicChecks();
  
  // 添加监听器，接收Service Worker的消息
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('缓存已更新，页面即将刷新');
      // 刷新页面以使用新缓存
      window.location.reload();
    }
  });
  
  // 网络状态变化时也检查更新
  window.addEventListener('online', () => {
    console.log('网络连接恢复，检查更新');
    updateServiceWorker();
  });
});

// 注册定期同步（如果浏览器支持）
async function registerPeriodicSync() {
  if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in registration) {
        await registration.periodicSync.register('check-updates', {
          // 每小时后台检查一次更新
          minInterval: 60 * 60 * 1000 // 1小时
        });
        console.log('已注册定期同步');
      }
    } catch (error) {
      console.error('注册定期同步失败:', error);
    }
  }
}

// 尝试注册定期同步
registerPeriodicSync(); 
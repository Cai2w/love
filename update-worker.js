// 强制更新Service Worker的函数
function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
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

// 在页面加载后尝试更新Service Worker
window.addEventListener('load', () => {
  // 立即尝试更新
  updateServiceWorker();
  
  // 添加监听器，接收Service Worker的消息
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('缓存已更新，页面即将刷新');
      // 刷新页面以使用新缓存
      window.location.reload();
    }
  });
});

// 暴露全局函数，用于手动触发更新
window.forceUpdate = function() {
  console.log('手动触发Service Worker更新');
  updateServiceWorker();
  // 清除缓存
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        console.log('正在删除缓存:', cacheName);
        caches.delete(cacheName);
      });
      // 刷新页面
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    });
  } else {
    // 如果Cache API不可用，至少尝试强制刷新
    window.location.reload(true);
  }
  return '正在更新应用...';
};

// 添加一个按钮到页面上，用于触发更新
function addUpdateButton() {
  // 检查按钮是否已存在
  if (document.getElementById('update-app-button')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'update-app-button';
  button.textContent = '更新应用';
  button.style.position = 'fixed';
  button.style.bottom = '80px';
  button.style.left = '20px';
  button.style.zIndex = '1000';
  button.style.padding = '8px 16px';
  button.style.borderRadius = '20px';
  button.style.backgroundColor = 'rgba(255, 143, 177, 0.8)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.fontFamily = 'Noto Serif SC, serif';
  
  button.onclick = function() {
    const result = window.forceUpdate();
    // 显示更新提示
    const toast = document.createElement('div');
    toast.textContent = result;
    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '2000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);
    
    // 显示提示
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // 3秒后移除提示
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };
  
  document.body.appendChild(button);
}

// DOM加载完成后添加更新按钮
document.addEventListener('DOMContentLoaded', addUpdateButton); 
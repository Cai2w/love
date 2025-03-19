// 缓存名称，更新版本时更改此值
const CACHE_NAME = 'heart-collection-v2';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/manifest.json',
  '/update-worker.js',
  '/public/icon/icon-128x128.png',
  '/public/icon/icon-144x144.png',
  '/public/icon/icon-152x152.png',
  '/public/icon/icon-192x192.png',
  '/public/icon/icon-384x384.png',
  '/public/icon/icon-512x512.png',
  '/public/icon/icon-72x72.png',
  '/public/icon/icon-96x96.png',
  '/public/images/eat/冒菜.png',
  '/public/images/eat/一起吃冒菜.png',
  '/public/images/eat/肥姨妈螺蛳粉.png',
  '/public/images/eat/一起吃肥姨妈.png',
  'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;700&display=swap'
];

// 添加版本检查的URL
const VERSION_CHECK_URL = '/config.js';

// 添加消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker收到跳过等待命令');
    self.skipWaiting();
    // 通知所有客户端缓存已更新
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'CACHE_UPDATED' });
      });
    });
  }
});

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  console.log('Service Worker安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('预缓存完成，准备跳过等待');
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存并检查更新
self.addEventListener('activate', event => {
  console.log('Service Worker激活中...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkForUpdates(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('Service Worker现在控制页面');
    })
  );
});

// 周期性检查更新
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    console.log('定期检查更新...');
    event.waitUntil(checkForUpdates());
  }
});

// 请求拦截 - 智能缓存策略
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 检查是否是音乐请求，如果是则不拦截，直接交给浏览器处理
  const isMusicRequest = url.href.includes('music.163.com') || url.href.includes('.mp3');
  
  // 检查URL协议是否为http或https，跳过chrome-extension等不支持的协议
  const isUnsupportedScheme = !url.protocol.startsWith('http');
  
  if (isMusicRequest || isUnsupportedScheme) {
    // 音乐请求或不支持的协议直接通过，不做任何拦截或缓存
    return;
  }
  
  // 对于config.js文件，使用网络优先策略
  if (event.request.url.includes('config.js')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 获取到网络响应后，更新缓存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // 网络请求失败才使用缓存
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 处理其他请求 - 缓存优先，网络回退
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中 - 返回缓存的响应
        if (response) {
          // 在后台检查更新
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                // 更新缓存
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, networkResponse.clone());
                  });
              }
            })
            .catch(() => {
              // 网络请求失败，不做处理
            });
          
          return response;
        }
        
        // 缓存未命中 - 发起网络请求
        return fetch(event.request)
          .then(response => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应 - 因为响应是流，只能使用一次
            const responseToCache = response.clone();
            
            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // 离线时，对页面请求尝试返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // 其他资源请求失败时不做特殊处理
            return;
          });
      })
  );
});

// 检查更新函数
function checkForUpdates() {
  console.log('检查更新...');
  return fetch(VERSION_CHECK_URL, { cache: 'no-cache' })
    .then(response => {
      if (!response || response.status !== 200) {
        throw new Error('无法检查更新');
      }
      console.log('获取到新的配置文件');
      // 强制刷新缓存中的配置文件
      return caches.open(CACHE_NAME).then(cache => {
        return cache.put(new Request(VERSION_CHECK_URL), response);
      });
    })
    .catch(error => {
      console.error('检查更新失败:', error);
    });
} 
// 缓存名称，更新版本时更改此值
const CACHE_NAME = 'heart-collection-v1';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/manifest.json',
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

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 只处理非音乐请求
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
  
  // 处理其他非音乐请求
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中 - 返回缓存的响应
        if (response) {
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
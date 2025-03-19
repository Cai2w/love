// 缓存名称 - 更新版本号会强制更新所有缓存
const CACHE_NAME = 'heart-collection-v2';

// 配置文件URL，用于检查更新
const VERSION_CHECK_URL = '/config.js';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/config.js', 
  '/manifest.json',
  '/sw.js',
  '/public/icon/icon-72x72.png',
  '/public/icon/icon-96x96.png',
  '/public/icon/icon-128x128.png',
  '/public/icon/icon-144x144.png',
  '/public/icon/icon-152x152.png',
  '/public/icon/icon-192x192.png',
  '/public/icon/icon-384x384.png',
  '/public/icon/icon-512x512.png'
];

// 安装事件 - 创建缓存
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中');
  // 预缓存关键资源
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存资源中');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error('无法缓存资源:', url, err);
              // 继续执行而不中断整个过程
              return Promise.resolve();
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 资源缓存完成');
        // 立即激活，不等待旧的Service Worker终止
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中');
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim(),
      // 激活后立即检查更新
      checkForUpdates()
    ])
  );
});

// 处理消息事件
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] 收到跳过等待指令');
    self.skipWaiting();
    // 通知所有客户端缓存已更新
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'CACHE_UPDATED' });
      });
    });
  }
});

// 后台同步事件 - 定期检查更新
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    console.log('[Service Worker] 执行定期更新检查');
    event.waitUntil(checkForUpdates());
  }
});

// 检查更新函数
async function checkForUpdates() {
  console.log('[Service Worker] 检查资源更新');
  
  try {
    // 检查配置文件是否有更新
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(VERSION_CHECK_URL);
    
    if (!cachedResponse) {
      console.log('[Service Worker] 缓存中没有配置文件，跳过检查');
      return;
    }
    
    // 从网络获取最新版本
    const networkResponse = await fetch(VERSION_CHECK_URL, { 
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!networkResponse.ok) {
      throw new Error('网络请求失败');
    }
    
    // 比较网络和缓存版本
    const cachedData = await cachedResponse.text();
    const networkData = await networkResponse.clone().text();
    
    if (cachedData !== networkData) {
      console.log('[Service Worker] 检测到配置文件更新，更新缓存');
      // 更新缓存
      await cache.put(VERSION_CHECK_URL, networkResponse);
      
      // 通知所有客户端
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'CACHE_UPDATED' });
      });
    } else {
      console.log('[Service Worker] 配置文件未变化');
    }
  } catch (error) {
    console.error('[Service Worker] 检查更新出错:', error);
  }
}

// 响应网络请求
self.addEventListener('fetch', event => {
  // 提取URL和请求方法
  const url = new URL(event.request.url);
  const method = event.request.method;
  
  // 只处理GET请求
  if (method !== 'GET') {
    return;
  }
  
  // 处理config.js - 网络优先策略
  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // 其他资源 - 缓存优先，网络作为后备
  event.respondWith(cacheFirstStrategy(event.request));
});

// 网络优先策略 - 适用于经常变化的资源
async function networkFirstStrategy(request) {
  try {
    // 尝试从网络获取
    console.log('[Service Worker] 网络优先策略:', request.url);
    const networkResponse = await fetch(request, { 
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    // 如果成功获取，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 网络请求失败，回退到缓存
    console.log('[Service Worker] 网络请求失败，回退到缓存:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果缓存也没有，返回错误页面
    console.error('[Service Worker] 无法提供资源:', request.url);
    return new Response('网络请求失败，且缓存中无此资源', { status: 503 });
  }
}

// 缓存优先策略 - 适用于不常变化的资源
async function cacheFirstStrategy(request) {
  // 先查询缓存
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 有缓存，直接返回
    console.log('[Service Worker] 从缓存提供:', request.url);
    return cachedResponse;
  }
  
  // 没有缓存，尝试网络请求
  console.log('[Service Worker] 缓存未命中，从网络获取:', request.url);
  try {
    const networkResponse = await fetch(request);
    
    // 如果成功获取，添加到缓存
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 网络请求失败:', request.url);
    // 对于导航请求，返回离线页面（如果有的话）
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // 最后都失败了，返回基本错误信息
    return new Response('网络请求失败，且缓存中无此资源', { status: 503 });
  }
} 
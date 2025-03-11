// 改为使用单一声明
let config = {};

// 添加一个配置初始化函数，在init函数顶部调用
function initConfig() {
    // 直接获取全局变量
    if (typeof siteConfig !== 'undefined') {
        config = siteConfig;
        return true;
    } else {
        console.error("无法读取siteConfig配置数据！");
        // 尝试从window对象中读取
        if (window.siteConfig) {
            config = window.siteConfig;
            return true;
        }
        return false;
    }
}

// 添加回丢失的变量声明
// 添加状态标志，防止重复渲染
let contentRendered = false;
let photosRendered = false;

// 添加一个标志，记录许愿树是否已经初始化过
let wishTreeInitialized = false;


// 页面控制
let currentPage = 0;
const pages = document.querySelectorAll('.page');
let isAnimating = false;

// 许愿树数据
let wishes = [];

// DOM 元素
const wishContainer = document.getElementById('wishContainer');
const restartBtn = document.getElementById('restartBtn');

// 重构全局滚动处理逻辑
// 新增可滚动区域标识
const SCROLLABLE_SELECTORS = [
    '.scrollable-content',
    '.wish-container',
    '.letter-content',
    '.photo-wall',
    '.gallery-content'
];

// 检查元素是否可滚动
function isElementScrollable(element) {
    if (!element || !element.style) return false;
    
    // 获取计算样式
    const style = window.getComputedStyle(element);
    const overflowY = style.getPropertyValue('overflow-y');
    
    // 检查是否有垂直滚动条
    const hasScrollbar = overflowY === 'scroll' || overflowY === 'auto';
    
    // 检查内容是否超出可视区域
    const contentOverflows = element.scrollHeight > element.clientHeight;
    
    return hasScrollbar && contentOverflows;
}

// 添加一些全局变量用于滚动缓冲处理
let scrollThreshold = 50; // 滚动缓冲阈值（像素）
let scrollBuffer = 0; // 当前滚动缓冲值
let lastScrollDirection = 0; // 最后一次滚动方向
let scrollDebounceTimer = null; // 滚动防抖定时器
let pageChangeThreshold = 3; // 需要累积的连续滚动次数才能触发页面切换
let consecutiveScrolls = 0; // 连续滚动计数器
let boundaryReached = false; // 是否到达滚动边界
let boundaryReachedTime = 0; // 到达滚动边界的时间
let boundaryDelay = 800; // 到达边界后需要等待的毫秒数才能切换页面

// 修改滚轮事件处理，添加缓冲和延迟机制
function handleWheel(e) {
    // 获取事件发生的元素
    const target = e.target;
    
    // 查找当前可能的可滚动容器
    const scrollableContainer = findScrollableParent(target);
    
    // 如果找到可滚动容器
    if (scrollableContainer) {
        // 检查是否已经滚动到边界
        const isAtTop = scrollableContainer.scrollTop <= 0;
        const isAtBottom = scrollableContainer.scrollTop + scrollableContainer.clientHeight >= scrollableContainer.scrollHeight - 5; // 允许小误差
        
        // 判断滚动方向
        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;
        
        // 重置连续滚动计数器，如果方向改变
        if ((isScrollingUp && lastScrollDirection > 0) || (isScrollingDown && lastScrollDirection < 0)) {
            consecutiveScrolls = 0;
            boundaryReached = false;
        }
        
        // 更新最后滚动方向
        lastScrollDirection = isScrollingUp ? -1 : 1;
        
        // 处理边界滚动
        if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
            // 如果刚到达边界，记录时间
            if (!boundaryReached) {
                boundaryReached = true;
                boundaryReachedTime = Date.now();
                // 显示视觉提示，提醒用户继续滚动可以切换页面
                showPageChangeIndicator(isScrollingUp);
            }
            
            // 增加连续滚动计数
            consecutiveScrolls++;
            
            // 检查是否已经在边界停留足够时间并有足够的连续滚动
            const timeAtBoundary = Date.now() - boundaryReachedTime;
            if (timeAtBoundary > boundaryDelay && consecutiveScrolls >= pageChangeThreshold) {
                // 重置状态
                consecutiveScrolls = 0;
                boundaryReached = false;
                
                // 隐藏提示
                hidePageChangeIndicator();
                
                // 触发页面切换
                e.preventDefault();
                if (isScrollingUp && currentPage > 0) {
                    scrollToPage(currentPage - 1);
                } else if (isScrollingDown && currentPage < pages.length - 1) {
                    scrollToPage(currentPage + 1);
                }
            }
            
            // 阻止默认滚动，避免出现橡皮筋效果
            e.preventDefault();
            return;
        } else {
            // 如果不在边界，重置状态
            boundaryReached = false;
            consecutiveScrolls = 0;
            hidePageChangeIndicator();
        }
        
        // 内容可以正常滚动，不做特殊处理
        return;
    }
    
    // 如果不在可滚动区域，处理页面切换
    e.preventDefault();
    
    if (isAnimating) return;
    
    // 累积滚动值
    scrollBuffer += e.deltaY;
    
    // 清除之前的定时器
    if (scrollDebounceTimer) {
        clearTimeout(scrollDebounceTimer);
    }
    
    // 设置定时器在短时间内重置缓冲区
    scrollDebounceTimer = setTimeout(() => {
        scrollBuffer = 0;
    }, 200);
    
    // 如果累积滚动超过阈值，触发页面切换
    if (Math.abs(scrollBuffer) > scrollThreshold) {
        // 向下滚动
        if (scrollBuffer > 0 && currentPage < pages.length - 1) {
            scrollToPage(currentPage + 1);
        } 
        // 向上滚动
        else if (scrollBuffer < 0 && currentPage > 0) {
            scrollToPage(currentPage - 1);
        }
        
        // 重置缓冲区
        scrollBuffer = 0;
    }
}

// 添加检测移动设备的函数
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
}

// 添加页面切换指示器函数
function showPageChangeIndicator(isScrollingUp) {
    // 如果是移动设备，直接返回不显示指示器
    if (isMobileDevice()) {
        return;
    }
    
    // 创建或获取指示器元素
    let indicator = document.getElementById('pageChangeIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'pageChangeIndicator';
        indicator.className = 'page-change-indicator';
        document.body.appendChild(indicator);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .page-change-indicator {
                position: fixed;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(255, 255, 255, 0.7);
                color: #333;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            .page-change-indicator.top {
                top: 20px;
            }
            .page-change-indicator.bottom {
                bottom: 20px;
            }
            .page-change-indicator.visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 设置位置和文本
    indicator.className = 'page-change-indicator ' + (isScrollingUp ? 'top' : 'bottom');
    indicator.textContent = isScrollingUp ? '继续上滑切换到上一页' : '继续下滑切换到下一页';
    
    // 显示指示器
    setTimeout(() => {
        indicator.classList.add('visible');
    }, 10);
}

function hidePageChangeIndicator() {
    const indicator = document.getElementById('pageChangeIndicator');
    if (indicator) {
        indicator.classList.remove('visible');
    }
}

// 查找可滚动的父元素
function findScrollableParent(element) {
    if (!element) return null;
    
    // 直接检查元素自身
    if (isElementScrollable(element)) {
        return element;
    }
    
    // 向上查找可滚动的父元素
    let parent = element.parentElement;
    while (parent) {
        if (isElementScrollable(parent)) {
            return parent;
        }
        
        // 也检查匹配选择器的元素
        if (SCROLLABLE_SELECTORS.some(selector => 
            parent.matches && parent.matches(selector) && parent.scrollHeight > parent.clientHeight
        )) {
            return parent;
        }
        
        parent = parent.parentElement;
    }
    
    return null;
}

// 添加触摸相关的全局变量
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;
let touchTargetElement = null;
let touchScrollContainer = null;
let isTouchScrolling = false;
let touchBoundaryReached = false;
let touchBoundaryReachedTime = 0;
let consecutiveTouchMoves = 0;
let lastTouchDirection = 0;

function handleTouchStart(e) {
    // 记录初始触摸位置
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = new Date().getTime();
    
    // 查找可滚动容器
    touchTargetElement = e.target;
    touchScrollContainer = findScrollableParent(touchTargetElement);
    
    // 初始化标志
    isTouchScrolling = false;
    consecutiveTouchMoves = 0;
    touchBoundaryReached = false;
}

function handleTouchMove(e) {
    if (!touchStartY) return;
    
    const touchY = e.touches[0].clientY;
    const touchDiff = touchStartY - touchY;
    const touchDirection = touchDiff > 0 ? 1 : -1; // 1表示向下滑动（手指向上移动），-1表示向上滑动
    
    // 如果方向改变，重置计数
    if ((touchDirection > 0 && lastTouchDirection < 0) || (touchDirection < 0 && lastTouchDirection > 0)) {
        consecutiveTouchMoves = 0;
        touchBoundaryReached = false;
        hidePageChangeIndicator();
    }
    
    // 更新最后方向
    lastTouchDirection = touchDirection;
    
    // 如果有可滚动容器
    if (touchScrollContainer) {
        // 检查是否已经滚动到边界
        const isAtTop = touchScrollContainer.scrollTop <= 0;
        const isAtBottom = touchScrollContainer.scrollTop + touchScrollContainer.clientHeight >= touchScrollContainer.scrollHeight - 5;
        
        // 在边界处检测
        if ((touchDiff > 5 && isAtBottom) || (touchDiff < -5 && isAtTop)) {
            // 如果是第一次到达边界
            if (!touchBoundaryReached) {
                touchBoundaryReached = true;
                touchBoundaryReachedTime = Date.now();
                // 显示提示
                showPageChangeIndicator(touchDiff < 0);
            }
            
            // 增加连续移动计数
            consecutiveTouchMoves++;
            
            // 判断是否需要阻止默认行为（防止过度滚动效果）
            if (Math.abs(touchDiff) > 10) {
                try {
                    e.preventDefault();
                } catch (err) {
                    // 某些浏览器可能不允许阻止默认行为
                }
            }
            
            // 检查是否可以触发页面切换
            const timeAtBoundary = Date.now() - touchBoundaryReachedTime;
            if (timeAtBoundary > boundaryDelay/2 && consecutiveTouchMoves >= pageChangeThreshold) {
                isTouchScrolling = true;
            }
        } else {
            // 重置状态
            touchBoundaryReached = false;
            hidePageChangeIndicator();
        }
    } else {
        // 不在可滚动区域，设置滚动标志
        if (Math.abs(touchDiff) > 10) {
            try {
                e.preventDefault();
            } catch (err) {
                // 某些浏览器可能不允许阻止默认行为
            }
            isTouchScrolling = true;
        }
    }
}

function handleTouchEnd(e) {
    if (!touchStartY) return;
    
    // 计算触摸的垂直距离和时间
    const touchY = e.changedTouches[0].clientY;
    const touchDiff = touchStartY - touchY;
    const timeDiff = new Date().getTime() - touchStartTime;
    
    // 隐藏提示
    hidePageChangeIndicator();
    
    // 只在以下情况下处理页面切换：
    // 1. 是快速滑动手势
    // 2. 或者是在边界持续滑动
    const isSwipeGesture = Math.abs(touchDiff) > 80 && timeDiff < 300;
    
    // 如果在可滚动容器内
    if (touchScrollContainer) {
        // 检查是否已经滚动到边界
        const isAtTop = touchScrollContainer.scrollTop <= 0;
        const isAtBottom = touchScrollContainer.scrollTop + touchScrollContainer.clientHeight >= touchScrollContainer.scrollHeight - 5;
        
        // 只有在边界处的滑动或者是快速滑动手势才触发页面切换
        if (isSwipeGesture || (isTouchScrolling && touchBoundaryReached)) {
            // 向下滑动（手指向上移动）且在底部
            if (touchDiff > 50 && isAtBottom && currentPage < pages.length - 1) {
                scrollToPage(currentPage + 1);
            } 
            // 向上滑动（手指向下移动）且在顶部
            else if (touchDiff < -50 && isAtTop && currentPage > 0) {
                scrollToPage(currentPage - 1);
            }
        }
    } else {
        // 不在可滚动区域，检查是否是滑动手势
        if (isSwipeGesture || isTouchScrolling) {
            // 向下滑动（手指向上移动）
            if (touchDiff > 50 && currentPage < pages.length - 1) {
                scrollToPage(currentPage + 1);
            } 
            // 向上滑动（手指向下移动）
            else if (touchDiff < -50 && currentPage > 0) {
                scrollToPage(currentPage - 1);
            }
        }
    }
    
    // 重置触摸相关变量
    touchStartY = 0;
    touchStartX = 0;
    touchScrollContainer = null;
    isTouchScrolling = false;
    touchBoundaryReached = false;
    consecutiveTouchMoves = 0;
}

// 或者，我们可以替换整个函数为更简单的方法
function disableSingleClickPageChange() {
    // 添加一个透明遮罩层来捕获点击事件但不做任何反应
    const clickGuard = document.createElement('div');
    clickGuard.style.position = 'fixed';
    clickGuard.style.top = '0';
    clickGuard.style.left = '0';
    clickGuard.style.width = '100%';
    clickGuard.style.height = '100%';
    clickGuard.style.zIndex = '1'; // 低于页面内容
    clickGuard.style.pointerEvents = 'all';
    clickGuard.style.background = 'transparent';
    
    // 阻止点击导致页面切换
    clickGuard.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 允许其他元素点击
    document.querySelectorAll('a, button, input, .photo-card, .music-player, .wish-item, .nav-dot').forEach(el => {
        el.style.position = 'relative';
        el.style.zIndex = '2'; // 高于遮罩层
    });
    
    document.body.appendChild(clickGuard);
}

// 处理键盘事件
function handleKeyDown(e) {
    if (isAnimating) return;
    
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (currentPage < pages.length - 1) {
            scrollToPage(currentPage + 1);
        }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (currentPage > 0) {
            scrollToPage(currentPage - 1);
        }
    }
}

// 页面滚动控制
function scrollToPage(index) {
    if (isAnimating || index === currentPage || index < 0 || index >= pages.length) return;
    
    isAnimating = true;
    
    // 更新导航点
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
    
    // 如果即将切换到许愿树页面，提前准备好动画状态
    if (index === 3 && !pages[index].classList.contains('active')) {
        prepareWishTreeAnimation();
    }
    
    // 隐藏当前页面
    pages[currentPage].classList.remove('active');
    
    // 显示新页面
    setTimeout(() => {
        pages[index].classList.add('active');
        currentPage = index;
        
        // 如果是切换到许愿树页面，触发平滑动画
        if (index === 3) {
            setTimeout(triggerWishTreeAnimation, 50);
        }
        
        isAnimating = false;
    }, 500);
}

// 渲染页面内容
function renderPageContent() {
    if (contentRendered) {
        console.log("页面内容已渲染，跳过");
        return;
    }
    
    console.log("开始渲染页面内容...");
    
    try {
        // 设置主标题和副标题
        if (document.getElementById('mainTitle')) {
            document.getElementById('mainTitle').textContent = config.title || '时光的印记';
        } else {
            console.error("找不到mainTitle元素");
        }
        
        if (document.getElementById('subTitle')) {
            document.getElementById('subTitle').textContent = config.subtitle || '与你同行';
        } else {
            console.error("找不到subTitle元素");
        }
        
        // 渲染情书内容
        if (config.letter) {
            const letterTitleElem = document.getElementById('letterTitle');
            const letterContentElem = document.getElementById('letterContent');
            
            if (letterTitleElem) {
                letterTitleElem.textContent = config.letter.title || '一封未寄出的信';
            } else {
                console.error("找不到letterTitle元素");
            }
            
            if (letterContentElem) {
                letterContentElem.innerHTML = '';
                
                if (config.letter.content && Array.isArray(config.letter.content)) {
                    config.letter.content.forEach(paragraph => {
                        const p = document.createElement('p');
                        p.innerHTML = paragraph;
                        letterContentElem.appendChild(p);
                    });
                }
            } else {
                console.error("找不到letterContent元素");
            }
        }
        
        // 设置许愿树标题
        if (config.wishTree) {
            if (document.getElementById('wishTitle')) {
                document.getElementById('wishTitle').textContent = config.wishTree.title || '许愿树';
            }
            
            if (document.getElementById('wishSubtitle')) {
                document.getElementById('wishSubtitle').textContent = config.wishTree.subtitle || '在这里留下一些小心思...';
            }
        }
        
        // 设置结尾页
        if (config.ending) {
            if (document.getElementById('endingTitle')) {
                document.getElementById('endingTitle').textContent = config.ending.title || '如果可以，我想和你...';
            }
            
            if (document.getElementById('endingSignature')) {
                document.getElementById('endingSignature').textContent = config.ending.signature || '—— 一起数星星';
            }
            
            if (restartBtn) {
                restartBtn.textContent = config.ending.buttonText || '回到开始';
            }
        }
        
        console.log("页面内容渲染成功");
    } catch (error) {
        console.error("渲染页面内容时出错:", error);
    }
    
    contentRendered = true;
}

// 优化照片墙渲染函数
function renderPhotoWall() {
    console.log("开始渲染照片墙...");
    
    if (photosRendered) {
        console.log("照片墙已经渲染过，跳过");
        return;
    }
    
    const photoWall = document.getElementById('photoWall');
    if (!photoWall) {
        console.error("找不到照片墙容器元素");
        return;
    }
    
    // 清空现有内容
    photoWall.innerHTML = '';
    
    // 检查照片数据
    if (!config.photos || !Array.isArray(config.photos) || config.photos.length === 0) {
        photoWall.innerHTML = '<div class="error-message">还没有照片数据哦 快快记录起来~</div>';
        return;
    }
    
    console.log("找到 " + config.photos.length + " 张照片，开始渲染");

    
    // 创建照片元素
    config.photos.forEach((photo, index) => {
        // 创建照片容器
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.style.animationDelay = `${index * (isMobileDevice() ? 0.1 : 0.075)}s`;
        
        // 添加照片装饰边框
        const photoBorder = document.createElement('div');
        photoBorder.className = 'photo-border';
        photoCard.appendChild(photoBorder);
        
        // 随机添加分类标签
        const tags = ['回忆', '风景', '特别', '爱', '旅行', '生活', '瞬间', '美好'];
        if (Math.random() > 0.4) {
            const randomTag = tags[Math.floor(Math.random() * tags.length)];
            const tagElem = document.createElement('div');
            tagElem.className = 'photo-tag';
            tagElem.textContent = randomTag;
            photoCard.appendChild(tagElem);
        }
        
        // 创建照片图片元素
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.caption || '照片';
        img.loading = 'lazy';
        
        // 添加加载事件监听
        img.onload = function() {
            photoCard.classList.add('loaded');
            console.log(`照片 ${index + 1} 加载完成`);
        };
        
        img.onerror = function() {
            console.error(`照片 ${index + 1} (${photo.url}) 加载失败`);
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmOGZiMSI+PHBhdGggZD0iTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyYTEwIDEwIDAgMCAxIDEwIDEwYzAgNS41MjMtNC40NzcgMTAtMTAgMTB6bTEtN3YyaC0ydi0yaDJ6bTAtMTBWMTNoLTJWNWgyeiIvPjwvc3ZnPg==';
            photoCard.classList.add('error');
        };
        
        // 创建照片信息元素
        const photoInfo = document.createElement('div');
        photoInfo.className = 'photo-info';
        
        // 添加标题
        if (photo.caption) {
            const caption = document.createElement('div');
            caption.className = 'photo-caption';
            caption.textContent = photo.caption;
            photoInfo.appendChild(caption);
        }
        
        // 添加日期
        if (photo.date) {
            const date = document.createElement('div');
            date.className = 'photo-date';
            date.textContent = photo.date;
            photoInfo.appendChild(date);
            
            // 添加照片日期戳
            const dateStamp = document.createElement('div');
            dateStamp.className = 'photo-date-stamp';
            dateStamp.textContent = photo.date;
            photoCard.appendChild(dateStamp);
        }
        
        // 组装照片卡片
        photoCard.appendChild(img);
        photoCard.appendChild(photoInfo);
        photoWall.appendChild(photoCard);
        
        // 保留点击整个卡片全屏查看的功能，但阻止事件冒泡
        photoCard.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，防止触发页面切换
            openPhotoFullscreen(photo);
        });
    });
    
    // 改进照片全屏查看功能，添加移动端放大支持
    function openPhotoFullscreen(photo) {
        // 创建全屏照片查看器
        const viewer = document.createElement('div');
        viewer.className = 'photo-fullscreen-viewer';
        
        // 创建关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.className = 'fullscreen-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', function() {
            viewer.classList.add('closing');
            setTimeout(() => viewer.remove(), 300);
        });
        
        // 创建图片容器
        const imgContainer = document.createElement('div');
        imgContainer.className = 'fullscreen-img-container';
        
        // 创建照片
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.caption || '照片';
        img.className = 'fullscreen-image';
        
        // 创建图片信息
        const infoDiv = document.createElement('div');
        infoDiv.className = 'fullscreen-info';
        
        if (photo.caption) {
            const captionDiv = document.createElement('div');
            captionDiv.className = 'fullscreen-caption';
            captionDiv.textContent = photo.caption;
            infoDiv.appendChild(captionDiv);
        }
        
        if (photo.date) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'fullscreen-date';
            dateDiv.textContent = photo.date;
            infoDiv.appendChild(dateDiv);
        }
        
        // 组装全屏查看器
        imgContainer.appendChild(img);
        viewer.appendChild(closeBtn);
        viewer.appendChild(imgContainer);
        viewer.appendChild(infoDiv);
        document.body.appendChild(viewer);
        
        
        // 移动端手势变量
        let startX, startY, initialPinchDistance;
        let currentScale = 1;
        let currentTranslateX = 0;
        let currentTranslateY = 0;
        let isZoomed = false;
        
        // 处理双击缩放
        imgContainer.addEventListener('dblclick', function(e) {
            e.preventDefault();
            
            if (isZoomed) {
                // 重置缩放
                currentScale = 1;
                currentTranslateX = 0;
                currentTranslateY = 0;
                isZoomed = false;
            } else {
                // 放大到双倍
                currentScale = 2;
                
                // 计算点击位置为缩放中心
                const rect = imgContainer.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                
                currentTranslateX = (offsetX - rect.width / 2) * -1;
                currentTranslateY = (offsetY - rect.height / 2) * -1;
                
                isZoomed = true;
            }
            
            updateImageTransform();
        });
        
        // 触摸事件处理 - 支持拖动和捏合缩放
        if (isMobileDevice()) {
            imgContainer.addEventListener('touchstart', function(e) {
                // 防止页面滚动
                e.preventDefault();
                
                if (e.touches.length === 1) {
                    // 单指触摸 - 准备拖动
                    startX = e.touches[0].clientX - currentTranslateX;
                    startY = e.touches[0].clientY - currentTranslateY;
                } 
                else if (e.touches.length === 2) {
                    // 双指触摸 - 准备缩放
                    initialPinchDistance = getPinchDistance(e);
                }
            }, { passive: false });
            
            imgContainer.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                if (e.touches.length === 1 && isZoomed) {
                    // 单指拖动 - 只有在放大状态下才能拖动
                    currentTranslateX = e.touches[0].clientX - startX;
                    currentTranslateY = e.touches[0].clientY - startY;
                    
                    // 限制拖动范围
                    const maxTranslate = (currentScale - 1) * imgContainer.offsetWidth / 2;
                    currentTranslateX = Math.max(-maxTranslate, Math.min(maxTranslate, currentTranslateX));
                    currentTranslateY = Math.max(-maxTranslate, Math.min(maxTranslate, currentTranslateY));
                    
                    updateImageTransform();
                } 
                else if (e.touches.length === 2) {
                    // 双指缩放
                    const currentDistance = getPinchDistance(e);
                    const scaleFactor = currentDistance / initialPinchDistance;
                    
                    // 计算新的缩放值，限制在1.0-3.0之间
                    currentScale = Math.max(1, Math.min(3, scaleFactor * currentScale));
                    
                    isZoomed = currentScale > 1.05;
                    
                    // 如果缩放回到接近1，则重置位置
                    if (!isZoomed) {
                        currentTranslateX = 0;
                        currentTranslateY = 0;
                    }
                    
                    updateImageTransform();
                    initialPinchDistance = currentDistance;
                }
            }, { passive: false });
            
            imgContainer.addEventListener('touchend', function(e) {
                // 如果只有一个手指，并且已经缩放
                if (e.touches.length === 0 && isZoomed) {
                    // 如果缩放很小，重置到正常大小
                    if (currentScale < 1.1) {
                        currentScale = 1;
                        currentTranslateX = 0;
                        currentTranslateY = 0;
                        isZoomed = false;
                        updateImageTransform();
                    }
                }
            });
        }
        
        // 更新图片变换
        function updateImageTransform() {
            img.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
            
            // 如果放大了，隐藏信息
            if (isZoomed) {
                infoDiv.style.opacity = '0';
            } else {
                infoDiv.style.opacity = '1';
            }
        }
        
        // 计算两指之间的距离
        function getPinchDistance(e) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        // 确保全屏查看器的点击事件不冒泡
        viewer.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡到文档
            
            if (e.target === viewer || e.target === imgContainer) {
                if (!isZoomed) {
                    viewer.classList.add('closing');
                    setTimeout(() => viewer.remove(), 300);
                }
            }
        });
        
        // 为移动端添加点击事件处理
        if (isMobileDevice()) {
            // 添加移动端提示
            const zoomHint = document.createElement('div');
            zoomHint.className = 'zoom-hint';
            zoomHint.textContent = '双指缩放或双击放大查看';
            viewer.appendChild(zoomHint);
            
            // 3秒后隐藏提示
            setTimeout(() => {
                zoomHint.style.opacity = '0';
                setTimeout(() => zoomHint.remove(), 500);
            }, 3000);
            
            // 确保图片容器的点击事件也不会冒泡
            imgContainer.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            // 确保全屏图片的触摸事件也不会冒泡
            img.addEventListener('touchstart', function(e) {
                e.stopPropagation();
            }, { passive: false });
        }
        
        // 支持ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.contains(viewer)) {
                viewer.classList.add('closing');
                setTimeout(() => viewer.remove(), 300);
            }
        });
    }
    
    // 优化滚动体验
    const smoothScrollToPhoto = (photoIndex) => {
        const photos = photoWall.querySelectorAll('.photo-card');
        if (photos[photoIndex]) {
            photos[photoIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };
    
    // 标记为已渲染
    photosRendered = true;
    console.log("照片墙渲染完成");
}

// 重写setupEventListeners函数中的滚动相关部分
function setupEventListeners() {
    // 点击导航点切换页面
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            scrollToPage(index);
        });
    });
    
    // 监听滚轮事件
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    // 监听触摸事件
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // 监听键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
    // 设置重新开始按钮事件
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            scrollToPage(0);
        });
    }
    
    // 为许愿树添加事件（如果有许愿树相关功能）
    setupWishTreeEvents();
}

// 添加设置许愿树事件的函数
function setupWishTreeEvents() {
    // 查找许愿树相关元素
    const wishInput = document.getElementById('wishInput');
    const wishButton = document.getElementById('wishButton');
    const wishPasswordInput = document.getElementById('wishPasswordInput');
    
    // 如果找不到元素，说明当前页面没有许愿树功能
    if (!wishInput || !wishButton) {
        return;
    }
    
    // 为许愿按钮添加点击事件
    wishButton.addEventListener('click', function() {
        addWish();
    });
    
    // 为输入框添加回车键事件
    wishInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addWish();
        }
    });
    
    // 如果有密码输入框，也添加回车键事件
    if (wishPasswordInput) {
        wishPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyPassword();
            }
        });
    }
}



// 添加独立的函数专门用于设置重启按钮
function setupRestartButton() {
    console.log("正在设置回到开始按钮...");
    
    // 直接通过ID获取按钮，确保获取最新引用
    const restartBtn = document.getElementById('restartBtn');
    
    if (restartBtn) {
        console.log("找到重启按钮，添加事件监听器");
        
        // 移除可能存在的旧事件监听器
        const newBtn = restartBtn.cloneNode(true);
        restartBtn.parentNode.replaceChild(newBtn, restartBtn);
        
        // 添加新的事件监听器
        newBtn.addEventListener('click', function(e) {
            console.log("点击了回到开始按钮");
            e.preventDefault();
            e.stopPropagation();
            scrollToPage(0);
        });
    } else {
        console.error("无法找到回到开始按钮");
    }
}

// 修改现有的init函数，确保调用音乐播放器初始化
function init() {
    // 隐藏加载动画
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = 0;
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 1000);
        }, 1500);
    }
    
    // 加载配置
    if (!initConfig()) {
        console.error("配置加载失败！");
        return;
    }
    
    // 渲染页面内容
    renderPageContent();
    
    // 确保明确调用照片墙渲染
    renderPhotoWall();
    
    // 预渲染许愿树，但不显示
    preloadWishTree();
    
    // 添加事件监听器
    setupEventListeners();
    
    // 启动计时器
    updateTimer();
    setInterval(updateTimer, 1000);
    
    // 移除点击切换页面的行为
    disableSingleClickPageChange();
    
    console.log("初始化完成！");
}


// 添加控制加载动画的函数
function hideLoadingAnimation() {
    console.log("隐藏加载动画...");
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        // 先设置透明度为0（淡出效果）
        overlay.style.opacity = '0';
        
        // 等待过渡动画完成后移除元素
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.remove();
            console.log("加载动画已移除");
        }, 800); // 与CSS过渡时间相匹配
    }
}

// 修改加载完成事件处理
window.addEventListener('load', function() {
    // 首先初始化网站
    init();
    
    // 然后在短暂延迟后移除加载动画（确保内容完全渲染）
    setTimeout(hideLoadingAnimation, 500);
});

// 保留DOMContentLoaded事件处理
document.addEventListener('DOMContentLoaded', function() {
    // 确保滚动条隐藏
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // 确保按钮设置正确
    setTimeout(setupRestartButton, 2000);
});

// 完全重写计时器函数，确保正确处理日期
function updateTimer() {
    
    try {
        // 确保配置加载正确
        if (!config || !config.startDate) {
            console.error("无法获取开始日期配置");
            return;
        }
        
        // 清理并规范化日期格式
        let dateString = config.startDate;
        dateString = dateString.trim().replace(/\s+/g, 'T');
        if (!dateString.includes('T')) {
            dateString += 'T00:00:00';
        }
        
        
        // 创建日期对象
        const startDate = new Date(dateString);
        const now = new Date();
        
        // 检查日期是否有效
        if (isNaN(startDate.getTime())) {
            console.error("开始日期无效:", dateString);
            return;
        }
        
        // 计算时间差
        const timeDiff = now - startDate;
        
        // 计算各个时间单位
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        // 更新DOM
        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
        
    } catch (error) {
        console.error("计时器更新出错:", error);
    }
}

// 修改渲染许愿树的函数
function renderWishes() {
    // 清空容器
    if (!wishContainer) return;
    
    // 创建网格容器
    let wishGrid = document.querySelector('.wish-grid');
    if (!wishGrid) {
        wishGrid = document.createElement('div');
        wishGrid.className = 'wish-grid';
        wishContainer.appendChild(wishGrid);
    } else {
        wishGrid.innerHTML = '';
    }
    
    // 渲染所有愿望
    wishes.forEach((wish, index) => {
        const wishElement = document.createElement('div');
        wishElement.className = `wish ${wish.completed ? 'completed' : ''}`;
        
        // 创建内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'wish-content';
        contentDiv.textContent = wish.text;
        
        // 添加日期标签（如果有）
        if (wish.date && wish.completed) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'wish-date';
            dateDiv.textContent = wish.date;
            wishElement.appendChild(dateDiv);
        }
        
        // 设置不同的动画延迟
        wishElement.style.animationDelay = `${index * 0.1}s`;
        
        // 添加内容到卡片
        wishElement.appendChild(contentDiv);
        wishGrid.appendChild(wishElement);
    });
    
    console.log("已渲染 " + wishes.length + " 个愿望");
}

// 修改加载初始数据的逻辑，处理复杂对象结构
function loadWishes() {
    // 清空现有的许愿
    wishes = [];
    
    // 加载初始愿望
    if (config.wishTree && Array.isArray(config.wishTree.initialWishes)) {
        config.wishTree.initialWishes.forEach(wish => {
            // 处理新格式（对象）和旧格式（字符串）
            if (typeof wish === 'string') {
                wishes.push({text: wish, completed: false});
            } else if (typeof wish === 'object') {
                wishes.push(wish);
            }
        });
    }
    
    // 渲染显示
    renderWishes();
}


// 确保窗口调整大小时也不会出现滚动条
window.addEventListener('resize', function() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
});

// 新增预加载许愿树函数
function preloadWishTree() {
    if (wishTreeInitialized) return;
    
    console.log("预加载许愿树内容...");
    
    // 加载许愿树数据
    loadWishes();
    
    // 提前标记为初始化完成
    wishTreeInitialized = true;
    
    // 预先计算并应用所有卡片的初始状态，但暂时保持隐藏
    const wishesElements = document.querySelectorAll('.wish');
    wishesElements.forEach((wish, index) => {
        // 设置初始位置状态，避免切换时的跳动
        wish.style.opacity = '0';
        wish.style.transform = getInitialTransform(wish, index);
    });
    
    console.log("许愿树预加载完成");
}

// 帮助函数：获取愿望卡片的初始变换状态
function getInitialTransform(wish, index) {
    // 基于卡片索引生成稳定的变换值
    const baseTransform = 'translateY(0px) rotate(0deg)';
    
    // 根据卡片类型返回不同的初始变换
    if (wish.classList.contains('completed')) {
        return baseTransform;
    }
    
    return baseTransform;
}

// 准备许愿树动画
function prepareWishTreeAnimation() {
    const wishes = document.querySelectorAll('.wish');
    
    wishes.forEach((wish) => {
        // 重置到初始状态
        wish.style.opacity = '0';
        wish.style.transform = 'translateY(20px)';
        wish.style.transition = 'none';
    });
}

// 触发许愿树平滑动画
function triggerWishTreeAnimation() {
    const wishes = document.querySelectorAll('.wish');
    
    wishes.forEach((wish, index) => {
        // 强制浏览器重排
        void wish.offsetWidth;
        
        // 设置平滑过渡
        wish.style.transition = 'all 0.6s ease';
        
        // 错开显示时间，创造更平滑的效果
        setTimeout(() => {
            wish.style.opacity = '1';
            wish.style.transform = 'translateY(0)';
        }, index * 50);
    });
    
    // 动画完成后恢复正常的动画效果
    setTimeout(() => {
        wishes.forEach(wish => {
            wish.style.transition = '';
            wish.removeAttribute('style');
        });
    }, wishes.length * 50 + 600);
}

// 音乐播放器功能
const musicPlayer = {
    player: document.getElementById('musicPlayer'),
    icon: document.getElementById('musicIcon'),
    songName: document.getElementById('songName'),
    songArtist: document.getElementById('songArtist'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    audio: new Audio(),
    isPlaying: false,
    currentSongIndex: 0,
    autoHideTimer: null,
    isUserInteractingWithPlayer: false, // 标记用户是否正在与播放器交互
    playlist: [
        {
            name: 'A Thousand Years',
            artist: 'Christina Perri',
            url: 'https://music.163.com/song/media/outer/url?id=28122609.mp3'
        },
        {
            name: 'in my imagination',
            artist: 'Sød Ven',
            url: 'https://music.163.com/song/media/outer/url?id=1921752479.mp3'
        }
    ],
    
    init: function() {
        // 确保音乐播放器的样式正确
        this.player.style.position = 'fixed';
        this.player.style.bottom = '20px';
        this.player.style.right = '20px'; 
        this.player.style.zIndex = '1000';
        
        // 获取元素引用
        this.songNameElement = document.getElementById('songName');
        this.songArtistElement = document.getElementById('songArtist');
        
        // 初始化播放器
        this.loadSong(this.currentSongIndex);
        
        // 确保播放器在正确位置后再显示
        setTimeout(() => {
            this.player.classList.add('ready');
        }, 300);
        
        // 事件监听
        this.icon.addEventListener('click', () => {
            // 移动端上，点击图标只负责展开/收起播放器
            if (isMobileDevice()) {
                this.toggleExpand();
                // 重置自动收起计时器
                this.resetAutoHideTimer();
            } else {
                // 非移动端(桌面端)，点击图标仍然控制播放/暂停
                this.togglePlay();
            }
        });
        
        // 桌面端鼠标悬停展开
        if (!isMobileDevice()) {
            this.player.addEventListener('mouseenter', () => {
                this.expand();
            });
            
            this.player.addEventListener('mouseleave', () => {
                this.collapse();
            });
        }
        
        // 播放/暂停按钮
        this.playPauseBtn.addEventListener('click', (e) => {
            // 阻止事件冒泡，防止触发外层的点击事件
            e.stopPropagation();
            this.togglePlay();
            // 重置自动收起计时器
            if (isMobileDevice()) {
                this.resetAutoHideTimer();
            }
        });
        
        // 上一首
        this.prevBtn.addEventListener('click', (e) => {
            // 阻止事件冒泡
            e.stopPropagation();
            this.prevSong();
            // 重置自动收起计时器
            if (isMobileDevice()) {
                this.resetAutoHideTimer();
            }
        });
        
        // 下一首
        this.nextBtn.addEventListener('click', (e) => {
            // 阻止事件冒泡
            e.stopPropagation();
            this.nextSong();
            // 重置自动收起计时器
            if (isMobileDevice()) {
                this.resetAutoHideTimer();
            }
        });
        
        // 添加播放器内部的其他区域点击事件，防止意外收起
        this.songNameElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobileDevice()) {
                this.resetAutoHideTimer();
            }
        });
        
        this.songArtistElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobileDevice()) {
                this.resetAutoHideTimer();
            }
        });
        
        // 音频事件监听
        this.audio.addEventListener('ended', () => {
            this.nextSong();
        });
        
        this.audio.addEventListener('error', () => {
            console.error('音频加载失败，尝试下一首');
            this.nextSong();
        });
        
        // 添加窗口调整大小时重置位置的监听器
        window.addEventListener('resize', () => {
            // 确保音乐播放器位置正确
            this.player.style.position = 'fixed';
            this.player.style.bottom = '20px';
            this.player.style.right = '20px';
            this.player.style.zIndex = '1000';
        });
        
        // 防止其他脚本干扰样式
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // 如果style被修改，立即恢复
                    if (this.player.style.position !== 'fixed' || 
                        this.player.style.bottom !== '20px' || 
                        this.player.style.right !== '20px' ||
                        this.player.style.zIndex !== '1000') {
                        
                        this.player.style.position = 'fixed';
                        this.player.style.bottom = '20px';
                        this.player.style.right = '20px';
                        this.player.style.zIndex = '1000';
                    }
                }
            });
        });
        
        // 开始观察音乐播放器元素
        observer.observe(this.player, { attributes: true });
        
        // 更智能的收起机制：监听页面滚动
        window.addEventListener('scroll', () => {
            if (isMobileDevice() && this.player.classList.contains('expanded') && !this.isUserInteractingWithPlayer) {
                this.collapse();
            }
        }, { passive: true });
        
        // 监听触摸开始事件
        this.player.addEventListener('touchstart', () => {
            this.isUserInteractingWithPlayer = true;
        }, { passive: true });
        
        // 监听触摸结束事件
        this.player.addEventListener('touchend', () => {
            // 延迟重置标志，以防止滚动事件立即触发收起
            setTimeout(() => {
                this.isUserInteractingWithPlayer = false;
            }, 500);
        }, { passive: true });
        
        // 监听页面的触摸滑动事件
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isMobileDevice() || !this.player.classList.contains('expanded')) return;
            
            // 检查是否是在播放器区域内的触摸
            let targetElement = e.target;
            let isInsidePlayer = false;
            
            while (targetElement) {
                if (targetElement === this.player) {
                    isInsidePlayer = true;
                    break;
                }
                targetElement = targetElement.parentElement;
            }
            
            // 如果不是在播放器内部，且有明显的滑动
            if (!isInsidePlayer && Math.abs(e.touches[0].clientY - touchStartY) > 10) {
                this.collapse();
            }
        }, { passive: true });
        
        // 监听点击页面其他区域
        document.addEventListener('click', (e) => {
            if (!isMobileDevice()) return;
            
            // 检查点击是否在播放器外部
            let targetElement = e.target;
            let isInsidePlayer = false;
            
            while (targetElement) {
                if (targetElement === this.player) {
                    isInsidePlayer = true;
                    break;
                }
                targetElement = targetElement.parentElement;
            }
            
            // 如果点击在播放器外部，且播放器是展开状态
            if (!isInsidePlayer && this.player.classList.contains('expanded')) {
                this.collapse();
            }
        });
        
        // 监听页面切换
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                if (isMobileDevice() && this.player.classList.contains('expanded')) {
                    this.collapse();
                }
            });
        });
    },
    
    resetAutoHideTimer: function() {
        // 清除现有的计时器
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        // 如果播放器是展开状态，设置新的自动收起计时器
        if (this.player.classList.contains('expanded')) {
            this.autoHideTimer = setTimeout(() => {
                this.collapse();
            }, 5000); // 5秒后自动收起
        }
    },
    
    loadSong: function(index) {
        const song = this.playlist[index];
        
        // 更新歌曲名和歌手名
        const songNameElement = document.getElementById('songName');
        const songArtistElement = document.getElementById('songArtist');
        
        songNameElement.textContent = song.name;
        songArtistElement.textContent = song.artist;
        
        // 检查文本长度并添加滚动效果
        this.checkTextOverflow(songNameElement);
        this.checkTextOverflow(songArtistElement);
        
        this.audio.src = song.url;
    },
    
    checkTextOverflow: function(element) {
        // 获取父容器
        const container = element.closest('.text-scroll-container');
        
        // 重置滚动状态
        element.classList.remove('scrolling');
        
        // 检查文本是否溢出容器
        setTimeout(() => {
            if (element.scrollWidth > container.clientWidth) {
                // 文本溢出，添加滚动类
                element.classList.add('scrolling');
            } else {
                // 文本没有溢出，移除滚动类
                element.classList.remove('scrolling');
            }
        }, 100); // 延迟确保DOM已更新
    },
    
    playSong: function() {
        this.player.classList.add('playing');
        // 更新暂停图标
        this.playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pause-icon">
                <line x1="6" y1="4" x2="6" y2="20"></line>
                <line x1="18" y1="4" x2="18" y2="20"></line>
            </svg>
        `;
        this.isPlaying = true;
        this.audio.play();
    },
    
    pauseSong: function() {
        this.player.classList.remove('playing');
        // 更新播放图标
        this.playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="play-icon">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        this.isPlaying = false;
        this.audio.pause();
    },
    
    togglePlay: function() {
        if (this.isPlaying) {
            this.pauseSong();
        } else {
            this.playSong();
        }
    },
    
    nextSong: function() {
        this.currentSongIndex++;
        if (this.currentSongIndex >= this.playlist.length) {
            this.currentSongIndex = 0;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.playSong();
        }
    },
    
    prevSong: function() {
        this.currentSongIndex--;
        if (this.currentSongIndex < 0) {
            this.currentSongIndex = this.playlist.length - 1;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.playSong();
        }
    },
    
    expand: function() {
        this.player.classList.add('expanded');
        if (isMobileDevice()) {
            this.resetAutoHideTimer();
        }
    },
    
    collapse: function() {
        this.player.classList.remove('expanded');
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    },
    
    toggleExpand: function() {
        if (this.player.classList.contains('expanded')) {
            this.collapse();
        } else {
            this.expand();
        }
    }
};

// 在DOM加载完成后初始化音乐播放器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化其他功能...
    
    // 初始化音乐播放器
    setTimeout(() => {
        musicPlayer.init();
    }, 1000); // 延迟一秒初始化，确保页面其他元素已加载
});

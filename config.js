// 网站配置数据
var siteConfig = {
    // 基础设置
    startDate: '2025-03-08T21:00:00', // 确保使用这种格式
    title: '菜菜&崔崔',    // 网站主标题
    subtitle: '已经在一起了',        // 副标题
    
    // 情书页设置
    letter: {
        title: '一封未寄出的信',
        content: [
            '那个午后的阳光静静地洒在街角，风轻拂过树梢，带着若有若无的花香。',
            '在熙攘的人群中，目光交汇的那一刻，仿佛整个世界都安静了下来，只剩下你微笑的样子。',
            '人生是一本厚重的书，而你是我最喜欢的那个章节，一读再读，都不觉得厌倦。',
            '有人说，遇见是故事的开始，分离是故事的结局。而我希望，我们的故事没有结局。',
            '就像繁星闪烁的夜空，就像花开不败的春天，就像永不干涸的海洋，我想和你一起，见证所有的美好，共同书写属于我们的篇章。',
            '—— 菜菜'
        ]
    },
    
    // 图库设置 (新格式)
    photoGalleries: [
        {
            title: '一起吃吃吃！',          // 图库标题
            date: '2025年~',          // 图库日期
            coverIndex: 0,               // 封面图片索引，默认为0
            description: '美味的食物当然要记录下来啦', // 可选描述
            photos: [
                {
                    url: 'public/images/eat/冒菜.png',
                    caption: '冒菜！冒菜！'
                },
                {
                    url: 'public/images/eat/一起吃冒菜.png',
                    caption: '刻意摆拍组'
                },
                {
                    url: 'public/images/eat/肥姨妈螺蛳粉.png',
                    caption: 'chou~chou~的螺蛳粉'
                },
                {
                    url: 'public/images/eat/一起吃肥姨妈.png',
                    caption: '两个吃完螺蛳粉的chou人'
                },
            ]
        },
        // {
        //     title: '一起看日落',
        //     date: '2021-07-23',
        //     coverIndex: 0,
        //     photos: [
        //         {
        //             url: 'https://picsum.photos/seed/photo2/600/800',
        //             caption: '海边的夕阳'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo8/600/800',
        //             caption: '牵手瞬间'
        //         }
        //     ]
        // },
        // {
        //     title: '第一次旅行',
        //     date: '2021-08-15',
        //     coverIndex: 1,  // 使用第二张照片作为封面
        //     description: '去往那个我们一直想去的地方',
        //     photos: [
        //         {
        //             url: 'https://picsum.photos/seed/photo3/600/800',
        //             caption: '山顶的合影'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo9/600/800',
        //             caption: '我们的背影'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo10/600/800',
        //             caption: '酒店的窗外'
        //         }
        //     ]
        // },
        // {
        //     title: '崔崔的生日',
        //     date: '2021-11-28',
        //     coverIndex: 0,
        //     photos: [
        //         {
        //             url: 'https://picsum.photos/seed/photo4/600/800',
        //             caption: '生日蛋糕'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo11/600/800',
        //             caption: '吹蜡烛的瞬间'
        //         }
        //     ]
        // },
        // {
        //     title: '圣诞节的惊喜',
        //     date: '2021-12-25',
        //     coverIndex: 0,
        //     photos: [
        //         {
        //             url: 'https://picsum.photos/seed/photo5/600/800',
        //             caption: '圣诞树下的礼物'
        //         }
        //     ]
        // },
        // {
        //     title: '一周年纪念日',
        //     date: '2022-06-01',
        //     coverIndex: 0,
        //     photos: [
        //         {
        //             url: 'https://picsum.photos/seed/photo6/600/800',
        //             caption: '烛光晚餐'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo12/600/800',
        //             caption: '交换礼物'
        //         },
        //         {
        //             url: 'https://picsum.photos/seed/photo13/600/800',
        //             caption: '甜蜜一刻'
        //         }
        //     ]
        // }
    ],
    
    // 照片设置 (保留以保持向后兼容，但不再使用)
    photos: [
        {
            url: 'https://picsum.photos/seed/photo1/600/800',
            caption: '第一次约会',
            date: '2021-06-01'
        },
        {
            url: 'https://picsum.photos/seed/photo2/600/800',
            caption: '一起看日落',
            date: '2021-07-23'
        },
        {
            url: 'https://picsum.photos/seed/photo3/600/800',
            caption: '第一次旅行',
            date: '2021-08-15'
        },
        {
            url: 'https://picsum.photos/seed/photo4/600/800',
            caption: '崔崔的生日',
            date: '2021-11-28'
        },
        {
            url: 'https://picsum.photos/seed/photo5/600/800',
            caption: '圣诞节的惊喜',
            date: '2021-12-25'
        },
        {
            url: 'https://picsum.photos/seed/photo6/600/800',
            caption: '一周年纪念日',
            date: '2022-06-01'
        }
    ],
    
    // 许愿树设置
    wishTree: {
        title: '我们的愿望树',
        subtitle: '在这里留下我们的小心愿...',
        // 初始愿望
        initialWishes: [
            { text: '猫咖！猫咖！', completed: true, date: '2025-03-08' },
            { text: '一起去玉渊潭公园', completed: false },
            { text: '酉之VogueBar 微醺时刻~', completed: false},
            { text: '一起去吃驻京办！', completed: false },
            { text: '烤肉终结者', completed: true },
            { text: '一起感受东北洗浴', completed: false },
            { text: '露营！露营！露营！', completed: false},
            { text: '一起养一只小猫', completed: false }
        ],
    
    },
    
    // 结尾页设置
    ending: {
        title: '未来，我想和崔崔...',
        signature: '留下更多回忆~',
        buttonText: '回到我们的开始'
    },
    
    // 音乐播放器设置
    musicPlayer: {
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
            },
            {
                name: '小さな恋のうた',
                artist: 'BENI',
                url: 'https://music.163.com/song/media/outer/url?id=25941745.mp3'
            }
        ]
    }
}; 
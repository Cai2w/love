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
    
    // 照片设置
    // photos: [
    //     {
    //         url: 'https://picsum.photos/seed/photo1/600/800',
    //         caption: '第一次约会',
    //         date: '2021-06-01'
    //     },
    //     {
    //         url: 'https://picsum.photos/seed/photo2/600/800',
    //         caption: '一起看日落',
    //         date: '2021-07-23'
    //     },
    //     {
    //         url: 'https://picsum.photos/seed/photo3/600/800',
    //         caption: '第一次旅行',
    //         date: '2021-08-15'
    //     },
    //     {
    //         url: 'https://picsum.photos/seed/photo4/600/800',
    //         caption: '崔崔的生日',
    //         date: '2021-11-28'
    //     },
    //     {
    //         url: 'https://picsum.photos/seed/photo5/600/800',
    //         caption: '圣诞节的惊喜',
    //         date: '2021-12-25'
    //     },
    //     {
    //         url: 'https://picsum.photos/seed/photo6/600/800',
    //         caption: '一周年纪念日',
    //         date: '2022-06-01'
    //     }
    // ],
    
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
            }
        ]
    }
}; 
// 备选景点数据 - 用于行程调整时的替换推荐
// 注意：此文件已被废弃，现在使用数据库动态获取备选景点
// 保留此文件仅用于参考，实际使用请通过 API: GET /api/spots/alternatives/:spotId?city=xxx

/*
// 备选景点列表
export const ALTERNATIVE_SPOTS: Array<{
  id: string;
  name: string;
  location: string;
  type: string;
  category: string;
  isOutdoor: boolean;
  description: string;
  estimated_cost: number;
}> = [
  // 故宫博物院的备选景点
  {
    id: 'alt-1-1',
    name: '首都博物馆',
    location: '116.323428,39.917839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '北京大型综合性博物馆，收藏丰富',
    estimated_cost: 0
  },
  {
    id: 'alt-1-2',
    name: '中国美术馆',
    location: '116.407029,39.927839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '国家级美术馆，展示中国近现代艺术',
    estimated_cost: 0
  },
  {
    id: 'alt-1-3',
    name: '北京规划展览馆',
    location: '116.397029,39.907839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '展示北京城市规划和发展历程',
    estimated_cost: 0
  },

  // 天安门广场的备选景点
  {
    id: 'alt-2-1',
    name: '人民大会堂',
    location: '116.397428,39.907239',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '全国人民代表大会召开地',
    estimated_cost: 30
  },
  {
    id: 'alt-2-2',
    name: '毛主席纪念堂',
    location: '116.397528,39.907339',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '纪念毛泽东同志的场所',
    estimated_cost: 0
  },
  {
    id: 'alt-2-3',
    name: '国家大剧院',
    location: '116.387029,39.903839',
    type: '科教文化服务;展览馆;展览馆',
    category: '展览馆',
    isOutdoor: false,
    description: '国家表演艺术中心',
    estimated_cost: 40
  },

  // 国家博物馆的备选景点
  {
    id: 'alt-3-1',
    name: '军事博物馆',
    location: '116.317029,39.937839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '展示中国军事历史和武器装备',
    estimated_cost: 0
  },
  {
    id: 'alt-3-2',
    name: '自然博物馆',
    location: '116.417029,39.917839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '展示自然历史和生物多样性',
    estimated_cost: 0
  },
  {
    id: 'alt-3-3',
    name: '天文馆',
    location: '116.337029,39.947839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '展示天文学知识和天文观测',
    estimated_cost: 45
  },

  // 颐和园的备选景点
  {
    id: 'alt-4-1',
    name: '香山公园',
    location: '116.193029,39.997839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '北京著名山地公园，秋季红叶闻名',
    estimated_cost: 10
  },
  {
    id: 'alt-4-2',
    name: '北京植物园',
    location: '116.203029,40.007839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '展示各种植物和花卉',
    estimated_cost: 10
  },
  {
    id: 'alt-4-3',
    name: '奥林匹克森林公园',
    location: '116.393029,40.017839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '2008年奥运会主场馆所在地',
    estimated_cost: 0
  },

  // 天坛公园的备选景点
  {
    id: 'alt-5-1',
    name: '地坛公园',
    location: '116.427029,39.947839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '明清两代祭祀地神的场所',
    estimated_cost: 2
  },
  {
    id: 'alt-5-2',
    name: '日坛公园',
    location: '116.447029,39.927839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '明清两代祭祀日神的场所',
    estimated_cost: 0
  },
  {
    id: 'alt-5-3',
    name: '月坛公园',
    location: '116.347029,39.937839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '明清两代祭祀月神的场所',
    estimated_cost: 1
  },

  // 圆明园的备选景点
  {
    id: 'alt-6-1',
    name: '大观园',
    location: '116.367029,39.867839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '以《红楼梦》为主题的文化公园',
    estimated_cost: 40
  },
  {
    id: 'alt-6-2',
    name: '世界公园',
    location: '116.277029,39.807839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '展示世界著名建筑微缩景观',
    estimated_cost: 100
  },
  {
    id: 'alt-6-3',
    name: '北京动物园',
    location: '116.337029,39.947839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '中国最大的动物园之一',
    estimated_cost: 15
  },

  // 北海公园的备选景点
  {
    id: 'alt-7-1',
    name: '中山公园',
    location: '116.397029,39.917839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '纪念孙中山先生的公园',
    estimated_cost: 3
  },
  {
    id: 'alt-7-2',
    name: '玉渊潭公园',
    location: '116.317029,39.907839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '春季樱花盛开，秋季银杏金黄',
    estimated_cost: 10
  },
  {
    id: 'alt-7-3',
    name: '景山公园',
    location: '116.397029,39.927839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '俯瞰故宫全景的最佳地点',
    estimated_cost: 2
  },

  // 景山公园的备选景点
  {
    id: 'alt-8-1',
    name: '北海公园',
    location: '116.387029,39.927839',
    type: '风景名胜;风景名胜;公园',
    category: '公园',
    isOutdoor: true,
    description: '中国现存最古老、最完整的皇家园林',
    estimated_cost: 10
  },
  {
    id: 'alt-8-2',
    name: '南锣鼓巷',
    location: '116.407029,39.937839',
    type: '风景名胜;风景名胜;历史街区',
    category: '历史街区',
    isOutdoor: true,
    description: '北京最古老的街区之一',
    estimated_cost: 0
  },
  {
    id: 'alt-8-3',
    name: '什刹海',
    location: '116.387029,39.947839',
    type: '风景名胜;风景名胜;风景区',
    category: '风景区',
    isOutdoor: true,
    description: '北京著名的历史文化旅游风景区',
    estimated_cost: 0
  },

  // 雍和宫的备选景点
  {
    id: 'alt-9-1',
    name: '白云观',
    location: '116.327029,39.927839',
    type: '风景名胜;风景名胜;宗教场所',
    category: '宗教场所',
    isOutdoor: false,
    description: '道教全真派第一丛林',
    estimated_cost: 10
  },
  {
    id: 'alt-9-2',
    name: '法源寺',
    location: '116.367029,39.887839',
    type: '风景名胜;风景名胜;宗教场所',
    category: '宗教场所',
    isOutdoor: false,
    description: '北京城内历史最悠久的名刹',
    estimated_cost: 5
  },
  {
    id: 'alt-9-3',
    name: '广济寺',
    location: '116.377029,39.917839',
    type: '风景名胜;风景名胜;宗教场所',
    category: '宗教场所',
    isOutdoor: false,
    description: '中国佛教协会所在地',
    estimated_cost: 5
  },

  // 孔庙和国子监的备选景点
  {
    id: 'alt-10-1',
    name: '历代帝王庙',
    location: '116.377029,39.937839',
    type: '风景名胜;风景名胜;历史建筑',
    category: '历史建筑',
    isOutdoor: false,
    description: '明清两代祭祀历代帝王的场所',
    estimated_cost: 20
  },
  {
    id: 'alt-10-2',
    name: '白塔寺',
    location: '116.367029,39.927839',
    type: '风景名胜;风景名胜;宗教场所',
    category: '宗教场所',
    isOutdoor: false,
    description: '藏传佛教格鲁派寺院',
    estimated_cost: 10
  },
  {
    id: 'alt-10-3',
    name: '鲁迅博物馆',
    location: '116.347029,39.937839',
    type: '科教文化服务;博物馆;博物馆',
    category: '博物馆',
    isOutdoor: false,
    description: '纪念鲁迅先生的专题博物馆',
    estimated_cost: 0
  },
];

// 景点 ID 到备选景点的映射
const SPOT_ALTERNATIVES_MAP: Record<string, string[]> = {
  '1': ['alt-1-1', 'alt-1-2', 'alt-1-3'], // 故宫博物院
  '2': ['alt-2-1', 'alt-2-2', 'alt-2-3'], // 天安门广场
  '3': ['alt-3-1', 'alt-3-2', 'alt-3-3'], // 国家博物馆
  '4': ['alt-4-1', 'alt-4-2', 'alt-4-3'], // 颐和园
  '5': ['alt-5-1', 'alt-5-2', 'alt-5-3'], // 天坛公园
  '6': ['alt-6-1', 'alt-6-2', 'alt-6-3'], // 圆明园
  '7': ['alt-7-1', 'alt-7-2', 'alt-7-3'], // 北海公园
  '8': ['alt-8-1', 'alt-8-2', 'alt-8-3'], // 景山公园
  '9': ['alt-9-1', 'alt-9-2', 'alt-9-3'], // 雍和宫
  '10': ['alt-10-1', 'alt-10-2', 'alt-10-3'], // 孔庙和国子监
};

// 景点名称到备选景点的映射（用于解决替换后无法再次查找的问题）
const SPOT_NAME_ALTERNATIVES_MAP: Record<string, string[]> = {
  // 北京景点
  '故宫博物院': ['alt-1-1', 'alt-1-2', 'alt-1-3'],
  '天安门广场': ['alt-2-1', 'alt-2-2', 'alt-2-3'],
  '国家博物馆': ['alt-3-1', 'alt-3-2', 'alt-3-3'],
  '颐和园': ['alt-4-1', 'alt-4-2', 'alt-4-3'],
  '天坛公园': ['alt-5-1', 'alt-5-2', 'alt-5-3'],
  '圆明园': ['alt-6-1', 'alt-6-2', 'alt-6-3'],
  '北海公园': ['alt-7-1', 'alt-7-2', 'alt-7-3'],
  '景山公园': ['alt-8-1', 'alt-8-2', 'alt-8-3'],
  '雍和宫': ['alt-9-1', 'alt-9-2', 'alt-9-3'],
  '孔庙和国子监': ['alt-10-1', 'alt-10-2', 'alt-10-3'],
  
  // 备选景点（也可以被替换）
  '首都博物馆': ['alt-1-2', 'alt-1-3', 'alt-1-1'],
  '中国美术馆': ['alt-1-1', 'alt-1-3', 'alt-1-2'],
  '北京规划展览馆': ['alt-1-1', 'alt-1-2', 'alt-1-3'],
  '人民大会堂': ['alt-2-2', 'alt-2-3', 'alt-2-1'],
  '毛主席纪念堂': ['alt-2-1', 'alt-2-3', 'alt-2-2'],
  '国家大剧院': ['alt-2-1', 'alt-2-2', 'alt-2-3'],
  '军事博物馆': ['alt-3-2', 'alt-3-3', 'alt-3-1'],
  '自然博物馆': ['alt-3-1', 'alt-3-3', 'alt-3-2'],
  '天文馆': ['alt-3-1', 'alt-3-2', 'alt-3-3'],
  '香山公园': ['alt-4-2', 'alt-4-3', 'alt-4-1'],
  '北京植物园': ['alt-4-1', 'alt-4-3', 'alt-4-2'],
  '奥林匹克森林公园': ['alt-4-1', 'alt-4-2', 'alt-4-3'],
  '地坛公园': ['alt-5-2', 'alt-5-3', 'alt-5-1'],
  '日坛公园': ['alt-5-1', 'alt-5-3', 'alt-5-2'],
  '月坛公园': ['alt-5-1', 'alt-5-2', 'alt-5-3'],
  '大观园': ['alt-6-2', 'alt-6-3', 'alt-6-1'],
  '世界公园': ['alt-6-1', 'alt-6-3', 'alt-6-2'],
  '北京动物园': ['alt-6-1', 'alt-6-2', 'alt-6-3'],
  '中山公园': ['alt-7-1', 'alt-7-3', 'alt-7-2'],
  '玉渊潭公园': ['alt-7-1', 'alt-7-2', 'alt-7-3'],
  '南锣鼓巷': ['alt-8-2', 'alt-8-3', 'alt-8-1'],
  '什刹海': ['alt-8-1', 'alt-8-2', 'alt-8-3'],
  '白云观': ['alt-9-2', 'alt-9-3', 'alt-9-1'],
  '法源寺': ['alt-9-1', 'alt-9-3', 'alt-9-2'],
  '广济寺': ['alt-9-1', 'alt-9-2', 'alt-9-3'],
  '历代帝王庙': ['alt-10-2', 'alt-10-3', 'alt-10-1'],
  '白塔寺': ['alt-10-1', 'alt-10-3', 'alt-10-2'],
  '鲁迅博物馆': ['alt-10-1', 'alt-10-2', 'alt-10-3'],

  // 上海景点
  '外滩': ['alt-sh-1-1', 'alt-sh-1-2', 'alt-sh-1-3'],
  '东方明珠': ['alt-sh-2-1', 'alt-sh-2-2', 'alt-sh-2-3'],
  '豫园': ['alt-sh-3-1', 'alt-sh-3-2', 'alt-sh-3-3'],
  '南京路步行街': ['alt-sh-4-1', 'alt-sh-4-2', 'alt-sh-4-3'],
  '上海迪士尼乐园': ['alt-sh-5-1', 'alt-sh-5-2', 'alt-sh-5-3'],
  '上海博物馆': ['alt-sh-6-1', 'alt-sh-6-2', 'alt-sh-6-3'],
  '上海博物馆(人民广场馆)': ['alt-sh-6-1', 'alt-sh-6-2', 'alt-sh-6-3'],
  '田子坊': ['alt-sh-7-1', 'alt-sh-7-2', 'alt-sh-7-3'],
  '新天地': ['alt-sh-8-1', 'alt-sh-8-2', 'alt-sh-8-3'],
  
  // 上海备选景点
  '上海中心大厦': ['alt-sh-2-1', 'alt-sh-2-3', 'alt-sh-2-2'],
  '金茂大厦': ['alt-sh-2-2', 'alt-sh-2-3', 'alt-sh-2-1'],
  '上海环球金融中心': ['alt-sh-2-1', 'alt-sh-2-2', 'alt-sh-2-3'],
  '老城隍庙': ['alt-sh-3-2', 'alt-sh-3-3', 'alt-sh-3-1'],
  '静安寺': ['alt-sh-3-1', 'alt-sh-3-3', 'alt-sh-3-2'],
  '龙华寺': ['alt-sh-3-1', 'alt-sh-3-2', 'alt-sh-3-3'],
  '淮海路': ['alt-sh-4-2', 'alt-sh-4-3', 'alt-sh-4-1'],
  '四川北路': ['alt-sh-4-1', 'alt-sh-4-3', 'alt-sh-4-2'],
  '徐家汇': ['alt-sh-4-1', 'alt-sh-4-2', 'alt-sh-4-3'],
  '上海欢乐谷': ['alt-sh-5-2', 'alt-sh-5-3', 'alt-sh-5-1'],
  '上海野生动物园': ['alt-sh-5-1', 'alt-sh-5-3', 'alt-sh-5-2'],
  '长风海洋世界': ['alt-sh-5-1', 'alt-sh-5-2', 'alt-sh-5-3'],
  '上海科技馆': ['alt-sh-6-2', 'alt-sh-6-3', 'alt-sh-6-1'],
  '上海历史博物馆': ['alt-sh-6-1', 'alt-sh-6-3', 'alt-sh-6-2'],
  '中华艺术宫': ['alt-sh-6-1', 'alt-sh-6-2', 'alt-sh-6-3'],
  'M50创意园': ['alt-sh-7-2', 'alt-sh-7-3', 'alt-sh-7-1'],
  '1933老场坊': ['alt-sh-7-1', 'alt-sh-7-3', 'alt-sh-7-2'],
  '思南公馆': ['alt-sh-7-1', 'alt-sh-7-2', 'alt-sh-7-3'],
  'K11购物中心': ['alt-sh-8-2', 'alt-sh-8-3', 'alt-sh-8-1'],
  'iapm环贸广场': ['alt-sh-8-1', 'alt-sh-8-3', 'alt-sh-8-2'],
  '恒隆广场': ['alt-sh-8-1', 'alt-sh-8-2', 'alt-sh-8-3'],
};

// 根据景点 ID 获取备选景点列表
export const getAlternativeSpots = (spotId: string): typeof ALTERNATIVE_SPOTS => {
  const alternativeIds = SPOT_ALTERNATIVES_MAP[spotId] || [];
  return ALTERNATIVE_SPOTS.filter((spot) => alternativeIds.includes(spot.id));
};

// 根据景点名称获取备选景点列表
export const getAlternativeSpotsByName = (spotName: string): typeof ALTERNATIVE_SPOTS => {
  const alternativeIds = SPOT_NAME_ALTERNATIVES_MAP[spotName] || [];
  return ALTERNATIVE_SPOTS.filter((spot) => alternativeIds.includes(spot.id));
};

// 根据类型和户外属性筛选备选景点
export const filterAlternativeSpots = (
  category: string,
  isOutdoor: boolean
): typeof ALTERNATIVE_SPOTS => {
  return ALTERNATIVE_SPOTS.filter(
    (spot) => spot.category === category && spot.isOutdoor === isOutdoor
  );
};
*/

// 导出空对象（避免导入错误）
export const ALTERNATIVE_SPOTS: any[] = [];
export const getAlternativeSpots = () => [];
export const getAlternativeSpotsByName = () => [];
export const filterAlternativeSpots = () => [];

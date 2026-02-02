// 行程页面 Mock 数据
export interface ItineraryItem {
  time: string;
  name: string;
  desc: string;
  coordinates: [number, number]; // [经度, 纬度]
}

export interface DayItinerary {
  day: number;
  date: string;
  items: ItineraryItem[];
}

export interface BudgetData {
  category: string;
  amount: number;
}

export const mockItineraryData: DayItinerary[] = [
  {
    day: 1,
    date: '3月15日',
    items: [
      {
        time: '09:00-12:00',
        name: '故宫博物院',
        desc: '中国明清两代的皇家宫殿，世界文化遗产，收藏有大量珍贵文物。',
        coordinates: [116.3970, 39.9165]
      },
      {
        time: '12:00-13:30',
        name: '景山公园',
        desc: '位于故宫北侧，可俯瞰紫禁城全景，是北京中轴线制高点。',
        coordinates: [116.3968, 39.9254]
      },
      {
        time: '14:00-17:00',
        name: '天坛公园',
        desc: '明清两代皇帝祭天、祈谷的场所，中国古代建筑艺术的杰作。',
        coordinates: [116.4108, 39.8837]
      }
    ]
  },
  {
    day: 2,
    date: '3月16日',
    items: [
      {
        time: '08:30-11:30',
        name: '八达岭长城',
        desc: '明长城的重要组成部分，万里长城的精华所在，气势雄伟壮观。',
        coordinates: [116.0169, 40.3584]
      },
      {
        time: '13:00-16:00',
        name: '十三陵',
        desc: '明朝皇帝陵墓群，其中定陵已发掘开放，可参观地下宫殿。',
        coordinates: [116.2306, 40.2913]
      }
    ]
  },
  {
    day: 3,
    date: '3月17日',
    items: [
      {
        time: '09:00-12:00',
        name: '颐和园',
        desc: '中国古典园林之首，以昆明湖、万寿山为基址的皇家园林。',
        coordinates: [116.2730, 39.9996]
      },
      {
        time: '14:00-16:00',
        name: '圆明园遗址公园',
        desc: '曾经的"万园之园"，现为遗址公园，见证历史沧桑。',
        coordinates: [116.2977, 40.0076]
      }
    ]
  }
];

export const mockBudgetData: BudgetData[] = [
  { category: '交通', amount: 1200 },
  { category: '住宿', amount: 1800 },
  { category: '餐饮', amount: 900 },
  { category: '门票', amount: 600 }
];

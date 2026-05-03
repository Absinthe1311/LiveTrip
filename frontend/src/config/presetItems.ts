// 预设物品清单配置

export interface PresetItem {
  name: string;
  category: string;
}

export interface PresetCategory {
  name: string;
  icon: string; // lucide-react icon name
  items: string[];
}

// 预设物品分类
export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    name: '证件类',
    icon: 'CreditCard',
    items: ['身份证', '护照', '驾驶证', '学生证', '老年证', '银行卡', '信用卡'],
  },
  {
    name: '电子设备',
    icon: 'Smartphone',
    items: [
      '手机',
      '充电器',
      '充电宝',
      '耳机',
      '相机',
      '平板电脑',
      '笔记本电脑',
      '数据线',
      '转换插头',
    ],
  },
  {
    name: '衣物类',
    icon: 'Shirt',
    items: ['换洗衣物', '内衣裤', '睡衣', '外套', '鞋子', '拖鞋', '袜子', '帽子', '围巾', '手套'],
  },
  {
    name: '洗漱用品',
    icon: 'Droplets',
    items: [
      '牙刷',
      '牙膏',
      '毛巾',
      '洗发水',
      '沐浴露',
      '护肤品',
      '化妆品',
      '剃须刀',
      '梳子',
      '镜子',
    ],
  },
  {
    name: '药品类',
    icon: 'Pill',
    items: ['常用药品', '晕车药', '创可贴', '感冒药', '肠胃药', '止痛药', '消炎药', '维生素'],
  },
  {
    name: '其他',
    icon: 'Briefcase',
    items: ['雨伞', '太阳镜', '防晒霜', '水杯', '纸巾', '钱包', '钥匙', '书籍', '笔记本', '笔'],
  },
];

// 获取所有预设物品（扁平化）
export const getAllPresetItems = (): PresetItem[] => {
  const items: PresetItem[] = [];
  PRESET_CATEGORIES.forEach((category) => {
    category.items.forEach((itemName) => {
      items.push({
        name: itemName,
        category: category.name,
      });
    });
  });
  return items;
};

// 根据分类获取预设物品
export const getPresetItemsByCategory = (categoryName: string): string[] => {
  const category = PRESET_CATEGORIES.find((c) => c.name === categoryName);
  return category ? category.items : [];
};

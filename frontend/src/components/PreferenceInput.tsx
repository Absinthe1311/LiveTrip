// 偏好选择组件 - 自定义样式
import { Heart, Camera, Utensils, ShoppingBag, Mountain, Building, TreePalm, Music, BookOpen, Wine } from 'lucide-react';

interface PreferenceInputProps {
  value: string[];
  onChange: (preferences: string[]) => void;
}

// 映射前端偏好ID到后端CategoryTag
const PREFERENCE_TO_CATEGORY: Record<string, string> = {
  'culture': 'history',
  'nature': 'nature',
  'food': 'food',
  'shopping': 'shopping',
  'photography': 'city',
  'relax': 'beach',
  'art': 'art',
  'nightlife': 'theme_park',
};

const PREFERENCES = [
  { id: 'culture', label: '文化历史', icon: Building, desc: '博物馆、古迹、文化景点' },
  { id: 'nature', label: '自然风光', icon: Mountain, desc: '山水、公园、自然景观' },
  { id: 'food', label: '美食探索', icon: Utensils, desc: '当地美食、特色餐厅' },
  { id: 'shopping', label: '购物休闲', icon: ShoppingBag, desc: '商场、特色店铺' },
  { id: 'photography', label: '摄影打卡', icon: Camera, desc: '网红景点、拍照圣地' },
  { id: 'relax', label: '休闲度假', icon: TreePalm, desc: '度假村、温泉、SPA' },
  { id: 'art', label: '艺术展览', icon: BookOpen, desc: '美术馆、艺术中心' },
  { id: 'nightlife', label: '夜生活', icon: Wine, desc: '酒吧、夜市、演出' },
];

export default function PreferenceInput({
  value,
  onChange,
}: PreferenceInputProps) {
  const handleToggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div>
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">选择兴趣偏好</h3>
      <p className="text-[13px] text-muted-foreground mb-6">
        选择您感兴趣的旅行类型，AI 将为您定制专属行程
      </p>

      {/* 偏好网格 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const isSelected = value.includes(pref.id);
          
          return (
            <button
              key={pref.id}
              onClick={() => handleToggle(pref.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className={`text-[15px] font-semibold mb-1 ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                    {pref.label}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {pref.desc}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 已选择提示 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">已选择偏好</span>
          <span className="text-[15px] font-semibold text-foreground">
            {value.length > 0 ? `${value.length} 个` : '未选择'}
          </span>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {value.map(id => {
              const pref = PREFERENCES.find(p => p.id === id);
              return pref ? (
                <span
                  key={id}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[13px] font-medium"
                >
                  {pref.label}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* 调试信息 - 显示映射后的CategoryTag */}
      {value.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <div className="font-semibold mb-1">后端接收的类别标签：</div>
          <div className="flex flex-wrap gap-2">
            {value.map(id => {
              const categoryTag = PREFERENCE_TO_CATEGORY[id];
              return categoryTag ? (
                <span key={id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {categoryTag}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 导出映射函数供外部使用
export const mapPreferencesToCategories = (preferences: string[]): string[] => {
  return preferences
    .map(pref => PREFERENCE_TO_CATEGORY[pref])
    .filter((cat): cat is string => cat !== undefined);
};

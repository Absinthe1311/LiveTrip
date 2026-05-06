// 群体类型和旅行节奏输入组件
import { Users, Zap, Clock } from 'lucide-react';

interface GroupInputProps {
  groupSize: number;
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  hasChildren: boolean;
  hasElderly: boolean;
  pace: 'slow' | 'moderate' | 'fast';
  energy_level: 'low' | 'medium' | 'high';
  onChange: (updates: {
    groupSize?: number;
    groupType?: 'solo' | 'couple' | 'family' | 'friends';
    hasChildren?: boolean;
    hasElderly?: boolean;
    pace?: 'slow' | 'moderate' | 'fast';
    energy_level?: 'low' | 'medium' | 'high';
  }) => void;
}

const GROUP_TYPES = [
  { id: 'solo', label: '独自旅行', icon: Users, desc: '一人出行，自由自在' },
  { id: 'couple', label: '情侣出游', icon: Users, desc: '二人世界，浪漫之旅' },
  { id: 'family', label: '家庭出游', icon: Users, desc: '全家出动，温馨快乐' },
  { id: 'friends', label: '朋友结伴', icon: Users, desc: '三五好友，欢乐同行' },
];

const PACE_OPTIONS = [
  { id: 'slow', label: '悠闲慢游', icon: Clock, desc: '深度体验，不赶时间' },
  { id: 'moderate', label: '适中节奏', icon: Clock, desc: '平衡安排，张弛有度' },
  { id: 'fast', label: '高效游览', icon: Zap, desc: '紧凑行程，多看景点' },
];

const ENERGY_OPTIONS = [
  { id: 'low', label: '轻松省力', icon: Zap, desc: '体力消耗小，适合放松' },
  { id: 'medium', label: '适中强度', icon: Zap, desc: '平衡体验，适合大多数人' },
  { id: 'high', label: '体力充沛', icon: Zap, desc: '高强度游览，适合运动' },
];

export default function GroupInput({
  groupSize,
  groupType,
  hasChildren,
  hasElderly,
  pace,
  energy_level,
  onChange,
}: GroupInputProps) {
  return (
    <div>
      {/* 群体类型 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">选择群体类型</h3>
        <p className="text-[13px] text-muted-foreground mb-4">
          告诉我们您和谁一起旅行，我们会为您推荐更合适的行程
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {GROUP_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = groupType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onChange({ groupType: type.id as any, groupSize: type.id === 'solo' ? 1 : 2 })}
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
                      {type.label}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {type.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 出行人数 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-[13px] text-muted-foreground mb-2 block">
            出行人数：{groupSize} 人
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={groupSize}
            onChange={(e) => onChange({ groupSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* 特殊需求 */}
      {(groupType === 'family' || groupType === 'friends') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">特殊需求</h3>
          <p className="text-[13px] text-muted-foreground mb-4">
            选择是否需要照顾儿童或老人
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
              <input
                type="checkbox"
                checked={hasChildren}
                onChange={(e) => onChange({ hasChildren: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
              <div>
                <div className="text-[15px] font-semibold text-foreground">携带儿童</div>
                <div className="text-[12px] text-muted-foreground">需要适合儿童的景点和活动</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
              <input
                type="checkbox"
                checked={hasElderly}
                onChange={(e) => onChange({ hasElderly: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
              <div>
                <div className="text-[15px] font-semibold text-foreground">携带老人</div>
                <div className="text-[12px] text-muted-foreground">需要适合老人的景点和活动</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 旅行节奏 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">选择旅行节奏</h3>
        <p className="text-[13px] text-muted-foreground mb-4">
          选择您希望的旅行节奏，我们会安排合适的景点数量
        </p>

        <div className="grid grid-cols-3 gap-3">
          {PACE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = pace === option.id;

            return (
              <button
                key={option.id}
                onClick={() => onChange({ pace: option.id as any })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`text-[14px] font-semibold text-center mb-1 ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}>
                  {option.label}
                </div>
                <div className="text-[11px] text-muted-foreground text-center">
                  {option.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 体力水平 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">体力水平</h3>
        <p className="text-[13px] text-muted-foreground mb-4">
          选择您的体力水平，我们会安排适合的景点
        </p>

        <div className="grid grid-cols-3 gap-3">
          {ENERGY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = energy_level === option.id;

            return (
              <button
                key={option.id}
                onClick={() => onChange({ energy_level: option.id as any })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`text-[14px] font-semibold text-center mb-1 ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}>
                  {option.label}
                </div>
                <div className="text-[11px] text-muted-foreground text-center">
                  {option.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

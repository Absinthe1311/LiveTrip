// 预算滑块组件 - 自定义样式
import { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface BudgetRangeInputProps {
  minBudget: number;
  maxBudget: number;
  onChange: (minBudget: number, maxBudget: number) => void;
}

const BUDGET_RANGES = [
  { label: '经济型', min: 3000, max: 8000, desc: '适合预算有限的旅行' },
  { label: '舒适型', min: 8000, max: 15000, desc: '平衡舒适与性价比' },
  { label: '豪华型', min: 15000, max: 30000, desc: '享受高品质旅行体验' },
  { label: '奢华型', min: 30000, max: 50000, desc: '极致奢华的旅行享受' },
];

export default function BudgetRangeInput({
  minBudget,
  maxBudget,
  onChange,
}: BudgetRangeInputProps) {
  const [localMin, setLocalMin] = useState(minBudget);
  const [localMax, setLocalMax] = useState(maxBudget);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setLocalMin(value);
    if (value <= localMax) {
      onChange(value, localMax);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setLocalMax(value);
    if (value >= localMin) {
      onChange(localMin, value);
    }
  };

  const handlePresetClick = (min: number, max: number) => {
    setLocalMin(min);
    setLocalMax(max);
    onChange(min, max);
  };

  const avgBudget = Math.round((localMin + localMax) / 2);

  return (
    <div>
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-4">设置预算范围</h3>

      {/* 预算显示 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground">预算范围</span>
          <span className="text-[15px] font-semibold text-primary">
            ¥{localMin.toLocaleString()} - ¥{localMax.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">平均预算</span>
          <span className="text-2xl font-bold text-primary">
            ¥{avgBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 输入框 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">最低预算</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              value={localMin}
              onChange={handleMinChange}
              min={0}
              max={localMax}
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">最高预算</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              value={localMax}
              onChange={handleMaxChange}
              min={localMin}
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 预设选项 */}
      <div>
        <p className="text-[13px] text-muted-foreground mb-3">快速选择</p>
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => handlePresetClick(range.min, range.max)}
              className={`p-4 rounded-lg border text-left transition-all hover:border-primary ${
                localMin === range.min && localMax === range.max
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="text-[15px] font-semibold text-foreground mb-1">
                {range.label}
              </div>
              <div className="text-[12px] text-muted-foreground mb-2">
                ¥{range.min.toLocaleString()} - ¥{range.max.toLocaleString()}
              </div>
              <div className="text-[12px] text-muted-foreground">
                {range.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

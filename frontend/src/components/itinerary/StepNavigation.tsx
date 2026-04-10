// 步骤导航组件 - 控制规划流程
import React from 'react';
import { Check, MapPin, UtensilsCrossed, Building2 } from 'lucide-react';

export type PlanningStep = 'attractions' | 'restaurants' | 'hotels' | 'confirm';

interface StepNavigationProps {
  currentStep: PlanningStep;
  currentDay: number;
  totalDays: number;
  onStepChange: (step: PlanningStep) => void;
  onDayChange: (day: number) => void;
  completedSteps: Record<string, boolean>;
}

export default function StepNavigation({
  currentStep,
  currentDay,
  totalDays,
  onStepChange,
  onDayChange,
  completedSteps
}: StepNavigationProps) {
  const steps: Array<{ key: PlanningStep; label: string; icon: any }> = [
    { key: 'attractions', label: '规划景点', icon: MapPin },
    { key: 'restaurants', label: '选择餐厅', icon: UtensilsCrossed },
    { key: 'hotels', label: '选择酒店', icon: Building2 },
    { key: 'confirm', label: '确认保存', icon: Check },
  ];

  const getStepStatus = (stepKey: PlanningStep) => {
    if (stepKey === currentStep) return 'current';
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg mb-6">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.key}>
              {/* 步骤按钮 */}
              <button
                onClick={() => {
                  if (status === 'completed' || status === 'current') {
                    onStepChange(step.key);
                  }
                }}
                className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                  status === 'pending' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                disabled={status === 'pending'}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'current'
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 scale-110'
                    : status === 'completed'
                    ? 'bg-green-500/30 border-2 border-green-400'
                    : 'bg-white/20 border-2 border-white/30'
                }`}>
                  {status === 'completed' ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Icon className={`w-6 h-6 ${
                      status === 'current' ? 'text-white' : 'text-white/60'
                    }`} />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  status === 'current' 
                    ? 'text-green-400' 
                    : status === 'completed'
                    ? 'text-white/80'
                    : 'text-white/40'
                }`}>
                  {step.label}
                </span>
              </button>
              
              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                  getStepStatus(steps[index + 1].key) === 'pending'
                    ? 'bg-white/20'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 日期切换（仅在景点和餐厅步骤显示） */}
      {(currentStep === 'attractions' || currentStep === 'restaurants') && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => onDayChange(day - 1)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                currentDay === day - 1
                  ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-400/50 shadow-lg shadow-green-500/20 text-green-400'
                  : 'bg-white/5 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-sm">第{day}天</span>
              {completedSteps[`day-${day}-${currentStep}`] && (
                <Check className="w-3 h-3 text-green-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

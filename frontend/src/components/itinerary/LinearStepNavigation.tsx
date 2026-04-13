// 线性步骤导航组件 - 按天交替：第1天景点→第1天餐厅→第2天景点→第2天餐厅→...→酒店→打包
import React from 'react';
import { Check, MapPin, UtensilsCrossed, Building2, Lock, Package } from 'lucide-react';

export type PlanningStep = {
  type: 'attractions' | 'restaurants' | 'hotels' | 'packing';
  day?: number;
  label: string;
};

interface LinearStepNavigationProps {
  steps: PlanningStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  completedSteps: boolean[];
}

export default function LinearStepNavigation({
  steps,
  currentStepIndex,
  onStepChange,
  completedSteps
}: LinearStepNavigationProps) {
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'attractions':
        return MapPin;
      case 'restaurants':
        return UtensilsCrossed;
      case 'hotels':
        return Building2;
      case 'packing':
        return Package;
      default:
        return MapPin;
    }
  };

  const getStepStatus = (index: number) => {
    if (index === currentStepIndex) return 'current';
    if (completedSteps[index]) return 'completed';
    if (index < currentStepIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg mb-6">
      {/* 步骤指示器 - 横向滚动 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = getStepIcon(step.type);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={index}>
              {/* 步骤按钮 */}
              <button
                onClick={() => {
                  if (status === 'completed' || status === 'current') {
                    onStepChange(index);
                  }
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ${
                  status === 'pending' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                disabled={status === 'pending'}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'current'
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 scale-110'
                    : status === 'completed'
                    ? 'bg-green-500/30 border-2 border-green-400'
                    : 'bg-white/20 border-2 border-white/30'
                }`}>
                  {status === 'completed' ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : status === 'pending' ? (
                    <Lock className="w-6 h-6 text-white/40" />
                  ) : (
                    <Icon className="w-6 h-6 text-white" />
                  )}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
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
              {!isLast && (
                <div className={`flex-shrink-0 w-8 h-0.5 transition-all duration-300 ${
                  getStepStatus(index + 1) === 'pending'
                    ? 'bg-white/20'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

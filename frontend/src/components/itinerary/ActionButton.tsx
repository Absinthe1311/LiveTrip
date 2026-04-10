// 改进的操作按钮组件 - 固定在右下角，动态文案，包含上一步和下一步
import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ActionButtonProps {
  isLastStep: boolean;
  isFirstStep: boolean;
  canProceed: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
}

export default function ActionButton({
  isLastStep,
  isFirstStep,
  canProceed,
  onNext,
  onPrevious,
  onSave
}: ActionButtonProps) {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
      {/* 上一步按钮 */}
      {!isFirstStep && (
        <button
          onClick={onPrevious}
          className="px-6 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-xl border-2 border-white/30 text-gray-700 hover:bg-white hover:scale-105 hover:shadow-xl"
        >
          <span className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            <span>上一步</span>
          </span>
        </button>
      )}

      {/* 下一步/保存按钮 */}
      <button
        onClick={isLastStep ? onSave : onNext}
        disabled={!canProceed}
        className={`px-8 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 ${
          canProceed
            ? isLastStep
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-green-500/50 hover:scale-105'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-blue-500/50 hover:scale-105'
            : 'bg-gray-400/50 text-white/50 cursor-not-allowed'
        }`}
      >
        <span className="flex items-center gap-2">
          {isLastStep ? (
            <>
              <span>保存行程</span>
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>下一步</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </span>
      </button>
    </div>
  );
}

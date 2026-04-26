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
  saveButtonText?: string;
}

export default function ActionButton({
  isLastStep,
  isFirstStep,
  canProceed,
  onNext,
  onPrevious,
  onSave,
  saveButtonText = '保存行程'
}: ActionButtonProps) {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
      {!isFirstStep && (
        <button
          onClick={onPrevious}
          className="px-6 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:bg-white/15 hover:text-white hover:scale-105"
        >
          <span className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            <span>上一步</span>
          </span>
        </button>
      )}

      <button
        onClick={isLastStep ? onSave : onNext}
        disabled={!canProceed}
        className={`px-8 py-4 rounded-2xl font-semibold shadow-2xl transition-all duration-300 ${
          canProceed
            ? isLastStep
              ? 'bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 text-[#005746] border border-[#CDEDDE]/50 shadow-lg shadow-[#CDEDDE]/30 hover:shadow-xl hover:shadow-[#CDEDDE]/40 hover:scale-105'
              : 'bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 text-[#005746] border border-[#CDEDDE]/50 shadow-lg shadow-[#CDEDDE]/30 hover:shadow-xl hover:shadow-[#CDEDDE]/40 hover:scale-105'
            : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
        }`}
      >
        <span className="flex items-center gap-2">
          {isLastStep ? (
            <>
              <span>{saveButtonText}</span>
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

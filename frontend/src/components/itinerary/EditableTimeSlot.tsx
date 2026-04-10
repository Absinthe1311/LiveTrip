// 可编辑时间段组件 - 独立时间框，清晰显示
import React, { useState } from 'react';
import { Clock, Edit2, Check, X } from 'lucide-react';

interface EditableTimeSlotProps {
  time: string;
  onTimeChange?: (newTime: string) => void;
  index: number;
  isActive?: boolean;
  onHover?: (isHovered: boolean) => void;
}

export default function EditableTimeSlot({
  time,
  onTimeChange,
  index,
  isActive = false,
  onHover
}: EditableTimeSlotProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(time);
  const [isHovered, setIsHovered] = useState(false);

  const handleSave = () => {
    if (onTimeChange && editTime !== time) {
      onTimeChange(editTime);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTime(time);
    setIsEditing(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  // 解析时间
  const [startTime, endTime] = time.split('-');
  
  return (
    <div 
      className="flex flex-col items-center gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 时间线节点 */}
      <div 
        className={`rounded-full z-10 transition-all duration-300 ${
          isHovered || isActive
            ? 'w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-400/40 shadow-lg shadow-green-500/50'
            : 'w-2 h-2 bg-gradient-to-br from-green-400 to-green-600'
        }`}
      />
      
      {/* 独立时间框 */}
      {isEditing ? (
        <div className="flex flex-col gap-1 bg-white/60 backdrop-blur-xl rounded-xl p-3 border border-white/30 shadow-lg">
          <input
            type="text"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="w-28 bg-white/40 text-white text-sm px-3 py-2 rounded-lg border border-white/30 outline-none focus:border-green-400/50 text-center"
            placeholder="09:00-11:00"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 bg-green-500/30 text-green-300 text-xs py-1.5 rounded-lg hover:bg-green-500/40 transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>确认</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1 bg-white/20 text-white/70 text-xs py-1.5 rounded-lg hover:bg-white/30 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>取消</span>
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`bg-white/60 backdrop-blur-xl rounded-xl p-3 border border-white/30 shadow-lg transition-all duration-300 cursor-pointer hover:bg-white/70 ${
            isHovered ? 'scale-105' : ''
          }`}
          onClick={() => onTimeChange && setIsEditing(true)}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm font-bold text-white">
              {startTime}
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-3 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
            </div>
            <div className="text-sm font-bold text-white">
              {endTime}
            </div>
          </div>
          
          {/* 编辑提示 */}
          {onTimeChange && isHovered && (
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-white/60">
              <Edit2 className="w-3 h-3" />
              <span>点击编辑</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

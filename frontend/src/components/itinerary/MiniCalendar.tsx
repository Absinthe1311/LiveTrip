// 迷你日历组件 - 用于右侧侧栏
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  startDate: string;
  endDate: string;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export default function MiniCalendar({
  startDate,
  endDate,
  selectedDate,
  onDateSelect
}: MiniCalendarProps) {
  // 解析日期
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = selectedDate ? new Date(selectedDate) : new Date();

  // 获取当前月份
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 获取月份的第一天和最后一天
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // 获取月份第一天是星期几（0-6，0是周日）
  const firstDayOfWeek = firstDay.getDay();

  // 生成日历网格
  const daysInMonth = lastDay.getDate();
  const calendarDays: (number | null)[] = [];

  // 填充前面的空白
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 填充日期
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // 判断日期是否在行程范围内
  const isInRange = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date >= start && date <= end;
  };

  // 判断是否是今天
  const isToday = (day: number) => {
    const todayDate = new Date();
    return day === todayDate.getDate() &&
           currentMonth === todayDate.getMonth() &&
           currentYear === todayDate.getFullYear();
  };

  // 判断是否是选中日期
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return day === selected.getDate() &&
           currentMonth === selected.getMonth() &&
           currentYear === selected.getFullYear();
  };

  // 月份名称
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl">
      {/* 月份标题 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-white">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <button className="p-1 rounded hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-white/60 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day && (
              <button
                onClick={() => {
                  if (isInRange(day) && onDateSelect) {
                    const date = new Date(currentYear, currentMonth, day);
                    onDateSelect(date.toISOString().split('T')[0]);
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  isSelected(day)
                    ? 'bg-amber-500 text-white font-bold'
                    : isToday(day)
                    ? 'bg-white/20 text-white font-semibold'
                    : isInRange(day)
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'text-white/40'
                }`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 行程日期范围提示 */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border-2 border-amber-400" />
          <span>行程日期范围</span>
        </div>
      </div>
    </div>
  );
}

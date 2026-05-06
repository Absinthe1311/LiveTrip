// 双月日历组件
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DoubleCalendarProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DoubleCalendar({ startDate, endDate, onStartDateChange, onEndDateChange }: DoubleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 监控props变化
  useEffect(() => {
    console.log('🔄 日历状态更新:', { startDate, endDate });
  }, [startDate, endDate]);

  const months = [];
  for (let i = 0; i < 2; i++) {
    const month = new Date(currentMonth);
    month.setMonth(month.getMonth() + i);
    months.push(month);
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateSelected = (date: string) => {
    return date === startDate || date === endDate;
  };

  const isDateInRange = (date: string) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  const handleDateClick = (date: string) => {
    console.log('📅 点击日期:', date);
    console.log('📊 当前状态:', { startDate, endDate });
    const today = new Date().toISOString().split('T')[0];

    // 禁止选择过去的日期
    if (date < today) {
      console.log('⚠️ 不能选择过去的日期');
      return;
    }

    // 如果没有开始日期，设置开始日期
    if (!startDate) {
      console.log('✅ 设置开始日期:', date);
      onStartDateChange(date);
    }
    // 如果有开始日期但没有结束日期
    else if (!endDate) {
      // 如果点击的日期在开始日期之后，设置为结束日期
      if (date > startDate) {
        console.log('✅ 设置结束日期:', date);
        onEndDateChange(date);
      }
      // 如果点击的日期在开始日期之前或相同，重新设置开始日期
      else {
        console.log('✅ 重新设置开始日期:', date);
        onStartDateChange(date);
      }
    }
    // 如果已经有开始和结束日期，重新开始选择
    else {
      console.log('✅ 重新开始选择，设置开始日期:', date);
      onStartDateChange(date);
      onEndDateChange('');
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* 月份导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(newMonth.getMonth() - 1);
            setCurrentMonth(newMonth);
          }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-lg font-medium text-white">
          {currentMonth.getFullYear()}年
        </div>
        <button
          onClick={() => {
            const newMonth = new Date(currentMonth);
            newMonth.setMonth(newMonth.getMonth() + 1);
            setCurrentMonth(newMonth);
          }}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 双月日历 */}
      <div className="grid grid-cols-2 gap-4">
        {months.map((month, index) => {
          const { daysInMonth, firstDayOfMonth } = getDaysInMonth(month);
          const days = [];

          // 填充空白
          for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
          }

          // 填充日期
          for (let day = 1; day <= daysInMonth; day++) {
            const date = formatDate(month.getFullYear(), month.getMonth(), day);
            const isSelected = isDateSelected(date);
            const isInRange = isDateInRange(date);
            const isPast = date < today;

            days.push(
              <button
                key={day}
                onClick={() => handleDateClick(date)}
                disabled={isPast}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  isPast
                    ? 'text-white/20 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#FFD9A3] text-[#718771]'
                    : isInRange
                    ? 'bg-[#FFD9A3]/40 text-[#718771]'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {day}
              </button>
            );
          }

          return (
            <div key={index} className="space-y-2">
              <div className="text-center text-sm font-medium text-white/80">
                {month.getMonth() + 1}月
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day} className="w-10 h-8 flex items-center justify-center text-xs text-white/40">
                    {day}
                  </div>
                ))}
                {days}
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中日期显示 */}
      <div className="space-y-2">
        {/* 开始日期 */}
        <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm text-white/60">开始日期</span>
          <span className="text-base font-medium text-white">
            {startDate || '未选择'}
          </span>
        </div>
        {/* 结束日期 */}
        <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm text-white/60">结束日期</span>
          <span className="text-base font-medium text-white">
            {endDate || '未选择'}
          </span>
        </div>
        {/* 总天数 */}
        {startDate && endDate && (
          <div className="text-center py-3 rounded-xl bg-[#FFD9A3]/20 border border-[#FFD9A3]/40">
            <span className="text-[#718771] font-medium">
              共 {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} 天行程
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

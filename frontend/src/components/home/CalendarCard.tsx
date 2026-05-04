/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// Calendar 月历组件 - 玻璃拟态风格
import React, { useState, useMemo } from 'react';
import GlassCard from './GlassCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TripDate {
  startDate: Date;
  endDate: Date;
  tripId: string;
  tripTitle: string;
}

interface CalendarCardProps {
  tripDates?: TripDate[]; // 改为接收行程日期对象数组
  year?: number;
  month?: number;
  onDateClick?: (date: number) => void;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

export default function CalendarCard({
  tripDates = [],
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  onDateClick,
  onMonthChange,
  className = '',
}: CalendarCardProps) {
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);

  // 计算当前月份需要高亮的日期
  const highlightedDates = useMemo(() => {
    const dates = new Set<number>();

    tripDates.forEach((trip) => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);

      // 遍历行程的每一天
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // 只添加当前月份的日期
        if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) {
          dates.add(d.getDate());
        }
      }
    });

    return Array.from(dates);
  }, [tripDates, currentYear, currentMonth]);

  // 月份名称
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // 星期名称
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // 获取某个月的天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 获取某个月的第一天是星期几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // 上一个月
  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);

    if (onMonthChange) {
      onMonthChange(newYear, newMonth);
    }
  };

  // 下一个月
  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);

    if (onMonthChange) {
      onMonthChange(newYear, newMonth);
    }
  };

  // 处理日期点击
  const handleDateClick = (date: number) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // 生成日历网格
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const calendar = [];

    // 调整星期一为第一天
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // 填充空白
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendar.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // 填充日期
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isHighlighted = highlightedDates.includes(day);
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() + 1 &&
        currentYear === today.getFullYear();

      calendar.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 relative ${
            isHighlighted
              ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
              : isToday
                ? 'bg-blue-500/30 border-2 border-blue-400 text-white font-bold hover:bg-blue-500/40'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {day}
          {isToday && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
          )}
        </button>
      );
    }

    return calendar;
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* 标题和导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-white/80" />
        </button>

        <h3 className="text-lg font-bold text-white">
          {monthNames[currentMonth - 1]} {currentYear}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-white/80" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="w-8 h-8 flex items-center justify-center text-xs font-medium text-white/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">{generateCalendar()}</div>

      {/* 图例 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40" />
            <span className="text-xs text-white/60">行程日期</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/30 border-2 border-blue-400" />
            <span className="text-xs text-white/60">今天</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

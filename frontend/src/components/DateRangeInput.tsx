// 日期选择组件 - 自定义样式
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeInputProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRangeInput({
  startDate,
  endDate,
  onChange,
}: DateRangeInputProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // 添加空白天数
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // 添加实际天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    
    if (!startDate || selectingEnd) {
      if (!startDate) {
        onChange(dateStr, '');
        setSelectingEnd(true);
      } else {
        // 确保结束日期在开始日期之后
        if (date >= parseDate(startDate)!) {
          onChange(startDate, dateStr);
        } else {
          onChange(dateStr, startDate);
        }
        setSelectingEnd(false);
        setShowCalendar(false);
      }
    } else {
      onChange(dateStr, '');
      setSelectingEnd(true);
    }
  };

  const isDateInRange = (date: Date): boolean => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  const isDateSelected = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return dateStr === startDate || dateStr === endDate;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div>
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-4">选择行程日期</h3>

      {/* 日期显示 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">出发日期</label>
          <button
            onClick={() => {
              setShowCalendar(true);
              setSelectingEnd(false);
            }}
            className="w-full h-12 px-4 rounded-lg border border-border bg-background text-left text-[15px] flex items-center gap-3 hover:border-primary transition-colors"
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className={startDate ? 'text-foreground' : 'text-muted-foreground'}>
              {startDate || '选择日期'}
            </span>
          </button>
        </div>
        <div>
          <label className="text-[13px] text-muted-foreground mb-2 block">返回日期</label>
          <button
            onClick={() => {
              setShowCalendar(true);
              setSelectingEnd(true);
            }}
            className="w-full h-12 px-4 rounded-lg border border-border bg-background text-left text-[15px] flex items-center gap-3 hover:border-primary transition-colors"
          >
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className={endDate ? 'text-foreground' : 'text-muted-foreground'}>
              {endDate || '选择日期'}
            </span>
          </button>
        </div>
      </div>

      {/* 日历弹窗 */}
      {showCalendar && (
        <div className="bg-card border border-border rounded-lg p-4">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-[15px] font-semibold">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h4>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[12px] text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    className={`w-full h-full rounded-lg text-[14px] transition-colors ${
                      isDateSelected(date)
                        ? 'bg-primary text-white'
                        : isDateInRange(date)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* 提示 */}
          <p className="text-[12px] text-muted-foreground mt-4 text-center">
            {selectingEnd ? '请选择返回日期' : '请选择出发日期'}
          </p>
        </div>
      )}
    </div>
  );
}

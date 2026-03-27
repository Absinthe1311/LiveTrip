// 日期解析工具 - 支持相对日期解析（如"明天"、"下周三"等）

/**
 * 解析日期字符串
 * @param dateStr 日期字符串，支持：
 *   - 绝对日期：YYYY-MM-DD
 *   - 相对日期：今天、明天、后天、下周X、下个月X号等
 * @returns Date 对象
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) {
    throw new Error('日期字符串不能为空');
  }

  // 尝试解析为绝对日期 (YYYY-MM-DD)
  const absoluteDateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (absoluteDateMatch) {
    const [, year, month, day] = absoluteDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // 解析相对日期
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lowerStr = dateStr.toLowerCase().trim();

  // 今天
  if (lowerStr === '今天' || lowerStr === 'today') {
    return today;
  }

  // 明天
  if (lowerStr === '明天' || lowerStr === 'tomorrow') {
    return addDays(today, 1);
  }

  // 后天
  if (lowerStr === '后天') {
    return addDays(today, 2);
  }

  // 大后天
  if (lowerStr === '大后天') {
    return addDays(today, 3);
  }

  // 本周X
  const thisWeekMatch = lowerStr.match(/本周([一二三四五六日天])/);
  if (thisWeekMatch) {
    const targetDay = getDayOfWeek(thisWeekMatch[1]);
    return getDayOfWeekDate(today, targetDay, 'this');
  }

  // 下周X
  const nextWeekMatch = lowerStr.match(/下周([一二三四五六日天])/);
  if (nextWeekMatch) {
    const targetDay = getDayOfWeek(nextWeekMatch[1]);
    return getDayOfWeekDate(today, targetDay, 'next');
  }

  // 下下周X
  const nextNextWeekMatch = lowerStr.match(/下下周([一二三四五六日天])/);
  if (nextNextWeekMatch) {
    const targetDay = getDayOfWeek(nextNextWeekMatch[1]);
    return getDayOfWeekDate(today, targetDay, 'nextNext');
  }

  // X天后
  const daysLaterMatch = lowerStr.match(/(\d+)天后/);
  if (daysLaterMatch) {
    const days = parseInt(daysLaterMatch[1]);
    return addDays(today, days);
  }

  // X周后
  const weeksLaterMatch = lowerStr.match(/(\d+)周后/);
  if (weeksLaterMatch) {
    const weeks = parseInt(weeksLaterMatch[1]);
    return addDays(today, weeks * 7);
  }

  // 下个月X号
  const nextMonthMatch = lowerStr.match(/下个月(\d+)号/);
  if (nextMonthMatch) {
    const day = parseInt(nextMonthMatch[1]);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day);
    return nextMonth;
  }

  // X月X号（当年）
  const monthDayMatch = lowerStr.match(/(\d+)月(\d+)号/);
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]) - 1;
    const day = parseInt(monthDayMatch[2]);
    const date = new Date(today.getFullYear(), month, day);
    // 如果日期已过，则取明年
    if (date < today) {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }

  // 尝试直接解析
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`无法解析日期: ${dateStr}`);
}

/**
 * 添加天数
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 将中文星期转换为数字（0=周日，1=周一，...，6=周六）
 */
function getDayOfWeek(dayStr: string): number {
  const map: Record<string, number> = {
    '一': 1,
    '二': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6,
    '日': 0,
    '天': 0,
  };
  return map[dayStr] ?? 0;
}

/**
 * 获取指定周的星期几
 * @param baseDate 基准日期
 * @param targetDay 目标星期几（0=周日，1=周一，...，6=周六）
 * @param weekType 'this' | 'next' | 'nextNext'
 */
function getDayOfWeekDate(baseDate: Date, targetDay: number, weekType: 'this' | 'next' | 'nextNext'): Date {
  const currentDay = baseDate.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7;

  let result = new Date(baseDate);
  result.setDate(result.getDate() + daysUntilTarget);

  if (weekType === 'next') {
    result.setDate(result.getDate() + 7);
  } else if (weekType === 'nextNext') {
    result.setDate(result.getDate() + 14);
  }

  return result;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

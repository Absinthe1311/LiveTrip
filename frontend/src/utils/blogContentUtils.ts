/**
 * 博客内容处理工具函数
 */

/**
 * 从HTML内容中提取第一张图片URL
 * @param htmlContent HTML内容
 * @returns 第一张图片URL，如果没有则返回null
 */
export function firstImg(htmlContent: string): string | null {
  if (!htmlContent) return null;

  // 使用正则表达式匹配img标签
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = htmlContent.match(imgRegex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * 计算HTML内容的纯文本字数
 * @param htmlContent HTML内容
 * @returns 字数
 */
export function calcWords(htmlContent: string): number {
  if (!htmlContent) return 0;

  // 移除HTML标签
  const textContent = htmlContent.replace(/<[^>]*>/g, '');

  // 移除多余空格
  const cleanText = textContent.replace(/\s+/g, ' ').trim();

  // 计算字数（中文字符按1个字计算，英文单词按1个字计算）
  let wordCount = 0;
  let inWord = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];

    // 中文字符
    if (/[\u4e00-\u9fa5]/.test(char)) {
      wordCount++;
      inWord = false;
    }
    // 英文字母
    else if (/[a-zA-Z]/.test(char)) {
      if (!inWord) {
        wordCount++;
        inWord = true;
      }
    }
    // 数字
    else if (/[0-9]/.test(char)) {
      if (!inWord) {
        wordCount++;
        inWord = true;
      }
    }
    // 其他字符（空格、标点等）
    else {
      inWord = false;
    }
  }

  return wordCount;
}

/**
 * 计算预计阅读时间（按每分钟300字计算）
 * @param wordCount 字数
 * @returns 阅读时间（分钟）
 */
export function estRead(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / 300);
}

/**
 * 格式化阅读时间显示
 * @param minutes 分钟数
 * @returns 格式化的时间字符串
 */
export function fmtRead(minutes: number): string {
  if (minutes <= 0) return '1分钟';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

/**
 * 生成博客摘要（取前150个字）
 * @param htmlContent HTML内容
 * @param maxLength 最大长度
 * @returns 摘要文本
 */
export function excerpt(htmlContent: string, maxLength: number = 150): string {
  if (!htmlContent) return '';

  // 移除HTML标签
  const textContent = htmlContent.replace(/<[^>]*>/g, '');

  // 移除多余空格
  const cleanText = textContent.replace(/\s+/g, ' ').trim();

  // 截取前maxLength个字符
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return cleanText.substring(0, maxLength) + '...';
}

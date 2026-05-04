/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：工具函数重构
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

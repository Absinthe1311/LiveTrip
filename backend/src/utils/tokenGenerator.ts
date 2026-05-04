/**
 * Token生成工具
 * 用于生成安全的随机分享token
 */

import * as crypto from 'crypto';

/**
 * 生成分享token
 * @returns 8-12位的随机字符串,包含大小写字母和数字
 */
export function genToken(): string {
  // 可用字符集: 大小写字母 + 数字
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // 随机长度: 8-12位
  const length = Math.floor(Math.random() * 5) + 8; // 8, 9, 10, 11, 12

  let token = '';

  // 使用加密安全的随机字节生成器
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    // 使用随机字节选择字符
    token += chars[randomBytes[i] % chars.length];
  }

  return token;
}

/**
 * 验证token格式
 * @param token 要验证的token
 * @returns 是否符合格式要求
 */
export function chkToken(token: string): boolean {
  // 检查长度
  if (token.length < 8 || token.length > 12) {
    return false;
  }

  // 检查字符集
  const validChars = /^[A-Za-z0-9]+$/;
  return validChars.test(token);
}

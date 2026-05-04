import crypto from 'crypto';

/**
 * 生成文件hash值，用于图片去重
 * @param buffer 文件buffer
 * @returns SHA256 hash值的十六进制字符串
 */
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 生成字符串的hash值
 * @param str 输入字符串
 * @returns SHA256 hash值的十六进制字符串
 */
export function generateStringHash(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 验证两个hash值是否相同
 * @param hash1 第一个hash值
 * @param hash2 第二个hash值
 * @returns 是否相同
 */
export function compareHash(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}

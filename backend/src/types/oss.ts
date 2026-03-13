/**
 * OSS配置接口
 */
export interface OSSConfig {
  bucketName: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  baseUrl?: string;
}

/**
 * OSS上传结果接口
 */
export interface OSSUploadResult {
  url: string;
  name: string;
  size: number;
}

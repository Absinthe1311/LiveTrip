import OSS from 'ali-oss';
import { OSSConfig, OSSUploadResult } from '../types/oss';

/**
 * 阿里云OSS服务封装类
 */
export class OSSService {
  private client: OSS;
  private config: OSSConfig;

  constructor(config: OSSConfig) {
    this.config = config;
    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucketName,
    });
  }

  /**
   * 上传文件到OSS
   * @param file 文件buffer
   * @param fileName 文件名
   * @param folder 文件夹路径（可选）
   * @returns 上传结果，包含URL
   */
  async uploadFile(file: Buffer, fileName: string, folder?: string): Promise<OSSUploadResult> {
    try {
      // 构建完整的文件路径
      const fullFileName = folder ? `${folder}/${fileName}` : fileName;

      // 上传文件
      const result = await this.client.put(fullFileName, file);

      // 如果配置了baseUrl，使用baseUrl替换默认域名
      let url = result.url;
      if (this.config.baseUrl) {
        const urlParts = url.split('/');
        const fileNamePart = urlParts[urlParts.length - 1];
        url = `${this.config.baseUrl}/${fullFileName}`;
      }

      return {
        url,
        name: fileName,
        size: file.length,
      };
    } catch (error) {
      console.error('OSS上传失败:', error);
      throw new Error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除OSS文件
   * @param fileName 文件名或完整路径
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.client.delete(fileName);
    } catch (error) {
      console.error('OSS删除失败:', error);
      throw new Error(`文件删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param fileName 文件名或完整路径
   * @returns 文件是否存在
   */
  async checkFileExists(fileName: string): Promise<boolean> {
    try {
      await this.client.head(fileName);
      return true;
    } catch (error) {
      // 文件不存在时，OSS会返回404错误
      return false;
    }
  }

  /**
   * 生成文件访问URL
   * @param fileName 文件名或完整路径
   * @param expires 过期时间（秒），默认不设置
   * @returns 文件访问URL
   */
  generateFileUrl(fileName: string, expires?: number): string {
    if (expires) {
      return this.client.signatureUrl(fileName, { expires });
    }
    return this.config.baseUrl
      ? `${this.config.baseUrl}/${fileName}`
      : `https://${this.config.bucketName}.${this.config.region}.aliyuncs.com/${fileName}`;
  }

  /**
   * 批量上传文件
   * @param files 文件数组，每个文件包含buffer和fileName
   * @param folder 文件夹路径（可选）
   * @returns 上传结果数组
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; fileName: string }>,
    folder?: string
  ): Promise<OSSUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.fileName, folder)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('批量上传失败:', error);
      throw new Error(`批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量删除文件
   * @param fileNames 文件名数组
   */
  async deleteMultipleFiles(fileNames: string[]): Promise<void> {
    try {
      await this.client.deleteMulti(fileNames);
    } catch (error) {
      console.error('批量删除失败:', error);
      throw new Error(`批量删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取文件信息
   * @param fileName 文件名或完整路径
   * @returns 文件信息
   */
  async getFileInfo(fileName: string) {
    try {
      return await this.client.head(fileName);
    } catch (error) {
      console.error('获取文件信息失败:', error);
      throw new Error(`获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 列出指定文件夹下的所有文件
   * @param folder 文件夹路径
   * @param maxKeys 最大返回数量
   * @returns 文件列表
   */
  async listFiles(folder: string, maxKeys: number = 100) {
    try {
      const result = await this.client.list({
        prefix: folder,
        'max-keys': maxKeys,
      }, {});
      return result.objects || [];
    } catch (error) {
      console.error('列出文件失败:', error);
      throw new Error(`列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

// 导出单例实例
let ossServiceInstance: OSSService | null = null;

/**
 * 获取OSS服务单例
 * @param config OSS配置
 * @returns OSS服务实例
 */
export function getOSSService(config?: OSSConfig): OSSService {
  if (!ossServiceInstance && config) {
    ossServiceInstance = new OSSService(config);
  }
  if (!ossServiceInstance) {
    throw new Error('OSS服务未初始化，请提供配置');
  }
  return ossServiceInstance;
}

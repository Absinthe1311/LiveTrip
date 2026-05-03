// 异常处理和回退机制服务
import { RecommendedAttraction, DailyItinerary, FullItinerary } from '../types';

// 错误类型
export enum ErrorType {
  API_ERROR = 'API_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW', // 警告，不影响核心功能
  MEDIUM = 'MEDIUM', // 部分功能受影响，但有回退方案
  HIGH = 'HIGH', // 严重影响，需要用户干预
}

// 错误信息
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  resolved?: boolean;
  fallbackUsed?: boolean;
}

// 回退策略
export interface FallbackStrategy {
  name: string;
  description: string;
  execute: () => Promise<any>;
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100; // 最多保留100条错误记录

  /**
   * 捕获并处理错误
   */
  async handleError(
    error: any,
    context: string,
    fallback?: FallbackStrategy
  ): Promise<{ success: boolean; result?: any; errorInfo?: ErrorInfo }> {
    // 确定错误类型
    const errorType = this.determineErrorType(error);

    // 确定错误严重程度
    const severity = this.determineErrorSeverity(error, errorType);

    // 创建错误信息
    const errorInfo: ErrorInfo = {
      type: errorType,
      severity,
      message: error.message || '未知错误',
      details: error,
      timestamp: new Date(),
      resolved: false,
      fallbackUsed: false,
    };

    console.error(`\n❌ [${context}] 发生错误:`);
    console.error(`   类型: ${errorType}`);
    console.error(`   严重程度: ${severity}`);
    console.error(`   消息: ${error.message}`);
    if (error.details) {
      console.error(`   详情:`, error.details);
    }

    // 记录错误
    this.recordError(errorInfo);

    // 如果有回退策略，尝试执行
    if (fallback) {
      console.log(`\n🔄 尝试回退策略: ${fallback.name}`);
      try {
        const result = await fallback.execute();
        errorInfo.resolved = true;
        errorInfo.fallbackUsed = true;
        console.log(`✅ 回退策略执行成功`);
        return { success: true, result, errorInfo };
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : '未知错误';
        console.error(`❌ 回退策略执行失败:`, fallbackErrorMessage);
      }
    }

    return { success: false, errorInfo };
  }

  /**
   * 确定错误类型
   */
  private determineErrorType(error: any): ErrorType {
    if (error.response) {
      // HTTP 错误
      return ErrorType.API_ERROR;
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      // 超时错误
      return ErrorType.TIMEOUT_ERROR;
    } else if (error.name === 'ValidationError') {
      // 验证错误
      return ErrorType.VALIDATION_ERROR;
    } else if (error.message?.includes('data') || error.message?.includes('parse')) {
      // 数据错误
      return ErrorType.DATA_ERROR;
    } else {
      // 未知错误
      return ErrorType.UNKNOWN_ERROR;
    }
  }

  /**
   * 确定错误严重程度
   */
  private determineErrorSeverity(error: any, errorType: ErrorType): ErrorSeverity {
    // 根据错误类型和内容判断严重程度
    if (errorType === ErrorType.VALIDATION_ERROR) {
      return ErrorSeverity.HIGH; // 验证错误通常需要用户干预
    } else if (errorType === ErrorType.TIMEOUT_ERROR) {
      return ErrorSeverity.MEDIUM; // 超时可以重试
    } else if (errorType === ErrorType.API_ERROR) {
      const statusCode = error.response?.status;
      if (statusCode >= 500) {
        return ErrorSeverity.MEDIUM; // 服务器错误可以重试
      } else if (statusCode >= 400) {
        return ErrorSeverity.HIGH; // 客户端错误需要修正
      }
    }

    return ErrorSeverity.LOW;
  }

  /**
   * 记录错误
   */
  private recordError(errorInfo: ErrorInfo): void {
    this.errors.push(errorInfo);

    // 限制错误记录数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * 获取错误记录
   */
  getErrors(severity?: ErrorSeverity): ErrorInfo[] {
    if (severity) {
      return this.errors.filter((e) => e.severity === severity);
    }
    return [...this.errors];
  }

  /**
   * 清除错误记录
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    resolved: number;
    fallbackUsed: number;
  } {
    const byType: Record<ErrorType, number> = {
      [ErrorType.API_ERROR]: 0,
      [ErrorType.DATA_ERROR]: 0,
      [ErrorType.VALIDATION_ERROR]: 0,
      [ErrorType.TIMEOUT_ERROR]: 0,
      [ErrorType.UNKNOWN_ERROR]: 0,
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
    };

    let resolved = 0;
    let fallbackUsed = 0;

    for (const error of this.errors) {
      byType[error.type]++;
      bySeverity[error.severity]++;
      if (error.resolved) resolved++;
      if (error.fallbackUsed) fallbackUsed++;
    }

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      resolved,
      fallbackUsed,
    };
  }

  /**
   * 验证行程数据
   */
  validateItinerary(itinerary: FullItinerary): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查行程是否为空
    if (!itinerary || !itinerary.itinerary || itinerary.itinerary.length === 0) {
      errors.push('行程为空');
      return { valid: false, errors, warnings };
    }

    // 检查每一天的数据
    for (const day of itinerary.itinerary) {
      if (!day.day || day.day < 1) {
        errors.push(`第 ${day.day} 天的天数无效`);
      }

      if (!day.date) {
        errors.push(`第 ${day.day} 天缺少日期`);
      }

      if (!day.attractions || day.attractions.length === 0) {
        warnings.push(`第 ${day.day} 天没有安排景点`);
      }

      // 检查景点数据
      for (const attraction of day.attractions) {
        if (!attraction.id && !attraction.spotId) {
          errors.push(`第 ${day.day} 天有景点缺少 ID`);
        }

        if (!attraction.name) {
          errors.push(`第 ${day.day} 天有景点缺少名称`);
        }

        if (!attraction.location) {
          warnings.push(`第 ${day.day} 天的 ${attraction.name} 缺少位置信息`);
        }

        if (!attraction.time) {
          warnings.push(`第 ${day.day} 天的 ${attraction.name} 缺少时间信息`);
        }
      }
    }

    // 检查预算
    if (itinerary.total_cost < 0) {
      errors.push('总费用不能为负数');
    }

    if (!itinerary.budget_breakdown) {
      errors.push('缺少预算明细');
    }

    const valid = errors.length === 0;
    return { valid, errors, warnings };
  }

  /**
   * 生成简化版行程（回退方案）
   */
  generateFallbackItinerary(originalItinerary: FullItinerary): FullItinerary {
    console.log('\n🔄 生成简化版行程作为回退方案...');

    // 简化策略：每天只保留前2个景点
    const simplifiedItinerary = originalItinerary.itinerary.map((day) => ({
      ...day,
      attractions: day.attractions.slice(0, 2),
    }));

    // 重新计算费用
    const tickets = simplifiedItinerary.reduce((sum, day) => {
      return sum + day.attractions.reduce((daySum, attr) => daySum + attr.estimated_cost, 0);
    }, 0);

    const days = simplifiedItinerary.length;
    const originalDays = originalItinerary.itinerary.length;

    // 按比例减少住宿和餐饮费用
    const accommodation = Math.round(
      originalItinerary.budget_breakdown.accommodation * (days / originalDays)
    );
    const dining = Math.round(originalItinerary.budget_breakdown.dining * (days / originalDays));
    const transportation = Math.round(originalItinerary.budget_breakdown.transportation * 0.8);

    const total_cost = tickets + accommodation + dining + transportation;

    return {
      ...originalItinerary,
      itinerary: simplifiedItinerary,
      total_cost,
      budget_breakdown: {
        transportation,
        accommodation,
        dining,
        tickets,
      },
    };
  }

  /**
   * 生成错误报告
   */
  generateErrorReport(): string {
    const stats = this.getErrorStats();
    const recentErrors = this.errors.slice(-5); // 最近5条错误

    let report = '\n📊 错误统计报告\n';
    report += '='.repeat(40) + '\n';
    report += `总错误数: ${stats.total}\n`;
    report += `已解决: ${stats.resolved}\n`;
    report += `使用回退: ${stats.fallbackUsed}\n\n`;

    report += '按类型统计:\n';
    for (const [type, count] of Object.entries(stats.byType)) {
      report += `  ${type}: ${count}\n`;
    }

    report += '\n按严重程度统计:\n';
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      report += `  ${severity}: ${count}\n`;
    }

    if (recentErrors.length > 0) {
      report += '\n最近的错误:\n';
      for (const error of recentErrors) {
        report += `  [${error.timestamp.toISOString()}] ${error.type} - ${error.message}\n`;
      }
    }

    return report;
  }
}

// 导出单例
export const errorHandler = new ErrorHandler();

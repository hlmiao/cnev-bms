import { ErrorContext, ErrorCategory, ErrorSeverity } from '../interfaces/ErrorHandler.js';

/**
 * 错误处理工具类
 */
export class ErrorUtils {
  /**
   * 创建错误上下文
   * @param operation 操作类型
   * @param filePath 文件路径
   * @param rowIndex 行号
   * @param columnName 列名
   * @param dataValue 数据值
   * @param retryCount 重试次数
   * @returns 错误上下文
   */
  static createContext(
    operation: string,
    filePath?: string | undefined,
    rowIndex?: number | undefined,
    columnName?: string | undefined,
    dataValue?: any,
    retryCount?: number | undefined
  ): ErrorContext {
    return {
      operation,
      filePath: filePath || undefined,
      rowIndex: rowIndex || undefined,
      columnName: columnName || undefined,
      dataValue,
      timestamp: new Date(),
      retryCount: retryCount || undefined
    };
  }

  /**
   * 包装异步操作，提供错误处理
   * @param operation 异步操作
   * @param context 错误上下文
   * @param maxRetries 最大重试次数
   * @param retryDelay 重试延迟
   * @returns 操作结果
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    _context: ErrorContext,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries && this.isRetryableError(error as Error)) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // 指数退避
          continue;
        }
        
        break;
      }
    }
    
    throw lastError!;
  }

  /**
   * 判断错误是否可重试
   * @param error 错误对象
   * @returns 是否可重试
   */
  static isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'econnreset',
      'enotfound',
      'temporary'
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * 延迟执行
   * @param ms 延迟毫秒数
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 安全地解析JSON
   * @param jsonString JSON字符串
   * @param defaultValue 默认值
   * @returns 解析结果
   */
  static safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  }

  /**
   * 安全地访问对象属性
   * @param obj 对象
   * @param path 属性路径
   * @param defaultValue 默认值
   * @returns 属性值
   */
  static safeGet<T>(obj: any, path: string, defaultValue: T): T {
    try {
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result == null || typeof result !== 'object') {
          return defaultValue;
        }
        result = result[key];
      }
      
      return result !== undefined ? result : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 验证文件路径
   * @param filePath 文件路径
   * @returns 是否有效
   */
  static isValidFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }
    
    // 检查路径长度
    if (filePath.length > 260) { // Windows路径长度限制
      return false;
    }
    
    // 检查非法字符
    const illegalChars = /[<>:"|?*]/;
    if (illegalChars.test(filePath)) {
      return false;
    }
    
    return true;
  }

  /**
   * 清理文件路径
   * @param filePath 文件路径
   * @returns 清理后的路径
   */
  static sanitizeFilePath(filePath: string): string {
    if (!filePath) return '';
    
    return filePath
      .replace(/[<>:"|?*]/g, '_') // 替换非法字符
      .replace(/\\/g, '/') // 统一使用正斜杠
      .replace(/\/+/g, '/') // 合并多个斜杠
      .trim();
  }

  /**
   * 格式化错误消息
   * @param error 错误对象
   * @param context 错误上下文
   * @returns 格式化的错误消息
   */
  static formatErrorMessage(error: Error, context: ErrorContext): string {
    let message = `${context.operation}失败: ${error.message}`;
    
    if (context.filePath) {
      message += ` (文件: ${context.filePath})`;
    }
    
    if (context.rowIndex !== undefined) {
      message += ` (行: ${context.rowIndex + 1})`;
    }
    
    if (context.columnName) {
      message += ` (列: ${context.columnName})`;
    }
    
    return message;
  }

  /**
   * 创建错误摘要
   * @param errors 错误列表
   * @returns 错误摘要
   */
  static createErrorSummary(errors: Array<{ category: ErrorCategory; severity: ErrorSeverity; message: string }>): string {
    if (errors.length === 0) {
      return '无错误';
    }
    
    const categoryCounts: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;
    const severityCounts: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    
    errors.forEach(error => {
      categoryCounts[error.category] = (categoryCounts[error.category] || 0) + 1;
      severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1;
    });
    
    let summary = `总计 ${errors.length} 个错误:\n`;
    
    // 按严重程度统计
    summary += '严重程度分布:\n';
    Object.entries(severityCounts).forEach(([severity, count]) => {
      summary += `  ${severity}: ${count}\n`;
    });
    
    // 按分类统计
    summary += '错误分类分布:\n';
    Object.entries(categoryCounts).forEach(([category, count]) => {
      summary += `  ${category}: ${count}\n`;
    });
    
    return summary;
  }

  /**
   * 检查内存使用情况
   * @returns 内存使用信息
   */
  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    
    return {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100)
    };
  }

  /**
   * 检查是否内存不足
   * @param threshold 阈值百分比
   * @returns 是否内存不足
   */
  static isMemoryLow(threshold: number = 90): boolean {
    const memUsage = this.getMemoryUsage();
    return memUsage.percentage > threshold;
  }
}
import { ErrorHandler } from '../interfaces/ErrorHandler.js';
import { ConversionReporter } from '../interfaces/ConversionReporter.js';
import { ErrorUtils } from '../utils/errorUtils.js';
import { logger } from '../utils/logger.js';

/**
 * 错误处理中间件
 * 提供统一的错误处理和报告功能
 */
export class ErrorMiddleware {
  constructor(
    private errorHandler: ErrorHandler,
    private reporter?: ConversionReporter,
    private reportId?: string
  ) {}

  /**
   * 包装文件操作，提供错误处理
   * @param operation 文件操作
   * @param filePath 文件路径
   * @param operationName 操作名称
   * @returns 操作结果
   */
  async wrapFileOperation<T>(
    operation: () => Promise<T>,
    filePath: string,
    operationName: string
  ): Promise<T | null> {
    const context = ErrorUtils.createContext(operationName, filePath);
    
    try {
      return await ErrorUtils.withErrorHandling(
        operation,
        context,
        this.errorHandler.getStrategy().maxRetries,
        this.errorHandler.getStrategy().retryDelay
      );
    } catch (error) {
      const result = await this.errorHandler.handleFileError(error as Error, context);
      
      // 记录到报告
      if (this.reporter && this.reportId) {
        if (result.processedError) {
          this.reporter.recordError(this.reportId, result.processedError);
        }
        if (result.processedWarning) {
          this.reporter.recordWarning(this.reportId, result.processedWarning);
        }
      }
      
      if (!result.shouldContinue) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * 包装数据处理操作，提供行级错误处理
   * @param operation 数据处理操作
   * @param filePath 文件路径
   * @param rowIndex 行索引
   * @param operationName 操作名称
   * @returns 操作结果
   */
  async wrapRowOperation<T>(
    operation: () => Promise<T>,
    filePath: string,
    rowIndex: number,
    operationName: string,
    columnName?: string,
    dataValue?: any
  ): Promise<T | null> {
    const context = ErrorUtils.createContext(
      operationName,
      filePath,
      rowIndex,
      columnName,
      dataValue
    );
    
    try {
      return await operation();
    } catch (error) {
      const result = await this.errorHandler.handleRowError(error as Error, context);
      
      // 记录到报告
      if (this.reporter && this.reportId) {
        if (result.processedError) {
          this.reporter.recordError(this.reportId, result.processedError);
        }
        if (result.processedWarning) {
          this.reporter.recordWarning(this.reportId, result.processedWarning);
        }
      }
      
      if (!result.shouldContinue) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * 包装验证操作，提供验证错误处理
   * @param operation 验证操作
   * @param filePath 文件路径
   * @param rowIndex 行索引
   * @param columnName 列名
   * @param dataValue 数据值
   * @param operationName 操作名称
   * @returns 操作结果
   */
  async wrapValidationOperation<T>(
    operation: () => Promise<T>,
    filePath: string,
    rowIndex: number,
    columnName: string,
    dataValue: any,
    operationName: string = '数据验证'
  ): Promise<T | null> {
    const context = ErrorUtils.createContext(
      operationName,
      filePath,
      rowIndex,
      columnName,
      dataValue
    );
    
    try {
      return await operation();
    } catch (error) {
      const result = await this.errorHandler.handleValidationError(error as Error, context);
      
      // 记录到报告
      if (this.reporter && this.reportId) {
        if (result.processedError) {
          this.reporter.recordError(this.reportId, result.processedError);
        }
        if (result.processedWarning) {
          this.reporter.recordWarning(this.reportId, result.processedWarning);
        }
      }
      
      if (!result.shouldContinue) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * 批量处理操作，提供错误统计和控制
   * @param items 待处理项目
   * @param processor 处理函数
   * @param operationName 操作名称
   * @returns 处理结果
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    operationName: string
  ): Promise<{
    results: (R | null)[];
    successCount: number;
    errorCount: number;
    shouldAbort: boolean;
  }> {
    const results: (R | null)[] = [];
    let successCount = 0;
    let errorCount = 0;
    let shouldAbort = false;
    const strategy = this.errorHandler.getStrategy();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const result = await processor(item, i);
        results.push(result);
        successCount++;
      } catch (error) {
        const context = ErrorUtils.createContext(
          operationName,
          undefined,
          i,
          undefined,
          item
        );
        
        const handlingResult = await this.errorHandler.handleRowError(error as Error, context);
        
        // 记录到报告
        if (this.reporter && this.reportId) {
          if (handlingResult.processedError) {
            this.reporter.recordError(this.reportId, handlingResult.processedError);
          }
          if (handlingResult.processedWarning) {
            this.reporter.recordWarning(this.reportId, handlingResult.processedWarning);
          }
        }
        
        results.push(null);
        errorCount++;
        
        // 检查是否应该中止
        if (!handlingResult.shouldContinue) {
          shouldAbort = true;
          break;
        }
        
        // 检查错误数量是否超过限制
        if (errorCount >= strategy.maxErrorsPerFile) {
          logger.warn(`错误数量超过限制 (${strategy.maxErrorsPerFile})，中止批量处理`);
          shouldAbort = true;
          break;
        }
      }
      
      // 检查内存使用情况
      if (i % 100 === 0 && ErrorUtils.isMemoryLow()) {
        logger.warn('内存使用率过高，暂停处理');
        await ErrorUtils.delay(1000);
        
        // 强制垃圾回收（如果可用）
        if (global.gc) {
          global.gc();
        }
      }
    }
    
    return {
      results,
      successCount,
      errorCount,
      shouldAbort
    };
  }

  /**
   * 设置报告器
   * @param reporter 转换报告器
   * @param reportId 报告ID
   */
  setReporter(reporter: ConversionReporter, reportId: string): void {
    this.reporter = reporter;
    this.reportId = reportId;
  }

  /**
   * 获取错误统计
   * @returns 错误统计
   */
  getErrorStatistics() {
    return this.errorHandler.getErrorStatistics();
  }

  /**
   * 重置错误统计
   */
  resetErrorStatistics(): void {
    this.errorHandler.resetStatistics();
  }

  /**
   * 检查是否应该继续处理
   * @param currentErrors 当前错误数
   * @returns 是否应该继续
   */
  shouldContinueProcessing(currentErrors: number): boolean {
    const strategy = this.errorHandler.getStrategy();
    
    if (!strategy.continueOnError) {
      return currentErrors === 0;
    }
    
    return currentErrors < strategy.maxErrorsPerFile;
  }

  /**
   * 生成错误报告摘要
   * @returns 错误报告摘要
   */
  generateErrorSummary(): string {
    const stats = this.errorHandler.getErrorStatistics();
    
    if (stats.totalErrors === 0) {
      return '处理过程中未发现错误';
    }
    
    let summary = `错误处理摘要:\n`;
    summary += `总错误数: ${stats.totalErrors}\n\n`;
    
    summary += '按分类统计:\n';
    Object.entries(stats.errorsByCategory).forEach(([category, count]) => {
      summary += `  ${category}: ${count}\n`;
    });
    
    summary += '\n按严重程度统计:\n';
    Object.entries(stats.errorsBySeverity).forEach(([severity, count]) => {
      summary += `  ${severity}: ${count}\n`;
    });
    
    return summary;
  }
}
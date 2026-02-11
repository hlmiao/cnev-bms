import { 
  ErrorHandler, 
  ErrorHandlingStrategy, 
  ErrorHandlingResult, 
  ErrorContext, 
  ErrorCategory, 
  ErrorSeverity 
} from '../interfaces/ErrorHandler.js';
import { ConversionError, ConversionWarning } from '../types/index.js';
import { logger, LogCategory } from '../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * 默认错误处理策略
 */
const DEFAULT_STRATEGY: ErrorHandlingStrategy = {
  onFileNotFound: 'warn',
  onParseError: 'skip-row',
  onValidationError: 'mark-invalid',
  maxErrorsPerFile: 100,
  continueOnError: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * 错误处理器实现
 */
export class ErrorHandlerImpl implements ErrorHandler {
  private strategy: ErrorHandlingStrategy = DEFAULT_STRATEGY;
  private errorStatistics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>
  };

  /**
   * 设置错误处理策略
   * @param strategy 错误处理策略
   */
  setStrategy(strategy: ErrorHandlingStrategy): void {
    this.strategy = { ...DEFAULT_STRATEGY, ...strategy };
    logger.info(`错误处理策略已更新: ${JSON.stringify(this.strategy)}`, LogCategory.ERROR_HANDLER);
  }

  /**
   * 获取当前错误处理策略
   * @returns 错误处理策略
   */
  getStrategy(): ErrorHandlingStrategy {
    return { ...this.strategy };
  }

  /**
   * 处理文件级错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  async handleFileError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const category = this.categorizeError(error, context);
    const severity = this.determineSeverity(error, context);
    
    this.updateStatistics(category, severity);

    logger.error(`文件级错误: ${error.message}`, error, LogCategory.ERROR_HANDLER, {
      filePath: context.filePath,
      operation: context.operation,
      category,
      severity
    });

    // 根据错误类型和策略决定处理方式
    if (category === 'file_access' && error.message.includes('ENOENT')) {
      return this.handleFileNotFoundError(error, context, category, severity);
    }

    if (category === 'file_format') {
      return this.handleFileFormatError(error, context, category, severity);
    }

    // 默认处理
    const shouldRetry = this.shouldRetry(error, context);
    const shouldContinue = this.strategy.continueOnError && severity !== 'critical';

    return {
      shouldContinue,
      shouldRetry,
      retryDelay: shouldRetry ? this.strategy.retryDelay : undefined,
      processedError: this.createConversionError(error, context, category, severity)
    };
  }

  /**
   * 处理数据行级错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  async handleRowError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const category = this.categorizeError(error, context);
    const severity = this.determineSeverity(error, context);
    
    this.updateStatistics(category, severity);

    logger.warn(`数据行级错误: ${error.message}`, LogCategory.ERROR_HANDLER, {
      filePath: context.filePath,
      rowIndex: context.rowIndex,
      columnName: context.columnName,
      operation: context.operation,
      category,
      severity
    });

    // 根据解析错误策略处理
    switch (this.strategy.onParseError) {
      case 'skip-row':
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(
            `跳过第 ${context.rowIndex} 行: ${error.message}`,
            context
          )
        };

      case 'skip-file':
        return {
          shouldContinue: false,
          shouldRetry: false,
          processedError: this.createConversionError(error, context, category, severity)
        };

      case 'abort':
        return {
          shouldContinue: false,
          shouldRetry: false,
          processedError: this.createConversionError(error, context, category, 'critical')
        };

      default:
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(error.message, context)
        };
    }
  }

  /**
   * 处理验证错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  async handleValidationError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const category = this.categorizeError(error, context);
    const severity = this.determineSeverity(error, context);
    
    this.updateStatistics(category, severity);

    logger.warn(`数据验证错误: ${error.message}`, LogCategory.ERROR_HANDLER, {
      filePath: context.filePath,
      rowIndex: context.rowIndex,
      columnName: context.columnName,
      dataValue: context.dataValue,
      operation: context.operation,
      category,
      severity
    });

    // 根据验证错误策略处理
    switch (this.strategy.onValidationError) {
      case 'mark-invalid':
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(
            `数据验证失败: ${error.message}`,
            context
          )
        };

      case 'skip-data':
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(
            `跳过无效数据: ${error.message}`,
            context
          )
        };

      case 'abort':
        return {
          shouldContinue: false,
          shouldRetry: false,
          processedError: this.createConversionError(error, context, category, 'high')
        };

      default:
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(error.message, context)
        };
    }
  }

  /**
   * 分类错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误分类
   */
  categorizeError(error: Error, _context: ErrorContext): ErrorCategory {
    const message = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // 文件访问错误
    if (message.includes('enoent') || message.includes('eacces') || message.includes('eperm')) {
      return 'file_access';
    }

    // 文件格式错误
    if (message.includes('csv') || message.includes('format')) {
      return 'file_format';
    }

    // 数据解析错误
    if (message.includes('parse') || message.includes('invalid') || errorName.includes('syntaxerror')) {
      return 'data_parsing';
    }

    // 数据验证错误
    if (message.includes('validation') || message.includes('range') || message.includes('type')) {
      return 'data_validation';
    }

    // 数据转换错误
    if (message.includes('transform') || message.includes('convert') || message.includes('mapping')) {
      return 'data_transform';
    }

    // 内存错误
    if (message.includes('memory') || message.includes('heap') || errorName.includes('rangeerror')) {
      return 'memory_error';
    }

    // 网络错误
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return 'network_error';
    }

    // 默认为系统错误
    return 'system_error';
  }

  /**
   * 确定错误严重程度
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误严重程度
   */
  determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
    const category = this.categorizeError(error, context);
    const message = error.message.toLowerCase();

    // 严重错误
    if (category === 'memory_error' || category === 'system_error') {
      return 'critical';
    }

    // 高级错误
    if (category === 'file_access' && message.includes('eperm')) {
      return 'high';
    }

    if (category === 'data_transform' || category === 'network_error') {
      return 'high';
    }

    // 中级错误
    if (category === 'file_format' || category === 'data_parsing') {
      return 'medium';
    }

    // 低级错误
    if (category === 'data_validation') {
      return 'low';
    }

    // 文件不存在通常是低级错误
    if (category === 'file_access' && message.includes('enoent')) {
      return 'low';
    }

    // 默认为中级
    return 'medium';
  }

  /**
   * 创建转换错误对象
   * @param error 原始错误
   * @param context 错误上下文
   * @param category 错误分类
   * @param severity 错误严重程度
   * @returns 转换错误对象
   */
  createConversionError(
    error: Error, 
    context: ErrorContext, 
    category: ErrorCategory, 
    severity: ErrorSeverity
  ): ConversionError {
    return {
      errorId: randomUUID(),
      type: this.mapCategoryToErrorType(category),
      severity,
      filePath: context.filePath || undefined,
      rowIndex: context.rowIndex || undefined,
      field: context.columnName || undefined,
      message: error.message,
      details: `操作: ${context.operation}, 分类: ${category}${context.dataValue ? `, 数据值: ${context.dataValue}` : ''}`,
      timestamp: context.timestamp
    };
  }

  /**
   * 创建转换警告对象
   * @param message 警告消息
   * @param context 错误上下文
   * @returns 转换警告对象
   */
  createConversionWarning(message: string, context: ErrorContext): ConversionWarning {
    return {
      warningId: randomUUID(),
      type: this.mapOperationToWarningType(context.operation),
      filePath: context.filePath || undefined,
      rowIndex: context.rowIndex || undefined,
      field: context.columnName || undefined,
      message,
      suggestion: this.generateSuggestion(message, context),
      timestamp: context.timestamp
    };
  }

  /**
   * 检查是否应该重试
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 是否应该重试
   */
  shouldRetry(error: Error, context: ErrorContext): boolean {
    const retryCount = context.retryCount || 0;
    
    if (retryCount >= this.strategy.maxRetries) {
      return false;
    }

    const category = this.categorizeError(error, context);
    
    // 这些类型的错误可以重试
    const retryableCategories: ErrorCategory[] = [
      'network_error',
      'system_error',
      'file_access'
    ];

    return retryableCategories.includes(category);
  }

  /**
   * 获取错误统计信息
   * @returns 错误统计
   */
  getErrorStatistics() {
    return {
      totalErrors: this.errorStatistics.totalErrors,
      errorsByCategory: { ...this.errorStatistics.errorsByCategory },
      errorsBySeverity: { ...this.errorStatistics.errorsBySeverity }
    };
  }

  /**
   * 重置错误统计
   */
  resetStatistics(): void {
    this.errorStatistics = {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>
    };
    logger.info('错误统计已重置', LogCategory.ERROR_HANDLER);
  }

  /**
   * 处理文件不存在错误
   */
  private handleFileNotFoundError(
    error: Error, 
    context: ErrorContext, 
    category: ErrorCategory, 
    _severity: ErrorSeverity
  ): ErrorHandlingResult {
    switch (this.strategy.onFileNotFound) {
      case 'skip':
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(
            `文件不存在，已跳过: ${context.filePath}`,
            context
          )
        };

      case 'warn':
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(
            `文件不存在: ${context.filePath}`,
            context
          )
        };

      case 'error':
        return {
          shouldContinue: false,
          shouldRetry: false,
          processedError: this.createConversionError(error, context, category, 'high')
        };

      default:
        return {
          shouldContinue: true,
          shouldRetry: false,
          processedWarning: this.createConversionWarning(error.message, context)
        };
    }
  }

  /**
   * 处理文件格式错误
   */
  private handleFileFormatError(
    error: Error, 
    context: ErrorContext, 
    category: ErrorCategory, 
    severity: ErrorSeverity
  ): ErrorHandlingResult {
    const shouldRetry = this.shouldRetry(error, context);
    
    return {
      shouldContinue: this.strategy.continueOnError,
      shouldRetry,
      retryDelay: shouldRetry ? this.strategy.retryDelay : undefined,
      processedError: this.createConversionError(error, context, category, severity)
    };
  }

  /**
   * 更新错误统计
   */
  private updateStatistics(category: ErrorCategory, severity: ErrorSeverity): void {
    this.errorStatistics.totalErrors++;
    this.errorStatistics.errorsByCategory[category] = (this.errorStatistics.errorsByCategory[category] || 0) + 1;
    this.errorStatistics.errorsBySeverity[severity] = (this.errorStatistics.errorsBySeverity[severity] || 0) + 1;
  }

  /**
   * 映射错误分类到转换错误类型
   */
  private mapCategoryToErrorType(category: ErrorCategory): ConversionError['type'] {
    switch (category) {
      case 'file_access':
      case 'file_format':
        return 'file_error';
      case 'data_parsing':
        return 'parse_error';
      case 'data_validation':
        return 'validation_error';
      case 'data_transform':
        return 'transformation_error';
      case 'system_error':
      case 'memory_error':
      case 'network_error':
        return 'storage_error';
      default:
        return 'parse_error';
    }
  }

  /**
   * 映射操作类型到警告类型
   */
  private mapOperationToWarningType(operation: string): ConversionWarning['type'] {
    if (operation.includes('parse') || operation.includes('format')) {
      return 'format_issue';
    }
    if (operation.includes('验证') || operation.includes('validate') || operation.includes('quality')) {
      return 'data_quality';
    }
    if (operation.includes('performance') || operation.includes('memory')) {
      return 'performance';
    }
    return 'configuration';
  }

  /**
   * 生成建议
   */
  private generateSuggestion(message: string, _context: ErrorContext): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('文件不存在')) {
      return '请检查文件路径是否正确，确保文件存在且可访问';
    }
    
    if (lowerMessage.includes('解析') || lowerMessage.includes('格式')) {
      return '请检查CSV文件格式是否正确，确保列分隔符和编码格式正确';
    }
    
    if (lowerMessage.includes('验证') || lowerMessage.includes('范围')) {
      return '请检查数据值是否在合理范围内，或调整验证规则';
    }
    
    if (lowerMessage.includes('内存')) {
      return '建议分批处理大文件或增加系统内存';
    }
    
    return '请查看详细错误信息并联系技术支持';
  }
}
import { ConversionError, ConversionWarning } from '../types/index.js';

/**
 * 错误处理策略配置
 */
export interface ErrorHandlingStrategy {
  /** 文件不存在时的处理策略 */
  onFileNotFound: 'skip' | 'warn' | 'error';
  /** 解析错误时的处理策略 */
  onParseError: 'skip-row' | 'skip-file' | 'abort';
  /** 验证错误时的处理策略 */
  onValidationError: 'mark-invalid' | 'skip-data' | 'abort';
  /** 每个文件允许的最大错误数 */
  maxErrorsPerFile: number;
  /** 遇到错误时是否继续处理 */
  continueOnError: boolean;
  /** 错误重试次数 */
  maxRetries: number;
  /** 重试间隔(毫秒) */
  retryDelay: number;
}

/**
 * 错误严重程度
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * 错误分类
 */
export type ErrorCategory = 
  | 'file_access'     // 文件访问错误
  | 'file_format'     // 文件格式错误
  | 'data_parsing'    // 数据解析错误
  | 'data_validation' // 数据验证错误
  | 'data_transform'  // 数据转换错误
  | 'system_error'    // 系统错误
  | 'network_error'   // 网络错误
  | 'memory_error';   // 内存错误

/**
 * 错误处理结果
 */
export interface ErrorHandlingResult {
  /** 是否应该继续处理 */
  shouldContinue: boolean;
  /** 是否应该重试 */
  shouldRetry: boolean;
  /** 重试延迟时间(毫秒) */
  retryDelay?: number | undefined;
  /** 处理后的错误信息 */
  processedError?: ConversionError | undefined;
  /** 处理后的警告信息 */
  processedWarning?: ConversionWarning | undefined;
}

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  /** 文件路径 */
  filePath?: string | undefined;
  /** 行号 */
  rowIndex?: number | undefined;
  /** 列名 */
  columnName?: string | undefined;
  /** 数据值 */
  dataValue?: any;
  /** 操作类型 */
  operation: string;
  /** 错误发生时间 */
  timestamp: Date;
  /** 重试次数 */
  retryCount?: number | undefined;
}

/**
 * 错误处理器接口
 */
export interface ErrorHandler {
  /**
   * 设置错误处理策略
   * @param strategy 错误处理策略
   */
  setStrategy(strategy: ErrorHandlingStrategy): void;

  /**
   * 获取当前错误处理策略
   * @returns 错误处理策略
   */
  getStrategy(): ErrorHandlingStrategy;

  /**
   * 处理文件级错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  handleFileError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult>;

  /**
   * 处理数据行级错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  handleRowError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult>;

  /**
   * 处理验证错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误处理结果
   */
  handleValidationError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult>;

  /**
   * 分类错误
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误分类
   */
  categorizeError(error: Error, context: ErrorContext): ErrorCategory;

  /**
   * 确定错误严重程度
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 错误严重程度
   */
  determineSeverity(error: Error, context: ErrorContext): ErrorSeverity;

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
  ): ConversionError;

  /**
   * 创建转换警告对象
   * @param message 警告消息
   * @param context 错误上下文
   * @returns 转换警告对象
   */
  createConversionWarning(message: string, context: ErrorContext): ConversionWarning;

  /**
   * 检查是否应该重试
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 是否应该重试
   */
  shouldRetry(error: Error, context: ErrorContext): boolean;

  /**
   * 获取错误统计信息
   * @returns 错误统计
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  };

  /**
   * 重置错误统计
   */
  resetStatistics(): void;
}
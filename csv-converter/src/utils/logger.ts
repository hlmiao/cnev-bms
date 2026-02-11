import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 日志级别定义
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 日志类别定义
export enum LogCategory {
  SYSTEM = 'system',
  FILE_SCANNER = 'file-scanner',
  FILE_PARSER = 'file-parser',
  DATA_TRANSFORMER = 'data-transformer',
  DATA_VALIDATOR = 'data-validator',
  CONVERSION_REPORTER = 'conversion-reporter',
  ERROR_HANDLER = 'error-handler',
  PERFORMANCE = 'performance'
}

// 日志配置接口
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory: string;
  maxFileSize: number;
  maxFiles: number;
  enableRotation: boolean;
  enableStructuredLogging: boolean;
  enablePerformanceLogging: boolean;
}

// 默认配置
const defaultConfig: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  logDirectory: 'logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  enableRotation: true,
  enableStructuredLogging: true,
  enablePerformanceLogging: true
};

// 确保日志目录存在
function ensureLogDirectory(logDir: string): void {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// 创建自定义日志格式
function createLogFormat(enableStructured: boolean): winston.Logform.Format {
  const baseFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true })
  );

  if (enableStructured) {
    return winston.format.combine(
      baseFormat,
      winston.format.json(),
      winston.format.printf((info) => {
        const { timestamp, level, message, category, operation, duration, stack, ...meta } = info as any;
        
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          category: category || 'GENERAL',
          message: stack || message,
          ...(operation && { operation }),
          ...(duration !== undefined && { duration: `${duration}ms` }),
          ...(Object.keys(meta).length > 0 && { metadata: meta })
        };

        return JSON.stringify(logEntry);
      })
    );
  } else {
    return winston.format.combine(
      baseFormat,
      winston.format.printf((info) => {
        const { timestamp, level, message, category, operation, duration, stack } = info as any;
        const categoryStr = category ? `[${category.toUpperCase()}]` : '';
        const operationStr = operation ? `[${operation}]` : '';
        const durationStr = duration !== undefined ? `(${duration}ms)` : '';
        
        return `${timestamp} [${level.toUpperCase()}]${categoryStr}${operationStr}: ${stack || message} ${durationStr}`;
      })
    );
  }
}

// 日志管理器类
class LoggerManager {
  private static instance: LoggerManager;
  private logger!: winston.Logger;
  private config: LoggerConfig;
  private performanceTimers: Map<string, number> = new Map();

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupLogger();
  }

  public static getInstance(config?: Partial<LoggerConfig>): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager(config);
    }
    return LoggerManager.instance;
  }

  private setupLogger(): void {
    // 确保日志目录存在
    ensureLogDirectory(this.config.logDirectory);

    const transports: winston.transport[] = [];

    // 控制台传输
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          level: this.config.level,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info) => {
              const { timestamp, level, message, category, operation, duration, stack } = info as any;
              const categoryStr = category ? `[${category.toUpperCase()}]` : '';
              const operationStr = operation ? `[${operation}]` : '';
              const durationStr = duration !== undefined ? `(${duration}ms)` : '';
              
              return `${timestamp} ${level}${categoryStr}${operationStr}: ${stack || message} ${durationStr}`;
            })
          )
        })
      );
    }

    // 文件传输
    if (this.config.enableFile) {
      const logFormat = createLogFormat(this.config.enableStructuredLogging);

      // 通用日志文件
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'converter.log'),
          level: this.config.level,
          format: logFormat,
          maxsize: this.config.maxFileSize,
          maxFiles: this.config.maxFiles,
          tailable: this.config.enableRotation
        })
      );

      // 错误日志文件
      transports.push(
        new winston.transports.File({
          filename: path.join(this.config.logDirectory, 'error.log'),
          level: LogLevel.ERROR,
          format: logFormat,
          maxsize: this.config.maxFileSize,
          maxFiles: this.config.maxFiles,
          tailable: this.config.enableRotation
        })
      );

      // 性能日志文件
      if (this.config.enablePerformanceLogging) {
        transports.push(
          new winston.transports.File({
            filename: path.join(this.config.logDirectory, 'performance.log'),
            level: LogLevel.INFO,
            format: logFormat,
            maxsize: this.config.maxFileSize,
            maxFiles: this.config.maxFiles,
            tailable: this.config.enableRotation
          })
        );
      }

      // 按类别分类的日志文件
      Object.values(LogCategory).forEach(category => {
        if (category !== LogCategory.PERFORMANCE) {
          transports.push(
            new winston.transports.File({
              filename: path.join(this.config.logDirectory, `${category}.log`),
              level: this.config.level,
              format: logFormat,
              maxsize: this.config.maxFileSize,
              maxFiles: 5, // 类别日志文件保留较少
              tailable: this.config.enableRotation
            })
          );
        }
      });
    }

    this.logger = winston.createLogger({
      level: this.config.level,
      transports
    });
  }

  // 基础日志方法
  public debug(message: string, category?: LogCategory, metadata?: any): void {
    this.logger.debug(message, { category, ...metadata });
  }

  public info(message: string, category?: LogCategory, metadata?: any): void {
    this.logger.info(message, { category, ...metadata });
  }

  public warn(message: string, category?: LogCategory, metadata?: any): void {
    this.logger.warn(message, { category, ...metadata });
  }

  public error(message: string, error?: Error, category?: LogCategory, metadata?: any): void {
    this.logger.error(message, { 
      category, 
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message,
      ...metadata 
    });
  }

  // 操作日志方法
  public logOperation(operation: string, category: LogCategory, level: LogLevel = LogLevel.INFO, metadata?: any): void {
    this.logger.log(level, `操作: ${operation}`, { category, operation, ...metadata });
  }

  public logFileOperation(operation: string, filePath: string, category: LogCategory, metadata?: any): void {
    this.info(`文件操作: ${operation}`, category, { 
      operation, 
      filePath, 
      fileName: path.basename(filePath),
      ...metadata 
    });
  }

  public logDataOperation(operation: string, recordCount: number, category: LogCategory, metadata?: any): void {
    this.info(`数据操作: ${operation}`, category, { 
      operation, 
      recordCount, 
      ...metadata 
    });
  }

  // 性能监控方法
  public startTimer(operationId: string): void {
    this.performanceTimers.set(operationId, Date.now());
  }

  public endTimer(operationId: string, operation: string, category: LogCategory, metadata?: any): number {
    const startTime = this.performanceTimers.get(operationId);
    if (!startTime) {
      this.warn(`性能计时器未找到: ${operationId}`, LogCategory.PERFORMANCE);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceTimers.delete(operationId);

    this.info(`性能监控: ${operation} 完成`, LogCategory.PERFORMANCE, {
      operation,
      category,
      duration,
      operationId,
      ...metadata
    });

    return duration;
  }

  public logPerformance(operation: string, duration: number, category: LogCategory, metadata?: any): void {
    this.info(`性能指标: ${operation}`, LogCategory.PERFORMANCE, {
      operation,
      category,
      duration,
      ...metadata
    });
  }

  // 转换过程专用日志方法
  public logConversionStart(projectType: string, fileCount: number): void {
    this.info(`开始转换处理`, LogCategory.SYSTEM, {
      operation: 'conversion_start',
      projectType,
      fileCount,
      startTime: new Date().toISOString()
    });
  }

  public logConversionEnd(projectType: string, summary: any): void {
    this.info(`转换处理完成`, LogCategory.SYSTEM, {
      operation: 'conversion_end',
      projectType,
      endTime: new Date().toISOString(),
      ...summary
    });
  }

  public logFileProcessing(filePath: string, status: 'start' | 'success' | 'error' | 'skip', metadata?: any): void {
    const operation = `file_processing_${status}`;
    const level = status === 'error' ? LogLevel.ERROR : status === 'skip' ? LogLevel.WARN : LogLevel.INFO;
    
    this.logger.log(level, `文件处理${status === 'start' ? '开始' : status === 'success' ? '成功' : status === 'error' ? '失败' : '跳过'}: ${path.basename(filePath)}`, {
      category: LogCategory.FILE_PARSER,
      operation,
      filePath,
      fileName: path.basename(filePath),
      ...metadata
    });
  }

  public logDataQuality(qualityMetrics: any, category: LogCategory): void {
    this.info(`数据质量检查完成`, category, {
      operation: 'data_quality_check',
      ...qualityMetrics
    });
  }

  public logError(errorType: string, message: string, error?: Error, metadata?: any): void {
    this.error(`错误: ${errorType} - ${message}`, error, LogCategory.ERROR_HANDLER, {
      errorType,
      ...metadata
    });
  }

  // 配置管理方法
  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupLogger();
    this.info('日志配置已更新', LogCategory.SYSTEM, { newConfig });
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // 日志级别管理
  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.logger.level = level;
    this.info(`日志级别已设置为: ${level}`, LogCategory.SYSTEM, { level });
  }

  public getLogLevel(): LogLevel {
    return this.config.level;
  }

  // 日志文件管理
  public async rotateLogs(): Promise<void> {
    this.info('开始日志轮转', LogCategory.SYSTEM);
    
    try {
      // Winston 的文件传输会自动处理轮转
      // 这里可以添加额外的清理逻辑
      const logFiles = fs.readdirSync(this.config.logDirectory);
      const oldLogFiles = logFiles.filter(file => {
        const filePath = path.join(this.config.logDirectory, file);
        const stats = fs.statSync(filePath);
        const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceModified > 30; // 删除30天前的日志
      });

      for (const file of oldLogFiles) {
        fs.unlinkSync(path.join(this.config.logDirectory, file));
        this.debug(`删除旧日志文件: ${file}`, LogCategory.SYSTEM);
      }

      this.info(`日志轮转完成，删除了 ${oldLogFiles.length} 个旧文件`, LogCategory.SYSTEM);
    } catch (error) {
      this.error('日志轮转失败', error as Error, LogCategory.SYSTEM);
    }
  }

  public getLogStats(): any {
    try {
      const logDir = this.config.logDirectory;
      const files = fs.readdirSync(logDir);
      const stats = files.map(file => {
        const filePath = path.join(logDir, file);
        const fileStats = fs.statSync(filePath);
        return {
          fileName: file,
          size: fileStats.size,
          lastModified: fileStats.mtime,
          sizeInMB: (fileStats.size / (1024 * 1024)).toFixed(2)
        };
      });

      return {
        totalFiles: files.length,
        totalSize: stats.reduce((sum, stat) => sum + stat.size, 0),
        files: stats
      };
    } catch (error) {
      this.error('获取日志统计失败', error as Error, LogCategory.SYSTEM);
      return null;
    }
  }
}

// 创建默认日志管理器实例
const loggerManager = LoggerManager.getInstance();

// 导出便捷方法
export const logger = {
  debug: (message: string, category?: LogCategory, metadata?: any) => 
    loggerManager.debug(message, category, metadata),
  
  info: (message: string, category?: LogCategory, metadata?: any) => 
    loggerManager.info(message, category, metadata),
  
  warn: (message: string, category?: LogCategory, metadata?: any) => 
    loggerManager.warn(message, category, metadata),
  
  error: (message: string, error?: Error, category?: LogCategory, metadata?: any) => 
    loggerManager.error(message, error, category, metadata),
  
  logOperation: (operation: string, category: LogCategory, level?: LogLevel, metadata?: any) => 
    loggerManager.logOperation(operation, category, level, metadata),
  
  logFileOperation: (operation: string, filePath: string, category: LogCategory, metadata?: any) => 
    loggerManager.logFileOperation(operation, filePath, category, metadata),
  
  logDataOperation: (operation: string, recordCount: number, category: LogCategory, metadata?: any) => 
    loggerManager.logDataOperation(operation, recordCount, category, metadata),
  
  startTimer: (operationId: string) => loggerManager.startTimer(operationId),
  
  endTimer: (operationId: string, operation: string, category: LogCategory, metadata?: any) => 
    loggerManager.endTimer(operationId, operation, category, metadata),
  
  logPerformance: (operation: string, duration: number, category: LogCategory, metadata?: any) => 
    loggerManager.logPerformance(operation, duration, category, metadata),
  
  logConversionStart: (projectType: string, fileCount: number) => 
    loggerManager.logConversionStart(projectType, fileCount),
  
  logConversionEnd: (projectType: string, summary: any) => 
    loggerManager.logConversionEnd(projectType, summary),
  
  logFileProcessing: (filePath: string, status: 'start' | 'success' | 'error' | 'skip', metadata?: any) => 
    loggerManager.logFileProcessing(filePath, status, metadata),
  
  logDataQuality: (qualityMetrics: any, category: LogCategory) => 
    loggerManager.logDataQuality(qualityMetrics, category),
  
  logError: (errorType: string, message: string, error?: Error, metadata?: any) => 
    loggerManager.logError(errorType, message, error, metadata)
};

// 导出日志管理器类
export { LoggerManager };
export default logger;
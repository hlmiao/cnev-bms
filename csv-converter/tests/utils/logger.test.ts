import { LoggerManager, LogLevel, LogCategory, logger } from '../../src/utils/logger';
import fs from 'fs';

// 测试日志目录
const TEST_LOG_DIR = 'test-logs';

describe('LoggerManager', () => {
  let loggerManager: LoggerManager;

  beforeEach(() => {
    // 清理测试日志目录
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true });
    }

    // 重置单例实例
    (LoggerManager as any).instance = undefined;

    // 创建新的日志管理器实例
    loggerManager = LoggerManager.getInstance({
      logDirectory: TEST_LOG_DIR,
      enableConsole: false, // 测试时禁用控制台输出
      maxFileSize: 1024 * 1024, // 1MB for testing
      maxFiles: 3
    });
  });

  afterEach(() => {
    // 清理测试日志目录
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true });
    }
  });

  describe('基础日志功能', () => {
    test('应该创建日志管理器实例', () => {
      expect(loggerManager).toBeDefined();
      expect(loggerManager).toBeInstanceOf(LoggerManager);
    });

    test('应该提供所有日志方法', () => {
      expect(typeof loggerManager.debug).toBe('function');
      expect(typeof loggerManager.info).toBe('function');
      expect(typeof loggerManager.warn).toBe('function');
      expect(typeof loggerManager.error).toBe('function');
      expect(typeof loggerManager.logOperation).toBe('function');
      expect(typeof loggerManager.logFileOperation).toBe('function');
      expect(typeof loggerManager.logDataOperation).toBe('function');
    });

    test('应该记录不同级别的日志而不抛出错误', () => {
      expect(() => {
        loggerManager.debug('Debug message', LogCategory.SYSTEM);
        loggerManager.info('Info message', LogCategory.SYSTEM);
        loggerManager.warn('Warning message', LogCategory.SYSTEM);
        loggerManager.error('Error message', new Error('Test error'), LogCategory.SYSTEM);
      }).not.toThrow();
    });

    test('应该记录不同类别的日志而不抛出错误', () => {
      expect(() => {
        loggerManager.info('Scanner message', LogCategory.FILE_SCANNER);
        loggerManager.info('Parser message', LogCategory.FILE_PARSER);
        loggerManager.info('Transformer message', LogCategory.DATA_TRANSFORMER);
        loggerManager.info('Validator message', LogCategory.DATA_VALIDATOR);
      }).not.toThrow();
    });
  });

  describe('操作日志功能', () => {
    test('应该记录操作日志而不抛出错误', () => {
      expect(() => {
        loggerManager.logOperation('文件扫描', LogCategory.FILE_SCANNER, LogLevel.INFO, {
          fileCount: 10
        });
      }).not.toThrow();
    });

    test('应该记录文件操作日志而不抛出错误', () => {
      expect(() => {
        const testFilePath = '/path/to/test.csv';
        loggerManager.logFileOperation('解析CSV文件', testFilePath, LogCategory.FILE_PARSER, {
          recordCount: 100
        });
      }).not.toThrow();
    });

    test('应该记录数据操作日志而不抛出错误', () => {
      expect(() => {
        loggerManager.logDataOperation('数据转换', 500, LogCategory.DATA_TRANSFORMER, {
          validRecords: 480,
          invalidRecords: 20
        });
      }).not.toThrow();
    });
  });

  describe('性能监控功能', () => {
    test('应该记录性能计时', async () => {
      const operationId = 'test-operation-1';
      
      loggerManager.startTimer(operationId);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = loggerManager.endTimer(operationId, '测试操作', LogCategory.PERFORMANCE);
      
      expect(duration).toBeGreaterThan(0);
    });

    test('应该处理不存在的计时器', () => {
      const duration = loggerManager.endTimer('non-existent', '不存在的操作', LogCategory.PERFORMANCE);
      expect(duration).toBe(0);
    });

    test('应该记录性能指标而不抛出错误', () => {
      expect(() => {
        loggerManager.logPerformance('文件处理', 1500, LogCategory.FILE_PARSER, {
          fileSize: 1024000,
          recordCount: 1000
        });
      }).not.toThrow();
    });
  });

  describe('转换过程专用日志', () => {
    test('应该记录转换开始日志而不抛出错误', () => {
      expect(() => {
        loggerManager.logConversionStart('project1', 25);
      }).not.toThrow();
    });

    test('应该记录转换结束日志而不抛出错误', () => {
      expect(() => {
        const summary = {
          totalFiles: 25,
          processedFiles: 23,
          failedFiles: 2,
          totalRecords: 50000
        };
        loggerManager.logConversionEnd('project1', summary);
      }).not.toThrow();
    });

    test('应该记录文件处理状态而不抛出错误', () => {
      expect(() => {
        const testFile = '/path/to/test.csv';
        loggerManager.logFileProcessing(testFile, 'start');
        loggerManager.logFileProcessing(testFile, 'success', { recordCount: 100 });
        loggerManager.logFileProcessing(testFile, 'error', { error: 'Parse failed' });
        loggerManager.logFileProcessing(testFile, 'skip', { reason: 'Already processed' });
      }).not.toThrow();
    });

    test('应该记录数据质量日志而不抛出错误', () => {
      expect(() => {
        const qualityMetrics = {
          overallQualityScore: 0.95,
          completenessScore: 0.98,
          accuracyScore: 0.92,
          anomalyCount: 5
        };
        loggerManager.logDataQuality(qualityMetrics, LogCategory.DATA_VALIDATOR);
      }).not.toThrow();
    });

    test('应该记录错误日志而不抛出错误', () => {
      expect(() => {
        const error = new Error('Test error');
        loggerManager.logError('PARSE_ERROR', '解析CSV文件失败', error, {
          filePath: '/path/to/file.csv',
          lineNumber: 100
        });
      }).not.toThrow();
    });
  });

  describe('配置管理', () => {
    test('应该更新日志配置', () => {
      const newConfig = {
        level: LogLevel.DEBUG,
        enablePerformanceLogging: false
      };

      loggerManager.updateConfig(newConfig);
      const config = loggerManager.getConfig();

      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.enablePerformanceLogging).toBe(false);
    });

    test('应该设置日志级别', () => {
      loggerManager.setLogLevel(LogLevel.WARN);
      expect(loggerManager.getLogLevel()).toBe(LogLevel.WARN);
    });

    test('应该获取日志统计', (done) => {
      // 先写入一些日志
      loggerManager.info('Test message 1', LogCategory.SYSTEM);
      loggerManager.error('Test error', new Error('Test'), LogCategory.SYSTEM);

      // 等待一下让日志写入
      setTimeout(() => {
        try {
          const stats = loggerManager.getLogStats();
          expect(stats).toBeTruthy();
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });
  });

  describe('日志轮转', () => {
    test('应该执行日志轮转而不抛出错误', async () => {
      expect(async () => {
        await loggerManager.rotateLogs();
      }).not.toThrow();
    });
  });
});

describe('便捷日志方法', () => {
  beforeEach(() => {
    // 清理测试日志目录
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // 清理测试日志目录
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true });
    }
  });

  test('应该提供便捷的日志方法', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.logOperation).toBe('function');
    expect(typeof logger.logFileOperation).toBe('function');
    expect(typeof logger.logDataOperation).toBe('function');
    expect(typeof logger.startTimer).toBe('function');
    expect(typeof logger.endTimer).toBe('function');
    expect(typeof logger.logPerformance).toBe('function');
    expect(typeof logger.logConversionStart).toBe('function');
    expect(typeof logger.logConversionEnd).toBe('function');
    expect(typeof logger.logFileProcessing).toBe('function');
    expect(typeof logger.logDataQuality).toBe('function');
    expect(typeof logger.logError).toBe('function');
  });

  test('便捷方法应该正常工作', () => {
    expect(() => {
      logger.info('Test info message', LogCategory.SYSTEM);
      logger.warn('Test warning', LogCategory.SYSTEM);
      logger.error('Test error', new Error('Test'), LogCategory.SYSTEM);
      logger.logOperation('Test operation', LogCategory.SYSTEM);
      logger.logFileOperation('Test file op', '/test/file.csv', LogCategory.FILE_PARSER);
      logger.logDataOperation('Test data op', 100, LogCategory.DATA_TRANSFORMER);
      logger.logConversionStart('project1', 10);
      logger.logConversionEnd('project1', { totalFiles: 10 });
      logger.logFileProcessing('/test/file.csv', 'success');
      logger.logDataQuality({ score: 0.95 }, LogCategory.DATA_VALIDATOR);
      logger.logError('TEST_ERROR', 'Test error message');
    }).not.toThrow();
  });

  test('性能计时便捷方法应该正常工作', async () => {
    const operationId = 'test-convenience-timer';
    
    logger.startTimer(operationId);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const duration = logger.endTimer(operationId, '便捷计时测试', LogCategory.PERFORMANCE);
    expect(duration).toBeGreaterThan(0);
    
    expect(() => {
      logger.logPerformance('便捷性能记录', 1000, LogCategory.PERFORMANCE);
    }).not.toThrow();
  });
});

describe('日志级别和类别', () => {
  test('LogLevel 枚举应该包含所有级别', () => {
    expect(LogLevel.ERROR).toBe('error');
    expect(LogLevel.WARN).toBe('warn');
    expect(LogLevel.INFO).toBe('info');
    expect(LogLevel.DEBUG).toBe('debug');
  });

  test('LogCategory 枚举应该包含所有类别', () => {
    expect(LogCategory.SYSTEM).toBe('system');
    expect(LogCategory.FILE_SCANNER).toBe('file-scanner');
    expect(LogCategory.FILE_PARSER).toBe('file-parser');
    expect(LogCategory.DATA_TRANSFORMER).toBe('data-transformer');
    expect(LogCategory.DATA_VALIDATOR).toBe('data-validator');
    expect(LogCategory.CONVERSION_REPORTER).toBe('conversion-reporter');
    expect(LogCategory.ERROR_HANDLER).toBe('error-handler');
    expect(LogCategory.PERFORMANCE).toBe('performance');
  });

  test('应该支持所有日志级别的配置', () => {
    const manager = LoggerManager.getInstance();
    
    Object.values(LogLevel).forEach(level => {
      expect(() => {
        manager.setLogLevel(level as LogLevel);
        expect(manager.getLogLevel()).toBe(level);
      }).not.toThrow();
    });
  });

  test('应该支持所有类别的日志记录', () => {
    const manager = LoggerManager.getInstance();
    
    Object.values(LogCategory).forEach(category => {
      expect(() => {
        manager.info(`Test message for ${category}`, category as LogCategory);
      }).not.toThrow();
    });
  });
});
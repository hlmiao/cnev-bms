import { ErrorHandlerImpl } from '../../src/handlers/ErrorHandlerImpl.js';
import { ErrorContext, ErrorHandlingStrategy } from '../../src/interfaces/ErrorHandler.js';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandlerImpl;

  beforeEach(() => {
    errorHandler = new ErrorHandlerImpl();
  });

  describe('策略管理', () => {
    test('应该使用默认策略', () => {
      const strategy = errorHandler.getStrategy();
      
      expect(strategy.onFileNotFound).toBe('warn');
      expect(strategy.onParseError).toBe('skip-row');
      expect(strategy.onValidationError).toBe('mark-invalid');
      expect(strategy.maxErrorsPerFile).toBe(100);
      expect(strategy.continueOnError).toBe(true);
      expect(strategy.maxRetries).toBe(3);
      expect(strategy.retryDelay).toBe(1000);
    });

    test('应该能够设置自定义策略', () => {
      const customStrategy: ErrorHandlingStrategy = {
        onFileNotFound: 'error',
        onParseError: 'skip-file',
        onValidationError: 'abort',
        maxErrorsPerFile: 50,
        continueOnError: false,
        maxRetries: 5,
        retryDelay: 2000
      };

      errorHandler.setStrategy(customStrategy);
      const strategy = errorHandler.getStrategy();

      expect(strategy).toEqual(customStrategy);
    });

    test('应该合并部分策略设置', () => {
      const partialStrategy = {
        maxErrorsPerFile: 200,
        maxRetries: 5
      };

      errorHandler.setStrategy(partialStrategy as ErrorHandlingStrategy);
      const strategy = errorHandler.getStrategy();

      expect(strategy.maxErrorsPerFile).toBe(200);
      expect(strategy.maxRetries).toBe(5);
      expect(strategy.onFileNotFound).toBe('warn'); // 保持默认值
    });
  });

  describe('错误分类', () => {
    test('应该正确分类文件访问错误', () => {
      const context: ErrorContext = {
        operation: '文件读取',
        filePath: '/test/file.csv',
        timestamp: new Date()
      };

      const enoentError = new Error('ENOENT: no such file or directory');
      const category1 = errorHandler.categorizeError(enoentError, context);
      expect(category1).toBe('file_access');

      const eaccesError = new Error('EACCES: permission denied');
      const category2 = errorHandler.categorizeError(eaccesError, context);
      expect(category2).toBe('file_access');
    });

    test('应该正确分类文件格式错误', () => {
      const context: ErrorContext = {
        operation: 'CSV解析',
        filePath: '/test/file.csv',
        timestamp: new Date()
      };

      const parseError = new Error('CSV parse error: invalid format');
      const category = errorHandler.categorizeError(parseError, context);
      expect(category).toBe('file_format');
    });

    test('应该正确分类数据验证错误', () => {
      const context: ErrorContext = {
        operation: '数据验证',
        filePath: '/test/file.csv',
        rowIndex: 5,
        columnName: 'voltage',
        dataValue: -100,
        timestamp: new Date()
      };

      const validationError = new Error('Validation failed: value out of range');
      const category = errorHandler.categorizeError(validationError, context);
      expect(category).toBe('data_validation');
    });

    test('应该正确分类内存错误', () => {
      const context: ErrorContext = {
        operation: '数据处理',
        timestamp: new Date()
      };

      const memoryError = new Error('JavaScript heap out of memory');
      const category = errorHandler.categorizeError(memoryError, context);
      expect(category).toBe('memory_error');
    });
  });

  describe('错误严重程度判断', () => {
    test('应该将内存错误标记为严重', () => {
      const context: ErrorContext = {
        operation: '数据处理',
        timestamp: new Date()
      };

      const memoryError = new Error('heap out of memory');
      const severity = errorHandler.determineSeverity(memoryError, context);
      expect(severity).toBe('critical');
    });

    test('应该将权限错误标记为高级', () => {
      const context: ErrorContext = {
        operation: '文件访问',
        filePath: '/test/file.csv',
        timestamp: new Date()
      };

      const permissionError = new Error('EPERM: operation not permitted');
      const severity = errorHandler.determineSeverity(permissionError, context);
      expect(severity).toBe('high');
    });

    test('应该将验证错误标记为低级', () => {
      const context: ErrorContext = {
        operation: '数据验证',
        timestamp: new Date()
      };

      const validationError = new Error('validation failed');
      const severity = errorHandler.determineSeverity(validationError, context);
      expect(severity).toBe('low');
    });

    test('应该将文件不存在标记为低级', () => {
      const context: ErrorContext = {
        operation: '文件读取',
        timestamp: new Date()
      };

      const notFoundError = new Error('ENOENT: file not found');
      const severity = errorHandler.determineSeverity(notFoundError, context);
      expect(severity).toBe('low');
    });
  });

  describe('文件级错误处理', () => {
    test('应该根据策略处理文件不存在错误', async () => {
      const context: ErrorContext = {
        operation: '文件读取',
        filePath: '/test/nonexistent.csv',
        timestamp: new Date()
      };

      const error = new Error('ENOENT: no such file or directory');

      // 测试 'skip' 策略
      errorHandler.setStrategy({ onFileNotFound: 'skip' } as ErrorHandlingStrategy);
      const result1 = await errorHandler.handleFileError(error, context);
      expect(result1.shouldContinue).toBe(true);
      expect(result1.shouldRetry).toBe(false);
      expect(result1.processedWarning).toBeDefined();

      // 测试 'error' 策略
      errorHandler.setStrategy({ onFileNotFound: 'error' } as ErrorHandlingStrategy);
      const result2 = await errorHandler.handleFileError(error, context);
      expect(result2.shouldContinue).toBe(false);
      expect(result2.processedError).toBeDefined();
    });

    test('应该处理文件格式错误', async () => {
      const context: ErrorContext = {
        operation: 'CSV解析',
        filePath: '/test/invalid.csv',
        timestamp: new Date()
      };

      const error = new Error('CSV format error');
      const result = await errorHandler.handleFileError(error, context);

      expect(result.processedError).toBeDefined();
      expect(result.processedError?.type).toBe('file_error');
    });
  });

  describe('数据行级错误处理', () => {
    test('应该根据策略处理解析错误', async () => {
      const context: ErrorContext = {
        operation: '数据解析',
        filePath: '/test/file.csv',
        rowIndex: 5,
        timestamp: new Date()
      };

      const error = new Error('Parse error in row');

      // 测试 'skip-row' 策略
      errorHandler.setStrategy({ onParseError: 'skip-row' } as ErrorHandlingStrategy);
      const result1 = await errorHandler.handleRowError(error, context);
      expect(result1.shouldContinue).toBe(true);
      expect(result1.shouldRetry).toBe(false);
      expect(result1.processedWarning).toBeDefined();

      // 测试 'skip-file' 策略
      errorHandler.setStrategy({ onParseError: 'skip-file' } as ErrorHandlingStrategy);
      const result2 = await errorHandler.handleRowError(error, context);
      expect(result2.shouldContinue).toBe(false);
      expect(result2.processedError).toBeDefined();

      // 测试 'abort' 策略
      errorHandler.setStrategy({ onParseError: 'abort' } as ErrorHandlingStrategy);
      const result3 = await errorHandler.handleRowError(error, context);
      expect(result3.shouldContinue).toBe(false);
      expect(result3.processedError?.severity).toBe('critical');
    });
  });

  describe('验证错误处理', () => {
    test('应该根据策略处理验证错误', async () => {
      const context: ErrorContext = {
        operation: '数据验证',
        filePath: '/test/file.csv',
        rowIndex: 10,
        columnName: 'voltage',
        dataValue: -50,
        timestamp: new Date()
      };

      const error = new Error('Validation failed: value out of range');

      // 测试 'mark-invalid' 策略
      errorHandler.setStrategy({ onValidationError: 'mark-invalid' } as ErrorHandlingStrategy);
      const result1 = await errorHandler.handleValidationError(error, context);
      expect(result1.shouldContinue).toBe(true);
      expect(result1.processedWarning).toBeDefined();

      // 测试 'skip-data' 策略
      errorHandler.setStrategy({ onValidationError: 'skip-data' } as ErrorHandlingStrategy);
      const result2 = await errorHandler.handleValidationError(error, context);
      expect(result2.shouldContinue).toBe(true);
      expect(result2.processedWarning?.message).toContain('跳过无效数据');

      // 测试 'abort' 策略
      errorHandler.setStrategy({ onValidationError: 'abort' } as ErrorHandlingStrategy);
      const result3 = await errorHandler.handleValidationError(error, context);
      expect(result3.shouldContinue).toBe(false);
      expect(result3.processedError).toBeDefined();
    });
  });

  describe('重试逻辑', () => {
    test('应该正确判断是否可重试', () => {
      const context: ErrorContext = {
        operation: '网络请求',
        timestamp: new Date(),
        retryCount: 1
      };

      const networkError = new Error('network timeout');
      const shouldRetry1 = errorHandler.shouldRetry(networkError, context);
      expect(shouldRetry1).toBe(true);

      const validationError = new Error('validation failed');
      const shouldRetry2 = errorHandler.shouldRetry(validationError, context);
      expect(shouldRetry2).toBe(false);

      // 超过最大重试次数
      const contextMaxRetries: ErrorContext = {
        ...context,
        retryCount: 5
      };
      const shouldRetry3 = errorHandler.shouldRetry(networkError, contextMaxRetries);
      expect(shouldRetry3).toBe(false);
    });
  });

  describe('转换错误和警告创建', () => {
    test('应该创建正确的转换错误对象', () => {
      const context: ErrorContext = {
        operation: '数据解析',
        filePath: '/test/file.csv',
        rowIndex: 5,
        columnName: 'voltage',
        dataValue: 'invalid',
        timestamp: new Date()
      };

      const error = new Error('Parse error');
      const conversionError = errorHandler.createConversionError(
        error,
        context,
        'data_parsing',
        'medium'
      );

      expect(conversionError.errorId).toBeDefined();
      expect(conversionError.type).toBe('parse_error');
      expect(conversionError.severity).toBe('medium');
      expect(conversionError.filePath).toBe('/test/file.csv');
      expect(conversionError.rowIndex).toBe(5);
      expect(conversionError.field).toBe('voltage');
      expect(conversionError.message).toBe('Parse error');
      expect(conversionError.details).toContain('数据解析');
      expect(conversionError.timestamp).toBeDefined();
    });

    test('应该创建正确的转换警告对象', () => {
      const context: ErrorContext = {
        operation: '数据验证',
        filePath: '/test/file.csv',
        rowIndex: 10,
        columnName: 'temperature',
        timestamp: new Date()
      };

      const warning = errorHandler.createConversionWarning(
        'Temperature value is suspicious',
        context
      );

      expect(warning.warningId).toBeDefined();
      expect(warning.type).toBe('data_quality');
      expect(warning.filePath).toBe('/test/file.csv');
      expect(warning.rowIndex).toBe(10);
      expect(warning.field).toBe('temperature');
      expect(warning.message).toBe('Temperature value is suspicious');
      expect(warning.suggestion).toBeDefined();
      expect(warning.timestamp).toBeDefined();
    });
  });

  describe('错误统计', () => {
    test('应该正确统计错误', async () => {
      const context1: ErrorContext = {
        operation: '文件读取',
        timestamp: new Date()
      };

      const context2: ErrorContext = {
        operation: '数据验证',
        timestamp: new Date()
      };

      // 处理几个不同类型的错误
      await errorHandler.handleFileError(new Error('ENOENT: file not found'), context1);
      await errorHandler.handleValidationError(new Error('validation failed'), context2);
      await errorHandler.handleRowError(new Error('parse error'), context1);

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.file_access).toBe(1);
      expect(stats.errorsByCategory.data_validation).toBe(1);
      expect(stats.errorsByCategory.data_parsing).toBe(1);
      expect(stats.errorsBySeverity.low).toBe(2); // file_access + data_validation
      expect(stats.errorsBySeverity.medium).toBe(1); // data_parsing
    });

    test('应该能够重置统计', async () => {
      const context: ErrorContext = {
        operation: '测试',
        timestamp: new Date()
      };

      await errorHandler.handleFileError(new Error('test error'), context);
      
      let stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(1);

      errorHandler.resetStatistics();
      
      stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(Object.keys(stats.errorsByCategory)).toHaveLength(0);
      expect(Object.keys(stats.errorsBySeverity)).toHaveLength(0);
    });
  });

  describe('边界情况', () => {
    test('应该处理空错误消息', () => {
      const context: ErrorContext = {
        operation: '测试',
        timestamp: new Date()
      };

      const error = new Error('');
      const category = errorHandler.categorizeError(error, context);
      expect(category).toBe('system_error'); // 默认分类
    });

    test('应该处理未定义的上下文字段', () => {
      const context: ErrorContext = {
        operation: '测试',
        timestamp: new Date()
      };

      const error = new Error('test error');
      const conversionError = errorHandler.createConversionError(
        error,
        context,
        'system_error',
        'medium'
      );

      expect(conversionError.filePath).toBeUndefined();
      expect(conversionError.rowIndex).toBeUndefined();
      expect(conversionError.field).toBeUndefined();
    });

    test('应该处理极大的重试次数', () => {
      const context: ErrorContext = {
        operation: '测试',
        timestamp: new Date(),
        retryCount: 999999
      };

      const error = new Error('network error');
      const shouldRetry = errorHandler.shouldRetry(error, context);
      expect(shouldRetry).toBe(false);
    });
  });
});
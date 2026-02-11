import { ErrorUtils } from '../../src/utils/errorUtils.js';
import { ErrorContext } from '../../src/interfaces/ErrorHandler.js';

describe('ErrorUtils', () => {
  describe('createContext', () => {
    test('应该创建完整的错误上下文', () => {
      const context = ErrorUtils.createContext(
        '数据解析',
        '/test/file.csv',
        5,
        'voltage',
        100,
        2
      );

      expect(context.operation).toBe('数据解析');
      expect(context.filePath).toBe('/test/file.csv');
      expect(context.rowIndex).toBe(5);
      expect(context.columnName).toBe('voltage');
      expect(context.dataValue).toBe(100);
      expect(context.retryCount).toBe(2);
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    test('应该创建最小错误上下文', () => {
      const context = ErrorUtils.createContext('测试操作');

      expect(context.operation).toBe('测试操作');
      expect(context.filePath).toBeUndefined();
      expect(context.rowIndex).toBeUndefined();
      expect(context.columnName).toBeUndefined();
      expect(context.dataValue).toBeUndefined();
      expect(context.retryCount).toBeUndefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('withErrorHandling', () => {
    test('应该成功执行操作', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const context = ErrorUtils.createContext('测试操作');

      const result = await ErrorUtils.withErrorHandling(operation, context, 3, 100);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('应该重试可重试的错误', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('connection failed'))
        .mockResolvedValue('success');
      
      const context = ErrorUtils.createContext('网络请求');

      const result = await ErrorUtils.withErrorHandling(operation, context, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('应该在最大重试次数后抛出错误', async () => {
      const error = new Error('persistent network error');
      const operation = jest.fn().mockRejectedValue(error);
      const context = ErrorUtils.createContext('网络请求');

      await expect(
        ErrorUtils.withErrorHandling(operation, context, 2, 10)
      ).rejects.toThrow('persistent network error');

      expect(operation).toHaveBeenCalledTimes(3); // 初始调用 + 2次重试
    });

    test('应该不重试不可重试的错误', async () => {
      const error = new Error('validation failed');
      const operation = jest.fn().mockRejectedValue(error);
      const context = ErrorUtils.createContext('数据验证');

      await expect(
        ErrorUtils.withErrorHandling(operation, context, 3, 10)
      ).rejects.toThrow('validation failed');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    test('应该识别可重试的错误', () => {
      expect(ErrorUtils.isRetryableError(new Error('network timeout'))).toBe(true);
      expect(ErrorUtils.isRetryableError(new Error('connection failed'))).toBe(true);
      expect(ErrorUtils.isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(ErrorUtils.isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(ErrorUtils.isRetryableError(new Error('temporary failure'))).toBe(true);
    });

    test('应该识别不可重试的错误', () => {
      expect(ErrorUtils.isRetryableError(new Error('validation failed'))).toBe(false);
      expect(ErrorUtils.isRetryableError(new Error('parse error'))).toBe(false);
      expect(ErrorUtils.isRetryableError(new Error('file not found'))).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    test('应该成功解析有效JSON', () => {
      const jsonString = '{"name": "test", "value": 123}';
      const result = ErrorUtils.safeJsonParse(jsonString, {});

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('应该返回默认值当JSON无效时', () => {
      const invalidJson = '{"name": "test", "value":}';
      const defaultValue = { error: true };
      const result = ErrorUtils.safeJsonParse(invalidJson, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    test('应该处理空字符串', () => {
      const result = ErrorUtils.safeJsonParse('', null);
      expect(result).toBeNull();
    });
  });

  describe('safeGet', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
          age: 30
        },
        settings: {
          theme: 'dark'
        }
      },
      items: [1, 2, 3]
    };

    test('应该获取嵌套属性', () => {
      expect(ErrorUtils.safeGet(testObj, 'user.profile.name', '')).toBe('John');
      expect(ErrorUtils.safeGet(testObj, 'user.profile.age', 0)).toBe(30);
      expect(ErrorUtils.safeGet(testObj, 'user.settings.theme', '')).toBe('dark');
    });

    test('应该返回默认值当路径不存在时', () => {
      expect(ErrorUtils.safeGet(testObj, 'user.profile.email', 'default')).toBe('default');
      expect(ErrorUtils.safeGet(testObj, 'nonexistent.path', 'default')).toBe('default');
    });

    test('应该处理null和undefined对象', () => {
      expect(ErrorUtils.safeGet(null, 'any.path', 'default')).toBe('default');
      expect(ErrorUtils.safeGet(undefined, 'any.path', 'default')).toBe('default');
    });

    test('应该处理空路径', () => {
      expect(ErrorUtils.safeGet(testObj, '', 'default')).toBe('default');
    });
  });

  describe('isValidFilePath', () => {
    test('应该验证有效文件路径', () => {
      expect(ErrorUtils.isValidFilePath('/valid/path/file.csv')).toBe(true);
      expect(ErrorUtils.isValidFilePath('relative/path/file.txt')).toBe(true);
      expect(ErrorUtils.isValidFilePath('simple-file.txt')).toBe(true);
    });

    test('应该拒绝无效文件路径', () => {
      expect(ErrorUtils.isValidFilePath('')).toBe(false);
      expect(ErrorUtils.isValidFilePath(null as any)).toBe(false);
      expect(ErrorUtils.isValidFilePath(undefined as any)).toBe(false);
      expect(ErrorUtils.isValidFilePath(123 as any)).toBe(false);
    });

    test('应该拒绝包含非法字符的路径', () => {
      expect(ErrorUtils.isValidFilePath('/path/with<illegal>chars')).toBe(false);
      expect(ErrorUtils.isValidFilePath('/path/with|pipe')).toBe(false);
      expect(ErrorUtils.isValidFilePath('/path/with"quote')).toBe(false);
      expect(ErrorUtils.isValidFilePath('/path/with?question')).toBe(false);
      expect(ErrorUtils.isValidFilePath('/path/with*asterisk')).toBe(false);
    });

    test('应该拒绝过长的路径', () => {
      const longPath = '/very/long/path/' + 'a'.repeat(300) + '/file.txt';
      expect(ErrorUtils.isValidFilePath(longPath)).toBe(false);
    });
  });

  describe('sanitizeFilePath', () => {
    test('应该清理文件路径', () => {
      expect(ErrorUtils.sanitizeFilePath('/path/with<illegal>chars')).toBe('/path/with_illegal_chars');
      expect(ErrorUtils.sanitizeFilePath('path\\with\\backslashes')).toBe('path/with/backslashes');
      expect(ErrorUtils.sanitizeFilePath('/path//with///multiple////slashes')).toBe('/path/with/multiple/slashes');
      expect(ErrorUtils.sanitizeFilePath('  /path/with/spaces  ')).toBe('/path/with/spaces');
    });

    test('应该处理空字符串', () => {
      expect(ErrorUtils.sanitizeFilePath('')).toBe('');
      expect(ErrorUtils.sanitizeFilePath(null as any)).toBe('');
      expect(ErrorUtils.sanitizeFilePath(undefined as any)).toBe('');
    });
  });

  describe('formatErrorMessage', () => {
    test('应该格式化完整的错误消息', () => {
      const error = new Error('Parse failed');
      const context: ErrorContext = {
        operation: '数据解析',
        filePath: '/test/file.csv',
        rowIndex: 5,
        columnName: 'voltage',
        timestamp: new Date()
      };

      const message = ErrorUtils.formatErrorMessage(error, context);

      expect(message).toBe('数据解析失败: Parse failed (文件: /test/file.csv) (行: 6) (列: voltage)');
    });

    test('应该格式化最小错误消息', () => {
      const error = new Error('Simple error');
      const context: ErrorContext = {
        operation: '测试操作',
        timestamp: new Date()
      };

      const message = ErrorUtils.formatErrorMessage(error, context);

      expect(message).toBe('测试操作失败: Simple error');
    });
  });

  describe('createErrorSummary', () => {
    test('应该创建错误摘要', () => {
      const errors = [
        { category: 'file_access' as const, severity: 'low' as const, message: 'File not found' },
        { category: 'data_parsing' as const, severity: 'medium' as const, message: 'Parse error' },
        { category: 'file_access' as const, severity: 'high' as const, message: 'Permission denied' },
        { category: 'data_validation' as const, severity: 'low' as const, message: 'Invalid value' }
      ];

      const summary = ErrorUtils.createErrorSummary(errors);

      expect(summary).toContain('总计 4 个错误');
      expect(summary).toContain('严重程度分布');
      expect(summary).toContain('low: 2');
      expect(summary).toContain('medium: 1');
      expect(summary).toContain('high: 1');
      expect(summary).toContain('错误分类分布');
      expect(summary).toContain('file_access: 2');
      expect(summary).toContain('data_parsing: 1');
      expect(summary).toContain('data_validation: 1');
    });

    test('应该处理空错误列表', () => {
      const summary = ErrorUtils.createErrorSummary([]);
      expect(summary).toBe('无错误');
    });
  });

  describe('getMemoryUsage', () => {
    test('应该返回内存使用信息', () => {
      const memUsage = ErrorUtils.getMemoryUsage();

      expect(memUsage.used).toBeGreaterThan(0);
      expect(memUsage.total).toBeGreaterThan(0);
      expect(memUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(memUsage.percentage).toBeLessThanOrEqual(100);
      expect(memUsage.used).toBeLessThanOrEqual(memUsage.total);
    });
  });

  describe('isMemoryLow', () => {
    test('应该检查内存使用情况', () => {
      // 使用很高的阈值，应该返回false
      expect(ErrorUtils.isMemoryLow(99)).toBe(false);
      
      // 使用很低的阈值，应该返回true
      expect(ErrorUtils.isMemoryLow(1)).toBe(true);
    });

    test('应该使用默认阈值', () => {
      const result = ErrorUtils.isMemoryLow();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('delay', () => {
    test('应该延迟指定时间', async () => {
      const start = Date.now();
      await ErrorUtils.delay(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90); // 允许一些时间误差
    });

    test('应该处理零延迟', async () => {
      const start = Date.now();
      await ErrorUtils.delay(0);
      const end = Date.now();

      expect(end - start).toBeLessThan(50); // 应该很快完成
    });
  });
});
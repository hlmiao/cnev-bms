import { ErrorMiddleware } from '../../src/middleware/ErrorMiddleware.js';
import { ErrorHandlerImpl } from '../../src/handlers/ErrorHandlerImpl.js';
import { ConversionReporterImpl } from '../../src/reporters/ConversionReporterImpl.js';

describe('ErrorMiddleware', () => {
  let errorHandler: ErrorHandlerImpl;
  let reporter: ConversionReporterImpl;
  let middleware: ErrorMiddleware;
  let reportId: string;

  beforeEach(() => {
    errorHandler = new ErrorHandlerImpl();
    reporter = new ConversionReporterImpl();
    reportId = reporter.startConversion('project1');
    middleware = new ErrorMiddleware(errorHandler, reporter, reportId);
  });

  describe('文件操作包装', () => {
    test('应该成功执行文件操作', async () => {
      const operation = jest.fn().mockResolvedValue('file content');
      
      const result = await middleware.wrapFileOperation(
        operation,
        '/test/file.csv',
        '文件读取'
      );

      expect(result).toBe('file content');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('应该处理文件操作错误', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      const result = await middleware.wrapFileOperation(
        operation,
        '/test/nonexistent.csv',
        '文件读取'
      );

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalled();

      // 检查是否记录了警告
      const report = reporter.getReport(reportId);
      expect(report?.warnings.length).toBeGreaterThan(0);
    });

    test('应该在严重错误时抛出异常', async () => {
      // 设置策略为遇到文件不存在时报错
      errorHandler.setStrategy({ onFileNotFound: 'error' } as any);
      
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      await expect(
        middleware.wrapFileOperation(operation, '/test/file.csv', '文件读取')
      ).rejects.toThrow('ENOENT: file not found');
    });
  });

  describe('数据行操作包装', () => {
    test('应该成功执行行操作', async () => {
      const operation = jest.fn().mockResolvedValue({ voltage: 3.7 });
      
      const result = await middleware.wrapRowOperation(
        operation,
        '/test/file.csv',
        5,
        '数据解析',
        'voltage',
        '3.7V'
      );

      expect(result).toEqual({ voltage: 3.7 });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('应该处理行级错误', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Parse error in row'));
      
      const result = await middleware.wrapRowOperation(
        operation,
        '/test/file.csv',
        10,
        '数据解析'
      );

      expect(result).toBeNull();
      
      // 检查是否记录了警告（默认策略是skip-row）
      const report = reporter.getReport(reportId);
      expect(report?.warnings.length).toBeGreaterThan(0);
    });

    test('应该在abort策略下抛出异常', async () => {
      errorHandler.setStrategy({ onParseError: 'abort' } as any);
      
      const operation = jest.fn().mockRejectedValue(new Error('Critical parse error'));
      
      await expect(
        middleware.wrapRowOperation(operation, '/test/file.csv', 5, '数据解析')
      ).rejects.toThrow('Critical parse error');
    });
  });

  describe('验证操作包装', () => {
    test('应该成功执行验证操作', async () => {
      const operation = jest.fn().mockResolvedValue(true);
      
      const result = await middleware.wrapValidationOperation(
        operation,
        '/test/file.csv',
        15,
        'temperature',
        25.5,
        '温度验证'
      );

      expect(result).toBe(true);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('应该处理验证错误', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Temperature out of range'));
      
      const result = await middleware.wrapValidationOperation(
        operation,
        '/test/file.csv',
        20,
        'temperature',
        -50,
        '温度验证'
      );

      expect(result).toBeNull();
      
      // 检查是否记录了警告（默认策略是mark-invalid）
      const report = reporter.getReport(reportId);
      expect(report?.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('批量处理', () => {
    test('应该成功处理所有项目', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation((item: number) => 
        Promise.resolve(item * 2)
      );

      const result = await middleware.batchProcess(items, processor, '数据处理');

      expect(result.results).toEqual([2, 4, 6, 8, 10]);
      expect(result.successCount).toBe(5);
      expect(result.errorCount).toBe(0);
      expect(result.shouldAbort).toBe(false);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    test('应该处理部分失败的批量处理', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation((item: number) => {
        if (item === 3) {
          return Promise.reject(new Error('Processing failed'));
        }
        return Promise.resolve(item * 2);
      });

      const result = await middleware.batchProcess(items, processor, '数据处理');

      expect(result.results).toEqual([2, 4, null, 8, 10]);
      expect(result.successCount).toBe(4);
      expect(result.errorCount).toBe(1);
      expect(result.shouldAbort).toBe(false);
    });

    test('应该在错误过多时中止处理', async () => {
      // 设置最大错误数为2
      errorHandler.setStrategy({ maxErrorsPerFile: 2 } as any);
      
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation((item: number) => {
        if (item >= 2) {
          return Promise.reject(new Error('Processing failed'));
        }
        return Promise.resolve(item * 2);
      });

      const result = await middleware.batchProcess(items, processor, '数据处理');

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(2);
      expect(result.shouldAbort).toBe(true);
      expect(result.results.length).toBe(3); // 只处理了3个项目就中止了
    });

    test('应该在不可继续的错误时中止处理', async () => {
      errorHandler.setStrategy({ onParseError: 'abort' } as any);
      
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation((item: number) => {
        if (item === 2) {
          return Promise.reject(new Error('Critical error'));
        }
        return Promise.resolve(item * 2);
      });

      const result = await middleware.batchProcess(items, processor, '数据处理');

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.shouldAbort).toBe(true);
      expect(result.results.length).toBe(2); // 处理了2个项目就中止了
    });
  });

  describe('报告器集成', () => {
    test('应该记录错误到报告器', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      await middleware.wrapFileOperation(operation, '/test/file.csv', '文件读取');
      
      const report = reporter.getReport(reportId);
      expect(report?.warnings.length).toBeGreaterThan(0);
    });

    test('应该能够设置新的报告器', async () => {
      const newReporter = new ConversionReporterImpl();
      const newReportId = newReporter.startConversion('project2');
      
      middleware.setReporter(newReporter, newReportId);
      
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      await middleware.wrapFileOperation(operation, '/test/file.csv', '文件读取');
      
      // 新报告器应该有记录
      const newReport = newReporter.getReport(newReportId);
      expect(newReport?.warnings.length).toBeGreaterThan(0);
      
      // 旧报告器应该没有新记录
      const oldReport = reporter.getReport(reportId);
      expect(oldReport?.warnings.length).toBe(0);
    });
  });

  describe('错误统计', () => {
    test('应该获取错误统计', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      await middleware.wrapFileOperation(operation, '/test/file.csv', '文件读取');
      
      const stats = middleware.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });

    test('应该能够重置错误统计', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      await middleware.wrapFileOperation(operation, '/test/file.csv', '文件读取');
      
      let stats = middleware.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      
      middleware.resetErrorStatistics();
      
      stats = middleware.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('处理控制', () => {
    test('应该正确判断是否继续处理', () => {
      // 默认策略允许继续处理
      expect(middleware.shouldContinueProcessing(0)).toBe(true);
      expect(middleware.shouldContinueProcessing(50)).toBe(true);
      expect(middleware.shouldContinueProcessing(99)).toBe(true);
      expect(middleware.shouldContinueProcessing(100)).toBe(false);
      expect(middleware.shouldContinueProcessing(150)).toBe(false);
    });

    test('应该在不允许错误时立即停止', () => {
      errorHandler.setStrategy({ continueOnError: false } as any);
      
      expect(middleware.shouldContinueProcessing(0)).toBe(true);
      expect(middleware.shouldContinueProcessing(1)).toBe(false);
    });
  });

  describe('错误摘要生成', () => {
    test('应该生成错误摘要', async () => {
      // 产生一些错误
      const operation1 = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      const operation2 = jest.fn().mockRejectedValue(new Error('Parse error'));
      
      await middleware.wrapFileOperation(operation1, '/test/file1.csv', '文件读取');
      await middleware.wrapRowOperation(operation2, '/test/file2.csv', 5, '数据解析');
      
      const summary = middleware.generateErrorSummary();
      
      expect(summary).toContain('错误处理摘要');
      expect(summary).toContain('总错误数');
      expect(summary).toContain('按分类统计');
      expect(summary).toContain('按严重程度统计');
    });

    test('应该处理无错误情况', () => {
      const summary = middleware.generateErrorSummary();
      expect(summary).toBe('处理过程中未发现错误');
    });
  });

  describe('边界情况', () => {
    test('应该处理没有报告器的情况', async () => {
      const middlewareWithoutReporter = new ErrorMiddleware(errorHandler);
      const operation = jest.fn().mockRejectedValue(new Error('ENOENT: file not found'));
      
      // 应该不会抛出异常
      const result = await middlewareWithoutReporter.wrapFileOperation(
        operation,
        '/test/file.csv',
        '文件读取'
      );
      
      expect(result).toBeNull();
    });

    test('应该处理空项目列表的批量处理', async () => {
      const processor = jest.fn();
      
      const result = await middleware.batchProcess([], processor, '数据处理');
      
      expect(result.results).toEqual([]);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.shouldAbort).toBe(false);
      expect(processor).not.toHaveBeenCalled();
    });
  });
});
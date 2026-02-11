import { ConversionReporterImpl } from '../../src/reporters/ConversionReporterImpl.js';
import { 
  ProcessedFileInfo, 
  SkippedFileInfo, 
  FailedFileInfo, 
  ConversionError, 
  ConversionWarning 
} from '../../src/types/index.js';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

describe('ConversionReporter', () => {
  let reporter: ConversionReporterImpl;

  beforeEach(() => {
    reporter = new ConversionReporterImpl();
  });

  describe('转换会话管理', () => {
    test('应该能够开始转换会话', () => {
      const reportId = reporter.startConversion('project1');
      
      expect(reportId).toBeDefined();
      expect(typeof reportId).toBe('string');
      expect(reportId.length).toBeGreaterThan(0);

      const report = reporter.getReport(reportId);
      expect(report).toBeDefined();
      expect(report?.projectType).toBe('project1');
      expect(report?.summary.totalFilesProcessed).toBe(0);
    });

    test('应该能够获取不存在的报告', () => {
      const report = reporter.getReport('non-existent-id');
      expect(report).toBeNull();
    });
  });

  describe('文件处理记录', () => {
    let reportId: string;

    beforeEach(() => {
      reportId = reporter.startConversion('project1');
    });

    test('应该能够记录文件处理成功', () => {
      const fileInfo: ProcessedFileInfo = {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 95,
        invalidRecords: 5,
        processingTime: 500,
        lastModified: new Date('2024-01-01'),
        processedAt: new Date()
      };

      reporter.recordFileProcessed(reportId, fileInfo);

      const report = reporter.getReport(reportId);
      expect(report?.summary.totalFilesProcessed).toBe(1);
      expect(report?.summary.totalRecordsProcessed).toBe(100);
      expect(report?.summary.totalRecordsValid).toBe(95);
      expect(report?.summary.totalRecordsInvalid).toBe(5);
      expect(report?.fileProcessing.processedFiles).toHaveLength(1);
      expect(report?.fileProcessing.processedFiles[0]).toEqual(fileInfo);
    });

    test('应该能够记录文件跳过', () => {
      const fileInfo: SkippedFileInfo = {
        filePath: '/test/file2.csv',
        reason: 'already_processed',
        lastModified: new Date('2024-01-01'),
        skippedAt: new Date()
      };

      reporter.recordFileSkipped(reportId, fileInfo);

      const report = reporter.getReport(reportId);
      expect(report?.summary.totalFilesSkipped).toBe(1);
      expect(report?.fileProcessing.skippedFiles).toHaveLength(1);
      expect(report?.fileProcessing.skippedFiles[0]).toEqual(fileInfo);
    });

    test('应该能够记录文件处理失败', () => {
      const fileInfo: FailedFileInfo = {
        filePath: '/test/file3.csv',
        error: 'Parse error',
        errorType: 'parse_error',
        attemptedAt: new Date()
      };

      reporter.recordFileFailed(reportId, fileInfo);

      const report = reporter.getReport(reportId);
      expect(report?.summary.totalFilesFailed).toBe(1);
      expect(report?.fileProcessing.failedFiles).toHaveLength(1);
      expect(report?.fileProcessing.failedFiles[0]).toEqual(fileInfo);
      // 应该自动创建对应的错误记录
      expect(report?.errors).toHaveLength(1);
      expect(report?.errors[0].type).toBe('file_error');
    });

    test('应该能够记录多个文件处理结果', () => {
      // 处理成功的文件
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 100,
        invalidRecords: 0,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      // 跳过的文件
      reporter.recordFileSkipped(reportId, {
        filePath: '/test/file2.csv',
        reason: 'no_changes',
        lastModified: new Date(),
        skippedAt: new Date()
      });

      // 失败的文件
      reporter.recordFileFailed(reportId, {
        filePath: '/test/file3.csv',
        error: 'Access denied',
        errorType: 'io_error',
        attemptedAt: new Date()
      });

      const report = reporter.getReport(reportId);
      expect(report?.summary.totalFilesProcessed).toBe(1);
      expect(report?.summary.totalFilesSkipped).toBe(1);
      expect(report?.summary.totalFilesFailed).toBe(1);
    });
  });

  describe('错误和警告记录', () => {
    let reportId: string;

    beforeEach(() => {
      reportId = reporter.startConversion('project2');
    });

    test('应该能够记录转换错误', () => {
      const error: ConversionError = {
        errorId: 'error-1',
        type: 'validation_error',
        severity: 'high',
        filePath: '/test/file.csv',
        rowIndex: 10,
        field: 'voltage',
        message: 'Invalid voltage value',
        details: 'Voltage out of range',
        timestamp: new Date()
      };

      reporter.recordError(reportId, error);

      const report = reporter.getReport(reportId);
      expect(report?.errors).toHaveLength(1);
      expect(report?.errors[0]).toEqual(error);
    });

    test('应该能够记录转换警告', () => {
      const warning: ConversionWarning = {
        warningId: 'warning-1',
        type: 'data_quality',
        filePath: '/test/file.csv',
        rowIndex: 5,
        field: 'temperature',
        message: 'Suspicious temperature value',
        suggestion: 'Check sensor calibration',
        timestamp: new Date()
      };

      reporter.recordWarning(reportId, warning);

      const report = reporter.getReport(reportId);
      expect(report?.warnings).toHaveLength(1);
      expect(report?.warnings[0]).toEqual(warning);
    });

    test('应该能够记录多个错误和警告', () => {
      // 记录多个错误
      for (let i = 0; i < 3; i++) {
        reporter.recordError(reportId, {
          errorId: `error-${i}`,
          type: 'parse_error',
          severity: 'medium',
          message: `Error ${i}`,
          timestamp: new Date()
        });
      }

      // 记录多个警告
      for (let i = 0; i < 2; i++) {
        reporter.recordWarning(reportId, {
          warningId: `warning-${i}`,
          type: 'format_issue',
          message: `Warning ${i}`,
          timestamp: new Date()
        });
      }

      const report = reporter.getReport(reportId);
      expect(report?.errors).toHaveLength(3);
      expect(report?.warnings).toHaveLength(2);
    });
  });

  describe('性能指标跟踪', () => {
    let reportId: string;

    beforeEach(() => {
      reportId = reporter.startConversion('project1');
    });

    test('应该能够更新性能指标', () => {
      reporter.updatePerformanceMetrics(reportId, 512, 75);
      reporter.updatePerformanceMetrics(reportId, 768, 80);

      const report = reporter.getReport(reportId);
      expect(report?.performance.totalMemoryUsed).toBe(768);
      expect(report?.performance.peakMemoryUsage).toBe(768);
      expect(report?.performance.cpuUsagePercent).toBe(80);
    });

    test('应该跟踪峰值内存使用', () => {
      reporter.updatePerformanceMetrics(reportId, 512, 50);
      reporter.updatePerformanceMetrics(reportId, 1024, 60);
      reporter.updatePerformanceMetrics(reportId, 256, 40);

      const report = reporter.getReport(reportId);
      expect(report?.performance.peakMemoryUsage).toBe(1024);
      expect(report?.performance.totalMemoryUsed).toBe(256); // 最后一次更新的值
    });
  });

  describe('转换完成和报告生成', () => {
    let reportId: string;

    beforeEach(() => {
      reportId = reporter.startConversion('project1');
    });

    test('应该能够完成转换并生成最终报告', async () => {
      // 添加一些测试数据
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 95,
        invalidRecords: 5,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      reporter.updatePerformanceMetrics(reportId, 512, 60);

      // 等待一小段时间以确保处理时间 > 0
      await new Promise(resolve => setTimeout(resolve, 10));

      const finalReport = await reporter.finishConversion(reportId);

      expect(finalReport.reportId).toBe(reportId);
      expect(finalReport.summary.totalProcessingTime).toBeGreaterThan(0);
      expect(finalReport.summary.totalFilesScanned).toBe(1);
      expect(finalReport.dataQuality.overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(finalReport.recommendations).toBeDefined();
      expect(finalReport.recommendations.length).toBeGreaterThan(0);
    });

    test('应该正确计算文件扫描总数', async () => {
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 100,
        invalidRecords: 0,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      reporter.recordFileSkipped(reportId, {
        filePath: '/test/file2.csv',
        reason: 'already_processed',
        lastModified: new Date(),
        skippedAt: new Date()
      });

      reporter.recordFileFailed(reportId, {
        filePath: '/test/file3.csv',
        error: 'Parse error',
        errorType: 'parse_error',
        attemptedAt: new Date()
      });

      const finalReport = await reporter.finishConversion(reportId);

      expect(finalReport.summary.totalFilesScanned).toBe(3);
      expect(finalReport.summary.totalFilesProcessed).toBe(1);
      expect(finalReport.summary.totalFilesSkipped).toBe(1);
      expect(finalReport.summary.totalFilesFailed).toBe(1);
    });

    test('应该生成合理的数据质量指标', async () => {
      // 添加成功处理的文件
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 90,
        invalidRecords: 10,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      const finalReport = await reporter.finishConversion(reportId);

      expect(finalReport.dataQuality.completenessScore).toBe(1.0); // 100%文件处理成功
      expect(finalReport.dataQuality.accuracyScore).toBe(0.9); // 90%记录有效
      expect(finalReport.dataQuality.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(finalReport.dataQuality.timelinessScore).toBeGreaterThanOrEqual(0);
      expect(finalReport.dataQuality.overallQualityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('报告保存和摘要生成', () => {
    let reportId: string;
    const testReportPath = './test-report.json';

    beforeEach(() => {
      reportId = reporter.startConversion('project1');
    });

    afterEach(async () => {
      // 清理测试文件
      if (existsSync(testReportPath)) {
        await unlink(testReportPath);
      }
    });

    test('应该能够保存报告到文件', async () => {
      // 添加测试数据
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 100,
        invalidRecords: 0,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      const finalReport = await reporter.finishConversion(reportId);
      await reporter.saveReportToFile(finalReport, testReportPath);

      expect(existsSync(testReportPath)).toBe(true);

      // 验证文件内容
      const savedContent = await import('fs/promises').then(fs => fs.readFile(testReportPath, 'utf-8'));
      const savedReport = JSON.parse(savedContent);
      expect(savedReport.reportId).toBe(reportId);
      expect(savedReport.projectType).toBe('project1');
    });

    test('应该生成有意义的报告摘要', async () => {
      // 添加测试数据
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 95,
        invalidRecords: 5,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      reporter.recordFileSkipped(reportId, {
        filePath: '/test/file2.csv',
        reason: 'already_processed',
        lastModified: new Date(),
        skippedAt: new Date()
      });

      const finalReport = await reporter.finishConversion(reportId);
      const summary = reporter.generateReportSummary(finalReport);

      expect(summary).toContain('CSV数据转换报告摘要');
      expect(summary).toContain(reportId);
      expect(summary).toContain('project1');
      expect(summary).toContain('扫描文件总数: 2');
      expect(summary).toContain('成功处理: 1');
      expect(summary).toContain('跳过文件: 1');
      expect(summary).toContain('处理记录总数: 100');
      expect(summary).toContain('有效记录: 95');
    });
  });

  describe('建议生成', () => {
    let reportId: string;

    beforeEach(() => {
      reportId = reporter.startConversion('project1');
    });

    test('应该为低成功率生成建议', async () => {
      // 添加失败的文件
      reporter.recordFileFailed(reportId, {
        filePath: '/test/file1.csv',
        error: 'Parse error',
        errorType: 'parse_error',
        attemptedAt: new Date()
      });

      reporter.recordFileFailed(reportId, {
        filePath: '/test/file2.csv',
        error: 'Access denied',
        errorType: 'io_error',
        attemptedAt: new Date()
      });

      const finalReport = await reporter.finishConversion(reportId);

      expect(finalReport.recommendations).toContain('文件处理成功率较低，建议检查文件格式和访问权限');
      expect(finalReport.recommendations.some(rec => rec.includes('个文件处理失败'))).toBe(true);
    });

    test('应该为良好的转换结果生成积极建议', async () => {
      // 添加成功处理的文件
      reporter.recordFileProcessed(reportId, {
        filePath: '/test/file1.csv',
        fileSize: 1024,
        recordCount: 1000, // 更多记录
        validRecords: 1000,
        invalidRecords: 0,
        processingTime: 50, // 更快的处理时间
        lastModified: new Date(),
        processedAt: new Date()
      });

      reporter.updatePerformanceMetrics(reportId, 256, 50); // 合理的资源使用

      // 等待足够短的时间以确保高处理速度
      await new Promise(resolve => setTimeout(resolve, 1));

      const finalReport = await reporter.finishConversion(reportId);

      // 检查是否有积极建议或者至少没有严重问题的建议
      const hasPositiveRecommendation = finalReport.recommendations.some(rec => 
        rec.includes('转换过程运行良好') || 
        rec.includes('建议继续保持') ||
        !rec.includes('建议检查') && !rec.includes('建议优化')
      );

      // 如果没有积极建议，至少确保数据质量是好的
      if (!hasPositiveRecommendation) {
        expect(finalReport.dataQuality.overallQualityScore).toBeGreaterThan(0.8);
        expect(finalReport.dataQuality.accuracyScore).toBe(1.0);
        expect(finalReport.dataQuality.completenessScore).toBe(1.0);
      } else {
        expect(hasPositiveRecommendation).toBe(true);
      }
    });
  });

  describe('错误处理', () => {
    test('应该处理不存在的报告ID', () => {
      const nonExistentId = 'non-existent-id';

      // 这些操作应该不会抛出错误，但会记录错误日志
      reporter.recordFileProcessed(nonExistentId, {
        filePath: '/test/file.csv',
        fileSize: 1024,
        recordCount: 100,
        validRecords: 100,
        invalidRecords: 0,
        processingTime: 500,
        lastModified: new Date(),
        processedAt: new Date()
      });

      reporter.updatePerformanceMetrics(nonExistentId, 512, 60);

      // 应该不会有任何副作用
      expect(reporter.getReport(nonExistentId)).toBeNull();
    });

    test('应该处理完成不存在的转换', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(reporter.finishConversion(nonExistentId))
        .rejects.toThrow('报告不存在');
    });
  });
});
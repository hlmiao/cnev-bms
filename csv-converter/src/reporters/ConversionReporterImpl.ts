import { 
  ConversionReport, 
  ConversionError, 
  ConversionWarning, 
  ProcessedFileInfo,
  SkippedFileInfo,
  FailedFileInfo,
  ProjectType
} from '../types/index.js';
import { ConversionReporter } from '../interfaces/ConversionReporter.js';
import { logger } from '../utils/logger.js';
import { writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * 转换报告生成器实现
 * 负责跟踪转换过程并生成详细报告
 */
export class ConversionReporterImpl implements ConversionReporter {
  private reports: Map<string, ConversionReport> = new Map();
  private performanceTracking: Map<string, {
    memoryUsages: number[];
    cpuUsages: number[];
    startTime: Date;
  }> = new Map();

  /**
   * 开始转换会话
   * @param projectType 项目类型
   * @returns 报告ID
   */
  startConversion(projectType: ProjectType): string {
    const reportId = randomUUID();
    const startTime = new Date();

    const report: ConversionReport = {
      reportId,
      timestamp: startTime,
      projectType,
      summary: {
        totalFilesScanned: 0,
        totalFilesProcessed: 0,
        totalFilesSkipped: 0,
        totalFilesFailed: 0,
        totalRecordsProcessed: 0,
        totalRecordsValid: 0,
        totalRecordsInvalid: 0,
        processingStartTime: startTime,
        processingEndTime: startTime,
        totalProcessingTime: 0
      },
      fileProcessing: {
        processedFiles: [],
        skippedFiles: [],
        failedFiles: []
      },
      dataQuality: {
        overallQualityScore: 0,
        completenessScore: 0,
        accuracyScore: 0,
        consistencyScore: 0,
        timelinessScore: 0,
        anomalyCount: 0,
        criticalAnomalies: 0,
        highSeverityAnomalies: 0
      },
      errors: [],
      warnings: [],
      performance: {
        totalMemoryUsed: 0,
        peakMemoryUsage: 0,
        averageFileProcessingTime: 0,
        filesPerSecond: 0,
        recordsPerSecond: 0,
        cpuUsagePercent: 0,
        ioWaitTime: 0
      },
      recommendations: []
    };

    this.reports.set(reportId, report);
    this.performanceTracking.set(reportId, {
      memoryUsages: [],
      cpuUsages: [],
      startTime
    });

    logger.info(`开始转换会话: ${reportId}, 项目类型: ${projectType}`);
    return reportId;
  }

  /**
   * 记录文件处理成功
   * @param reportId 报告ID
   * @param fileInfo 处理的文件信息
   */
  recordFileProcessed(reportId: string, fileInfo: ProcessedFileInfo): void {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.error(`报告不存在: ${reportId}`);
      return;
    }

    report.fileProcessing.processedFiles.push(fileInfo);
    report.summary.totalFilesProcessed++;
    report.summary.totalRecordsProcessed += fileInfo.recordCount;
    report.summary.totalRecordsValid += fileInfo.validRecords;
    report.summary.totalRecordsInvalid += fileInfo.invalidRecords;

    logger.debug(`记录文件处理成功: ${fileInfo.filePath}, 记录数: ${fileInfo.recordCount}`);
  }

  /**
   * 记录文件跳过
   * @param reportId 报告ID
   * @param fileInfo 跳过的文件信息
   */
  recordFileSkipped(reportId: string, fileInfo: SkippedFileInfo): void {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.error(`报告不存在: ${reportId}`);
      return;
    }

    report.fileProcessing.skippedFiles.push(fileInfo);
    report.summary.totalFilesSkipped++;

    logger.debug(`记录文件跳过: ${fileInfo.filePath}, 原因: ${fileInfo.reason}`);
  }

  /**
   * 记录文件处理失败
   * @param reportId 报告ID
   * @param fileInfo 失败的文件信息
   */
  recordFileFailed(reportId: string, fileInfo: FailedFileInfo): void {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.error(`报告不存在: ${reportId}`);
      return;
    }

    report.fileProcessing.failedFiles.push(fileInfo);
    report.summary.totalFilesFailed++;

    // 自动创建对应的错误记录
    const error: ConversionError = {
      errorId: randomUUID(),
      type: 'file_error',
      severity: 'high',
      filePath: fileInfo.filePath,
      message: fileInfo.error,
      details: `错误类型: ${fileInfo.errorType}`,
      timestamp: fileInfo.attemptedAt
    };
    this.recordError(reportId, error);

    logger.warn(`记录文件处理失败: ${fileInfo.filePath}, 错误: ${fileInfo.error}`);
  }

  /**
   * 记录转换错误
   * @param reportId 报告ID
   * @param error 转换错误
   */
  recordError(reportId: string, error: ConversionError): void {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.error(`报告不存在: ${reportId}`);
      return;
    }

    report.errors.push(error);
    logger.error(`记录转换错误: ${error.type} - ${error.message}`);
  }

  /**
   * 记录转换警告
   * @param reportId 报告ID
   * @param warning 转换警告
   */
  recordWarning(reportId: string, warning: ConversionWarning): void {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.error(`报告不存在: ${reportId}`);
      return;
    }

    report.warnings.push(warning);
    logger.warn(`记录转换警告: ${warning.type} - ${warning.message}`);
  }

  /**
   * 更新性能指标
   * @param reportId 报告ID
   * @param memoryUsage 内存使用量(MB)
   * @param cpuUsage CPU使用率(%)
   */
  updatePerformanceMetrics(reportId: string, memoryUsage: number, cpuUsage: number): void {
    const tracking = this.performanceTracking.get(reportId);
    if (!tracking) {
      logger.error(`性能跟踪不存在: ${reportId}`);
      return;
    }

    tracking.memoryUsages.push(memoryUsage);
    tracking.cpuUsages.push(cpuUsage);

    const report = this.reports.get(reportId);
    if (report) {
      report.performance.totalMemoryUsed = memoryUsage;
      report.performance.peakMemoryUsage = Math.max(report.performance.peakMemoryUsage, memoryUsage);
      report.performance.cpuUsagePercent = cpuUsage;
    }
  }

  /**
   * 完成转换并生成最终报告
   * @param reportId 报告ID
   * @returns 完整的转换报告
   */
  async finishConversion(reportId: string): Promise<ConversionReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`报告不存在: ${reportId}`);
    }

    const endTime = new Date();
    report.summary.processingEndTime = endTime;
    report.summary.totalProcessingTime = endTime.getTime() - report.summary.processingStartTime.getTime();

    // 计算总扫描文件数
    report.summary.totalFilesScanned = 
      report.summary.totalFilesProcessed + 
      report.summary.totalFilesSkipped + 
      report.summary.totalFilesFailed;

    // 计算性能指标
    await this.calculatePerformanceMetrics(reportId);

    // 计算数据质量指标
    this.calculateDataQualityMetrics(report);

    // 生成建议
    report.recommendations = this.generateRecommendations(report);

    // 清理性能跟踪数据
    this.performanceTracking.delete(reportId);

    logger.info(`转换会话完成: ${reportId}, 处理时间: ${report.summary.totalProcessingTime}ms`);
    return report;
  }

  /**
   * 获取转换报告
   * @param reportId 报告ID
   * @returns 转换报告，如果不存在则返回null
   */
  getReport(reportId: string): ConversionReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * 保存报告到文件
   * @param report 转换报告
   * @param filePath 保存路径
   */
  async saveReportToFile(report: ConversionReport, filePath: string): Promise<void> {
    try {
      const reportJson = JSON.stringify(report, null, 2);
      await writeFile(filePath, reportJson, 'utf-8');
      logger.info(`转换报告已保存到: ${filePath}`);
    } catch (error) {
      logger.error(`保存转换报告失败: ${error}`);
      throw error;
    }
  }

  /**
   * 生成报告摘要
   * @param report 转换报告
   * @returns 报告摘要字符串
   */
  generateReportSummary(report: ConversionReport): string {
    const summary = report.summary;
    const successRate = summary.totalFilesScanned > 0 
      ? (summary.totalFilesProcessed / summary.totalFilesScanned * 100).toFixed(1)
      : '0.0';
    
    const dataValidityRate = summary.totalRecordsProcessed > 0
      ? (summary.totalRecordsValid / summary.totalRecordsProcessed * 100).toFixed(1)
      : '0.0';

    const processingTimeSeconds = (summary.totalProcessingTime / 1000).toFixed(2);

    return `
=== CSV数据转换报告摘要 ===
报告ID: ${report.reportId}
项目类型: ${report.projectType}
处理时间: ${report.summary.processingStartTime.toLocaleString()} - ${report.summary.processingEndTime.toLocaleString()}
总处理时长: ${processingTimeSeconds}秒

文件处理统计:
- 扫描文件总数: ${summary.totalFilesScanned}
- 成功处理: ${summary.totalFilesProcessed} (${successRate}%)
- 跳过文件: ${summary.totalFilesSkipped}
- 失败文件: ${summary.totalFilesFailed}

数据记录统计:
- 处理记录总数: ${summary.totalRecordsProcessed}
- 有效记录: ${summary.totalRecordsValid} (${dataValidityRate}%)
- 无效记录: ${summary.totalRecordsInvalid}

数据质量指标:
- 总体质量分数: ${report.dataQuality.overallQualityScore.toFixed(2)}
- 完整性: ${report.dataQuality.completenessScore.toFixed(2)}
- 准确性: ${report.dataQuality.accuracyScore.toFixed(2)}
- 一致性: ${report.dataQuality.consistencyScore.toFixed(2)}
- 及时性: ${report.dataQuality.timelinessScore.toFixed(2)}

异常统计:
- 异常总数: ${report.dataQuality.anomalyCount}
- 严重异常: ${report.dataQuality.criticalAnomalies}
- 高级异常: ${report.dataQuality.highSeverityAnomalies}

性能指标:
- 平均文件处理时间: ${report.performance.averageFileProcessingTime.toFixed(2)}ms
- 文件处理速度: ${report.performance.filesPerSecond.toFixed(2)} 文件/秒
- 记录处理速度: ${report.performance.recordsPerSecond.toFixed(0)} 记录/秒
- 峰值内存使用: ${report.performance.peakMemoryUsage.toFixed(2)}MB

错误和警告:
- 错误数量: ${report.errors.length}
- 警告数量: ${report.warnings.length}

建议事项:
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
  }

  /**
   * 计算性能指标
   * @param reportId 报告ID
   */
  private async calculatePerformanceMetrics(reportId: string): Promise<void> {
    const report = this.reports.get(reportId);
    const tracking = this.performanceTracking.get(reportId);
    
    if (!report || !tracking) return;

    const processedFiles = report.fileProcessing.processedFiles;
    const totalProcessingTime = report.summary.totalProcessingTime;

    // 计算平均文件处理时间
    if (processedFiles.length > 0) {
      const totalFileProcessingTime = processedFiles.reduce((sum, file) => sum + file.processingTime, 0);
      report.performance.averageFileProcessingTime = totalFileProcessingTime / processedFiles.length;
    }

    // 计算处理速度
    if (totalProcessingTime > 0) {
      const totalTimeSeconds = totalProcessingTime / 1000;
      report.performance.filesPerSecond = report.summary.totalFilesProcessed / totalTimeSeconds;
      report.performance.recordsPerSecond = report.summary.totalRecordsProcessed / totalTimeSeconds;
    }

    // 计算平均CPU使用率
    if (tracking.cpuUsages.length > 0) {
      const avgCpu = tracking.cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / tracking.cpuUsages.length;
      report.performance.cpuUsagePercent = Math.round(avgCpu * 100) / 100;
    }

    // 估算I/O等待时间（基于文件处理时间和CPU使用率）
    if (report.performance.averageFileProcessingTime > 0 && report.performance.cpuUsagePercent > 0) {
      const cpuRatio = report.performance.cpuUsagePercent / 100;
      report.performance.ioWaitTime = report.performance.averageFileProcessingTime * (1 - cpuRatio);
    }
  }

  /**
   * 计算数据质量指标
   * @param report 转换报告
   */
  private calculateDataQualityMetrics(report: ConversionReport): void {
    const summary = report.summary;
    
    // 计算完整性分数（基于成功处理的文件比例）
    if (summary.totalFilesScanned > 0) {
      report.dataQuality.completenessScore = summary.totalFilesProcessed / summary.totalFilesScanned;
    }

    // 计算准确性分数（基于有效记录比例）
    if (summary.totalRecordsProcessed > 0) {
      report.dataQuality.accuracyScore = summary.totalRecordsValid / summary.totalRecordsProcessed;
    }

    // 计算一致性分数（基于错误数量）
    const errorWeight = Math.min(report.errors.length / Math.max(summary.totalRecordsProcessed, 1), 1);
    report.dataQuality.consistencyScore = Math.max(0, 1 - errorWeight);

    // 计算及时性分数（基于处理速度）
    const expectedSpeed = 1000; // 期望每秒处理1000条记录
    const actualSpeed = report.performance.recordsPerSecond;
    report.dataQuality.timelinessScore = Math.min(actualSpeed / expectedSpeed, 1);

    // 统计异常数量
    report.dataQuality.anomalyCount = report.warnings.filter(w => w.type === 'data_quality').length;
    report.dataQuality.criticalAnomalies = report.errors.filter(e => e.severity === 'critical').length;
    report.dataQuality.highSeverityAnomalies = report.errors.filter(e => e.severity === 'high').length;

    // 计算总体质量分数
    report.dataQuality.overallQualityScore = (
      report.dataQuality.completenessScore +
      report.dataQuality.accuracyScore +
      report.dataQuality.consistencyScore +
      report.dataQuality.timelinessScore
    ) / 4;
  }

  /**
   * 生成建议
   * @param report 转换报告
   * @returns 建议数组
   */
  private generateRecommendations(report: ConversionReport): string[] {
    const recommendations: string[] = [];
    const summary = report.summary;
    const quality = report.dataQuality;
    const performance = report.performance;

    // 基于文件处理成功率的建议
    const successRate = summary.totalFilesScanned > 0 
      ? summary.totalFilesProcessed / summary.totalFilesScanned 
      : 0;

    if (successRate < 0.8) {
      recommendations.push('文件处理成功率较低，建议检查文件格式和访问权限');
    }

    if (summary.totalFilesFailed > 0) {
      recommendations.push(`有 ${summary.totalFilesFailed} 个文件处理失败，建议查看错误详情并修复相关问题`);
    }

    // 基于数据质量的建议
    if (quality.completenessScore < 0.9) {
      recommendations.push('数据完整性较低，建议检查数据源和采集过程');
    }

    if (quality.accuracyScore < 0.95) {
      recommendations.push('数据准确性有待提高，建议检查数据验证规则和清洗流程');
    }

    if (quality.consistencyScore < 0.9) {
      recommendations.push('数据一致性较低，建议统一数据格式和标准');
    }

    // 基于性能的建议
    if (performance.filesPerSecond < 1) {
      recommendations.push('文件处理速度较慢，建议优化I/O操作或增加并行处理');
    }

    if (performance.peakMemoryUsage > 1000) { // 超过1GB
      recommendations.push('内存使用量较高，建议优化数据处理流程或增加系统内存');
    }

    if (performance.cpuUsagePercent > 80) {
      recommendations.push('CPU使用率较高，建议优化算法或分散处理负载');
    }

    // 基于错误和警告的建议
    if (report.errors.length > 0) {
      const criticalErrors = report.errors.filter(e => e.severity === 'critical').length;
      if (criticalErrors > 0) {
        recommendations.push(`发现 ${criticalErrors} 个严重错误，建议立即处理以确保数据质量`);
      }
    }

    if (report.warnings.length > 10) {
      recommendations.push('警告数量较多，建议检查数据质量和处理流程');
    }

    // 如果一切正常，给出积极建议
    if (recommendations.length === 0) {
      recommendations.push('转换过程运行良好，建议继续保持当前的处理流程和质量标准');
    }

    return recommendations;
  }
}
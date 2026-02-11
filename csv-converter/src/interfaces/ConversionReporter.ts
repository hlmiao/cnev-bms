import { 
  ConversionReport, 
  ConversionError, 
  ConversionWarning, 
  ProcessedFileInfo,
  SkippedFileInfo,
  FailedFileInfo,
  ProjectType 
} from '../types/index.js';

/**
 * 转换报告生成器接口
 * 负责跟踪转换过程并生成详细报告
 */
export interface ConversionReporter {
  /**
   * 开始转换会话
   * @param projectType 项目类型
   * @returns 报告ID
   */
  startConversion(projectType: ProjectType): string;

  /**
   * 记录文件处理成功
   * @param reportId 报告ID
   * @param fileInfo 处理的文件信息
   */
  recordFileProcessed(reportId: string, fileInfo: ProcessedFileInfo): void;

  /**
   * 记录文件跳过
   * @param reportId 报告ID
   * @param fileInfo 跳过的文件信息
   */
  recordFileSkipped(reportId: string, fileInfo: SkippedFileInfo): void;

  /**
   * 记录文件处理失败
   * @param reportId 报告ID
   * @param fileInfo 失败的文件信息
   */
  recordFileFailed(reportId: string, fileInfo: FailedFileInfo): void;

  /**
   * 记录转换错误
   * @param reportId 报告ID
   * @param error 转换错误
   */
  recordError(reportId: string, error: ConversionError): void;

  /**
   * 记录转换警告
   * @param reportId 报告ID
   * @param warning 转换警告
   */
  recordWarning(reportId: string, warning: ConversionWarning): void;

  /**
   * 更新性能指标
   * @param reportId 报告ID
   * @param memoryUsage 内存使用量(MB)
   * @param cpuUsage CPU使用率(%)
   */
  updatePerformanceMetrics(reportId: string, memoryUsage: number, cpuUsage: number): void;

  /**
   * 完成转换并生成最终报告
   * @param reportId 报告ID
   * @returns 完整的转换报告
   */
  finishConversion(reportId: string): Promise<ConversionReport>;

  /**
   * 获取转换报告
   * @param reportId 报告ID
   * @returns 转换报告，如果不存在则返回null
   */
  getReport(reportId: string): ConversionReport | null;

  /**
   * 保存报告到文件
   * @param report 转换报告
   * @param filePath 保存路径
   */
  saveReportToFile(report: ConversionReport, filePath: string): Promise<void>;

  /**
   * 生成报告摘要
   * @param report 转换报告
   * @returns 报告摘要字符串
   */
  generateReportSummary(report: ConversionReport): string;
}
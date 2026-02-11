import { StandardBatteryData, ValidationResult, TimeSeriesPoint } from '../types/index.js';

export interface AnomalyReport {
  anomalies: Anomaly[];
  summary: {
    totalAnomalies: number;
    severityDistribution: Record<AnomalySeverity, number>;
  };
}

export interface Anomaly {
  type: 'voltage_outlier' | 'temperature_outlier' | 'soc_outlier' | 'missing_data' | 'time_gap';
  severity: AnomalySeverity;
  timestamp: Date;
  bankId: string;
  cellId?: number;
  value: number | null;
  expectedRange?: [number, number];
  message: string;
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface QualityReport {
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  anomalyCount: number;
  recommendations: string[];
}

/**
 * 数据验证器接口
 * 负责数据质量检查和异常检测
 */
export interface DataValidator {
  /**
   * 验证数据
   * @param data 标准化数据
   * @returns 验证结果
   */
  validateData(data: StandardBatteryData): Promise<ValidationResult>;

  /**
   * 检测异常
   * @param data 时间序列数据点数组
   * @returns 异常报告
   */
  detectAnomalies(data: TimeSeriesPoint[]): Promise<AnomalyReport>;

  /**
   * 生成质量报告
   * @param data 标准化数据
   * @returns 质量报告
   */
  generateQualityReport(data: StandardBatteryData): Promise<QualityReport>;

  /**
   * 检查数据完整性
   * @param data 标准化数据
   * @returns 完整性分数 (0-100)
   */
  checkDataCompleteness(data: StandardBatteryData): number;

  /**
   * 检查数据一致性
   * @param data 标准化数据
   * @returns 一致性分数 (0-100)
   */
  checkDataConsistency(data: StandardBatteryData): number;
}
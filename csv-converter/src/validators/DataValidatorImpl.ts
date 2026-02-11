import { 
  StandardBatteryData, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  TimeSeriesPoint 
} from '../types/index.js';
import { 
  DataValidator, 
  AnomalyReport, 
  Anomaly, 
  AnomalySeverity, 
  QualityReport 
} from '../interfaces/DataValidator.js';
import { DEFAULT_CONFIG } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * 数据验证器实现
 * 负责数据质量检查、异常检测和质量报告生成
 */
export class DataValidatorImpl implements DataValidator {
  
  /**
   * 验证数据
   * @param data 标准化数据
   * @returns 验证结果
   */
  async validateData(data: StandardBatteryData): Promise<ValidationResult> {
    logger.info(`开始验证数据: ${data.projectId}`);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    try {
      // 验证基本结构
      this.validateBasicStructure(data, errors);

      // 验证每个Bank的数据
      for (const bank of data.banks) {
        const bankValidation = await this.validateBankData(bank, errors, warnings);
        totalRecords += bankValidation.totalRecords;
        validRecords += bankValidation.validRecords;
      }

      // 验证时间序列连续性
      this.validateTimeSeriesContinuity(data, warnings);

      const errorRate = totalRecords > 0 ? (totalRecords - validRecords) / totalRecords : 0;
      const isValid = errors.length === 0 && errorRate < 0.1; // 错误率小于10%认为有效

      const result: ValidationResult = {
        isValid,
        errors,
        warnings,
        statistics: {
          totalRecords,
          validRecords,
          errorRate
        }
      };

      logger.info(`数据验证完成: ${isValid ? '通过' : '失败'}, 错误: ${errors.length}, 警告: ${warnings.length}`);
      return result;

    } catch (error) {
      logger.error(`数据验证失败: ${error}`);
      throw error;
    }
  }

  /**
   * 检测异常
   * @param data 时间序列数据点数组
   * @returns 异常报告
   */
  async detectAnomalies(data: TimeSeriesPoint[]): Promise<AnomalyReport> {
    logger.info(`开始异常检测: ${data.length} 个数据点`);

    const anomalies: Anomaly[] = [];

    try {
      // 检测电压异常
      this.detectVoltageAnomalies(data, anomalies);

      // 检测温度异常
      this.detectTemperatureAnomalies(data, anomalies);

      // 检测SOC异常
      this.detectSocAnomalies(data, anomalies);

      // 检测SOH异常
      this.detectSohAnomalies(data, anomalies);

      // 检测缺失数据
      this.detectMissingData(data, anomalies);

      // 检测时间间隙
      this.detectTimeGaps(data, anomalies);

      // 统计异常分布
      const severityDistribution = this.calculateSeverityDistribution(anomalies);

      const report: AnomalyReport = {
        anomalies,
        summary: {
          totalAnomalies: anomalies.length,
          severityDistribution
        }
      };

      logger.info(`异常检测完成: 发现 ${anomalies.length} 个异常`);
      return report;

    } catch (error) {
      logger.error(`异常检测失败: ${error}`);
      throw error;
    }
  }

  /**
   * 生成质量报告
   * @param data 标准化数据
   * @returns 质量报告
   */
  async generateQualityReport(data: StandardBatteryData): Promise<QualityReport> {
    logger.info(`开始生成质量报告: ${data.projectId}`);

    try {
      // 检查数据完整性
      const completeness = this.checkDataCompleteness(data);

      // 检查数据一致性
      const consistency = this.checkDataConsistency(data);

      // 计算准确性（基于异常检测）
      const allDataPoints = data.banks.flatMap(bank => bank.dataPoints);
      const anomalyReport = await this.detectAnomalies(allDataPoints);
      const accuracy = this.calculateAccuracy(allDataPoints, anomalyReport);

      // 计算及时性（基于时间序列连续性）
      const timeliness = this.calculateTimeliness(data);

      // 计算总体分数
      const overallScore = (completeness + accuracy + consistency + timeliness) / 4;

      // 生成建议
      const recommendations = this.generateRecommendations(
        completeness, accuracy, consistency, timeliness, anomalyReport
      );

      const report: QualityReport = {
        overallScore: Math.round(overallScore * 100) / 100,
        completeness: Math.round(completeness * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        timeliness: Math.round(timeliness * 100) / 100,
        anomalyCount: anomalyReport.anomalies.length,
        recommendations
      };

      logger.info(`质量报告生成完成: 总体分数 ${report.overallScore}`);
      return report;

    } catch (error) {
      logger.error(`质量报告生成失败: ${error}`);
      throw error;
    }
  }

  /**
   * 检查数据完整性
   * @param data 标准化数据
   * @returns 完整性分数 (0-1)
   */
  checkDataCompleteness(data: StandardBatteryData): number {
    let totalFields = 0;
    let validFields = 0;

    for (const bank of data.banks) {
      for (const dataPoint of bank.dataPoints) {
        // 检查Bank数据字段
        const bankFields = [
          dataPoint.bankData.voltage,
          dataPoint.bankData.current,
          dataPoint.bankData.soc,
          dataPoint.bankData.soh,
          dataPoint.bankData.temperature
        ];

        totalFields += bankFields.length;
        validFields += bankFields.filter(field => 
          field !== null && field !== undefined && !isNaN(field) && field !== 0
        ).length;

        // 检查单体数据字段
        const cellFields = [
          ...dataPoint.cellData.voltages,
          ...dataPoint.cellData.temperatures,
          ...dataPoint.cellData.socs,
          ...dataPoint.cellData.sohs
        ];

        totalFields += cellFields.length;
        validFields += cellFields.filter(field => 
          field !== null && field !== undefined && !isNaN(field as number)
        ).length;
      }
    }

    return totalFields > 0 ? validFields / totalFields : 0;
  }

  /**
   * 检查数据一致性
   * @param data 标准化数据
   * @returns 一致性分数 (0-1)
   */
  checkDataConsistency(data: StandardBatteryData): number {
    if (data.banks.length === 0) return 0;

    let totalChecks = 0;
    let passedChecks = 0;

    for (const bank of data.banks) {
      if (bank.dataPoints.length < 2) continue;

      // 检查时间序列排序
      for (let i = 1; i < bank.dataPoints.length; i++) {
        totalChecks++;
        if (bank.dataPoints[i].timestamp >= bank.dataPoints[i-1].timestamp) {
          passedChecks++;
        }
      }

      // 检查数据范围一致性
      for (const dataPoint of bank.dataPoints) {
        // 电压范围检查
        totalChecks++;
        if (this.isInRange(dataPoint.bankData.voltage, DEFAULT_CONFIG.validation.voltageRange)) {
          passedChecks++;
        }

        // 温度范围检查
        totalChecks++;
        if (this.isInRange(dataPoint.bankData.temperature, DEFAULT_CONFIG.validation.temperatureRange)) {
          passedChecks++;
        }

        // SOC范围检查
        totalChecks++;
        if (this.isInRange(dataPoint.bankData.soc, DEFAULT_CONFIG.validation.socRange)) {
          passedChecks++;
        }

        // SOH范围检查
        totalChecks++;
        if (this.isInRange(dataPoint.bankData.soh, DEFAULT_CONFIG.validation.sohRange)) {
          passedChecks++;
        }
      }
    }

    return totalChecks > 0 ? passedChecks / totalChecks : 1.0;
  }

  /**
   * 验证基本结构
   * @param data 标准化数据
   * @param errors 错误数组
   */
  private validateBasicStructure(data: StandardBatteryData, errors: ValidationError[]): void {
    if (!data.projectId) {
      errors.push({
        type: 'missing_field',
        field: 'projectId',
        value: data.projectId,
        message: '缺少项目ID'
      });
    }

    if (!data.projectType) {
      errors.push({
        type: 'missing_field',
        field: 'projectType',
        value: data.projectType,
        message: '缺少项目类型'
      });
    }

    if (!data.banks || data.banks.length === 0) {
      errors.push({
        type: 'missing_field',
        field: 'banks',
        value: data.banks,
        message: '缺少Bank数据'
      });
    }
  }

  /**
   * 验证Bank数据
   * @param bank Bank时间序列数据
   * @param errors 错误数组
   * @param warnings 警告数组
   * @returns 验证统计信息
   */
  private async validateBankData(
    bank: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): Promise<{ totalRecords: number; validRecords: number }> {
    let totalRecords = bank.dataPoints?.length || 0;
    let validRecords = 0;

    if (!bank.dataPoints || bank.dataPoints.length === 0) {
      errors.push({
        type: 'missing_field',
        field: 'dataPoints',
        value: bank.dataPoints,
        message: `Bank ${bank.bankId} 缺少数据点`
      });
      return { totalRecords: 0, validRecords: 0 };
    }

    for (let i = 0; i < bank.dataPoints.length; i++) {
      const dataPoint = bank.dataPoints[i];
      let isValidRecord = true;

      // 验证时间戳
      if (!dataPoint.timestamp || isNaN(dataPoint.timestamp.getTime())) {
        errors.push({
          type: 'invalid_value',
          field: 'timestamp',
          value: dataPoint.timestamp,
          message: '无效的时间戳',
          rowIndex: i
        });
        isValidRecord = false;
      }

      // 验证数据范围
      const rangeValidation = this.validateDataRanges(dataPoint, i, warnings);
      if (!rangeValidation) {
        isValidRecord = false;
      }

      if (isValidRecord) {
        validRecords++;
      }
    }

    return { totalRecords, validRecords };
  }

  /**
   * 验证数据范围
   * @param dataPoint 数据点
   * @param rowIndex 行索引
   * @param warnings 警告数组
   * @returns 是否有效
   */
  private validateDataRanges(dataPoint: TimeSeriesPoint, rowIndex: number, warnings: ValidationWarning[]): boolean {
    let isValid = true;

    // 验证电压范围
    if (!this.isInRange(dataPoint.bankData.voltage, DEFAULT_CONFIG.validation.voltageRange)) {
      warnings.push({
        type: 'suspicious_value',
        field: 'voltage',
        value: dataPoint.bankData.voltage,
        message: `电压值超出正常范围 ${DEFAULT_CONFIG.validation.voltageRange}`,
        rowIndex
      });
    }

    // 验证温度范围
    if (!this.isInRange(dataPoint.bankData.temperature, DEFAULT_CONFIG.validation.temperatureRange)) {
      warnings.push({
        type: 'suspicious_value',
        field: 'temperature',
        value: dataPoint.bankData.temperature,
        message: `温度值超出正常范围 ${DEFAULT_CONFIG.validation.temperatureRange}`,
        rowIndex
      });
    }

    // 验证SOC范围
    if (!this.isInRange(dataPoint.bankData.soc, DEFAULT_CONFIG.validation.socRange)) {
      warnings.push({
        type: 'suspicious_value',
        field: 'soc',
        value: dataPoint.bankData.soc,
        message: `SOC值超出正常范围 ${DEFAULT_CONFIG.validation.socRange}`,
        rowIndex
      });
    }

    // 验证SOH范围
    if (!this.isInRange(dataPoint.bankData.soh, DEFAULT_CONFIG.validation.sohRange)) {
      warnings.push({
        type: 'suspicious_value',
        field: 'soh',
        value: dataPoint.bankData.soh,
        message: `SOH值超出正常范围 ${DEFAULT_CONFIG.validation.sohRange}`,
        rowIndex
      });
    }

    return isValid;
  }

  /**
   * 验证时间序列连续性
   * @param data 标准化数据
   * @param warnings 警告数组
   */
  private validateTimeSeriesContinuity(data: StandardBatteryData, warnings: ValidationWarning[]): void {
    for (const bank of data.banks) {
      if (bank.dataPoints.length < 2) continue;

      for (let i = 1; i < bank.dataPoints.length; i++) {
        const currentTime = bank.dataPoints[i].timestamp.getTime();
        const previousTime = bank.dataPoints[i-1].timestamp.getTime();
        const timeDiff = currentTime - previousTime;

        // 检查时间间隙（超过2小时认为有间隙）
        if (timeDiff > 2 * 60 * 60 * 1000) {
          warnings.push({
            type: 'format_inconsistency',
            field: 'timestamp',
            value: timeDiff,
            message: `检测到时间间隙: ${Math.round(timeDiff / (60 * 60 * 1000))} 小时`,
            rowIndex: i
          });
        }
      }
    }
  }

  /**
   * 检测电压异常
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectVoltageAnomalies(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    const voltages = data.map(dp => dp.bankData.voltage).filter(v => v !== null && !isNaN(v));
    if (voltages.length === 0) return;

    // 使用固定阈值进行异常检测，更可靠
    const normalRange = DEFAULT_CONFIG.validation.voltageRange;
    const extendedThreshold = (normalRange[1] - normalRange[0]) * 0.5; // 50%的范围作为异常阈值

    for (let i = 0; i < data.length; i++) {
      const voltage = data[i].bankData.voltage;
      if (voltage !== null && !isNaN(voltage)) {
        // 检查是否超出正常范围的扩展阈值
        if (voltage < normalRange[0] - extendedThreshold || voltage > normalRange[1] + extendedThreshold) {
          anomalies.push({
            type: 'voltage_outlier',
            severity: this.determineSeverityByRange(voltage, normalRange),
            timestamp: data[i].timestamp,
            bankId: 'bank',
            value: voltage,
            expectedRange: normalRange,
            message: `电压异常: ${voltage}V, 超出正常范围 [${normalRange[0]}, ${normalRange[1]}]V`
          });
        }
      }
    }
  }

  /**
   * 检测温度异常
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectTemperatureAnomalies(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    const temperatures = data.map(dp => dp.bankData.temperature).filter(t => t !== null && !isNaN(t));
    if (temperatures.length === 0) return;

    const { mean, stdDev } = this.calculateStatistics(temperatures);
    const threshold = 2 * stdDev;

    for (let i = 0; i < data.length; i++) {
      const temperature = data[i].bankData.temperature;
      if (temperature !== null && !isNaN(temperature)) {
        const deviation = Math.abs(temperature - mean);
        if (deviation > threshold) {
          anomalies.push({
            type: 'temperature_outlier',
            severity: this.determineSeverity(deviation, threshold),
            timestamp: data[i].timestamp,
            bankId: 'bank',
            value: temperature,
            expectedRange: [mean - threshold, mean + threshold],
            message: `温度异常: ${temperature}°C, 偏离均值 ${deviation.toFixed(2)}°C`
          });
        }
      }
    }
  }

  /**
   * 检测SOC异常
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectSocAnomalies(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    for (let i = 0; i < data.length; i++) {
      const soc = data[i].bankData.soc;
      if (soc !== null && !isNaN(soc)) {
        if (soc < 0 || soc > 100) {
          anomalies.push({
            type: 'soc_outlier',
            severity: 'high',
            timestamp: data[i].timestamp,
            bankId: 'bank',
            value: soc,
            expectedRange: [0, 100],
            message: `SOC值超出有效范围: ${soc}%`
          });
        }
      }
    }
  }

  /**
   * 检测SOH异常
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectSohAnomalies(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    for (let i = 0; i < data.length; i++) {
      const soh = data[i].bankData.soh;
      if (soh !== null && !isNaN(soh)) {
        if (soh < 0 || soh > 100) {
          anomalies.push({
            type: 'soc_outlier', // 使用相同类型
            severity: 'high',
            timestamp: data[i].timestamp,
            bankId: 'bank',
            value: soh,
            expectedRange: [0, 100],
            message: `SOH值超出有效范围: ${soh}%`
          });
        }
      }
    }
  }

  /**
   * 检测缺失数据
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectMissingData(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    for (let i = 0; i < data.length; i++) {
      const dataPoint = data[i];
      const missingFields = [];

      if (dataPoint.bankData.voltage === null || isNaN(dataPoint.bankData.voltage)) {
        missingFields.push('voltage');
      }
      if (dataPoint.bankData.current === null || isNaN(dataPoint.bankData.current)) {
        missingFields.push('current');
      }
      if (dataPoint.bankData.soc === null || isNaN(dataPoint.bankData.soc)) {
        missingFields.push('soc');
      }
      if (dataPoint.bankData.soh === null || isNaN(dataPoint.bankData.soh)) {
        missingFields.push('soh');
      }

      if (missingFields.length > 0) {
        anomalies.push({
          type: 'missing_data',
          severity: missingFields.length > 2 ? 'high' : 'medium',
          timestamp: dataPoint.timestamp,
          bankId: 'bank',
          value: null,
          message: `缺失数据字段: ${missingFields.join(', ')}`
        });
      }
    }
  }

  /**
   * 检测时间间隙
   * @param data 时间序列数据点数组
   * @param anomalies 异常数组
   */
  private detectTimeGaps(data: TimeSeriesPoint[], anomalies: Anomaly[]): void {
    if (data.length < 2) return;

    for (let i = 1; i < data.length; i++) {
      const currentTime = data[i].timestamp.getTime();
      const previousTime = data[i-1].timestamp.getTime();
      const timeDiff = currentTime - previousTime;

      // 超过2小时认为有时间间隙
      if (timeDiff > 2 * 60 * 60 * 1000) {
        anomalies.push({
          type: 'time_gap',
          severity: timeDiff > 24 * 60 * 60 * 1000 ? 'high' : 'medium',
          timestamp: data[i].timestamp,
          bankId: 'bank',
          value: timeDiff,
          message: `时间间隙: ${Math.round(timeDiff / (60 * 60 * 1000))} 小时`
        });
      }
    }
  }

  /**
   * 计算统计信息
   * @param values 数值数组
   * @returns 统计信息
   */
  private calculateStatistics(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  /**
   * 根据范围确定异常严重程度
   * @param value 数值
   * @param normalRange 正常范围
   * @returns 严重程度
   */
  private determineSeverityByRange(value: number, normalRange: [number, number]): AnomalySeverity {
    const rangeSize = normalRange[1] - normalRange[0];
    const deviation = Math.min(
      Math.abs(value - normalRange[0]),
      Math.abs(value - normalRange[1])
    );
    
    const ratio = deviation / rangeSize;
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1) return 'medium';
    return 'low';
  }

  /**
   * 确定异常严重程度
   * @param deviation 偏差值
   * @param threshold 阈值
   * @returns 严重程度
   */
  private determineSeverity(deviation: number, threshold: number): AnomalySeverity {
    const ratio = deviation / threshold;
    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  /**
   * 计算严重程度分布
   * @param anomalies 异常数组
   * @returns 严重程度分布
   */
  private calculateSeverityDistribution(anomalies: Anomaly[]): Record<AnomalySeverity, number> {
    const distribution: Record<AnomalySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    for (const anomaly of anomalies) {
      distribution[anomaly.severity]++;
    }

    return distribution;
  }

  /**
   * 计算准确性
   * @param dataPoints 数据点数组
   * @param anomalyReport 异常报告
   * @returns 准确性分数 (0-1)
   */
  private calculateAccuracy(dataPoints: TimeSeriesPoint[], anomalyReport: AnomalyReport): number {
    if (dataPoints.length === 0) return 1.0;
    
    const anomalyCount = anomalyReport.anomalies.length;
    return Math.max(0, 1 - (anomalyCount / dataPoints.length));
  }

  /**
   * 计算及时性
   * @param data 标准化数据
   * @returns 及时性分数 (0-1)
   */
  private calculateTimeliness(data: StandardBatteryData): number {
    let totalGaps = 0;
    let totalIntervals = 0;

    for (const bank of data.banks) {
      if (bank.dataPoints.length < 2) continue;

      for (let i = 1; i < bank.dataPoints.length; i++) {
        const timeDiff = bank.dataPoints[i].timestamp.getTime() - bank.dataPoints[i-1].timestamp.getTime();
        totalIntervals++;
        
        // 超过1小时认为有间隙
        if (timeDiff > 60 * 60 * 1000) {
          totalGaps++;
        }
      }
    }

    return totalIntervals > 0 ? Math.max(0, 1 - (totalGaps / totalIntervals)) : 1.0;
  }

  /**
   * 生成建议
   * @param completeness 完整性分数
   * @param accuracy 准确性分数
   * @param consistency 一致性分数
   * @param timeliness 及时性分数
   * @param anomalyReport 异常报告
   * @returns 建议数组
   */
  private generateRecommendations(
    completeness: number,
    accuracy: number,
    consistency: number,
    timeliness: number,
    anomalyReport: AnomalyReport
  ): string[] {
    const recommendations: string[] = [];

    if (completeness < 0.8) {
      recommendations.push('数据完整性较低，建议检查数据采集系统是否正常工作');
    }

    if (accuracy < 0.9) {
      recommendations.push('检测到较多异常值，建议检查传感器校准和数据传输质量');
    }

    if (consistency < 0.8) {
      recommendations.push('数据一致性较低，建议检查数据格式和范围设置');
    }

    if (timeliness < 0.9) {
      recommendations.push('存在时间间隙，建议检查数据采集频率和网络连接稳定性');
    }

    if (anomalyReport.summary.severityDistribution.critical > 0) {
      recommendations.push('发现严重异常，建议立即检查相关设备状态');
    }

    if (anomalyReport.summary.severityDistribution.high > 5) {
      recommendations.push('高严重程度异常较多，建议进行设备维护检查');
    }

    if (recommendations.length === 0) {
      recommendations.push('数据质量良好，建议继续保持当前的数据采集和处理流程');
    }

    return recommendations;
  }

  /**
   * 检查数值是否在范围内
   * @param value 数值
   * @param range 范围
   * @returns 是否在范围内
   */
  private isInRange(value: number, range: [number, number]): boolean {
    if (value === null || value === undefined || isNaN(value)) return false;
    return value >= range[0] && value <= range[1];
  }
}
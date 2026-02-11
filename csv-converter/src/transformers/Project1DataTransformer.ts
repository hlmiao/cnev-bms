import { Project1RawData, StandardBatteryData, BankTimeSeries, TimeSeriesPoint, BankStatistics, ProjectSummary } from '../types/index.js';
import { parseTimeString, calculateStatistics } from '../utils/helpers.js';
import { DEFAULT_CONFIG } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * 项目1数据转换器
 * 负责将项目1原始数据转换为标准电池数据格式
 */
export class Project1DataTransformer {
  /**
   * 转换项目1数据为标准格式
   * @param rawData 项目1原始数据
   * @returns 标准电池数据
   */
  async transformProject1Data(rawData: Project1RawData): Promise<StandardBatteryData> {
    logger.info(`开始转换项目1数据: ${rawData.metadata.systemId}/${rawData.metadata.bankId}`);

    try {
      // 转换时间序列数据点
      const dataPoints = this.transformTimeSeriesPoints(rawData);
      
      // 计算Bank统计信息
      const statistics = this.calculateBankStatistics(dataPoints);
      
      // 创建Bank时间序列
      const bankTimeSeries: BankTimeSeries = {
        bankId: rawData.metadata.bankId,
        dataPoints,
        statistics
      };

      // 生成项目摘要
      const summary = this.generateProjectSummary(rawData, dataPoints);

      const result: StandardBatteryData = {
        projectId: `project1-${rawData.metadata.systemId}-${rawData.metadata.bankId}`,
        projectType: 'project1',
        systemId: rawData.metadata.systemId,
        timeRange: rawData.metadata.timeRange,
        banks: [bankTimeSeries],
        summary
      };

      logger.info(`项目1数据转换完成: ${dataPoints.length} 个数据点`);
      return result;

    } catch (error) {
      logger.error(`项目1数据转换失败: ${error}`);
      throw error;
    }
  }

  /**
   * 转换时间序列数据点
   * @param rawData 原始数据
   * @returns 时间序列数据点数组
   */
  private transformTimeSeriesPoints(rawData: Project1RawData): TimeSeriesPoint[] {
    const dataPoints: TimeSeriesPoint[] = [];

    for (const row of rawData.rows) {
      try {
        // 解析时间戳
        const timestamp = parseTimeString(row.时间, DEFAULT_CONFIG.project1.timeFormat);

        // 计算平均温度
        const validTemperatures = row.temperatures.filter((t): t is number => t !== null && !isNaN(t));
        const avgTemperature = validTemperatures.length > 0 
          ? validTemperatures.reduce((sum, t) => sum + t, 0) / validTemperatures.length 
          : 0;

        // 计算功率 (P = V * I)
        const power = (row.总电压 && row.总电流) ? row.总电压 * row.总电流 : 0;

        const dataPoint: TimeSeriesPoint = {
          timestamp,
          bankData: {
            voltage: row.总电压 || 0,
            current: row.总电流 || 0,
            soc: row.SOC || 0,
            soh: row.SOH || 0,
            power,
            temperature: avgTemperature
          },
          cellData: {
            voltages: row.voltages,
            temperatures: row.temperatures,
            socs: row.socs,
            sohs: row.sohs
          }
        };

        dataPoints.push(dataPoint);

      } catch (error) {
        logger.warn(`跳过无效时间序列数据点: ${error}`);
      }
    }

    // 按时间戳排序
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return dataPoints;
  }

  /**
   * 计算Bank统计信息
   * @param dataPoints 时间序列数据点
   * @returns Bank统计信息
   */
  private calculateBankStatistics(dataPoints: TimeSeriesPoint[]): BankStatistics {
    if (dataPoints.length === 0) {
      return {
        avgVoltage: 0,
        avgCurrent: 0,
        avgSoc: 0,
        avgSoh: 0,
        maxVoltage: 0,
        minVoltage: 0,
        maxTemperature: 0,
        minTemperature: 0
      };
    }

    // 提取所有数值
    const voltages = dataPoints.map(dp => dp.bankData.voltage).filter(v => v !== null && !isNaN(v));
    const currents = dataPoints.map(dp => dp.bankData.current).filter(c => c !== null && !isNaN(c));
    const socs = dataPoints.map(dp => dp.bankData.soc).filter(s => s !== null && !isNaN(s));
    const sohs = dataPoints.map(dp => dp.bankData.soh).filter(s => s !== null && !isNaN(s));
    const temperatures = dataPoints.map(dp => dp.bankData.temperature).filter(t => t !== null && !isNaN(t));

    // 计算统计值
    const voltageStats = calculateStatistics(voltages);
    const currentStats = calculateStatistics(currents);
    const socStats = calculateStatistics(socs);
    const sohStats = calculateStatistics(sohs);
    const temperatureStats = calculateStatistics(temperatures);

    return {
      avgVoltage: voltageStats.avg,
      avgCurrent: currentStats.avg,
      avgSoc: socStats.avg,
      avgSoh: sohStats.avg,
      maxVoltage: voltageStats.max,
      minVoltage: voltageStats.min,
      maxTemperature: temperatureStats.max,
      minTemperature: temperatureStats.min
    };
  }

  /**
   * 生成项目摘要
   * @param rawData 原始数据
   * @param dataPoints 转换后的数据点
   * @returns 项目摘要
   */
  private generateProjectSummary(rawData: Project1RawData, dataPoints: TimeSeriesPoint[]): ProjectSummary {
    const totalRecords = rawData.rows.length;
    const validRecords = dataPoints.length;
    const errorRecords = totalRecords - validRecords;

    // 计算数据质量指标
    const completeness = totalRecords > 0 ? validRecords / totalRecords : 0;
    
    // 计算准确性 - 基于非空值的比例
    let totalFields = 0;
    let validFields = 0;
    
    for (const dataPoint of dataPoints) {
      // 检查Bank数据字段
      const bankFields = [
        dataPoint.bankData.voltage,
        dataPoint.bankData.current,
        dataPoint.bankData.soc,
        dataPoint.bankData.soh
      ];
      
      totalFields += bankFields.length;
      validFields += bankFields.filter(field => field !== null && field !== 0 && !isNaN(field)).length;
      
      // 检查单体数据字段
      const cellFields = [
        ...dataPoint.cellData.voltages,
        ...dataPoint.cellData.temperatures,
        ...dataPoint.cellData.socs,
        ...dataPoint.cellData.sohs
      ];
      
      totalFields += cellFields.length;
      validFields += cellFields.filter(field => field !== null && !isNaN(field as number)).length;
    }
    
    const accuracy = totalFields > 0 ? validFields / totalFields : 0;
    
    // 一致性基于时间序列的连续性
    let consistency = 1.0;
    if (dataPoints.length > 1) {
      let timeGaps = 0;
      for (let i = 1; i < dataPoints.length; i++) {
        const timeDiff = dataPoints[i].timestamp.getTime() - dataPoints[i-1].timestamp.getTime();
        // 如果时间间隔超过1小时，认为有间隙
        if (timeDiff > 3600000) {
          timeGaps++;
        }
      }
      consistency = Math.max(0, 1 - (timeGaps / (dataPoints.length - 1)));
    }

    return {
      totalRecords,
      validRecords,
      errorRecords,
      timeRange: rawData.metadata.timeRange,
      dataQuality: {
        completeness: Math.round(completeness * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        consistency: Math.round(consistency * 100) / 100
      }
    };
  }

  /**
   * 验证转换结果
   * @param standardData 标准数据
   * @returns 验证是否通过
   */
  validateTransformResult(standardData: StandardBatteryData): boolean {
    try {
      // 检查基本结构
      if (!standardData.projectId || !standardData.projectType || !standardData.systemId) {
        logger.error('转换结果缺少必需字段');
        return false;
      }

      // 检查项目类型
      if (standardData.projectType !== 'project1') {
        logger.error('项目类型不匹配');
        return false;
      }

      // 检查Bank数据
      if (!standardData.banks || standardData.banks.length === 0) {
        logger.error('转换结果缺少Bank数据');
        return false;
      }

      // 检查时间序列数据
      for (const bank of standardData.banks) {
        if (!bank.dataPoints || bank.dataPoints.length === 0) {
          logger.error(`Bank ${bank.bankId} 缺少时间序列数据`);
          return false;
        }

        // 检查时间戳排序
        for (let i = 1; i < bank.dataPoints.length; i++) {
          if (bank.dataPoints[i].timestamp <= bank.dataPoints[i-1].timestamp) {
            logger.error(`Bank ${bank.bankId} 时间序列未正确排序`);
            return false;
          }
        }
      }

      logger.info('转换结果验证通过');
      return true;

    } catch (error) {
      logger.error(`转换结果验证失败: ${error}`);
      return false;
    }
  }
}
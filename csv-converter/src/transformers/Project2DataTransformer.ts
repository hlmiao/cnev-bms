import { Project2RawData, StandardBatteryData, BankTimeSeries, TimeSeriesPoint, BankStatistics, ProjectSummary, DataType } from '../types/index.js';
import { parseTimeString, calculateStatistics } from '../utils/helpers.js';
import { DEFAULT_CONFIG } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * 项目2数据转换器
 * 负责将项目2原始数据转换为标准电池数据格式
 * 处理多维时序数据转换，实现数据类型同步和对齐
 */
export class Project2DataTransformer {
  /**
   * 转换项目2数据为标准格式
   * @param rawDataArray 项目2原始数据数组（包含不同数据类型的文件）
   * @returns 标准电池数据
   */
  async transformProject2Data(rawDataArray: Project2RawData[]): Promise<StandardBatteryData> {
    if (rawDataArray.length === 0) {
      throw new Error('项目2原始数据数组不能为空');
    }

    const groupId = rawDataArray[0].metadata.groupId;
    logger.info(`开始转换项目2数据: ${groupId}`);

    try {
      // 按数据类型分组原始数据
      const dataByType = this.groupDataByType(rawDataArray);
      
      // 同步和对齐不同数据类型的时间戳
      const alignedData = this.alignTimeSeriesData(dataByType);
      
      // 转换为时间序列数据点
      const dataPoints = this.transformToTimeSeriesPoints(alignedData);
      
      // 计算统计信息
      const statistics = this.calculateBankStatistics(dataPoints);
      
      // 创建Bank时间序列（项目2中每个group作为一个Bank）
      const bankTimeSeries: BankTimeSeries = {
        bankId: `${groupId}-combined`,
        dataPoints,
        statistics
      };

      // 生成项目摘要
      const summary = this.generateProjectSummary(rawDataArray, dataPoints);

      // 计算时间范围
      const timeRange = this.calculateTimeRange(dataPoints);

      const result: StandardBatteryData = {
        projectId: `project2-${groupId}`,
        projectType: 'project2',
        groupId,
        timeRange,
        banks: [bankTimeSeries],
        summary
      };

      logger.info(`项目2数据转换完成: ${dataPoints.length} 个数据点`);
      return result;

    } catch (error) {
      logger.error(`项目2数据转换失败: ${error}`);
      throw error;
    }
  }

  /**
   * 按数据类型分组原始数据
   * @param rawDataArray 原始数据数组
   * @returns 按数据类型分组的数据
   */
  private groupDataByType(rawDataArray: Project2RawData[]): Map<DataType, Project2RawData[]> {
    const dataByType = new Map<DataType, Project2RawData[]>();

    for (const rawData of rawDataArray) {
      const dataType = rawData.metadata.dataType;
      if (!dataByType.has(dataType)) {
        dataByType.set(dataType, []);
      }
      dataByType.get(dataType)!.push(rawData);
    }

    logger.info(`数据按类型分组完成: ${Array.from(dataByType.keys()).join(', ')}`);
    return dataByType;
  }

  /**
   * 建立多维索引结构 (group-dataType-date)
   * @param rawDataArray 原始数据数组
   * @returns 多维索引结构
   * @description 此方法实现需求2.4中的多维索引结构建立功能
   */
  buildMultiDimensionalIndex(rawDataArray: Project2RawData[]): Record<string, any> {
    const index: Record<string, Record<string, Record<string, any>>> = {};

    for (const rawData of rawDataArray) {
      const { groupId, dataType, date } = rawData.metadata;
      
      if (!index[groupId]) {
        index[groupId] = {};
      }
      
      if (!index[groupId][dataType]) {
        index[groupId][dataType] = {};
      }
      
      index[groupId][dataType][date] = {
        recordCount: rawData.metadata.recordCount,
        headers: rawData.headers,
        processed: true,
        timestamp: new Date()
      };
    }

    logger.info(`多维索引结构建立完成: ${Object.keys(index).length} 个组`);
    return index;
  }

  /**
   * 同步和对齐不同数据类型的时间戳
   * @param dataByType 按数据类型分组的数据
   * @returns 对齐后的数据
   */
  private alignTimeSeriesData(dataByType: Map<DataType, Project2RawData[]>): Map<string, Map<DataType, Project2RawData>> {
    const alignedData = new Map<string, Map<DataType, Project2RawData>>();

    // 收集所有时间戳
    const allTimestamps = new Set<string>();
    
    for (const [, rawDataArray] of dataByType) {
      for (const rawData of rawDataArray) {
        for (const row of rawData.rows) {
          // 标准化时间戳格式
          const normalizedTimestamp = this.normalizeTimestamp(row.datetime);
          allTimestamps.add(normalizedTimestamp);
        }
      }
    }

    // 为每个时间戳创建对齐的数据结构
    for (const timestamp of allTimestamps) {
      const timestampData = new Map<DataType, Project2RawData>();
      
      for (const [dataType, rawDataArray] of dataByType) {
        // 查找该时间戳对应的数据
        for (const rawData of rawDataArray) {
          const matchingRows = rawData.rows.filter(row => 
            this.normalizeTimestamp(row.datetime) === timestamp
          );
          
          if (matchingRows.length > 0) {
            // 创建该时间戳的数据快照
            const alignedRawData: Project2RawData = {
              headers: rawData.headers,
              rows: matchingRows,
              metadata: rawData.metadata
            };
            timestampData.set(dataType, alignedRawData);
          }
        }
      }
      
      if (timestampData.size > 0) {
        alignedData.set(timestamp, timestampData);
      }
    }

    logger.info(`时间序列对齐完成: ${alignedData.size} 个时间点`);
    return alignedData;
  }

  /**
   * 转换为时间序列数据点
   * @param alignedData 对齐后的数据
   * @returns 时间序列数据点数组
   */
  private transformToTimeSeriesPoints(alignedData: Map<string, Map<DataType, Project2RawData>>): TimeSeriesPoint[] {
    const dataPoints: TimeSeriesPoint[] = [];

    for (const [timestamp, typeData] of alignedData) {
      try {
        const parsedTimestamp = parseTimeString(timestamp, DEFAULT_CONFIG.project2.timeFormat);
        
        // 初始化数据点
        const dataPoint: TimeSeriesPoint = {
          timestamp: parsedTimestamp,
          bankData: {
            voltage: 0,
            current: 0,
            soc: 0,
            soh: 0,
            power: 0,
            temperature: 0
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        };

        // 处理不同数据类型
        for (const [dataType, rawData] of typeData) {
          this.processDataTypeForPoint(dataPoint, dataType, rawData);
        }

        // 计算功率
        dataPoint.bankData.power = dataPoint.bankData.voltage * dataPoint.bankData.current;

        dataPoints.push(dataPoint);

      } catch (error) {
        logger.warn(`跳过无效时间序列数据点 ${timestamp}: ${error}`);
      }
    }

    // 按时间戳排序
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return dataPoints;
  }

  /**
   * 处理特定数据类型的数据点
   * @param dataPoint 数据点
   * @param dataType 数据类型
   * @param rawData 原始数据
   */
  private processDataTypeForPoint(dataPoint: TimeSeriesPoint, dataType: DataType, rawData: Project2RawData): void {
    if (rawData.rows.length === 0) return;

    const row = rawData.rows[0]; // 取第一行数据（已经按时间戳过滤）

    switch (dataType) {
      case 'voltage':
        dataPoint.bankData.voltage = row.bankVol || 0;
        dataPoint.bankData.current = row.bankCur || 0;
        dataPoint.cellData.voltages = row.values.slice(0, DEFAULT_CONFIG.project2.cellCount);
        break;

      case 'temperature':
        // 计算平均温度
        const validTemps = row.values.filter((t): t is number => t !== null && !isNaN(t));
        dataPoint.bankData.temperature = validTemps.length > 0 
          ? validTemps.reduce((sum, t) => sum + t, 0) / validTemps.length 
          : 0;
        dataPoint.cellData.temperatures = row.values.slice(0, DEFAULT_CONFIG.project2.cellCount);
        break;

      case 'soc':
        // 计算平均SOC
        const validSocs = row.values.filter((s): s is number => s !== null && !isNaN(s));
        dataPoint.bankData.soc = validSocs.length > 0 
          ? validSocs.reduce((sum, s) => sum + s, 0) / validSocs.length 
          : 0;
        dataPoint.cellData.socs = row.values.slice(0, DEFAULT_CONFIG.project2.cellCount);
        break;

      case 'state':
        // state数据可能包含SOH信息
        const validStates = row.values.filter((s): s is number => s !== null && !isNaN(s));
        dataPoint.bankData.soh = validStates.length > 0 
          ? validStates.reduce((sum, s) => sum + s, 0) / validStates.length 
          : 0;
        dataPoint.cellData.sohs = row.values.slice(0, DEFAULT_CONFIG.project2.cellCount);
        break;
    }
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
   * @param rawDataArray 原始数据数组
   * @param dataPoints 转换后的数据点
   * @param indexStructure 索引结构
   * @returns 项目摘要
   */
  private generateProjectSummary(
    rawDataArray: Project2RawData[], 
    dataPoints: TimeSeriesPoint[]
  ): ProjectSummary {
    const totalRecords = rawDataArray.reduce((sum, data) => sum + data.rows.length, 0);
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
        dataPoint.bankData.soh,
        dataPoint.bankData.temperature
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
    
    // 一致性基于数据类型的完整性
    const dataTypes = new Set(rawDataArray.map(data => data.metadata.dataType));
    const expectedDataTypes = 4; // soc, state, temperature, voltage
    const consistency = dataTypes.size / expectedDataTypes;

    // 计算时间范围
    const timeRange = this.calculateTimeRange(dataPoints);

    return {
      totalRecords,
      validRecords,
      errorRecords,
      timeRange,
      dataQuality: {
        completeness: Math.round(completeness * 100) / 100,
        accuracy: Math.round(accuracy * 100) / 100,
        consistency: Math.round(consistency * 100) / 100
      }
    };
  }

  /**
   * 计算时间范围
   * @param dataPoints 数据点数组
   * @returns 时间范围
   */
  private calculateTimeRange(dataPoints: TimeSeriesPoint[]): { start: Date; end: Date } {
    if (dataPoints.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const timestamps = dataPoints.map(dp => dp.timestamp);
    return {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };
  }

  /**
   * 标准化时间戳格式
   * @param timestamp 原始时间戳
   * @returns 标准化时间戳
   */
  private normalizeTimestamp(timestamp: string): string {
    try {
      const date = parseTimeString(timestamp, DEFAULT_CONFIG.project2.timeFormat);
      return date.toISOString();
    } catch (error) {
      logger.warn(`时间戳标准化失败: ${timestamp}`);
      return timestamp;
    }
  }

  /**
   * 验证转换结果
   * @param standardData 标准数据
   * @returns 验证是否通过
   */
  validateTransformResult(standardData: StandardBatteryData): boolean {
    try {
      // 检查基本结构
      if (!standardData.projectId || !standardData.projectType || !standardData.groupId) {
        logger.error('转换结果缺少必需字段');
        return false;
      }

      // 检查项目类型
      if (standardData.projectType !== 'project2') {
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
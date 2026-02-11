import { Project1RawData, Project2RawData, StandardBatteryData } from '../types/index.js';

/**
 * 数据转换器接口
 * 负责将原始数据转换为标准格式
 */
export interface DataTransformer {
  /**
   * 转换项目1数据
   * @param rawData 原始数据
   * @returns 标准化数据
   */
  transformProject1Data(rawData: Project1RawData): Promise<StandardBatteryData>;

  /**
   * 转换项目2数据
   * @param rawDataArray 原始数据数组（多个数据类型）
   * @returns 标准化数据
   */
  transformProject2Data(rawDataArray: Project2RawData[]): Promise<StandardBatteryData>;

  /**
   * 合并时间序列数据
   * @param datasets 数据集数组
   * @returns 合并后的数据
   */
  mergeTimeSeriesData(datasets: StandardBatteryData[]): Promise<StandardBatteryData>;

  /**
   * 验证转换后的数据
   * @param data 标准化数据
   * @returns 验证结果
   */
  validateTransformedData(data: StandardBatteryData): boolean;
}
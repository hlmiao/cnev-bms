import { Project1RawData, Project2RawData, DataType } from '../types/index.js';

/**
 * 文件解析器接口
 * 负责解析不同格式的CSV文件
 */
export interface FileParser {
  /**
   * 解析项目1的CSV文件
   * @param filePath 文件路径
   * @returns 解析后的原始数据
   */
  parseProject1File(filePath: string): Promise<Project1RawData>;

  /**
   * 解析项目2的CSV文件
   * @param filePath 文件路径
   * @param dataType 数据类型
   * @returns 解析后的原始数据
   */
  parseProject2File(filePath: string, dataType: DataType): Promise<Project2RawData>;

  /**
   * 验证CSV文件格式
   * @param filePath 文件路径
   * @returns 是否有效
   */
  validateCsvFormat(filePath: string): Promise<boolean>;
}
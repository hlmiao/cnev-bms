import { FileParser } from '../interfaces/FileParser.js';
import { Project1RawData, Project2RawData, DataType } from '../types/index.js';
import { Project1Parser } from './Project1Parser.js';
import { Project2Parser } from './Project2Parser.js';
import { logger } from '../utils/logger.js';

/**
 * 文件解析器实现
 * 负责协调不同类型的CSV文件解析
 */
export class FileParserImpl implements FileParser {
  private project1Parser: Project1Parser;
  private project2Parser: Project2Parser;

  constructor() {
    this.project1Parser = new Project1Parser();
    this.project2Parser = new Project2Parser();
  }

  /**
   * 解析项目1的CSV文件
   * @param filePath 文件路径
   * @returns 解析后的原始数据
   */
  async parseProject1File(filePath: string): Promise<Project1RawData> {
    logger.info(`解析项目1文件: ${filePath}`);
    return await this.project1Parser.parseProject1File(filePath);
  }

  /**
   * 解析项目2的CSV文件
   * @param filePath 文件路径
   * @param dataType 数据类型
   * @returns 解析后的原始数据
   */
  async parseProject2File(filePath: string, dataType: DataType): Promise<Project2RawData> {
    logger.info(`解析项目2文件: ${filePath}, 数据类型: ${dataType}`);
    return await this.project2Parser.parseProject2File(filePath, dataType);
  }

  /**
   * 验证CSV文件格式
   * @param filePath 文件路径
   * @returns 是否有效
   */
  async validateCsvFormat(filePath: string): Promise<boolean> {
    logger.info(`验证CSV文件格式: ${filePath}`);
    
    // 根据文件路径判断项目类型
    if (this.isProject1File(filePath)) {
      return await this.project1Parser.validateCsvFormat(filePath);
    } else if (this.isProject2File(filePath)) {
      const dataType = this.extractDataTypeFromPath(filePath);
      return await this.project2Parser.validateProject2CsvFormat(filePath, dataType);
    } else {
      logger.warn('无法识别的文件类型');
      return false;
    }
  }

  /**
   * 判断是否为项目1文件
   * @param filePath 文件路径
   * @returns 是否为项目1文件
   */
  private isProject1File(filePath: string): boolean {
    // 检查路径中是否包含项目1的系统标识
    return /[\/\\](2#|14#|15#)[\/\\]/.test(filePath);
  }

  /**
   * 判断是否为项目2文件
   * @param filePath 文件路径
   * @returns 是否为项目2文件
   */
  private isProject2File(filePath: string): boolean {
    // 检查路径中是否包含项目2的组标识
    return /[\/\\]group[1-4][\/\\]/.test(filePath);
  }

  /**
   * 从文件路径提取数据类型
   * @param filePath 文件路径
   * @returns 数据类型
   */
  private extractDataTypeFromPath(filePath: string): DataType {
    if (filePath.includes('/soc/') || filePath.includes('\\soc\\')) {
      return 'soc';
    } else if (filePath.includes('/voltage/') || filePath.includes('\\voltage\\')) {
      return 'voltage';
    } else if (filePath.includes('/temperature/') || filePath.includes('\\temperature\\')) {
      return 'temperature';
    } else if (filePath.includes('/state/') || filePath.includes('\\state\\')) {
      return 'state';
    } else {
      // 默认返回voltage类型
      return 'voltage';
    }
  }
}
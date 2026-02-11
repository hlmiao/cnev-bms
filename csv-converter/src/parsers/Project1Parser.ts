import Papa from 'papaparse';
import { promises as fs } from 'fs';
import { Project1RawData, Project1Row } from '../types/index.js';
import { DEFAULT_CONFIG } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { parseTimeString, safeParseFloat } from '../utils/helpers.js';

/**
 * 项目1 CSV解析器
 * 负责解析项目1的CSV文件，处理中文标题和单体数据
 */
export class Project1Parser {
  /**
   * 解析项目1的CSV文件
   * @param filePath 文件路径
   * @returns 解析后的原始数据
   */
  async parseProject1File(filePath: string): Promise<Project1RawData> {
    logger.info(`开始解析项目1文件: ${filePath}`);

    try {
      // 读取文件内容
      const fileContent = await fs.readFile(filePath, { encoding: DEFAULT_CONFIG.project1.encoding as BufferEncoding });
      
      // 使用Papa Parse解析CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // 清理标题中的空白字符
          return header.trim();
        }
      });

      if (parseResult.errors.length > 0) {
        logger.warn(`CSV解析警告: ${parseResult.errors.map(e => e.message).join(', ')}`);
      }

      const headers = parseResult.meta.fields || [];
      const rawRows = parseResult.data as Record<string, string>[];

      // 提取系统ID和Bank ID
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const systemId = this.extractSystemId(filePath);
      const bankId = this.extractBankId(fileName);

      // 转换数据行
      const rows: Project1Row[] = [];
      let minTime: Date | null = null;
      let maxTime: Date | null = null;

      for (const rawRow of rawRows) {
        try {
          const row = this.transformProject1Row(rawRow, headers);
          rows.push(row);

          // 更新时间范围
          const timestamp = parseTimeString(row.时间, DEFAULT_CONFIG.project1.timeFormat);
          if (!minTime || timestamp < minTime) minTime = timestamp;
          if (!maxTime || timestamp > maxTime) maxTime = timestamp;

        } catch (error) {
          logger.warn(`跳过无效数据行: ${error}`);
        }
      }

      const result: Project1RawData = {
        headers,
        rows,
        metadata: {
          systemId,
          bankId,
          recordCount: rows.length,
          timeRange: {
            start: minTime || new Date(),
            end: maxTime || new Date()
          }
        }
      };

      logger.info(`项目1文件解析完成: ${rows.length} 条记录`);
      return result;

    } catch (error) {
      logger.error(`解析项目1文件失败 ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * 验证CSV文件格式
   * @param filePath 文件路径
   * @returns 是否有效
   */
  async validateCsvFormat(filePath: string): Promise<boolean> {
    try {
      const fileContent = await fs.readFile(filePath, { encoding: DEFAULT_CONFIG.project1.encoding as BufferEncoding });
      const parseResult = Papa.parse(fileContent, {
        header: true,
        preview: 1 // 只解析第一行来检查表头
      });

      const actualHeaders = parseResult.meta.fields || [];
      
      // 检查必需的表头是否存在
      const requiredHeaders = ['时间', '总电压', '总电流', 'SOC', 'SOH'];
      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));
      
      if (missingHeaders.length > 0) {
        logger.warn(`缺少必需的表头: ${missingHeaders.join(', ')}`);
        return false;
      }

      // 检查是否有电压数据列 (V1, V2, ...)
      const voltageHeaders = actualHeaders.filter(header => /^V\d+$/.test(header));
      if (voltageHeaders.length === 0) {
        logger.warn('未找到电压数据列');
        return false;
      }

      logger.info(`CSV格式验证通过: ${actualHeaders.length} 个列`);
      return true;

    } catch (error) {
      logger.error(`CSV格式验证失败: ${error}`);
      return false;
    }
  }

  /**
   * 转换项目1数据行
   * @param rawRow 原始数据行
   * @param headers 表头数组
   * @returns 转换后的数据行
   */
  private transformProject1Row(rawRow: Record<string, string>, headers: string[]): Project1Row {
    // 基础字段映射
    const row: Project1Row = {
      时间: rawRow['时间'] || '',
      总电压: safeParseFloat(rawRow['总电压']),
      总电流: safeParseFloat(rawRow['总电流']),
      SOC: safeParseFloat(rawRow['SOC']),
      SOH: safeParseFloat(rawRow['SOH']),
      voltages: [],
      temperatures: [],
      socs: [],
      sohs: []
    };

    // 提取电压数据 (V1-V400)
    row.voltages = this.extractCellData(rawRow, headers, 'V', DEFAULT_CONFIG.project1.cellCount);
    
    // 提取温度数据 (T1-T400)
    row.temperatures = this.extractCellData(rawRow, headers, 'T', DEFAULT_CONFIG.project1.tempCount);
    
    // 提取SOC数据 (SOC1-SOC400)
    row.socs = this.extractCellData(rawRow, headers, 'SOC', DEFAULT_CONFIG.project1.cellCount);
    
    // 提取SOH数据 (SOH1-SOH400)
    row.sohs = this.extractCellData(rawRow, headers, 'SOH', DEFAULT_CONFIG.project1.cellCount);

    return row;
  }

  /**
   * 提取单体数据
   * @param rawRow 原始数据行
   * @param headers 表头数组
   * @param prefix 字段前缀 (V, T, SOC, SOH)
   * @param maxCount 最大数量
   * @returns 单体数据数组
   */
  private extractCellData(
    rawRow: Record<string, string>, 
    headers: string[], 
    prefix: string, 
    maxCount: number
  ): (number | null)[] {
    const data: (number | null)[] = [];
    
    // 查找匹配的表头
    const matchingHeaders = headers.filter(header => {
      const regex = new RegExp(`^${prefix}\\d+$`);
      return regex.test(header);
    });

    // 按数字顺序排序
    matchingHeaders.sort((a, b) => {
      const numA = parseInt(a.replace(prefix, ''));
      const numB = parseInt(b.replace(prefix, ''));
      return numA - numB;
    });

    // 提取数据，限制最大数量
    for (let i = 0; i < Math.min(matchingHeaders.length, maxCount); i++) {
      const header = matchingHeaders[i];
      const value = rawRow[header];
      data.push(safeParseFloat(value));
    }

    // 如果数据不足，用null填充
    while (data.length < maxCount) {
      data.push(null);
    }

    return data;
  }

  /**
   * 从文件路径提取系统ID
   * @param filePath 文件路径
   * @returns 系统ID
   */
  private extractSystemId(filePath: string): string {
    const pathParts = filePath.split('/');
    
    // 查找系统ID (2#, 14#, 15#)
    for (const part of pathParts) {
      if (/^\d+#$/.test(part)) {
        return part;
      }
    }
    
    return 'unknown';
  }

  /**
   * 从文件名提取Bank ID
   * @param fileName 文件名
   * @returns Bank ID
   */
  private extractBankId(fileName: string): string {
    const match = fileName.match(/Bank(\d+)/);
    return match ? `Bank${match[1].padStart(2, '0')}` : 'unknown';
  }
}
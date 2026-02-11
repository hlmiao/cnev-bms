import Papa from 'papaparse';
import { promises as fs } from 'fs';
import { Project2RawData, Project2Row, DataType } from '../types/index.js';
import { DEFAULT_CONFIG } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { safeParseFloat } from '../utils/helpers.js';

/**
 * 项目2 CSV解析器
 * 负责解析项目2的CSV文件，处理不同数据类型(soc, state, temperature, voltage)
 */
export class Project2Parser {
  /**
   * 解析项目2的CSV文件
   * @param filePath 文件路径
   * @param dataType 数据类型
   * @returns 解析后的原始数据
   */
  async parseProject2File(filePath: string, dataType: DataType): Promise<Project2RawData> {
    logger.info(`开始解析项目2文件: ${filePath}, 数据类型: ${dataType}`);

    try {
      // 读取文件内容
      const fileContent = await fs.readFile(filePath, { encoding: DEFAULT_CONFIG.project2.encoding as BufferEncoding });
      
      // 使用Papa Parse解析CSV
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // 清理标题中的空白字符和特殊字符
          return header.trim().replace(/\s+/g, '');
        }
      });

      if (parseResult.errors.length > 0) {
        logger.warn(`CSV解析警告: ${parseResult.errors.map(e => e.message).join(', ')}`);
      }

      const headers = parseResult.meta.fields || [];
      const rawRows = parseResult.data as Record<string, string>[];

      // 提取组ID和日期
      const groupId = this.extractGroupId(filePath);
      const date = this.extractDate(filePath);

      // 转换数据行
      const rows: Project2Row[] = [];

      for (const rawRow of rawRows) {
        try {
          const row = this.transformProject2Row(rawRow, headers, dataType);
          rows.push(row);
        } catch (error) {
          logger.warn(`跳过无效数据行: ${error}`);
        }
      }

      const result: Project2RawData = {
        headers,
        rows,
        metadata: {
          groupId,
          dataType,
          date,
          recordCount: rows.length
        }
      };

      logger.info(`项目2文件解析完成: ${rows.length} 条记录`);
      return result;

    } catch (error) {
      logger.error(`解析项目2文件失败 ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * 验证项目2 CSV文件格式
   * @param filePath 文件路径
   * @param dataType 数据类型
   * @returns 是否有效
   */
  async validateProject2CsvFormat(filePath: string, dataType: DataType): Promise<boolean> {
    try {
      const fileContent = await fs.readFile(filePath, { encoding: DEFAULT_CONFIG.project2.encoding as BufferEncoding });
      const parseResult = Papa.parse(fileContent, {
        header: true,
        preview: 1 // 只解析第一行来检查表头
      });

      const actualHeaders = parseResult.meta.fields || [];
      
      // 检查必需的基础表头
      const requiredBaseHeaders = ['devInstCode', 'groupNo', 'datetime'];
      const missingBaseHeaders = requiredBaseHeaders.filter(header => 
        !actualHeaders.some(h => h.trim().replace(/\s+/g, '') === header)
      );
      
      if (missingBaseHeaders.length > 0) {
        logger.warn(`缺少必需的基础表头: ${missingBaseHeaders.join(', ')}`);
        return false;
      }

      // 根据数据类型检查特定表头
      const isValidDataType = this.validateDataTypeHeaders(actualHeaders, dataType);
      if (!isValidDataType) {
        logger.warn(`数据类型 ${dataType} 的表头验证失败`);
        return false;
      }

      logger.info(`项目2 CSV格式验证通过: ${actualHeaders.length} 个列, 数据类型: ${dataType}`);
      return true;

    } catch (error) {
      logger.error(`项目2 CSV格式验证失败: ${error}`);
      return false;
    }
  }

  /**
   * 转换项目2数据行
   * @param rawRow 原始数据行
   * @param headers 表头数组
   * @param dataType 数据类型
   * @returns 转换后的数据行
   */
  private transformProject2Row(rawRow: Record<string, string>, headers: string[], dataType: DataType): Project2Row {
    // 基础字段映射，清理字符串值中的引号
    const row: Project2Row = {
      devInstCode: this.cleanStringValue(rawRow['devInstCode'] || ''),
      groupNo: parseInt(rawRow['groupNo'] || '0'),
      datetime: this.cleanStringValue(rawRow['datetime'] || ''),
      values: []
    };

    // 根据数据类型添加特定字段
    if (dataType === 'voltage') {
      row.bankVol = safeParseFloat(rawRow['BankVol']);
      row.bankCur = safeParseFloat(rawRow['BankCur']);
      // 提取vol1-vol216数据
      row.values = this.extractValueData(rawRow, headers, 'vol', DEFAULT_CONFIG.project2.cellCount);
    } else if (dataType === 'soc') {
      // 提取soc1-soc216数据
      row.values = this.extractValueData(rawRow, headers, 'soc', DEFAULT_CONFIG.project2.cellCount);
    } else if (dataType === 'temperature') {
      // 提取temp1-temp90数据 (温度传感器数量通常少于电池单体数量)
      row.values = this.extractValueData(rawRow, headers, 'temp', 90);
    } else if (dataType === 'state') {
      row.bankVol = safeParseFloat(rawRow['BankVol']);
      row.bankCur = safeParseFloat(rawRow['BankCur']);
      // state文件包含汇总状态信息，不需要提取values数组
      row.values = [];
    }

    return row;
  }

  /**
   * 提取数值数据
   * @param rawRow 原始数据行
   * @param headers 表头数组
   * @param prefix 字段前缀 (vol, soc, temp)
   * @param maxCount 最大数量
   * @returns 数值数据数组
   */
  private extractValueData(
    rawRow: Record<string, string>, 
    headers: string[], 
    prefix: string, 
    maxCount: number
  ): (number | null)[] {
    const data: (number | null)[] = [];
    
    // 查找匹配的表头
    const matchingHeaders = headers.filter(header => {
      const cleanHeader = header.trim().replace(/\s+/g, '');
      const regex = new RegExp(`^${prefix}\\d+$`);
      return regex.test(cleanHeader);
    });

    // 按数字顺序排序
    matchingHeaders.sort((a, b) => {
      const numA = parseInt(a.replace(prefix, '').replace(/\D/g, ''));
      const numB = parseInt(b.replace(prefix, '').replace(/\D/g, ''));
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
   * 验证数据类型特定的表头
   * @param headers 表头数组
   * @param dataType 数据类型
   * @returns 是否有效
   */
  private validateDataTypeHeaders(headers: string[], dataType: DataType): boolean {
    const cleanHeaders = headers.map(h => h.trim().replace(/\s+/g, ''));
    
    switch (dataType) {
      case 'voltage':
        // 检查是否有BankVol, BankCur和vol1-volN字段
        const hasVoltageFields = cleanHeaders.includes('BankVol') && cleanHeaders.includes('BankCur');
        const voltageDataHeaders = cleanHeaders.filter(h => /^vol\d+$/.test(h));
        return hasVoltageFields && voltageDataHeaders.length > 0;
        
      case 'soc':
        // 检查是否有soc1-socN字段
        const socDataHeaders = cleanHeaders.filter(h => /^soc\d+$/.test(h));
        return socDataHeaders.length > 0;
        
      case 'temperature':
        // 检查是否有temp1-tempN字段
        const tempDataHeaders = cleanHeaders.filter(h => /^temp\d+$/.test(h));
        return tempDataHeaders.length > 0;
        
      case 'state':
        // 检查是否有状态相关字段
        const requiredStateFields = ['BankVol', 'BankCur', 'BankSoc', 'BankSoh'];
        const hasStateFields = requiredStateFields.some(field => cleanHeaders.includes(field));
        return hasStateFields;
        
      default:
        return false;
    }
  }

  /**
   * 从文件路径提取组ID
   * @param filePath 文件路径
   * @returns 组ID
   */
  private extractGroupId(filePath: string): string {
    const pathParts = filePath.split('/');
    
    // 查找组ID (group1, group2, group3, group4)
    for (const part of pathParts) {
      if (/^group[1-4]$/.test(part)) {
        return part;
      }
    }
    
    return 'unknown';
  }

  /**
   * 从文件名提取日期
   * @param filePath 文件路径
   * @returns 日期字符串
   */
  private extractDate(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    
    // 匹配文件名中的日期格式: YYYY_MM_DD
    const match = fileName.match(/(\d{4})_(\d{2})_(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month}-${day}`;
    }
    
    return 'unknown';
  }

  /**
   * 清理字符串值，移除引号
   * @param value 原始字符串值
   * @returns 清理后的字符串值
   */
  private cleanStringValue(value: string): string {
    if (!value) return '';
    
    // 移除开头和结尾的单引号或双引号
    return value.replace(/^['"]|['"]$/g, '');
  }
}
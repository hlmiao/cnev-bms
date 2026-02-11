/**
 * CSV数据服务 - 连接CSV转换器和Web界面
 */

import { FileScannerImpl } from '../../csv-converter/src/scanners/FileScannerImpl.js';
import { FileParserImpl } from '../../csv-converter/src/parsers/FileParserImpl.js';
import { Project1DataTransformer } from '../../csv-converter/src/transformers/Project1DataTransformer.js';
import { Project2DataTransformer } from '../../csv-converter/src/transformers/Project2DataTransformer.js';
import { DataValidatorImpl } from '../../csv-converter/src/validators/DataValidatorImpl.js';
import { ConversionReporterImpl } from '../../csv-converter/src/reporters/ConversionReporterImpl.js';
import type { 
  StandardBatteryData, 
  Project1RawData, 
  Project2RawData,
  ConversionReport,
  BankTimeSeries
} from '../../csv-converter/src/types/index.js';

export interface ProjectDataSummary {
  projectId: string;
  projectName: string;
  projectType: 'project1' | 'project2';
  systems?: string[]; // 项目1的系统编号 (2#, 14#, 15#)
  groups?: string[]; // 项目2的组编号 (group1-4)
  lastUpdate: string;
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  summary: {
    totalVoltage?: number;
    totalCurrent?: number;
    avgSoc: number;
    avgSoh: number;
    power?: number;
    bankCount: number;
  };
}

export interface BankDisplayData {
  bankId: string;
  bankVol: number;
  bankCur: number;
  bankSoc: number;
  bankSoh: number;
  status: 'normal' | 'warning' | 'error';
  sglMaxVol: number;
  sglMinVol: number;
  sglMaxTemp: number;
  sglMinTemp: number;
  cellCount: number;
  lastUpdate: string;
}

export class CsvDataService {
  private scanner: FileScannerImpl;
  private parser: FileParserImpl;
  private project1Transformer: Project1DataTransformer;
  private project2Transformer: Project2DataTransformer;
  private validator: DataValidatorImpl;
  private reporter: ConversionReporterImpl;

  constructor() {
    this.scanner = new FileScannerImpl();
    this.parser = new FileParserImpl();
    this.project1Transformer = new Project1DataTransformer();
    this.project2Transformer = new Project2DataTransformer();
    this.validator = new DataValidatorImpl();
    this.reporter = new ConversionReporterImpl();
  }

  /**
   * 扫描并加载项目1数据
   */
  async loadProject1Data(dataPath: string): Promise<ProjectDataSummary[]> {
    try {
      // 扫描项目1文件结构
      const scanResult = await this.scanner.scanProject1(dataPath);
      const projects: ProjectDataSummary[] = [];

      for (const [systemId, systemData] of Object.entries(scanResult.systems)) {
        const sessionId = this.reporter.startConversion('project1');
        
        try {
          // 解析每个系统的数据
          const rawDataList: Project1RawData[] = [];
          
          for (const [bankId, bankFileInfo] of Object.entries(systemData.banks)) {
            const parseResult = await this.parser.parseProject1File(bankFileInfo.filePath);
            rawDataList.push(parseResult);
          }

          // 转换数据
          const transformedData = await this.project1Transformer.transformProject1Data(rawDataList[0]);
          
          // 验证数据质量
          const validationResult = await this.validator.validateData(transformedData);
          const qualityReport = await this.validator.generateQualityReport(transformedData);
          
          // 生成项目摘要
          const projectSummary: ProjectDataSummary = {
            projectId: `project1-${systemId}`,
            projectName: `项目1-${systemId}站`,
            projectType: 'project1',
            systems: [systemId],
            lastUpdate: new Date().toISOString(),
            dataQuality: {
              completeness: qualityReport.completeness,
              accuracy: qualityReport.accuracy,
              consistency: qualityReport.consistency,
              timeliness: qualityReport.timeliness
            },
            summary: {
              avgSoc: this.calculateAvgSoc(transformedData.banks),
              avgSoh: this.calculateAvgSoh(transformedData.banks),
              bankCount: transformedData.banks.length
            }
          };

          projects.push(projectSummary);
          await this.reporter.finishConversion(sessionId);
          
        } catch (error) {
          this.reporter.recordError(sessionId, {
            errorId: `error-${Date.now()}`,
            type: 'conversion_error',
            severity: 'high',
            message: `系统${systemId}数据转换失败: ${error}`,
            timestamp: new Date()
          });
          console.error(`项目1系统${systemId}数据加载失败:`, error);
        }
      }

      return projects;
    } catch (error) {
      console.error('项目1数据加载失败:', error);
      throw error;
    }
  }

  /**
   * 扫描并加载项目2数据
   */
  async loadProject2Data(dataPath: string): Promise<ProjectDataSummary[]> {
    try {
      // 扫描项目2文件结构
      const scanResult = await this.scanner.scanProject2(dataPath);
      const projects: ProjectDataSummary[] = [];

      for (const [groupId, groupData] of Object.entries(scanResult.groups)) {
        const sessionId = this.reporter.startConversion('project2');
        
        try {
          // 解析每个组的数据
          const rawDataList: Project2RawData[] = [];
          
          for (const [dataType, typeData] of Object.entries(groupData.dataTypes)) {
            for (const [date, fileInfo] of Object.entries(typeData.files)) {
              const parseResult = await this.parser.parseProject2File(fileInfo.filePath, dataType as any);
              rawDataList.push(parseResult);
            }
          }

          // 转换数据
          const transformedData = await this.project2Transformer.transformProject2Data(rawDataList);
          
          // 验证数据质量
          const validationResult = await this.validator.validateData(transformedData);
          const qualityReport = await this.validator.generateQualityReport(transformedData);
          
          // 生成项目摘要
          const projectSummary: ProjectDataSummary = {
            projectId: `project2-${groupId}`,
            projectName: `项目2-${groupId}`,
            projectType: 'project2',
            groups: [groupId],
            lastUpdate: new Date().toISOString(),
            dataQuality: {
              completeness: qualityReport.completeness,
              accuracy: qualityReport.accuracy,
              consistency: qualityReport.consistency,
              timeliness: qualityReport.timeliness
            },
            summary: {
              avgSoc: this.calculateAvgSoc(transformedData.banks),
              avgSoh: this.calculateAvgSoh(transformedData.banks),
              bankCount: transformedData.banks.length
            }
          };

          projects.push(projectSummary);
          await this.reporter.finishConversion(sessionId);
          
        } catch (error) {
          this.reporter.recordError(sessionId, {
            errorId: `error-${Date.now()}`,
            type: 'conversion_error',
            severity: 'high',
            message: `组${groupId}数据转换失败: ${error}`,
            timestamp: new Date()
          });
          console.error(`项目2组${groupId}数据加载失败:`, error);
        }
      }

      return projects;
    } catch (error) {
      console.error('项目2数据加载失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目详细数据
   */
  async getProjectDetail(projectId: string, dataPath: string): Promise<StandardBatteryData | null> {
    try {
      const [projectType, systemOrGroup] = projectId.split('-');
      
      if (projectType === 'project1') {
        return await this.getProject1Detail(systemOrGroup, dataPath);
      } else if (projectType === 'project2') {
        return await this.getProject2Detail(systemOrGroup, dataPath);
      }
      
      return null;
    } catch (error) {
      console.error(`获取项目${projectId}详细数据失败:`, error);
      return null;
    }
  }

  /**
   * 获取项目1详细数据
   */
  private async getProject1Detail(systemId: string, dataPath: string): Promise<StandardBatteryData | null> {
    const scanResult = await this.scanner.scanProject1(dataPath);
    const systemData = scanResult.systems[systemId];
    
    if (!systemData) return null;

    const rawDataList: Project1RawData[] = [];
    
    for (const [bankId, bankFileInfo] of Object.entries(systemData.banks)) {
      const parseResult = await this.parser.parseProject1File(bankFileInfo.filePath);
      rawDataList.push(parseResult);
    }

    return await this.project1Transformer.transformProject1Data(rawDataList[0]);
  }

  /**
   * 获取项目2详细数据
   */
  private async getProject2Detail(groupId: string, dataPath: string): Promise<StandardBatteryData | null> {
    const scanResult = await this.scanner.scanProject2(dataPath);
    const groupData = scanResult.groups[groupId];
    
    if (!groupData) return null;

    const rawDataList: Project2RawData[] = [];
    
    for (const [dataType, typeData] of Object.entries(groupData.dataTypes)) {
      for (const [date, fileInfo] of Object.entries(typeData.files)) {
        const parseResult = await this.parser.parseProject2File(fileInfo.filePath, dataType as any);
        rawDataList.push(parseResult);
      }
    }

    return await this.project2Transformer.transformProject2Data(rawDataList);
  }

  /**
   * 转换Bank数据为显示格式
   */
  convertBankToDisplayData(bankData: BankTimeSeries): BankDisplayData {
    return {
      bankId: bankData.bankId,
      bankVol: bankData.statistics.avgVoltage,
      bankCur: bankData.statistics.avgCurrent || 0,
      bankSoc: bankData.statistics.avgSoc,
      bankSoh: bankData.statistics.avgSoh,
      status: this.determineBankStatus(bankData),
      sglMaxVol: bankData.statistics.maxVoltage,
      sglMinVol: bankData.statistics.minVoltage,
      sglMaxTemp: bankData.statistics.maxTemperature,
      sglMinTemp: bankData.statistics.minTemperature,
      cellCount: bankData.dataPoints.length > 0 ? bankData.dataPoints[0].cellData.voltages.length : 0,
      lastUpdate: bankData.dataPoints.length > 0 ? bankData.dataPoints[bankData.dataPoints.length - 1].timestamp.toISOString() : new Date().toISOString()
    };
  }

  /**
   * 确定Bank状态
   */
  private determineBankStatus(bankData: BankTimeSeries): 'normal' | 'warning' | 'error' {
    const { avgVoltage, avgSoc, avgSoh, maxTemperature } = bankData.statistics;
    
    // 错误条件
    if (avgSoc < 10 || avgSoh < 70 || maxTemperature > 60 || avgVoltage < 2.5) {
      return 'error';
    }
    
    // 警告条件
    if (avgSoc < 20 || avgSoh < 80 || maxTemperature > 45 || avgVoltage < 3.0) {
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * 计算平均SOC
   */
  private calculateAvgSoc(banks: BankTimeSeries[]): number {
    if (banks.length === 0) return 0;
    const totalSoc = banks.reduce((sum, bank) => sum + bank.statistics.avgSoc, 0);
    return totalSoc / banks.length;
  }

  /**
   * 计算平均SOH
   */
  private calculateAvgSoh(banks: BankTimeSeries[]): number {
    if (banks.length === 0) return 0;
    const totalSoh = banks.reduce((sum, bank) => sum + bank.statistics.avgSoh, 0);
    return totalSoh / banks.length;
  }

  /**
   * 获取转换报告
   */
  async getConversionReports(): Promise<ConversionReport[]> {
    // 由于ConversionReporterImpl没有getAllReports方法，我们返回空数组
    // 实际使用时可以扩展ConversionReporterImpl来支持获取所有报告
    return [];
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.scanner.stopWatching();
  }
}

// 创建单例实例
export const csvDataService = new CsvDataService();
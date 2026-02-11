// 项目类型定义
export type ProjectType = 'project1' | 'project2';
export type DataType = 'soc' | 'state' | 'temperature' | 'voltage';
export type SystemId = '2#' | '14#' | '15#';
export type GroupId = 'group1' | 'group2' | 'group3' | 'group4';

// 文件结构接口
export interface Project1FileStructure {
  systems: {
    [systemId: string]: {
      banks: {
        [bankId: string]: {
          filePath: string;
          lastModified: Date;
          fileSize: number;
        };
      };
    };
  };
}

export interface Project2FileStructure {
  groups: {
    [groupId: string]: {
      dataTypes: {
        [dataType: string]: {
          files: {
            [date: string]: {
              filePath: string;
              lastModified: Date;
              fileSize: number;
            };
          };
        };
      };
    };
  };
}

// 原始数据接口
export interface Project1RawData {
  headers: string[];
  rows: Project1Row[];
  metadata: {
    systemId: string;
    bankId: string;
    recordCount: number;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
}

export interface Project1Row {
  时间: string;
  总电压: number | null;
  总电流: number | null;
  SOC: number | null;
  SOH: number | null;
  voltages: (number | null)[];  // V1-V400
  temperatures: (number | null)[];  // T1-T400
  socs: (number | null)[];  // SOC1-SOC400
  sohs: (number | null)[];  // SOH1-SOH400
}

export interface Project2RawData {
  headers: string[];
  rows: Project2Row[];
  metadata: {
    groupId: string;
    dataType: DataType;
    date: string;
    recordCount: number;
  };
}

export interface Project2Row {
  devInstCode: string;
  groupNo: number;
  datetime: string;
  bankVol?: number | null;
  bankCur?: number | null;
  values: (number | null)[];  // vol1-vol216, temp1-tempN, soc1-socN等
}

// 标准化数据接口
export interface StandardBatteryData {
  projectId: string;
  projectType: ProjectType;
  systemId?: string;  // 项目1使用
  groupId?: string;   // 项目2使用
  timeRange: {
    start: Date;
    end: Date;
  };
  banks: BankTimeSeries[];
  summary: ProjectSummary;
}

export interface BankTimeSeries {
  bankId: string;
  dataPoints: TimeSeriesPoint[];
  statistics: BankStatistics;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  bankData: {
    voltage: number;
    current: number;
    soc: number;
    soh: number;
    power: number;
    temperature: number;
  };
  cellData: {
    voltages: (number | null)[];
    temperatures: (number | null)[];
    socs: (number | null)[];
    sohs: (number | null)[];
  };
}

export interface BankStatistics {
  avgVoltage: number;
  avgCurrent: number;
  avgSoc: number;
  avgSoh: number;
  maxVoltage: number;
  minVoltage: number;
  maxTemperature: number;
  minTemperature: number;
}

export interface ProjectSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}

// 验证和错误处理接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: {
    totalRecords: number;
    validRecords: number;
    errorRate: number;
  };
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_value' | 'range_error' | 'format_error';
  field: string;
  value: any;
  message: string;
  rowIndex?: number;
}

export interface ValidationWarning {
  type: 'suspicious_value' | 'missing_optional' | 'format_inconsistency';
  field: string;
  value: any;
  message: string;
  rowIndex?: number;
}

// 转换报告接口
export interface ConversionReport {
  reportId: string;
  timestamp: Date;
  projectType: ProjectType;
  summary: ConversionSummary;
  fileProcessing: FileProcessingStats;
  dataQuality: DataQualityMetrics;
  errors: ConversionError[];
  warnings: ConversionWarning[];
  performance: PerformanceMetrics;
  recommendations: string[];
}

export interface ConversionSummary {
  totalFilesScanned: number;
  totalFilesProcessed: number;
  totalFilesSkipped: number;
  totalFilesFailed: number;
  totalRecordsProcessed: number;
  totalRecordsValid: number;
  totalRecordsInvalid: number;
  processingStartTime: Date;
  processingEndTime: Date;
  totalProcessingTime: number; // 毫秒
}

export interface FileProcessingStats {
  processedFiles: ProcessedFileInfo[];
  skippedFiles: SkippedFileInfo[];
  failedFiles: FailedFileInfo[];
}

export interface ProcessedFileInfo {
  filePath: string;
  fileSize: number;
  recordCount: number;
  validRecords: number;
  invalidRecords: number;
  processingTime: number; // 毫秒
  lastModified: Date;
  processedAt: Date;
}

export interface SkippedFileInfo {
  filePath: string;
  reason: 'already_processed' | 'no_changes' | 'invalid_format' | 'access_denied';
  lastModified: Date;
  skippedAt: Date;
}

export interface FailedFileInfo {
  filePath: string;
  error: string;
  errorType: 'parse_error' | 'validation_error' | 'io_error' | 'unknown_error';
  attemptedAt: Date;
}

export interface DataQualityMetrics {
  overallQualityScore: number;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  timelinessScore: number;
  anomalyCount: number;
  criticalAnomalies: number;
  highSeverityAnomalies: number;
}

export interface ConversionError {
  errorId: string;
  type: 'file_error' | 'parse_error' | 'validation_error' | 'transformation_error' | 'storage_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath?: string | undefined;
  rowIndex?: number | undefined;
  field?: string | undefined;
  message: string;
  details?: string | undefined;
  timestamp: Date;
}

export interface ConversionWarning {
  warningId: string;
  type: 'data_quality' | 'format_issue' | 'performance' | 'configuration';
  filePath?: string | undefined;
  rowIndex?: number | undefined;
  field?: string | undefined;
  message: string;
  suggestion?: string | undefined;
  timestamp: Date;
}

export interface PerformanceMetrics {
  totalMemoryUsed: number; // MB
  peakMemoryUsage: number; // MB
  averageFileProcessingTime: number; // 毫秒
  filesPerSecond: number;
  recordsPerSecond: number;
  cpuUsagePercent: number;
  ioWaitTime: number; // 毫秒
}

// 转换配置接口
export interface ConversionConfig {
  project1: {
    encoding: string;
    timeFormat: string;
    cellCount: number;
    tempCount: number;
  };
  project2: {
    encoding: string;
    timeFormat: string;
    cellCount: number;
  };
  validation: {
    voltageRange: [number, number];
    temperatureRange: [number, number];
    socRange: [number, number];
    sohRange: [number, number];
  };
  output: {
    format: 'json';
    compression: boolean;
    indexing: boolean;
  };
}
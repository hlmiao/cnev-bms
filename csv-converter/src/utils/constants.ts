import { ConversionConfig } from '../types/index.js';

// 默认转换配置
export const DEFAULT_CONFIG: ConversionConfig = {
  project1: {
    encoding: 'utf8',
    timeFormat: 'M/D/YYYY HH:mm',
    cellCount: 240,
    tempCount: 120
  },
  project2: {
    encoding: 'utf8',
    timeFormat: 'YYYY-MM-DD HH:mm:ss',
    cellCount: 216
  },
  validation: {
    voltageRange: [2.5, 4.2],
    temperatureRange: [-40, 80],
    socRange: [0, 100],
    sohRange: [0, 100]
  },
  output: {
    format: 'json',
    compression: true,
    indexing: true
  }
};

// 项目1中文字段映射
export const PROJECT1_FIELD_MAPPING: Record<string, string> = {
  '时间': 'datetime',
  '总电压': 'bankVol',
  '总电流': 'bankCur',
  'SOC': 'bankSoc',
  'SOH': 'bankSoh',
  '单体Vmax': 'sglMaxVol',
  '单体Vmin': 'sglMinVol',
  '单体Tmax': 'sglMaxTemp',
  '单体Tmin': 'sglMinTemp',
  '绝缘电阻+': 'posRes',
  '绝缘电阻-': 'negRes',
  '累计充电电量': 'chargeEQ',
  '累计放电电量': 'dischargeEQ'
};

// 项目1系统ID列表
export const PROJECT1_SYSTEMS = ['2#', '14#', '15#'] as const;

// 项目2组ID列表
export const PROJECT2_GROUPS = ['group1', 'group2', 'group3', 'group4'] as const;

// 项目2数据类型列表
export const PROJECT2_DATA_TYPES = ['soc', 'state', 'temperature', 'voltage'] as const;

// Bank ID模式
export const BANK_ID_PATTERN = /Bank(\d{2})/;

// 文件名模式
export const PROJECT1_FILE_PATTERN = /Bank(\d{2})_(\d{8})\.csv$/;
export const PROJECT2_FILE_PATTERN = /(soc|state|temp|vol)\d+_(\d{4})_(\d{2})_(\d{2})_(\d{6})\.csv$/;

// 数据验证阈值
export const VALIDATION_THRESHOLDS = {
  VOLTAGE_OUTLIER_THRESHOLD: 3, // 标准差倍数
  TEMPERATURE_OUTLIER_THRESHOLD: 3,
  SOC_OUTLIER_THRESHOLD: 2,
  MISSING_DATA_THRESHOLD: 0.05, // 5%缺失率阈值
  TIME_GAP_THRESHOLD: 300000, // 5分钟时间间隔阈值（毫秒）
  MIN_QUALITY_SCORE: 80 // 最低质量分数
};

// 日志级别
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// 输出路径配置
export const OUTPUT_PATHS = {
  CONVERTED_DATA: 'data/converted',
  INDEXES: 'data/indexes',
  REPORTS: 'data/reports',
  LOGS: 'logs'
} as const;
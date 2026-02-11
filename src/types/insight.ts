// 洞察类型
export type InsightType =
  | 'voltage_outlier'
  | 'temperature_anomaly'
  | 'soc_imbalance'
  | 'insulation_warning'
  | 'consistency_issue'
  | 'data_quality';

// 洞察级别
export type InsightLevel = 'info' | 'warning' | 'error';

// 洞察数据项
export interface InsightDataItem {
  label: string;
  value: string | number;
}

// 洞察
export interface Insight {
  id: string;
  type: InsightType;
  level: InsightLevel;
  title: string;
  description: string;
  relatedData: InsightDataItem[];
  affectedCells?: number[];
  suggestion?: string;
  timestamp: string;
}

// 一致性评分
export interface ConsistencyScore {
  voltage: number;
  temperature: number;
  soc: number;
  resistance?: number;
  overall: number;
}

// 健康评估
export interface HealthAssessment {
  consistencyScore: ConsistencyScore;
  voltageStdDev: number;
  temperatureStdDev: number;
  socStdDev: number;
  outlierCount: number;
  dataCompleteness: number;
}

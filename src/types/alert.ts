// 告警类型
export type AlertType = 'voltage' | 'temperature' | 'soc' | 'insulation' | 'communication';

// 告警级别
export type AlertLevel = 'critical' | 'warning' | 'info';

// 告警位置
export interface AlertLocation {
  projectId: string;
  projectName?: string;
  stackId?: string;
  bankId?: string;
  cellId?: number;
}

// 告警
export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  location: AlertLocation;
  currentValue: number;
  threshold: number;
  timestamp: string;
  status: 'active' | 'resolved';
}

// 告警统计
export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<AlertType, number>;
}

// 告警阈值配置
export interface AlertThresholds {
  voltage: {
    high: number;
    low: number;
    diff: number;
  };
  temperature: {
    high: number;
    diff: number;
  };
  soc: {
    high: number;
    low: number;
  };
  insulation: {
    low: number;
  };
}

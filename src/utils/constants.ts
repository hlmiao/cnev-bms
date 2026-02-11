import type { AlertThresholds } from '../types';

// 告警阈值
export const ALERT_THRESHOLDS: AlertThresholds = {
  voltage: {
    high: 3.5,
    low: 3.0,
    diff: 0.1,
  },
  temperature: {
    high: 35,
    diff: 15,
  },
  soc: {
    high: 98,
    low: 10,
  },
  insulation: {
    low: 500,
  },
};

// 状态颜色
export const STATUS_COLORS = {
  normal: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  offline: '#d9d9d9',
  info: '#1890ff',
} as const;

// 热力图颜色
export const HEATMAP_COLORS = {
  voltage: {
    low: '#3182bd',
    mid: '#31a354',
    high: '#e6550d',
  },
  temperature: {
    low: '#3182bd',
    mid: '#31a354',
    high: '#e6550d',
  },
  soc: {
    low: '#e6550d',
    mid: '#fdae6b',
    high: '#31a354',
  },
} as const;

// 充放电状态映射
export const CHARGING_STATE_MAP = {
  2: { label: '待机', color: '#d9d9d9' },
  3: { label: '充电', color: '#52c41a' },
  4: { label: '放电', color: '#1890ff' },
} as const;

// 占位符
export const PLACEHOLDER = '--';
export const MISSING_VALUE_COLOR = '#d9d9d9';

// 数据范围
export const DATA_RANGES = {
  voltage: { min: 2.8, max: 3.65, normal: { min: 3.0, max: 3.5 } },
  temperature: { min: -20, max: 60, normal: { min: 15, max: 35 } },
  soc: { min: 0, max: 100, normal: { min: 10, max: 98 } },
  soh: { min: 0, max: 100, normal: { min: 80, max: 100 } },
} as const;

// 项目1配置
export const PROJECT1_CONFIG = {
  cellCount: 240,
  tempCount: 120,
  socCount: 240,
  sohCount: 240,
  heatmapRows: 15,
  heatmapCols: 16,
} as const;

// 项目2配置
export const PROJECT2_CONFIG = {
  cellCount: 216,
  tempCount: 90,
  socCount: 216,
  heatmapRows: 12,
  heatmapCols: 18,
  tempHeatmapRows: 9,
  tempHeatmapCols: 10,
} as const;

// 菜单项
export const MENU_ITEMS = [
  { key: '/', label: '系统总览', icon: 'DashboardOutlined' },
  { key: '/projects', label: '项目管理', icon: 'FolderOutlined' },
  { key: '/analysis', label: '数据分析', icon: 'BarChartOutlined' },
  { key: '/alerts', label: '告警中心', icon: 'BellOutlined' },
  { key: '/settings', label: '系统设置', icon: 'SettingOutlined' },
] as const;

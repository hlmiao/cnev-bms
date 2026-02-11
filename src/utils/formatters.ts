import { PLACEHOLDER } from './constants';

// 检测缺失值
export const isMissingValue = (value: unknown): boolean => {
  return (
    value === null ||
    value === undefined ||
    value === '-' ||
    value === '' ||
    value === 65534 ||
    (typeof value === 'number' && isNaN(value))
  );
};

// 格式化数值
export const formatValue = (
  value: unknown,
  decimals: number = 2,
  unit?: string
): string => {
  if (isMissingValue(value)) {
    return PLACEHOLDER;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return PLACEHOLDER;
  }
  const formatted = num.toFixed(decimals);
  return unit ? `${formatted}${unit}` : formatted;
};

// 格式化百分比
export const formatPercent = (value: unknown, decimals: number = 1): string => {
  if (isMissingValue(value)) {
    return PLACEHOLDER;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return PLACEHOLDER;
  }
  return `${num.toFixed(decimals)}%`;
};

// 格式化电压
export const formatVoltage = (value: unknown): string => {
  return formatValue(value, 3, 'V');
};

// 格式化电流
export const formatCurrent = (value: unknown): string => {
  return formatValue(value, 1, 'A');
};

// 格式化温度
export const formatTemperature = (value: unknown): string => {
  return formatValue(value, 1, '°C');
};

// 格式化功率
export const formatPower = (value: unknown): string => {
  if (isMissingValue(value)) {
    return PLACEHOLDER;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return PLACEHOLDER;
  }
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(2)}MW`;
  }
  return `${num.toFixed(2)}kW`;
};

// 格式化能量
export const formatEnergy = (value: unknown): string => {
  if (isMissingValue(value)) {
    return PLACEHOLDER;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return PLACEHOLDER;
  }
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}GWh`;
  }
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(2)}MWh`;
  }
  return `${num.toFixed(2)}kWh`;
};

// 格式化时间
export const formatDateTime = (value: string | Date): string => {
  if (!value) return PLACEHOLDER;
  const date = typeof value === 'string' ? new Date(value.replace(/'/g, '')) : value;
  if (isNaN(date.getTime())) return PLACEHOLDER;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 格式化日期
export const formatDate = (value: string | Date): string => {
  if (!value) return PLACEHOLDER;
  const date = typeof value === 'string' ? new Date(value.replace(/'/g, '')) : value;
  if (isNaN(date.getTime())) return PLACEHOLDER;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 格式化时间（仅时分秒）
export const formatTime = (value: string | Date): string => {
  if (!value) return PLACEHOLDER;
  const date = typeof value === 'string' ? new Date(value.replace(/'/g, '')) : value;
  if (isNaN(date.getTime())) return PLACEHOLDER;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// 格式化大数字（千分位）
export const formatNumber = (value: unknown): string => {
  if (isMissingValue(value)) {
    return PLACEHOLDER;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) {
    return PLACEHOLDER;
  }
  return num.toLocaleString('zh-CN');
};

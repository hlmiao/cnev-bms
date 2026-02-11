import { promises as fs } from 'fs';

/**
 * 确保目录存在，如果不存在则创建
 * @param dirPath 目录路径
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件统计信息
 * @param filePath 文件路径
 * @returns 文件统计信息
 */
export async function getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime
    };
  } catch {
    return null;
  }
}

/**
 * 解析时间字符串
 * @param timeStr 时间字符串
 * @param format 时间格式
 * @returns 解析后的日期对象
 */
export function parseTimeString(timeStr: string, format: string): Date {
  // 简单的时间解析实现
  // 项目1格式: "1/10/2024 00:00"
  if (format === 'M/D/YYYY HH:mm') {
    const match = timeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    if (match) {
      const [, month, day, year, hour, minute] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
  }
  
  // 项目2格式: "2025-04-01 00:00:23"
  if (format === 'YYYY-MM-DD HH:mm:ss') {
    return new Date(timeStr);
  }
  
  // 默认尝试直接解析
  return new Date(timeStr);
}

/**
 * 格式化时间为ISO字符串
 * @param date 日期对象
 * @returns ISO格式字符串
 */
export function formatToISO(date: Date): string {
  return date.toISOString();
}

/**
 * 安全解析数值
 * @param value 要解析的值
 * @param defaultValue 默认值
 * @returns 解析后的数值或默认值
 */
export function safeParseFloat(value: string | number | null | undefined, defaultValue: number | null = null): number | null {
  if (value === null || value === undefined || value === '' || value === '-') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 计算数组的统计信息
 * @param values 数值数组
 * @returns 统计信息
 */
export function calculateStatistics(values: (number | null)[]): {
  count: number;
  validCount: number;
  avg: number;
  min: number;
  max: number;
  stdDev: number;
} {
  const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
  const count = values.length;
  const validCount = validValues.length;
  
  if (validCount === 0) {
    return { count, validCount, avg: 0, min: 0, max: 0, stdDev: 0 };
  }
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const avg = sum / validCount;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  
  const variance = validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validCount;
  const stdDev = Math.sqrt(variance);
  
  return { count, validCount, avg, min, max, stdDev };
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批处理数组
 * @param array 要处理的数组
 * @param batchSize 批次大小
 * @returns 分批后的数组
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
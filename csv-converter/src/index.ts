/**
 * CSV数据转换器主入口文件
 * 
 * 这个模块提供了将项目1和项目2的CSV数据转换为标准JSON格式的功能
 */

// 导出所有接口和类型
export * from './types/index.js';
export * from './interfaces/index.js';
export * from './utils/index.js';

// 主要功能将在后续任务中实现
export { logger } from './utils/logger.js';

// 版本信息
export const VERSION = '1.0.0';
export const DESCRIPTION = 'CSV数据转换器 - 将项目1和项目2的CSV数据转换为标准JSON格式';
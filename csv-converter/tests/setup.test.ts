/**
 * 项目设置验证测试
 */

import { VERSION, DESCRIPTION } from '../src/index.js';
import { DEFAULT_CONFIG, PROJECT1_SYSTEMS, PROJECT2_GROUPS } from '../src/utils/constants.js';
import { logger } from '../src/utils/logger.js';

describe('项目设置验证', () => {
  test('应该正确导出版本信息', () => {
    expect(VERSION).toBe('1.0.0');
    expect(DESCRIPTION).toContain('CSV数据转换器');
  });

  test('应该正确加载默认配置', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.project1.cellCount).toBe(240);
    expect(DEFAULT_CONFIG.project2.cellCount).toBe(216);
    expect(DEFAULT_CONFIG.validation.voltageRange).toEqual([2.5, 4.2]);
  });

  test('应该正确定义项目常量', () => {
    expect(PROJECT1_SYSTEMS).toEqual(['2#', '14#', '15#']);
    expect(PROJECT2_GROUPS).toEqual(['group1', 'group2', 'group3', 'group4']);
  });

  test('应该正确初始化日志器', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('应该能够记录日志', () => {
    // 这个测试只验证日志器不会抛出错误
    expect(() => {
      logger.info('测试日志信息');
      logger.warn('测试警告信息');
    }).not.toThrow();
  });
});
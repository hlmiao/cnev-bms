/**
 * Project1Parser 测试
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Project1Parser } from '../../src/parsers/Project1Parser.js';
import { ensureDirectoryExists } from '../../src/utils/helpers.js';

describe('Project1Parser', () => {
  let parser: Project1Parser;
  let testDir: string;

  beforeEach(() => {
    parser = new Project1Parser();
    testDir = path.join(process.cwd(), 'test-data');
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
  });

  describe('parseProject1File', () => {
    test('应该正确解析项目1 CSV文件', async () => {
      // 创建测试CSV文件
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,V1,V2,V3,T1,T2,SOC1,SOC2,SOH1,SOH2',
        '1/10/2024 00:00,775.4,0,10,89,3.24,3.23,3.25,24,25,20,18,89,90',
        '1/10/2024 00:01,775.5,1.2,11,89,3.25,3.24,3.26,25,26,21,19,89,90'
      ].join('\n');

      const testFile = path.join(testDir, '2#', 'Bank01_20241001.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      // 解析文件
      const result = await parser.parseProject1File(testFile);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.headers).toContain('时间');
      expect(result.headers).toContain('总电压');
      expect(result.rows).toHaveLength(2);
      
      // 验证第一行数据
      const firstRow = result.rows[0];
      expect(firstRow.时间).toBe('1/10/2024 00:00');
      expect(firstRow.总电压).toBe(775.4);
      expect(firstRow.总电流).toBe(0);
      expect(firstRow.SOC).toBe(10);
      expect(firstRow.SOH).toBe(89);
      
      // 验证单体数据
      expect(firstRow.voltages[0]).toBe(3.24);
      expect(firstRow.voltages[1]).toBe(3.23);
      expect(firstRow.voltages[2]).toBe(3.25);
      expect(firstRow.temperatures[0]).toBe(24);
      expect(firstRow.temperatures[1]).toBe(25);
      expect(firstRow.socs[0]).toBe(20);
      expect(firstRow.socs[1]).toBe(18);
      expect(firstRow.sohs[0]).toBe(89);
      expect(firstRow.sohs[1]).toBe(90);

      // 验证元数据
      expect(result.metadata.systemId).toBe('2#');
      expect(result.metadata.bankId).toBe('Bank01');
      expect(result.metadata.recordCount).toBe(2);
      expect(result.metadata.timeRange.start).toBeDefined();
      expect(result.metadata.timeRange.end).toBeDefined();
    });

    test('应该处理缺失值和无效数据', async () => {
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,V1,V2,V3',
        '1/10/2024 00:00,775.4,-,10,89,3.24,-,invalid',
        '1/10/2024 00:01,,1.2,11,89,,3.24,3.26'
      ].join('\n');

      const testFile = path.join(testDir, '14#', 'Bank02_20241001.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject1File(testFile);

      expect(result.rows).toHaveLength(2);
      
      // 验证第一行的缺失值处理
      const firstRow = result.rows[0];
      expect(firstRow.总电流).toBe(null); // '-' 应该转换为 null
      expect(firstRow.voltages[1]).toBe(null); // '-' 应该转换为 null
      expect(firstRow.voltages[2]).toBe(null); // 'invalid' 应该转换为 null
      
      // 验证第二行的空值处理
      const secondRow = result.rows[1];
      expect(secondRow.总电压).toBe(null); // 空值应该转换为 null
      expect(secondRow.voltages[0]).toBe(null); // 空值应该转换为 null
    });

    test('应该正确提取系统ID和Bank ID', async () => {
      const csvContent = '时间,总电压,总电流,SOC,SOH\n1/10/2024 00:00,775.4,0,10,89';
      
      const testFile = path.join(testDir, '15#', 'Bank11_20241001.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject1File(testFile);

      expect(result.metadata.systemId).toBe('15#');
      expect(result.metadata.bankId).toBe('Bank11');
    });
  });

  describe('validateCsvFormat', () => {
    test('应该验证有效的CSV格式', async () => {
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,V1,V2,V3,T1,T2',
        '1/10/2024 00:00,775.4,0,10,89,3.24,3.23,3.25,24,25'
      ].join('\n');

      const testFile = path.join(testDir, 'valid.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(true);
    });

    test('应该拒绝缺少必需表头的CSV', async () => {
      const csvContent = [
        'V1,V2,V3,T1,T2', // 缺少基础字段
        '3.24,3.23,3.25,24,25'
      ].join('\n');

      const testFile = path.join(testDir, 'invalid.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(false);
    });

    test('应该拒绝没有电压数据的CSV', async () => {
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,T1,T2', // 缺少电压列
        '1/10/2024 00:00,775.4,0,10,89,24,25'
      ].join('\n');

      const testFile = path.join(testDir, 'no-voltage.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(false);
    });
  });
});
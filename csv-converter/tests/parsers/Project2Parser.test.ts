/**
 * Project2Parser 测试
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Project2Parser } from '../../src/parsers/Project2Parser.js';
import { ensureDirectoryExists } from '../../src/utils/helpers.js';

describe('Project2Parser', () => {
  let parser: Project2Parser;
  let testDir: string;

  beforeEach(async () => {
    parser = new Project2Parser();
    testDir = path.join(process.cwd(), 'test-data');
    
    // 确保测试目录存在
    await ensureDirectoryExists(testDir);
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
  });

  describe('parseProject2File', () => {
    test('应该正确解析项目2电压CSV文件', async () => {
      // 创建测试电压CSV文件
      const csvContent = [
        'devInstCode,groupNo,datetime,BankVol,BankCur,vol1,vol2,vol3,vol4,vol5',
        "'192.168.13.21',1,'2025-04-01 00:00:23',722.7,1.7,3.342,3.341,3.343,3.343,3.34",
        "'192.168.13.21',1,'2025-04-01 00:00:25',722.2,-2.1,3.342,3.342,3.344,3.344,3.34"
      ].join('\n');

      const testFile = path.join(testDir, 'group1', 'voltage', 'vol1_2025_04_01_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      // 解析文件
      const result = await parser.parseProject2File(testFile, 'voltage');

      // 验证结果
      expect(result).toBeDefined();
      expect(result.headers).toContain('devInstCode');
      expect(result.headers).toContain('BankVol');
      expect(result.rows).toHaveLength(2);
      
      // 验证第一行数据
      const firstRow = result.rows[0];
      expect(firstRow.devInstCode).toBe('192.168.13.21');
      expect(firstRow.groupNo).toBe(1);
      expect(firstRow.datetime).toBe('2025-04-01 00:00:23');
      expect(firstRow.bankVol).toBe(722.7);
      expect(firstRow.bankCur).toBe(1.7);
      
      // 验证电压数据
      expect(firstRow.values[0]).toBe(3.342);
      expect(firstRow.values[1]).toBe(3.341);
      expect(firstRow.values[2]).toBe(3.343);
      expect(firstRow.values[3]).toBe(3.343);
      expect(firstRow.values[4]).toBe(3.34);

      // 验证元数据
      expect(result.metadata.groupId).toBe('group1');
      expect(result.metadata.dataType).toBe('voltage');
      expect(result.metadata.date).toBe('2025-04-01');
      expect(result.metadata.recordCount).toBe(2);
    });

    test('应该正确解析项目2 SOC CSV文件', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,soc1,soc2,soc3,soc4,soc5',
        "'192.168.13.21',1,'2025-04-01 00:00:23',98,97,99,99,96",
        "'192.168.13.21',1,'2025-04-01 00:00:25',98,97,99,99,96"
      ].join('\n');

      const testFile = path.join(testDir, 'group2', 'soc', 'soc2_2025_04_02_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject2File(testFile, 'soc');

      expect(result.rows).toHaveLength(2);
      
      const firstRow = result.rows[0];
      expect(firstRow.devInstCode).toBe('192.168.13.21');
      expect(firstRow.groupNo).toBe(1);
      expect(firstRow.values[0]).toBe(98);
      expect(firstRow.values[1]).toBe(97);
      expect(firstRow.values[2]).toBe(99);
      expect(firstRow.values[3]).toBe(99);
      expect(firstRow.values[4]).toBe(96);

      expect(result.metadata.groupId).toBe('group2');
      expect(result.metadata.dataType).toBe('soc');
      expect(result.metadata.date).toBe('2025-04-02');
    });

    test('应该正确解析项目2温度CSV文件', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,temp1,temp2,temp3,temp4,temp5',
        "'192.168.13.21',1,'2025-04-01 00:00:23',23,23.5,22,24.5,22.5",
        "'192.168.13.21',1,'2025-04-01 00:00:25',23,23.5,22,24.5,22.5"
      ].join('\n');

      const testFile = path.join(testDir, 'group3', 'temperature', 'temp3_2025_04_03_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject2File(testFile, 'temperature');

      expect(result.rows).toHaveLength(2);
      
      const firstRow = result.rows[0];
      expect(firstRow.values[0]).toBe(23);
      expect(firstRow.values[1]).toBe(23.5);
      expect(firstRow.values[2]).toBe(22);
      expect(firstRow.values[3]).toBe(24.5);
      expect(firstRow.values[4]).toBe(22.5);

      expect(result.metadata.groupId).toBe('group3');
      expect(result.metadata.dataType).toBe('temperature');
      expect(result.metadata.date).toBe('2025-04-03');
    });

    test('应该正确解析项目2状态CSV文件', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,BankVol,BankCur,BankSoc,BankSoh,EnvTemp,BankState',
        "'192.168.13.21',1,'2025-04-01 00:00:23',722.70,1.70,97.0,100.0,21.0,Normal",
        "'192.168.13.21',1,'2025-04-01 00:00:25',722.20,-2.10,97.0,100.0,21.0,Normal"
      ].join('\n');

      const testFile = path.join(testDir, 'group4', 'state', 'state4_2025_04_04_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject2File(testFile, 'state');

      expect(result.rows).toHaveLength(2);
      
      const firstRow = result.rows[0];
      expect(firstRow.bankVol).toBe(722.70);
      expect(firstRow.bankCur).toBe(1.70);
      expect(firstRow.values).toHaveLength(0); // state文件不包含values数组

      expect(result.metadata.groupId).toBe('group4');
      expect(result.metadata.dataType).toBe('state');
      expect(result.metadata.date).toBe('2025-04-04');
    });

    test('应该处理缺失值和无效数据', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,BankVol,BankCur,vol1,vol2,vol3',
        "'192.168.13.21',1,'2025-04-01 00:00:23',722.7,-,3.342,invalid,",
        "'192.168.13.21',1,'2025-04-01 00:00:25',,1.7,,3.342,3.344"
      ].join('\n');

      const testFile = path.join(testDir, 'group1', 'voltage', 'vol1_2025_04_01_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject2File(testFile, 'voltage');

      expect(result.rows).toHaveLength(2);
      
      // 验证第一行的缺失值处理
      const firstRow = result.rows[0];
      expect(firstRow.bankCur).toBe(null); // '-' 应该转换为 null
      expect(firstRow.values[1]).toBe(null); // 'invalid' 应该转换为 null
      expect(firstRow.values[2]).toBe(null); // 空值应该转换为 null
      
      // 验证第二行的空值处理
      const secondRow = result.rows[1];
      expect(secondRow.bankVol).toBe(null); // 空值应该转换为 null
      expect(secondRow.values[0]).toBe(null); // 空值应该转换为 null
    });
  });

  describe('validateProject2CsvFormat', () => {
    test('应该验证有效的电压CSV格式', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,BankVol,BankCur,vol1,vol2,vol3',
        "'192.168.13.21',1,'2025-04-01 00:00:23',722.7,1.7,3.342,3.341,3.343"
      ].join('\n');

      const testFile = path.join(testDir, 'voltage-valid.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateProject2CsvFormat(testFile, 'voltage');
      expect(isValid).toBe(true);
    });

    test('应该验证有效的SOC CSV格式', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,soc1,soc2,soc3',
        "'192.168.13.21',1,'2025-04-01 00:00:23',98,97,99"
      ].join('\n');

      const testFile = path.join(testDir, 'soc-valid.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateProject2CsvFormat(testFile, 'soc');
      expect(isValid).toBe(true);
    });

    test('应该拒绝缺少必需表头的CSV', async () => {
      const csvContent = [
        'vol1,vol2,vol3', // 缺少基础字段
        '3.342,3.341,3.343'
      ].join('\n');

      const testFile = path.join(testDir, 'invalid.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateProject2CsvFormat(testFile, 'voltage');
      expect(isValid).toBe(false);
    });

    test('应该拒绝数据类型不匹配的CSV', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,soc1,soc2,soc3', // SOC字段但验证为voltage类型
        "'192.168.13.21',1,'2025-04-01 00:00:23',98,97,99"
      ].join('\n');

      const testFile = path.join(testDir, 'type-mismatch.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateProject2CsvFormat(testFile, 'voltage');
      expect(isValid).toBe(false);
    });
  });
});
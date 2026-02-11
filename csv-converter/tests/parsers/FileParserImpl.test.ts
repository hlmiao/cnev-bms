/**
 * FileParserImpl 集成测试
 */

import { promises as fs } from 'fs';
import path from 'path';
import { FileParserImpl } from '../../src/parsers/FileParserImpl.js';
import { ensureDirectoryExists } from '../../src/utils/helpers.js';

describe('FileParserImpl Integration', () => {
  let parser: FileParserImpl;
  let testDir: string;

  beforeEach(() => {
    parser = new FileParserImpl();
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

  describe('项目类型自动识别和路由', () => {
    test('应该正确识别并解析项目1文件', async () => {
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,V1,V2,V3',
        '1/10/2024 00:00,775.4,0,10,89,3.24,3.23,3.25'
      ].join('\n');

      const testFile = path.join(testDir, '2#', 'Bank01_20241001.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject1File(testFile);

      expect(result).toBeDefined();
      expect(result.metadata.systemId).toBe('2#');
      expect(result.metadata.bankId).toBe('Bank01');
      expect(result.rows).toHaveLength(1);
    });

    test('应该正确识别并解析项目2电压文件', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,BankVol,BankCur,vol1,vol2,vol3',
        "'192.168.13.21',1,'2025-04-01 00:00:23',722.7,1.7,3.342,3.341,3.343"
      ].join('\n');

      const testFile = path.join(testDir, 'group1', 'voltage', 'vol1_2025_04_01_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const result = await parser.parseProject2File(testFile, 'voltage');

      expect(result).toBeDefined();
      expect(result.metadata.groupId).toBe('group1');
      expect(result.metadata.dataType).toBe('voltage');
      expect(result.rows).toHaveLength(1);
    });

    test('应该正确验证项目1文件格式', async () => {
      const csvContent = [
        '时间,总电压,总电流,SOC,SOH,V1,V2,V3',
        '1/10/2024 00:00,775.4,0,10,89,3.24,3.23,3.25'
      ].join('\n');

      const testFile = path.join(testDir, '14#', 'Bank02_20241001.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(true);
    });

    test('应该正确验证项目2文件格式', async () => {
      const csvContent = [
        'devInstCode,groupNo,datetime,soc1,soc2,soc3',
        "'192.168.13.21',1,'2025-04-01 00:00:23',98,97,99"
      ].join('\n');

      const testFile = path.join(testDir, 'group2', 'soc', 'soc2_2025_04_02_000000.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(true);
    });

    test('应该拒绝无法识别的文件类型', async () => {
      const csvContent = [
        'unknown,header,format',
        'some,data,here'
      ].join('\n');

      const testFile = path.join(testDir, 'unknown', 'unknown.csv');
      await ensureDirectoryExists(path.dirname(testFile));
      await fs.writeFile(testFile, csvContent);

      const isValid = await parser.validateCsvFormat(testFile);
      expect(isValid).toBe(false);
    });
  });
});
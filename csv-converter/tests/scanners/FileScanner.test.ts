/**
 * FileScanner 测试
 */

import { promises as fs } from 'fs';
import path from 'path';
import { FileScannerImpl } from '../../src/scanners/FileScannerImpl.js';
import { ensureDirectoryExists } from '../../src/utils/helpers.js';

describe('FileScannerImpl', () => {
  let scanner: FileScannerImpl;
  let testDir: string;

  beforeEach(async () => {
    scanner = new FileScannerImpl();
    testDir = path.join(process.cwd(), 'test-data');
    
    // 确保测试目录存在
    await ensureDirectoryExists(testDir);
  });

  afterEach(async () => {
    scanner.stopWatching();
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
  });

  describe('scanProject1', () => {
    test('应该正确扫描项目1文件结构', async () => {
      // 创建测试目录结构
      const project1Path = path.join(testDir, 'project1');
      await ensureDirectoryExists(path.join(project1Path, '2#'));
      await ensureDirectoryExists(path.join(project1Path, '14#'));
      
      // 创建测试文件
      await fs.writeFile(path.join(project1Path, '2#', 'Bank01_20241001.csv'), 'test,data\n1,2');
      await fs.writeFile(path.join(project1Path, '2#', 'Bank02_20241001.csv'), 'test,data\n3,4');
      await fs.writeFile(path.join(project1Path, '14#', 'Bank01_20241001.csv'), 'test,data\n5,6');

      // 扫描文件结构
      const result = await scanner.scanProject1(project1Path);

      // 验证结果
      expect(result.systems).toBeDefined();
      expect(result.systems['2#']).toBeDefined();
      expect(result.systems['2#'].banks).toBeDefined();
      expect(result.systems['2#'].banks['Bank01']).toBeDefined();
      expect(result.systems['2#'].banks['Bank02']).toBeDefined();
      expect(result.systems['14#'].banks['Bank01']).toBeDefined();
      
      // 验证文件信息
      expect(result.systems['2#'].banks['Bank01'].filePath).toContain('Bank01_20241001.csv');
      expect(result.systems['2#'].banks['Bank01'].lastModified).toBeDefined();
      expect(result.systems['2#'].banks['Bank01'].fileSize).toBeGreaterThan(0);
    });

    test('应该处理不存在的目录', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent');
      
      const result = await scanner.scanProject1(nonExistentPath);
      
      expect(result.systems).toEqual({});
    });
  });

  describe('scanProject2', () => {
    test('应该正确扫描项目2文件结构', async () => {
      // 创建测试目录结构
      const project2Path = path.join(testDir, 'project2');
      await ensureDirectoryExists(path.join(project2Path, 'group1', 'voltage'));
      await ensureDirectoryExists(path.join(project2Path, 'group1', 'temperature'));
      
      // 创建测试文件
      await fs.writeFile(
        path.join(project2Path, 'group1', 'voltage', 'vol1_2025_04_01_000000.csv'), 
        'devInstCode,groupNo,datetime\ntest,1,2025-04-01'
      );
      await fs.writeFile(
        path.join(project2Path, 'group1', 'temperature', 'temp1_2025_04_01_000000.csv'), 
        'devInstCode,groupNo,datetime\ntest,1,2025-04-01'
      );

      // 扫描文件结构
      const result = await scanner.scanProject2(project2Path);

      // 验证结果
      expect(result.groups).toBeDefined();
      expect(result.groups['group1']).toBeDefined();
      expect(result.groups['group1'].dataTypes).toBeDefined();
      expect(result.groups['group1'].dataTypes['voltage']).toBeDefined();
      expect(result.groups['group1'].dataTypes['voltage'].files['2025-04-01']).toBeDefined();
      expect(result.groups['group1'].dataTypes['temperature'].files['2025-04-01']).toBeDefined();
      
      // 验证文件信息
      const voltageFile = result.groups['group1'].dataTypes['voltage'].files['2025-04-01'];
      expect(voltageFile.filePath).toContain('vol1_2025_04_01_000000.csv');
      expect(voltageFile.lastModified).toBeDefined();
      expect(voltageFile.fileSize).toBeGreaterThan(0);
    });

    test('应该处理不存在的目录', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent');
      
      const result = await scanner.scanProject2(nonExistentPath);
      
      expect(result.groups).toEqual({});
    });
  });

  describe('watchForChanges', () => {
    test('应该能够启动和停止文件监控', () => {
      const callback = jest.fn();
      const watchPaths = [testDir];

      // 启动监控
      expect(() => {
        scanner.watchForChanges(watchPaths, callback);
      }).not.toThrow();

      // 停止监控
      expect(() => {
        scanner.stopWatching();
      }).not.toThrow();
    });
  });
});
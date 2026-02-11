import { promises as fs } from 'fs';
import path from 'path';

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function createTestDataStructure(): Promise<string> {
  const testDataDir = path.join(__dirname, 'test-data');
  
  // 清理并重新创建测试数据目录
  try {
    await fs.rm(testDataDir, { recursive: true, force: true });
  } catch {
    // 目录不存在，忽略错误
  }
  
  await ensureDirectoryExists(testDataDir);
  
  // 创建项目1测试数据结构
  const project1Dir = path.join(testDataDir, 'project1');
  await ensureDirectoryExists(path.join(project1Dir, '2#'));
  await ensureDirectoryExists(path.join(project1Dir, '14#'));
  await ensureDirectoryExists(path.join(project1Dir, '15#'));
  
  // 创建项目2测试数据结构
  const project2Dir = path.join(testDataDir, 'project2');
  for (let i = 1; i <= 4; i++) {
    const groupDir = path.join(project2Dir, `group${i}`);
    await ensureDirectoryExists(path.join(groupDir, 'voltage'));
    await ensureDirectoryExists(path.join(groupDir, 'soc'));
    await ensureDirectoryExists(path.join(groupDir, 'temperature'));
    await ensureDirectoryExists(path.join(groupDir, 'state'));
  }
  
  // 创建项目2测试文件
  const project2SocFile = path.join(project2Dir, 'group2', 'soc', 'soc2_2025_04_02_000000.csv');
  const socCsvContent = `devInstCode,groupNo,datetime,soc1,soc2,soc3,soc4,soc5,soc6
DEV001,2,2025-04-02 00:00:00,85.5,86.2,84.8,87.1,85.9,86.5
DEV001,2,2025-04-02 00:01:00,85.4,86.1,84.7,87.0,85.8,86.4`;
  
  await fs.writeFile(project2SocFile, socCsvContent);
  
  return testDataDir;
}

export async function cleanupTestData(): Promise<void> {
  const testDataDir = path.join(__dirname, 'test-data');
  try {
    await fs.rm(testDataDir, { recursive: true, force: true });
  } catch {
    // 忽略清理错误
  }
}
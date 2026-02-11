import { promises as fs } from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { FileScanner, FileChangeCallback } from '../interfaces/FileScanner.js';
import { Project1FileStructure, Project2FileStructure } from '../types/index.js';
import { 
  PROJECT1_SYSTEMS, 
  PROJECT2_GROUPS, 
  PROJECT2_DATA_TYPES, 
  PROJECT1_FILE_PATTERN,
  PROJECT2_FILE_PATTERN 
} from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { fileExists, getFileStats } from '../utils/helpers.js';

/**
 * 文件扫描器实现
 * 负责扫描和识别CSV文件结构
 */
export class FileScannerImpl implements FileScanner {
  private watcher: chokidar.FSWatcher | undefined;

  /**
   * 扫描项目1文件结构
   * @param basePath 项目1根目录路径
   * @returns 项目1文件结构
   */
  async scanProject1(basePath: string): Promise<Project1FileStructure> {
    logger.info(`开始扫描项目1文件结构: ${basePath}`);
    
    const structure: Project1FileStructure = {
      systems: {}
    };

    try {
      // 检查基础路径是否存在
      if (!(await fileExists(basePath))) {
        logger.warn(`项目1基础路径不存在: ${basePath}`);
        return structure;
      }

      // 扫描每个系统目录
      for (const systemId of PROJECT1_SYSTEMS) {
        const systemPath = path.join(basePath, systemId);
        
        if (await fileExists(systemPath)) {
          logger.debug(`扫描系统目录: ${systemPath}`);
          structure.systems[systemId] = await this.scanProject1System(systemPath);
        } else {
          logger.warn(`系统目录不存在: ${systemPath}`);
          structure.systems[systemId] = { banks: {} };
        }
      }

      logger.info(`项目1文件扫描完成，找到 ${Object.keys(structure.systems).length} 个系统`);
      return structure;

    } catch (error) {
      logger.error(`扫描项目1文件结构失败: ${error}`);
      throw error;
    }
  }

  /**
   * 扫描项目2文件结构
   * @param basePath 项目2根目录路径
   * @returns 项目2文件结构
   */
  async scanProject2(basePath: string): Promise<Project2FileStructure> {
    logger.info(`开始扫描项目2文件结构: ${basePath}`);
    
    const structure: Project2FileStructure = {
      groups: {}
    };

    try {
      // 检查基础路径是否存在
      if (!(await fileExists(basePath))) {
        logger.warn(`项目2基础路径不存在: ${basePath}`);
        return structure;
      }

      // 扫描每个组目录
      for (const groupId of PROJECT2_GROUPS) {
        const groupPath = path.join(basePath, groupId);
        
        if (await fileExists(groupPath)) {
          logger.debug(`扫描组目录: ${groupPath}`);
          structure.groups[groupId] = await this.scanProject2Group(groupPath);
        } else {
          logger.warn(`组目录不存在: ${groupPath}`);
          structure.groups[groupId] = { dataTypes: {} };
        }
      }

      logger.info(`项目2文件扫描完成，找到 ${Object.keys(structure.groups).length} 个组`);
      return structure;

    } catch (error) {
      logger.error(`扫描项目2文件结构失败: ${error}`);
      throw error;
    }
  }

  /**
   * 监控文件变化
   * @param paths 要监控的路径数组
   * @param callback 文件变化回调函数
   */
  watchForChanges(paths: string[], callback: FileChangeCallback): void {
    logger.info(`开始监控文件变化: ${paths.join(', ')}`);

    // 停止之前的监控
    this.stopWatching();

    // 创建新的监控器
    this.watcher = chokidar.watch(paths, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 忽略初始扫描
      depth: 3 // 限制扫描深度
    });

    // 监听文件事件
    this.watcher
      .on('add', (filePath) => {
        logger.debug(`文件添加: ${filePath}`);
        callback('add', filePath);
      })
      .on('change', (filePath) => {
        logger.debug(`文件修改: ${filePath}`);
        callback('change', filePath);
      })
      .on('unlink', (filePath) => {
        logger.debug(`文件删除: ${filePath}`);
        callback('unlink', filePath);
      })
      .on('error', (error) => {
        logger.error(`文件监控错误: ${error}`);
      });

    logger.info('文件监控已启动');
  }

  /**
   * 停止文件监控
   */
  stopWatching(): void {
    if (this.watcher) {
      logger.info('停止文件监控');
      this.watcher.close();
      this.watcher = undefined;
    }
  }

  /**
   * 扫描项目1的单个系统目录
   * @param systemPath 系统目录路径
   * @returns 系统文件结构
   */
  private async scanProject1System(systemPath: string): Promise<{ banks: Record<string, any> }> {
    const banks: Record<string, any> = {};

    try {
      const files = await fs.readdir(systemPath);
      
      for (const file of files) {
        // 检查是否为CSV文件且符合Bank文件命名规则
        if (file.endsWith('.csv')) {
          const match = file.match(PROJECT1_FILE_PATTERN);
          if (match) {
            const [, bankNumber] = match;
            const bankId = `Bank${bankNumber}`;
            const filePath = path.join(systemPath, file);
            
            // 获取文件统计信息
            const stats = await getFileStats(filePath);
            if (stats) {
              banks[bankId] = {
                filePath,
                lastModified: stats.mtime,
                fileSize: stats.size
              };
              
              logger.debug(`找到Bank文件: ${bankId} -> ${filePath}`);
            }
          } else {
            logger.debug(`跳过不符合命名规则的文件: ${file}`);
          }
        }
      }

    } catch (error) {
      logger.error(`扫描系统目录失败 ${systemPath}: ${error}`);
    }

    return { banks };
  }

  /**
   * 扫描项目2的单个组目录
   * @param groupPath 组目录路径
   * @returns 组文件结构
   */
  private async scanProject2Group(groupPath: string): Promise<{ dataTypes: Record<string, any> }> {
    const dataTypes: Record<string, any> = {};

    try {
      // 扫描每种数据类型目录
      for (const dataType of PROJECT2_DATA_TYPES) {
        const dataTypePath = path.join(groupPath, dataType);
        
        if (await fileExists(dataTypePath)) {
          dataTypes[dataType] = await this.scanProject2DataType(dataTypePath);
        } else {
          logger.debug(`数据类型目录不存在: ${dataTypePath}`);
          dataTypes[dataType] = { files: {} };
        }
      }

    } catch (error) {
      logger.error(`扫描组目录失败 ${groupPath}: ${error}`);
    }

    return { dataTypes };
  }

  /**
   * 扫描项目2的数据类型目录
   * @param dataTypePath 数据类型目录路径
   * @returns 数据类型文件结构
   */
  private async scanProject2DataType(dataTypePath: string): Promise<{ files: Record<string, any> }> {
    const files: Record<string, any> = {};

    try {
      const fileList = await fs.readdir(dataTypePath);
      
      for (const file of fileList) {
        if (file.endsWith('.csv')) {
          const match = file.match(PROJECT2_FILE_PATTERN);
          if (match) {
            const [, , year, month, day] = match;
            const dateKey = `${year}-${month}-${day}`;
            const filePath = path.join(dataTypePath, file);
            
            // 获取文件统计信息
            const stats = await getFileStats(filePath);
            if (stats) {
              files[dateKey] = {
                filePath,
                lastModified: stats.mtime,
                fileSize: stats.size
              };
              
              logger.debug(`找到数据文件: ${dateKey} -> ${filePath}`);
            }
          } else {
            logger.debug(`跳过不符合命名规则的文件: ${file}`);
          }
        }
      }

    } catch (error) {
      logger.error(`扫描数据类型目录失败 ${dataTypePath}: ${error}`);
    }

    return { files };
  }
}
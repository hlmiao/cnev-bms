import { Project1FileStructure, Project2FileStructure } from '../types/index.js';

export type FileChangeCallback = (event: 'add' | 'change' | 'unlink', path: string) => void;

/**
 * 文件扫描器接口
 * 负责扫描和识别CSV文件结构
 */
export interface FileScanner {
  /**
   * 扫描项目1文件结构
   * @param basePath 项目1根目录路径
   * @returns 项目1文件结构
   */
  scanProject1(basePath: string): Promise<Project1FileStructure>;

  /**
   * 扫描项目2文件结构
   * @param basePath 项目2根目录路径
   * @returns 项目2文件结构
   */
  scanProject2(basePath: string): Promise<Project2FileStructure>;

  /**
   * 监控文件变化
   * @param paths 要监控的路径数组
   * @param callback 文件变化回调函数
   */
  watchForChanges(paths: string[], callback: FileChangeCallback): void;

  /**
   * 停止文件监控
   */
  stopWatching(): void;
}
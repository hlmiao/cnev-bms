/**
 * CSV数据服务测试
 */

import { csvDataService } from './csvDataService';

describe('CsvDataService', () => {
  test('should create service instance', () => {
    expect(csvDataService).toBeDefined();
  });

  test('should have required methods', () => {
    expect(typeof csvDataService.loadProject1Data).toBe('function');
    expect(typeof csvDataService.loadProject2Data).toBe('function');
    expect(typeof csvDataService.getProjectDetail).toBe('function');
    expect(typeof csvDataService.convertBankToDisplayData).toBe('function');
    expect(typeof csvDataService.getConversionReports).toBe('function');
    expect(typeof csvDataService.cleanup).toBe('function');
  });

  test('should return empty reports array', async () => {
    const reports = await csvDataService.getConversionReports();
    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBe(0);
  });
});
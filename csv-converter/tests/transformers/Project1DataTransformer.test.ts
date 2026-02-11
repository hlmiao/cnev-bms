import { Project1DataTransformer } from '../../src/transformers/Project1DataTransformer.js';
import { Project1RawData } from '../../src/types/index.js';

describe('Project1DataTransformer', () => {
  let transformer: Project1DataTransformer;

  beforeEach(() => {
    transformer = new Project1DataTransformer();
  });

  describe('transformProject1Data', () => {
    it('应该成功转换基本的项目1数据', async () => {
      // 准备测试数据
      const rawData: Project1RawData = {
        headers: ['时间', '总电压', '总电流', 'SOC', 'SOH', 'V1', 'V2', 'T1', 'T2', 'SOC1', 'SOC2', 'SOH1', 'SOH2'],
        rows: [
          {
            时间: '1/10/2024 10:00',
            总电压: 48.5,
            总电流: 10.2,
            SOC: 85.5,
            SOH: 95.2,
            voltages: [3.2, 3.3, null, null],
            temperatures: [25.5, 26.0, null, null],
            socs: [85.0, 86.0, null, null],
            sohs: [95.0, 95.5, null, null]
          },
          {
            时间: '1/10/2024 11:00',
            总电压: 48.2,
            总电流: 9.8,
            SOC: 84.0,
            SOH: 95.0,
            voltages: [3.1, 3.2, null, null],
            temperatures: [26.0, 26.5, null, null],
            socs: [84.0, 85.0, null, null],
            sohs: [94.8, 95.2, null, null]
          }
        ],
        metadata: {
          systemId: '2#',
          bankId: 'Bank01',
          recordCount: 2,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T11:00:00')
          }
        }
      };

      // 执行转换
      const result = await transformer.transformProject1Data(rawData);

      // 验证结果
      expect(result.projectId).toBe('project1-2#-Bank01');
      expect(result.projectType).toBe('project1');
      expect(result.systemId).toBe('2#');
      expect(result.banks).toHaveLength(1);
      
      const bank = result.banks[0];
      expect(bank.bankId).toBe('Bank01');
      expect(bank.dataPoints).toHaveLength(2);
      
      // 验证第一个数据点
      const firstPoint = bank.dataPoints[0];
      expect(firstPoint.bankData.voltage).toBe(48.5);
      expect(firstPoint.bankData.current).toBe(10.2);
      expect(firstPoint.bankData.soc).toBe(85.5);
      expect(firstPoint.bankData.soh).toBe(95.2);
      expect(firstPoint.bankData.power).toBe(48.5 * 10.2);
      expect(firstPoint.bankData.temperature).toBe(25.75); // (25.5 + 26.0) / 2
      
      // 验证单体数据
      expect(firstPoint.cellData.voltages).toEqual([3.2, 3.3, null, null]);
      expect(firstPoint.cellData.temperatures).toEqual([25.5, 26.0, null, null]);
      expect(firstPoint.cellData.socs).toEqual([85.0, 86.0, null, null]);
      expect(firstPoint.cellData.sohs).toEqual([95.0, 95.5, null, null]);
    });

    it('应该正确处理空值和无效数据', async () => {
      const rawData: Project1RawData = {
        headers: ['时间', '总电压', '总电流', 'SOC', 'SOH'],
        rows: [
          {
            时间: '1/10/2024 10:00',
            总电压: null,
            总电流: null,
            SOC: null,
            SOH: null,
            voltages: [null, null],
            temperatures: [null, null],
            socs: [null, null],
            sohs: [null, null]
          }
        ],
        metadata: {
          systemId: '14#',
          bankId: 'Bank02',
          recordCount: 1,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T10:00:00')
          }
        }
      };

      const result = await transformer.transformProject1Data(rawData);

      expect(result.banks[0].dataPoints).toHaveLength(1);
      const dataPoint = result.banks[0].dataPoints[0];
      
      expect(dataPoint.bankData.voltage).toBe(0);
      expect(dataPoint.bankData.current).toBe(0);
      expect(dataPoint.bankData.soc).toBe(0);
      expect(dataPoint.bankData.soh).toBe(0);
      expect(dataPoint.bankData.power).toBe(0);
      expect(dataPoint.bankData.temperature).toBe(0);
    });

    it('应该正确计算Bank统计信息', async () => {
      const rawData: Project1RawData = {
        headers: ['时间', '总电压', '总电流', 'SOC', 'SOH'],
        rows: [
          {
            时间: '1/10/2024 10:00',
            总电压: 48.0,
            总电流: 10.0,
            SOC: 80.0,
            SOH: 90.0,
            voltages: [],
            temperatures: [20.0],
            socs: [],
            sohs: []
          },
          {
            时间: '1/10/2024 11:00',
            总电压: 50.0,
            总电流: 12.0,
            SOC: 90.0,
            SOH: 95.0,
            voltages: [],
            temperatures: [30.0],
            socs: [],
            sohs: []
          }
        ],
        metadata: {
          systemId: '15#',
          bankId: 'Bank03',
          recordCount: 2,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T11:00:00')
          }
        }
      };

      const result = await transformer.transformProject1Data(rawData);
      const statistics = result.banks[0].statistics;

      expect(statistics.avgVoltage).toBe(49.0); // (48 + 50) / 2
      expect(statistics.avgCurrent).toBe(11.0); // (10 + 12) / 2
      expect(statistics.avgSoc).toBe(85.0); // (80 + 90) / 2
      expect(statistics.avgSoh).toBe(92.5); // (90 + 95) / 2
      expect(statistics.maxVoltage).toBe(50.0);
      expect(statistics.minVoltage).toBe(48.0);
      expect(statistics.maxTemperature).toBe(30.0);
      expect(statistics.minTemperature).toBe(20.0);
    });

    it('应该生成正确的项目摘要', async () => {
      const rawData: Project1RawData = {
        headers: ['时间', '总电压', '总电流', 'SOC', 'SOH'],
        rows: [
          {
            时间: '1/10/2024 10:00',
            总电压: 48.5,
            总电流: 10.2,
            SOC: 85.5,
            SOH: 95.2,
            voltages: [3.2, 3.3],
            temperatures: [25.5, 26.0],
            socs: [85.0, 86.0],
            sohs: [95.0, 95.5]
          }
        ],
        metadata: {
          systemId: '2#',
          bankId: 'Bank01',
          recordCount: 1,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T10:00:00')
          }
        }
      };

      const result = await transformer.transformProject1Data(rawData);
      const summary = result.summary;

      expect(summary.totalRecords).toBe(1);
      expect(summary.validRecords).toBe(1);
      expect(summary.errorRecords).toBe(0);
      expect(summary.dataQuality.completeness).toBe(1.0);
      expect(summary.dataQuality.accuracy).toBeGreaterThan(0);
      expect(summary.dataQuality.consistency).toBe(1.0);
    });

    it('应该按时间戳正确排序数据点', async () => {
      const rawData: Project1RawData = {
        headers: ['时间', '总电压', '总电流', 'SOC', 'SOH'],
        rows: [
          {
            时间: '1/10/2024 12:00', // 较晚的时间
            总电压: 48.0,
            总电流: 10.0,
            SOC: 80.0,
            SOH: 90.0,
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          },
          {
            时间: '1/10/2024 10:00', // 较早的时间
            总电压: 50.0,
            总电流: 12.0,
            SOC: 90.0,
            SOH: 95.0,
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        ],
        metadata: {
          systemId: '2#',
          bankId: 'Bank01',
          recordCount: 2,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T12:00:00')
          }
        }
      };

      const result = await transformer.transformProject1Data(rawData);
      const dataPoints = result.banks[0].dataPoints;

      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0].timestamp.getTime()).toBeLessThan(dataPoints[1].timestamp.getTime());
      expect(dataPoints[0].bankData.voltage).toBe(50.0); // 较早时间的数据
      expect(dataPoints[1].bankData.voltage).toBe(48.0); // 较晚时间的数据
    });
  });

  describe('validateTransformResult', () => {
    it('应该验证有效的转换结果', () => {
      const validData = {
        projectId: 'project1-2#-Bank01',
        projectType: 'project1' as const,
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-10T10:00:00'),
          end: new Date('2024-01-10T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-10T10:00:00'),
                bankData: {
                  voltage: 48.5,
                  current: 10.2,
                  soc: 85.5,
                  soh: 95.2,
                  power: 494.7,
                  temperature: 25.0
                },
                cellData: {
                  voltages: [3.2, 3.3],
                  temperatures: [25.0, 26.0],
                  socs: [85.0, 86.0],
                  sohs: [95.0, 95.5]
                }
              }
            ],
            statistics: {
              avgVoltage: 48.5,
              avgCurrent: 10.2,
              avgSoc: 85.5,
              avgSoh: 95.2,
              maxVoltage: 48.5,
              minVoltage: 48.5,
              maxTemperature: 25.0,
              minTemperature: 25.0
            }
          }
        ],
        summary: {
          totalRecords: 1,
          validRecords: 1,
          errorRecords: 0,
          timeRange: {
            start: new Date('2024-01-10T10:00:00'),
            end: new Date('2024-01-10T11:00:00')
          },
          dataQuality: {
            completeness: 1.0,
            accuracy: 0.9,
            consistency: 1.0
          }
        }
      };

      const isValid = transformer.validateTransformResult(validData);
      expect(isValid).toBe(true);
    });

    it('应该拒绝缺少必需字段的结果', () => {
      const invalidData = {
        projectId: '', // 空的projectId
        projectType: 'project1' as const,
        // 缺少 systemId
        timeRange: {
          start: new Date(),
          end: new Date()
        },
        banks: [],
        summary: {} as any
      };

      const isValid = transformer.validateTransformResult(invalidData);
      expect(isValid).toBe(false);
    });

    it('应该拒绝错误项目类型的结果', () => {
      const invalidData = {
        projectId: 'test',
        projectType: 'project2' as const, // 错误的项目类型
        systemId: '2#',
        timeRange: {
          start: new Date(),
          end: new Date()
        },
        banks: [],
        summary: {} as any
      };

      const isValid = transformer.validateTransformResult(invalidData);
      expect(isValid).toBe(false);
    });

    it('应该拒绝缺少Bank数据的结果', () => {
      const invalidData = {
        projectId: 'project1-2#-Bank01',
        projectType: 'project1' as const,
        systemId: '2#',
        timeRange: {
          start: new Date(),
          end: new Date()
        },
        banks: [], // 空的banks数组
        summary: {} as any
      };

      const isValid = transformer.validateTransformResult(invalidData);
      expect(isValid).toBe(false);
    });

    it('应该拒绝时间序列未排序的结果', () => {
      const invalidData = {
        projectId: 'project1-2#-Bank01',
        projectType: 'project1' as const,
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-10T10:00:00'),
          end: new Date('2024-01-10T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-10T11:00:00'), // 较晚的时间在前
                bankData: {
                  voltage: 48.5,
                  current: 10.2,
                  soc: 85.5,
                  soh: 95.2,
                  power: 494.7,
                  temperature: 25.0
                },
                cellData: {
                  voltages: [],
                  temperatures: [],
                  socs: [],
                  sohs: []
                }
              },
              {
                timestamp: new Date('2024-01-10T10:00:00'), // 较早的时间在后
                bankData: {
                  voltage: 48.0,
                  current: 10.0,
                  soc: 85.0,
                  soh: 95.0,
                  power: 480.0,
                  temperature: 24.0
                },
                cellData: {
                  voltages: [],
                  temperatures: [],
                  socs: [],
                  sohs: []
                }
              }
            ],
            statistics: {} as any
          }
        ],
        summary: {} as any
      };

      const isValid = transformer.validateTransformResult(invalidData);
      expect(isValid).toBe(false);
    });
  });
});
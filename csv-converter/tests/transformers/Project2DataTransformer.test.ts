import { Project2DataTransformer } from '../../src/transformers/Project2DataTransformer.js';
import { Project2RawData } from '../../src/types/index.js';

describe('Project2DataTransformer', () => {
  let transformer: Project2DataTransformer;

  beforeEach(() => {
    transformer = new Project2DataTransformer();
  });

  describe('transformProject2Data', () => {
    it('应该成功转换基本的项目2数据', async () => {
      // 准备测试数据 - 模拟不同数据类型的文件
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol', 'bankCur', 'vol1', 'vol2', 'vol3'],
        rows: [
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 10:00:00',
            bankVol: 48.5,
            bankCur: 10.2,
            values: [3.2, 3.3, 3.1, null, null]
          },
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 11:00:00',
            bankVol: 48.2,
            bankCur: 9.8,
            values: [3.1, 3.2, 3.0, null, null]
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'voltage',
          date: '2025-04-01',
          recordCount: 2
        }
      };

      const temperatureData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'temp1', 'temp2', 'temp3'],
        rows: [
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 10:00:00',
            values: [25.5, 26.0, 24.8, null, null]
          },
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 11:00:00',
            values: [26.0, 26.5, 25.2, null, null]
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'temperature',
          date: '2025-04-01',
          recordCount: 2
        }
      };

      const socData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'soc1', 'soc2', 'soc3'],
        rows: [
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 10:00:00',
            values: [85.0, 86.0, 84.5, null, null]
          },
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 11:00:00',
            values: [84.0, 85.0, 83.5, null, null]
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'soc',
          date: '2025-04-01',
          recordCount: 2
        }
      };

      const stateData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'state1', 'state2', 'state3'],
        rows: [
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 10:00:00',
            values: [95.0, 95.5, 94.8, null, null]
          },
          {
            devInstCode: 'DEV001',
            groupNo: 1,
            datetime: '2025-04-01 11:00:00',
            values: [94.8, 95.2, 94.5, null, null]
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'state',
          date: '2025-04-01',
          recordCount: 2
        }
      };

      const rawDataArray = [voltageData, temperatureData, socData, stateData];

      // 执行转换
      const result = await transformer.transformProject2Data(rawDataArray);

      // 验证结果
      expect(result.projectId).toBe('project2-group1');
      expect(result.projectType).toBe('project2');
      expect(result.groupId).toBe('group1');
      expect(result.banks).toHaveLength(1);
      
      const bank = result.banks[0];
      expect(bank.bankId).toBe('group1-combined');
      expect(bank.dataPoints).toHaveLength(2);
      
      // 验证第一个数据点
      const firstPoint = bank.dataPoints[0];
      expect(firstPoint.bankData.voltage).toBe(48.5);
      expect(firstPoint.bankData.current).toBe(10.2);
      expect(firstPoint.bankData.power).toBe(48.5 * 10.2);
      expect(firstPoint.bankData.temperature).toBeCloseTo(25.43, 1); // (25.5 + 26.0 + 24.8) / 3
      expect(firstPoint.bankData.soc).toBeCloseTo(85.17, 1); // (85.0 + 86.0 + 84.5) / 3
      expect(firstPoint.bankData.soh).toBeCloseTo(95.1, 1); // (95.0 + 95.5 + 94.8) / 3
      
      // 验证单体数据
      expect(firstPoint.cellData.voltages).toEqual([3.2, 3.3, 3.1, null, null]);
      expect(firstPoint.cellData.temperatures).toEqual([25.5, 26.0, 24.8, null, null]);
      expect(firstPoint.cellData.socs).toEqual([85.0, 86.0, 84.5, null, null]);
      expect(firstPoint.cellData.sohs).toEqual([95.0, 95.5, 94.8, null, null]);
    });

    it('应该正确处理缺少某些数据类型的情况', async () => {
      // 只提供电压和温度数据
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol', 'bankCur', 'vol1', 'vol2'],
        rows: [
          {
            devInstCode: 'DEV002',
            groupNo: 2,
            datetime: '2025-04-02 10:00:00',
            bankVol: 50.0,
            bankCur: 12.0,
            values: [3.3, 3.4, null, null]
          }
        ],
        metadata: {
          groupId: 'group2',
          dataType: 'voltage',
          date: '2025-04-02',
          recordCount: 1
        }
      };

      const temperatureData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'temp1', 'temp2'],
        rows: [
          {
            devInstCode: 'DEV002',
            groupNo: 2,
            datetime: '2025-04-02 10:00:00',
            values: [28.0, 29.0, null, null]
          }
        ],
        metadata: {
          groupId: 'group2',
          dataType: 'temperature',
          date: '2025-04-02',
          recordCount: 1
        }
      };

      const rawDataArray = [voltageData, temperatureData];

      const result = await transformer.transformProject2Data(rawDataArray);

      expect(result.banks[0].dataPoints).toHaveLength(1);
      const dataPoint = result.banks[0].dataPoints[0];
      
      expect(dataPoint.bankData.voltage).toBe(50.0);
      expect(dataPoint.bankData.current).toBe(12.0);
      expect(dataPoint.bankData.temperature).toBe(28.5); // (28.0 + 29.0) / 2
      expect(dataPoint.bankData.soc).toBe(0); // 缺少SOC数据
      expect(dataPoint.bankData.soh).toBe(0); // 缺少state数据
    });

    it('应该正确计算Bank统计信息', async () => {
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol', 'bankCur'],
        rows: [
          {
            devInstCode: 'DEV003',
            groupNo: 3,
            datetime: '2025-04-03 10:00:00',
            bankVol: 45.0,
            bankCur: 8.0,
            values: []
          },
          {
            devInstCode: 'DEV003',
            groupNo: 3,
            datetime: '2025-04-03 11:00:00',
            bankVol: 55.0,
            bankCur: 12.0,
            values: []
          }
        ],
        metadata: {
          groupId: 'group3',
          dataType: 'voltage',
          date: '2025-04-03',
          recordCount: 2
        }
      };

      const temperatureData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'temp1'],
        rows: [
          {
            devInstCode: 'DEV003',
            groupNo: 3,
            datetime: '2025-04-03 10:00:00',
            values: [20.0]
          },
          {
            devInstCode: 'DEV003',
            groupNo: 3,
            datetime: '2025-04-03 11:00:00',
            values: [30.0]
          }
        ],
        metadata: {
          groupId: 'group3',
          dataType: 'temperature',
          date: '2025-04-03',
          recordCount: 2
        }
      };

      const rawDataArray = [voltageData, temperatureData];

      const result = await transformer.transformProject2Data(rawDataArray);
      const statistics = result.banks[0].statistics;

      expect(statistics.avgVoltage).toBe(50.0); // (45 + 55) / 2
      expect(statistics.avgCurrent).toBe(10.0); // (8 + 12) / 2
      expect(statistics.maxVoltage).toBe(55.0);
      expect(statistics.minVoltage).toBe(45.0);
      expect(statistics.maxTemperature).toBe(30.0);
      expect(statistics.minTemperature).toBe(20.0);
    });

    it('应该生成正确的项目摘要', async () => {
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol', 'bankCur', 'vol1'],
        rows: [
          {
            devInstCode: 'DEV004',
            groupNo: 4,
            datetime: '2025-04-04 10:00:00',
            bankVol: 48.0,
            bankCur: 10.0,
            values: [3.2]
          }
        ],
        metadata: {
          groupId: 'group4',
          dataType: 'voltage',
          date: '2025-04-04',
          recordCount: 1
        }
      };

      const rawDataArray = [voltageData];

      const result = await transformer.transformProject2Data(rawDataArray);
      const summary = result.summary;

      expect(summary.totalRecords).toBe(1);
      expect(summary.validRecords).toBe(1);
      expect(summary.errorRecords).toBe(0);
      expect(summary.dataQuality.completeness).toBe(1.0);
      expect(summary.dataQuality.accuracy).toBeGreaterThan(0);
      expect(summary.dataQuality.consistency).toBe(0.25); // 1/4 数据类型
    });

    it('应该按时间戳正确排序数据点', async () => {
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol', 'bankCur'],
        rows: [
          {
            devInstCode: 'DEV005',
            groupNo: 1,
            datetime: '2025-04-05 12:00:00', // 较晚的时间
            bankVol: 48.0,
            bankCur: 10.0,
            values: []
          },
          {
            devInstCode: 'DEV005',
            groupNo: 1,
            datetime: '2025-04-05 10:00:00', // 较早的时间
            bankVol: 50.0,
            bankCur: 12.0,
            values: []
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'voltage',
          date: '2025-04-05',
          recordCount: 2
        }
      };

      const rawDataArray = [voltageData];

      const result = await transformer.transformProject2Data(rawDataArray);
      const dataPoints = result.banks[0].dataPoints;

      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0].timestamp.getTime()).toBeLessThan(dataPoints[1].timestamp.getTime());
      expect(dataPoints[0].bankData.voltage).toBe(50.0); // 较早时间的数据
      expect(dataPoints[1].bankData.voltage).toBe(48.0); // 较晚时间的数据
    });

    it('应该正确处理空数据数组', async () => {
      await expect(transformer.transformProject2Data([])).rejects.toThrow('项目2原始数据数组不能为空');
    });

    it('应该正确建立多维索引结构', async () => {
      const voltageData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'bankVol'],
        rows: [
          {
            devInstCode: 'DEV006',
            groupNo: 1,
            datetime: '2025-04-06 10:00:00',
            values: []
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'voltage',
          date: '2025-04-06',
          recordCount: 1
        }
      };

      const socData: Project2RawData = {
        headers: ['devInstCode', 'groupNo', 'datetime', 'soc1'],
        rows: [
          {
            devInstCode: 'DEV006',
            groupNo: 1,
            datetime: '2025-04-06 10:00:00',
            values: [85.0]
          }
        ],
        metadata: {
          groupId: 'group1',
          dataType: 'soc',
          date: '2025-04-06',
          recordCount: 1
        }
      };

      const rawDataArray = [voltageData, socData];

      const result = await transformer.transformProject2Data(rawDataArray);

      // 验证多维索引结构通过数据质量一致性体现
      expect(result.summary.dataQuality.consistency).toBe(0.5); // 2/4 数据类型
      expect(result.banks[0].dataPoints).toHaveLength(1);
    });
  });

  describe('validateTransformResult', () => {
    it('应该验证有效的转换结果', () => {
      const validData = {
        projectId: 'project2-group1',
        projectType: 'project2' as const,
        groupId: 'group1',
        timeRange: {
          start: new Date('2025-04-01T10:00:00'),
          end: new Date('2025-04-01T11:00:00')
        },
        banks: [
          {
            bankId: 'group1-combined',
            dataPoints: [
              {
                timestamp: new Date('2025-04-01T10:00:00'),
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
            start: new Date('2025-04-01T10:00:00'),
            end: new Date('2025-04-01T11:00:00')
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
        projectId: '',
        projectType: 'project2' as const,
        // 缺少 groupId
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
        projectType: 'project1' as const, // 错误的项目类型
        groupId: 'group1',
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
        projectId: 'project2-group1',
        projectType: 'project2' as const,
        groupId: 'group1',
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
        projectId: 'project2-group1',
        projectType: 'project2' as const,
        groupId: 'group1',
        timeRange: {
          start: new Date('2025-04-01T10:00:00'),
          end: new Date('2025-04-01T11:00:00')
        },
        banks: [
          {
            bankId: 'group1-combined',
            dataPoints: [
              {
                timestamp: new Date('2025-04-01T11:00:00'), // 较晚的时间在前
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
                timestamp: new Date('2025-04-01T10:00:00'), // 较早的时间在后
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
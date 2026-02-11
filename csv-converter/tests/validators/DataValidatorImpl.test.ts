import { DataValidatorImpl } from '../../src/validators/DataValidatorImpl.js';
import { StandardBatteryData, TimeSeriesPoint } from '../../src/types/index.js';

describe('DataValidatorImpl', () => {
  let validator: DataValidatorImpl;

  beforeEach(() => {
    validator = new DataValidatorImpl();
  });

  describe('validateData', () => {
    it('应该验证有效的标准数据', async () => {
      const validData: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
                bankData: {
                  voltage: 48.5,
                  current: 10.2,
                  soc: 85.5,
                  soh: 95.2,
                  power: 494.7,
                  temperature: 25.0
                },
                cellData: {
                  voltages: [3.2, 3.3, 3.1],
                  temperatures: [25.0, 26.0, 24.5],
                  socs: [85.0, 86.0, 84.5],
                  sohs: [95.0, 95.5, 94.8]
                }
              },
              {
                timestamp: new Date('2024-01-01T11:00:00'),
                bankData: {
                  voltage: 48.2,
                  current: 9.8,
                  soc: 84.0,
                  soh: 95.0,
                  power: 472.36,
                  temperature: 26.0
                },
                cellData: {
                  voltages: [3.1, 3.2, 3.0],
                  temperatures: [26.0, 27.0, 25.5],
                  socs: [84.0, 85.0, 83.5],
                  sohs: [94.8, 95.2, 94.5]
                }
              }
            ],
            statistics: {
              avgVoltage: 48.35,
              avgCurrent: 10.0,
              avgSoc: 84.75,
              avgSoh: 95.1,
              maxVoltage: 48.5,
              minVoltage: 48.2,
              maxTemperature: 26.0,
              minTemperature: 25.0
            }
          }
        ],
        summary: {
          totalRecords: 2,
          validRecords: 2,
          errorRecords: 0,
          timeRange: {
            start: new Date('2024-01-01T10:00:00'),
            end: new Date('2024-01-01T11:00:00')
          },
          dataQuality: {
            completeness: 1.0,
            accuracy: 0.95,
            consistency: 0.98
          }
        }
      };

      const result = await validator.validateData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.totalRecords).toBe(2);
      expect(result.statistics.validRecords).toBe(2);
      expect(result.statistics.errorRate).toBe(0);
    });

    it('应该检测缺少必需字段的数据', async () => {
      const invalidData = {
        // 缺少 projectId
        projectType: 'project1',
        timeRange: {
          start: new Date(),
          end: new Date()
        },
        banks: [],
        summary: {} as any
      } as unknown as StandardBatteryData;

      const result = await validator.validateData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'projectId')).toBe(true);
      expect(result.errors.some(e => e.field === 'banks')).toBe(true);
    });

    it('应该检测数据范围异常', async () => {
      const dataWithOutliers: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
                bankData: {
                  voltage: 150.0, // 异常高电压
                  current: 10.2,
                  soc: 150.0, // 异常高SOC
                  soh: 95.2,
                  power: 494.7,
                  temperature: -50.0 // 异常低温度
                },
                cellData: {
                  voltages: [3.2, 3.3],
                  temperatures: [25.0, 26.0],
                  socs: [85.0, 86.0],
                  sohs: [95.0, 95.5]
                }
              }
            ],
            statistics: {} as any
          }
        ],
        summary: {} as any
      };

      const result = await validator.validateData(dataWithOutliers);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.field === 'voltage')).toBe(true);
      expect(result.warnings.some(w => w.field === 'soc')).toBe(true);
      expect(result.warnings.some(w => w.field === 'temperature')).toBe(true);
    });

    it('应该检测时间序列连续性问题', async () => {
      const dataWithTimeGaps: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T15:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
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
              },
              {
                timestamp: new Date('2024-01-01T15:00:00'), // 5小时间隙
                bankData: {
                  voltage: 48.2,
                  current: 9.8,
                  soc: 84.0,
                  soh: 95.0,
                  power: 472.36,
                  temperature: 26.0
                },
                cellData: {
                  voltages: [3.1, 3.2],
                  temperatures: [26.0, 27.0],
                  socs: [84.0, 85.0],
                  sohs: [94.8, 95.2]
                }
              }
            ],
            statistics: {} as any
          }
        ],
        summary: {} as any
      };

      const result = await validator.validateData(dataWithTimeGaps);

      expect(result.warnings.some(w => w.type === 'format_inconsistency' && w.field === 'timestamp')).toBe(true);
    });
  });

  describe('detectAnomalies', () => {
    it('应该检测电压异常', async () => {
      const dataPoints: TimeSeriesPoint[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          bankData: {
            voltage: 48.0,
            current: 10.0,
            soc: 85.0,
            soh: 95.0,
            power: 480.0,
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
          timestamp: new Date('2024-01-01T11:00:00'),
          bankData: {
            voltage: 48.2,
            current: 10.2,
            soc: 85.5,
            soh: 95.2,
            power: 491.64,
            temperature: 25.5
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        },
        {
          timestamp: new Date('2024-01-01T12:00:00'),
          bankData: {
            voltage: 200.0, // 极端异常高电压
            current: 10.1,
            soc: 85.2,
            soh: 95.1,
            power: 2020.0,
            temperature: 25.2
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        }
      ];

      const result = await validator.detectAnomalies(dataPoints);

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies.some(a => a.type === 'voltage_outlier')).toBe(true);
      expect(result.summary.totalAnomalies).toBeGreaterThan(0);
    });

    it('应该检测SOC和SOH范围异常', async () => {
      const dataPoints: TimeSeriesPoint[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          bankData: {
            voltage: 48.0,
            current: 10.0,
            soc: 150.0, // 超出范围
            soh: -10.0, // 超出范围
            power: 480.0,
            temperature: 25.0
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        }
      ];

      const result = await validator.detectAnomalies(dataPoints);

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies.some(a => a.type === 'soc_outlier')).toBe(true);
      expect(result.anomalies.some(a => a.message.includes('SOC值超出有效范围'))).toBe(true);
      expect(result.anomalies.some(a => a.message.includes('SOH值超出有效范围'))).toBe(true);
    });

    it('应该检测缺失数据', async () => {
      const dataPoints: TimeSeriesPoint[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          bankData: {
            voltage: NaN, // 缺失
            current: null as any, // 缺失
            soc: 85.0,
            soh: 95.0,
            power: 480.0,
            temperature: 25.0
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        }
      ];

      const result = await validator.detectAnomalies(dataPoints);

      expect(result.anomalies.some(a => a.type === 'missing_data')).toBe(true);
      expect(result.anomalies.some(a => a.message.includes('voltage'))).toBe(true);
      expect(result.anomalies.some(a => a.message.includes('current'))).toBe(true);
    });

    it('应该检测时间间隙', async () => {
      const dataPoints: TimeSeriesPoint[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00'),
          bankData: {
            voltage: 48.0,
            current: 10.0,
            soc: 85.0,
            soh: 95.0,
            power: 480.0,
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
          timestamp: new Date('2024-01-01T15:00:00'), // 5小时间隙
          bankData: {
            voltage: 48.5,
            current: 10.2,
            soc: 85.5,
            soh: 95.2,
            power: 494.7,
            temperature: 25.5
          },
          cellData: {
            voltages: [],
            temperatures: [],
            socs: [],
            sohs: []
          }
        }
      ];

      const result = await validator.detectAnomalies(dataPoints);

      expect(result.anomalies.some(a => a.type === 'time_gap')).toBe(true);
      expect(result.anomalies.some(a => a.message.includes('时间间隙'))).toBe(true);
    });
  });

  describe('generateQualityReport', () => {
    it('应该生成完整的质量报告', async () => {
      const data: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
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
              },
              {
                timestamp: new Date('2024-01-01T11:00:00'),
                bankData: {
                  voltage: 48.2,
                  current: 9.8,
                  soc: 84.0,
                  soh: 95.0,
                  power: 472.36,
                  temperature: 26.0
                },
                cellData: {
                  voltages: [3.1, 3.2],
                  temperatures: [26.0, 27.0],
                  socs: [84.0, 85.0],
                  sohs: [94.8, 95.2]
                }
              }
            ],
            statistics: {} as any
          }
        ],
        summary: {} as any
      };

      const report = await validator.generateQualityReport(data);

      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.completeness).toBeGreaterThan(0);
      expect(report.accuracy).toBeGreaterThanOrEqual(0);
      expect(report.consistency).toBeGreaterThan(0);
      expect(report.timeliness).toBeGreaterThan(0);
      expect(report.anomalyCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('应该为低质量数据生成相应建议', async () => {
      const lowQualityData: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        systemId: '2#',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T15:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
                bankData: {
                  voltage: NaN, // 缺失数据
                  current: 200.0, // 异常值
                  soc: 150.0, // 超出范围
                  soh: 95.2,
                  power: 494.7,
                  temperature: 25.0
                },
                cellData: {
                  voltages: [null, null], // 大量缺失
                  temperatures: [null, null],
                  socs: [null, null],
                  sohs: [null, null]
                }
              },
              {
                timestamp: new Date('2024-01-01T15:00:00'), // 大时间间隙
                bankData: {
                  voltage: 48.2,
                  current: 9.8,
                  soc: 84.0,
                  soh: 95.0,
                  power: 472.36,
                  temperature: 26.0
                },
                cellData: {
                  voltages: [3.1, 3.2],
                  temperatures: [26.0, 27.0],
                  socs: [84.0, 85.0],
                  sohs: [94.8, 95.2]
                }
              }
            ],
            statistics: {} as any
          }
        ],
        summary: {} as any
      };

      const report = await validator.generateQualityReport(lowQualityData);

      expect(report.overallScore).toBeLessThan(0.8);
      expect(report.recommendations.some(r => r.includes('完整性'))).toBe(true);
      expect(report.recommendations.some(r => r.includes('异常值'))).toBe(true);
      expect(report.recommendations.some(r => r.includes('时间间隙'))).toBe(true);
    });
  });

  describe('checkDataCompleteness', () => {
    it('应该正确计算数据完整性', () => {
      const completeData: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date(),
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
            statistics: {} as any
          }
        ]
      } as StandardBatteryData;

      const completeness = validator.checkDataCompleteness(completeData);
      expect(completeness).toBeGreaterThan(0.8);
    });

    it('应该检测不完整的数据', () => {
      const incompleteData: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date(),
                bankData: {
                  voltage: 0, // 被认为是无效值
                  current: NaN,
                  soc: null as any,
                  soh: 95.2,
                  power: 494.7,
                  temperature: 25.0
                },
                cellData: {
                  voltages: [null, null],
                  temperatures: [null, null],
                  socs: [null, null],
                  sohs: [null, null]
                }
              }
            ],
            statistics: {} as any
          }
        ]
      } as StandardBatteryData;

      const completeness = validator.checkDataCompleteness(incompleteData);
      expect(completeness).toBeLessThan(0.5);
    });
  });

  describe('checkDataConsistency', () => {
    it('应该检测数据一致性', () => {
      const consistentData: StandardBatteryData = {
        projectId: 'test-project',
        projectType: 'project1',
        timeRange: {
          start: new Date('2024-01-01T10:00:00'),
          end: new Date('2024-01-01T11:00:00')
        },
        banks: [
          {
            bankId: 'Bank01',
            dataPoints: [
              {
                timestamp: new Date('2024-01-01T10:00:00'),
                bankData: {
                  voltage: 48.5, // 在正常范围内
                  current: 10.2,
                  soc: 85.5, // 在正常范围内
                  soh: 95.2, // 在正常范围内
                  power: 494.7,
                  temperature: 25.0 // 在正常范围内
                },
                cellData: {
                  voltages: [],
                  temperatures: [],
                  socs: [],
                  sohs: []
                }
              },
              {
                timestamp: new Date('2024-01-01T11:00:00'), // 正确排序
                bankData: {
                  voltage: 48.2,
                  current: 9.8,
                  soc: 84.0,
                  soh: 95.0,
                  power: 472.36,
                  temperature: 26.0
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
        summary: {
          totalRecords: 2,
          validRecords: 2,
          errorRecords: 0,
          timeRange: {
            start: new Date('2024-01-01T10:00:00'),
            end: new Date('2024-01-01T11:00:00')
          },
          dataQuality: {
            completeness: 1.0,
            accuracy: 0.95,
            consistency: 0.98
          }
        }
      };

      const consistency = validator.checkDataConsistency(consistentData);
      expect(consistency).toBeGreaterThan(0.7);
    });
  });
});
import type { Insight } from '../types';
import { calculateMean, calculateStdDev } from '../utils/calculations';
import { ALERT_THRESHOLDS } from '../utils/constants';

let insightIdCounter = 0;

const generateInsightId = (): string => {
  return `insight-${++insightIdCounter}`;
};

// 检测电压离群值
export const detectVoltageOutliers = (
  voltages: (number | null)[],
  _bankId: string
): Insight[] => {
  const insights: Insight[] = [];
  const validVoltages = voltages.filter((v): v is number => v !== null);
  const mean = calculateMean(validVoltages);
  const threshold = 0.03; // 30mV

  const outliers: number[] = [];
  voltages.forEach((v, i) => {
    if (v !== null && Math.abs(v - mean) > threshold) {
      outliers.push(i + 1);
    }
  });

  if (outliers.length > 0) {
    insights.push({
      id: generateInsightId(),
      type: 'voltage_outlier',
      level: outliers.length > 5 ? 'error' : 'warning',
      title: `发现${outliers.length}个电压异常单体`,
      description: `单体编号: ${outliers.slice(0, 5).join(', ')}${outliers.length > 5 ? '...' : ''}`,
      relatedData: [
        { label: '平均电压', value: `${mean.toFixed(3)}V` },
        { label: '异常数量', value: outliers.length },
      ],
      affectedCells: outliers,
      suggestion: '建议检查这些单体的连接状态和均衡情况',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
};

// 检测温度异常
export const detectTemperatureAnomalies = (
  temperatures: (number | null)[],
  _bankId: string
): Insight[] => {
  const insights: Insight[] = [];
  const validTemps = temperatures.filter((v): v is number => v !== null);
  const max = Math.max(...validTemps);
  const min = Math.min(...validTemps);
  const diff = max - min;

  if (max > ALERT_THRESHOLDS.temperature.high) {
    const highTempCells = temperatures
      .map((t, i) => (t !== null && t > 30 ? i + 1 : null))
      .filter((i): i is number => i !== null);

    insights.push({
      id: generateInsightId(),
      type: 'temperature_anomaly',
      level: max > 35 ? 'error' : 'warning',
      title: '温度偏高',
      description: `最高温度${max}°C，${highTempCells.length}个温度点超过30°C`,
      relatedData: [
        { label: '最高温度', value: `${max}°C` },
        { label: '最低温度', value: `${min}°C` },
        { label: '温差', value: `${diff}°C` },
      ],
      affectedCells: highTempCells,
      suggestion: '检查散热系统和环境温度',
      timestamp: new Date().toISOString(),
    });
  }

  if (diff > ALERT_THRESHOLDS.temperature.diff) {
    insights.push({
      id: generateInsightId(),
      type: 'temperature_anomaly',
      level: 'warning',
      title: '温差过大',
      description: `温差${diff}°C超过阈值${ALERT_THRESHOLDS.temperature.diff}°C`,
      relatedData: [
        { label: '温差', value: `${diff}°C` },
        { label: '阈值', value: `${ALERT_THRESHOLDS.temperature.diff}°C` },
      ],
      suggestion: '检查温度分布是否均匀',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
};

// 检测SOC不均衡
export const detectSocImbalance = (
  socs: (number | null)[],
  _bankId: string
): Insight[] => {
  const insights: Insight[] = [];
  const validSocs = socs.filter((v): v is number => v !== null);
  const max = Math.max(...validSocs);
  const min = Math.min(...validSocs);
  const diff = max - min;
  const stdDev = calculateStdDev(validSocs);

  if (diff > 5) {
    insights.push({
      id: generateInsightId(),
      type: 'soc_imbalance',
      level: diff > 10 ? 'error' : 'warning',
      title: 'SOC不均衡',
      description: `SOC差值${diff}%，标准差${stdDev.toFixed(2)}%`,
      relatedData: [
        { label: '最高SOC', value: `${max}%` },
        { label: '最低SOC', value: `${min}%` },
        { label: '差值', value: `${diff}%` },
      ],
      suggestion: '建议进行均衡充电',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
};

// 生成所有洞察
export const generateInsights = (
  voltages: (number | null)[],
  temperatures: (number | null)[],
  socs: (number | null)[],
  bankId: string
): Insight[] => {
  const insights: Insight[] = [];

  insights.push(...detectVoltageOutliers(voltages, bankId));
  insights.push(...detectTemperatureAnomalies(temperatures, bankId));
  insights.push(...detectSocImbalance(socs, bankId));

  // 添加正常状态洞察
  if (insights.length === 0) {
    insights.push({
      id: generateInsightId(),
      type: 'data_quality',
      level: 'info',
      title: '数据正常',
      description: '未发现明显异常',
      relatedData: [],
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
};

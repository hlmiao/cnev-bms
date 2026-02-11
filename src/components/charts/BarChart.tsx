import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BarChartProps {
  data: number[];
  bins?: number;
  title?: string;
  xAxisLabel?: string;
  color?: string;
}

export const BarChart = ({
  data,
  bins = 10,
  title = '',
  xAxisLabel = '',
  color = '#1890ff',
}: BarChartProps) => {
  // 计算直方图数据
  const validData = data.filter((v) => v !== null && !isNaN(v));
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const binWidth = (max - min) / bins;

  const histogram: number[] = new Array(bins).fill(0);
  const labels: string[] = [];

  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    labels.push(`${binStart.toFixed(2)}`);
    
    validData.forEach((v) => {
      if (v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)) {
        histogram[i]++;
      }
    });
  }

  // 计算统计值
  const avg = validData.reduce((a, b) => a + b, 0) / validData.length;
  const stdDev = Math.sqrt(
    validData.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / validData.length
  );

  const option: EChartsOption = {
    title: {
      text: title,
      subtext: `均值: ${avg.toFixed(3)} | 标准差: ${stdDev.toFixed(3)}`,
      left: 'center',
      textStyle: { fontSize: 14 },
      subtextStyle: { fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      top: 60,
      bottom: 40,
      left: 50,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: labels,
      name: xAxisLabel,
      axisLabel: { fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: '数量',
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: histogram,
        itemStyle: { color },
        barWidth: '80%',
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '300px', width: '100%' }}
    />
  );
};

export default BarChart;

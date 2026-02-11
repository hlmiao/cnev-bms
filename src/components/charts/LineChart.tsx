import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface SeriesData {
  name: string;
  data: number[];
  color?: string;
}

interface LineChartProps {
  xAxisData: string[];
  series: SeriesData[];
  title?: string;
  yAxisName?: string;
  height?: string;
}

export const LineChart = ({
  xAxisData,
  series,
  title = '',
  yAxisName = '',
  height = '300px',
}: LineChartProps) => {
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: series.map((s) => s.name),
      bottom: 0,
    },
    grid: {
      top: title ? 50 : 30,
      bottom: 50,
      left: 60,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      axisLabel: { fontSize: 10 },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
      },
    ],
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: s.color ? { color: s.color } : undefined,
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
    />
  );
};

export default LineChart;

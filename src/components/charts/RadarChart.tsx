import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface RadarChartProps {
  data: {
    voltage: number;
    temperature: number;
    soc: number;
    resistance?: number;
  };
  title?: string;
}

export const RadarChart = ({ data, title = '一致性评估' }: RadarChartProps) => {
  const indicators = [
    { name: '电压一致性', max: 100 },
    { name: '温度一致性', max: 100 },
    { name: 'SOC一致性', max: 100 },
    { name: '内阻一致性', max: 100 },
  ];

  const values = [
    data.voltage,
    data.temperature,
    data.soc,
    data.resistance ?? 0,
  ];

  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: indicators,
      radius: '65%',
      center: ['50%', '55%'],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '一致性评分',
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
            lineStyle: {
              color: '#1890ff',
            },
            itemStyle: {
              color: '#1890ff',
            },
          },
        ],
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

export default RadarChart;

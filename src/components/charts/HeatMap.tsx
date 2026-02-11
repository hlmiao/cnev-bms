import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HeatMapProps {
  data: (number | null)[];
  rows: number;
  cols: number;
  title?: string;
  colorRange?: [string, string, string];
  valueRange?: [number, number];
  unit?: string;
  onCellClick?: (index: number, value: number | null) => void;
}

export const HeatMap = ({
  data,
  rows,
  cols,
  title = '',
  colorRange = ['#3182bd', '#31a354', '#e6550d'],
  valueRange,
  unit = '',
  onCellClick,
}: HeatMapProps) => {
  const { chartData, min, max } = useMemo(() => {
    const validData = data.filter((v): v is number => v !== null && !isNaN(v));
    const minVal = valueRange?.[0] ?? Math.min(...validData);
    const maxVal = valueRange?.[1] ?? Math.max(...validData);

    const heatmapData: [number, number, number | string][] = [];
    for (let i = 0; i < data.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const value = data[i];
      heatmapData.push([col, rows - 1 - row, value ?? '-']);
    }

    return { chartData: heatmapData, min: minVal, max: maxVal };
  }, [data, rows, cols, valueRange]);

  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      position: 'top',
      formatter: (params: unknown) => {
        const p = params as { data: [number, number, number | string] };
        const [col, row, value] = p.data;
        const index = (rows - 1 - row) * cols + col + 1;
        if (value === '-') {
          return `#${index}: 无数据`;
        }
        return `#${index}: ${value}${unit}`;
      },
    },
    grid: {
      top: title ? 40 : 10,
      bottom: 60,
      left: 40,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: cols }, (_, i) => i + 1),
      splitArea: { show: true },
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: rows }, (_, i) => i + 1),
      splitArea: { show: true },
      axisLabel: { fontSize: 10 },
    },
    visualMap: {
      min,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 5,
      inRange: {
        color: colorRange,
      },
      text: [`${max}${unit}`, `${min}${unit}`],
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        name: title,
        type: 'heatmap',
        data: chartData,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const handleClick = (params: { data: [number, number, number | string] }) => {
    if (onCellClick) {
      const [col, row, value] = params.data;
      const index = (rows - 1 - row) * cols + col;
      onCellClick(index, value === '-' ? null : (value as number));
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '400px', width: '100%' }}
      onEvents={{ click: handleClick }}
    />
  );
};

export default HeatMap;

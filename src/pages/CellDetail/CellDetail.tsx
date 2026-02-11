import { Card, Row, Col, Statistic, Tag, Button, Descriptions, Progress, Divider, Table, Badge } from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

// 模拟电芯数据
const generateCellData = (projectId: string, bankId: string, cellId: number) => {
  const isProject2 = projectId === 'project2';
  const baseVoltage = 3.2 + Math.random() * 0.1;
  const baseTemp = 24 + Math.random() * 4;
  const baseSoc = 80 + Math.random() * 15;
  const baseSoh = 88 + Math.random() * 10;
  
  // 电池组平均值
  const avgVoltage = 3.231;
  const avgTemp = 25.2;
  const avgSoc = 85.5;
  const avgSoh = 91.2;
  
  return {
    cellId,
    cellName: `V${cellId}`,
    projectId,
    projectName: isProject2 ? '项目2-Stack1' : `项目1-${bankId.includes('2#') ? '2#站' : '站点'}`,
    bankId,
    bankName: isProject2 ? `Group ${bankId.replace('group', '')}` : `Bank ${bankId.replace('bank', '')}`,
    // 实时数据
    voltage: baseVoltage.toFixed(3),
    temperature: baseTemp.toFixed(1),
    soc: baseSoc.toFixed(1),
    soh: baseSoh.toFixed(1),
    resistance: (1.2 + Math.random() * 0.5).toFixed(2),
    // 平均值
    avgVoltage,
    avgTemp,
    avgSoc,
    avgSoh,
    // 偏差
    voltageDiff: (baseVoltage - avgVoltage).toFixed(3),
    tempDiff: (baseTemp - avgTemp).toFixed(1),
    socDiff: (baseSoc - avgSoc).toFixed(1),
    sohDiff: (baseSoh - avgSoh).toFixed(1),
    // 健康评分
    voltageScore: 85 + Math.random() * 12,
    tempScore: 88 + Math.random() * 10,
    overallScore: 87 + Math.random() * 10,
    // 状态
    status: baseVoltage < 3.15 || baseVoltage > 3.35 ? 'warning' : 'normal',
    // 物理位置
    row: Math.ceil(cellId / 16),
    col: ((cellId - 1) % 16) + 1,
    // 电芯总数
    totalCells: isProject2 ? 216 : 240,
  };
};

// 生成历史趋势数据
const generateHistoryData = () => {
  const hours = 24;
  const data = [];
  const baseTime = new Date();
  baseTime.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < hours; i++) {
    const time = new Date(baseTime.getTime() + i * 3600000);
    data.push({
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
      voltage: (3.2 + Math.random() * 0.1).toFixed(3),
      temperature: (24 + Math.random() * 4).toFixed(1),
      soc: (80 + Math.random() * 15 - i * 0.3).toFixed(1),
    });
  }
  return data;
};

// 生成异常历史记录
const generateAnomalyHistory = () => [
  { time: '2024-10-15 14:32', type: '电压偏高', value: '3.48V', status: 'resolved' },
  { time: '2024-10-12 09:15', type: '温度偏高', value: '33.2℃', status: 'resolved' },
  { time: '2024-10-08 16:45', type: '电压偏低', value: '3.08V', status: 'resolved' },
];

export const CellDetail = () => {
  const { projectId, bankId, cellId } = useParams();
  const navigate = useNavigate();
  
  const cellData = useMemo(() => 
    generateCellData(projectId || '', bankId || '', parseInt(cellId || '1')),
    [projectId, bankId, cellId]
  );
  
  const historyData = useMemo(() => generateHistoryData(), []);
  const anomalyHistory = useMemo(() => generateAnomalyHistory(), []);

  // 趋势图配置
  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['电压(V)', '温度(℃)', 'SOC(%)'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: historyData.map(d => d.time) },
    yAxis: [
      { type: 'value', name: '电压/温度', min: 0, max: 40 },
      { type: 'value', name: 'SOC(%)', min: 0, max: 100 },
    ],
    series: [
      { name: '电压(V)', type: 'line', data: historyData.map(d => parseFloat(d.voltage) * 10), smooth: true },
      { name: '温度(℃)', type: 'line', data: historyData.map(d => d.temperature), smooth: true },
      { name: 'SOC(%)', type: 'line', yAxisIndex: 1, data: historyData.map(d => d.soc), smooth: true },
    ],
  };

  // 位置热力图数据
  const positionHeatmapOption = {
    tooltip: { formatter: (params: any) => `V${params.data[0] * 16 + params.data[1] + 1}: ${params.data[2].toFixed(3)}V` },
    grid: { left: 20, right: 20, top: 20, bottom: 20 },
    xAxis: { type: 'category', data: Array.from({ length: 16 }, (_, i) => i + 1), show: false },
    yAxis: { type: 'category', data: Array.from({ length: 15 }, (_, i) => i + 1), show: false },
    visualMap: { min: 3.1, max: 3.4, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#3182bd', '#31a354', '#e6550d'] } },
    series: [{
      type: 'heatmap',
      data: Array.from({ length: 240 }, (_, i) => {
        const row = Math.floor(i / 16);
        const col = i % 16;
        const isCurrent = i + 1 === parseInt(cellId || '1');
        return [row, col, isCurrent ? parseFloat(cellData.voltage) : 3.2 + Math.random() * 0.1];
      }),
      itemStyle: {
        borderWidth: 1,
        borderColor: '#fff',
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  };

  // 偏差状态
  const getDeviationStatus = (diff: number, threshold: number) => {
    const absDiff = Math.abs(diff);
    if (absDiff < threshold * 0.5) return { status: 'success', text: '正常' };
    if (absDiff < threshold) return { status: 'warning', text: diff > 0 ? '偏高' : '偏低' };
    return { status: 'error', text: diff > 0 ? '过高' : '过低' };
  };

  const voltageStatus = getDeviationStatus(parseFloat(cellData.voltageDiff), 0.05);
  const tempStatus = getDeviationStatus(parseFloat(cellData.tempDiff), 3);
  const socStatus = getDeviationStatus(parseFloat(cellData.socDiff), 5);

  // 导航到相邻电芯
  const navigateToCell = (newCellId: number) => {
    if (newCellId >= 1 && newCellId <= cellData.totalCells) {
      navigate(`/project/${projectId}/bank/${bankId}/cell/${newCellId}`);
    }
  };

  return (
    <div className="p-6">
      {/* 页面标题和导航 */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ThunderboltOutlined className="text-2xl text-red-500" />
            <h1 className="text-2xl font-bold m-0">电芯详情 - {cellData.cellName}</h1>
            <Tag color="red">第4级</Tag>
          </div>
          <p className="text-gray-500 m-0">
            {cellData.projectName} / {cellData.bankName} / 位置: 第{cellData.row}行 第{cellData.col}列
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigateToCell(parseInt(cellId || '1') - 1)}
            disabled={parseInt(cellId || '1') <= 1}
          >
            上一个
          </Button>
          <Button 
            icon={<ArrowRightOutlined />} 
            onClick={() => navigateToCell(parseInt(cellId || '1') + 1)}
            disabled={parseInt(cellId || '1') >= cellData.totalCells}
          >
            下一个
          </Button>
          <Button onClick={() => navigate(`/project/${projectId}/bank/${bankId}/cells`)}>
            返回电池组
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        {/* 左侧：实时数据和对比 */}
        <Col span={16}>
          {/* 实时数据卡片 */}
          <Card title="实时数据" className="mb-4">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="电压" 
                  value={cellData.voltage} 
                  suffix="V" 
                  valueStyle={{ color: voltageStatus.status === 'success' ? '#52c41a' : voltageStatus.status === 'warning' ? '#faad14' : '#f5222d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="温度" 
                  value={cellData.temperature} 
                  suffix="℃"
                  valueStyle={{ color: tempStatus.status === 'success' ? '#52c41a' : tempStatus.status === 'warning' ? '#faad14' : '#f5222d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title="SOC" value={cellData.soc} suffix="%" />
              </Col>
              <Col span={6}>
                <Statistic title="SOH" value={cellData.soh} suffix="%" />
              </Col>
            </Row>
          </Card>

          {/* 与平均值对比 */}
          <Card title="与电池组平均值对比" className="mb-4">
            <Row gutter={16}>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">电压偏差</div>
                  <div className="text-xl font-bold" style={{ color: voltageStatus.status === 'success' ? '#52c41a' : '#faad14' }}>
                    {parseFloat(cellData.voltageDiff) > 0 ? '+' : ''}{cellData.voltageDiff}V
                  </div>
                  <Badge status={voltageStatus.status as any} text={voltageStatus.text} />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">温度偏差</div>
                  <div className="text-xl font-bold" style={{ color: tempStatus.status === 'success' ? '#52c41a' : '#faad14' }}>
                    {parseFloat(cellData.tempDiff) > 0 ? '+' : ''}{cellData.tempDiff}℃
                  </div>
                  <Badge status={tempStatus.status as any} text={tempStatus.text} />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">SOC偏差</div>
                  <div className="text-xl font-bold" style={{ color: socStatus.status === 'success' ? '#52c41a' : '#faad14' }}>
                    {parseFloat(cellData.socDiff) > 0 ? '+' : ''}{cellData.socDiff}%
                  </div>
                  <Badge status={socStatus.status as any} text={socStatus.text} />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">内阻</div>
                  <div className="text-xl font-bold">{cellData.resistance}mΩ</div>
                  <Badge status="success" text="正常" />
                </div>
              </Col>
            </Row>
          </Card>

          {/* 历史趋势图 */}
          <Card title="历史趋势 (今日)" className="mb-4">
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>

        {/* 右侧：健康评估和洞察 */}
        <Col span={8}>
          {/* 健康评估 */}
          <Card title="健康评估" className="mb-4">
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>电压稳定性</span>
                <span>{cellData.voltageScore.toFixed(0)}分</span>
              </div>
              <Progress percent={cellData.voltageScore} strokeColor="#52c41a" showInfo={false} />
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>温度稳定性</span>
                <span>{cellData.tempScore.toFixed(0)}分</span>
              </div>
              <Progress percent={cellData.tempScore} strokeColor="#1890ff" showInfo={false} />
            </div>
            <Divider />
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">综合健康评分</span>
                <span className="font-bold text-lg">{cellData.overallScore.toFixed(0)}分</span>
              </div>
              <Progress 
                percent={cellData.overallScore} 
                strokeColor={cellData.overallScore > 90 ? '#52c41a' : cellData.overallScore > 80 ? '#1890ff' : '#faad14'} 
              />
            </div>
          </Card>

          {/* 电芯洞察 */}
          <Card 
            title={
              <span>
                <InfoCircleOutlined className="mr-2" />
                电芯洞察
              </span>
            }
            className="mb-4"
          >
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleOutlined className="text-green-500" />
                  <span className="font-medium">状态评估: 正常</span>
                </div>
                <p className="text-sm text-gray-600 m-0">该电芯各项指标在正常范围内</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <InfoCircleOutlined className="text-blue-500" />
                  <span className="font-medium">历史异常: 3次</span>
                </div>
                <p className="text-sm text-gray-600 m-0">近30天内发生3次异常，均已恢复</p>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <HistoryOutlined className="text-gray-500" />
                  <span className="font-medium">相邻电芯对比</span>
                </div>
                <p className="text-sm text-gray-600 m-0">与相邻电芯(V{parseInt(cellId || '1') - 1}, V{parseInt(cellId || '1') + 1})相比，各项指标差异在正常范围</p>
              </div>
            </div>
          </Card>

          {/* 异常历史记录 */}
          <Card 
            title={
              <span>
                <WarningOutlined className="mr-2" />
                异常历史记录
              </span>
            }
          >
            <Table
              dataSource={anomalyHistory}
              columns={[
                { title: '时间', dataIndex: 'time', key: 'time', width: 120 },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '数值', dataIndex: 'value', key: 'value' },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (s: string) => <Tag color="green">已恢复</Tag>
                },
              ]}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>


    </div>
  );
};

export default CellDetail;

import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Descriptions, Table, Button, Progress, Tag, Badge, List } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { KPICard } from '../../components/cards/KPICard';
import {
  ThunderboltOutlined,
  PercentageOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import bankCellsData from '../../data/bank-cells.json';

export const BankDetail = () => {
  const { projectId, bankId } = useParams();
  const navigate = useNavigate();

  const data = bankCellsData;
  const stats = data.statistics;

  const statisticsData = [
    {
      key: 'voltage',
      metric: '电压(V)',
      avg: stats.voltage.avg,
      max: stats.voltage.max,
      min: stats.voltage.min,
      diff: stats.voltage.diff,
      stdDev: stats.voltage.stdDev,
    },
    {
      key: 'temperature',
      metric: '温度(°C)',
      avg: stats.temperature.avg,
      max: stats.temperature.max,
      min: stats.temperature.min,
      diff: stats.temperature.diff,
      stdDev: stats.temperature.stdDev,
    },
    {
      key: 'soc',
      metric: 'SOC(%)',
      avg: stats.soc.avg,
      max: stats.soc.max,
      min: stats.soc.min,
      diff: stats.soc.diff,
      stdDev: stats.soc.stdDev,
    },
    {
      key: 'resistance',
      metric: '内阻(mΩ)',
      avg: '--',
      max: '--',
      min: '--',
      diff: '--',
      stdDev: '--',
    },
  ];

  const columns = [
    { title: '指标', dataIndex: 'metric', key: 'metric' },
    { title: '平均值', dataIndex: 'avg', key: 'avg' },
    { title: '最大值', dataIndex: 'max', key: 'max' },
    { title: '最小值', dataIndex: 'min', key: 'min' },
    { title: '差值', dataIndex: 'diff', key: 'diff' },
    { title: '标准差', dataIndex: 'stdDev', key: 'stdDev' },
  ];

  return (
    <div>
      {/* 基础信息和实时数据 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="基础信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Bank编号">{bankId}</Descriptions.Item>
              <Descriptions.Item label="电芯数量">{data.cellCount}</Descriptions.Item>
              <Descriptions.Item label="温度点数">{data.tempCount}</Descriptions.Item>
              <Descriptions.Item label="额定容量"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="投运日期"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="更新时间">{data.datetime}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="实时数据" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="text-gray-500 text-xs">SOC</div>
                <Progress percent={85.2} size="small" status="active" />
              </Col>
              <Col span={12}>
                <div className="text-gray-500 text-xs">SOH</div>
                <Progress percent={89} size="small" strokeColor="#52c41a" />
              </Col>
              <Col span={12}>
                <div className="text-gray-500 text-xs">电压</div>
                <div className="font-medium">775.4V</div>
              </Col>
              <Col span={12}>
                <div className="text-gray-500 text-xs">电流</div>
                <div className="font-medium text-blue-500">-125.6A (放电)</div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* KPI卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} md={6}>
          <KPICard
            title="累计充电"
            value={1304294}
            unit="kWh"
            precision={0}
            icon={<CloudUploadOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="累计放电"
            value={1247779}
            unit="kWh"
            precision={0}
            icon={<CloudDownloadOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="充放电效率"
            value={null}
            unit="%"
            isPlaceholder
            icon={<PercentageOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="循环次数"
            value={null}
            isPlaceholder
            icon={<ThunderboltOutlined />}
          />
        </Col>
      </Row>

      {/* 单体统计表格 */}
      <Card
        title="单体统计"
        size="small"
        className="mb-4"
        extra={
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/project/${projectId}/bank/${bankId}/cells`)}
          >
            查看单体详情
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={statisticsData}
          rowKey="key"
          size="small"
          pagination={false}
        />
      </Card>

      {/* 健康评估和能量统计 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="健康评估" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="电压一致性">
                <Progress percent={92} size="small" strokeColor="#52c41a" />
              </Descriptions.Item>
              <Descriptions.Item label="温度一致性">
                <Progress percent={88} size="small" strokeColor="#52c41a" />
              </Descriptions.Item>
              <Descriptions.Item label="SOC一致性">
                <Progress percent={85} size="small" strokeColor="#faad14" />
              </Descriptions.Item>
              <Descriptions.Item label="综合评分">
                <Progress percent={88} size="small" strokeColor="#1890ff" />
              </Descriptions.Item>
              <Descriptions.Item label="容量衰减率"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="内阻增长率"><span className="text-gray-400">--</span></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="绝缘监测" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="正极绝缘"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="负极绝缘"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="绝缘状态"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="环境温度">24°C</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 电池组级洞察面板 */}
      <Card 
        title={
          <span>
            <BulbOutlined className="mr-2 text-yellow-500" />
            电池组洞察
            <Tag color="orange" className="ml-2">L3</Tag>
          </span>
        }
        size="small"
        className="mb-4"
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <WarningOutlined className="text-yellow-500" />
                <span className="font-medium">异常电芯: 3个</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>• V86 电压偏高 (3.52V)</div>
                <div>• V102 电压偏高 (3.48V)</div>
                <div>• T45 温度偏高 (32°C)</div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <InfoCircleOutlined className="text-blue-500" />
                <span className="font-medium">电压离群电芯</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>偏高: V86, V102, V173</div>
                <div>偏低: V98, V156</div>
                <div className="text-xs text-gray-400 mt-1">阈值: ±0.05V</div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-3 bg-green-50 rounded border border-green-200 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleOutlined className="text-green-500" />
                <span className="font-medium">建议关注</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>• 检查V86连接状态</div>
                <div>• 监控T45温度变化</div>
                <div>• 建议下次均衡</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 电芯列表 */}
      <Card 
        title={
          <span>
            <ThunderboltOutlined className="mr-2" />
            电芯列表
            <Tag color="red" className="ml-2">L4</Tag>
          </span>
        }
        size="small"
        extra={
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/project/${projectId}/bank/${bankId}/cells`)}
          >
            查看热力图
          </Button>
        }
      >
        <Table
          columns={[
            { title: '电芯编号', dataIndex: 'cellId', key: 'cellId', render: (v: number) => `V${v}` },
            { title: '电压(V)', dataIndex: 'voltage', key: 'voltage' },
            { title: '温度(℃)', dataIndex: 'temperature', key: 'temperature' },
            { title: 'SOC(%)', dataIndex: 'soc', key: 'soc' },
            { title: 'SOH(%)', dataIndex: 'soh', key: 'soh' },
            { 
              title: '状态', 
              dataIndex: 'status', 
              key: 'status',
              render: (s: string) => (
                <Badge 
                  status={s === 'normal' ? 'success' : s === 'warning' ? 'warning' : 'error'} 
                  text={s === 'normal' ? '正常' : s === 'warning' ? '需关注' : '异常'} 
                />
              )
            },
            { 
              title: '电压偏差', 
              dataIndex: 'voltageDiff', 
              key: 'voltageDiff',
              render: (v: number) => (
                <span className={v > 0.03 ? 'text-red-500' : v < -0.03 ? 'text-blue-500' : ''}>
                  {v > 0 ? '+' : ''}{v.toFixed(3)}V
                </span>
              )
            },
            { 
              title: '操作', 
              key: 'action',
              render: (_: any, record: any) => (
                <a onClick={() => navigate(`/project/${projectId}/bank/${bankId}/cell/${record.cellId}`)}>
                  详情
                </a>
              )
            },
          ]}
          dataSource={Array.from({ length: 10 }, (_, i) => {
            const voltage = 3.2 + Math.random() * 0.1;
            const avgVoltage = 3.231;
            return {
              key: i + 1,
              cellId: i + 1,
              voltage: voltage.toFixed(3),
              temperature: (24 + Math.random() * 4).toFixed(1),
              soc: (80 + Math.random() * 15).toFixed(1),
              soh: (88 + Math.random() * 10).toFixed(1),
              status: voltage > 3.35 || voltage < 3.15 ? 'warning' : 'normal',
              voltageDiff: voltage - avgVoltage,
            };
          })}
          size="small"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${data.cellCount} 个电芯，显示前10个` }}
        />
      </Card>
    </div>
  );
};

export default BankDetail;

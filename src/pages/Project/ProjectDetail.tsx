import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Descriptions, Tag, Select, Progress } from 'antd';
import { StatusBadge } from '../../components/common/StatusBadge';
import { KPICard } from '../../components/cards/KPICard';
import { LineChart } from '../../components/charts';
import {
  ThunderboltOutlined,
  PercentageOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import projectData from '../../data/project1-2.json';
import projectsData from '../../data/projects.json';
import type { StatusType } from '../../types';

// 模拟趋势数据
const trendData = {
  times: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
  voltage: [775.2, 775.4, 775.8, 776.2, 778.5, 780.1, 782.3, 784.0, 782.5, 780.2, 778.1, 776.5],
  current: [0, 0, 125, 180, 200, 150, -100, -180, -200, -150, -80, 0],
  soc: [85, 85, 88, 92, 96, 98, 95, 90, 85, 82, 80, 80],
};

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // 获取项目基本信息
  const projectInfo = projectsData.projects.find(p => p.id === projectId) || projectsData.projects[0];
  
  // 使用模拟数据
  const data = projectData;

  const columns = [
    {
      title: 'Bank',
      dataIndex: 'bankId',
      key: 'bankId',
    },
    {
      title: '电压(V)',
      dataIndex: 'bankVol',
      key: 'bankVol',
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '电流(A)',
      dataIndex: 'bankCur',
      key: 'bankCur',
      render: (val: number) => val.toFixed(1),
    },
    {
      title: 'SOC(%)',
      dataIndex: 'bankSoc',
      key: 'bankSoc',
      render: (val: number) => val.toFixed(1),
    },
    {
      title: 'SOH(%)',
      dataIndex: 'bankSoh',
      key: 'bankSoh',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: StatusType) => <StatusBadge status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { bankId: string }) => (
        <a onClick={() => navigate(`/project/${projectId}/bank/${record.bankId}`)}>
          详情
        </a>
      ),
    },
  ];

  return (
    <div>
      {/* 项目标题 */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{projectInfo.name}</h2>
            <div className="text-gray-500 mt-1">
              <EnvironmentOutlined className="mr-1" />
              {projectInfo.location}
              <span className="mx-2">|</span>
              <CalendarOutlined className="mr-1" />
              投运: {projectInfo.commissionDate || '--'}
            </div>
          </div>
          <Tag color={projectInfo.status === 'normal' ? 'green' : projectInfo.status === 'warning' ? 'orange' : 'red'} className="text-base px-3 py-1">
            {projectInfo.status === 'normal' ? '正常运行' : projectInfo.status === 'warning' ? '需要关注' : '异常'}
          </Tag>
        </div>
      </div>

      {/* 项目信息和运行状态 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Card title="项目信息" size="small" className="h-full">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="项目名称">{projectInfo.name}</Descriptions.Item>
              <Descriptions.Item label="所在国家">{projectInfo.country || '--'}</Descriptions.Item>
              <Descriptions.Item label="装机容量">{projectInfo.ratedCapacity ? `${projectInfo.ratedCapacity} MWh` : '--'}</Descriptions.Item>
              <Descriptions.Item label="额定功率">{projectInfo.ratedPower ? `${projectInfo.ratedPower} MW` : '--'}</Descriptions.Item>
              <Descriptions.Item label="Bank数量">{data.banks.length} 个</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="实时运行状态" size="small" className="h-full">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">总电压</span>
                <span className="font-medium">{data.summary.totalVoltage} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">总电流</span>
                <span className="font-medium">{data.summary.totalCurrent} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前功率</span>
                <span className="font-medium text-blue-500">{data.summary.power} kW (放电)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">功率利用率</span>
                <Progress percent={projectInfo.ratedPower ? Math.round((data.summary.power / (projectInfo.ratedPower * 1000)) * 100) : 0} size="small" style={{ width: 100 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="健康状态" size="small" className="h-full">
            <div className="flex justify-around py-2">
              <div className="text-center">
                <Progress type="circle" percent={data.summary.avgSoc} size={70} strokeColor="#1890ff" />
                <div className="text-gray-500 mt-2 text-sm">平均SOC</div>
              </div>
              <div className="text-center">
                <Progress type="circle" percent={data.summary.avgSoh} size={70} strokeColor="#52c41a" />
                <div className="text-gray-500 mt-2 text-sm">平均SOH</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* KPI卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} md={6}>
          <KPICard
            title="平均SOC"
            value={data.summary.avgSoc}
            unit="%"
            icon={<PercentageOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="平均SOH"
            value={data.summary.avgSoh}
            unit="%"
            icon={<ThunderboltOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="今日充电"
            value={data.summary.chargeEnergy}
            unit="kWh"
            icon={<CloudUploadOutlined />}
          />
        </Col>
        <Col xs={12} md={6}>
          <KPICard
            title="今日放电"
            value={data.summary.dischargeEnergy}
            unit="kWh"
            icon={<CloudDownloadOutlined />}
          />
        </Col>
      </Row>

      {/* 极值信息和安全状态 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={12}>
          <Card title="极值信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="最高电压">
                {data.extremes.maxVoltage}V ({data.extremes.maxVoltagePos})
              </Descriptions.Item>
              <Descriptions.Item label="最低电压">
                {data.extremes.minVoltage}V ({data.extremes.minVoltagePos})
              </Descriptions.Item>
              <Descriptions.Item label="电压差">{data.extremes.voltageDiff}V</Descriptions.Item>
              <Descriptions.Item label="最高温度">
                {data.extremes.maxTemp}°C ({data.extremes.maxTempPos})
              </Descriptions.Item>
              <Descriptions.Item label="最低温度">
                {data.extremes.minTemp}°C ({data.extremes.minTempPos})
              </Descriptions.Item>
              <Descriptions.Item label="温度差">{data.extremes.tempDiff}°C</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="安全状态" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="绝缘电阻+"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="绝缘电阻-"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="BMS状态"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="通信状态"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="消防状态"><span className="text-gray-400">--</span></Descriptions.Item>
              <Descriptions.Item label="空调状态"><span className="text-gray-400">--</span></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Bank列表 */}
      <Card title="Bank列表" size="small" className="mb-4">
        <Table
          columns={columns}
          dataSource={data.banks}
          rowKey="bankId"
          size="small"
          pagination={false}
        />
      </Card>

      {/* 趋势图表 */}
      <Card
        title="运行趋势"
        size="small"
        extra={
          <Select
            defaultValue="1d"
            style={{ width: 100 }}
            options={[
              { value: '1d', label: '今日' },
              { value: '7d', label: '近7天' },
              { value: '30d', label: '近30天' },
            ]}
          />
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <LineChart
              xAxisData={trendData.times}
              series={[
                { name: '电压(V)', data: trendData.voltage, color: '#1890ff' },
              ]}
              title="电压趋势"
              yAxisName="V"
            />
          </Col>
          <Col xs={24} lg={12}>
            <LineChart
              xAxisData={trendData.times}
              series={[
                { name: '电流(A)', data: trendData.current, color: '#52c41a' },
              ]}
              title="电流趋势"
              yAxisName="A"
            />
          </Col>
          <Col xs={24}>
            <LineChart
              xAxisData={trendData.times}
              series={[
                { name: 'SOC(%)', data: trendData.soc, color: '#faad14' },
              ]}
              title="SOC趋势"
              yAxisName="%"
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProjectDetail;

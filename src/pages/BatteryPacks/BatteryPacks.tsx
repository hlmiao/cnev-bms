import { Card, Table, Tag, Progress, Input, Select, Row, Col, Statistic, Badge } from 'antd';
import { SearchOutlined, BankOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import projectsData from '../../data/projects.json';

// 模拟电池组数据
const generateBankData = () => {
  const banks: any[] = [];
  const { projects } = projectsData;
  
  projects.forEach((project) => {
    const bankCount = project.id === 'project2' ? 4 : 11;
    for (let i = 1; i <= bankCount; i++) {
      const bankId = project.id === 'project2' ? `group${i}` : `bank${i.toString().padStart(2, '0')}`;
      const soc = 70 + Math.random() * 25;
      const soh = 85 + Math.random() * 12;
      const voltage = project.id === 'project2' ? 720 + Math.random() * 30 : 770 + Math.random() * 20;
      const current = -150 + Math.random() * 300;
      const cellCount = project.id === 'project2' ? 216 : 240;
      const status = soc < 75 ? 'warning' : soh < 88 ? 'warning' : 'normal';
      
      banks.push({
        key: `${project.id}-${bankId}`,
        projectId: project.id,
        projectName: project.name,
        bankId,
        bankName: project.id === 'project2' ? `Group ${i}` : `Bank ${i.toString().padStart(2, '0')}`,
        voltage: voltage.toFixed(1),
        current: current.toFixed(1),
        soc: soc.toFixed(1),
        soh: soh.toFixed(1),
        cellCount,
        status,
        alertCount: Math.floor(Math.random() * 5),
        chargeState: current > 0 ? '充电' : current < -10 ? '放电' : '待机',
      });
    }
  });
  
  return banks;
};

export const BatteryPacks = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const allBanks = useMemo(() => generateBankData(), []);
  
  const filteredBanks = useMemo(() => {
    return allBanks.filter(bank => {
      const matchSearch = bank.bankName.toLowerCase().includes(searchText.toLowerCase()) ||
                         bank.projectName.toLowerCase().includes(searchText.toLowerCase());
      const matchProject = selectedProject === 'all' || bank.projectId === selectedProject;
      const matchStatus = selectedStatus === 'all' || bank.status === selectedStatus;
      return matchSearch && matchProject && matchStatus;
    });
  }, [allBanks, searchText, selectedProject, selectedStatus]);
  
  // 统计数据
  const stats = useMemo(() => {
    const total = allBanks.length;
    const normal = allBanks.filter(b => b.status === 'normal').length;
    const warning = allBanks.filter(b => b.status === 'warning').length;
    const totalCells = allBanks.reduce((sum, b) => sum + b.cellCount, 0);
    const avgSoc = allBanks.reduce((sum, b) => sum + parseFloat(b.soc), 0) / total;
    const avgSoh = allBanks.reduce((sum, b) => sum + parseFloat(b.soh), 0) / total;
    return { total, normal, warning, totalCells, avgSoc, avgSoh };
  }, [allBanks]);

  const columns = [
    {
      title: '电池组',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.projectName}</div>
        </div>
      ),
    },
    {
      title: '电压(V)',
      dataIndex: 'voltage',
      key: 'voltage',
      sorter: (a: any, b: any) => parseFloat(a.voltage) - parseFloat(b.voltage),
    },
    {
      title: '电流(A)',
      dataIndex: 'current',
      key: 'current',
      render: (val: string) => (
        <span className={parseFloat(val) > 0 ? 'text-green-600' : parseFloat(val) < -10 ? 'text-blue-600' : ''}>
          {val}
        </span>
      ),
    },
    {
      title: 'SOC',
      dataIndex: 'soc',
      key: 'soc',
      sorter: (a: any, b: any) => parseFloat(a.soc) - parseFloat(b.soc),
      render: (val: string) => (
        <Progress 
          percent={parseFloat(val)} 
          size="small" 
          format={() => `${val}%`}
          status={parseFloat(val) < 20 ? 'exception' : 'normal'}
        />
      ),
    },
    {
      title: 'SOH',
      dataIndex: 'soh',
      key: 'soh',
      sorter: (a: any, b: any) => parseFloat(a.soh) - parseFloat(b.soh),
      render: (val: string) => (
        <Progress 
          percent={parseFloat(val)} 
          size="small" 
          format={() => `${val}%`}
          strokeColor={parseFloat(val) < 85 ? '#faad14' : '#52c41a'}
        />
      ),
    },
    {
      title: '电芯数',
      dataIndex: 'cellCount',
      key: 'cellCount',
      render: (val: number) => <span>{val}个</span>,
    },
    {
      title: '状态',
      dataIndex: 'chargeState',
      key: 'chargeState',
      render: (val: string) => {
        const color = val === '充电' ? 'green' : val === '放电' ? 'blue' : 'default';
        return <Tag color={color}>{val}</Tag>;
      },
    },
    {
      title: '健康状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'normal' ? 'success' : 'warning'} 
          text={status === 'normal' ? '正常' : '警告'} 
        />
      ),
    },
    {
      title: '告警',
      dataIndex: 'alertCount',
      key: 'alertCount',
      render: (val: number) => val > 0 ? <Tag color="red">{val}</Tag> : <span className="text-gray-400">0</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <a onClick={() => navigate(`/project/${record.projectId}/bank/${record.bankId}`)}>
          查看详情
        </a>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BankOutlined className="text-2xl text-orange-500" />
          <h1 className="text-2xl font-bold m-0">电池组管理</h1>
          <Tag color="orange">第3级</Tag>
        </div>
        <p className="text-gray-500 m-0">管理所有项目的电池组，查看电池组状态和电芯汇总数据</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card size="small">
            <Statistic title="电池组总数" value={stats.total} suffix="个" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="正常运行" 
              value={stats.normal} 
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="需要关注" 
              value={stats.warning} 
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="电芯总数" value={stats.totalCells} suffix="个" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="平均SOC" value={stats.avgSoc.toFixed(1)} suffix="%" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="平均SOH" value={stats.avgSoh.toFixed(1)} suffix="%" />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索电池组名称或项目..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择项目"
              value={selectedProject}
              onChange={setSelectedProject}
              options={[
                { value: 'all', label: '全部项目' },
                ...projectsData.projects.map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'normal', label: '正常' },
                { value: 'warning', label: '警告' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 电池组列表 */}
      <Card 
        title={
          <span>
            <ThunderboltOutlined className="mr-2" />
            电池组列表 ({filteredBanks.length})
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredBanks}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `共 ${total} 个电池组` }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default BatteryPacks;

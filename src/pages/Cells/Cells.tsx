import { Card, Table, Tag, Input, Select, Row, Col, Statistic, Badge, Tooltip } from 'antd';
import { SearchOutlined, ThunderboltOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import projectsData from '../../data/projects.json';

// 模拟电芯数据
const generateCellData = () => {
  const cells: any[] = [];
  const { projects } = projectsData;
  
  projects.forEach((project) => {
    const bankCount = project.id === 'project2' ? 4 : 11;
    const cellsPerBank = project.id === 'project2' ? 216 : 240;
    
    // 只生成部分电芯数据用于展示
    for (let b = 1; b <= Math.min(bankCount, 3); b++) {
      const bankId = project.id === 'project2' ? `group${b}` : `bank${b.toString().padStart(2, '0')}`;
      const bankName = project.id === 'project2' ? `Group ${b}` : `Bank ${b.toString().padStart(2, '0')}`;
      
      for (let c = 1; c <= Math.min(cellsPerBank, 50); c++) {
        const voltage = 3.15 + Math.random() * 0.2;
        const temperature = 22 + Math.random() * 10;
        const soc = 70 + Math.random() * 25;
        const soh = 85 + Math.random() * 12;
        
        // 随机生成一些异常电芯
        const isVoltageAnomaly = Math.random() < 0.05;
        const isTempAnomaly = Math.random() < 0.03;
        const voltageVal = isVoltageAnomaly ? (Math.random() > 0.5 ? 3.45 + Math.random() * 0.1 : 3.0 - Math.random() * 0.1) : voltage;
        const tempVal = isTempAnomaly ? 32 + Math.random() * 5 : temperature;
        
        const status = isVoltageAnomaly || isTempAnomaly ? 'anomaly' : 
                      voltageVal < 3.15 || voltageVal > 3.4 ? 'warning' : 'normal';
        
        cells.push({
          key: `${project.id}-${bankId}-cell${c}`,
          projectId: project.id,
          projectName: project.name,
          bankId,
          bankName,
          cellId: c,
          cellName: `V${c}`,
          voltage: voltageVal.toFixed(3),
          temperature: tempVal.toFixed(1),
          soc: soc.toFixed(1),
          soh: soh.toFixed(1),
          status,
          isVoltageAnomaly,
          isTempAnomaly,
        });
      }
    }
  });
  
  return cells;
};

export const Cells = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const allCells = useMemo(() => generateCellData(), []);
  
  const filteredCells = useMemo(() => {
    return allCells.filter(cell => {
      const matchSearch = cell.cellName.toLowerCase().includes(searchText.toLowerCase()) ||
                         cell.bankName.toLowerCase().includes(searchText.toLowerCase()) ||
                         cell.projectName.toLowerCase().includes(searchText.toLowerCase());
      const matchProject = selectedProject === 'all' || cell.projectId === selectedProject;
      const matchStatus = selectedStatus === 'all' || cell.status === selectedStatus;
      return matchSearch && matchProject && matchStatus;
    });
  }, [allCells, searchText, selectedProject, selectedStatus]);
  
  // 统计数据
  const stats = useMemo(() => {
    const total = allCells.length;
    const normal = allCells.filter(c => c.status === 'normal').length;
    const warning = allCells.filter(c => c.status === 'warning').length;
    const anomaly = allCells.filter(c => c.status === 'anomaly').length;
    const avgVoltage = allCells.reduce((sum, c) => sum + parseFloat(c.voltage), 0) / total;
    const avgTemp = allCells.reduce((sum, c) => sum + parseFloat(c.temperature), 0) / total;
    return { total, normal, warning, anomaly, avgVoltage, avgTemp };
  }, [allCells]);

  const columns = [
    {
      title: '电芯编号',
      dataIndex: 'cellName',
      key: 'cellName',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.bankName} / {record.projectName}</div>
        </div>
      ),
    },
    {
      title: '电压(V)',
      dataIndex: 'voltage',
      key: 'voltage',
      sorter: (a: any, b: any) => parseFloat(a.voltage) - parseFloat(b.voltage),
      render: (val: string, record: any) => (
        <span className={record.isVoltageAnomaly ? 'text-red-600 font-bold' : ''}>
          {val}
          {record.isVoltageAnomaly && (
            <Tooltip title="电压异常">
              <ExclamationCircleOutlined className="ml-1 text-red-500" />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: '温度(℃)',
      dataIndex: 'temperature',
      key: 'temperature',
      sorter: (a: any, b: any) => parseFloat(a.temperature) - parseFloat(b.temperature),
      render: (val: string, record: any) => (
        <span className={record.isTempAnomaly ? 'text-orange-600 font-bold' : ''}>
          {val}
          {record.isTempAnomaly && (
            <Tooltip title="温度偏高">
              <ExclamationCircleOutlined className="ml-1 text-orange-500" />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: 'SOC(%)',
      dataIndex: 'soc',
      key: 'soc',
      sorter: (a: any, b: any) => parseFloat(a.soc) - parseFloat(b.soc),
    },
    {
      title: 'SOH(%)',
      dataIndex: 'soh',
      key: 'soh',
      sorter: (a: any, b: any) => parseFloat(a.soh) - parseFloat(b.soh),
    },
    {
      title: '所属电池组',
      dataIndex: 'bankName',
      key: 'bankName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { status: 'success' | 'warning' | 'error', text: string }> = {
          normal: { status: 'success', text: '正常' },
          warning: { status: 'warning', text: '需关注' },
          anomaly: { status: 'error', text: '异常' },
        };
        const { status: badgeStatus, text } = config[status] || config.normal;
        return <Badge status={badgeStatus} text={text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <a onClick={() => navigate(`/project/${record.projectId}/bank/${record.bankId}/cell/${record.cellId}`)}>
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
          <ThunderboltOutlined className="text-2xl text-red-500" />
          <h1 className="text-2xl font-bold m-0">电芯管理</h1>
          <Tag color="red">第4级</Tag>
        </div>
        <p className="text-gray-500 m-0">管理所有电芯的详细数据，快速定位异常电芯</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card size="small">
            <Statistic title="电芯总数" value={stats.total} suffix="个" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="正常" 
              value={stats.normal} 
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="需关注" 
              value={stats.warning} 
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic 
              title="异常" 
              value={stats.anomaly} 
              suffix="个"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="平均电压" value={stats.avgVoltage.toFixed(3)} suffix="V" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="平均温度" value={stats.avgTemp.toFixed(1)} suffix="℃" />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索电芯编号、电池组或项目..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={5}>
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
          <Col span={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'normal', label: '正常' },
                { value: 'warning', label: '需关注' },
                { value: 'anomaly', label: '异常' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 电芯列表 */}
      <Card 
        title={
          <span>
            <ThunderboltOutlined className="mr-2" />
            电芯列表 ({filteredCells.length})
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredCells}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 个电芯` }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Cells;

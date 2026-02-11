import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Alert, 
  Button, 
  Statistic, 
  Progress, 
  Tabs,
  Table,
  Tag,
  Spin,
  message
} from 'antd';
import { 
  DatabaseOutlined, 
  ReloadOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { simpleCsvDataService, type ProjectDataSummary, type BankDisplayData } from './services/simpleCsvDataService';

const { TabPane } = Tabs;

export const SimpleCsvDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project1Data, setProject1Data] = useState<ProjectDataSummary[]>([]);
  const [project2Data, setProject2Data] = useState<ProjectDataSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 模拟数据路径
  const PROJECT1_DATA_PATH = '../../../项目1';
  const PROJECT2_DATA_PATH = '../../../项目2';

  useEffect(() => {
    loadAllData();
    
    // 清理资源
    return () => {
      simpleCsvDataService.cleanup();
    };
  }, []);

  /**
   * 加载所有数据
   */
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 并行加载项目1和项目2数据
      const [p1Data, p2Data] = await Promise.allSettled([
        simpleCsvDataService.loadProject1Data(PROJECT1_DATA_PATH),
        simpleCsvDataService.loadProject2Data(PROJECT2_DATA_PATH)
      ]);

      if (p1Data.status === 'fulfilled') {
        setProject1Data(p1Data.value);
      } else {
        console.error('项目1数据加载失败:', p1Data.reason);
        message.warning('项目1数据加载失败，请检查数据路径');
      }

      if (p2Data.status === 'fulfilled') {
        setProject2Data(p2Data.value);
      } else {
        console.error('项目2数据加载失败:', p2Data.reason);
        message.warning('项目2数据加载失败，请检查数据路径');
      }

      message.success('数据加载完成');
    } catch (error) {
      console.error('数据加载失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载项目详细数据
   */
  const loadProjectDetail = async (projectId: string) => {
    setDetailLoading(true);
    setSelectedProject(projectId);
    
    try {
      const dataPath = projectId.startsWith('project1') ? PROJECT1_DATA_PATH : PROJECT2_DATA_PATH;
      const detail = await simpleCsvDataService.getProjectDetail(projectId, dataPath);
      setProjectDetail(detail);
    } catch (error) {
      console.error('项目详情加载失败:', error);
      message.error('项目详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * 渲染数据质量指标
   */
  const renderDataQuality = (quality: ProjectDataSummary['dataQuality']) => {
    const getQualityColor = (score: number) => {
      if (score >= 90) return '#52c41a';
      if (score >= 70) return '#faad14';
      return '#ff4d4f';
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">完整性</span>
          <Progress 
            percent={Math.round(quality.completeness)} 
            size="small" 
            strokeColor={getQualityColor(quality.completeness)}
            style={{ width: 100 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">准确性</span>
          <Progress 
            percent={Math.round(quality.accuracy)} 
            size="small" 
            strokeColor={getQualityColor(quality.accuracy)}
            style={{ width: 100 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">一致性</span>
          <Progress 
            percent={Math.round(quality.consistency)} 
            size="small" 
            strokeColor={getQualityColor(quality.consistency)}
            style={{ width: 100 }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">及时性</span>
          <Progress 
            percent={Math.round(quality.timeliness)} 
            size="small" 
            strokeColor={getQualityColor(quality.timeliness)}
            style={{ width: 100 }}
          />
        </div>
      </div>
    );
  };

  /**
   * 渲染项目卡片
   */
  const renderProjectCard = (project: ProjectDataSummary) => {
    const avgQuality = (
      project.dataQuality.completeness + 
      project.dataQuality.accuracy + 
      project.dataQuality.consistency + 
      project.dataQuality.timeliness
    ) / 4;

    return (
      <Card
        key={project.projectId}
        size="small"
        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => loadProjectDetail(project.projectId)}
        title={
          <div className="flex justify-between items-center">
            <span>{project.projectName}</span>
            <Tag color={project.projectType === 'project1' ? 'blue' : 'green'}>
              {project.projectType === 'project1' ? '项目1' : '项目2'}
            </Tag>
          </div>
        }
        extra={
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              loadProjectDetail(project.projectId);
            }}
          >
            详情
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank数量</span>
                <span className="font-medium">{project.summary.bankCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">平均SOC</span>
                <span className="font-medium text-blue-500">{project.summary.avgSoc.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">平均SOH</span>
                <span className="font-medium text-green-500">{project.summary.avgSoh.toFixed(1)}%</span>
              </div>
              {project.summary.power && (
                <div className="flex justify-between">
                  <span className="text-gray-500">功率</span>
                  <span className="font-medium">{project.summary.power.toFixed(1)} kW</span>
                </div>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div>
              <div className="text-gray-500 text-sm mb-2">数据质量</div>
              {renderDataQuality(project.dataQuality)}
              <div className="mt-2 text-center">
                <Progress 
                  type="circle" 
                  percent={Math.round(avgQuality)} 
                  size={60}
                  strokeColor={avgQuality >= 90 ? '#52c41a' : avgQuality >= 70 ? '#faad14' : '#ff4d4f'}
                />
              </div>
            </div>
          </Col>
        </Row>
        <div className="mt-3 pt-3 border-t text-xs text-gray-400">
          最后更新: {new Date(project.lastUpdate).toLocaleString()}
        </div>
      </Card>
    );
  };

  /**
   * 渲染Bank表格
   */
  const renderBankTable = (banks: any[]) => {
    const bankDisplayData: BankDisplayData[] = banks.map(bank => 
      simpleCsvDataService.convertBankToDisplayData(bank)
    );

    const columns = [
      {
        title: 'Bank ID',
        dataIndex: 'bankId',
        key: 'bankId',
      },
      {
        title: '电压(V)',
        dataIndex: 'bankVol',
        key: 'bankVol',
        render: (val: number) => val.toFixed(2),
      },
      {
        title: '电流(A)',
        dataIndex: 'bankCur',
        key: 'bankCur',
        render: (val: number) => val.toFixed(2),
      },
      {
        title: 'SOC(%)',
        dataIndex: 'bankSoc',
        key: 'bankSoc',
        render: (val: number) => (
          <span className={val < 20 ? 'text-red-500' : val < 50 ? 'text-yellow-500' : 'text-green-500'}>
            {val.toFixed(1)}%
          </span>
        ),
      },
      {
        title: 'SOH(%)',
        dataIndex: 'bankSoh',
        key: 'bankSoh',
        render: (val: number) => (
          <span className={val < 80 ? 'text-red-500' : 'text-green-500'}>
            {val.toFixed(1)}%
          </span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const statusConfig = {
            normal: { color: 'green', icon: <CheckCircleOutlined />, text: '正常' },
            warning: { color: 'orange', icon: <WarningOutlined />, text: '警告' },
            error: { color: 'red', icon: <ExclamationCircleOutlined />, text: '异常' }
          };
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <Tag color={config.color} icon={config.icon}>
              {config.text}
            </Tag>
          );
        },
      },
      {
        title: '单体数量',
        dataIndex: 'cellCount',
        key: 'cellCount',
        render: (val: number) => `${val} 个`,
      },
      {
        title: '最后更新',
        dataIndex: 'lastUpdate',
        key: 'lastUpdate',
        render: (val: string) => new Date(val).toLocaleString(),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={bankDisplayData}
        rowKey="bankId"
        size="small"
        pagination={{ pageSize: 10 }}
      />
    );
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">样本数据展示</h2>
          <p className="text-gray-500">项目1和项目2的电池数据展示与分析</p>
        </div>
        <div className="space-x-2">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAllData}
            loading={loading}
          >
            刷新数据
          </Button>
          <Button 
            type="primary"
            onClick={() => navigate('/battery-analysis')}
          >
            电池分析中心
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card size="small" className="shadow-sm">
            <Statistic 
              title="项目1系统" 
              value={project1Data.length} 
              suffix="个" 
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="shadow-sm">
            <Statistic 
              title="项目2组" 
              value={project2Data.length} 
              suffix="个" 
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="shadow-sm">
            <Statistic 
              title="总Bank数" 
              value={[...project1Data, ...project2Data].reduce((sum, p) => sum + p.summary.bankCount, 0)} 
              suffix="个" 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="shadow-sm">
            <Statistic 
              title="平均数据质量" 
              value={Math.round([...project1Data, ...project2Data].reduce((sum, p) => {
                const avgQuality = (p.dataQuality.completeness + p.dataQuality.accuracy + p.dataQuality.consistency + p.dataQuality.timeliness) / 4;
                return sum + avgQuality;
              }, 0) / ([...project1Data, ...project2Data].length || 1))} 
              suffix="%" 
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-2 text-gray-500">正在加载数据...</div>
        </div>
      ) : (
        <Tabs defaultActiveKey="overview" type="card">
          <TabPane tab="数据概览" key="overview">
            <Row gutter={[16, 16]}>
              {/* 项目1数据 */}
              <Col span={24}>
                <Card title="项目1数据" size="small" className="mb-4">
                  {project1Data.length === 0 ? (
                    <Alert
                      message="暂无项目1数据"
                      description="请检查数据路径或重新加载数据"
                      type="info"
                      showIcon
                    />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {project1Data.map(project => (
                        <Col xs={24} sm={12} lg={8} key={project.projectId}>
                          {renderProjectCard(project)}
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              </Col>

              {/* 项目2数据 */}
              <Col span={24}>
                <Card title="项目2数据" size="small">
                  {project2Data.length === 0 ? (
                    <Alert
                      message="暂无项目2数据"
                      description="请检查数据路径或重新加载数据"
                      type="info"
                      showIcon
                    />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {project2Data.map(project => (
                        <Col xs={24} sm={12} lg={8} key={project.projectId}>
                          {renderProjectCard(project)}
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="项目详情" key="detail">
            {selectedProject ? (
              <Card 
                title={`项目详情 - ${selectedProject}`}
                size="small"
                loading={detailLoading}
              >
                {projectDetail ? (
                  <div>
                    {/* 项目摘要 */}
                    <Row gutter={[16, 16]} className="mb-4">
                      <Col xs={24} md={8}>
                        <Card size="small" title="项目摘要">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>项目类型</span>
                              <span>{projectDetail.projectType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bank数量</span>
                              <span>{projectDetail.banks.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>平均SOC</span>
                              <span>{projectDetail.summary.avgSoc.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>平均SOH</span>
                              <span>{projectDetail.summary.avgSoh.toFixed(1)}%</span>
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} md={16}>
                        <Card size="small" title="数据质量指标">
                          <div className="text-center">
                            <Progress 
                              type="circle" 
                              percent={Math.round(projectDetail.summary.dataQuality)} 
                              size={120}
                              strokeColor={projectDetail.summary.dataQuality >= 90 ? '#52c41a' : projectDetail.summary.dataQuality >= 70 ? '#faad14' : '#ff4d4f'}
                            />
                            <div className="mt-2 text-gray-500">整体数据质量</div>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    {/* Bank列表 */}
                    <Card title="Bank详细信息" size="small">
                      {renderBankTable(projectDetail.banks)}
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    请选择一个项目查看详情
                  </div>
                )}
              </Card>
            ) : (
              <Alert
                message="请选择项目"
                description="请在数据概览中点击项目卡片查看详细信息"
                type="info"
                showIcon
              />
            )}
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default SimpleCsvDataPage;
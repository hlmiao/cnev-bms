/**
 * 电池分析页面 - 专门展示电池一致性、容量和告警信息
 */

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
  Spin,
  notification,
  Badge,
  List,
  Tag
} from 'antd';
import { 
  ReloadOutlined, 
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  FireOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { simpleCsvDataService, type EnhancedProjectData, type BatteryAlert } from './services/simpleCsvDataService';

const { TabPane } = Tabs;

export const BatteryAnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [project1Data, setProject1Data] = useState<EnhancedProjectData[]>([]);
  const [project2Data, setProject2Data] = useState<EnhancedProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

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
      // 并行加载项目1和项目2增强数据
      const [p1Data, p2Data] = await Promise.allSettled([
        simpleCsvDataService.loadEnhancedProject1Data(PROJECT1_DATA_PATH),
        simpleCsvDataService.loadEnhancedProject2Data(PROJECT2_DATA_PATH)
      ]);

      if (p1Data.status === 'fulfilled') {
        setProject1Data(p1Data.value);
      } else {
        console.error('项目1数据加载失败:', p1Data.reason);
        notification.warning({ message: '项目1数据加载失败' });
      }

      if (p2Data.status === 'fulfilled') {
        setProject2Data(p2Data.value);
      } else {
        console.error('项目2数据加载失败:', p2Data.reason);
        notification.warning({ message: '项目2数据加载失败' });
      }

      notification.success({ message: '电池分析数据加载完成' });
    } catch (error) {
      console.error('数据加载失败:', error);
      notification.error({ message: '数据加载失败' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取所有项目数据
   */
  const getAllProjects = (): EnhancedProjectData[] => {
    return [...project1Data, ...project2Data];
  };

  /**
   * 获取选中的项目数据
   */
  const getSelectedProjectData = (): EnhancedProjectData | null => {
    if (!selectedProject) return null;
    return getAllProjects().find(p => p.projectId === selectedProject) || null;
  };

  /**
   * 渲染一致性评分卡片
   */
  const renderConsistencyCard = (project: EnhancedProjectData) => {
    const { consistency } = project;
    
    return (
      <Card title="电池一致性分析" size="small" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <div className="text-center">
              <Progress 
                type="circle" 
                percent={consistency.overallScore} 
                size={80}
                strokeColor={consistency.overallScore >= 80 ? '#52c41a' : consistency.overallScore >= 60 ? '#faad14' : '#ff4d4f'}
              />
              <div className="mt-2 text-sm text-gray-500">综合评分</div>
            </div>
          </Col>
          <Col xs={24} md={18}>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">电压一致性</span>
                  <span className="text-sm font-medium">{consistency.voltageConsistency.score}分</span>
                </div>
                <Progress 
                  percent={consistency.voltageConsistency.score} 
                  size="small"
                  strokeColor={consistency.voltageConsistency.score >= 80 ? '#52c41a' : consistency.voltageConsistency.score >= 60 ? '#faad14' : '#ff4d4f'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  最大差异: {(consistency.voltageConsistency.maxDiff * 1000).toFixed(0)}mV | 
                  标准差: {(consistency.voltageConsistency.stdDev * 1000).toFixed(0)}mV | 
                  异常点: {consistency.voltageConsistency.outlierCount}个
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">温度一致性</span>
                  <span className="text-sm font-medium">{consistency.temperatureConsistency.score}分</span>
                </div>
                <Progress 
                  percent={consistency.temperatureConsistency.score} 
                  size="small"
                  strokeColor={consistency.temperatureConsistency.score >= 80 ? '#52c41a' : consistency.temperatureConsistency.score >= 60 ? '#faad14' : '#ff4d4f'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  最大差异: {consistency.temperatureConsistency.maxDiff.toFixed(1)}°C | 
                  标准差: {consistency.temperatureConsistency.stdDev.toFixed(1)}°C | 
                  异常点: {consistency.temperatureConsistency.outlierCount}个
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">SOC一致性</span>
                  <span className="text-sm font-medium">{consistency.socConsistency.score}分</span>
                </div>
                <Progress 
                  percent={consistency.socConsistency.score} 
                  size="small"
                  strokeColor={consistency.socConsistency.score >= 80 ? '#52c41a' : consistency.socConsistency.score >= 60 ? '#faad14' : '#ff4d4f'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  最大差异: {consistency.socConsistency.maxDiff.toFixed(1)}% | 
                  标准差: {consistency.socConsistency.stdDev.toFixed(1)}% | 
                  异常点: {consistency.socConsistency.outlierCount}个
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  /**
   * 渲染容量信息卡片
   */
  const renderCapacityCard = (project: EnhancedProjectData) => {
    const { capacity } = project;
    
    return (
      <Card title="电池容量分析" size="small" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}>
            <Statistic
              title="额定容量"
              value={capacity.ratedCapacity}
              suffix="Ah"
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="实际容量"
              value={capacity.actualCapacity}
              suffix="Ah"
              styles={{ value: { color: capacity.actualCapacity / capacity.ratedCapacity >= 0.8 ? '#3f8600' : '#cf1322' } }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="容量保持率"
              value={capacity.capacityRetention}
              suffix="%"
              styles={{ value: { color: capacity.capacityRetention >= 80 ? '#3f8600' : '#cf1322' } }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="能量容量"
              value={capacity.energyCapacity}
              suffix="kWh"
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="可用容量"
              value={capacity.usableCapacity}
              suffix="Ah"
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="衰减率"
              value={capacity.degradationRate}
              suffix="%/年"
              styles={{ value: { color: capacity.degradationRate <= 3 ? '#3f8600' : '#cf1322' } }}
            />
          </Col>
        </Row>
        
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">容量健康度</div>
          <Progress 
            percent={capacity.capacityRetention} 
            strokeColor={capacity.capacityRetention >= 90 ? '#52c41a' : capacity.capacityRetention >= 80 ? '#faad14' : '#ff4d4f'}
            format={(percent) => `${percent}%`}
          />
        </div>
      </Card>
    );
  };

  /**
   * 渲染告警列表
   */
  const renderAlertsList = (alerts: BatteryAlert[]) => {
    const getAlertIcon = (level: string) => {
      switch (level) {
        case 'critical': return <FireOutlined className="text-red-600" />;
        case 'error': return <ExclamationCircleOutlined className="text-red-500" />;
        case 'warning': return <WarningOutlined className="text-yellow-500" />;
        case 'info': return <InfoCircleOutlined className="text-blue-500" />;
        default: return <InfoCircleOutlined />;
      }
    };

    const getAlertColor = (level: string) => {
      switch (level) {
        case 'critical': return 'red';
        case 'error': return 'red';
        case 'warning': return 'orange';
        case 'info': return 'blue';
        default: return 'default';
      }
    };

    return (
      <List
        dataSource={alerts}
        renderItem={(alert) => (
          <List.Item>
            <List.Item.Meta
              avatar={getAlertIcon(alert.level)}
              title={
                <div className="flex items-center gap-2">
                  <span>{alert.title}</span>
                  <Tag color={getAlertColor(alert.level)}>{alert.level.toUpperCase()}</Tag>
                  <Tag>{alert.type}</Tag>
                </div>
              }
              description={
                <div>
                  <div className="mb-1">{alert.description}</div>
                  <div className="text-xs text-gray-400">
                    Bank: {alert.bankId} | 
                    当前值: {alert.currentValue} | 
                    阈值: {alert.threshold} | 
                    时间: {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  /**
   * 计算总体统计
   */
  const calculateOverallStats = () => {
    const allProjects = getAllProjects();
    if (allProjects.length === 0) return null;

    const avgConsistency = allProjects.reduce((sum, p) => sum + p.consistency.overallScore, 0) / allProjects.length;
    const avgCapacityRetention = allProjects.reduce((sum, p) => sum + p.capacity.capacityRetention, 0) / allProjects.length;
    const totalAlerts = allProjects.reduce((sum, p) => sum + p.alertSummary.total, 0);
    const criticalAlerts = allProjects.reduce((sum, p) => sum + p.alertSummary.critical, 0);

    return {
      avgConsistency: Math.round(avgConsistency),
      avgCapacityRetention: Math.round(avgCapacityRetention * 10) / 10,
      totalAlerts,
      criticalAlerts
    };
  };

  const overallStats = calculateOverallStats();

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">电池分析中心</h2>
          <p className="text-gray-500">电池一致性、容量分析和告警监控</p>
        </div>
        <div className="space-x-2">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAllData}
            loading={loading}
          >
            刷新数据
          </Button>
        </div>
      </div>

      {/* 总体统计 */}
      {overallStats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm">
              <Statistic 
                title="平均一致性评分" 
                value={overallStats.avgConsistency} 
                suffix="分" 
                prefix={<SyncOutlined />}
                styles={{ value: { color: overallStats.avgConsistency >= 80 ? '#3f8600' : '#cf1322' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm">
              <Statistic 
                title="平均容量保持率" 
                value={overallStats.avgCapacityRetention} 
                suffix="%" 
                prefix={<ThunderboltOutlined />}
                styles={{ value: { color: overallStats.avgCapacityRetention >= 80 ? '#3f8600' : '#cf1322' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm">
              <Statistic 
                title="总告警数" 
                value={overallStats.totalAlerts} 
                suffix="个" 
                prefix={<WarningOutlined />}
                styles={{ value: { color: overallStats.totalAlerts > 0 ? '#cf1322' : '#3f8600' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm">
              <Statistic 
                title="严重告警" 
                value={overallStats.criticalAlerts} 
                suffix="个" 
                prefix={<FireOutlined />}
                styles={{ value: { color: overallStats.criticalAlerts > 0 ? '#cf1322' : '#3f8600' } }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {loading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-2 text-gray-500">正在加载电池分析数据...</div>
        </div>
      ) : (
        <Tabs defaultActiveKey="overview" type="card">
          <TabPane tab="项目概览" key="overview">
            <Row gutter={[16, 16]}>
              {/* 项目1数据 */}
              <Col span={24}>
                <Card title="项目1电池分析" size="small" className="mb-4">
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
                        <Col xs={24} lg={12} key={project.projectId}>
                          <Card 
                            size="small" 
                            title={project.projectName}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedProject(project.projectId)}
                            extra={
                              <Badge count={project.alertSummary.total} showZero={false}>
                                <Button type="link" size="small">查看详情</Button>
                              </Badge>
                            }
                          >
                            <Row gutter={[8, 8]}>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{project.consistency.overallScore}</div>
                                  <div className="text-xs text-gray-500">一致性评分</div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{project.capacity.capacityRetention.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500">容量保持率</div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${project.alertSummary.total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {project.alertSummary.total}
                                  </div>
                                  <div className="text-xs text-gray-500">告警数量</div>
                                </div>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              </Col>

              {/* 项目2数据 */}
              <Col span={24}>
                <Card title="项目2电池分析" size="small">
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
                        <Col xs={24} lg={12} key={project.projectId}>
                          <Card 
                            size="small" 
                            title={project.projectName}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedProject(project.projectId)}
                            extra={
                              <Badge count={project.alertSummary.total} showZero={false}>
                                <Button type="link" size="small">查看详情</Button>
                              </Badge>
                            }
                          >
                            <Row gutter={[8, 8]}>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{project.consistency.overallScore}</div>
                                  <div className="text-xs text-gray-500">一致性评分</div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{project.capacity.capacityRetention.toFixed(1)}%</div>
                                  <div className="text-xs text-gray-500">容量保持率</div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${project.alertSummary.total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {project.alertSummary.total}
                                  </div>
                                  <div className="text-xs text-gray-500">告警数量</div>
                                </div>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="详细分析" key="detail">
            {selectedProject ? (
              (() => {
                const projectData = getSelectedProjectData();
                return projectData ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">{projectData.projectName} - 详细分析</h3>
                    </div>
                    
                    {/* 一致性分析 */}
                    {renderConsistencyCard(projectData)}
                    
                    {/* 容量分析 */}
                    {renderCapacityCard(projectData)}
                    
                    {/* 告警信息 */}
                    <Card title="告警信息" size="small">
                      {projectData.alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
                          <div>暂无告警信息</div>
                        </div>
                      ) : (
                        renderAlertsList(projectData.alerts)
                      )}
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">项目数据未找到</div>
                );
              })()
            ) : (
              <Alert
                message="请选择项目"
                description="请在项目概览中点击项目卡片查看详细分析"
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

export default BatteryAnalysisPage;
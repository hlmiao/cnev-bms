/**
 * 预测分析页面
 * 基于Mock预测服务展示容量、SOH、故障和成本预测
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Statistic,
  Progress,
  Alert,
  Table,
  Tag,
  Timeline,
  Space,
  Divider,
  message
} from 'antd';
import {
  LineChartOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  DollarOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { simpleCsvDataService, type EnhancedProjectData } from './services/simpleCsvDataService';
import { mockPredictionService, type PredictionReport } from './services/mockPredictionService';

const { Option } = Select;

export const PredictionAnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<EnhancedProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [predictionReport, setPredictionReport] = useState<PredictionReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      generatePrediction();
    }
  }, [selectedProject, projects]);

  /**
   * 加载项目数据
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [p1Data, p2Data] = await Promise.all([
        simpleCsvDataService.loadEnhancedProject1Data('../../../项目1'),
        simpleCsvDataService.loadEnhancedProject2Data('../../../项目2')
      ]);
      const allProjects = [...p1Data, ...p2Data];
      setProjects(allProjects);
      if (allProjects.length > 0 && !selectedProject) {
        setSelectedProject(allProjects[0].projectId);
      }
    } catch (error) {
      console.error('数据加载失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 生成预测报告
   */
  const generatePrediction = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const project = projects.find(p => p.projectId === selectedProject);
      if (project) {
        const report = await mockPredictionService.generateReport(project);
        setPredictionReport(report);
        message.success('预测分析完成');
      }
    } catch (error) {
      console.error('预测生成失败:', error);
      message.error('预测生成失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取风险等级颜色
   */
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#ff7a45';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  /**
   * 获取风险等级文本
   */
  const getRiskText = (level: string) => {
    switch (level) {
      case 'critical': return '极高';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  /**
   * 渲染容量预测图表
   */
  const renderCapacityChart = () => {
    if (!predictionReport) return null;

    const data = [
      {
        month: 0,
        date: '当前',
        value: predictionReport.capacity.currentCapacity,
        type: '实际值'
      },
      ...predictionReport.capacity.predictions.map(p => ({
        month: p.month,
        date: `${p.month}月后`,
        value: p.value,
        type: '预测值'
      })),
      ...predictionReport.capacity.predictions.map(p => ({
        month: p.month,
        date: `${p.month}月后`,
        value: p.lowerBound,
        type: '预测下界'
      })),
      ...predictionReport.capacity.predictions.map(p => ({
        month: p.month,
        date: `${p.month}月后`,
        value: p.upperBound,
        type: '预测上界'
      }))
    ];

    const config = {
      data,
      xField: 'month',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000,
        },
      },
      yAxis: {
        min: 60,
        max: 100,
        label: {
          formatter: (v: string) => `${v}%`
        }
      },
      legend: {
        position: 'top' as const
      },
      tooltip: {
        formatter: (datum: any) => {
          return {
            name: datum.type,
            value: `${datum.value.toFixed(1)}%`
          };
        }
      },
      color: ['#1890ff', '#52c41a', '#faad14', '#ff7a45']
    };

    return <Line {...config} />;
  };

  /**
   * 渲染SOH预测图表
   */
  const renderSOHChart = () => {
    if (!predictionReport) return null;

    const data = [
      {
        month: 0,
        value: predictionReport.soh.currentSOH,
        type: '实际值'
      },
      ...predictionReport.soh.predictions.map(p => ({
        month: p.month,
        value: p.value,
        type: '预测值'
      })),
      ...predictionReport.soh.predictions.map(p => ({
        month: p.month,
        value: p.lowerBound,
        type: '预测下界'
      })),
      ...predictionReport.soh.predictions.map(p => ({
        month: p.month,
        value: p.upperBound,
        type: '预测上界'
      }))
    ];

    const config = {
      data,
      xField: 'month',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000,
        },
      },
      yAxis: {
        min: 60,
        max: 100,
        label: {
          formatter: (v: string) => `${v}%`
        }
      },
      legend: {
        position: 'top' as const
      },
      color: ['#1890ff', '#52c41a', '#faad14', '#ff7a45']
    };

    return <Line {...config} />;
  };

  /**
   * 渲染成本预测图表
   */
  const renderCostChart = () => {
    if (!predictionReport) return null;

    const data = predictionReport.cost.maintenanceCosts.map(item => ({
      month: item.month,
      cost: item.cost,
      type: '维护成本'
    }));

    const config = {
      data,
      xField: 'month',
      yField: 'cost',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000,
        },
      },
      yAxis: {
        label: {
          formatter: (v: string) => `¥${(parseInt(v) / 1000).toFixed(1)}k`
        }
      },
      tooltip: {
        formatter: (datum: any) => {
          return {
            name: '维护成本',
            value: `¥${datum.cost.toLocaleString()}`
          };
        }
      },
      color: ['#722ed1']
    };

    return <Line {...config} />;
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LineChartOutlined />
              预测分析
            </h2>
            <p className="text-gray-500">基于AI模型的容量、SOH、故障和成本预测</p>
          </div>
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="选择项目"
              value={selectedProject}
              onChange={setSelectedProject}
              loading={loading}
            >
              {projects.map(p => (
                <Option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={generatePrediction} loading={loading}>
              重新预测
            </Button>
          </Space>
        </div>
      </div>

      {predictionReport ? (
        <>
          {/* 综合评估 */}
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <div className="text-center">
                  <div className="mb-2">
                    <Progress
                      type="circle"
                      percent={100 - predictionReport.fault.riskScore}
                      size={100}
                      strokeColor={getRiskColor(predictionReport.overallRisk)}
                      format={() => (
                        <div>
                          <div className="text-2xl font-bold">{getRiskText(predictionReport.overallRisk)}</div>
                          <div className="text-xs text-gray-500">综合风险</div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </Col>
              <Col xs={24} md={18}>
                <Alert
                  message="预测摘要"
                  description={
                    <div className="whitespace-pre-line text-sm">
                      {predictionReport.summary}
                    </div>
                  }
                  type={
                    predictionReport.overallRisk === 'critical' ? 'error' :
                    predictionReport.overallRisk === 'high' ? 'warning' :
                    predictionReport.overallRisk === 'medium' ? 'info' : 'success'
                  }
                  showIcon
                />
                <div className="mt-3 text-xs text-gray-400">
                  生成时间：{predictionReport.generatedAt.toLocaleString()}
                </div>
              </Col>
            </Row>
          </Card>

          {/* 容量预测 */}
          <Card title={<span><ThunderboltOutlined /> 容量预测</span>} className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="当前容量保持率"
                  value={predictionReport.capacity.currentCapacity}
                  suffix="%"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: predictionReport.capacity.currentCapacity >= 80 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="月均衰减率"
                  value={predictionReport.capacity.degradationRate}
                  suffix="%/月"
                  prefix={<FallOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="预计剩余月数"
                  value={predictionReport.capacity.remainingMonths || '>12'}
                  suffix="月"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ 
                    color: (predictionReport.capacity.remainingMonths || 13) <= 6 ? '#cf1322' : '#3f8600' 
                  }}
                />
              </Col>
            </Row>

            <Divider />

            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">容量趋势预测（未来12个月）</h4>
              <div style={{ height: 300 }}>
                {renderCapacityChart()}
              </div>
            </div>

            {predictionReport.capacity.reachThresholdDate && (
              <Alert
                message="容量告警"
                description={`预计在 ${predictionReport.capacity.reachThresholdDate} 容量将低于80%阈值`}
                type="warning"
                showIcon
                className="mb-3"
              />
            )}

            <Alert
              message="建议"
              description={predictionReport.capacity.recommendation}
              type="info"
              showIcon
            />
          </Card>

          {/* SOH预测 */}
          <Card title={<span><CheckCircleOutlined /> SOH预测</span>} className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="当前SOH"
                  value={predictionReport.soh.currentSOH}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: predictionReport.soh.currentSOH >= 80 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="月均衰减率"
                  value={predictionReport.soh.degradationRate}
                  suffix="%/月"
                  prefix={<FallOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="预计剩余寿命"
                  value={predictionReport.soh.estimatedLifeMonths}
                  suffix="月"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ 
                    color: predictionReport.soh.estimatedLifeMonths <= 12 ? '#cf1322' : '#3f8600' 
                  }}
                />
              </Col>
            </Row>

            <Divider />

            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">SOH趋势预测（未来12个月）</h4>
              <div style={{ height: 300 }}>
                {renderSOHChart()}
              </div>
            </div>

            <Alert
              message="建议更换日期"
              description={`预计在 ${predictionReport.soh.replacementDate} 需要更换电池`}
              type="info"
              showIcon
              className="mb-3"
            />

            <Alert
              message="建议"
              description={predictionReport.soh.recommendation}
              type="info"
              showIcon
            />
          </Card>

          {/* 故障预测 */}
          <Card title={<span><WarningOutlined /> 故障风险预测</span>} className="mb-4">
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={12}>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-4xl font-bold mb-2" style={{ color: getRiskColor(predictionReport.fault.riskLevel) }}>
                    {predictionReport.fault.riskScore}
                  </div>
                  <div className="text-sm text-gray-500">风险评分</div>
                  <Tag color={getRiskColor(predictionReport.fault.riskLevel)} className="mt-2">
                    {getRiskText(predictionReport.fault.riskLevel)}风险
                  </Tag>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-4xl font-bold mb-2 text-orange-500">
                    {predictionReport.fault.potentialFaults.length}
                  </div>
                  <div className="text-sm text-gray-500">潜在故障类型</div>
                  <div className="mt-2 text-xs text-gray-400">
                    需要关注和预防
                  </div>
                </div>
              </Col>
            </Row>

            <Divider>潜在故障详情</Divider>

            <Timeline>
              {predictionReport.fault.potentialFaults.map((fault, index) => (
                <Timeline.Item
                  key={index}
                  color={getRiskColor(fault.severity)}
                  dot={<ExclamationCircleOutlined />}
                >
                  <Card size="small" className="mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-base">{fault.type}</span>
                        <Tag color={getRiskColor(fault.severity)} className="ml-2">
                          {getRiskText(fault.severity)}
                        </Tag>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-500">{fault.probability}%</div>
                        <div className="text-xs text-gray-500">发生概率</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">{fault.description}</div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      预计发生时间：{fault.estimatedDate}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">预防措施：</div>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {fault.prevention.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>

            <Alert
              message="建议"
              description={predictionReport.fault.recommendation}
              type={
                predictionReport.fault.riskLevel === 'critical' ? 'error' :
                predictionReport.fault.riskLevel === 'high' ? 'warning' : 'info'
              }
              showIcon
            />
          </Card>

          {/* 成本预测 */}
          <Card title={<span><DollarOutlined /> 成本预测</span>}>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={8}>
                <Statistic
                  title="未来12个月总成本"
                  value={predictionReport.cost.totalCost12Months}
                  prefix="¥"
                  precision={0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="成本趋势"
                  value={
                    predictionReport.cost.costTrend === 'increasing' ? '上升' :
                    predictionReport.cost.costTrend === 'stable' ? '稳定' : '下降'
                  }
                  prefix={
                    predictionReport.cost.costTrend === 'increasing' ? <RiseOutlined /> :
                    predictionReport.cost.costTrend === 'stable' ? <MinusOutlined /> :
                    <FallOutlined />
                  }
                  valueStyle={{ 
                    color: predictionReport.cost.costTrend === 'increasing' ? '#cf1322' :
                           predictionReport.cost.costTrend === 'stable' ? '#1890ff' : '#3f8600'
                  }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="预计更换成本"
                  value={predictionReport.cost.replacementCost.cost}
                  prefix="¥"
                  precision={0}
                  valueStyle={{ color: '#ff7a45' }}
                />
              </Col>
            </Row>

            <Divider />

            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">维护成本趋势（未来12个月）</h4>
              <div style={{ height: 300 }}>
                {renderCostChart()}
              </div>
            </div>

            <Divider>月度成本明细</Divider>

            <Table
              dataSource={predictionReport.cost.maintenanceCosts}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
              columns={[
                {
                  title: '月份',
                  dataIndex: 'month',
                  key: 'month',
                  width: 80,
                  render: (month: number) => `第${month}月`
                },
                {
                  title: '日期',
                  dataIndex: 'date',
                  key: 'date',
                  width: 120
                },
                {
                  title: '成本（元）',
                  dataIndex: 'cost',
                  key: 'cost',
                  width: 120,
                  render: (cost: number) => `¥${cost.toLocaleString()}`
                },
                {
                  title: '成本项目',
                  dataIndex: 'items',
                  key: 'items',
                  render: (items: string[]) => (
                    <Space wrap>
                      {items.map((item, idx) => (
                        <Tag key={idx}>{item}</Tag>
                      ))}
                    </Space>
                  )
                }
              ]}
            />

            <Divider />

            <Alert
              message="更换成本说明"
              description={
                <div>
                  <div className="mb-2">
                    <strong>预计更换日期：</strong>{predictionReport.cost.replacementCost.estimatedDate}
                  </div>
                  <div className="mb-2">
                    <strong>更换成本：</strong>¥{predictionReport.cost.replacementCost.cost.toLocaleString()}
                  </div>
                  <div>
                    <strong>说明：</strong>{predictionReport.cost.replacementCost.description}
                  </div>
                </div>
              }
              type="warning"
              showIcon
              className="mb-3"
            />

            <Alert
              message="建议"
              description={predictionReport.cost.recommendation}
              type="info"
              showIcon
            />
          </Card>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            {loading ? '正在生成预测报告...' : '请选择项目并点击"重新预测"按钮'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PredictionAnalysisPage;

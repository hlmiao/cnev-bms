/**
 * AI运维指导页面
 * 集成智能问答、故障诊断、知识库、运维建议和历史记录
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Tabs,
  Input,
  Button,
  List,
  Steps,
  Tag,
  Empty,
  Space,
  Select,
  Collapse,
  Timeline,
  Badge,
  message
} from 'antd';
import {
  MessageOutlined,
  RobotOutlined,
  BookOutlined,
  BulbOutlined,
  HistoryOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { mockAIService, type AIMessage, type DiagnosticStep, type MaintenanceSuggestion, type KnowledgeItem, type DiagnosticHistory } from './services/mockAIService';
import { simpleCsvDataService, type EnhancedProjectData } from './services/simpleCsvDataService';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

export const AIMaintenancePage: React.FC = () => {
  // 数据状态
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<EnhancedProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // 智能问答状态
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 故障诊断状态
  const [diagnosisIssue, setDiagnosisIssue] = useState('');
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([]);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  // 运维建议状态
  const [suggestions, setSuggestions] = useState<MaintenanceSuggestion[]>([]);

  // 知识库状态
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [filteredKnowledge, setFilteredKnowledge] = useState<KnowledgeItem[]>([]);

  // 历史记录状态
  const [diagnosticHistory, setDiagnosticHistory] = useState<DiagnosticHistory[]>([]);

  useEffect(() => {
    loadData();
    loadKnowledgeBase();
    loadDiagnosticHistory();
  }, []);

  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      loadSuggestions();
    }
  }, [selectedProject, projects]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
   * 加载知识库
   */
  const loadKnowledgeBase = () => {
    const kb = mockAIService.getKnowledgeBase();
    setKnowledgeBase(kb);
    setFilteredKnowledge(kb);
  };

  /**
   * 加载诊断历史
   */
  const loadDiagnosticHistory = () => {
    const history = mockAIService.getDiagnosticHistory();
    setDiagnosticHistory(history);
  };

  /**
   * 加载运维建议
   */
  const loadSuggestions = async () => {
    if (!selectedProject) return;
    const project = projects.find(p => p.projectId === selectedProject);
    if (project) {
      const sug = await mockAIService.getSuggestions(project);
      setSuggestions(sug);
    }
  };

  /**
   * 发送聊天消息
   */
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    setChatLoading(true);
    try {
      await mockAIService.chat(chatInput, { projects });
      setChatMessages(mockAIService.getChatHistory());
      setChatInput('');
    } catch (error) {
      console.error('AI响应失败:', error);
      message.error('AI响应失败');
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * 开始诊断
   */
  const handleStartDiagnosis = async () => {
    if (!diagnosisIssue.trim()) {
      message.warning('请输入要诊断的问题');
      return;
    }

    setDiagnosisLoading(true);
    try {
      const project = selectedProject ? projects.find(p => p.projectId === selectedProject) : undefined;
      const steps = await mockAIService.diagnose(diagnosisIssue, project);
      setDiagnosticSteps(steps);

      // 保存到历史记录
      if (project) {
        mockAIService.saveDiagnosticHistory({
          projectId: project.projectId,
          projectName: project.projectName,
          issue: diagnosisIssue,
          diagnosis: `完成${steps.length}步诊断流程`,
          solution: steps[steps.length - 1].result || '待执行',
          status: 'pending'
        });
        loadDiagnosticHistory();
      }
    } catch (error) {
      console.error('诊断失败:', error);
      message.error('诊断失败');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  /**
   * 搜索知识库
   */
  const handleSearchKnowledge = (keyword: string) => {
    setKnowledgeSearch(keyword);
    if (!keyword.trim()) {
      setFilteredKnowledge(knowledgeBase);
    } else {
      const results = mockAIService.searchKnowledge(keyword);
      setFilteredKnowledge(results);
    }
  };

  /**
   * 获取优先级颜色
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  /**
   * 获取步骤状态图标
   */
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'checking': return <ClockCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <RobotOutlined />
              AI运维指导
            </h2>
            <p className="text-gray-500">基于AI的智能运维助手，提供故障诊断和维护建议</p>
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
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>
      </div>

      {/* Tab标签页 */}
      <Card>
        <Tabs defaultActiveKey="chat" type="card">
          {/* 智能问答 */}
          <TabPane
            tab={
              <span>
                <MessageOutlined />
                智能问答
              </span>
            }
            key="chat"
          >
            <div className="flex flex-col" style={{ height: '600px' }}>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded">
                {chatMessages.length === 0 ? (
                  <Empty
                    description="开始对话，我可以帮您分析电池状态、诊断问题、提供建议"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {msg.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* 输入框 */}
              <div className="flex gap-2">
                <TextArea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="输入您的问题... (Shift+Enter换行)"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  disabled={chatLoading}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={chatLoading}
                  disabled={!chatInput.trim()}
                >
                  发送
                </Button>
              </div>

              {/* 快捷问题 */}
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">快捷问题：</div>
                <Space wrap>
                  <Button size="small" onClick={() => setChatInput('当前系统一致性如何？')}>
                    一致性分析
                  </Button>
                  <Button size="small" onClick={() => setChatInput('电池容量状态怎么样？')}>
                    容量状态
                  </Button>
                  <Button size="small" onClick={() => setChatInput('有哪些告警需要处理？')}>
                    告警情况
                  </Button>
                  <Button size="small" onClick={() => setChatInput('如何改善电池一致性？')}>
                    改善建议
                  </Button>
                </Space>
              </div>
            </div>
          </TabPane>

          {/* 故障诊断向导 */}
          <TabPane
            tab={
              <span>
                <ExclamationCircleOutlined />
                故障诊断
              </span>
            }
            key="diagnosis"
          >
            <div className="space-y-4">
              {/* 诊断输入 */}
              <Card size="small" title="描述问题">
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    style={{ width: '30%' }}
                    placeholder="问题类型"
                    value={diagnosisIssue}
                    onChange={setDiagnosisIssue}
                  >
                    <Option value="一致性差">一致性差</Option>
                    <Option value="容量衰减">容量衰减</Option>
                    <Option value="温度异常">温度异常</Option>
                    <Option value="电压异常">电压异常</Option>
                    <Option value="充电故障">充电故障</Option>
                    <Option value="放电故障">放电故障</Option>
                  </Select>
                  <Input
                    placeholder="或输入自定义问题描述..."
                    value={diagnosisIssue}
                    onChange={(e) => setDiagnosisIssue(e.target.value)}
                  />
                  <Button
                    type="primary"
                    onClick={handleStartDiagnosis}
                    loading={diagnosisLoading}
                    disabled={!diagnosisIssue.trim()}
                  >
                    开始诊断
                  </Button>
                </Space.Compact>
              </Card>

              {/* 诊断步骤 */}
              {diagnosticSteps.length > 0 && (
                <Card size="small" title="诊断流程">
                  <Steps 
                    direction="vertical" 
                    current={diagnosticSteps.findIndex(s => s.status === 'pending')}
                    items={diagnosticSteps.map((step) => ({
                      title: step.title,
                      description: (
                        <div className="mt-2">
                          <div className="text-gray-600 mb-2">{step.description}</div>
                          <div className="mb-2">
                            <div className="text-sm font-medium mb-1">检查项：</div>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {step.checkItems.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          {step.result && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>结果：</strong> {step.result}
                            </div>
                          )}
                        </div>
                      ),
                      status: (
                        step.status === 'completed' ? 'finish' :
                        step.status === 'checking' ? 'process' :
                        step.status === 'failed' ? 'error' : 'wait'
                      ) as 'wait' | 'process' | 'finish' | 'error',
                      icon: getStepIcon(step.status)
                    }))}
                  />
                </Card>
              )}

              {diagnosticSteps.length === 0 && !diagnosisLoading && (
                <Empty description="请选择或输入问题，开始诊断流程" />
              )}
            </div>
          </TabPane>

          {/* 知识库 */}
          <TabPane
            tab={
              <span>
                <BookOutlined />
                知识库
              </span>
            }
            key="knowledge"
          >
            <div className="space-y-4">
              {/* 搜索框 */}
              <Input
                placeholder="搜索知识库..."
                prefix={<SearchOutlined />}
                value={knowledgeSearch}
                onChange={(e) => handleSearchKnowledge(e.target.value)}
                allowClear
              />

              {/* 知识列表 */}
              {filteredKnowledge.length > 0 ? (
                <Collapse accordion>
                  {filteredKnowledge.map((item) => (
                    <Panel
                      key={item.id}
                      header={
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.question}</span>
                          <Tag color="blue">{item.category}</Tag>
                        </div>
                      }
                    >
                      <div className="space-y-3">
                        <div className="text-gray-700">{item.answer}</div>
                        
                        <div>
                          <div className="text-sm text-gray-500 mb-1">标签：</div>
                          <Space wrap>
                            {item.tags.map((tag, idx) => (
                              <Tag key={idx}>{tag}</Tag>
                            ))}
                          </Space>
                        </div>

                        {item.relatedQuestions.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">相关问题：</div>
                            <ul className="list-disc list-inside text-sm text-blue-600">
                              {item.relatedQuestions.map((q, idx) => (
                                <li key={idx} className="cursor-pointer hover:underline">
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Panel>
                  ))}
                </Collapse>
              ) : (
                <Empty description="未找到相关知识" />
              )}
            </div>
          </TabPane>

          {/* 运维建议 */}
          <TabPane
            tab={
              <span>
                <BulbOutlined />
                运维建议
                {suggestions.length > 0 && (
                  <Badge count={suggestions.length} offset={[10, 0]} />
                )}
              </span>
            }
            key="suggestions"
          >
            {!selectedProject ? (
              <Empty description="请先选择项目" />
            ) : suggestions.length > 0 ? (
              <List
                dataSource={suggestions}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      size="small"
                      className="w-full"
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.title}</span>
                          <Space>
                            <Tag color={getPriorityColor(item.priority)}>
                              {item.priority === 'high' ? '高优先级' : 
                               item.priority === 'medium' ? '中优先级' : '低优先级'}
                            </Tag>
                            <Tag>{item.category}</Tag>
                          </Space>
                        </div>
                      }
                    >
                      <div className="space-y-3">
                        <div className="text-gray-700">{item.description}</div>

                        <div>
                          <div className="text-sm font-medium mb-2">操作步骤：</div>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            {item.actions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-gray-500">预期效果：</span>
                            <span className="text-green-600 ml-2">{item.expectedResult}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            预计时间：{item.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="当前项目运行正常，暂无特殊建议" />
            )}
          </TabPane>

          {/* 历史记录 */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                历史记录
              </span>
            }
            key="history"
          >
            {diagnosticHistory.length > 0 ? (
              <Timeline mode="left">
                {diagnosticHistory.map((record) => (
                  <Timeline.Item
                    key={record.id}
                    label={record.timestamp.toLocaleString()}
                    color={
                      record.status === 'resolved' ? 'green' :
                      record.status === 'pending' ? 'blue' : 'orange'
                    }
                  >
                    <Card size="small">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{record.projectName}</span>
                          <Tag color={
                            record.status === 'resolved' ? 'green' :
                            record.status === 'pending' ? 'blue' : 'orange'
                          }>
                            {record.status === 'resolved' ? '已解决' :
                             record.status === 'pending' ? '处理中' : '监控中'}
                          </Tag>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">问题：</div>
                          <div className="text-gray-700">{record.issue}</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">诊断：</div>
                          <div className="text-gray-700">{record.diagnosis}</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">解决方案：</div>
                          <div className="text-gray-700">{record.solution}</div>
                        </div>
                      </div>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无诊断历史记录" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AIMaintenancePage;

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Button } from 'antd';
import { 
  GlobalOutlined, 
  BankOutlined, 
  ThunderboltOutlined, 
  ReloadOutlined,
  DatabaseOutlined,
  PoweroffOutlined
} from '@ant-design/icons';
import { KPICard } from './components/cards/KPICard';
import { ProjectCard } from './components/cards/ProjectCard';
import { loadProjects, loadSummary } from './services/dataLoader';
import { csvDataService, type ProjectDataSummary } from './services/csvDataService';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

export const DashboardNoMap: React.FC = () => {
  const navigate = useNavigate();
  const [csvLoading, setCsvLoading] = useState(false);
  const [project1Data, setProject1Data] = useState<ProjectDataSummary[]>([]);
  const [project2Data, setProject2Data] = useState<ProjectDataSummary[]>([]);
  
  // 加载原有项目数据
  const projectsData = loadProjects();
  const summaryData = loadSummary();

  // CSV数据路径配置
  const PROJECT1_DATA_PATH = '../../../项目1';
  const PROJECT2_DATA_PATH = '../../../项目2';

  useEffect(() => {
    loadCsvData();
  }, []);

  /**
   * 加载CSV数据
   */
  const loadCsvData = async () => {
    setCsvLoading(true);
    try {
      console.log('开始加载CSV数据...');
      
      // 先尝试加载项目1数据
      try {
        const p1Data = await csvDataService.loadProject1Data(PROJECT1_DATA_PATH);
        console.log('项目1数据加载成功:', p1Data);
        setProject1Data(p1Data);
      } catch (error) {
        console.warn('项目1 CSV数据加载失败:', error);
      }

      // 再尝试加载项目2数据
      try {
        const p2Data = await csvDataService.loadProject2Data(PROJECT2_DATA_PATH);
        console.log('项目2数据加载成功:', p2Data);
        setProject2Data(p2Data);
      } catch (error) {
        console.warn('项目2 CSV数据加载失败:', error);
      }
      
    } catch (error) {
      console.error('CSV数据加载失败:', error);
    } finally {
      setCsvLoading(false);
    }
  };

  /**
   * 处理项目点击
   */
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  /**
   * 处理CSV项目点击
   */
  const handleCsvProjectClick = () => {
    navigate('/csv-data');
  };

  /**
   * 计算CSV数据统计
   */
  const getCsvStats = () => {
    const allCsvProjects = [...project1Data, ...project2Data];
    const totalBanks = allCsvProjects.reduce((sum, p) => sum + p.summary.bankCount, 0);
    const avgQuality = allCsvProjects.length > 0 
      ? allCsvProjects.reduce((sum, p) => {
          const quality = (p.dataQuality.completeness + p.dataQuality.accuracy + p.dataQuality.consistency + p.dataQuality.timeliness) / 4;
          return sum + quality;
        }, 0) / allCsvProjects.length
      : 0;

    return {
      projectCount: allCsvProjects.length,
      bankCount: totalBanks,
      avgQuality: Math.round(avgQuality)
    };
  };

  const csvStats = getCsvStats();

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">全球储能平台总览</h1>
          <p className="text-gray-500">实时监控全球储能项目运行状态</p>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadCsvData}
          loading={csvLoading}
        >
          刷新CSV数据
        </Button>
      </div>

      {/* 全局KPI指标 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <KPICard
            title="总项目数"
            value={summaryData.totalProjects + csvStats.projectCount}
            unit="个"
            precision={0}
            icon={<GlobalOutlined />}
            status="normal"
          />
        </Col>
        <Col xs={12} sm={6}>
          <KPICard
            title="总Bank数"
            value={summaryData.totalBanks + csvStats.bankCount}
            unit="个"
            precision={0}
            icon={<BankOutlined />}
            status="normal"
          />
        </Col>
        <Col xs={12} sm={6}>
          <KPICard
            title="总容量"
            value={summaryData.totalCapacity}
            unit="MWh"
            precision={0}
            icon={<PoweroffOutlined />}
            status="normal"
          />
        </Col>
        <Col xs={12} sm={6}>
          <KPICard
            title="总功率"
            value={summaryData.totalPower}
            unit="MW"
            precision={1}
            icon={<ThunderboltOutlined />}
            status="normal"
          />
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 左侧：项目列表（不包含地图） */}
        <Col xs={24} lg={16}>
          <Card title="项目列表">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {projectsData.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  status={project.status as any}
                  voltage={775.4} // 模拟数据
                  current={-125.6} // 模拟数据
                  soc={85.2}
                  soh={89}
                  bankCount={project.bankCount}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧：CSV数据概览 */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <DatabaseOutlined />
                <span>CSV数据概览</span>
              </div>
            }
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/csv-data')}
              >
                查看详情
              </Button>
            }
            loading={csvLoading}
          >
            <div className="space-y-4">
              {/* CSV统计 */}
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{project1Data.length}</div>
                    <div className="text-sm text-gray-500">项目1系统</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{project2Data.length}</div>
                    <div className="text-sm text-gray-500">项目2组</div>
                  </div>
                </Col>
              </Row>

              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{csvStats.bankCount}</div>
                    <div className="text-sm text-gray-500">CSV Bank数</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{csvStats.avgQuality}%</div>
                    <div className="text-sm text-gray-500">平均质量</div>
                  </div>
                </Col>
              </Row>

              {/* CSV项目列表 */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">项目1数据</div>
                {project1Data.map((project) => (
                  <div 
                    key={project.projectId}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleCsvProjectClick()}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{project.projectName}</span>
                      <span className="text-xs text-gray-500">{project.summary.bankCount} Banks</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>SOC: {project.summary.avgSoc.toFixed(1)}%</span>
                      <span>SOH: {project.summary.avgSoh.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}

                <div className="text-sm font-medium text-gray-700 mb-2 mt-4">项目2数据</div>
                {project2Data.map((project) => (
                  <div 
                    key={project.projectId}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleCsvProjectClick()}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{project.projectName}</span>
                      <span className="text-xs text-gray-500">{project.summary.bankCount} Banks</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>SOC: {project.summary.avgSoc.toFixed(1)}%</span>
                      <span>SOH: {project.summary.avgSoh.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}

                {project1Data.length === 0 && project2Data.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    <div className="text-sm">暂无CSV数据</div>
                    <div className="text-xs mt-1">请检查数据路径配置</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardNoMap;
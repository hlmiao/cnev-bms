import React from 'react';
import { Card, Row, Col, Tag, Button } from 'antd';
import { EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import projectsData from '../../data/projects.json';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = projectsData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'green';
      case 'warning': return 'orange';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常';
      case 'warning': return '警告';
      case 'error': return '异常';
      default: return '未知';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <p className="text-gray-500">管理和查看所有储能项目</p>
      </div>

      <Row gutter={[16, 16]}>
        {projects.map((project) => (
          <Col xs={24} sm={12} lg={8} key={project.id}>
            <Card
              title={project.name}
              extra={
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  查看
                </Button>
              }
              className="h-full"
            >
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvironmentOutlined className="mr-2 text-gray-400" />
                  <span>{project.location}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>状态:</span>
                  <Tag color={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Tag>
                </div>
                
                <div className="flex justify-between">
                  <span>容量:</span>
                  <span>{project.ratedCapacity} MWh</span>
                </div>
                
                <div className="flex justify-between">
                  <span>功率:</span>
                  <span>{project.ratedPower} MW</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Bank数量:</span>
                  <span>{project.bankCount} 个</span>
                </div>
                
                <div className="flex justify-between">
                  <span>投运时间:</span>
                  <span>{new Date(project.commissionDate).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Projects;
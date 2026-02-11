import React from 'react';
import { Card, Descriptions, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import projectsData from '../../data/projects.json';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projectsData.projects.find(p => p.id === projectId);

  if (!project) {
    return <div>项目未找到</div>;
  }

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
      <h1 className="text-2xl font-bold mb-6">{project.name}</h1>
      
      <Card title="项目详情">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="项目ID">{project.id}</Descriptions.Item>
          <Descriptions.Item label="项目类型">{project.type}</Descriptions.Item>
          <Descriptions.Item label="位置">{project.location}</Descriptions.Item>
          <Descriptions.Item label="国家">{project.country}</Descriptions.Item>
          <Descriptions.Item label="区域">{project.region}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(project.status)}>
              {getStatusText(project.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="额定容量">{project.ratedCapacity} MWh</Descriptions.Item>
          <Descriptions.Item label="额定功率">{project.ratedPower} MW</Descriptions.Item>
          <Descriptions.Item label="Stack数量">{project.stackCount} 个</Descriptions.Item>
          <Descriptions.Item label="Bank数量">{project.bankCount} 个</Descriptions.Item>
          <Descriptions.Item label="投运时间">{new Date(project.commissionDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="坐标">
            {project.coordinates.lat}, {project.coordinates.lng}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProjectDetail;
import { Breadcrumb, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation, useParams } from 'react-router-dom';
import projectsData from '../../data/projects.json';

// 层级配置
const levelConfig: Record<string, { level: number; color: string }> = {
  '/': { level: 1, color: '#1890ff' },
  '/projects': { level: 2, color: '#52c41a' },
  '/battery-packs': { level: 3, color: '#faad14' },
  '/cells': { level: 4, color: '#f5222d' },
};

export const AppBreadcrumb = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  
  // 获取项目名称
  const getProjectName = (projectId: string) => {
    const project = projectsData.projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  // 构建面包屑项
  const buildBreadcrumbItems = () => {
    const items = [
      {
        key: 'home',
        title: (
          <Link to="/">
            <HomeOutlined /> 全球总览
            <Tag color="#1890ff" style={{ marginLeft: 4, fontSize: 10 }}>L1</Tag>
          </Link>
        ),
      },
    ];

    let currentPath = '';
    let projectId = '';
    let bankId = '';

    pathSnippets.forEach((snippet, index) => {
      currentPath += `/${snippet}`;
      const isLast = index === pathSnippets.length - 1;

      // 处理不同路径段
      if (snippet === 'project') {
        // 跳过 'project' 本身，等待下一个 projectId
        return;
      }
      
      if (snippet === 'bank') {
        // 跳过 'bank' 本身，等待下一个 bankId
        return;
      }

      if (snippet === 'cell') {
        // 跳过 'cell' 本身，等待下一个 cellId
        return;
      }

      // 项目ID
      if (pathSnippets[index - 1] === 'project') {
        projectId = snippet;
        const projectName = getProjectName(snippet);
        items.push({
          key: currentPath,
          title: isLast ? (
            <span>
              {projectName}
              <Tag color="#52c41a" style={{ marginLeft: 4, fontSize: 10 }}>L2</Tag>
            </span>
          ) : (
            <Link to={`/project/${snippet}`}>
              {projectName}
              <Tag color="#52c41a" style={{ marginLeft: 4, fontSize: 10 }}>L2</Tag>
            </Link>
          ),
        });
        return;
      }

      // Bank ID
      if (pathSnippets[index - 1] === 'bank') {
        bankId = snippet;
        const bankName = snippet.startsWith('group') ? `Group ${snippet.replace('group', '')}` : `Bank ${snippet.replace('bank', '')}`;
        items.push({
          key: currentPath,
          title: isLast ? (
            <span>
              {bankName}
              <Tag color="#faad14" style={{ marginLeft: 4, fontSize: 10 }}>L3</Tag>
            </span>
          ) : (
            <Link to={`/project/${projectId}/bank/${snippet}`}>
              {bankName}
              <Tag color="#faad14" style={{ marginLeft: 4, fontSize: 10 }}>L3</Tag>
            </Link>
          ),
        });
        return;
      }

      // Cell ID
      if (pathSnippets[index - 1] === 'cell') {
        items.push({
          key: currentPath,
          title: (
            <span>
              电芯 V{snippet}
              <Tag color="#f5222d" style={{ marginLeft: 4, fontSize: 10 }}>L4</Tag>
            </span>
          ),
        });
        return;
      }

      // cells 页面（电池组下的单体视图）
      if (snippet === 'cells') {
        items.push({
          key: currentPath,
          title: (
            <span>
              单体数据
              <Tag color="#f5222d" style={{ marginLeft: 4, fontSize: 10 }}>L4</Tag>
            </span>
          ),
        });
        return;
      }

      // 其他页面
      const routeNameMap: Record<string, { name: string; level?: number; color?: string }> = {
        'projects': { name: '项目管理', level: 2, color: '#52c41a' },
        'battery-packs': { name: '电池组管理', level: 3, color: '#faad14' },
        'analysis': { name: '电池组模块分析' },
        'compare': { name: '数据对比' },
        'alerts': { name: '告警中心' },
        'settings': { name: '系统设置' },
      };

      const config = routeNameMap[snippet];
      if (config) {
        items.push({
          key: currentPath,
          title: isLast ? (
            <span>
              {config.name}
              {config.level && <Tag color={config.color} style={{ marginLeft: 4, fontSize: 10 }}>L{config.level}</Tag>}
            </span>
          ) : (
            <Link to={currentPath}>
              {config.name}
              {config.level && <Tag color={config.color} style={{ marginLeft: 4, fontSize: 10 }}>L{config.level}</Tag>}
            </Link>
          ),
        });
      }
    });

    return items;
  };

  return (
    <Breadcrumb
      items={buildBreadcrumbItems()}
      className="mb-4"
    />
  );
};

export default AppBreadcrumb;

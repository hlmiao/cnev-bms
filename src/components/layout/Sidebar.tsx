import { Menu, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  GlobalOutlined,
  AppstoreOutlined,
  BankOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  RobotOutlined,
  LineChartOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import projectsData from '../../data/projects.json';

type MenuItem = Required<MenuProps>['items'][number];

// 层级标签组件
const LevelTag = ({ level }: { level: number }) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'];
  return (
    <Tag 
      color={colors[level - 1]} 
      style={{ 
        marginLeft: 8, 
        fontSize: 10, 
        padding: '0 4px',
        lineHeight: '16px'
      }}
    >
      L{level}
    </Tag>
  );
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = projectsData;

  // 生成项目子菜单（第2级入口）
  const projectSubMenu: MenuItem[] = projects.map((project) => ({
    key: `/project/${project.id}`,
    label: project.name,
    icon: <BankOutlined />,
  }));

  const menuItems: MenuItem[] = [
    // 第1级：全球总览
    { 
      key: '/', 
      label: (
        <span>
          全球总览
          <LevelTag level={1} />
        </span>
      ), 
      icon: <GlobalOutlined /> 
    },
    // 第2级：项目管理（包含项目详情子菜单）
    { 
      key: 'project-management',
      label: (
        <span>
          项目管理
          <LevelTag level={2} />
        </span>
      ), 
      icon: <AppstoreOutlined />,
      children: [
        {
          key: '/projects',
          label: '项目列表',
          icon: <AppstoreOutlined />,
        },
        ...projectSubMenu,
      ],
    },
    // 第3级：样本数据展示
    { 
      key: '/csv-data', 
      label: (
        <span>
          样本数据展示
          <LevelTag level={3} />
        </span>
      ), 
      icon: <FileTextOutlined /> 
    },
    // 第4级：电池分析中心
    { 
      key: '/battery-analysis', 
      label: (
        <span>
          电池分析中心
          <LevelTag level={4} />
        </span>
      ), 
      icon: <ExperimentOutlined /> 
    },
    // 第5级：电池组管理
    { 
      key: '/battery-packs', 
      label: (
        <span>
          电池组管理
          <LevelTag level={5} />
        </span>
      ), 
      icon: <BankOutlined /> 
    },
    // 第6级：AI运维指导
    { 
      key: '/ai-maintenance', 
      label: (
        <span>
          AI运维指导
          <LevelTag level={6} />
        </span>
      ), 
      icon: <RobotOutlined /> 
    },
    // 第7级：预测分析
    { 
      key: '/prediction-analysis', 
      label: (
        <span>
          预测分析
          <LevelTag level={7} />
        </span>
      ), 
      icon: <LineChartOutlined /> 
    },
    // 第8级：远程控制
    { 
      key: '/remote-control', 
      label: (
        <span>
          远程控制
          <LevelTag level={8} />
        </span>
      ), 
      icon: <ControlOutlined /> 
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key !== 'project-management') {
      navigate(key);
    }
  };

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/project/') && path.includes('/bank/')) {
      return ['/battery-packs'];
    }
    if (path.startsWith('/project/')) {
      return [path.split('/bank/')[0]];
    }
    if (path === '/projects') {
      return ['/projects'];
    }
    return [path];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    if (location.pathname.startsWith('/project/') || location.pathname === '/projects') {
      return ['project-management'];
    }
    return [];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <span className="text-xl font-bold text-blue-600">🔋 全球储能平台</span>
      </div>

      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        className="flex-1 border-r-0"
      />
    </div>
  );
};

export default Sidebar;

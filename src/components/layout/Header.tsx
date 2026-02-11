import { Badge, Button, Dropdown, Space, Switch } from 'antd';
import { BellOutlined, UserOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface HeaderProps {
  alertCount?: number;
  isDarkMode?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const Header = ({ alertCount = 0, isDarkMode = false, onThemeChange }: HeaderProps) => {
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人信息' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <div className="h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200">
      <div className="text-lg font-medium text-gray-700">
        电池储能数据可视化平台
      </div>
      <Space size="large">
        <Badge count={alertCount} size="small">
          <Button type="text" icon={<BellOutlined />} />
        </Badge>
        <Space size="small">
          <SunOutlined className={isDarkMode ? 'text-gray-400' : 'text-yellow-500'} />
          <Switch
            size="small"
            checked={isDarkMode}
            onChange={onThemeChange}
          />
          <MoonOutlined className={isDarkMode ? 'text-blue-400' : 'text-gray-400'} />
        </Space>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            Admin
          </Button>
        </Dropdown>
      </Space>
    </div>
  );
};

export default Header;

import { Layout, ConfigProvider, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AppBreadcrumb } from './AppBreadcrumb';
import { useThemeStore } from '../../store';

const { Sider, Content } = Layout;

export const MainLayout = () => {
  const { isDarkMode, setDarkMode } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout className="min-h-screen">
        <Sider
          width={220}
          theme={isDarkMode ? 'dark' : 'light'}
          className="shadow-sm"
        >
          <Sidebar />
        </Sider>
        <Layout>
          <Header
            alertCount={8}
            isDarkMode={isDarkMode}
            onThemeChange={setDarkMode}
          />
          <Content className={`p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <AppBreadcrumb />
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;

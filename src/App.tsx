import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from './components/layout';
import { SimpleDashboard } from './SimpleDashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/Project';
import { BankDetail } from './pages/Bank';
import { Alerts } from './pages/Alerts';
import { Analysis } from './pages/Analysis';
import { Compare } from './pages/Compare';
import { BatteryPacks } from './pages/BatteryPacks';
import { SimpleCsvDataPage } from './SimpleCsvDataPage';
import { BatteryAnalysisPage } from './BatteryAnalysisPage';
import { AIMaintenancePage } from './AIMaintenancePage';
import { PredictionAnalysisPage } from './PredictionAnalysisPage';
import { RemoteControlPage } from './RemoteControlPage';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<SimpleDashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="project/:projectId" element={<ProjectDetail />} />
            <Route path="project/:projectId/bank/:bankId" element={<BankDetail />} />
            <Route path="battery-packs" element={<BatteryPacks />} />
            <Route path="csv-data" element={<SimpleCsvDataPage />} />
            <Route path="battery-analysis" element={<BatteryAnalysisPage />} />
            <Route path="ai-maintenance" element={<AIMaintenancePage />} />
            <Route path="prediction-analysis" element={<PredictionAnalysisPage />} />
            <Route path="remote-control" element={<RemoteControlPage />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="compare" element={<Compare />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<div className="p-4">系统设置页面 - 开发中</div>} />
            <Route path="*" element={<div className="p-4">页面未找到</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

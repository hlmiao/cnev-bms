import projectsData from '../data/projects.json';
import project1Data from '../data/project1-2.json';
import bankCellsData from '../data/bank-cells.json';
import alertsData from '../data/alerts.json';

// 加载项目列表
export const loadProjects = () => {
  return projectsData;
};

// 加载项目详情
export const loadProjectDetail = (projectId: string) => {
  // 目前只有project1-2的数据
  if (projectId === 'project1-2') {
    return project1Data;
  }
  // 返回模拟数据
  return {
    ...project1Data,
    projectId,
    projectName: `项目 ${projectId}`,
  };
};

// 加载Bank单体数据
export const loadBankCells = (projectId: string, bankId: string) => {
  // 目前只有一份数据
  return {
    ...bankCellsData,
    projectId,
    bankId,
  };
};

// 加载告警数据
export const loadAlerts = () => {
  return alertsData;
};

// 加载汇总数据
export const loadSummary = () => {
  return projectsData.summary;
};

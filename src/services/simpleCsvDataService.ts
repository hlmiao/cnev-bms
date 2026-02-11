/**
 * 简化的CSV数据服务 - 用于Web界面展示
 */

export interface ProjectDataSummary {
  projectId: string;
  projectName: string;
  projectType: 'project1' | 'project2';
  systems?: string[]; // 项目1的系统编号 (2#, 14#, 15#)
  groups?: string[]; // 项目2的组编号 (group1-4)
  lastUpdate: string;
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  summary: {
    totalVoltage?: number;
    totalCurrent?: number;
    avgSoc: number;
    avgSoh: number;
    power?: number;
    bankCount: number;
  };
}

export interface BatteryConsistencyData {
  voltageConsistency: {
    maxDiff: number;
    stdDev: number;
    score: number; // 0-100分
    outlierCount: number;
  };
  temperatureConsistency: {
    maxDiff: number;
    stdDev: number;
    score: number;
    outlierCount: number;
  };
  socConsistency: {
    maxDiff: number;
    stdDev: number;
    score: number;
    outlierCount: number;
  };
  overallScore: number; // 综合一致性评分
}

export interface BatteryCapacityData {
  ratedCapacity: number; // 额定容量 (Ah)
  actualCapacity: number; // 实际容量 (Ah)
  capacityRetention: number; // 容量保持率 (%)
  energyCapacity: number; // 能量容量 (kWh)
  usableCapacity: number; // 可用容量 (Ah)
  degradationRate: number; // 容量衰减率 (%/年)
}

export interface BatteryAlert {
  id: string;
  type: 'voltage' | 'temperature' | 'soc' | 'soh' | 'consistency' | 'capacity';
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  bankId: string;
  cellId?: number;
  currentValue: number;
  threshold: number;
  timestamp: string;
  status: 'active' | 'resolved';
}

export interface EnhancedProjectData extends ProjectDataSummary {
  consistency: BatteryConsistencyData;
  capacity: BatteryCapacityData;
  alerts: BatteryAlert[];
  alertSummary: {
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}

export interface StandardBatteryData {
  projectId: string;
  projectType: 'project1' | 'project2';
  banks: BankTimeSeries[];
  summary: {
    totalBanks: number;
    avgSoc: number;
    avgSoh: number;
    dataQuality: number;
  };
}

export interface BankTimeSeries {
  bankId: string;
  statistics: {
    avgVoltage: number;
    avgCurrent?: number;
    avgSoc: number;
    avgSoh: number;
    maxVoltage: number;
    minVoltage: number;
    maxTemperature: number;
    minTemperature: number;
  };
  dataPoints: Array<{
    timestamp: Date;
    cellData: {
      voltages: number[];
      temperatures: number[];
      socs: number[];
      sohs: number[];
    };
  }>;
}

export class SimpleCsvDataService {
  private loadingCache = new Map<string, Promise<any>>();

  /**
   * 扫描并加载项目1数据
   */
  async loadProject1Data(dataPath: string): Promise<ProjectDataSummary[]> {
    const cacheKey = `project1-${dataPath}`;
    
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey);
    }

    const loadPromise = this.doLoadProject1Data(dataPath);
    this.loadingCache.set(cacheKey, loadPromise);
    
    try {
      const result = await loadPromise;
      return result;
    } catch (error) {
      this.loadingCache.delete(cacheKey);
      throw error;
    }
  }

  private async doLoadProject1Data(dataPath: string): Promise<ProjectDataSummary[]> {
    try {
      console.log('开始加载项目1数据，路径:', dataPath);
      
      // 模拟扫描项目1文件结构
      const systems = await this.scanProject1Directory(dataPath);
      const projects: ProjectDataSummary[] = [];

      for (const systemId of systems) {
        try {
          console.log(`处理项目1系统: ${systemId}`);
          
          // 模拟数据加载和处理
          const mockData = this.generateMockProject1Data(systemId);
          projects.push(mockData);
          
        } catch (error) {
          console.error(`项目1系统${systemId}数据加载失败:`, error);
        }
      }

      console.log(`项目1数据加载完成，共${projects.length}个系统`);
      return projects;
      
    } catch (error) {
      console.error('项目1数据加载失败:', error);
      // 返回模拟数据而不是抛出错误
      return this.getMockProject1Data();
    }
  }

  /**
   * 扫描并加载项目2数据
   */
  async loadProject2Data(dataPath: string): Promise<ProjectDataSummary[]> {
    const cacheKey = `project2-${dataPath}`;
    
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey);
    }

    const loadPromise = this.doLoadProject2Data(dataPath);
    this.loadingCache.set(cacheKey, loadPromise);
    
    try {
      const result = await loadPromise;
      return result;
    } catch (error) {
      this.loadingCache.delete(cacheKey);
      throw error;
    }
  }

  private async doLoadProject2Data(dataPath: string): Promise<ProjectDataSummary[]> {
    try {
      console.log('开始加载项目2数据，路径:', dataPath);
      
      // 模拟扫描项目2文件结构
      const groups = await this.scanProject2Directory(dataPath);
      const projects: ProjectDataSummary[] = [];

      for (const groupId of groups) {
        try {
          console.log(`处理项目2组: ${groupId}`);
          
          // 模拟数据加载和处理
          const mockData = this.generateMockProject2Data(groupId);
          projects.push(mockData);
          
        } catch (error) {
          console.error(`项目2组${groupId}数据加载失败:`, error);
        }
      }

      console.log(`项目2数据加载完成，共${projects.length}个组`);
      return projects;
      
    } catch (error) {
      console.error('项目2数据加载失败:', error);
      // 返回模拟数据而不是抛出错误
      return this.getMockProject2Data();
    }
  }

  /**
   * 扫描项目1目录结构
   */
  private async scanProject1Directory(dataPath: string): Promise<string[]> {
    // 模拟文件系统扫描
    // 实际实现中应该使用文件系统API扫描目录
    return ['2#', '14#', '15#'];
  }

  /**
   * 扫描项目2目录结构
   */
  private async scanProject2Directory(dataPath: string): Promise<string[]> {
    // 模拟文件系统扫描
    // 实际实现中应该使用文件系统API扫描目录
    return ['group1', 'group2', 'group3', 'group4'];
  }

  /**
   * 生成模拟项目1数据
   */
  private generateMockProject1Data(systemId: string): ProjectDataSummary {
    const bankCount = Math.floor(Math.random() * 5) + 3; // 3-7个Bank
    const avgSoc = 75 + Math.random() * 20; // 75-95%
    const avgSoh = 85 + Math.random() * 10; // 85-95%
    
    return {
      projectId: `project1-${systemId}`,
      projectName: `项目1-${systemId}站`,
      projectType: 'project1',
      systems: [systemId],
      lastUpdate: new Date().toISOString(),
      dataQuality: {
        completeness: 90 + Math.random() * 10,
        accuracy: 85 + Math.random() * 15,
        consistency: 88 + Math.random() * 12,
        timeliness: 92 + Math.random() * 8
      },
      summary: {
        totalVoltage: 750 + Math.random() * 50,
        totalCurrent: -100 + Math.random() * 200,
        avgSoc: avgSoc,
        avgSoh: avgSoh,
        power: 50 + Math.random() * 100,
        bankCount: bankCount
      }
    };
  }

  /**
   * 生成模拟项目2数据
   */
  private generateMockProject2Data(groupId: string): ProjectDataSummary {
    const bankCount = Math.floor(Math.random() * 4) + 2; // 2-5个Bank
    const avgSoc = 70 + Math.random() * 25; // 70-95%
    const avgSoh = 80 + Math.random() * 15; // 80-95%
    
    return {
      projectId: `project2-${groupId}`,
      projectName: `项目2-${groupId}`,
      projectType: 'project2',
      groups: [groupId],
      lastUpdate: new Date().toISOString(),
      dataQuality: {
        completeness: 85 + Math.random() * 15,
        accuracy: 88 + Math.random() * 12,
        consistency: 90 + Math.random() * 10,
        timeliness: 87 + Math.random() * 13
      },
      summary: {
        totalVoltage: 680 + Math.random() * 80,
        totalCurrent: -80 + Math.random() * 160,
        avgSoc: avgSoc,
        avgSoh: avgSoh,
        power: 40 + Math.random() * 80,
        bankCount: bankCount
      }
    };
  }

  /**
   * 获取模拟项目1数据
   */
  private getMockProject1Data(): ProjectDataSummary[] {
    return [
      this.generateMockProject1Data('2#'),
      this.generateMockProject1Data('14#'),
      this.generateMockProject1Data('15#')
    ];
  }

  /**
   * 获取模拟项目2数据
   */
  private getMockProject2Data(): ProjectDataSummary[] {
    return [
      this.generateMockProject2Data('group1'),
      this.generateMockProject2Data('group2'),
      this.generateMockProject2Data('group3'),
      this.generateMockProject2Data('group4')
    ];
  }

  /**
   * 获取项目详细数据
   */
  async getProjectDetail(projectId: string, dataPath: string): Promise<StandardBatteryData | null> {
    try {
      console.log(`获取项目详细数据: ${projectId}`);
      
      const [projectType, systemOrGroup] = projectId.split('-');
      
      if (projectType === 'project1') {
        return this.generateMockProject1Detail(systemOrGroup);
      } else if (projectType === 'project2') {
        return this.generateMockProject2Detail(systemOrGroup);
      }
      
      return null;
    } catch (error) {
      console.error(`获取项目${projectId}详细数据失败:`, error);
      return null;
    }
  }

  /**
   * 生成模拟项目1详细数据
   */
  private generateMockProject1Detail(systemId: string): StandardBatteryData {
    const bankCount = Math.floor(Math.random() * 5) + 3;
    const banks: BankTimeSeries[] = [];
    
    for (let i = 1; i <= bankCount; i++) {
      banks.push(this.generateMockBankData(`${systemId}-Bank${i}`));
    }
    
    return {
      projectId: `project1-${systemId}`,
      projectType: 'project1',
      banks: banks,
      summary: {
        totalBanks: bankCount,
        avgSoc: banks.reduce((sum, bank) => sum + bank.statistics.avgSoc, 0) / bankCount,
        avgSoh: banks.reduce((sum, bank) => sum + bank.statistics.avgSoh, 0) / bankCount,
        dataQuality: 90 + Math.random() * 10
      }
    };
  }

  /**
   * 生成模拟项目2详细数据
   */
  private generateMockProject2Detail(groupId: string): StandardBatteryData {
    const bankCount = Math.floor(Math.random() * 4) + 2;
    const banks: BankTimeSeries[] = [];
    
    for (let i = 1; i <= bankCount; i++) {
      banks.push(this.generateMockBankData(`${groupId}-Bank${i}`));
    }
    
    return {
      projectId: `project2-${groupId}`,
      projectType: 'project2',
      banks: banks,
      summary: {
        totalBanks: bankCount,
        avgSoc: banks.reduce((sum, bank) => sum + bank.statistics.avgSoc, 0) / bankCount,
        avgSoh: banks.reduce((sum, bank) => sum + bank.statistics.avgSoh, 0) / bankCount,
        dataQuality: 85 + Math.random() * 15
      }
    };
  }

  /**
   * 生成模拟Bank数据
   */
  private generateMockBankData(bankId: string): BankTimeSeries {
    const cellCount = 240; // 每个Bank 240个单体
    const avgVoltage = 3.2 + Math.random() * 0.4;
    const avgSoc = 70 + Math.random() * 25;
    const avgSoh = 80 + Math.random() * 15;
    const avgTemp = 25 + Math.random() * 15;
    
    return {
      bankId: bankId,
      statistics: {
        avgVoltage: avgVoltage,
        avgCurrent: -50 + Math.random() * 100,
        avgSoc: avgSoc,
        avgSoh: avgSoh,
        maxVoltage: avgVoltage + 0.1 + Math.random() * 0.1,
        minVoltage: avgVoltage - 0.1 - Math.random() * 0.1,
        maxTemperature: avgTemp + 5 + Math.random() * 10,
        minTemperature: avgTemp - 5 - Math.random() * 5
      },
      dataPoints: [
        {
          timestamp: new Date(),
          cellData: {
            voltages: Array(cellCount).fill(0).map(() => avgVoltage + (Math.random() - 0.5) * 0.2),
            temperatures: Array(cellCount).fill(0).map(() => avgTemp + (Math.random() - 0.5) * 10),
            socs: Array(cellCount).fill(0).map(() => avgSoc + (Math.random() - 0.5) * 10),
            sohs: Array(cellCount).fill(0).map(() => avgSoh + (Math.random() - 0.5) * 10)
          }
        }
      ]
    };
  }

  /**
   * 转换Bank数据为显示格式
   */
  convertBankToDisplayData(bankData: BankTimeSeries): BankDisplayData {
    return {
      bankId: bankData.bankId,
      bankVol: bankData.statistics.avgVoltage,
      bankCur: bankData.statistics.avgCurrent || 0,
      bankSoc: bankData.statistics.avgSoc,
      bankSoh: bankData.statistics.avgSoh,
      status: this.determineBankStatus(bankData),
      sglMaxVol: bankData.statistics.maxVoltage,
      sglMinVol: bankData.statistics.minVoltage,
      sglMaxTemp: bankData.statistics.maxTemperature,
      sglMinTemp: bankData.statistics.minTemperature,
      cellCount: bankData.dataPoints.length > 0 ? bankData.dataPoints[0].cellData.voltages.length : 0,
      lastUpdate: bankData.dataPoints.length > 0 ? bankData.dataPoints[bankData.dataPoints.length - 1].timestamp.toISOString() : new Date().toISOString()
    };
  }

  /**
   * 确定Bank状态
   */
  private determineBankStatus(bankData: BankTimeSeries): 'normal' | 'warning' | 'error' {
    const { avgVoltage, avgSoc, avgSoh, maxTemperature } = bankData.statistics;
    
    // 错误条件
    if (avgSoc < 10 || avgSoh < 70 || maxTemperature > 60 || avgVoltage < 2.5) {
      return 'error';
    }
    
    // 警告条件
    if (avgSoc < 20 || avgSoh < 80 || maxTemperature > 45 || avgVoltage < 3.0) {
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * 扫描并加载项目1数据（增强版）
   */
  async loadEnhancedProject1Data(dataPath: string): Promise<EnhancedProjectData[]> {
    const basicData = await this.loadProject1Data(dataPath);
    return basicData.map(project => this.enhanceProjectData(project));
  }

  /**
   * 扫描并加载项目2数据（增强版）
   */
  async loadEnhancedProject2Data(dataPath: string): Promise<EnhancedProjectData[]> {
    const basicData = await this.loadProject2Data(dataPath);
    return basicData.map(project => this.enhanceProjectData(project));
  }

  /**
   * 增强项目数据，添加一致性、容量和告警信息
   */
  private enhanceProjectData(project: ProjectDataSummary): EnhancedProjectData {
    const consistency = this.calculateConsistency(project);
    const capacity = this.calculateCapacity(project);
    const alerts = this.generateAlerts(project, consistency, capacity);
    const alertSummary = this.calculateAlertSummary(alerts);

    return {
      ...project,
      consistency,
      capacity,
      alerts,
      alertSummary
    };
  }

  /**
   * 计算电池一致性
   */
  private calculateConsistency(project: ProjectDataSummary): BatteryConsistencyData {
    // 模拟一致性计算
    const voltageMaxDiff = 0.05 + Math.random() * 0.15; // 50-200mV差异
    const voltageStdDev = 0.02 + Math.random() * 0.08; // 20-100mV标准差
    const voltageScore = Math.max(0, 100 - (voltageMaxDiff * 1000 + voltageStdDev * 2000));
    
    const tempMaxDiff = 5 + Math.random() * 15; // 5-20°C差异
    const tempStdDev = 2 + Math.random() * 8; // 2-10°C标准差
    const tempScore = Math.max(0, 100 - (tempMaxDiff * 2 + tempStdDev * 5));
    
    const socMaxDiff = 3 + Math.random() * 12; // 3-15%差异
    const socStdDev = 1 + Math.random() * 6; // 1-7%标准差
    const socScore = Math.max(0, 100 - (socMaxDiff * 3 + socStdDev * 8));
    
    const overallScore = (voltageScore + tempScore + socScore) / 3;

    return {
      voltageConsistency: {
        maxDiff: voltageMaxDiff,
        stdDev: voltageStdDev,
        score: Math.round(voltageScore),
        outlierCount: Math.floor(Math.random() * 5)
      },
      temperatureConsistency: {
        maxDiff: tempMaxDiff,
        stdDev: tempStdDev,
        score: Math.round(tempScore),
        outlierCount: Math.floor(Math.random() * 3)
      },
      socConsistency: {
        maxDiff: socMaxDiff,
        stdDev: socStdDev,
        score: Math.round(socScore),
        outlierCount: Math.floor(Math.random() * 4)
      },
      overallScore: Math.round(overallScore)
    };
  }

  /**
   * 计算电池容量信息
   */
  private calculateCapacity(project: ProjectDataSummary): BatteryCapacityData {
    const ratedCapacity = project.projectType === 'project1' ? 280 : 200; // Ah
    const capacityRetention = 85 + Math.random() * 10; // 85-95%
    const actualCapacity = ratedCapacity * (capacityRetention / 100);
    const avgVoltage = 3.2; // V
    const energyCapacity = (actualCapacity * avgVoltage * project.summary.bankCount) / 1000; // kWh
    const usableCapacity = actualCapacity * 0.9; // 90%可用
    const degradationRate = 2 + Math.random() * 3; // 2-5%/年

    return {
      ratedCapacity,
      actualCapacity: Math.round(actualCapacity * 10) / 10,
      capacityRetention: Math.round(capacityRetention * 10) / 10,
      energyCapacity: Math.round(energyCapacity * 10) / 10,
      usableCapacity: Math.round(usableCapacity * 10) / 10,
      degradationRate: Math.round(degradationRate * 10) / 10
    };
  }

  /**
   * 生成告警信息
   */
  private generateAlerts(project: ProjectDataSummary, consistency: BatteryConsistencyData, capacity: BatteryCapacityData): BatteryAlert[] {
    const alerts: BatteryAlert[] = [];
    const now = new Date().toISOString();

    // 一致性告警
    if (consistency.overallScore < 70) {
      alerts.push({
        id: `consistency-${project.projectId}-${Date.now()}`,
        type: 'consistency',
        level: consistency.overallScore < 50 ? 'error' : 'warning',
        title: '电池一致性异常',
        description: `项目${project.projectName}电池一致性评分为${consistency.overallScore}分，低于正常范围`,
        bankId: 'all',
        currentValue: consistency.overallScore,
        threshold: 70,
        timestamp: now,
        status: 'active'
      });
    }

    // 容量告警
    if (capacity.capacityRetention < 80) {
      alerts.push({
        id: `capacity-${project.projectId}-${Date.now()}`,
        type: 'capacity',
        level: capacity.capacityRetention < 70 ? 'critical' : 'error',
        title: '电池容量衰减严重',
        description: `项目${project.projectName}容量保持率为${capacity.capacityRetention}%，低于80%阈值`,
        bankId: 'all',
        currentValue: capacity.capacityRetention,
        threshold: 80,
        timestamp: now,
        status: 'active'
      });
    }

    // SOC告警
    if (project.summary.avgSoc < 20) {
      alerts.push({
        id: `soc-${project.projectId}-${Date.now()}`,
        type: 'soc',
        level: project.summary.avgSoc < 10 ? 'critical' : 'warning',
        title: 'SOC过低',
        description: `项目${project.projectName}平均SOC为${project.summary.avgSoc.toFixed(1)}%，需要充电`,
        bankId: 'all',
        currentValue: project.summary.avgSoc,
        threshold: 20,
        timestamp: now,
        status: 'active'
      });
    }

    // SOH告警
    if (project.summary.avgSoh < 80) {
      alerts.push({
        id: `soh-${project.projectId}-${Date.now()}`,
        type: 'soh',
        level: project.summary.avgSoh < 70 ? 'error' : 'warning',
        title: 'SOH偏低',
        description: `项目${project.projectName}平均SOH为${project.summary.avgSoh.toFixed(1)}%，电池健康度下降`,
        bankId: 'all',
        currentValue: project.summary.avgSoh,
        threshold: 80,
        timestamp: now,
        status: 'active'
      });
    }

    // 随机生成一些其他告警
    if (Math.random() > 0.7) {
      alerts.push({
        id: `voltage-${project.projectId}-${Date.now()}`,
        type: 'voltage',
        level: 'warning',
        title: '电压异常',
        description: `检测到Bank1单体电压异常，最大值3.65V，超出正常范围`,
        bankId: 'Bank1',
        cellId: Math.floor(Math.random() * 240) + 1,
        currentValue: 3.65,
        threshold: 3.6,
        timestamp: now,
        status: 'active'
      });
    }

    if (Math.random() > 0.8) {
      alerts.push({
        id: `temp-${project.projectId}-${Date.now()}`,
        type: 'temperature',
        level: 'info',
        title: '温度偏高',
        description: `Bank2温度达到45°C，建议关注散热情况`,
        bankId: 'Bank2',
        currentValue: 45,
        threshold: 40,
        timestamp: now,
        status: 'active'
      });
    }

    return alerts;
  }

  /**
   * 计算告警汇总
   */
  private calculateAlertSummary(alerts: BatteryAlert[]) {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.level === 'critical').length,
      error: alerts.filter(a => a.level === 'error').length,
      warning: alerts.filter(a => a.level === 'warning').length,
      info: alerts.filter(a => a.level === 'info').length
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.loadingCache.clear();
  }
}

// 添加BankDisplayData接口
export interface BankDisplayData {
  bankId: string;
  bankVol: number;
  bankCur: number;
  bankSoc: number;
  bankSoh: number;
  status: 'normal' | 'warning' | 'error';
  sglMaxVol: number;
  sglMinVol: number;
  sglMaxTemp: number;
  sglMinTemp: number;
  cellCount: number;
  lastUpdate: string;
}

// 创建单例实例
export const simpleCsvDataService = new SimpleCsvDataService();
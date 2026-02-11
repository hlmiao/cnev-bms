/**
 * Mock预测服务 - 用于POC演示
 * 基于当前数据状态和趋势算法生成预测结果
 */

import type { EnhancedProjectData } from './simpleCsvDataService';

// 预测时间点
export interface PredictionTimePoint {
  month: number; // 未来第几个月
  date: string; // 预测日期
  value: number; // 预测值
  confidence: number; // 置信度 (0-100)
  lowerBound: number; // 预测下界
  upperBound: number; // 预测上界
}

// 容量预测结果
export interface CapacityPrediction {
  currentCapacity: number; // 当前容量保持率 (%)
  predictions: PredictionTimePoint[]; // 预测点
  degradationRate: number; // 月均衰减率 (%/月)
  reachThresholdDate: string | null; // 预计达到80%阈值的日期
  remainingMonths: number | null; // 剩余可用月数
  recommendation: string; // 建议
}

// SOH预测结果
export interface SOHPrediction {
  currentSOH: number; // 当前SOH (%)
  predictions: PredictionTimePoint[]; // 预测点
  degradationRate: number; // 月均衰减率 (%/月)
  estimatedLifeMonths: number; // 预计剩余寿命（月）
  replacementDate: string; // 建议更换日期
  recommendation: string; // 建议
}

// 故障预测结果
export interface FaultPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'; // 风险等级
  riskScore: number; // 风险评分 (0-100)
  potentialFaults: Array<{
    type: string; // 故障类型
    probability: number; // 发生概率 (%)
    estimatedDate: string; // 预计发生时间
    severity: 'low' | 'medium' | 'high' | 'critical'; // 严重程度
    description: string; // 描述
    prevention: string[]; // 预防措施
  }>;
  recommendation: string; // 建议
}

// 成本预测结果
export interface CostPrediction {
  maintenanceCosts: Array<{
    month: number;
    date: string;
    cost: number; // 维护成本（元）
    items: string[]; // 成本项目
  }>;
  replacementCost: {
    estimatedDate: string; // 预计更换日期
    cost: number; // 更换成本（元）
    description: string; // 说明
  };
  totalCost12Months: number; // 未来12个月总成本
  costTrend: 'increasing' | 'stable' | 'decreasing'; // 成本趋势
  recommendation: string; // 建议
}

// 综合预测报告
export interface PredictionReport {
  projectId: string;
  projectName: string;
  generatedAt: Date;
  capacity: CapacityPrediction;
  soh: SOHPrediction;
  fault: FaultPrediction;
  cost: CostPrediction;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

export class MockPredictionService {
  /**
   * 生成容量预测
   */
  predictCapacity(projectData: EnhancedProjectData): CapacityPrediction {
    const currentCapacity = projectData.capacity.capacityRetention;
    const baseDegradationRate = projectData.capacity.degradationRate / 12; // 转换为月均
    
    // 生成未来12个月的预测
    const predictions: PredictionTimePoint[] = [];
    let reachThresholdMonth: number | null = null;
    
    for (let month = 1; month <= 12; month++) {
      const now = new Date();
      const futureDate = new Date(now.getFullYear(), now.getMonth() + month, now.getDate());
      
      // 添加随机波动
      const randomFactor = 0.95 + Math.random() * 0.1; // 0.95-1.05
      const degradation = baseDegradationRate * month * randomFactor;
      const predictedValue = Math.max(60, currentCapacity - degradation);
      
      // 置信度随时间递减
      const confidence = Math.max(60, 95 - month * 2);
      
      // 预测区间
      const uncertainty = (12 - month) * 0.3;
      const lowerBound = Math.max(50, predictedValue - uncertainty);
      const upperBound = Math.min(100, predictedValue + uncertainty);
      
      predictions.push({
        month,
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(predictedValue * 10) / 10,
        confidence: Math.round(confidence),
        lowerBound: Math.round(lowerBound * 10) / 10,
        upperBound: Math.round(upperBound * 10) / 10
      });
      
      // 检查是否达到80%阈值
      if (reachThresholdMonth === null && predictedValue < 80) {
        reachThresholdMonth = month;
      }
    }
    
    const reachThresholdDate = reachThresholdMonth 
      ? predictions[reachThresholdMonth - 1].date 
      : null;
    
    const remainingMonths = reachThresholdMonth || (currentCapacity > 80 ? 12 : 0);
    
    let recommendation = '';
    if (currentCapacity < 80) {
      recommendation = '容量已低于80%阈值，建议尽快进行容量测试，评估是否需要更换电池。';
    } else if (remainingMonths <= 6) {
      recommendation = `预计${remainingMonths}个月后容量将低于80%，建议提前准备更换计划。`;
    } else {
      recommendation = '容量状态良好，建议继续监控并定期进行容量校准。';
    }
    
    return {
      currentCapacity,
      predictions,
      degradationRate: Math.round(baseDegradationRate * 100) / 100,
      reachThresholdDate,
      remainingMonths,
      recommendation
    };
  }

  /**
   * 生成SOH预测
   */
  predictSOH(projectData: EnhancedProjectData): SOHPrediction {
    const currentSOH = projectData.summary.avgSoh;
    const baseDegradationRate = 0.3 + Math.random() * 0.4; // 0.3-0.7%/月
    
    // 生成未来12个月的预测
    const predictions: PredictionTimePoint[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const now = new Date();
      const futureDate = new Date(now.getFullYear(), now.getMonth() + month, now.getDate());
      
      const randomFactor = 0.95 + Math.random() * 0.1;
      const degradation = baseDegradationRate * month * randomFactor;
      const predictedValue = Math.max(60, currentSOH - degradation);
      
      const confidence = Math.max(65, 95 - month * 2);
      const uncertainty = (12 - month) * 0.4;
      
      predictions.push({
        month,
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(predictedValue * 10) / 10,
        confidence: Math.round(confidence),
        lowerBound: Math.max(50, Math.round((predictedValue - uncertainty) * 10) / 10),
        upperBound: Math.min(100, Math.round((predictedValue + uncertainty) * 10) / 10)
      });
    }
    
    // 估算剩余寿命（SOH降至70%）
    const remainingSOH = currentSOH - 70;
    const estimatedLifeMonths = Math.max(0, Math.round(remainingSOH / baseDegradationRate));
    
    const now = new Date();
    const replacementDate = new Date(now.getFullYear(), now.getMonth() + estimatedLifeMonths, now.getDate());
    
    let recommendation = '';
    if (currentSOH < 75) {
      recommendation = 'SOH已接近更换阈值，建议进行全面检测并制定更换计划。';
    } else if (estimatedLifeMonths <= 12) {
      recommendation = `预计${estimatedLifeMonths}个月后需要更换，建议提前准备备件和预算。`;
    } else {
      recommendation = 'SOH状态良好，建议继续监控并优化使用策略以延长寿命。';
    }
    
    return {
      currentSOH,
      predictions,
      degradationRate: Math.round(baseDegradationRate * 100) / 100,
      estimatedLifeMonths,
      replacementDate: replacementDate.toISOString().split('T')[0],
      recommendation
    };
  }

  /**
   * 生成故障预测
   */
  predictFault(projectData: EnhancedProjectData): FaultPrediction {
    const potentialFaults = [];
    let riskScore = 0;
    
    // 基于一致性评分预测
    if (projectData.consistency.overallScore < 70) {
      const probability = Math.min(90, 100 - projectData.consistency.overallScore);
      riskScore += probability * 0.3;
      
      const now = new Date();
      const estimatedMonths = Math.max(1, Math.floor((projectData.consistency.overallScore - 50) / 5));
      const estimatedDate = new Date(now.getFullYear(), now.getMonth() + estimatedMonths, now.getDate());
      
      potentialFaults.push({
        type: '一致性恶化',
        probability: Math.round(probability),
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        severity: probability > 70 ? 'high' : 'medium' as 'high' | 'medium',
        description: '电池组一致性持续恶化，可能导致部分单体过充或过放',
        prevention: [
          '立即进行均衡充电',
          '检查BMS均衡功能',
          '监控单体电压差异',
          '必要时更换异常单体'
        ]
      });
    }
    
    // 基于容量保持率预测
    if (projectData.capacity.capacityRetention < 85) {
      const probability = Math.min(85, 100 - projectData.capacity.capacityRetention);
      riskScore += probability * 0.25;
      
      const now = new Date();
      const estimatedMonths = Math.max(2, Math.floor((projectData.capacity.capacityRetention - 70) / 2));
      const estimatedDate = new Date(now.getFullYear(), now.getMonth() + estimatedMonths, now.getDate());
      
      potentialFaults.push({
        type: '容量快速衰减',
        probability: Math.round(probability),
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        severity: probability > 60 ? 'high' : 'medium' as 'high' | 'medium',
        description: '电池容量衰减速度超过正常范围，可能影响系统性能',
        prevention: [
          '优化充放电策略',
          '控制充放电倍率',
          '改善温度管理',
          '定期进行容量校准'
        ]
      });
    }
    
    // 基于告警数量预测
    if (projectData.alertSummary.total > 3) {
      const probability = Math.min(80, projectData.alertSummary.total * 10 + projectData.alertSummary.critical * 20);
      riskScore += probability * 0.25;
      
      const now = new Date();
      const estimatedMonths = projectData.alertSummary.critical > 0 ? 1 : 3;
      const estimatedDate = new Date(now.getFullYear(), now.getMonth() + estimatedMonths, now.getDate());
      
      potentialFaults.push({
        type: '系统故障',
        probability: Math.round(probability),
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        severity: projectData.alertSummary.critical > 0 ? 'critical' : 'medium' as 'critical' | 'medium',
        description: '多个告警未处理，可能导致系统故障或安全事故',
        prevention: [
          '立即处理所有严重告警',
          '排查告警根本原因',
          '加强日常巡检',
          '完善应急预案'
        ]
      });
    }
    
    // 温度相关风险
    if (projectData.consistency.temperatureConsistency.maxDiff > 10) {
      const probability = Math.min(70, projectData.consistency.temperatureConsistency.maxDiff * 5);
      riskScore += probability * 0.2;
      
      const now = new Date();
      const estimatedDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
      
      potentialFaults.push({
        type: '热失控风险',
        probability: Math.round(probability),
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        severity: 'high',
        description: '温度差异过大，存在局部过热风险，可能引发热失控',
        prevention: [
          '检查散热系统',
          '优化通风设计',
          '降低充放电功率',
          '安装温度监控设备'
        ]
      });
    }
    
    // 如果没有明显风险，添加一般性预防建议
    if (potentialFaults.length === 0) {
      riskScore = 15 + Math.random() * 15; // 15-30
      
      const now = new Date();
      const estimatedDate = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
      
      potentialFaults.push({
        type: '正常老化',
        probability: 30,
        estimatedDate: estimatedDate.toISOString().split('T')[0],
        severity: 'low',
        description: '电池正常老化，性能逐渐下降',
        prevention: [
          '定期进行预防性维护',
          '监控关键参数趋势',
          '优化运行策略',
          '建立维护档案'
        ]
      });
    }
    
    riskScore = Math.min(100, riskScore);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';
    
    let recommendation = '';
    if (riskLevel === 'critical') {
      recommendation = '风险等级极高！建议立即停止运行，进行全面检查和维修。';
    } else if (riskLevel === 'high') {
      recommendation = '存在较高风险，建议尽快处理相关问题，加强监控频率。';
    } else if (riskLevel === 'medium') {
      recommendation = '存在一定风险，建议按计划进行维护，密切关注系统状态。';
    } else {
      recommendation = '风险较低，建议继续保持良好的运维习惯，定期检查。';
    }
    
    return {
      riskLevel,
      riskScore: Math.round(riskScore),
      potentialFaults: potentialFaults.sort((a, b) => b.probability - a.probability),
      recommendation
    };
  }

  /**
   * 生成成本预测
   */
  predictCost(projectData: EnhancedProjectData): CostPrediction {
    const maintenanceCosts = [];
    const bankCount = projectData.summary.bankCount;
    const baseMaintenanceCost = bankCount * 500; // 每个Bank基础维护成本500元/月
    
    // 生成未来12个月的维护成本
    for (let month = 1; month <= 12; month++) {
      const now = new Date();
      const futureDate = new Date(now.getFullYear(), now.getMonth() + month, now.getDate());
      
      const items: string[] = ['日常巡检', '数据监控'];
      let monthlyCost = baseMaintenanceCost;
      
      // 每季度增加季度维护
      if (month % 3 === 0) {
        items.push('季度维护');
        monthlyCost += bankCount * 1000;
      }
      
      // 根据一致性评分增加均衡充电成本
      if (projectData.consistency.overallScore < 80 && month % 2 === 0) {
        items.push('均衡充电');
        monthlyCost += bankCount * 300;
      }
      
      // 根据容量保持率增加容量测试成本
      if (projectData.capacity.capacityRetention < 85 && month % 4 === 0) {
        items.push('容量测试');
        monthlyCost += bankCount * 800;
      }
      
      // 根据告警数量增加故障处理成本
      if (projectData.alertSummary.total > 0 && month <= 3) {
        items.push('故障处理');
        monthlyCost += projectData.alertSummary.critical * 2000 + projectData.alertSummary.error * 1000;
      }
      
      // 添加随机波动
      monthlyCost = Math.round(monthlyCost * (0.9 + Math.random() * 0.2));
      
      maintenanceCosts.push({
        month,
        date: futureDate.toISOString().split('T')[0],
        cost: monthlyCost,
        items
      });
    }
    
    // 计算更换成本
    const capacityPrediction = this.predictCapacity(projectData);
    const replacementMonths = capacityPrediction.remainingMonths || 24;
    
    const now = new Date();
    const replacementDate = new Date(now.getFullYear(), now.getMonth() + replacementMonths, now.getDate());
    
    const cellCount = bankCount * 240; // 每个Bank 240个单体
    const costPerCell = 150; // 每个单体150元
    const replacementCost = {
      estimatedDate: replacementDate.toISOString().split('T')[0],
      cost: cellCount * costPerCell,
      description: `预计需要更换${bankCount}个Bank，共${cellCount}个单体电池`
    };
    
    // 计算12个月总成本
    const totalCost12Months = maintenanceCosts.reduce((sum, item) => sum + item.cost, 0);
    
    // 判断成本趋势
    const firstQuarterAvg = maintenanceCosts.slice(0, 3).reduce((sum, item) => sum + item.cost, 0) / 3;
    const lastQuarterAvg = maintenanceCosts.slice(9, 12).reduce((sum, item) => sum + item.cost, 0) / 3;
    
    let costTrend: 'increasing' | 'stable' | 'decreasing';
    if (lastQuarterAvg > firstQuarterAvg * 1.2) {
      costTrend = 'increasing';
    } else if (lastQuarterAvg < firstQuarterAvg * 0.8) {
      costTrend = 'decreasing';
    } else {
      costTrend = 'stable';
    }
    
    let recommendation = '';
    if (costTrend === 'increasing') {
      recommendation = `维护成本呈上升趋势，未来12个月预计花费${totalCost12Months.toLocaleString()}元。建议优化维护策略，考虑预防性维护以降低成本。`;
    } else if (costTrend === 'stable') {
      recommendation = `维护成本相对稳定，未来12个月预计花费${totalCost12Months.toLocaleString()}元。建议保持当前维护水平。`;
    } else {
      recommendation = `维护成本呈下降趋势，未来12个月预计花费${totalCost12Months.toLocaleString()}元。系统状态良好。`;
    }
    
    if (replacementMonths <= 12) {
      recommendation += `\n注意：预计${replacementMonths}个月后需要更换电池，成本约${replacementCost.cost.toLocaleString()}元，请提前准备预算。`;
    }
    
    return {
      maintenanceCosts,
      replacementCost,
      totalCost12Months,
      costTrend,
      recommendation
    };
  }

  /**
   * 生成综合预测报告
   */
  async generateReport(projectData: EnhancedProjectData): Promise<PredictionReport> {
    const capacity = this.predictCapacity(projectData);
    const soh = this.predictSOH(projectData);
    const fault = this.predictFault(projectData);
    const cost = this.predictCost(projectData);
    
    // 综合风险评估
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (fault.riskLevel === 'critical' || capacity.currentCapacity < 75 || soh.currentSOH < 75) {
      overallRisk = 'critical';
    } else if (fault.riskLevel === 'high' || capacity.currentCapacity < 80 || soh.currentSOH < 80) {
      overallRisk = 'high';
    } else if (fault.riskLevel === 'medium' || capacity.currentCapacity < 85 || soh.currentSOH < 85) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }
    
    // 生成摘要
    let summary = `${projectData.projectName}预测分析报告：\n\n`;
    summary += `• 容量状态：当前${capacity.currentCapacity.toFixed(1)}%，预计${capacity.remainingMonths || 12}个月后需关注\n`;
    summary += `• SOH状态：当前${soh.currentSOH.toFixed(1)}%，预计${soh.estimatedLifeMonths}个月剩余寿命\n`;
    summary += `• 故障风险：${fault.riskLevel === 'critical' ? '极高' : fault.riskLevel === 'high' ? '高' : fault.riskLevel === 'medium' ? '中' : '低'}（${fault.riskScore}分），${fault.potentialFaults.length}个潜在风险\n`;
    summary += `• 成本预测：未来12个月维护成本约${cost.totalCost12Months.toLocaleString()}元，趋势${cost.costTrend === 'increasing' ? '上升' : cost.costTrend === 'stable' ? '稳定' : '下降'}\n`;
    summary += `• 综合评估：${overallRisk === 'critical' ? '需要立即关注' : overallRisk === 'high' ? '需要重点关注' : overallRisk === 'medium' ? '需要持续监控' : '状态良好'}`;
    
    return {
      projectId: projectData.projectId,
      projectName: projectData.projectName,
      generatedAt: new Date(),
      capacity,
      soh,
      fault,
      cost,
      overallRisk,
      summary
    };
  }
}

// 创建单例实例
export const mockPredictionService = new MockPredictionService();

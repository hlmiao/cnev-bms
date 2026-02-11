/**
 * Mock AI服务 - 用于Demo演示
 * 基于规则引擎和预设场景模拟AI响应
 */

import type { EnhancedProjectData, BatteryAlert } from './simpleCsvDataService';

// AI消息接口
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 诊断步骤接口
export interface DiagnosticStep {
  step: number;
  title: string;
  description: string;
  checkItems: string[];
  status: 'pending' | 'checking' | 'completed' | 'failed';
  result?: string;
}

// 运维建议接口
export interface MaintenanceSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'consistency' | 'capacity' | 'temperature' | 'voltage' | 'soc' | 'soh';
  title: string;
  description: string;
  actions: string[];
  expectedResult: string;
  estimatedTime: string;
}

// 知识库条目接口
export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  relatedQuestions: string[];
}

// 诊断历史接口
export interface DiagnosticHistory {
  id: string;
  timestamp: Date;
  projectId: string;
  projectName: string;
  issue: string;
  diagnosis: string;
  solution: string;
  status: 'resolved' | 'pending' | 'monitoring';
}

export class MockAIService {
  private chatHistory: AIMessage[] = [];
  private diagnosticHistories: DiagnosticHistory[] = [];

  /**
   * 智能问答 - 基于当前系统状态的AI对话
   */
  async chat(message: string, context?: { projects?: EnhancedProjectData[] }): Promise<string> {
    // 添加用户消息到历史
    this.chatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // 基于规则生成响应
    let response = '';
    const lowerMessage = message.toLowerCase();

    // 问候语
    if (lowerMessage.includes('你好') || lowerMessage.includes('hello')) {
      response = '您好！我是储能系统AI助手，可以帮您分析电池状态、诊断故障、提供运维建议。请问有什么可以帮您的？';
    }
    // 一致性相关
    else if (lowerMessage.includes('一致性') || lowerMessage.includes('consistency')) {
      if (context?.projects && context.projects.length > 0) {
        const avgScore = context.projects.reduce((sum, p) => sum + p.consistency.overallScore, 0) / context.projects.length;
        const poorProjects = context.projects.filter(p => p.consistency.overallScore < 70);
        
        response = `根据当前数据分析：\n\n`;
        response += `• 系统平均一致性评分：${avgScore.toFixed(1)}分\n`;
        response += `• 一致性较差的项目数量：${poorProjects.length}个\n\n`;
        
        if (poorProjects.length > 0) {
          response += `建议重点关注以下项目：\n`;
          poorProjects.forEach(p => {
            response += `- ${p.projectName}（评分：${p.consistency.overallScore}分）\n`;
          });
          response += `\n建议进行均衡充电或检查单体电池状态。`;
        } else {
          response += `所有项目一致性表现良好，请继续保持正常运维。`;
        }
      } else {
        response = '电池一致性是指电池组内各单体电池在电压、温度、SOC等参数上的差异程度。一致性好的电池组性能更稳定，寿命更长。建议定期进行均衡充电以改善一致性。';
      }
    }
    // 容量相关
    else if (lowerMessage.includes('容量') || lowerMessage.includes('capacity')) {
      if (context?.projects && context.projects.length > 0) {
        const avgRetention = context.projects.reduce((sum, p) => sum + p.capacity.capacityRetention, 0) / context.projects.length;
        const lowCapacityProjects = context.projects.filter(p => p.capacity.capacityRetention < 80);
        
        response = `容量分析结果：\n\n`;
        response += `• 平均容量保持率：${avgRetention.toFixed(1)}%\n`;
        response += `• 容量衰减严重的项目：${lowCapacityProjects.length}个\n\n`;
        
        if (lowCapacityProjects.length > 0) {
          response += `需要关注的项目：\n`;
          lowCapacityProjects.forEach(p => {
            response += `- ${p.projectName}（容量保持率：${p.capacity.capacityRetention.toFixed(1)}%）\n`;
          });
          response += `\n建议进行容量测试，评估是否需要更换电池。`;
        } else {
          response += `所有项目容量保持良好。`;
        }
      } else {
        response = '电池容量会随使用时间逐渐衰减。正常情况下，容量保持率应在80%以上。低于80%时建议进行详细检测，必要时更换电池。';
      }
    }
    // 告警相关
    else if (lowerMessage.includes('告警') || lowerMessage.includes('alert') || lowerMessage.includes('报警')) {
      if (context?.projects && context.projects.length > 0) {
        const totalAlerts = context.projects.reduce((sum, p) => sum + p.alertSummary.total, 0);
        const criticalAlerts = context.projects.reduce((sum, p) => sum + p.alertSummary.critical, 0);
        
        response = `当前告警情况：\n\n`;
        response += `• 总告警数：${totalAlerts}个\n`;
        response += `• 严重告警：${criticalAlerts}个\n\n`;
        
        if (criticalAlerts > 0) {
          response += `⚠️ 存在严重告警，请立即处理！\n`;
          response += `建议：\n`;
          response += `1. 优先处理严重告警\n`;
          response += `2. 检查相关Bank和单体电池状态\n`;
          response += `3. 必要时停止充放电操作\n`;
          response += `4. 联系技术支持`;
        } else if (totalAlerts > 0) {
          response += `存在一般告警，建议及时处理以防问题扩大。`;
        } else {
          response += `✓ 系统运行正常，无告警信息。`;
        }
      } else {
        response = '告警系统会实时监控电池状态，包括电压、温度、SOC、SOH等参数。发现异常时会及时提醒，帮助您快速定位和解决问题。';
      }
    }
    // 默认响应
    else {
      response = '我理解您的问题。作为储能系统AI助手，我可以帮您：\n\n';
      response += '• 分析电池一致性和容量状态\n';
      response += '• 诊断系统故障和异常\n';
      response += '• 提供运维建议和解决方案\n';
      response += '• 解答常见问题\n\n';
      response += '请告诉我您想了解什么？';
    }

    // 添加AI响应到历史
    this.chatHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return response;
  }

  /**
   * 获取聊天历史
   */
  getChatHistory(): AIMessage[] {
    return this.chatHistory;
  }

  /**
   * 清空聊天历史
   */
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * 故障诊断向导 - 分步骤引导排查问题
   */
  async diagnose(issue: string, projectData?: EnhancedProjectData): Promise<DiagnosticStep[]> {
    const steps: DiagnosticStep[] = [];

    if (issue.includes('一致性') || issue.includes('不一致')) {
      steps.push(
        {
          step: 1,
          title: '检查电压一致性',
          description: '检查各单体电池电压差异',
          checkItems: [
            '最大电压差是否超过100mV',
            '是否存在明显的高压或低压单体',
            '电压分布是否均匀'
          ],
          status: 'completed',
          result: projectData ? `电压最大差异：${(projectData.consistency.voltageConsistency.maxDiff * 1000).toFixed(0)}mV，${projectData.consistency.voltageConsistency.maxDiff > 0.1 ? '超出正常范围' : '正常'}` : '待检查'
        },
        {
          step: 2,
          title: '检查温度一致性',
          description: '检查各单体电池温度差异',
          checkItems: [
            '最大温差是否超过5°C',
            '是否存在局部过热',
            '散热系统是否正常工作'
          ],
          status: 'completed',
          result: projectData ? `温度最大差异：${projectData.consistency.temperatureConsistency.maxDiff.toFixed(1)}°C，${projectData.consistency.temperatureConsistency.maxDiff > 5 ? '需要关注' : '正常'}` : '待检查'
        },
        {
          step: 3,
          title: '执行均衡充电',
          description: '通过均衡充电改善一致性',
          checkItems: [
            '设置均衡充电参数',
            '监控均衡过程',
            '记录均衡效果'
          ],
          status: 'pending',
          result: '建议执行均衡充电，预计需要2-4小时'
        }
      );
    } else if (issue.includes('容量') || issue.includes('衰减')) {
      steps.push(
        {
          step: 1,
          title: '容量测试',
          description: '进行完整的容量测试',
          checkItems: [
            '执行标准容量测试流程',
            '记录充放电曲线',
            '计算实际容量'
          ],
          status: 'completed',
          result: projectData ? `实际容量：${projectData.capacity.actualCapacity}Ah，容量保持率：${projectData.capacity.capacityRetention.toFixed(1)}%` : '待测试'
        },
        {
          step: 2,
          title: '分析衰减原因',
          description: '分析容量衰减的可能原因',
          checkItems: [
            '检查充放电循环次数',
            '分析使用温度范围',
            '评估充放电倍率'
          ],
          status: 'completed',
          result: projectData ? `衰减率：${projectData.capacity.degradationRate}%/年，${projectData.capacity.degradationRate > 5 ? '衰减较快' : '正常范围'}` : '待分析'
        },
        {
          step: 3,
          title: '制定维护方案',
          description: '根据测试结果制定维护计划',
          checkItems: [
            '评估是否需要更换电池',
            '优化充放电策略',
            '调整运行参数'
          ],
          status: 'pending',
          result: '待制定方案'
        }
      );
    } else {
      // 通用诊断流程
      steps.push(
        {
          step: 1,
          title: '问题确认',
          description: '确认问题现象和影响范围',
          checkItems: [
            '记录问题发生时间',
            '确认影响的设备范围',
            '收集相关数据'
          ],
          status: 'completed',
          result: '问题已确认'
        },
        {
          step: 2,
          title: '数据分析',
          description: '分析相关数据和日志',
          checkItems: [
            '查看历史数据趋势',
            '检查告警记录',
            '分析异常参数'
          ],
          status: 'pending',
          result: '待分析'
        },
        {
          step: 3,
          title: '解决方案',
          description: '制定并执行解决方案',
          checkItems: [
            '制定解决方案',
            '执行修复操作',
            '验证修复效果'
          ],
          status: 'pending',
          result: '待执行'
        }
      );
    }

    return steps;
  }

  /**
   * 获取运维建议
   */
  async getSuggestions(projectData: EnhancedProjectData): Promise<MaintenanceSuggestion[]> {
    const suggestions: MaintenanceSuggestion[] = [];

    // 一致性建议
    if (projectData.consistency.overallScore < 80) {
      suggestions.push({
        id: `consistency-${projectData.projectId}`,
        priority: projectData.consistency.overallScore < 60 ? 'high' : 'medium',
        category: 'consistency',
        title: '改善电池一致性',
        description: `${projectData.projectName}的一致性评分为${projectData.consistency.overallScore}分，建议进行均衡充电`,
        actions: [
          '执行均衡充电，建议充电至100% SOC',
          '监控均衡过程中的电压和温度变化',
          '记录均衡前后的一致性数据对比',
          '如效果不佳，考虑检查BMS均衡功能'
        ],
        expectedResult: '一致性评分提升10-20分，电压差异减小50%以上',
        estimatedTime: '2-4小时'
      });
    }

    // 容量建议
    if (projectData.capacity.capacityRetention < 85) {
      suggestions.push({
        id: `capacity-${projectData.projectId}`,
        priority: projectData.capacity.capacityRetention < 75 ? 'high' : 'medium',
        category: 'capacity',
        title: '容量衰减处理',
        description: `容量保持率为${projectData.capacity.capacityRetention.toFixed(1)}%，需要关注`,
        actions: [
          '进行完整的容量测试（充放电循环）',
          '分析容量衰减曲线和趋势',
          '检查充放电策略是否合理',
          '评估是否需要更换部分电池'
        ],
        expectedResult: '明确容量状态，制定维护或更换计划',
        estimatedTime: '4-8小时（含测试时间）'
      });
    }

    // 温度建议
    if (projectData.consistency.temperatureConsistency.maxDiff > 10) {
      suggestions.push({
        id: `temperature-${projectData.projectId}`,
        priority: 'medium',
        category: 'temperature',
        title: '优化温度管理',
        description: `温度差异达到${projectData.consistency.temperatureConsistency.maxDiff.toFixed(1)}°C，建议检查散热系统`,
        actions: [
          '检查散热风扇是否正常工作',
          '清理散热通道，确保空气流通',
          '检查温度传感器是否准确',
          '优化电池排列和散热设计'
        ],
        expectedResult: '温度差异降低至5°C以内',
        estimatedTime: '1-2小时'
      });
    }

    // 告警处理建议
    if (projectData.alertSummary.critical > 0) {
      suggestions.push({
        id: `alert-${projectData.projectId}`,
        priority: 'high',
        category: 'voltage',
        title: '处理严重告警',
        description: `存在${projectData.alertSummary.critical}个严重告警，需要立即处理`,
        actions: [
          '立即停止充放电操作',
          '检查告警相关的Bank和单体电池',
          '测量相关参数，确认告警原因',
          '根据诊断结果采取相应措施',
          '处理完成后进行验证测试'
        ],
        expectedResult: '消除严重告警，恢复正常运行',
        estimatedTime: '根据具体问题而定'
      });
    }

    // 预防性维护建议
    if (suggestions.length === 0) {
      suggestions.push({
        id: `preventive-${projectData.projectId}`,
        priority: 'low',
        category: 'soh',
        title: '预防性维护',
        description: '系统运行正常，建议进行预防性维护',
        actions: [
          '定期检查电池外观和连接',
          '清洁设备，保持环境整洁',
          '记录运行数据，建立趋势分析',
          '定期进行容量校准',
          '更新BMS软件至最新版本'
        ],
        expectedResult: '保持系统良好运行状态，延长使用寿命',
        estimatedTime: '1-2小时/月'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * 获取知识库内容
   */
  getKnowledgeBase(): KnowledgeItem[] {
    return [
      {
        id: 'kb-001',
        category: '电池基础',
        question: '什么是SOC和SOH？',
        answer: 'SOC（State of Charge）是电池的荷电状态，表示电池当前电量占总容量的百分比。SOH（State of Health）是电池的健康状态，表示电池当前容量相对于出厂容量的百分比。SOC影响续航能力，SOH反映电池老化程度。',
        tags: ['SOC', 'SOH', '基础概念'],
        relatedQuestions: ['如何提高电池SOH？', '为什么SOC会不准确？']
      },
      {
        id: 'kb-002',
        category: '一致性管理',
        question: '什么是电池一致性？为什么重要？',
        answer: '电池一致性是指电池组内各单体电池在电压、容量、内阻、温度等参数上的一致程度。一致性好的电池组性能更稳定、寿命更长、安全性更高。不一致会导致部分电池过充或过放，加速老化甚至引发安全问题。',
        tags: ['一致性', '电池管理'],
        relatedQuestions: ['如何改善电池一致性？', '一致性差的原因有哪些？']
      },
      {
        id: 'kb-003',
        category: '一致性管理',
        question: '如何改善电池一致性？',
        answer: '改善电池一致性的方法包括：1) 定期进行均衡充电，让所有单体达到相同电压；2) 控制充放电倍率，避免过快充放电；3) 保持良好的温度管理，避免温差过大；4) 定期进行容量校准；5) 必要时更换性能差异大的单体电池。',
        tags: ['一致性', '均衡充电', '维护'],
        relatedQuestions: ['什么是电池一致性？', '均衡充电需要多长时间？']
      },
      {
        id: 'kb-004',
        category: '容量管理',
        question: '电池容量为什么会衰减？',
        answer: '电池容量衰减的主要原因包括：1) 充放电循环导致的材料老化；2) 高温环境加速化学反应；3) 过充过放造成的损伤；4) 长期存放导致的自放电；5) 大倍率充放电的影响。正常情况下，锂电池每年衰减2-5%。',
        tags: ['容量', '衰减', '寿命'],
        relatedQuestions: ['如何延缓容量衰减？', '容量低于多少需要更换？']
      },
      {
        id: 'kb-005',
        category: '容量管理',
        question: '如何延缓电池容量衰减？',
        answer: '延缓容量衰减的方法：1) 避免满充满放，保持20-80% SOC范围使用；2) 控制充放电倍率，避免大电流；3) 保持适宜温度（15-35°C）；4) 避免长期闲置，定期充放电；5) 使用合适的充电策略（如恒流恒压）；6) 定期进行容量校准。',
        tags: ['容量', '维护', '寿命'],
        relatedQuestions: ['电池容量为什么会衰减？', '容量测试怎么做？']
      },
      {
        id: 'kb-006',
        category: '故障处理',
        question: '电池温度过高怎么办？',
        answer: '电池温度过高的处理步骤：1) 立即停止充放电操作；2) 检查散热系统是否正常工作；3) 检查是否存在短路或过流；4) 等待温度降至安全范围；5) 检查温度传感器是否准确；6) 分析温度升高的原因；7) 采取相应的改善措施。正常工作温度应在15-45°C。',
        tags: ['温度', '故障', '安全'],
        relatedQuestions: ['温度差异大怎么办？', '如何优化散热？']
      },
      {
        id: 'kb-007',
        category: '故障处理',
        question: '单体电压异常怎么处理？',
        answer: '单体电压异常的处理：1) 确认是真实异常还是传感器问题；2) 检查该单体的连接是否良好；3) 测量该单体的内阻；4) 进行均衡充电尝试；5) 如果持续异常，考虑更换该单体；6) 记录异常数据用于分析。电压异常可能导致过充或过放，需要及时处理。',
        tags: ['电压', '故障', '单体电池'],
        relatedQuestions: ['电压差异多大算异常？', '如何检测单体电池？']
      },
      {
        id: 'kb-008',
        category: '日常维护',
        question: '储能系统需要哪些日常维护？',
        answer: '日常维护项目包括：1) 每日检查系统运行状态和告警信息；2) 每周检查电池外观、连接和环境；3) 每月进行数据分析和趋势监控；4) 每季度进行容量校准和均衡充电；5) 每半年进行全面检查和测试；6) 保持设备清洁和良好通风；7) 及时更新软件和记录维护日志。',
        tags: ['维护', '保养', '检查'],
        relatedQuestions: ['多久需要做一次容量测试？', '如何记录维护日志？']
      }
    ];
  }

  /**
   * 搜索知识库
   */
  searchKnowledge(keyword: string): KnowledgeItem[] {
    const kb = this.getKnowledgeBase();
    const lowerKeyword = keyword.toLowerCase();
    
    return kb.filter(item => 
      item.question.toLowerCase().includes(lowerKeyword) ||
      item.answer.toLowerCase().includes(lowerKeyword) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      item.category.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 保存诊断历史
   */
  saveDiagnosticHistory(history: Omit<DiagnosticHistory, 'id' | 'timestamp'>): void {
    this.diagnosticHistories.push({
      ...history,
      id: `diag-${Date.now()}`,
      timestamp: new Date()
    });
  }

  /**
   * 获取诊断历史
   */
  getDiagnosticHistory(): DiagnosticHistory[] {
    return this.diagnosticHistories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 清空诊断历史
   */
  clearDiagnosticHistory(): void {
    this.diagnosticHistories = [];
  }
}

// 创建单例实例
export const mockAIService = new MockAIService();

/**
 * Mock远程控制服务 - 用于POC演示
 * 模拟AWS IoT Core的设备控制功能
 */

// 设备状态
export type DeviceStatus = 'online' | 'offline' | 'error';

// 设备类型
export type DeviceType = 'bms' | 'pcs' | 'ems';

// 运行状态
export type RunningState = 'idle' | 'charging' | 'discharging' | 'balancing' | 'standby' | 'fault';

// 命令类型
export type CommandType = 
  | 'start_charge'      // 启动充电
  | 'stop_charge'       // 停止充电
  | 'start_discharge'   // 启动放电
  | 'stop_discharge'    // 停止放电
  | 'start_balance'     // 启动均衡
  | 'stop_balance'      // 停止均衡
  | 'set_charge_power'  // 设置充电功率
  | 'set_discharge_power' // 设置放电功率
  | 'set_soc_limit'     // 设置SOC限制
  | 'set_temp_limit'    // 设置温度限制
  | 'system_start'      // 启动系统
  | 'system_stop'       // 停止系统
  | 'system_restart';   // 重启系统

// 命令状态
export type CommandStatus = 'pending' | 'sending' | 'executing' | 'success' | 'failed' | 'timeout';

// 设备信息
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  projectId: string;
  projectName: string;
  bankId?: string;
  status: DeviceStatus;
  runningState: RunningState;
  lastOnlineTime: Date;
  firmwareVersion: string;
  ipAddress: string;
  location: string;
  // 实时参数
  currentPower: number; // 当前功率 (kW)
  voltage: number; // 电压 (V)
  current: number; // 电流 (A)
  soc: number; // SOC (%)
  temperature: number; // 温度 (°C)
  // 设置参数
  maxChargePower: number; // 最大充电功率 (kW)
  maxDischargePower: number; // 最大放电功率 (kW)
  socUpperLimit: number; // SOC上限 (%)
  socLowerLimit: number; // SOC下限 (%)
  tempUpperLimit: number; // 温度上限 (°C)
}

// 远程命令
export interface RemoteCommand {
  commandId: string;
  deviceId: string;
  deviceName: string;
  commandType: CommandType;
  commandName: string;
  parameters?: Record<string, any>;
  status: CommandStatus;
  createdAt: Date;
  sentAt?: Date;
  executedAt?: Date;
  completedAt?: Date;
  result?: string;
  errorMessage?: string;
  operator: string;
}

// 命令执行结果
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

// 设备日志
export interface DeviceLog {
  id: string;
  deviceId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export class MockRemoteControlService {
  private devices: Map<string, DeviceInfo> = new Map();
  private commands: RemoteCommand[] = [];
  private logs: DeviceLog[] = [];
  private commandIdCounter = 1;
  private logIdCounter = 1;

  constructor() {
    this.initializeDevices();
  }

  /**
   * 初始化模拟设备
   */
  private initializeDevices() {
    // 项目1设备
    ['2#', '14#', '15#'].forEach((system, idx) => {
      for (let i = 1; i <= 3; i++) {
        const deviceId = `project1-${system}-bank${i}-bms`;
        this.devices.set(deviceId, {
          deviceId,
          deviceName: `项目1-${system}-Bank${i}-BMS`,
          deviceType: 'bms',
          projectId: `project1-${system}`,
          projectName: `项目1-${system}站`,
          bankId: `Bank${i}`,
          status: Math.random() > 0.1 ? 'online' : 'offline',
          runningState: this.getRandomRunningState(),
          lastOnlineTime: new Date(Date.now() - Math.random() * 3600000),
          firmwareVersion: `v2.${3 + idx}.${i}`,
          ipAddress: `192.168.${10 + idx}.${10 + i}`,
          location: `${system}站-Bank${i}`,
          currentPower: Math.random() * 100 - 50,
          voltage: 750 + Math.random() * 50,
          current: Math.random() * 200 - 100,
          soc: 70 + Math.random() * 25,
          temperature: 25 + Math.random() * 15,
          maxChargePower: 100,
          maxDischargePower: 100,
          socUpperLimit: 95,
          socLowerLimit: 10,
          tempUpperLimit: 45
        });
      }
    });

    // 项目2设备
    ['group1', 'group2', 'group3', 'group4'].forEach((group, idx) => {
      for (let i = 1; i <= 2; i++) {
        const deviceId = `project2-${group}-bank${i}-bms`;
        this.devices.set(deviceId, {
          deviceId,
          deviceName: `项目2-${group}-Bank${i}-BMS`,
          deviceType: 'bms',
          projectId: `project2-${group}`,
          projectName: `项目2-${group}`,
          bankId: `Bank${i}`,
          status: Math.random() > 0.1 ? 'online' : 'offline',
          runningState: this.getRandomRunningState(),
          lastOnlineTime: new Date(Date.now() - Math.random() * 3600000),
          firmwareVersion: `v2.${4 + idx}.${i}`,
          ipAddress: `192.168.${20 + idx}.${10 + i}`,
          location: `${group}-Bank${i}`,
          currentPower: Math.random() * 80 - 40,
          voltage: 680 + Math.random() * 80,
          current: Math.random() * 160 - 80,
          soc: 70 + Math.random() * 25,
          temperature: 25 + Math.random() * 15,
          maxChargePower: 80,
          maxDischargePower: 80,
          socUpperLimit: 95,
          socLowerLimit: 10,
          tempUpperLimit: 45
        });
      }
    });
  }

  /**
   * 获取随机运行状态
   */
  private getRandomRunningState(): RunningState {
    const states: RunningState[] = ['idle', 'charging', 'discharging', 'standby'];
    return states[Math.floor(Math.random() * states.length)];
  }

  /**
   * 获取所有设备列表
   */
  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  /**
   * 根据项目ID获取设备
   */
  getDevicesByProject(projectId: string): DeviceInfo[] {
    return this.getDevices().filter(d => d.projectId === projectId);
  }

  /**
   * 获取在线设备数量
   */
  getOnlineDeviceCount(): number {
    return this.getDevices().filter(d => d.status === 'online').length;
  }

  /**
   * 获取设备详情
   */
  getDevice(deviceId: string): DeviceInfo | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * 更新设备状态（模拟实时更新）
   */
  updateDeviceStatus(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    // 模拟状态变化
    if (device.runningState === 'charging') {
      device.currentPower = Math.abs(device.currentPower) + Math.random() * 5;
      device.soc = Math.min(device.socUpperLimit, device.soc + Math.random() * 0.5);
      device.temperature = Math.min(device.tempUpperLimit, device.temperature + Math.random() * 0.2);
    } else if (device.runningState === 'discharging') {
      device.currentPower = -Math.abs(device.currentPower) - Math.random() * 5;
      device.soc = Math.max(device.socLowerLimit, device.soc - Math.random() * 0.5);
      device.temperature = Math.min(device.tempUpperLimit, device.temperature + Math.random() * 0.2);
    } else if (device.runningState === 'balancing') {
      device.currentPower = Math.random() * 10;
      device.temperature = Math.min(device.tempUpperLimit, device.temperature + Math.random() * 0.1);
    } else {
      device.currentPower = Math.random() * 5 - 2.5;
      device.temperature = Math.max(20, device.temperature - Math.random() * 0.1);
    }

    device.current = device.currentPower / device.voltage * 1000;
    device.lastOnlineTime = new Date();
  }

  /**
   * 发送远程命令
   */
  async sendCommand(
    deviceId: string,
    commandType: CommandType,
    parameters?: Record<string, any>,
    operator: string = '系统管理员'
  ): Promise<CommandResult> {
    const device = this.devices.get(deviceId);
    
    if (!device) {
      return {
        success: false,
        message: '设备不存在'
      };
    }

    if (device.status !== 'online') {
      return {
        success: false,
        message: '设备离线，无法执行命令'
      };
    }

    // 创建命令记录
    const command: RemoteCommand = {
      commandId: `CMD${String(this.commandIdCounter++).padStart(6, '0')}`,
      deviceId,
      deviceName: device.deviceName,
      commandType,
      commandName: this.getCommandName(commandType),
      parameters,
      status: 'pending',
      createdAt: new Date(),
      operator
    };

    this.commands.unshift(command);

    // 模拟命令执行过程
    return new Promise((resolve) => {
      // 发送中
      setTimeout(() => {
        command.status = 'sending';
        command.sentAt = new Date();
        this.addLog(deviceId, 'info', `命令已发送: ${command.commandName}`);
      }, 500);

      // 执行中
      setTimeout(() => {
        command.status = 'executing';
        command.executedAt = new Date();
        this.addLog(deviceId, 'info', `命令执行中: ${command.commandName}`);
        
        // 执行命令逻辑
        this.executeCommand(device, commandType, parameters);
      }, 1500);

      // 完成
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95%成功率
        
        if (success) {
          command.status = 'success';
          command.result = '命令执行成功';
          this.addLog(deviceId, 'info', `命令执行成功: ${command.commandName}`);
        } else {
          command.status = 'failed';
          command.errorMessage = '设备响应超时或执行失败';
          this.addLog(deviceId, 'error', `命令执行失败: ${command.commandName}`);
        }
        
        command.completedAt = new Date();
        
        resolve({
          success,
          message: success ? '命令执行成功' : '命令执行失败',
          data: command
        });
      }, 3000);
    });
  }

  /**
   * 执行命令逻辑
   */
  private executeCommand(device: DeviceInfo, commandType: CommandType, parameters?: Record<string, any>) {
    switch (commandType) {
      case 'start_charge':
        device.runningState = 'charging';
        device.currentPower = parameters?.power || device.maxChargePower * 0.8;
        break;
      
      case 'stop_charge':
        if (device.runningState === 'charging') {
          device.runningState = 'idle';
          device.currentPower = 0;
        }
        break;
      
      case 'start_discharge':
        device.runningState = 'discharging';
        device.currentPower = -(parameters?.power || device.maxDischargePower * 0.8);
        break;
      
      case 'stop_discharge':
        if (device.runningState === 'discharging') {
          device.runningState = 'idle';
          device.currentPower = 0;
        }
        break;
      
      case 'start_balance':
        device.runningState = 'balancing';
        device.currentPower = 5;
        break;
      
      case 'stop_balance':
        if (device.runningState === 'balancing') {
          device.runningState = 'idle';
          device.currentPower = 0;
        }
        break;
      
      case 'set_charge_power':
        if (parameters?.power) {
          device.maxChargePower = Math.min(200, Math.max(0, parameters.power));
          if (device.runningState === 'charging') {
            device.currentPower = device.maxChargePower * 0.8;
          }
        }
        break;
      
      case 'set_discharge_power':
        if (parameters?.power) {
          device.maxDischargePower = Math.min(200, Math.max(0, parameters.power));
          if (device.runningState === 'discharging') {
            device.currentPower = -device.maxDischargePower * 0.8;
          }
        }
        break;
      
      case 'set_soc_limit':
        if (parameters?.upper !== undefined) {
          device.socUpperLimit = Math.min(100, Math.max(50, parameters.upper));
        }
        if (parameters?.lower !== undefined) {
          device.socLowerLimit = Math.min(50, Math.max(0, parameters.lower));
        }
        break;
      
      case 'set_temp_limit':
        if (parameters?.upper !== undefined) {
          device.tempUpperLimit = Math.min(60, Math.max(30, parameters.upper));
        }
        break;
      
      case 'system_start':
        device.runningState = 'standby';
        device.status = 'online';
        break;
      
      case 'system_stop':
        device.runningState = 'idle';
        device.currentPower = 0;
        break;
      
      case 'system_restart':
        device.status = 'offline';
        setTimeout(() => {
          device.status = 'online';
          device.runningState = 'standby';
          this.addLog(device.deviceId, 'info', '系统重启完成');
        }, 5000);
        break;
    }
  }

  /**
   * 获取命令名称
   */
  private getCommandName(commandType: CommandType): string {
    const names: Record<CommandType, string> = {
      start_charge: '启动充电',
      stop_charge: '停止充电',
      start_discharge: '启动放电',
      stop_discharge: '停止放电',
      start_balance: '启动均衡',
      stop_balance: '停止均衡',
      set_charge_power: '设置充电功率',
      set_discharge_power: '设置放电功率',
      set_soc_limit: '设置SOC限制',
      set_temp_limit: '设置温度限制',
      system_start: '启动系统',
      system_stop: '停止系统',
      system_restart: '重启系统'
    };
    return names[commandType];
  }

  /**
   * 获取命令历史
   */
  getCommandHistory(deviceId?: string, limit: number = 50): RemoteCommand[] {
    let commands = this.commands;
    if (deviceId) {
      commands = commands.filter(c => c.deviceId === deviceId);
    }
    return commands.slice(0, limit);
  }

  /**
   * 获取最近命令
   */
  getRecentCommands(limit: number = 10): RemoteCommand[] {
    return this.commands.slice(0, limit);
  }

  /**
   * 添加设备日志
   */
  private addLog(deviceId: string, level: 'info' | 'warning' | 'error', message: string, details?: string) {
    this.logs.unshift({
      id: `LOG${String(this.logIdCounter++).padStart(6, '0')}`,
      deviceId,
      timestamp: new Date(),
      level,
      message,
      details
    });

    // 保留最近1000条日志
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
  }

  /**
   * 获取设备日志
   */
  getDeviceLogs(deviceId: string, limit: number = 50): DeviceLog[] {
    return this.logs
      .filter(log => log.deviceId === deviceId)
      .slice(0, limit);
  }

  /**
   * 获取所有日志
   */
  getAllLogs(limit: number = 100): DeviceLog[] {
    return this.logs.slice(0, limit);
  }

  /**
   * 清空命令历史
   */
  clearCommandHistory() {
    this.commands = [];
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }
}

// 创建单例实例
export const mockRemoteControlService = new MockRemoteControlService();

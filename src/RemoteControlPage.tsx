/**
 * 远程控制页面
 * 提供设备管理、远程命令、命令执行和实时监控功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  InputNumber,
  Slider,
  Statistic,
  Timeline,
  Badge,
  message,
  Tabs,
  Progress,
  Alert,
  Descriptions
} from 'antd';
import {
  ControlOutlined,
  ThunderboltOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  HistoryOutlined,
  WifiOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import {
  mockRemoteControlService,
  type DeviceInfo,
  type RemoteCommand,
  type DeviceLog,
  type CommandType
} from './services/mockRemoteControlService';

const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

export const RemoteControlPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<DeviceInfo | null>(null);
  const [commands, setCommands] = useState<RemoteCommand[]>([]);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 控制参数
  const [chargePower, setChargePower] = useState(80);
  const [dischargePower, setDischargePower] = useState(80);
  const [socUpper, setSocUpper] = useState(95);
  const [socLower, setSocLower] = useState(10);
  const [tempUpper, setTempUpper] = useState(45);

  // 实时更新定时器
  useEffect(() => {
    loadDevices();
    loadCommands();
    
    // 启动实时更新
    const interval = setInterval(() => {
      if (selectedDevice) {
        mockRemoteControlService.updateDeviceStatus(selectedDevice);
        refreshDeviceDetail();
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedDevice]);

  /**
   * 加载设备列表
   */
  const loadDevices = () => {
    const deviceList = mockRemoteControlService.getDevices();
    setDevices(deviceList);
    if (deviceList.length > 0 && !selectedDevice) {
      setSelectedDevice(deviceList[0].deviceId);
    }
  };

  /**
   * 加载命令历史
   */
  const loadCommands = () => {
    const commandList = mockRemoteControlService.getRecentCommands(20);
    setCommands(commandList);
  };

  /**
   * 刷新设备详情
   */
  const refreshDeviceDetail = () => {
    if (selectedDevice) {
      const device = mockRemoteControlService.getDevice(selectedDevice);
      if (device) {
        setDeviceDetail(device);
        // 更新控制参数
        setChargePower(device.maxChargePower);
        setDischargePower(device.maxDischargePower);
        setSocUpper(device.socUpperLimit);
        setSocLower(device.socLowerLimit);
        setTempUpper(device.tempUpperLimit);
      }
      // 加载日志
      const deviceLogs = mockRemoteControlService.getDeviceLogs(selectedDevice, 20);
      setLogs(deviceLogs);
    }
  };

  /**
   * 选择设备
   */
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    const device = mockRemoteControlService.getDevice(deviceId);
    setDeviceDetail(device || null);
  };

  /**
   * 发送命令
   */
  const sendCommand = async (commandType: CommandType, parameters?: Record<string, any>, confirmMessage?: string) => {
    if (!selectedDevice || !deviceDetail) {
      message.error('请先选择设备');
      return;
    }

    if (deviceDetail.status !== 'online') {
      message.error('设备离线，无法执行命令');
      return;
    }

    const executeCommand = async () => {
      setLoading(true);
      try {
        const result = await mockRemoteControlService.sendCommand(
          selectedDevice,
          commandType,
          parameters
        );
        
        if (result.success) {
          message.success('命令发送成功');
          loadCommands();
          refreshDeviceDetail();
        } else {
          message.error(result.message);
        }
      } catch (error) {
        console.error('命令发送失败:', error);
        message.error('命令发送失败');
      } finally {
        setLoading(false);
      }
    };

    if (confirmMessage) {
      confirm({
        title: '确认操作',
        content: confirmMessage,
        onOk: executeCommand
      });
    } else {
      executeCommand();
    }
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  /**
   * 获取运行状态颜色
   */
  const getRunningStateColor = (state: string) => {
    switch (state) {
      case 'charging': return 'blue';
      case 'discharging': return 'orange';
      case 'balancing': return 'purple';
      case 'idle': return 'default';
      case 'standby': return 'cyan';
      case 'fault': return 'red';
      default: return 'default';
    }
  };

  /**
   * 获取运行状态文本
   */
  const getRunningStateText = (state: string) => {
    const texts: Record<string, string> = {
      idle: '空闲',
      charging: '充电中',
      discharging: '放电中',
      balancing: '均衡中',
      standby: '待机',
      fault: '故障'
    };
    return texts[state] || state;
  };

  /**
   * 获取命令状态图标
   */
  const getCommandStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'executing': return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case 'sending': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default: return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  /**
   * 获取日志级别颜色
   */
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ControlOutlined />
              远程控制
            </h2>
            <p className="text-gray-500">远程控制储能设备，实时监控运行状态</p>
          </div>
          <Space>
            <Badge count={mockRemoteControlService.getOnlineDeviceCount()} showZero>
              <Button icon={<WifiOutlined />}>
                在线设备
              </Button>
            </Badge>
            <Button icon={<ReloadOutlined />} onClick={() => { loadDevices(); loadCommands(); }}>
              刷新
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：设备列表和控制面板 */}
        <Col xs={24} lg={16}>
          {/* 设备选择 */}
          <Card size="small" className="mb-4">
            <Space className="w-full" direction="vertical">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">选择设备：</span>
                <Select
                  style={{ flex: 1 }}
                  value={selectedDevice}
                  onChange={handleSelectDevice}
                  placeholder="请选择设备"
                >
                  {devices.map(device => (
                    <Option key={device.deviceId} value={device.deviceId}>
                      <Space>
                        {device.status === 'online' ? (
                          <WifiOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <DisconnectOutlined style={{ color: '#d9d9d9' }} />
                        )}
                        {device.deviceName}
                        <Tag color={getRunningStateColor(device.runningState)}>
                          {getRunningStateText(device.runningState)}
                        </Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Space>
          </Card>

          {deviceDetail && (
            <>
              {/* 设备状态 */}
              <Card title="设备状态" size="small" className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="功率"
                      value={Math.abs(deviceDetail.currentPower)}
                      suffix="kW"
                      prefix={deviceDetail.currentPower > 0 ? <ThunderboltOutlined /> : <ThunderboltOutlined />}
                      valueStyle={{ 
                        color: deviceDetail.currentPower > 0 ? '#52c41a' : deviceDetail.currentPower < 0 ? '#ff7a45' : '#d9d9d9',
                        fontSize: '20px'
                      }}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {deviceDetail.currentPower > 0 ? '充电' : deviceDetail.currentPower < 0 ? '放电' : '待机'}
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="SOC"
                      value={deviceDetail.soc}
                      suffix="%"
                      precision={1}
                      valueStyle={{ fontSize: '20px' }}
                    />
                    <Progress 
                      percent={deviceDetail.soc} 
                      size="small" 
                      showInfo={false}
                      strokeColor={deviceDetail.soc > 80 ? '#52c41a' : deviceDetail.soc > 20 ? '#1890ff' : '#ff4d4f'}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="电压"
                      value={deviceDetail.voltage}
                      suffix="V"
                      precision={1}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="温度"
                      value={deviceDetail.temperature}
                      suffix="°C"
                      precision={1}
                      valueStyle={{ 
                        color: deviceDetail.temperature > 40 ? '#ff4d4f' : '#1890ff',
                        fontSize: '20px'
                      }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* 控制面板 */}
              <Card title="控制面板" size="small" className="mb-4">
                <Tabs defaultActiveKey="charge">
                  {/* 充放电控制 */}
                  <TabPane tab="充放电控制" key="charge">
                    <Space direction="vertical" className="w-full" size="large">
                      {/* 充电控制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">充电功率：</span>
                          <span className="text-lg font-bold text-blue-600 ml-2">{chargePower} kW</span>
                        </div>
                        <Slider
                          min={0}
                          max={deviceDetail.maxChargePower}
                          value={chargePower}
                          onChange={setChargePower}
                          marks={{
                            0: '0',
                            [deviceDetail.maxChargePower]: `${deviceDetail.maxChargePower}`
                          }}
                        />
                        <Space className="mt-2">
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => sendCommand('start_charge', { power: chargePower })}
                            disabled={deviceDetail.runningState === 'charging' || loading}
                            loading={loading}
                          >
                            启动充电
                          </Button>
                          <Button
                            danger
                            icon={<PauseCircleOutlined />}
                            onClick={() => sendCommand('stop_charge', undefined, '确定要停止充电吗？')}
                            disabled={deviceDetail.runningState !== 'charging' || loading}
                          >
                            停止充电
                          </Button>
                        </Space>
                      </div>

                      {/* 放电控制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">放电功率：</span>
                          <span className="text-lg font-bold text-orange-600 ml-2">{dischargePower} kW</span>
                        </div>
                        <Slider
                          min={0}
                          max={deviceDetail.maxDischargePower}
                          value={dischargePower}
                          onChange={setDischargePower}
                          marks={{
                            0: '0',
                            [deviceDetail.maxDischargePower]: `${deviceDetail.maxDischargePower}`
                          }}
                        />
                        <Space className="mt-2">
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => sendCommand('start_discharge', { power: dischargePower })}
                            disabled={deviceDetail.runningState === 'discharging' || loading}
                            loading={loading}
                          >
                            启动放电
                          </Button>
                          <Button
                            danger
                            icon={<PauseCircleOutlined />}
                            onClick={() => sendCommand('stop_discharge', undefined, '确定要停止放电吗？')}
                            disabled={deviceDetail.runningState !== 'discharging' || loading}
                          >
                            停止放电
                          </Button>
                        </Space>
                      </div>

                      {/* 均衡控制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">均衡充电</span>
                        </div>
                        <Space>
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => sendCommand('start_balance')}
                            disabled={deviceDetail.runningState === 'balancing' || loading}
                            loading={loading}
                          >
                            启动均衡
                          </Button>
                          <Button
                            danger
                            icon={<PauseCircleOutlined />}
                            onClick={() => sendCommand('stop_balance')}
                            disabled={deviceDetail.runningState !== 'balancing' || loading}
                          >
                            停止均衡
                          </Button>
                        </Space>
                      </div>
                    </Space>
                  </TabPane>

                  {/* 参数设置 */}
                  <TabPane tab="参数设置" key="settings">
                    <Space direction="vertical" className="w-full" size="large">
                      {/* SOC限制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">SOC上限：</span>
                          <InputNumber
                            min={50}
                            max={100}
                            value={socUpper}
                            onChange={(val) => setSocUpper(val || 95)}
                            suffix="%"
                            className="ml-2"
                          />
                        </div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">SOC下限：</span>
                          <InputNumber
                            min={0}
                            max={50}
                            value={socLower}
                            onChange={(val) => setSocLower(val || 10)}
                            suffix="%"
                            className="ml-2"
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<SettingOutlined />}
                          onClick={() => sendCommand('set_soc_limit', { upper: socUpper, lower: socLower })}
                          loading={loading}
                        >
                          设置SOC限制
                        </Button>
                      </div>

                      {/* 温度限制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">温度上限：</span>
                          <InputNumber
                            min={30}
                            max={60}
                            value={tempUpper}
                            onChange={(val) => setTempUpper(val || 45)}
                            suffix="°C"
                            className="ml-2"
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<SettingOutlined />}
                          onClick={() => sendCommand('set_temp_limit', { upper: tempUpper })}
                          loading={loading}
                        >
                          设置温度限制
                        </Button>
                      </div>

                      {/* 功率限制 */}
                      <div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">最大充电功率：</span>
                          <InputNumber
                            min={0}
                            max={200}
                            value={chargePower}
                            onChange={(val) => setChargePower(val || 80)}
                            suffix="kW"
                            className="ml-2"
                          />
                        </div>
                        <div className="mb-3">
                          <span className="text-sm font-medium">最大放电功率：</span>
                          <InputNumber
                            min={0}
                            max={200}
                            value={dischargePower}
                            onChange={(val) => setDischargePower(val || 80)}
                            suffix="kW"
                            className="ml-2"
                          />
                        </div>
                        <Space>
                          <Button
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => sendCommand('set_charge_power', { power: chargePower })}
                            loading={loading}
                          >
                            设置充电功率
                          </Button>
                          <Button
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => sendCommand('set_discharge_power', { power: dischargePower })}
                            loading={loading}
                          >
                            设置放电功率
                          </Button>
                        </Space>
                      </div>
                    </Space>
                  </TabPane>

                  {/* 系统控制 */}
                  <TabPane tab="系统控制" key="system">
                    <Space direction="vertical" className="w-full" size="large">
                      <Alert
                        message="危险操作"
                        description="系统控制命令会影响设备运行，请谨慎操作"
                        type="warning"
                        showIcon
                      />
                      
                      <Space wrap>
                        <Button
                          type="primary"
                          icon={<PoweroffOutlined />}
                          onClick={() => sendCommand('system_start', undefined, '确定要启动系统吗？')}
                          loading={loading}
                        >
                          启动系统
                        </Button>
                        <Button
                          danger
                          icon={<PoweroffOutlined />}
                          onClick={() => sendCommand('system_stop', undefined, '确定要停止系统吗？这将中断所有运行中的任务。')}
                          loading={loading}
                        >
                          停止系统
                        </Button>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => sendCommand('system_restart', undefined, '确定要重启系统吗？重启过程约需5秒。')}
                          loading={loading}
                        >
                          重启系统
                        </Button>
                      </Space>
                    </Space>
                  </TabPane>
                </Tabs>
              </Card>

              {/* 设备信息 */}
              <Card title="设备信息" size="small">
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="设备ID">{deviceDetail.deviceId}</Descriptions.Item>
                  <Descriptions.Item label="设备类型">
                    <Tag>{deviceDetail.deviceType.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="在线状态">
                    <Badge status={getStatusColor(deviceDetail.status) as any} text={deviceDetail.status === 'online' ? '在线' : '离线'} />
                  </Descriptions.Item>
                  <Descriptions.Item label="运行状态">
                    <Tag color={getRunningStateColor(deviceDetail.runningState)}>
                      {getRunningStateText(deviceDetail.runningState)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="固件版本">{deviceDetail.firmwareVersion}</Descriptions.Item>
                  <Descriptions.Item label="IP地址">{deviceDetail.ipAddress}</Descriptions.Item>
                  <Descriptions.Item label="位置">{deviceDetail.location}</Descriptions.Item>
                  <Descriptions.Item label="最后在线">
                    {deviceDetail.lastOnlineTime.toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          )}
        </Col>

        {/* 右侧：命令历史和日志 */}
        <Col xs={24} lg={8}>
          <Tabs defaultActiveKey="commands">
            {/* 命令历史 */}
            <TabPane tab={<span><HistoryOutlined />命令历史</span>} key="commands">
              <Timeline>
                {commands.map(cmd => (
                  <Timeline.Item
                    key={cmd.commandId}
                    dot={getCommandStatusIcon(cmd.status)}
                    color={
                      cmd.status === 'success' ? 'green' :
                      cmd.status === 'failed' ? 'red' :
                      cmd.status === 'executing' ? 'blue' : 'gray'
                    }
                  >
                    <div className="text-xs text-gray-400">{cmd.createdAt.toLocaleString()}</div>
                    <div className="font-medium">{cmd.commandName}</div>
                    <div className="text-sm text-gray-600">{cmd.deviceName}</div>
                    {cmd.result && (
                      <div className="text-xs text-green-600 mt-1">{cmd.result}</div>
                    )}
                    {cmd.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">{cmd.errorMessage}</div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </TabPane>

            {/* 设备日志 */}
            <TabPane tab={<span><HistoryOutlined />设备日志</span>} key="logs">
              <Timeline>
                {logs.map(log => (
                  <Timeline.Item
                    key={log.id}
                    color={getLogLevelColor(log.level)}
                  >
                    <div className="text-xs text-gray-400">{log.timestamp.toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <Tag color={getLogLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Tag>
                      <span className="text-sm">{log.message}</span>
                    </div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-1">{log.details}</div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default RemoteControlPage;

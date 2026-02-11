import { List, Tag } from 'antd';
import { WarningOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Alert, AlertLevel } from '../../types';

interface AlertCardProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

const levelConfig: Record<AlertLevel, { color: string; icon: React.ReactNode }> = {
  critical: { color: 'red', icon: <CloseCircleOutlined /> },
  warning: { color: 'orange', icon: <WarningOutlined /> },
  info: { color: 'blue', icon: <InfoCircleOutlined /> },
};

export const AlertCard = ({ alerts, onAlertClick }: AlertCardProps) => {
  return (
    <List
      size="small"
      dataSource={alerts.slice(0, 5)}
      renderItem={(alert) => {
        const config = levelConfig[alert.level];
        return (
          <List.Item
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="flex items-center gap-2 w-full">
              <Tag color={config.color} icon={config.icon}>
                {alert.title}
              </Tag>
              <span className="text-gray-600 text-sm flex-1 truncate">
                {alert.location.projectName} - {alert.location.bankId}
              </span>
              <span className="text-gray-400 text-xs">
                {alert.timestamp.split(' ')[1]}
              </span>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default AlertCard;

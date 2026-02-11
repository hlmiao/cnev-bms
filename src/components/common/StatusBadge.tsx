import { Badge } from 'antd';
import { STATUS_COLORS } from '../../utils/constants';
import type { StatusType } from '../../types';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  showDot?: boolean;
}

const statusTextMap: Record<StatusType, string> = {
  normal: '正常',
  warning: '警告',
  error: '异常',
  offline: '离线',
};

export const StatusBadge = ({ status, text, showDot = true }: StatusBadgeProps) => {
  const displayText = text || statusTextMap[status];
  const color = STATUS_COLORS[status];

  if (showDot) {
    return (
      <Badge
        color={color}
        text={<span style={{ color }}>{displayText}</span>}
      />
    );
  }

  return (
    <span
      className="px-2 py-1 rounded text-sm"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;

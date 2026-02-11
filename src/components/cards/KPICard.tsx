import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { PLACEHOLDER, STATUS_COLORS } from '../../utils/constants';
import type { StatusType } from '../../types';

interface KPICardProps {
  title: string;
  value: number | string | null;
  unit?: string;
  precision?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: StatusType;
  isPlaceholder?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard = ({
  title,
  value,
  unit,
  precision = 1,
  trend,
  trendValue,
  status = 'normal',
  isPlaceholder = false,
  icon,
  className = '',
}: KPICardProps) => {
  const displayValue = isPlaceholder || value === null ? PLACEHOLDER : value;
  const valueColor = status ? STATUS_COLORS[status] : undefined;

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined className="text-green-500" />;
      case 'down':
        return <ArrowDownOutlined className="text-red-500" />;
      case 'stable':
        return <MinusOutlined className="text-gray-400" />;
    }
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${className}`} size="small">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-gray-500 text-sm mb-2">{title}</div>
          <div className="flex items-baseline gap-1">
            {isPlaceholder ? (
              <span className="text-2xl font-semibold text-gray-300">{PLACEHOLDER}</span>
            ) : (
              <Statistic
                value={typeof displayValue === 'number' ? displayValue : undefined}
                precision={precision}
                suffix={unit}
                valueStyle={{ 
                  color: valueColor, 
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              />
            )}
          </div>
          {trend && trendValue !== undefined && (
            <div className="mt-1 text-sm flex items-center gap-1">
              {getTrendIcon()}
              <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}>
                {trendValue}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-3xl text-gray-300">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;

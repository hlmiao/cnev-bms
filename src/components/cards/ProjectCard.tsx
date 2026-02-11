import { Card, Row, Col } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { StatusBadge } from '../common/StatusBadge';
import { formatVoltage, formatPercent } from '../../utils/formatters';
import type { StatusType } from '../../types';

interface ProjectCardProps {
  id: string;
  name: string;
  status: StatusType;
  voltage: number;
  current: number;
  soc: number;
  soh: number;
  bankCount: number;
  onClick?: () => void;
}

export const ProjectCard = ({
  name,
  status,
  voltage,
  current,
  soc,
  soh,
  bankCount,
  onClick,
}: ProjectCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      size="small"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} showDot />
          <span className="font-medium text-base">{name}</span>
        </div>
        <RightOutlined className="text-gray-400" />
      </div>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <div className="text-gray-500 text-xs">电压</div>
          <div className="font-medium">{formatVoltage(voltage)}</div>
        </Col>
        <Col span={12}>
          <div className="text-gray-500 text-xs">电流</div>
          <div className="font-medium">{current.toFixed(1)}A</div>
        </Col>
        <Col span={12}>
          <div className="text-gray-500 text-xs">SOC</div>
          <div className="font-medium">{formatPercent(soc)}</div>
        </Col>
        <Col span={12}>
          <div className="text-gray-500 text-xs">SOH</div>
          <div className="font-medium">{formatPercent(soh)}</div>
        </Col>
      </Row>
      <div className="mt-2 pt-2 border-t border-gray-100 text-gray-400 text-xs">
        {bankCount} Banks
      </div>
    </Card>
  );
};

export default ProjectCard;

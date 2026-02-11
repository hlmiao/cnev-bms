import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Project {
  id: string;
  name: string;
  location: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  ratedCapacity?: number | null;
  ratedPower?: number | null;
  status: string;
}

interface WorldMapProps {
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
}

export const WorldMap = ({ projects, onProjectClick }: WorldMapProps) => {
  // 欧洲中心坐标
  const europeCenter: [number, number] = [50, 10];

  // 根据状态获取颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      default:
        return '#1890ff';
    }
  };

  // 根据容量计算圆圈大小
  const getRadius = (capacity: number | null | undefined) => {
    const cap = capacity || 30;
    return Math.max(10, Math.min(25, cap / 3));
  };

  return (
    <MapContainer
      center={europeCenter}
      zoom={4}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={true}
    >
      {/* 使用 CartoDB 的黑白简约风格地图 */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {projects.map((project) => {
        if (!project.coordinates) return null;
        
        return (
          <CircleMarker
            key={project.id}
            center={[project.coordinates.lat, project.coordinates.lng]}
            radius={getRadius(project.ratedCapacity)}
            pathOptions={{
              color: getStatusColor(project.status),
              fillColor: getStatusColor(project.status),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onProjectClick?.(project.id),
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-base mb-1">{project.name}</div>
                <div className="text-sm text-gray-600 mb-1">📍 {project.location}</div>
                <div className="text-sm">
                  <span className="text-gray-500">容量:</span>{' '}
                  <span className="font-medium">{project.ratedCapacity || '--'} MWh</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">功率:</span>{' '}
                  <span className="font-medium">{project.ratedPower || '--'} MW</span>
                </div>
                <div className="text-sm mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-white text-xs ${
                      project.status === 'normal'
                        ? 'bg-green-500'
                        : project.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  >
                    {project.status === 'normal' ? '正常运行' : project.status === 'warning' ? '需要关注' : '异常'}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default WorldMap;

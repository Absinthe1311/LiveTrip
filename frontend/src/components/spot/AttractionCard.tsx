import { Card, Button, Tag, Image, Empty } from 'antd';
import { ThunderboltOutlined, TeamOutlined, CheckCircleOutlined, PictureOutlined } from '@ant-design/icons';

interface AttractionCardProps {
  time: string;
  name: string;
  desc: string;
  onShowAlternatives?: (item: any) => void;
  onTimeChange?: (newTime: string) => void;
  recommendedDuration?: number;
  iotData?: {
    crowdLevel: number;
    temperature: number;
    humidity?: number;
    rainProbability: number;
    weatherDescription?: string;
    weatherIcon?: string;
    isOpen: boolean;
  };
  item?: any;
  city?: string;
  imageUrl?: string;  // 新增：图片URL由父组件提供
}

export default function AttractionCard({ time, name, desc, onShowAlternatives, iotData, item, city, imageUrl }: AttractionCardProps) {
  // 图片URL由父组件通过props传入，不再单独加载

  const getWeatherStatus = () => {
    if (!iotData) return null;
    const { rainProbability, temperature, weatherDescription } = iotData;

    // 优先使用真实天气描述
    if (weatherDescription && weatherDescription !== '未知') {
      if (rainProbability > 80) return { icon: '⛈️', text: weatherDescription, color: 'red' };
      if (rainProbability > 50) return { icon: '🌧️', text: weatherDescription, color: 'orange' };
      if (rainProbability > 20) return { icon: '🌦️', text: weatherDescription, color: 'yellow' };
      return { icon: '☀️', text: weatherDescription, color: 'green' };
    }

    // 回退到基于降雨概率的判断
    if (rainProbability > 80) return { icon: '⛈️', text: '暴雨', color: 'red' };
    if (rainProbability > 50) return { icon: '🌧️', text: '中雨', color: 'orange' };
    if (rainProbability > 20) return { icon: '🌦️', text: '小雨', color: 'yellow' };
    return { icon: '☀️', text: '晴天', color: 'green' };
  };

  const getCrowdStatus = () => {
    if (!iotData) return null;
    const { crowdLevel } = iotData;
    if (crowdLevel > 90) return { icon: '👥', text: '极度拥挤', color: 'red' };
    if (crowdLevel > 60) return { icon: '👥', text: '人流较多', color: 'orange' };
    if (crowdLevel > 40) return { icon: '👥', text: '人流适中', color: 'yellow' };
    return { icon: '👥', text: '人流较少', color: 'green' };
  };

  const getOpenStatus = () => {
    if (!iotData) return null;
    const { isOpen } = iotData;
    return isOpen 
      ? { icon: '🔓', text: '正常开放', color: 'green' }
      : { icon: '🔒', text: '已关闭', color: 'red' };
  };

  const weather = getWeatherStatus();
  const crowd = getCrowdStatus();
  const open = getOpenStatus();

  return (
    <Card
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* 景点图片 */}
      {imageUrl && (
        <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
          <Image
            src={imageUrl}
            alt={name}
            style={{ 
              width: '100%', 
              height: 200, 
              objectFit: 'cover' 
            }}
            preview={{
              mask: '点击预览大图',
            }}
          />
        </div>
      )}
      
      {!imageUrl && (
        <div style={{
          marginBottom: 16,
          padding: 20,
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          color: '#999'
        }}>
          <PictureOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <div>暂无景点图片</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#1890ff',
            fontWeight: 600,
            marginBottom: 8,
            fontSize: '14px'
          }}>
            {time}
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            {name}
          </h3>
          <p style={{
            margin: 0,
            color: '#666',
            lineHeight: '1.6',
            fontSize: '14px'
          }}>
            {desc}
          </p>
          
          {/* IoT数据展示 */}
          {iotData && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {weather && (
                  <Tag icon={<ThunderboltOutlined />} color={weather.color}>
                    {weather.icon} {weather.text} {iotData.temperature}°C
                    {iotData.humidity && ` 💧${iotData.humidity}%`}
                  </Tag>
                )}
                {crowd && (
                  <Tag icon={<TeamOutlined />} color={crowd.color}>
                    {crowd.icon} {crowd.text} {iotData.crowdLevel}%
                  </Tag>
                )}
                {open && (
                  <Tag icon={<CheckCircleOutlined />} color={open.color}>
                    {open.icon} {open.text}
                  </Tag>
                )}
              </div>
            </div>
          )}
        </div>
        {onShowAlternatives && (
          <Button
            type="link"
            style={{
              padding: '4px 8px',
              fontSize: '13px',
              color: '#1890ff',
              whiteSpace: 'nowrap',
              marginLeft: 16
            }}
            onClick={() => {
              console.log('🔍 AttractionCard 点击查看备选:', item);
              if (onShowAlternatives) {
                onShowAlternatives(item);
              }
            }}
          >
            查看备选
          </Button>
        )}
      </div>
    </Card>
  );
}


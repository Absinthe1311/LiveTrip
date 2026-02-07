import { Card, Rate, Button, Tag } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { Attraction } from '../types/destination';

interface DestinationAttractionCardProps {
  attraction: Attraction;
  isFavorite: boolean;
  onToggleFavorite: (attractionId: string) => void;
}

export default function DestinationAttractionCard({ attraction, isFavorite, onToggleFavorite }: DestinationAttractionCardProps) {
  return (
    <Card
      hoverable
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        overflow: 'hidden'
      }}
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* 景点图片区域 */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '60px',
        position: 'relative'
      }}>
        {attraction.image ? (
          <img
            src={attraction.image}
            alt={attraction.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <span>🏛️</span>
        )}

        {/* 分类标签 */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px'
        }}>
          <Tag color="blue">{attraction.category}</Tag>
        </div>

        {/* 收藏按钮 */}
        <Button
          type="text"
          icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(attraction.id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorite ? '#ff4d4f' : '#999',
            fontSize: '18px'
          }}
        />
      </div>

      {/* 景点信息 */}
      <div style={{
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#333'
        }}>
          {attraction.name}
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <Rate disabled value={attraction.rating} style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '14px', color: '#666' }}>
            {attraction.rating.toFixed(1)}
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '12px',
          lineHeight: '1.5',
          flex: 1
        }}>
          {attraction.description}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: '12px', color: '#999' }}>
            <div>开放时间: {attraction.openTime}</div>
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#ff4d4f'
          }}>
            {attraction.ticketPrice === 0 ? '免费' : `¥${attraction.ticketPrice}`}
          </div>
        </div>
      </div>
    </Card>
  );
}

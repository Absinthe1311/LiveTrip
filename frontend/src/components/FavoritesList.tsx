import { Card, List, Button, Tag, Empty, Spin, message } from 'antd';
import { HeartFilled, HeartOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { getFavorites, removeFavorite } from '../api/client';

interface FavoriteSpot {
  id: string;
  spotId: string;
  userId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  spot: {
    id: string;
    amapId: string;
    name: string;
    location: string;
    address: string | null;
    city: string;
    category: string | null;
    ticketPrice: number | null;
    openTime: string | null;
    rating: number | null;
    description: string | null;
    isOutdoor: boolean | null;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    iotData?: {
      id: string;
      spotId: string;
      crowdLevel: number;
      temperature: number;
      rainProbability: number;
      isOpen: boolean;
      generatedAt: Date;
      updatedAt: Date;
    };
  };
}

interface FavoritesListProps {
  onAddToAlternatives: (spot: FavoriteSpot) => void;
  targetCity: string;
}

export default function FavoritesList({ onAddToAlternatives, targetCity }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await getFavorites(true);
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('❌ 获取收藏列表失败:', error);
      message.error('获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (spotId: string) => {
    setRemoving(spotId);
    try {
      const response = await removeFavorite(spotId);
      if (response.success) {
        message.success('取消收藏成功');
        setFavorites(prev => prev.filter(f => f.spotId !== spotId));
      }
    } catch (error) {
      console.error('❌ 取消收藏失败:', error);
      message.error('取消收藏失败');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToAlternatives = async (favorite: FavoriteSpot) => {
    // 验证城市
    if (favorite.spot.city !== targetCity) {
      message.error(`该景点属于${favorite.spot.city}，不属于当前行程城市${targetCity}`);
      return;
    }

    // 检查IoT数据是否存在
    if (!favorite.spot.iotData) {
      try {
        console.log(`🔄 为景点 ${favorite.spot.name} 生成IoT数据...`);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spots/${favorite.spotId}/iot/generate`, {
          method: 'POST',
        });

        if (response.ok) {
          const iotDataResponse = await response.json();
          console.log(`✅ IoT数据生成成功:`, iotDataResponse.data);
          // 更新收藏数据
          favorite.spot.iotData = iotDataResponse.data;
        } else {
          console.error(`❌ IoT数据生成失败:`, response.statusText);
          message.warning('IoT数据生成失败，但仍可添加到备选');
        }
      } catch (error) {
        console.error('❌ 生成IoT数据失败:', error);
        message.warning('IoT数据生成失败，但仍可添加到备选');
      }
    }

    onAddToAlternatives(favorite);
  };

  const getWeatherStatus = (iotData?: any) => {
    if (!iotData) return null;
    const { rainProbability, temperature } = iotData;
    if (rainProbability > 80) return { icon: '⛈️', text: '暴雨', color: 'red' };
    if (rainProbability > 50) return { icon: '🌧️', text: '中雨', color: 'orange' };
    if (rainProbability > 20) return { icon: '🌦️', text: '小雨', color: 'yellow' };
    return { icon: '☀️', text: '晴天', color: 'green' };
  };

  const getCrowdStatus = (iotData?: any) => {
    if (!iotData) return null;
    const { crowdLevel } = iotData;
    if (crowdLevel > 90) return { icon: '👥', text: '极度拥挤', color: 'red' };
    if (crowdLevel > 60) return { icon: '👥', text: '人流较多', color: 'orange' };
    if (crowdLevel > 40) return { icon: '👥', text: '人流适中', color: 'yellow' };
    return { icon: '👥', text: '人流较少', color: 'green' };
  };

  const getOpenStatus = (iotData?: any) => {
    if (!iotData) return null;
    const { isOpen } = iotData;
    return isOpen
      ? { icon: '🔓', text: '正常开放', color: 'green' }
      : { icon: '🔒', text: '已关闭', color: 'red' };
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartFilled style={{ color: '#ff4d4f' }} />
          <span>我的收藏</span>
        </div>
      }
      style={{ height: '100%' }}
    >
      <Spin spinning={loading}>
        {favorites.length === 0 ? (
          <Empty description="暂无收藏" />
        ) : (
          <List
            dataSource={favorites}
            renderItem={(favorite) => {
              const weather = getWeatherStatus(favorite.spot.iotData);
              const crowd = getCrowdStatus(favorite.spot.iotData);
              const open = getOpenStatus(favorite.spot.iotData);

              return (
                <List.Item
                  key={favorite.id}
                  actions={[
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddToAlternatives(favorite)}
                      disabled={favorite.spot.city !== targetCity}
                    >
                      到这里去
                    </Button>,
                    <Button
                      type="link"
                      danger
                      icon={<HeartOutlined />}
                      onClick={() => handleRemoveFavorite(favorite.spotId)}
                      loading={removing === favorite.spotId}
                    >
                      取消收藏
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EnvironmentOutlined style={{ color: '#1890ff' }} />
                        <span>{favorite.spot.name}</span>
                        <Tag color="blue">{favorite.spot.city}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          {favorite.spot.description}
                        </div>
                        {favorite.spot.iotData && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {weather && (
                              <Tag color={weather.color}>
                                {weather.icon} {weather.text} {favorite.spot.iotData.temperature}°C
                              </Tag>
                            )}
                            {crowd && (
                              <Tag color={crowd.color}>
                                {crowd.icon} {crowd.text}
                              </Tag>
                            )}
                            {open && (
                              <Tag color={open.color}>
                                {open.icon} {open.text}
                              </Tag>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Spin>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { AutoComplete, Card, Rate, Button, message, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined, FireOutlined, EnvironmentTwoTone } from '@ant-design/icons';
import { Input } from 'antd';
import { searchLocation } from '../api/client';

interface CityOption {
  value: string;
  label: string;
  icon: string;
  province: string;
  rating: number;
  address?: string;
}

interface LocationSearchProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showLocationButton?: boolean;
  showPopularDestinations?: boolean;
}

const POPULAR_CITIES: CityOption[] = [
  { value: '北京', label: '北京', icon: '🏛️', province: '北京', rating: 4.8 },
  { value: '上海', label: '上海', icon: '🌃', province: '上海', rating: 4.8 },
  { value: '广州', label: '广州', icon: '🌸', province: '广东', rating: 4.7 },
  { value: '深圳', label: '深圳', icon: '🏙️', province: '广东', rating: 4.7 },
  { value: '成都', label: '成都', icon: '🐼', province: '四川', rating: 4.6 },
  { value: '杭州', label: '杭州', icon: '🏞️', province: '浙江', rating: 4.6 },
  { value: '武汉', label: '武汉', icon: '🌊', province: '湖北', rating: 4.5 },
  { value: '西安', label: '西安', icon: '🏔️', province: '陕西', rating: 4.5 },
  { value: '重庆', label: '重庆', icon: '🌉', province: '重庆', rating: 4.5 },
];

const POPULAR_DESTINATIONS = [
  { value: '北京', label: '北京', icon: '🏛️', province: '北京', rating: 4.8, address: '中国的首都，历史文化名城' },
  { value: '上海', label: '上海', icon: '🌃', province: '上海', rating: 4.8, address: '国际化大都市，现代与历史交融' },
  { value: '成都', label: '成都', icon: '🐼', province: '四川', rating: 4.6, address: '美食之都，休闲之都' },
  { value: '三亚', label: '三亚', icon: '🏖️', province: '海南', rating: 4.7, address: '热带海滨城市，度假胜地' },
  { value: '西安', label: '西安', icon: '🏔️', province: '陕西', rating: 4.5, address: '古都长安，丝绸之路起点' },
  { value: '丽江', label: '丽江', icon: '🏔️', province: '云南', rating: 4.6, address: '古城风情，纳西文化' },
  { value: '桂林', label: '桂林', icon: '⛰️', province: '广西', rating: 4.5, address: '山水甲天下' },
  { value: '厦门', label: '厦门', icon: '🌊', province: '福建', rating: 4.6, address: '海上花园城市' },
  { value: '青岛', label: '青岛', icon: '🌊', province: '山东', rating: 4.5, address: '红瓦绿树，碧海蓝天' },
];

export default function LocationSearch({
  title,
  placeholder,
  value,
  onChange,
  showLocationButton = false,
  showPopularDestinations = false,
}: LocationSearchProps) {
  const [options, setOptions] = useState<CityOption[]>([]);
  const [searchText, setSearchText] = useState('');
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);

  const popularCities = showPopularDestinations ? POPULAR_DESTINATIONS : POPULAR_CITIES;

  useEffect(() => {
    // 只在 value 真正有值时才更新 searchText
    if (value && value.trim() !== '') {
      setSearchText(value);
    } else {
      setSearchText('');
    }
  }, [value]);

  // 获取当前位置
  const handleGetCurrentLocation = async () => {
    setLocating(true);
    try {
      // 使用浏览器定位API获取经纬度
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('您的浏览器不支持定位功能'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 获取到当前坐标:', latitude, longitude);

      // 调用后端逆地理编码API获取地址（使用后端缓存）
      const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
      console.log('🔑 高德地图Web服务API Key:', amapKey ? '已配置' : '未配置');

      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&extensions=base`
      );
      const data = await response.json();

      console.log('📦 逆地理编码API响应:', data);

      if (data.status === '1' && data.regeocode) {
        const regeocode = data.regeocode;
        console.log('🏙️ 逆地理编码结果:', regeocode);

        const addressComponent = regeocode.addressComponent;
        console.log('📍 地址组件:', addressComponent);

        // 优先使用城市，如果没有则使用省份
        let city = addressComponent.city;

        // 如果city为空，尝试使用district（区县）
        if (!city) {
          city = addressComponent.district;
        }

        // 如果district也为空，使用province
        if (!city) {
          city = addressComponent.province;
        }

        // 如果还是没有，使用formatted_address（完整地址）
        if (!city && regeocode.formatted_address) {
          city = regeocode.formatted_address.split('市')[0];
          if (city.length > 10) {
            city = regeocode.formatted_address.split('省')[1]?.split('市')[0] || regeocode.formatted_address.split('市')[0];
          }
        }

        console.log('✅ 最终获取的城市:', city);

        if (city) {
          message.success(`定位成功：${city}`);
          onChange(city);
          setSearchText(city);
          setOptions([]);
        } else {
          console.error('❌ 无法从响应中提取城市信息');
          message.error('无法获取当前城市信息');
        }
      } else {
        console.error('❌ 逆地理编码API返回失败:', data);
        message.error(`地址解析失败：${data.info || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('❌ 定位失败:', error);
      if (error.response) {
        console.error('❌ API错误响应:', error.response.data);
      }
      if (error.message === '您的浏览器不支持定位功能') {
        message.error(error.message);
      } else if (error.code === 1) {
        message.error('定位权限被拒绝，请在浏览器设置中允许定位');
      } else if (error.code === 2) {
        message.error('无法获取位置信息，请检查网络连接');
      } else if (error.code === 3) {
        message.error('定位超时，请稍后重试');
      } else {
        message.error(`定位失败：${error.message || '请稍后重试'}`);
      }
    } finally {
      setLocating(false);
    }
  };

  // 使用后端缓存API搜索地点
  const handleSearch = async (searchValue: string) => {
    setSearchText(searchValue);

    if (!searchValue) {
      setOptions([]);
      return;
    }

    setSearching(true);
    try {
      // 调用后端缓存API搜索（只使用高德地图API或后端缓存）
      console.log('🔍 调用后端缓存API搜索:', searchValue);
      const response = await searchLocation(searchValue);

      console.log('📦 后端缓存API响应:', response);

      let apiResults: CityOption[] = [];
      if (response.success && response.data) {
        apiResults = response.data;
        console.log('✅ 搜索结果:', apiResults);
        if (response.fromCache) {
          console.log('✅ 结果来自缓存');
        } else {
          console.log('✅ 结果来自高德地图API');
        }
      } else {
        console.warn('⚠️  搜索失败:', response.error);
      }

      // 去重
      const uniqueOptions = apiResults.filter((item, index, self) =>
        index === self.findIndex((t) => t.value === item.value)
      );

      console.log('🎯 最终搜索结果:', uniqueOptions);
      setOptions(uniqueOptions.slice(0, 20)); // 最多显示20个结果
    } catch (error: any) {
      console.error('❌ 搜索失败:', error);
      if (error.response) {
        console.error('❌ API错误响应:', error.response.data);
      }
      // API调用失败时，不显示本地数据，只显示空结果
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearchText(selectedValue);
    setOptions([]);
  };

  const renderOption = (option: CityOption) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>{option.icon}</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
            {option.label}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            {option.province}
          </div>
        </div>
      </div>
      {option.rating && (
        <Rate
          disabled
          defaultValue={option.rating}
          style={{ fontSize: '14px' }}
        />
      )}
    </div>
  );

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#667eea' }} />
              <span style={{ fontSize: '18px', fontWeight: 600 }}>{title}</span>
            </div>
            {showLocationButton && (
              <Button
                type="primary"
                icon={locating ? <Spin size="small" /> : <EnvironmentTwoTone />}
                onClick={handleGetCurrentLocation}
                loading={locating}
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {locating ? '定位中...' : '获取当前位置'}
              </Button>
            )}
          </div>
        }
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <div>
          <AutoComplete
            value={searchText}
            options={options.map(opt => ({
              value: opt.value,
              label: renderOption(opt)
            }))}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onChange={(e) => {
              setSearchText(e as string);
              onChange(e as string);
            }}
            placeholder={placeholder}
            style={{ width: '100%' }}
            filterOption={false}
            notFoundContent={searching ? <Spin size="small" /> : '未找到相关地点'}
          >
            <Input
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              placeholder={placeholder}
              size="large"
              style={{
                height: '48px',
                fontSize: '16px'
              }}
            />
          </AutoComplete>
        </div>

        {showPopularDestinations && (
          <div style={{ marginTop: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <FireOutlined style={{ color: '#ff6b6b' }} />
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#333'
              }}>
                热门目的地
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {popularCities.slice(0, 9).map((city) => (
                <div
                  key={city.value}
                  onClick={() => handleSelect(city.value)}
                  style={{
                    padding: '16px',
                    background: '#f5f7fa',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea10';
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f7fa';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {city.icon}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '4px'
                  }}>
                    {city.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    {city.province}
                  </div>
                  {city.address && (
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '4px',
                      lineHeight: '1.4'
                    }}>
                      {city.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

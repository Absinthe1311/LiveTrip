import { useState, useEffect } from 'react';
import { AutoComplete, Card, Rate, Button, message, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined, FireOutlined, EnvironmentTwoTone } from '@ant-design/icons';
import { Input } from 'antd';
import axios from 'axios';

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
  popularCities?: CityOption[];
  showPopularDestinations?: boolean; // 是否显示热门景点推荐
  showLocationButton?: boolean; // 是否显示定位按钮
}

const POPULAR_CITIES: CityOption[] = [
  { value: '北京', label: '北京', icon: '🏛️', province: '北京市', rating: 4.8 },
  { value: '上海', label: '上海', icon: '🌃', province: '上海市', rating: 4.7 },
  { value: '广州', label: '广州', icon: '🌸', province: '广东省', rating: 4.6 },
  { value: '深圳', label: '深圳', icon: '🏙️', province: '广东省', rating: 4.7 },
  { value: '成都', label: '成都', icon: '🐼', province: '四川省', rating: 4.9 },
  { value: '杭州', label: '杭州', icon: '🏞️', province: '浙江省', rating: 4.8 },
  { value: '武汉', label: '武汉', icon: '🌊', province: '湖北省', rating: 4.7 },
  { value: '西安', label: '西安', icon: '🏔️', province: '陕西省', rating: 4.8 },
  { value: '重庆', label: '重庆', icon: '🌉', province: '重庆市', rating: 4.7 },
  { value: '南京', label: '南京', icon: '🏯', province: '江苏省', rating: 4.6 },
  { value: '厦门', label: '厦门', icon: '🏖️', province: '福建省', rating: 4.7 },
  { value: '苏州', label: '苏州', icon: '🏘️', province: '江苏省', rating: 4.8 },
  { value: '天津', label: '天津', icon: '🌉', province: '天津市', rating: 4.5 },
  { value: '长沙', label: '长沙', icon: '🌶️', province: '湖南省', rating: 4.6 },
  { value: '青岛', label: '青岛', icon: '🌊', province: '山东省', rating: 4.7 },
  { value: '大连', label: '大连', icon: '⚓', province: '辽宁省', rating: 4.6 },
  { value: '昆明', label: '昆明', icon: '🌸', province: '云南省', rating: 4.8 },
  { value: '三亚', label: '三亚', icon: '🏖️', province: '海南省', rating: 4.9 },
  { value: '桂林', label: '桂林', icon: '🏞️', province: '广西壮族自治区', rating: 4.7 },
  { value: '丽江', label: '丽江', icon: '🏔️', province: '云南省', rating: 4.8 },
  { value: '拉萨', label: '拉萨', icon: '🏔️', province: '西藏自治区', rating: 4.9 },
  { value: '哈尔滨', label: '哈尔滨', icon: '❄️', province: '黑龙江省', rating: 4.6 },
  { value: '沈阳', label: '沈阳', icon: '🏯', province: '辽宁省', rating: 4.5 },
  { value: '郑州', label: '郑州', icon: '🏯', province: '河南省', rating: 4.5 },
  { value: '济南', label: '济南', icon: '🏛️', province: '山东省', rating: 4.5 },
  { value: '合肥', label: '合肥', icon: '🏯', province: '安徽省', rating: 4.5 },
  { value: '福州', label: '福州', icon: '🌊', province: '福建省', rating: 4.5 },
  { value: '南昌', label: '南昌', icon: '🏯', province: '江西省', rating: 4.5 },
  { value: '贵阳', label: '贵阳', icon: '🌿', province: '贵州省', rating: 4.6 },
  { value: '南宁', label: '南宁', icon: '🌊', province: '广西壮族自治区', rating: 4.5 },
  { value: '太原', label: '太原', icon: '🏯', province: '山西省', rating: 4.4 },
  { value: '石家庄', label: '石家庄', icon: '🏯', province: '河北省', rating: 4.4 },
  { value: '长春', label: '长春', icon: '🌸', province: '吉林省', rating: 4.5 },
  { value: '兰州', label: '兰州', icon: '🌉', province: '甘肃省', rating: 4.5 },
  { value: '西宁', label: '西宁', icon: '🏔️', province: '青海省', rating: 4.5 },
  { value: '银川', label: '银川', icon: '🏯', province: '宁夏回族自治区', rating: 4.4 },
  { value: '乌鲁木齐', label: '乌鲁木齐', icon: '🏔️', province: '新疆维吾尔自治区', rating: 4.5 },
  { value: '呼和浩特', label: '呼和浩特', icon: '🏯', province: '内蒙古自治区', rating: 4.4 },
  { value: '海口', label: '海口', icon: '🌊', province: '海南省', rating: 4.6 },
  { value: '澳门', label: '澳门', icon: '🎰', province: '澳门特别行政区', rating: 4.7 },
  { value: '香港', label: '香港', icon: '🏙️', province: '香港特别行政区', rating: 4.8 },
  { value: '台北', label: '台北', icon: '🏯', province: '台湾省', rating: 4.7 },
];

export default function LocationSearch({
  title,
  placeholder,
  value,
  onChange,
  popularCities = POPULAR_CITIES,
  showPopularDestinations = false,
  showLocationButton = false
}: LocationSearchProps) {
  const [options, setOptions] = useState<CityOption[]>([]);
  const [searchText, setSearchText] = useState('');
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);

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

      // 调用高德地图逆地理编码API获取地址（使用Web服务API Key）
      const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
      console.log('🔑 高德地图Web服务API Key:', amapKey ? '已配置' : '未配置');

      const response = await axios.get(
        `https://restapi.amap.com/v3/geocode/regeo`,
        {
          params: {
            key: amapKey,
            location: `${longitude},${latitude}`,
            poitype: '',
            radius: 1000,
            extensions: 'base',
            batch: false,
            roadlevel: 0
          }
        }
      );

      console.log('📦 逆地理编码API响应:', response.data);

      if (response.data.status === '1' && response.data.regeocode) {
        const regeocode = response.data.regeocode;
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
        console.error('❌ 逆地理编码API返回失败:', response.data);
        message.error(`地址解析失败：${response.data.info || '未知错误'}`);
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

  // 使用高德地图API搜索地点
  const handleSearch = async (searchValue: string) => {
    setSearchText(searchValue);

    if (!searchValue) {
      setOptions([]);
      return;
    }

    setSearching(true);
    try {
      // 首先搜索本地热门城市
      const localFiltered = popularCities.filter(city =>
        city.value.includes(searchValue) ||
        city.province.includes(searchValue) ||
        city.label.includes(searchValue)
      );

      console.log('🔍 本地搜索结果:', localFiltered);

      // 调用高德地图API搜索（使用Web服务API Key）
      const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
      console.log('🔑 高德地图Web服务API Key:', amapKey ? '已配置' : '未配置');

      const response = await axios.get(
        `https://restapi.amap.com/v3/place/text`,
        {
          params: {
            key: amapKey,
            keywords: searchValue,
            citylimit: false,
            children: 1,
            offset: 20,
            page: 1,
            extensions: 'base'
          }
        }
      );

      console.log('📦 Place Text API响应:', response.data);

      let apiResults: CityOption[] = [];
      if (response.data.status === '1' && response.data.pois) {
        apiResults = response.data.pois
          .filter((poi: any) => poi.name.length <= 15) // 过滤掉太长的名称
          .map((poi: any) => ({
            value: poi.name,
            label: poi.name,
            icon: '📍',
            province: poi.address || poi.cityname || poi.adname || '',
            rating: 4.5,
            address: poi.address
          }));
        console.log('✅ API搜索结果:', apiResults);
      } else {
        console.warn('⚠️  API搜索失败:', response.data.info);
      }

      // 合并结果，优先显示本地匹配的结果
      const combinedOptions = [...localFiltered, ...apiResults];
      // 去重
      const uniqueOptions = combinedOptions.filter((item, index, self) =>
        index === self.findIndex((t) => t.value === item.value)
      );

      console.log('🎯 最终搜索结果:', uniqueOptions);
      setOptions(uniqueOptions.slice(0, 20)); // 最多显示20个结果
    } catch (error: any) {
      console.error('❌ 搜索失败:', error);
      if (error.response) {
        console.error('❌ API错误响应:', error.response.data);
      }
      // 如果API调用失败，使用本地搜索结果
      const filtered = popularCities.filter(city =>
        city.value.includes(searchValue) ||
        city.province.includes(searchValue) ||
        city.label.includes(searchValue)
      );
      setOptions(filtered);
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
          <div style={{ fontSize: '12px', color: '#999' }}>
            {option.province}
          </div>
        </div>
      </div>
      <Rate disabled value={option.rating} style={{ fontSize: '12px' }} />
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
      </Card>

      {/* 热门景点推荐 - 仅在目的地输入框下方显示 */}
      {showPopularDestinations && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
              热门景点推荐
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {POPULAR_CITIES.slice(0, 9).map((city) => (
              <Card
                key={city.value}
                hoverable
                size="small"
                onClick={() => handleSelect(city.value)}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                bodyStyle={{
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)';
                }}
              >
                <span style={{ fontSize: '32px' }}>{city.icon}</span>
                <div style={{ flex: 1 }}>
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
                </div>
                <Rate disabled value={city.rating} style={{ fontSize: '12px' }} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

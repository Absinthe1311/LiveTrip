// 地点输入组件 - 自定义样式
import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, Star } from 'lucide-react';

interface LocationInputProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showLocationButton?: boolean;
  showPopularDestinations?: boolean;
}

const POPULAR_CITIES = [
  { value: '北京', icon: '🏛️', province: '北京' },
  { value: '上海', icon: '🌃', province: '上海' },
  { value: '广州', icon: '🌸', province: '广东' },
  { value: '深圳', icon: '🏙️', province: '广东' },
  { value: '成都', icon: '🐼', province: '四川' },
  { value: '杭州', icon: '🏞️', province: '浙江' },
  { value: '武汉', icon: '🌊', province: '湖北' },
  { value: '西安', icon: '🏔️', province: '陕西' },
];

const POPULAR_DESTINATIONS = [
  { value: '北京', icon: '🏛️', province: '北京', desc: '历史文化名城' },
  { value: '上海', icon: '🌃', province: '上海', desc: '国际化大都市' },
  { value: '成都', icon: '🐼', province: '四川', desc: '美食之都' },
  { value: '三亚', icon: '🏖️', province: '海南', desc: '热带海滨城市' },
  { value: '西安', icon: '🏔️', province: '陕西', desc: '古都长安' },
  { value: '丽江', icon: '🏔️', province: '云南', desc: '古城风情' },
  { value: '桂林', icon: '⛰️', province: '广西', desc: '山水甲天下' },
  { value: '厦门', icon: '🌊', province: '福建', desc: '海上花园城市' },
];

export default function LocationInput({
  title,
  placeholder,
  value,
  onChange,
  showLocationButton = false,
  showPopularDestinations = false,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    try {
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

      // 调用高德地图逆地理编码API
      const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${longitude},${latitude}&extensions=base`
      );
      const data = await response.json();

      if (data.status === '1' && data.regeocode) {
        const addressComponent = data.regeocode.addressComponent;
        const city = addressComponent.city || addressComponent.province;
        console.log('✅ 定位成功:', city);
        setInputValue(city);
        onChange(city);
      } else {
        throw new Error('定位失败');
      }
    } catch (error: any) {
      console.error('❌ 定位失败:', error);
      alert(error.message || '定位失败，请手动输入');
    } finally {
      setLocating(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setInputValue(city);
    onChange(city);
  };

  const popularCities = showPopularDestinations ? POPULAR_DESTINATIONS : POPULAR_CITIES;

  return (
    <div>
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      {/* 输入框 */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-4 rounded-lg border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* 定位按钮 */}
      {showLocationButton && (
        <button
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="w-full h-11 rounded-lg border border-dashed border-primary bg-primary/5 text-primary text-[15px] font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
        >
          <Navigation className="h-5 w-5" />
          {locating ? '定位中...' : '使用当前位置'}
        </button>
      )}

      {/* 热门城市 */}
      <div>
        <p className="text-[13px] text-muted-foreground mb-3">
          {showPopularDestinations ? '热门目的地' : '热门城市'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {popularCities.map((city) => (
            <button
              key={city.value}
              onClick={() => handleSelectCity(city.value)}
              className={`p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${
                inputValue === city.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{city.icon}</span>
                <span className="text-[15px] font-medium text-foreground">{city.value}</span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                {'desc' in city ? (city as any).desc : city.province}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

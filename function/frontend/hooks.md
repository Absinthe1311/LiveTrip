# frontend/src/hooks 函数列表

## useSocket.ts

### Hooks
- `useSocket` - Socket.io Hook，提供WebSocket连接

---

## useCollabMap.ts

### Hooks
- `useCollabMap` - 协同规划地图Hook，封装高德地图操作

#### 返回方法
- `addSpotMarker` - 添加景点标记
- `updateSpotMarkerStyle` - 更新景点标记样式
- `removeSpotMarker` - 移除景点标记
- `clearAllMarkers` - 清除所有标记
- `drawRoute` - 绘制路线
- `clearRoute` - 清除路线
- `setMapCenter` - 设置地图中心
- `setMapZoom` - 设置缩放级别
- `setCityWithBoundary` - 设置城市边界
- `showSpotStats` - 显示景点统计
- `hideSpotStats` - 隐藏景点统计
- `highlightSpots` - 高亮景点

---

## useHomepageData.ts

### Hooks
- `useHomepageData` - Homepage数据管理Hook，统一管理首页所有数据获取

#### 内部函数
- `fetchUserTrips` - 获取用户行程列表
- `fetchPackingList` - 获取行李清单
- `fetchPackingProgress` - 获取打包进度
- `fetchWeatherData` - 获取天气数据
- `fetchBudgetData` - 获取预算数据
- `init` - 初始化数据
- `togglePacked` - 切换打包状态
- `calculateFootprintCities` - 计算足迹城市
- `fetchHotDestinations` - 获取热门目的地
- `search` - 搜索功能
- `changeCity` - 切换城市

#### 返回状态
- `packingItems` - 行李清单
- `packingProgress` - 打包进度
- `weatherData` - 天气数据
- `budgetData` - 预算数据
- `tripStats` - 行程统计
- `upcomingTrips` - 即将出行的行程
- `tripDates` - 行程日期
- `footprintCities` - 足迹城市
- `hotDestinations` - 热门目的地
- `searchResults` - 搜索结果

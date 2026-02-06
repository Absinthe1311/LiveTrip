# 双API Key配置修复文档

## 问题分析

### 问题背景

您申请了两个高德地图API Key：

**LiveTrip前端（Web端JS API）：**
- Key值：`5aa4452b6edcdfe37ddb7aedd936f827`
- 安全密钥：`ee9b5d0bd5c9386503919133087904c9`
- 类型：Web端（JS API）

**LiveTrip后端（Web服务）：**
- Key值：`b1f81dde480fbb6e2db41fa37940b35f`
- 安全密钥：未设置
- 类型：Web服务

### 问题原因

之前的修改将前端的所有API调用都改为了使用后端的Web服务API Key，导致：

1. **定位功能** ✅ 正常工作（使用Web服务API Key）
2. **搜索功能** ✅ 正常工作（使用Web服务API Key）
3. **地图显示功能** ❌ 无法工作（需要使用Web端JS API Key）

**原因：**
- 地图显示功能使用的是`@amap/amap-jsapi-loader`加载的高德地图JS API
- JS API必须使用Web端（JS API）类型的Key
- Web端JS API Key需要配置安全密钥
- 使用错误的Key类型会导致地图无法加载

---

## 解决方案

### 配置策略

前端需要同时支持两个API Key：

1. **VITE_AMAP_WS_KEY**：Web服务API Key
   - 用于：定位功能、搜索功能
   - Key：`b1f81dde480fbb6e2db41fa37940b35f`

2. **VITE_AMAP_JS_KEY**：Web端JS API Key
   - 用于：地图显示功能
   - Key：`5aa4452b6edcdfe37ddb7aedd936f827`
   - 安全密钥：`ee9b5d0bd5c9386503919133087904c9`

### 修改的文件

#### 1. `frontend/.env`

**修改内容：**
```env
# 高德地图 Key
# Web服务API Key（用于定位、搜索等功能）
VITE_AMAP_WS_KEY=b1f81dde480fbb6e2db41fa37940b35f
# Web端JS API Key（用于地图显示功能）
VITE_AMAP_JS_KEY=5aa4452b6edcdfe37ddb7aedd936f827
# Web端JS API 安全密钥
VITE_AMAP_JS_SECRET=ee9b5d0bd5c9386503919133087904c9

# 后端 API 地址
VITE_API_BASE_URL=http://localhost:3003/api
```

#### 2. `frontend/src/components/LocationSearch.tsx`

**修改位置1：定位功能**
```typescript
// 调用高德地图逆地理编码API获取地址（使用Web服务API Key）
const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
console.log('🔑 高德地图Web服务API Key:', amapKey ? '已配置' : '未配置');
```

**修改位置2：搜索功能**
```typescript
// 调用高德地图API搜索（使用Web服务API Key）
const amapKey = import.meta.env.VITE_AMAP_WS_KEY;
console.log('🔑 高德地图Web服务API Key:', amapKey ? '已配置' : '未配置');
```

#### 3. `frontend/src/pages/Itinerary.tsx`

**修改位置：地图显示功能**
```typescript
// 地图组件
function DayMap({ day }: { day: any }) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const polylinesRef = React.useRef<any[]>([]);
  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  useEffect(() => {
    if (!mapContainer.current || !amapKey || !day || !day.attractions) return;

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      // ...
    });
  }, [day, amapKey]);
}
```

---

## 功能说明

### 1. 定位功能

**使用的API Key：** `VITE_AMAP_WS_KEY`（Web服务API Key）

**API端点：**
```
GET https://restapi.amap.com/v3/geocode/regeo
```

**功能描述：**
- 使用浏览器Geolocation API获取用户当前经纬度
- 调用高德地图逆地理编码API将经纬度转换为城市名称
- 自动填入到出发地输入框

### 2. 搜索功能

**使用的API Key：** `VITE_AMAP_WS_KEY`（Web服务API Key）

**API端点：**
```
GET https://restapi.amap.com/v3/place/text
```

**功能描述：**
- 用户输入地名时，实时调用高德地图POI搜索API
- 返回匹配的地点列表
- 用户可以选择地点并填入输入框

### 3. 地图显示功能

**使用的API Key：** `VITE_AMAP_JS_KEY`（Web端JS API Key）
**安全密钥：** `VITE_AMAP_JS_SECRET`

**功能描述：**
- 使用`@amap/amap-jsapi-loader`加载高德地图JS API
- 在行程页面显示每日行程的地图
- 显示景点标记、路线等信息

---

## 测试步骤

### 1. 测试定位功能

**操作步骤：**
1. 打开浏览器，访问 http://localhost:5175
2. 点击"开始规划"按钮
3. 点击"获取当前位置"按钮
4. 允许浏览器定位权限
5. 查看控制台日志
6. 查看是否成功定位

**预期结果：**
```
🔑 高德地图Web服务API Key: 已配置
📍 获取到当前坐标: 27.82995979276491 114.9534303005302
📦 逆地理编码API响应: {status: "1", regeocode: {...}}
🏙️ 逆地理编码结果: {...}
📍 地址组件: {...}
✅ 最终获取的城市: 新余市
```

**页面显示：**
- ✅ 成功提示："定位成功：新余市"
- ✅ 出发地输入框自动填入"新余市"

### 2. 测试搜索功能

**操作步骤：**
1. 在出发地或目的地输入框中输入"新余"
2. 查看控制台日志
3. 查看是否显示候选结果

**预期结果：**
```
🔍 本地搜索结果: []
🔑 高德地图Web服务API Key: 已配置
📦 Place Text API响应: {status: "1", pois: [...]}
✅ API搜索结果: [{value: '新余市', ...}, ...]
🎯 最终搜索结果: [...]
```

**页面显示：**
- ✅ 输入框下方显示候选列表
- ✅ 包含"新余市"等地点
- ✅ 点击候选结果可以填入

### 3. 测试地图显示功能

**操作步骤：**
1. 完成行程规划（可以快速填写信息并生成）
2. 进入行程页面
3. 找到任意一天的行程
4. 点击"查看地图"按钮
5. 查看右侧是否显示地图

**预期结果：**
- ✅ 右侧显示地图
- ✅ 地图上显示景点标记（紫色圆形，编号1,2,3...）
- ✅ 地图上显示路线（紫色线条）
- ✅ 地图可以缩放和拖动
- ✅ 点击标记显示景点信息窗口

**控制台日志：**
不应该看到地图加载失败的错误。

### 4. 完整流程测试

**操作步骤：**
1. 点击"获取当前位置"获取出发地
2. 点击"下一步"按钮
3. 搜索并选择目的地（如"北京"）
4. 选择日期（可以快速选择）
5. 选择预算
6. 选择偏好
7. 点击"生成行程"
8. 等待行程生成完成
9. 进入行程页面
10. 点击"查看地图"按钮

**预期结果：**
- ✅ 定位功能正常
- ✅ 搜索功能正常
- ✅ 行程生成成功
- ✅ 地图显示正常

---

## 常见问题

### Q1: 地图显示为空白

**可能原因：**
1. JS API Key配置错误
2. 安全密钥配置错误
3. 网络连接问题
4. Key配额用完

**解决方法：**
1. 检查`frontend/.env`中的`VITE_AMAP_JS_KEY`是否正确
2. 检查`VITE_AMAP_JS_SECRET`是否正确
3. 检查网络连接
4. 查看控制台是否有错误信息

### Q2: 定位功能失败

**可能原因：**
1. Web服务API Key配置错误
2. 网络连接问题
3. 浏览器定位权限被拒绝

**解决方法：**
1. 检查`frontend/.env`中的`VITE_AMAP_WS_KEY`是否正确
2. 检查网络连接
3. 允许浏览器定位权限

### Q3: 搜索功能失败

**可能原因：**
1. Web服务API Key配置错误
2. 网络连接问题
3. 搜索关键词过于具体

**解决方法：**
1. 检查`frontend/.env`中的`VITE_AMAP_WS_KEY`是否正确
2. 检查网络连接
3. 使用更通用的关键词

### Q4: 如何验证API Key是否正确？

**方法1：检查控制台日志**
```
🔑 高德地图Web服务API Key: 已配置
```
如果显示"未配置"，说明环境变量未正确加载。

**方法2：直接测试API**
```bash
# 测试Web服务API
curl "https://restapi.amap.com/v3/geocode/regeo?key=b1f81dde480fbb6e2db41fa37940b35f&location=114.9534303005302,27.82995979276491"
```

### Q5: 修改.env后需要重启服务器吗？

**是的，必须重启！**

修改`.env`文件后，必须重启前端服务器才能使新的环境变量生效：

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
cd frontend
npm run dev
```

---

## API Key配置总结

### 前端配置（frontend/.env）

```env
# Web服务API Key（用于定位、搜索）
VITE_AMAP_WS_KEY=b1f81dde480fbb6e2db41fa37940b35f

# Web端JS API Key（用于地图显示）
VITE_AMAP_JS_KEY=5aa4452b6edcdfe37ddb7aedd936f827

# Web端JS API 安全密钥
VITE_AMAP_JS_SECRET=ee9b5d0bd5c9386503919133087904c9
```

### 后端配置（backend/.env）

```env
# Web服务API Key（后端使用）
AMAP_API_KEY=b1f81dde480fbb6e2db41fa37940b35f
```

### 功能对应关系

| 功能 | 使用的Key类型 | 环境变量 | Key值 |
|------|--------------|---------|-------|
| 定位功能 | Web服务API | VITE_AMAP_WS_KEY | b1f81dde480fbb6e2db41fa37940b35f |
| 搜索功能 | Web服务API | VITE_AMAP_WS_KEY | b1f81dde480fbb6e2db41fa37940b35f |
| 地图显示 | Web端JS API | VITE_AMAP_JS_KEY | 5aa4452b6edcdfe37ddb7aedd936f827 |
| 地图安全密钥 | Web端JS API | VITE_AMAP_JS_SECRET | ee9b5d0bd5c9386503919133087904c9 |

---

## 安全密钥说明

### 什么是安全密钥？

安全密钥是高德地图为保护API Key而提供的一种安全机制。

### 为什么要使用安全密钥？

1. **防止Key泄露**：即使前端代码被泄露，没有安全密钥也无法滥用API
2. **防止盗用**：安全密钥可以验证调用来源的合法性
3. **配额保护**：可以更好地控制API调用次数

### 如何配置安全密钥？

1. 在高德开放平台创建应用时，会生成安全密钥
2. 将安全密钥配置到前端环境变量
3. 在加载地图JS API之前，设置安全密钥配置：

```javascript
window._AMapSecurityConfig = {
  securityJsCode: '您的安全密钥',
};
```

### 注意事项

1. 安全密钥不要提交到公开的代码仓库
2. 使用环境变量存储安全密钥
3. 定期更换安全密钥

---

## 总结

### 问题根源
前端需要使用两种不同的API Key：
- Web服务API Key：用于定位和搜索功能
- Web端JS API Key：用于地图显示功能

### 解决方案
1. ✅ 修改`.env`文件，配置两个API Key
2. ✅ 修改LocationSearch组件，使用Web服务API Key
3. ✅ 修改Itinerary组件，使用Web端JS API Key和安全密钥

### 已完成的修复
- ✅ 配置文件修改完成
- ✅ LocationSearch组件修改完成
- ✅ Itinerary组件修改完成
- ✅ 前端服务器已重启

### 下一步操作
1. 🔄 访问新的前端地址：http://localhost:5175
2. 🧪 测试定位功能
3. 🧪 测试搜索功能
4. 🧪 测试地图显示功能
5. ✅ 确认所有功能正常工作

### 服务器信息
- 前端服务器：http://localhost:5175
- 后端服务器：http://localhost:3003

---

**现在请访问 http://localhost:5175 并测试所有功能！** 🚀

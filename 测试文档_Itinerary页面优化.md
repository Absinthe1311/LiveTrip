# Itinerary页面优化测试文档

## 修改概述

本次修改解决了Itinerary页面（规划页面）的两个问题：

### 问题1：删除出发地和目的地的提示词
- **原问题**：出发地和目的地输入框的placeholder中显示"例如：上海、广州、深圳"和"例如：北京、云南、日本东京"的提示词
- **解决方案**：将placeholder设置为空字符串，移除这些提示词

### 问题2：在目的地输入框下方添加热门景点推荐
- **原问题**：目的地输入框缺乏热门景点推荐
- **解决方案**：在LocationSearch组件中添加热门景点推荐卡片，仅在目的地输入框下方显示

## 修改的文件

### 1. `frontend/src/components/LocationSearch.tsx`

**修改内容：**
1. 添加了`showPopularDestinations`属性到`LocationSearchProps`接口
2. 在组件返回的JSX中添加了热门景点推荐卡片
3. 添加了`FireOutlined`图标的导入

**关键代码：**
```typescript
interface LocationSearchProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  popularCities?: CityOption[];
  showPopularDestinations?: boolean; // 新增属性
}

// 热门景点推荐卡片
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
      {POPULAR_CITIES.slice(0, 8).map((city) => (
        <Card
          key={city.value}
          hoverable
          size="small"
          onClick={() => handleSelect(city.value)}
          // ... 卡片样式和内容
        >
          {/* 城市图标、名称、省份、评分 */}
        </Card>
      ))}
    </div>
  </div>
)}
```

### 2. `frontend/src/pages/Plan.tsx`

**修改内容：**
1. 将出发地输入框的placeholder从"例如：上海、广州、深圳"改为空字符串
2. 将目的地输入框的placeholder从"例如：北京、云南、日本东京"改为空字符串
3. 为目的地输入框添加`showPopularDestinations={true}`属性

**关键代码：**
```typescript
case 0:
  return (
    <LocationSearch
      title="出发地"
      placeholder=""  // 修改前: "例如：上海、广州、深圳"
      value={formData.origin}
      onChange={(value) => setFormData({ ...formData, origin: value })}
    />
  );
case 1:
  return (
    <LocationSearch
      title="目的地"
      placeholder=""  // 修改前: "例如：北京、云南、日本东京"
      value={formData.destination}
      onChange={(value) => setFormData({ ...formData, destination: value })}
      showPopularDestinations={true}  // 新增
    />
  );
```

## 功能说明

### 1. 删除提示词
- 出发地和目的地输入框的placeholder现在为空
- 输入框更加简洁，不会显示多余的提示信息

### 2. 热门景点推荐
- 仅在目的地输入框下方显示
- 显示8个热门城市（北京、上海、广州、深圳、成都、杭州、武汉、西安）
- 每个卡片包含：
  - 城市图标（emoji）
  - 城市名称
  - 所属省份
  - 评分（星级）
- 点击卡片会自动填入城市名称
- 卡片有悬停效果（上移+阴影增强）

## 测试步骤

### 1. 启动应用
```bash
cd frontend
npm run dev
```
访问 http://localhost:5173

### 2. 测试出发地输入框
1. 点击"开始规划"按钮
2. 查看第一步"出发地"输入框
3. **预期结果**：输入框的placeholder为空，不显示任何提示词

### 3. 测试目的地输入框
1. 点击"下一步"按钮
2. 查看第二步"目的地"输入框
3. **预期结果**：
   - 输入框的placeholder为空，不显示任何提示词
   - 输入框下方显示"热门景点推荐"标题
   - 显示8个热门城市卡片

### 4. 测试热门景点推荐卡片
1. 点击任意一个热门城市卡片（如"北京"）
2. **预期结果**：
   - 输入框自动填入"北京"
   - 可以继续进行下一步操作
3. 测试悬停效果：
   - 鼠标悬停在卡片上
   - **预期结果**：卡片上移，阴影增强

### 5. 测试搜索功能
1. 在目的地输入框中输入"北"
2. **预期结果**：显示匹配的城市列表（北京、北海等）
3. 点击搜索结果中的城市
4. **预期结果**：输入框填入选中的城市

### 6. 完整流程测试
1. 填写出发地（如"上海"）
2. 填写目的地（点击热门景点推荐中的"北京"）
3. 选择日期
4. 选择预算
5. 选择偏好
6. 点击"生成行程"
7. **预期结果**：成功生成行程并跳转到行程页面

## 视觉效果

### 热门景点推荐卡片
- 布局：网格布局，自适应列宽（最小200px）
- 卡片样式：圆角、阴影、悬停效果
- 内容：
  - 左侧：城市图标（32px emoji）
  - 中间：城市名称（16px，加粗）+ 省份（12px，灰色）
  - 右侧：评分（12px星级）
- 标题：火焰图标 + "热门景点推荐"（16px，加粗）

### 颜色方案
- 火焰图标：#ff4d4f（红色）
- 标题文字：#333（深灰）
- 省份文字：#999（浅灰）
- 卡片阴影：rgba(0,0,0,0.1)
- 悬停阴影：rgba(0,0,0,0.15)

## 兼容性

- **浏览器**：支持现代浏览器（Chrome、Firefox、Safari、Edge）
- **响应式**：卡片布局自适应，在不同屏幕尺寸下正常显示
- **交互**：支持点击和悬停效果

## 注意事项

1. **仅目的地显示**：热门景点推荐仅在目的地输入框下方显示，出发地输入框不显示
2. **点击优先级**：点击热门景点推荐卡片会直接填入城市，优先于搜索功能
3. **数据来源**：热门景点数据来自`POPULAR_CITIES`数组，显示前8个城市
4. **样式一致性**：卡片样式与整体设计风格保持一致

## 后续优化建议

1. **动态加载**：可以根据用户的出发地，动态推荐附近的热门景点
2. **个性化推荐**：根据用户的历史行程和偏好，个性化推荐景点
3. **更多景点**：可以增加显示的热门景点数量
4. **分类推荐**：可以按类型分类（如历史文化、自然风光、美食等）
5. **图片展示**：可以添加景点图片，提升视觉效果

## 测试结果

### ✅ 通过的测试
- [x] 出发地输入框placeholder为空
- [x] 目的地输入框placeholder为空
- [x] 目的地输入框下方显示热门景点推荐
- [x] 点击热门景点卡片可以填入城市
- [x] 热门景点卡片有悬停效果
- [x] 搜索功能正常工作
- [x] 完整流程测试通过

### ⚠️ 注意事项
- 无已知问题

## 总结

本次修改成功解决了Itinerary页面的两个问题：
1. ✅ 删除了出发地和目的地的提示词
2. ✅ 在目的地输入框下方添加了热门景点推荐功能

修改遵循了项目的设计风格，代码结构清晰，功能完整，用户体验良好。

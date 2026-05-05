# frontend/src/utils 函数列表

## auth.ts

### 函数
- `getUserId` - 获取用户ID
- `getToken` - 获取Token

---

## cacheManager.ts

### 类 CacheManager
- `set` - 设置缓存
- `get` - 获取缓存
- `has` - 检查缓存是否存在
- `delete` - 删除缓存
- `clear` - 清空所有缓存

### 导出实例
- `cacheManager` - CacheManager单例实例

---

## blogContentUtils.ts

### 函数
- `extractFirstImage` - 从HTML内容中提取第一张图片URL
- `calculateWordCount` - 计算HTML内容的纯文本字数
- `calculateReadingTime` - 计算预计阅读时间
- `formatReadingTime` - 格式化阅读时间显示
- `generateExcerpt` - 生成博客摘要

---

## exportPDF.ts

### 函数
- `exportBlogToPDF` - 将Markdown内容转换为PDF

---

## mapScreenshot.ts

### 函数
- `generateDayMapScreenshot` - 生成单日地图截图
- `generateMapScreenshot` - 生成完整行程地图截图
- `createLegend` (private) - 创建图例
- `adjustColor` (private) - 调整颜色亮度
- `extractLocationsFromDays` - 从行程数据中提取所有地点坐标

### 常量
- `DAY_COLORS` - 每天颜色配置
- `HOTEL_COLOR` - 酒店颜色
- `RESTAURANT_COLOR` - 餐厅颜色

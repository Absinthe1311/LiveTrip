# Backend Scripts 使用说明

## 常用脚本

### 1. createAdmin.ts - 创建管理员账号
```bash
npx ts-node scripts/createAdmin.ts
```
创建管理员账号（用户名: 666, 密码: 666666）

### 2. seedHotSpots.ts - 预热热门景点数据
```bash
npx ts-node scripts/seedHotSpots.ts
```
将前端硬编码的热门景点数据存入数据库，标记为 isHot

### 3. preloadCitySpots.ts - 预热城市景点数据
```bash
npx ts-node scripts/preloadCitySpots.ts
```
从高德API获取热门城市的景点数据并存储到数据库

### 4. generateSearchKeywords.ts - 生成图片检索关键字
```bash
npx ts-node scripts/generateSearchKeywords.ts
```
生成景点图片检索关键字Markdown文件

## 一次性脚本（已执行完成）

### markHotSpots.ts
标记热门景点（已被 seedHotSpots.ts 替代）

## 注意事项

- 运行脚本前确保数据库已初始化
- 运行脚本前确保环境变量已配置
- 部分脚本需要高德API Key

# 数据库锁定问题排查和解决方案

## 🔍 问题分析

### 问题现象
执行 `npx prisma migrate dev` 时出现以下错误：
```
Error: SQLite database error
database is locked
```

### 根本原因
1. **多个进程同时访问数据库**：
   - 进程 21088: nodemon 正在运行后端服务
   - 进程 24340: npm run prisma:migrate（之前失败的进程）
   - 进程 28932: prisma migrate（当前正在运行的进程）

2. **SQLite 临时日志文件未清理**：
   - 存在 `dev.db-journal` 文件
   - 这表明之前的迁移操作被中断
   - SQLite 在事务未完成时会创建这个文件

## 🛠️ 解决步骤

### 步骤 1：查找占用数据库的进程
```powershell
# 查看所有 Node 进程
Get-Process node

# 查看进程详细信息（包括命令行）
Get-WmiObject Win32_Process | Where-Object {$_.Name -eq "node.exe"} | Select-Object ProcessId, CommandLine
```

### 步骤 2：终止占用数据库的进程
```powershell
# 终止所有占用数据库的 Node 进程
Stop-Process -Id 21088,24340,28932 -Force
```

### 步骤 3：清理数据库日志文件
```powershell
# 删除 SQLite 临时日志文件
Remove-Item d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db-journal -Force
```

### 步骤 4：执行数据库迁移
```powershell
cd d:/CodeArtsFile/LiveTrip/backend
npx prisma migrate dev --name add_weather_fields
```

### 步骤 5：验证迁移结果
```powershell
# 使用验证脚本
npx ts-node scripts/verify-migration.ts

# 或者直接查看表结构
npx prisma studio
```

## ✅ 验证结果

### 数据库表结构
```
┌─────────┬─────┬──────────────────────┬────────────┬─────────┬─────────────────────┬────┐
│ (index) │ cid │ name                 │ type       │ notnull │ dflt_value          │ pk │
├─────────┼─────┼──────────────────────┼────────────┼─────────┼─────────────────────┼────┤
│ 0       │ 0n  │ 'id'                 │ 'TEXT'     │ 1n      │ null                │ 1n │
│ 1       │ 1n  │ 'spotId'             │ 'TEXT'     │ 1n      │ null                │ 0n │
│ 2       │ 2n  │ 'crowdLevel'         │ 'REAL'     │ 1n      │ null                │ 0n │
│ 3       │ 3n  │ 'temperature'        │ 'REAL'     │ 1n      │ null                │ 0n │
│ 4       │ 4n  │ 'rainProbability'    │ 'REAL'     │ 1n      │ null                │ 0n │
│ 5       │ 5n  │ 'isOpen'             │ 'BOOLEAN'  │ 1n      │ null                │ 0n │
│ 6       │ 6n  │ 'generatedAt'        │ 'DATETIME' │ 1n      │ 'CURRENT_TIMESTAMP' │ 0n │
│ 7       │ 7n  │ 'updatedAt'          │ 'DATETIME' │ 1n      │ null                │ 0n │
│ 8       │ 8n  │ 'weatherDescription' │ 'TEXT'     │ 0n      │ "''"                │ 0n │
│ 9       │ 9n  │ 'weatherIcon'        │ 'TEXT'     │ 0n      │ "''"                │ 0n │
│ 10      │ 10n │ 'weatherUpdatedAt'   │ 'DATETIME' │ 0n      │ null                │ 0n │
└─────────┴─────┴──────────────────────┴────────────┴─────────┴─────────────────────┴────┘
```

### 新字段验证
- ✅ weatherDescription: 存在
- ✅ weatherIcon: 存在
- ✅ weatherUpdatedAt: 存在

### 天气服务测试
```
🧪 开始测试天气服务...
📍 测试景点: 外滩 (cmn5k03fy0000nub0v1xiutug)
   坐标: 121.492127,31.233516
🌤️  从 OpenWeatherMap 获取天气数据: cmn5k03fy0000nub0v1xiutug
✅ 天气数据获取成功:
   温度: 17°C
   湿度: 45%
   降雨概率: 4%
   天气描述: 晴
   天气图标: 01d
   更新时间: Thu Mar 26 2026 14:52:19 GMT+0800 (中国标准时间)
🎉 测试完成！
```

## 📋 预防措施

### 1. 执行迁移前检查
```powershell
# 检查是否有 Node 进程在运行
Get-Process node

# 检查是否有数据库日志文件
Get-ChildItem d:/CodeArtsFile/LiveTrip/backend/prisma/ | Where-Object {$_.Name -like "*.db*"}
```

### 2. 执行迁移前的准备
```powershell
# 1. 停止所有开发服务器
# 2. 终止所有 Node 进程
Stop-Process -Name node -Force

# 3. 清理数据库日志文件（如果存在）
Remove-Item d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db-journal -Force -ErrorAction SilentlyContinue

# 4. 执行迁移
npx prisma migrate dev --name your_migration_name
```

### 3. 使用 Prisma Studio 检查
```powershell
npx prisma studio
```
这将打开一个可视化界面来检查数据库结构和数据。

## 🔧 常见问题

### Q1: 为什么会出现数据库锁定？
**A**: SQLite 是文件级数据库，同一时间只能有一个进程写入。如果多个进程尝试同时写入，就会出现锁定错误。

### Q2: dev.db-journal 文件是什么？
**A**: 这是 SQLite 的临时日志文件，用于在事务期间记录更改。如果事务正常完成，这个文件会被自动删除。如果文件存在，说明之前的操作被中断了。

### Q3: 如何避免这个问题？
**A**:
1. 执行迁移前确保没有开发服务器在运行
2. 不要在多个终端同时运行迁移命令
3. 如果迁移失败，先清理日志文件再重试

### Q4: 迁移失败后数据会丢失吗？
**A**: 不会。迁移失败会回滚，数据库会保持原来的状态。但建议在执行重要迁移前备份数据库。

### Q5: 如果迁移一直失败怎么办？
**A**:
1. 终止所有 Node 进程
2. 删除 `dev.db-journal` 文件
3. 使用 `npx prisma db push` 作为备选方案（不创建迁移文件，直接同步结构）
4. 如果还是失败，可以考虑删除数据库重新初始化（会丢失数据）

## 📝 相关命令

### 检查数据库状态
```powershell
# 查看数据库文件
Get-ChildItem d:/CodeArtsFile/LiveTrip/backend/prisma/*.db*

# 查看表结构
npx prisma db pull
npx prisma studio
```

### 备份和恢复
```powershell
# 备份数据库
Copy-Item d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db.backup

# 恢复数据库
Copy-Item d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db.backup d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db -Force
```

### 重置数据库（慎用）
```powershell
# 删除所有数据并重新同步
npx prisma migrate reset

# 或者直接删除数据库文件
Remove-Item d:/CodeArtsFile/LiveTrip/backend/prisma/dev.db -Force
npx prisma migrate dev --name init
```

## 🎯 总结

数据库锁定问题通常由以下原因引起：
1. 多个进程同时访问数据库
2. 之前的操作被中断，留下临时日志文件
3. SQLite 的单写入限制

解决方法：
1. 终止所有占用数据库的进程
2. 清理临时日志文件
3. 重新执行迁移

预防措施：
1. 执行迁移前停止所有开发服务器
2. 不要在多个终端同时运行迁移
3. 定期检查和清理数据库文件

---

**问题解决时间**：2026-03-26
**解决人员**：CodeArts 代码智能体

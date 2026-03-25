# LiveTrip 数据备份与恢复指南

## 📖 目录

- [概述](#概述)
- [备份策略](#备份策略)
- [自动备份](#自动备份)
- [手动备份](#手动备份)
- [数据恢复](#数据恢复)
- [备份文件管理](#备份文件管理)
- [常见问题](#常见问题)

---

## 概述

LiveTrip 使用 SQLite 数据库存储所有数据，包括用户信息、行程数据、景点信息、博客文章等。为了确保数据安全，系统提供了完整的备份和恢复机制。

### 备份内容

备份包含以下所有表的数据：
- User（用户）
- UserPreferences（用户偏好）
- Trip（行程）
- Day（行程天数）
- ItineraryItem（行程项目）
- Budget（预算）
- PackingItem（打包清单）
- Spot（景点）
- SpotIoTData（景点IoT数据）
- SpotImage（景点图片）
- Review（评价）
- BlogPost（博客文章）
- BlogComment（博客评论）
- Favorite（收藏）
- Hotel（酒店）
- Restaurant（餐厅）
- 以及其他相关表

---

## 备份策略

### 推荐备份时机

1. **定期自动备份**：每天自动备份一次
2. **重要操作前**：在执行数据库迁移、清空数据等操作前
3. **手动触发**：在完成重要工作后手动备份

### 备份保留策略

- 自动保留最近 **7天** 的备份文件
- 超过7天的备份文件会被自动清理
- 重要备份可以手动复制到其他位置长期保存

---

## 自动备份

### 设置定时备份（推荐）

使用 `node-cron` 设置定时任务，每天自动备份数据库。

#### 1. 创建定时备份脚本

在 `backend/src/scripts/scheduled-backup.ts` 创建定时备份脚本：

```typescript
import cron from 'node-cron';
import { backupDatabase } from '../scripts/backup-db';

// 每天凌晨2点自动备份
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 开始执行定时备份...');
  try {
    await backupDatabase();
    console.log('✅ 定时备份完成');
  } catch (error) {
    console.error('❌ 定时备份失败:', error);
  }
});

console.log('✅ 定时备份任务已启动，每天凌晨2点执行');
```

#### 2. 在后端启动时运行

在 `backend/src/index.ts` 中添加：

```typescript
import scheduledBackup from './scripts/scheduled-backup';

// 启动定时备份任务
scheduledBackup();
```

---

## 手动备份

### 方法1：使用 npm 命令（推荐）

```bash
cd backend
npm run backup:db
```

### 方法2：直接运行脚本

```bash
cd backend
npx ts-node scripts/backup-db.ts
```

### 备份文件位置

备份文件保存在 `backend/backups/` 目录下，文件名格式为：
```
backup_YYYY-MM-DD_HH-MM-SS.json
```

示例：
```
backup_2026-03-25_18-30-00.json
```

### 备份文件格式

备份文件为 JSON 格式，包含以下结构：

```json
{
  "version": "1.0.0",
  "timestamp": "2026-03-25T10:30:00.000Z",
  "tables": {
    "User": [...],
    "Trip": [...],
    "Day": [...],
    ...
  }
}
```

---

## 数据恢复

### 方法1：使用 npm 命令（推荐）

#### 列出所有备份文件

```bash
cd backend
npm run restore:db -- --list
```

#### 恢复所有数据

```bash
cd backend
npm run restore:db -- backups/backup_2026-03-25_18-30-00.json
```

#### 恢复指定表

```bash
cd backend
npm run restore:db -- backups/backup_2026-03-25_18-30-00.json User,Trip,Day
```

### 方法2：直接运行脚本

```bash
cd backend
npx ts-node scripts/restore-db.ts backups/backup_2026-03-25_18-30-00.json
```

### 恢复注意事项

⚠️ **重要提示**：

1. **恢复前备份**：恢复数据前会自动备份当前数据库
2. **表覆盖**：恢复会覆盖指定表的现有数据
3. **外键约束**：如果恢复的表之间有外键关系，需要按正确顺序恢复
4. **服务停止**：建议在恢复前停止后端服务

### 推荐的恢复顺序

如果需要恢复所有表，建议按以下顺序：

1. User（用户）
2. UserPreferences（用户偏好）
3. Trip（行程）
4. Day（行程天数）
5. ItineraryItem（行程项目）
6. Budget（预算）
7. PackingItem（打包清单）
8. Spot（景点）
9. SpotIoTData（景点IoT数据）
10. SpotImage（景点图片）
11. Review（评价）
12. BlogPost（博客文章）
13. BlogComment（博客评论）
14. Favorite（收藏）
15. Hotel（酒店）
16. Restaurant（餐厅）

---

## 备份文件管理

### 查看备份文件

```bash
cd backend
ls -lh backups/
```

### 复制备份文件

```bash
# 复制到其他位置长期保存
cp backups/backup_2026-03-25_18-30-00.json ~/Documents/livetrip-backup.json
```

### 删除备份文件

```bash
cd backend
rm backups/backup_2026-03-25_18-30-00.json
```

### 自动清理旧备份

系统会自动清理超过7天的备份文件。如果需要修改保留天数，可以编辑 `backend/scripts/backup-db.ts` 中的 `cleanupOldBackups` 函数。

---

## 常见问题

### Q1: 备份失败怎么办？

**可能原因**：
- 数据库文件被占用
- 磁盘空间不足
- 权限不足

**解决方法**：
1. 停止后端服务
2. 检查磁盘空间
3. 确保有写入权限
4. 重新执行备份

### Q2: 恢复失败怎么办？

**可能原因**：
- 备份文件损坏
- 数据库结构不匹配
- 外键约束冲突

**解决方法**：
1. 验证备份文件完整性
2. 检查数据库Schema是否匹配
3. 先恢复无外键约束的表
4. 查看错误日志定位问题

### Q3: 如何恢复到指定时间点？

**步骤**：
1. 找到该时间点之前的备份文件
2. 停止后端服务
3. 执行恢复操作
4. 重启后端服务

### Q4: 备份文件可以跨版本使用吗？

**不建议**。不同版本的数据库Schema可能不同，跨版本恢复可能导致数据丢失或错误。

**建议**：
- 升级前先备份
- 升级后重新备份
- 不要跨大版本恢复

### Q5: 如何在多环境间迁移数据？

**步骤**：
1. 在源环境执行备份
2. 将备份文件传输到目标环境
3. 在目标环境执行恢复
4. 验证数据完整性

---

## 高级用法

### 自定义备份表列表

如果只需要备份部分表，可以修改 `backup-db.ts` 脚本：

```typescript
const models = [
  'User',
  'Trip',
  'Day',
  // 只备份需要的表
];
```

### 备份到远程位置

可以将备份文件上传到云存储：

```typescript
import { uploadToS3 } from './s3-upload';

// 在备份完成后
const filepath = await backupDatabase();
await uploadToS3(filepath);
```

### 增量备份

对于大型数据库，可以实现增量备份：

```typescript
// 只备份最近修改的数据
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const data = await prisma.Trip.findMany({
  where: {
    updatedAt: { gte: yesterday }
  }
});
```

---

## 技术支持

如遇到问题，请通过以下方式获取帮助：

1. 查看本文档的常见问题部分
2. 检查错误日志
3. 在项目 GitHub 提交 Issue
4. 联系项目维护者

---

**最后更新时间**：2026-03-25
**文档版本**：1.0.0

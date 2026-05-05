# frontend/src/store 函数列表

## collabStore.ts

### 类型定义
- `CollabRoom` - 协同房间
- `TripMember` - 行程成员
- `DraftRoute` - 草案路线
- `CollabMessage` - 协同消息
- `SpotStat` - 景点统计
- `CursorPosition` - 光标位置

### Store Actions
- `setCurrentRoom` - 设置当前房间
- `setMembers` - 设置成员列表
- `addMember` - 添加成员
- `removeMember` - 移除成员
- `setMyDrafts` - 设置我的草案
- `updateDraft` - 更新草案
- `updateCursor` - 更新光标
- `removeCursor` - 移除光标
- `addOnlineUser` - 添加在线用户
- `removeOnlineUser` - 移除在线用户
- `setMessages` - 设置消息列表
- `addMessage` - 添加消息

### 导出
- `useCollabStore` - Zustand store hook

---

## index.ts

### 类型定义
- `UserProfile` - 用户资料

### Store Actions
- `setCurrentItinerary` - 设置当前行程
- `setUser` - 设置用户
- `setIsLoading` - 设置加载状态
- `completeTrip` - 完成行程

### 导出
- `useAppStore` - Zustand store hook

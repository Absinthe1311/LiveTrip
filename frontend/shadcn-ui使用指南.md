# shadcn/ui 使用指南

## 📖 简介

本项目已集成 [shadcn/ui](https://ui.shadcn.com/)，这是一个基于 Radix UI 和 Tailwind CSS 构建的现代化 UI 组件库。

### 特点

- ✅ **完全可定制** - 组件代码直接复制到项目中，完全可控
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **无障碍访问** - 基于 Radix UI，符合 WCAG 标准
- ✅ **现代化设计** - 精美的默认样式，支持暗黑模式
- ✅ **轻量级** - 只包含你使用的组件

---

## 🚀 已安装的组件

### 基础组件

| 组件 | 说明 | 路径 |
|------|------|------|
| Button | 按钮 | `@/components/ui/button` |
| Card | 卡片 | `@/components/ui/card` |
| Badge | 徽章 | `@/components/ui/badge` |
| Input | 输入框 | `@/components/ui/input` |
| Textarea | 文本域 | `@/components/ui/textarea` |
| Avatar | 头像 | `@/components/ui/avatar` |

### 布局组件

| 组件 | 说明 | 路径 |
|------|------|------|
| Tabs | 标签页 | `@/components/ui/tabs` |
| ScrollArea | 滚动区域 | `@/components/ui/scroll-area` |
| Separator | 分隔符 | `@/components/ui/separator` |

---

## 💡 使用示例

### 1. Button 按钮

```typescript
import { Button } from '@/components/ui/button'

export default function Example() {
  return (
    <div>
      <Button variant="default">默认按钮</Button>
      <Button variant="secondary">次要按钮</Button>
      <Button variant="outline">轮廓按钮</Button>
      <Button variant="ghost">幽灵按钮</Button>
      <Button variant="destructive">危险按钮</Button>
      <Button variant="link">链接按钮</Button>
    </div>
  )
}
```

### 2. Card 卡片

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Example() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>卡片描述信息</CardDescription>
      </CardHeader>
      <CardContent>
        <p>这是卡片的内容区域。</p>
      </CardContent>
      <CardFooter>
        <Button>确认</Button>
      </CardFooter>
    </Card>
  )
}
```

### 3. Input 输入框

```typescript
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Example() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">邮箱</Label>
      <Input id="email" type="email" placeholder="example@email.com" />
    </div>
  )
}
```

### 4. Tabs 标签页

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Example() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">账户</TabsTrigger>
        <TabsTrigger value="password">密码</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p>账户设置内容</p>
      </TabsContent>
      <TabsContent value="password">
        <p>密码修改内容</p>
      </TabsContent>
    </Tabs>
  )
}
```

### 5. Avatar 头像

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Example() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
```

---

## 🎨 样式定制

### Tailwind CSS 类名

所有 shadcn/ui 组件都支持 Tailwind CSS 类名，你可以通过 `className` prop 来自定义样式：

```typescript
<Button className="bg-blue-500 hover:bg-blue-600">
  自定义按钮
</Button>
```

### CSS 变量

shadcn/ui 使用 CSS 变量来管理主题，你可以在 `src/index.css` 中自定义：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... 更多变量 */
}
```

---

## 📦 添加新组件

### 方法 1：使用 CLI（推荐）

```bash
cd frontend
npx shadcn@latest add <component-name>
```

例如：
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

### 方法 2：手动添加

1. 访问 [shadcn/ui 官网](https://ui.shadcn.com/)
2. 选择你需要的组件
3. 复制组件代码
4. 创建对应的 `.tsx` 文件到 `src/components/ui/` 目录

---

## 🔧 配置文件

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### tailwind.config.js

已配置 shadcn/ui 主题和动画：

```javascript
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ... 更多颜色变量
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 🎯 最佳实践

### 1. 与 Ant Design 共存

本项目同时使用 Ant Design 和 shadcn/ui，建议：

- **新功能**：优先使用 shadcn/ui 组件
- **现有功能**：保持使用 Ant Design
- **样式冲突**：Tailwind CSS 优先级较高，必要时使用 `!important`

### 2. 组件选择建议

| 功能场景 | 推荐组件库 |
|---------|-----------|
| 表单输入 | shadcn/ui (Input, Textarea) |
| 复杂表单 | Ant Design (Form, DatePicker) |
| 数据表格 | Ant Design (Table) |
| 弹窗对话框 | shadcn/ui (Dialog) |
| 导航菜单 | shadcn/ui (Navigation Menu) |
| 反馈提示 | Ant Design (Message, Modal) |
| 布局容器 | shadcn/ui (Card, Separator) |

### 3. 路径别名

使用 `@/` 别名简化导入路径：

```typescript
// ❌ 不推荐
import { Button } from '../../../components/ui/button'

// ✅ 推荐
import { Button } from '@/components/ui/button'
```

---

## 📚 参考资源

- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [Radix UI 文档](https://www.radix-ui.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

## ❓ 常见问题

### Q1: 如何修改组件默认样式？

A: 你可以直接修改 `src/components/ui/` 下的组件文件，或者通过 `className` 传递自定义样式。

### Q2: 如何添加暗黑模式？

A: shadcn/ui 已支持暗黑模式，只需在组件上添加 `dark:` 类名：

```typescript
<Button className="dark:bg-slate-800 dark:text-white">
  暗黑模式按钮
</Button>
```

### Q3: 如何禁用某个组件？

A: 使用 `disabled` prop：

```typescript
<Button disabled>禁用按钮</Button>
<Input disabled />
```

### Q4: 组件样式与 Ant Design 冲突怎么办？

A: 可以使用 Tailwind 的 `!important` 或调整 CSS 优先级：

```typescript
<Button className="!bg-blue-500">
  强制应用样式
</Button>
```

---

**文档版本**: 1.0
**更新时间**: 2026-03-17
**项目版本**: LiveTrip v1.2.0

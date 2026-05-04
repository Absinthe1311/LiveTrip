# backend 函数列表汇总

本目录包含 backend/src 下所有文件夹的函数名称列表，用于"去AI化"重构工作。

## 已生成的文件

| 文件名 | 对应文件夹 | 说明 |
|--------|-----------|------|
| config.md | backend/src/config | 配置文件 |
| controllers.md | backend/src/controllers | 控制器（API请求处理） |
| data.md | backend/src/data | 数据文件 |
| lib.md | backend/src/lib | 工具库 |
| middleware.md | backend/src/middleware | 中间件 |
| routes.md | backend/src/routes | 路由配置 |
| services.md | backend/src/services | 业务服务（核心逻辑） |
| socket.md | backend/src/socket | WebSocket服务 |
| types.md | backend/src/types | 类型定义 |
| utils.md | backend/src/utils | 工具函数 |

## 函数统计

- **config**: 1个函数
- **controllers**: 约90+个函数/方法
- **data**: 3个函数
- **lib**: 1个函数
- **middleware**: 9个函数
- **routes**: 主要是路由配置，少数内联函数
- **services**: 约200+个函数/方法（核心业务逻辑）
- **socket**: 4个函数
- **types**: 类型定义，无函数
- **utils**: 约25个函数

## 使用说明

1. 每个md文件列出了对应文件夹中所有文件包含的函数名称
2. 函数名称后附有简要说明
3. 类方法会标注所属类名
4. 私有方法会标注 `(private)`
5. 导出的常量/实例会单独标注

## 下一步

根据这些函数列表，可以进行统一的函数名称修改工作，将AI风格的函数名改为更自然的命名。

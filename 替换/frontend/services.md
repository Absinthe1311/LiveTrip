# 函数名替换映射表（frontend/src/services）

| 原函数名                       | 新函数名            |
| ------------------------------ | ------------------- |
| `sendAdvisorMessage`         | `askAdv`          |
| `sendAgentMessageSSE`        | `sseChat`         |
| `connectSocket`              | `openSock`        |
| `disconnectSocket`           | `closeIO`         |
| `joinCollabRoom`             | `enterRoom`       |
| `leaveCollabRoom`            | `leaveCollabRoom` |
| `moveCursor`                 | `nudgeCursor`     |
| `updateDraft`                | `patchDraft`      |
| `submitDraft`                | `sendDraft`       |
| `sendNewMessage`             | `pushMsg`         |
| `getRecommendations`         | `getAlts`         |
| `getFallbackRecommendations` | `backupRecs`      |
| `extractCityFromItinerary`   | `getCity`         |
| `calculateIoTScore`          | `sensorScore`     |
| `isSuitableForVisit`         | `canGo`           |
| `getHealthLevel`             | `getHealth`       |
| `getHealthColor`             | `getColor`        |
| `getHealthIcon`              | `statusIcon`      |
| `getHealthMessage`           | `statusText`      |

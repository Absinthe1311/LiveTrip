// 后端主入口文件 - 配置Express服务器和中间件
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import apiRoutes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { initCloudinary } from './config/cloudinary';
import { initSocketIO } from './socket/socketService';
import { sensorScheduler } from './services/sensorScheduler';

// 加载环境变量
dotenv.config();

// 初始化 Cloudinary
initCloudinary();

const app = express();
const PORT = process.env.PORT || 3001;

// 创建HTTP服务器
const httpServer = createServer(app);

// 初始化Socket.io
initSocketIO(httpServer);

// 启动环境感知定时任务
sensorScheduler.start();

// 测试 Cloudinary 配置
app.get('/test/cloudinary', (req, res) => {
  res.json({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key_set: !!process.env.CLOUDINARY_API_KEY,
    api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
  });
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LiveTrip Backend is running' });
});

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to LiveTrip API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      plan: 'POST /api/plan',
      itinerary: 'GET /api/itinerary/:id',
      iotData: 'GET /api/iot/data',
      adjust: 'POST /api/adjust'
    }
  });
});

// API路由
app.use('/api', apiRoutes);

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器（使用HTTP服务器而非Express app）
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Socket.io is ready for WebSocket connections`);
});

export default app;

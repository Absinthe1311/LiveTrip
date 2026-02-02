// 后端主入口文件 - 配置Express服务器和中间件
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;

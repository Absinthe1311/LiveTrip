// IoT数据路由 - 定义IoT数据相关的API端点
import { Router } from 'express';
import { getIoTData } from '../controllers/iotController';

const router = Router();

// GET /api/iot/data - 获取IoT数据
router.get('/data', getIoTData);

export default router;

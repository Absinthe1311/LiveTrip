// IoT数据路由 - 定义IoT数据相关的API端点
import { Router } from 'express';
import { spotIot, spotIoT } from '../controllers/iotController';

const router = Router();

// GET /api/iot/data - 获取所有景点的IoT数据
router.get('/iot/data', spotIot);

// GET /api/iot/spot/:id - 获取指定景点的IoT数据
router.get('/iot/spot/:id', spotIoT);

export default router;

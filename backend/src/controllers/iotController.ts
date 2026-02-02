// IoT数据控制器 - 处理IoT实时数据相关请求
import { Request, Response } from 'express';

export const getIoTData = async (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'GET /api/iot/data - 获取IoT数据' 
  });
};

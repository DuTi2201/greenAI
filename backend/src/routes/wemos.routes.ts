import express, { Request, Response } from 'express';
import { WemosController } from '../controllers/wemos.controller';
import { WemosValidator } from '../middleware/wemos.validator';
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';
import { WemosService } from '../services/wemos.service';

const router = express.Router();
const wemosController = new WemosController();
const wemosService = new WemosService();

// Nhận dữ liệu cảm biến từ Wemos
router.post('/data', 
  WemosValidator.validateSensorData,
  wemosController.receiveSensorData
);

// Trả về lệnh điều khiển cho Wemos
router.get('/control', 
  wemosController.getControlCommands
);

// Schema cho cấu hình Wemos
const configSchema = z.object({
  serverUrl: z.string().url(),
  controlUrl: z.string().url()
});

// Lấy cấu hình hiện tại
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const config = await wemosService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy cấu hình' });
  }
});

// Cập nhật cấu hình
router.post('/config', 
  validateRequest({ body: configSchema }), 
  async (req: Request, res: Response) => {
    try {
      const config = await wemosService.updateConfig(req.body);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Không thể cập nhật cấu hình' });
    }
  }
);

// Lấy trạng thái kết nối
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await wemosService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy trạng thái' });
  }
});

// Reset WiFi
router.post('/reset-wifi', async (_req: Request, res: Response) => {
  try {
    await wemosService.resetWifi();
    res.json({ message: 'Đã reset WiFi thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Không thể reset WiFi' });
  }
});

export default router; 
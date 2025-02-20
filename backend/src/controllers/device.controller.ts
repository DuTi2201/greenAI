import { Request, Response } from 'express';
import { Device } from '../models/Device';
import { SensorData } from '../models/SensorData';
import { Alert } from '../models/Alert';
import { AuthRequest } from '../types/auth.types';
import { devicesService } from '../services/iot/devices.service';

export const getAllDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await Device.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [
        {
          model: SensorData,
          limit: 100,
          order: [['timestamp', 'DESC']],
        },
        {
          model: Alert,
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    await device.update(req.body);
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    await device.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const controlDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    // Validate action
    if (action !== 'on' && action !== 'off') {
      res.status(400).json({ error: 'Invalid action. Must be "on" or "off"' });
      return;
    }

    const device = await Device.findByPk(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    if (!device.isActive) {
      res.status(400).json({ error: 'Device is not active' });
      return;
    }

    // Cập nhật trạng thái thiết bị trong database
    await device.update({
      status: action,
      lastAction: {
        action,
        timestamp: new Date(),
        userId: req.user?.id,
      },
    });

    // Trả về thông tin thiết bị đã cập nhật
    res.json(await device.reload());
  } catch (error) {
    console.error('Error controlling device:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 
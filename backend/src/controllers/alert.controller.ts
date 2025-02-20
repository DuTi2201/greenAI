import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Alert from '../models/Alert';
import Device from '../models/Device';
import { AuthRequest } from '../types/auth.types';

export const getAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await Alert.findAll({
      order: [['created_at', 'DESC']],
      limit: 50, // Giới hạn 50 thông báo gần nhất
    });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAlertStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const alert = await Alert.findByPk(id);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    await alert.update({
      status,
      resolvedAt: status === 'resolved' ? new Date() : undefined,
    });

    res.json(alert);
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, message, severity, deviceId, metadata } = req.body;

    const device = await Device.findByPk(deviceId);
    if (!device) {
      res.status(404).json({ message: 'Device not found' });
      return;
    }

    const alert = await Alert.create({
      type,
      message,
      severity,
      deviceId,
      status: 'active',
      metadata,
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Alert.update(
      {
        status: 'resolved',
        resolvedAt: new Date(),
      },
      {
        where: {
          status: 'active',
        },
      }
    );

    res.json({ message: 'All alerts marked as resolved' });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 
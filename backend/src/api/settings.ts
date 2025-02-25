import express from 'express';
import { db } from '../singleton';
import { protect } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Lấy thông tin cài đặt của user
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: {
        email: true,
        fullName: true,
        preferredLanguage: true,
        themePreference: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        profile: user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Cập nhật thông tin cá nhân
router.patch('/profile', protect, async (req, res) => {
  try {
    const { fullName, currentPassword, newPassword } = req.body;

    // Kiểm tra user tồn tại
    const user = await db.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = {};

    if (fullName) {
      updateData.fullName = fullName;
    }

    // Nếu có yêu cầu đổi mật khẩu
    if (currentPassword && newPassword) {
      // Kiểm tra mật khẩu hiện tại
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isMatch) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Mã hóa mật khẩu mới
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Cập nhật thông tin
    const updatedUser = await db.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        email: true,
        fullName: true,
        preferredLanguage: true,
        themePreference: true
      }
    });

    res.json({
      status: 'success',
      data: {
        profile: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Cập nhật tùy chọn
router.patch('/preferences', protect, async (req, res) => {
  try {
    const { preferredLanguage, themePreference } = req.body;

    if (!preferredLanguage && !themePreference) {
      return res.status(400).json({
        status: 'error',
        message: 'No preferences to update'
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = {};

    if (preferredLanguage) {
      if (!['en', 'vi'].includes(preferredLanguage)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid language preference'
        });
      }
      updateData.preferredLanguage = preferredLanguage;
    }

    if (themePreference) {
      if (!['light', 'dark'].includes(themePreference)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid theme preference'
        });
      }
      updateData.themePreference = themePreference;
    }

    // Cập nhật tùy chọn
    const updatedUser = await db.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        preferredLanguage: true,
        themePreference: true
      }
    });

    res.json({
      status: 'success',
      data: {
        preferences: updatedUser
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Lấy danh sách thông báo
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await db.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: {
        notifications
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Đánh dấu thông báo đã đọc
router.patch('/notifications/:notificationId', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Kiểm tra thông báo tồn tại và thuộc về user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user!.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Cập nhật trạng thái
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({
      status: 'success',
      data: {
        notification: updatedNotification
      }
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Xóa thông báo
router.delete('/notifications/:notificationId', protect, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Kiểm tra thông báo tồn tại và thuộc về user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user!.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Xóa thông báo
    await db.notification.delete({
      where: { id: notificationId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router; 
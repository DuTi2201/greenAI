import { Response } from 'express'
import { Advisor } from '../../models/Advisor'
import { AuthRequest } from '../../types/auth.types'

export const getAdvisorHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const history = await Advisor.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit: 20, // Giới hạn 20 bản ghi gần nhất
    })

    res.json(history)
  } catch (error) {
    console.error('Error getting advisor history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 
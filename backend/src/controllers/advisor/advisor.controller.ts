import { Request, Response } from 'express'
import { geminiService } from '../../services/ai/gemini.service'
import { Advisor } from '../../models/Advisor'
import { SensorData } from '../../models/SensorData'
import { AuthRequest } from '../../types/auth.types'

export const analyzeGardenData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Lấy dữ liệu cảm biến mới nhất
    const latestData = await SensorData.getLatest('main-sensor')
    if (!latestData) {
      res.status(404).json({ error: 'No sensor data available' })
      return
    }

    const sensorData = {
      temperature: Number(latestData.get('temperature')),
      humidity: Number(latestData.get('humidity')),
      soilMoisture: Number(latestData.get('soilMoisture')),
      light: Number(latestData.get('light')),
    }

    // Validate sensor data
    if (isNaN(sensorData.temperature) || isNaN(sensorData.humidity) || 
        isNaN(sensorData.soilMoisture) || isNaN(sensorData.light)) {
      res.status(400).json({ error: 'Invalid sensor data values' })
      return
    }

    try {
      // Phân tích dữ liệu bằng Gemini AI
      const analysis = await geminiService.analyzeGardenData(sensorData)

      // Validate analysis response
      if (!analysis || typeof analysis.healthScore !== 'number' || 
          !Array.isArray(analysis.recommendations) || !analysis.analysis) {
        throw new Error('Invalid AI analysis response')
      }

      // Lưu kết quả phân tích vào database
      const advisor = await Advisor.create({
        userId: userId.toString(),
        sensorData,
        healthScore: analysis.healthScore,
        recommendations: analysis.recommendations,
        analysis: analysis.analysis,
      })

      res.json(advisor)
    } catch (aiError) {
      console.error('AI analysis failed, using basic analysis:', aiError)
      
      // Fallback to basic analysis
      const basicAnalysis = geminiService.analyzeDataBasic(sensorData)

      const advisor = await Advisor.create({
        userId: userId.toString(),
        sensorData,
        healthScore: basicAnalysis.healthScore,
        recommendations: basicAnalysis.recommendations,
        analysis: basicAnalysis.analysis,
      })

      res.json(advisor)
    }
  } catch (error) {
    console.error('Error in analyzeGardenData:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : 'Unknown error' 
        : undefined 
    })
  }
} 
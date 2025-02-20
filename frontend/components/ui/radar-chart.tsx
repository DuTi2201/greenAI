"use client"

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface RadarChartProps {
  data: {
    subject: string
    value: number
    fullMark: number
  }[]
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#64748b', fontSize: 14 }}
        />
        <Radar
          name="Value"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
} 
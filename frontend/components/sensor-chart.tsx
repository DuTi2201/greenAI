import { PenLineIcon as Line } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sensorData = [
  { time: "00:00", temperature: 25 },
  { time: "01:00", temperature: 26 },
  { time: "02:00", temperature: 27 },
  { time: "03:00", temperature: 28 },
  { time: "04:00", temperature: 27 },
  { time: "05:00", temperature: 26 },
  { time: "06:00", temperature: 25 },
  { time: "07:00", temperature: 24 },
  { time: "08:00", temperature: 25 },
  { time: "09:00", temperature: 26 },
  { time: "10:00", temperature: 27 },
  { time: "11:00", temperature: 28 },
  { time: "12:00", temperature: 29 },
  { time: "13:00", temperature: 30 },
  { time: "14:00", temperature: 29 },
  { time: "15:00", temperature: 28 },
  { time: "16:00", temperature: 27 },
  { time: "17:00", temperature: 26 },
  { time: "18:00", temperature: 25 },
  { time: "19:00", temperature: 24 },
  { time: "20:00", temperature: 23 },
  { time: "21:00", temperature: 22 },
  { time: "22:00", temperature: 21 },
  { time: "23:00", temperature: 20 },
]

export default function SensorChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {/* Replace with actual chart library */}
          <div className="flex items-center justify-center h-full">
            <Line className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


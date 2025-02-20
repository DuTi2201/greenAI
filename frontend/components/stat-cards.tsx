"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Thermometer, Droplet, Sun, Cloud } from "lucide-react"

const statItems = [
  { name: "Air Temperature", icon: Thermometer, unit: "°C", value: 25, color: "from-red-500 to-orange-500" },
  { name: "Soil Moisture", icon: Droplet, unit: "%", value: 60, color: "from-blue-500 to-cyan-500" },
  { name: "Light Intensity", icon: Sun, unit: "Lux", value: 1000, color: "from-yellow-500 to-amber-500" },
  { name: "Air Humidity", icon: Cloud, unit: "%", value: 55, color: "from-indigo-500 to-purple-500" },
]

export default function StatCards() {
  const [stats, setStats] = useState(statItems)

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prevStats) =>
        prevStats.map((stat) => ({
          ...stat,
          value: stat.value + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 5,
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.name}
          className={`overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-105`}
        >
          <CardContent className={`p-6 bg-gradient-to-br ${stat.color}`}>
            <div className="flex justify-between items-center">
              <div className="text-white">
                <p className="text-sm font-medium">{stat.name}</p>
                <h3 className="text-3xl font-bold mt-2 transition-all duration-300 ease-in-out">
                  {stat.value.toFixed(1)}
                  {stat.unit}
                </h3>
              </div>
              <stat.icon className="h-8 w-8 text-white opacity-75" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


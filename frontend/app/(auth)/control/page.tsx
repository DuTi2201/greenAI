"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import DeviceControl from "@/components/device-control"
import { ControlPanel } from "@/components/control/ControlPanel"

export default function ControlPage() {
  const [isAutoMode, setIsAutoMode] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Device Control</h1>
      
      {/* Auto/Manual Mode Switch */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-mode" 
            checked={isAutoMode}
            onCheckedChange={setIsAutoMode}
          />
          <Label htmlFor="auto-mode">Auto Mode</Label>
        </div>
      </div>

      {/* Control Panel */}
      {!isAutoMode ? (
        <ControlPanel />
      ) : (
        <DeviceControl />
      )}
    </div>
  )
}


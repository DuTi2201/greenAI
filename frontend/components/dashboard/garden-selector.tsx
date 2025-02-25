"use client"

import { useGarden } from "@/contexts/garden-context"
import { useLanguage } from "@/providers/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const translations = {
  en: {
    selectGarden: "Select Garden",
    error: "Failed to load garden data",
    noGardens: "No gardens found",
  },
  vi: {
    selectGarden: "Chọn Vườn",
    error: "Không thể tải dữ liệu vườn",
    noGardens: "Không tìm thấy vườn nào",
  },
}

export function GardenSelector() {
  const { gardens, selectedGardenId, selectGarden, error, isLoading } = useGarden()
  const { language } = useLanguage()
  const t = translations[language]

  const getStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return "bg-green-500 hover:bg-green-600"
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "critical":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const selectedGarden = gardens.find(garden => garden.id === selectedGardenId)

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select 
          value={selectedGardenId ?? undefined} 
          onValueChange={selectGarden}
          disabled={isLoading || gardens.length === 0}
        >
          <SelectTrigger className="w-[200px] md:w-[250px]">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{t.selectGarden}</span>
              </div>
            ) : (
              <SelectValue placeholder={t.selectGarden} />
            )}
          </SelectTrigger>
          <SelectContent>
            {gardens.length === 0 ? (
              <div className="py-2 px-2 text-sm text-muted-foreground">{t.noGardens}</div>
            ) : (
              gardens.map((garden) => (
                <SelectItem key={garden.id} value={garden.id} className="flex justify-between">
                  <div className="flex items-center justify-between w-full">
                    <span>{garden.name}</span>
                    <Badge className={getStatusColor(garden.status)} variant="outline">
                      {garden.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {selectedGarden && (
          <Badge 
            className={`${getStatusColor(selectedGarden.status)} hidden md:flex`}
          >
            {selectedGarden.status}
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}


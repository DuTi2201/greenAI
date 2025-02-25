"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLanguage } from "@/providers/language-provider"
import { useGarden } from "@/contexts/garden-context"
import { deviceService } from "@/lib/services/device"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, Edit, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RuleBuilder } from "./rule-builder"
import { format } from "date-fns"

const translations = {
  en: {
    title: "Automation Rules",
    description: "Create and manage rules to automate your garden",
    addRule: "Add Rule",
    noRules: "No automation rules found",
    createFirst: "Create your first rule to automate your garden",
    active: "Active",
    inactive: "Inactive",
    delete: "Delete",
    edit: "Edit",
    deleteConfirm: "Are you sure you want to delete this rule?",
    deleteDescription: "This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Confirm",
    schedule: "Schedule",
    sensor: "Sensor",
    condition: "Condition",
    action: "Action",
    priority: "Priority",
    toasts: {
      deleteSuccess: "Rule deleted successfully",
      deleteError: "Failed to delete rule",
      updateSuccess: "Rule updated successfully",
      updateError: "Failed to update rule",
    },
    sensors: {
      temperature: "Temperature",
      humidity: "Humidity",
      soilMoisture: "Soil Moisture",
      lightLevel: "Light Level",
      schedule: "Schedule",
    },
    actions: {
      fan_on: "Turn on fan",
      fan_off: "Turn off fan",
      led_on: "Turn on LED",
      led_off: "Turn off LED",
      nutrientPump_on: "Turn on nutrient pump",
      nutrientPump_off: "Turn off nutrient pump",
      waterPump_on: "Turn on water pump",
      waterPump_off: "Turn off water pump",
    },
    scheduleTypes: {
      once: "Once",
      daily: "Daily",
      weekly: "Weekly",
    },
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  },
  vi: {
    title: "Quy tắc Tự động hóa",
    description: "Tạo và quản lý quy tắc để tự động hóa vườn của bạn",
    addRule: "Thêm Quy tắc",
    noRules: "Không tìm thấy quy tắc tự động hóa",
    createFirst: "Tạo quy tắc đầu tiên để tự động hóa vườn của bạn",
    active: "Đang hoạt động",
    inactive: "Không hoạt động",
    delete: "Xóa",
    edit: "Sửa",
    deleteConfirm: "Bạn có chắc chắn muốn xóa quy tắc này?",
    deleteDescription: "Hành động này không thể hoàn tác.",
    cancel: "Hủy",
    confirm: "Xác nhận",
    schedule: "Lịch",
    sensor: "Cảm biến",
    condition: "Điều kiện",
    action: "Hành động",
    priority: "Ưu tiên",
    toasts: {
      deleteSuccess: "Đã xóa quy tắc thành công",
      deleteError: "Không thể xóa quy tắc",
      updateSuccess: "Đã cập nhật quy tắc thành công",
      updateError: "Không thể cập nhật quy tắc",
    },
    sensors: {
      temperature: "Nhiệt độ",
      humidity: "Độ ẩm",
      soilMoisture: "Độ ẩm đất",
      lightLevel: "Cường độ ánh sáng",
      schedule: "Lịch",
    },
    actions: {
      fan_on: "Bật quạt",
      fan_off: "Tắt quạt",
      led_on: "Bật đèn LED",
      led_off: "Tắt đèn LED",
      nutrientPump_on: "Bật bơm dinh dưỡng",
      nutrientPump_off: "Tắt bơm dinh dưỡng",
      waterPump_on: "Bật bơm nước",
      waterPump_off: "Tắt bơm nước",
    },
    scheduleTypes: {
      once: "Một lần",
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
    },
    days: [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ],
  },
}

export function RuleList() {
  const { language } = useLanguage()
  const t = translations[language]
  const { selectedGardenId } = useGarden()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [addRuleDialogOpen, setAddRuleDialogOpen] = useState(false)

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["automation-rules", selectedGardenId],
    queryFn: () => deviceService.getAutomationRules(selectedGardenId || ""),
    enabled: !!selectedGardenId,
  })

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deviceService.deleteAutomationRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] })
      toast({
        title: t.toasts.deleteSuccess,
      })
      setDeleteDialogOpen(false)
    },
    onError: (error) => {
      console.error("Delete rule error:", error)
      toast({
        title: t.toasts.deleteError,
        variant: "destructive",
      })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      deviceService.updateAutomationRule(ruleId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] })
      toast({
        title: t.toasts.updateSuccess,
      })
    },
    onError: (error) => {
      console.error("Update rule error:", error)
      toast({
        title: t.toasts.updateError,
        variant: "destructive",
      })
    },
  })

  const handleDeleteRule = (ruleId: string) => {
    setSelectedRuleId(ruleId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRule = () => {
    if (selectedRuleId) {
      deleteMutation.mutate(selectedRuleId)
    }
  }

  const handleToggleActive = (ruleId: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ ruleId, isActive: !isActive })
  }

  const formatCondition = (rule: any) => {
    if (rule.sensorType === "schedule") {
      let scheduleText = ""
      
      if (rule.scheduleType === "once") {
        const date = new Date(rule.scheduleDate)
        scheduleText = `${format(date, "dd/MM/yyyy")} at ${rule.scheduleTime}`
      } else if (rule.scheduleType === "daily") {
        scheduleText = `${t.scheduleTypes.daily} at ${rule.scheduleTime}`
      } else if (rule.scheduleType === "weekly") {
        scheduleText = `${t.scheduleTypes.weekly} (${t.days[rule.scheduleDay]}) at ${rule.scheduleTime}`
      }
      
      return scheduleText
    } else {
      return `${t.sensors[rule.sensorType as keyof typeof t.sensors]} ${rule.conditionOperator} ${rule.thresholdValue}`
    }
  }

  const formatAction = (rule: any) => {
    const actionKey = `${rule.actionDevice}_${rule.actionStatus ? "on" : "off"}` as keyof typeof t.actions
    return t.actions[actionKey] || `${rule.actionDevice} ${rule.actionStatus ? "ON" : "OFF"}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const rules = rulesData?.data?.rules || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Dialog open={addRuleDialogOpen} onOpenChange={setAddRuleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.addRule}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.addRule}</DialogTitle>
            </DialogHeader>
            <RuleBuilder />
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t.noRules}</h3>
          <p className="text-muted-foreground">{t.createFirst}</p>
          <Button className="mt-4" onClick={() => setAddRuleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.addRule}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule: any) => (
            <Card key={rule.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? t.active : t.inactive}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{rule.name || `Rule ${rule.id.slice(0, 8)}`}</CardTitle>
                <CardDescription>
                  {rule.sensorType === "schedule" ? t.schedule : t.sensor}: {t.sensors[rule.sensorType as keyof typeof t.sensors]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{t.condition}</div>
                    <div className="text-sm">{formatCondition(rule)}</div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{t.action}</div>
                    <div className="text-sm">{formatAction(rule)}</div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{t.priority}</div>
                    <div className="text-sm">{rule.priority}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(rule.updatedAt), "dd/MM/yyyy HH:mm")}
                  </span>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleActive(rule.id, rule.isActive)}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirm}</DialogTitle>
            <DialogDescription>{t.deleteDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRule}>
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


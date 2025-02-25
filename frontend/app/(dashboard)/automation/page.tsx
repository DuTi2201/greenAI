"use client"

import { useState } from "react"
import { RuleBuilder } from "@/components/automation/rule-builder"
import { RuleList } from "@/components/automation/rule-list"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"
import { useGarden } from "@/contexts/garden-context"
import { Card } from "@/components/ui/card"
import { RuleScheduler } from "@/components/automation/rule-scheduler"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { useToast } from "@/components/ui/use-toast"

const translations = {
  en: {
    title: "Automation Rules",
    addRule: "Add Rule",
    newRule: "New Automation Rule",
    schedule: "Schedule",
    toasts: {
      deleteSuccess: "Rule deleted successfully",
      deleteError: "Failed to delete rule",
      updateSuccess: "Rule updated successfully",
      updateError: "Failed to update rule",
    },
  },
  vi: {
    title: "Quy tắc Tự động",
    addRule: "Thêm Quy tắc",
    newRule: "Quy tắc Tự động Mới",
    schedule: "Lịch",
    toasts: {
      deleteSuccess: "Đã xóa quy tắc thành công",
      deleteError: "Không thể xóa quy tắc",
      updateSuccess: "Đã cập nhật quy tắc thành công",
      updateError: "Không thể cập nhật quy tắc",
    },
  },
}

export default function AutomationPage() {
  const { language } = useLanguage()
  const { selectedGardenId } = useGarden()
  const t = translations[language]
  const [showScheduler, setShowScheduler] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules", selectedGardenId],
    queryFn: () => deviceService.getAutomationRules(selectedGardenId!),
    enabled: !!selectedGardenId,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ deviceId, ruleId }: { deviceId: string; ruleId: string }) =>
      deviceService.deleteAutomationRule(deviceId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] })
      toast({
        title: t.toasts.deleteSuccess,
      })
    },
    onError: () => {
      toast({
        title: t.toasts.deleteError,
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      deviceId,
      ruleId,
      data,
    }: {
      deviceId: string;
      ruleId: string;
      data: { isActive: boolean };
    }) => deviceService.updateAutomationRule(deviceId, ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] })
      toast({
        title: t.toasts.updateSuccess,
      })
    },
    onError: () => {
      toast({
        title: t.toasts.updateError,
        variant: "destructive",
      })
    },
  })

  const handleToggle = (id: string, isActive: boolean) => {
    if (!selectedGardenId) return
    updateMutation.mutate({
      deviceId: selectedGardenId,
      ruleId: id,
      data: { isActive },
    })
  }

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log("Edit rule:", id)
  }

  const handleDelete = (id: string) => {
    if (!selectedGardenId) return
    deleteMutation.mutate({
      deviceId: selectedGardenId,
      ruleId: id,
    })
  }

  const formattedRules = rules.map((rule) => ({
    id: rule.id,
    name: `${rule.sensorType} ${rule.conditionOperator} ${rule.thresholdValue}`,
    deviceName: selectedGardenId || "",
    condition: `${rule.sensorType} ${rule.conditionOperator} ${rule.thresholdValue}`,
    action: `${rule.actionDevice} ${rule.actionStatus ? "on" : "off"}`,
    isActive: rule.isActive,
  }))

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduler(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            {t.schedule}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t.addRule}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t.newRule}</DialogTitle>
              </DialogHeader>
              <RuleBuilder />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-6">
        <RuleList
          rules={formattedRules}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </Card>

      <Dialog open={showScheduler} onOpenChange={setShowScheduler}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t.schedule}</DialogTitle>
          </DialogHeader>
          <RuleScheduler rules={formattedRules} />
        </DialogContent>
      </Dialog>
    </div>
  )
}


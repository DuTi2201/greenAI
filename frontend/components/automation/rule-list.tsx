"use client"

import { useLanguage } from "@/providers/language-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const translations = {
  en: {
    name: "Rule Name",
    device: "Device",
    condition: "Condition",
    action: "Action",
    schedule: "Schedule",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    tooltips: {
      edit: "Edit rule",
      delete: "Delete rule",
      condition: "Click for more details about this condition",
    },
  },
  vi: {
    name: "Tên Quy tắc",
    device: "Thiết bị",
    condition: "Điều kiện",
    action: "Hành động",
    schedule: "Lịch",
    status: "Trạng thái",
    actions: "Thao tác",
    active: "Đang hoạt động",
    inactive: "Không hoạt động",
    tooltips: {
      edit: "Chỉnh sửa quy tắc",
      delete: "Xóa quy tắc",
      condition: "Nhấn để xem chi tiết về điều kiện này",
    },
  },
}

type Rule = {
  id: string
  name: string
  deviceName: string
  condition: string
  action: string
  schedule?: string
  isActive: boolean
}

type RuleListProps = {
  rules: Rule[]
  onToggle: (id: string, isActive: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function RuleList({ rules, onToggle, onEdit, onDelete, isLoading }: RuleListProps) {
  const { language } = useLanguage()
  const t = translations[language]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.name}</TableHead>
          <TableHead>{t.device}</TableHead>
          <TableHead>{t.condition}</TableHead>
          <TableHead>{t.action}</TableHead>
          <TableHead>{t.schedule}</TableHead>
          <TableHead>{t.status}</TableHead>
          <TableHead className="text-right">{t.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.name}</TableCell>
            <TableCell>{rule.deviceName}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {rule.condition}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.tooltips.condition}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
            <TableCell>{rule.action}</TableCell>
            <TableCell>{rule.schedule || "-"}</TableCell>
            <TableCell>
              <Switch checked={rule.isActive} onCheckedChange={(checked) => onToggle(rule.id, checked)} />
            </TableCell>
            <TableCell className="text-right">
              <TooltipProvider>
                <div className="flex justify-end space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(rule.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.tooltips.edit}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.tooltips.delete}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


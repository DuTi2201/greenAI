"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLanguage } from "@/providers/language-provider"
import { useGarden } from "@/contexts/garden-context"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { Info, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceService } from "@/lib/services/device"
import { useToast } from "@/components/ui/use-toast"
import { Dialog } from "@/components/ui/dialog"

const translations = {
  en: {
    name: "Rule Name",
    namePlaceholder: "Enter rule name",
    device: "Device",
    condition: "Condition",
    sensor: "Sensor",
    operator: "Operator",
    value: "Value",
    action: "Action",
    schedule: "Schedule",
    scheduleType: "Schedule Type",
    scheduleTypes: {
      once: "Once",
      daily: "Daily",
      weekly: "Weekly",
      custom: "Custom",
    },
    time: "Time",
    active: "Active",
    save: "Save Rule",
    tooltips: {
      condition: "When this condition is met, the action will be triggered",
      schedule: "Optional: Set a time schedule for this rule",
      threshold: "Drag to set the sensor threshold value",
    },
    toasts: {
      success: "Rule created successfully",
      error: "Failed to create rule",
    },
  },
  vi: {
    name: "Tên Quy tắc",
    namePlaceholder: "Nhập tên quy tắc",
    device: "Thiết bị",
    condition: "Điều kiện",
    sensor: "Cảm biến",
    operator: "Toán tử",
    value: "Giá trị",
    action: "Hành động",
    schedule: "Lịch",
    scheduleType: "Loại lịch",
    scheduleTypes: {
      once: "Một lần",
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      custom: "Tùy chỉnh",
    },
    time: "Thời gian",
    active: "Kích hoạt",
    save: "Lưu Quy tắc",
    tooltips: {
      condition: "Khi điều kiện này được thỏa mãn, hành động sẽ được kích hoạt",
      schedule: "Tùy chọn: Đặt lịch thời gian cho quy tắc này",
      threshold: "Kéo để thiết lập ngưỡng cảm biến",
    },
  },
}

const formSchema = z.object({
  name: z.string().min(1),
  deviceId: z.string(),
  sensor: z.string(),
  operator: z.string(),
  value: z.number(),
  action: z.string(),
  scheduleType: z.string(),
  scheduleDate: z.date().optional(),
  scheduleTime: z.string().optional(),
  isActive: z.boolean(),
})

export function RuleBuilder() {
  const { language } = useLanguage()
  const t = translations[language]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      value: 25,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // TODO: Send to API
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.name}</FormLabel>
              <FormControl>
                <Input placeholder={t.namePlaceholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.device}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="device1">Garden Sensor 1</SelectItem>
                  <SelectItem value="device2">Garden Sensor 2</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center">
            <h4 className="text-sm font-medium">{t.condition}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-2">
                    <Info className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltips.condition}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sensor"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.sensor} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="humidity">Humidity</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.operator} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gt">{">"}</SelectItem>
                      <SelectItem value="lt">{"<"}</SelectItem>
                      <SelectItem value="eq">{"="}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
                <FormDescription>{t.tooltips.threshold}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.action}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fan_on">Turn on fan</SelectItem>
                  <SelectItem value="fan_off">Turn off fan</SelectItem>
                  <SelectItem value="pump_on">Turn on pump</SelectItem>
                  <SelectItem value="pump_off">Turn off pump</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="scheduleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.scheduleType}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="once">{t.scheduleTypes.once}</SelectItem>
                    <SelectItem value="daily">{t.scheduleTypes.daily}</SelectItem>
                    <SelectItem value="weekly">{t.scheduleTypes.weekly}</SelectItem>
                    <SelectItem value="custom">{t.scheduleTypes.custom}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduleDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t.schedule}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>{t.tooltips.schedule}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduleTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.time}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t.active}</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {t.save}
        </Button>
      </form>
    </Form>
  )
}


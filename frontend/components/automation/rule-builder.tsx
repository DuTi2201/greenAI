"use client"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
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
    sensors: {
      temperature: "Temperature",
      humidity: "Humidity",
      soilMoisture: "Soil Moisture",
      lightLevel: "Light Level",
      schedule: "Schedule",
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
    toasts: {
      success: "Đã tạo quy tắc thành công",
      error: "Không thể tạo quy tắc",
    },
    sensors: {
      temperature: "Nhiệt độ",
      humidity: "Độ ẩm",
      soilMoisture: "Độ ẩm đất",
      lightLevel: "Độ sáng",
      schedule: "Lịch",
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
  scheduleType: z.string().optional(),
  scheduleDay: z.number().optional(),
  scheduleDate: z.date().optional(),
  scheduleTime: z.string().optional(),
  isActive: z.boolean(),
})

export function RuleBuilder() {
  const { language } = useLanguage()
  const t = translations[language]
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { selectedGardenId } = useGarden()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      value: 25,
      deviceId: selectedGardenId || "",
    },
  })
  
  // Cập nhật deviceId khi selectedGardenId thay đổi
  useEffect(() => {
    if (selectedGardenId) {
      form.setValue("deviceId", selectedGardenId);
    }
  }, [selectedGardenId, form]);
  
  // Theo dõi các giá trị form để hiển thị UI động
  const watchSensor = useWatch({
    control: form.control,
    name: "sensor",
  })
  
  const watchScheduleType = useWatch({
    control: form.control,
    name: "scheduleType",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) return
    setIsLoading(true)

    try {
      // Kiểm tra xem có phải là quy tắc lập lịch không
      const isScheduleRule = values.sensor === "schedule";
      
      const payload: any = {
        gardenId: values.deviceId,
        name: values.name,
        sensorType: values.sensor,
        conditionOperator: isScheduleRule ? "time" : values.operator,
        thresholdValue: isScheduleRule ? 0 : values.value,
        actionDevice: values.action.split("-")[0],
        actionStatus: values.action.split("-")[1] === "on",
        isActive: values.isActive,
      }
      
      // Thêm thông tin lập lịch nếu cần
      if (isScheduleRule) {
        if (!values.scheduleTime || !values.scheduleType) {
          throw new Error("Thời gian và loại lịch là bắt buộc cho quy tắc lập lịch");
        }
        
        payload.scheduleTime = values.scheduleTime;
        payload.scheduleType = values.scheduleType;
        
        if (values.scheduleType === "weekly" && values.scheduleDay !== undefined) {
          payload.scheduleDay = values.scheduleDay;
        }
        
        if (values.scheduleType === "once" && values.scheduleDate) {
          payload.scheduleDate = values.scheduleDate.toISOString();
        }
      }

      await deviceService.createAutomationRule(values.deviceId, payload)
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] })
      toast({
        title: t.toasts.success,
      })
    } catch (error) {
      console.error("Create rule error:", error)
      toast({
        title: t.toasts.error,
        variant: "destructive",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsLoading(false)
    }
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
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{t.condition}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltips.condition}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {watchSensor !== "schedule" ? (
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sensor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sensor}</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset schedule fields if not schedule
                      if (value !== "schedule") {
                        form.setValue("scheduleType", undefined);
                        form.setValue("scheduleTime", undefined);
                        form.setValue("scheduleDay", undefined);
                        form.setValue("scheduleDate", undefined);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "en" ? "Select sensor" : "Chọn cảm biến"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="temperature">{t.sensors.temperature}</SelectItem>
                        <SelectItem value="humidity">{t.sensors.humidity}</SelectItem>
                        <SelectItem value="soilMoisture">{t.sensors.soilMoisture}</SelectItem>
                        <SelectItem value="lightLevel">{t.sensors.lightLevel}</SelectItem>
                        <SelectItem value="schedule">
                          {t.sensors.schedule}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {language === "en" ? "(Time-based trigger)" : "(Kích hoạt theo thời gian)"}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchSensor === "schedule" && (
                        <span className="text-sm text-muted-foreground">
                          {language === "en" 
                            ? "Schedule option allows you to trigger actions based on time rather than sensor values" 
                            : "Tùy chọn Lịch cho phép bạn kích hoạt hành động dựa trên thời gian thay vì giá trị cảm biến"}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.operator}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "en" ? "Select operator" : "Chọn toán tử"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=">">{">"}</SelectItem>
                        <SelectItem value="<">{"<"}</SelectItem>
                        <SelectItem value="=">{"="}</SelectItem>
                        <SelectItem value=">=">{">="}</SelectItem>
                        <SelectItem value="<=">{"<="}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.value}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.scheduleType}</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset date/day based on schedule type
                      if (value === "once") {
                        form.setValue("scheduleDay", undefined);
                      } else if (value === "daily") {
                        form.setValue("scheduleDay", undefined);
                        form.setValue("scheduleDate", undefined);
                      } else if (value === "weekly") {
                        form.setValue("scheduleDate", undefined);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "en" ? "Select schedule type" : "Chọn loại lịch"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">{t.scheduleTypes.once}</SelectItem>
                        <SelectItem value="daily">{t.scheduleTypes.daily}</SelectItem>
                        <SelectItem value="weekly">{t.scheduleTypes.weekly}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchScheduleType === "weekly" && (
                <FormField
                  control={form.control}
                  name="scheduleDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "en" ? "Day of Week" : "Ngày trong tuần"}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={language === "en" ? "Select day" : "Chọn ngày"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">{language === "en" ? "Sunday" : "Chủ nhật"}</SelectItem>
                          <SelectItem value="1">{language === "en" ? "Monday" : "Thứ hai"}</SelectItem>
                          <SelectItem value="2">{language === "en" ? "Tuesday" : "Thứ ba"}</SelectItem>
                          <SelectItem value="3">{language === "en" ? "Wednesday" : "Thứ tư"}</SelectItem>
                          <SelectItem value="4">{language === "en" ? "Thursday" : "Thứ năm"}</SelectItem>
                          <SelectItem value="5">{language === "en" ? "Friday" : "Thứ sáu"}</SelectItem>
                          <SelectItem value="6">{language === "en" ? "Saturday" : "Thứ bảy"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchScheduleType === "once" && (
                <FormField
                  control={form.control}
                  name="scheduleDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{language === "en" ? "Date" : "Ngày"}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{language === "en" ? "Pick a date" : "Chọn ngày"}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
          )}
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
                    <SelectValue placeholder={language === "en" ? "Select action" : "Chọn hành động"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fan-on">Bật quạt</SelectItem>
                  <SelectItem value="fan-off">Tắt quạt</SelectItem>
                  <SelectItem value="led-on">Bật đèn LED</SelectItem>
                  <SelectItem value="led-off">Tắt đèn LED</SelectItem>
                  <SelectItem value="waterPump-on">Bật máy bơm nước</SelectItem>
                  <SelectItem value="waterPump-off">Tắt máy bơm nước</SelectItem>
                  <SelectItem value="nutrientPump-on">Bật máy bơm dinh dưỡng</SelectItem>
                  <SelectItem value="nutrientPump-off">Tắt máy bơm dinh dưỡng</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === "en" ? "Saving..." : "Đang lưu..."}
            </>
          ) : (
            t.save
          )}
        </Button>
      </form>
    </Form>
  )
}


"use client"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Settings2, Loader2, Wifi, WifiOff, Clock, RefreshCw, HelpCircle, QrCode, Keyboard } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceService, Device } from "@/lib/services/device"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
// @ts-ignore
import jsQR from "jsqr"
import { useRouter } from "next/navigation"

const translations = {
  en: {
    addGarden: "Add Garden",
    newGarden: "New Garden",
    serial: "WEMOS Serial",
    apiKey: "API Key",
    serialDesc: "Enter the 6-character serial number",
    apiKeyDesc: "Enter the 5-character API key",
    connect: "Connect Garden",
    connecting: "Connecting...",
    gardenList: "Connected Gardens",
    name: "Garden Name",
    status: "Status",
    online: "Online",
    offline: "Offline",
    actions: "Actions",
    settings: "Settings",
    lastConnected: "Last Connected",
    never: "Never",
    ago: "ago",
    deviceInfo: "Device Information",
    sensorData: "Sensor Data",
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    lightLevel: "Light Level",
    noData: "No sensor data available",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    deviceSettings: "Device Settings",
    deviceSettingsDesc: "Configure your garden device",
    ledControl: "LED Light",
    fanControl: "Fan",
    waterPumpControl: "Water Pump",
    nutrientPumpControl: "Nutrient Pump",
    on: "On",
    off: "Off",
    saveSettings: "Save Settings",
    saving: "Saving...",
    settingsSaved: "Settings saved",
    connectionStatus: "Connection Status",
    wifiStrength: "WiFi Strength",
    batteryLevel: "Battery Level",
    firmwareVersion: "Firmware Version",
    unknown: "Unknown",
    helpGuide: "Connection Guide",
    connectionGuide: "Device Connection Guide",
    step1: "Step 1: Prepare your Wemos D1 device",
    step1Desc: "Make sure your Wemos D1 is properly connected to the Arduino Uno and all sensors are correctly wired.",
    step2: "Step 2: Upload the firmware",
    step2Desc: "Upload the provided firmware to your Wemos D1 using the Arduino IDE. Make sure to update the device serial and API key in the code.",
    step3: "Step 3: Register your device",
    step3Desc: "Click the 'Add Garden' button and enter the 6-character serial number and 5-character API key that you set in the firmware.",
    step4: "Step 4: Power on the device",
    step4Desc: "Power on your Wemos D1 device. It will automatically connect to your WiFi network and start sending data to the server.",
    step5: "Step 5: Check connection status",
    step5Desc: "After a few moments, your device should appear as 'Online' in the garden list. You can click the settings icon to view sensor data and control the device.",
    close: "Close",
    scanQrCode: "Scan QR Code",
    manualEntry: "Manual Entry",
    scanQrDesc: "Scan the QR code on your Wemos D1 device",
    scanningQr: "Scanning QR code...",
    qrNotSupported: "QR code scanning is not supported on this device",
    qrGenerator: "QR Code Generator",
    qrGeneratorDesc: "Generate a QR code for your Wemos D1 device",
  },
  vi: {
    addGarden: "Thêm Vườn",
    newGarden: "Vườn Mới",
    serial: "Serial WEMOS",
    apiKey: "Khóa API",
    serialDesc: "Nhập số serial 6 ký tự",
    apiKeyDesc: "Nhập khóa API 5 ký tự",
    connect: "Kết nối Vườn",
    connecting: "Đang kết nối...",
    gardenList: "Vườn đã Kết nối",
    name: "Tên Vườn",
    status: "Trạng thái",
    online: "Hoạt động",
    offline: "Ngắt kết nối",
    actions: "Thao tác",
    settings: "Cài đặt",
    lastConnected: "Kết nối lần cuối",
    never: "Chưa bao giờ",
    ago: "trước",
    deviceInfo: "Thông tin Thiết bị",
    sensorData: "Dữ liệu Cảm biến",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
    soilMoisture: "Độ ẩm đất",
    lightLevel: "Cường độ ánh sáng",
    noData: "Không có dữ liệu cảm biến",
    refresh: "Làm mới",
    refreshing: "Đang làm mới...",
    deviceSettings: "Cài đặt Thiết bị",
    deviceSettingsDesc: "Cấu hình thiết bị vườn của bạn",
    ledControl: "Đèn LED",
    fanControl: "Quạt",
    waterPumpControl: "Bơm nước",
    nutrientPumpControl: "Bơm dinh dưỡng",
    on: "Bật",
    off: "Tắt",
    saveSettings: "Lưu cài đặt",
    saving: "Đang lưu...",
    settingsSaved: "Đã lưu cài đặt",
    connectionStatus: "Trạng thái kết nối",
    wifiStrength: "Cường độ WiFi",
    batteryLevel: "Mức pin",
    firmwareVersion: "Phiên bản firmware",
    unknown: "Không xác định",
    helpGuide: "Hướng dẫn Kết nối",
    connectionGuide: "Hướng dẫn Kết nối Thiết bị",
    step1: "Bước 1: Chuẩn bị thiết bị Wemos D1",
    step1Desc: "Đảm bảo Wemos D1 của bạn được kết nối đúng cách với Arduino Uno và tất cả các cảm biến được đấu dây chính xác.",
    step2: "Bước 2: Tải firmware",
    step2Desc: "Tải firmware được cung cấp lên Wemos D1 của bạn bằng Arduino IDE. Đảm bảo cập nhật số serial và khóa API của thiết bị trong mã.",
    step3: "Bước 3: Đăng ký thiết bị",
    step3Desc: "Nhấp vào nút 'Thêm Vườn' và nhập số serial 6 ký tự và khóa API 5 ký tự mà bạn đã đặt trong firmware.",
    step4: "Bước 4: Bật nguồn thiết bị",
    step4Desc: "Bật nguồn thiết bị Wemos D1 của bạn. Nó sẽ tự động kết nối với mạng WiFi của bạn và bắt đầu gửi dữ liệu đến máy chủ.",
    step5: "Bước 5: Kiểm tra trạng thái kết nối",
    step5Desc: "Sau vài giây, thiết bị của bạn sẽ hiển thị trạng thái 'Hoạt động' trong danh sách vườn. Bạn có thể nhấp vào biểu tượng cài đặt để xem dữ liệu cảm biến và điều khiển thiết bị.",
    close: "Đóng",
    scanQrCode: "Quét mã QR",
    manualEntry: "Nhập thủ công",
    scanQrDesc: "Quét mã QR trên thiết bị Wemos D1 của bạn",
    scanningQr: "Đang quét mã QR...",
    qrNotSupported: "Thiết bị này không hỗ trợ quét mã QR",
    qrGenerator: "Tạo mã QR",
    qrGeneratorDesc: "Tạo mã QR cho thiết bị Wemos D1 của bạn",
  },
}

const formSchema = z.object({
  serial: z.string().length(6, "Serial must be exactly 6 characters"),
  apiKey: z.string().length(5, "API key must be exactly 5 characters"),
})

export function GardenManager() {
  const { language } = useLanguage()
  const t = translations[language]
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")
  const [qrScanning, setQrScanning] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  // Kiểm tra nếu thiết bị là màn hình nhỏ (điện thoại/tablet)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const router = useRouter()

  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAllDevices(),
    refetchInterval: 30000
  })

  const { data: selectedDeviceData } = useQuery({
    queryKey: ['device', selectedDevice],
    queryFn: () => selectedDevice ? deviceService.getDevice(selectedDevice) : null,
    enabled: !!selectedDevice,
    refetchInterval: 10000,
  })

  const { data: sensorData } = useQuery({
    queryKey: ['sensorData', selectedDevice],
    queryFn: () => selectedDevice ? deviceService.getSensorData(selectedDevice, undefined, undefined, 1) : [],
    enabled: !!selectedDevice,
    refetchInterval: 10000,
  })

  const toggleMutation = useMutation({
    mutationFn: (params: { deviceId: string; enabled: boolean }) =>
      deviceService.updateDevice(params.deviceId, { status: params.enabled ? 'active' : 'inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })

  const controlMutation = useMutation({
    mutationFn: (params: { deviceId: string; data: any }) =>
      deviceService.controlDevice(params.deviceId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', selectedDevice] })
      setIsSaving(false)
    },
    onError: () => {
      setIsSaving(false)
    }
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial: "",
      apiKey: "",
    },
  })

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ deviceId: id, enabled: !currentStatus })
  }

  const handleRefresh = () => {
    if (selectedDevice) {
      setIsRefreshing(true)
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['device', selectedDevice] }),
        queryClient.invalidateQueries({ queryKey: ['sensorData', selectedDevice] })
      ]).finally(() => {
        setIsRefreshing(false)
      })
    }
  }

  const handleDeviceControl = (deviceId: string, data: any) => {
    setIsSaving(true)
    controlMutation.mutate({ deviceId, data })
  }

  const formatLastConnected = (date: Date | null | undefined) => {
    if (!date) return t.never
    const locale = language === 'vi' ? vi : enUS
    return `${formatDistanceToNow(new Date(date), { addSuffix: true, locale })}`;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await deviceService.createDevice({
        wemosSerial: values.serial,
        name: `Garden Sensor ${devices.length + 1}`,
      })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      form.reset()
    } catch (error) {
      console.warn('Error adding device:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý khi đóng dialog thêm vườn
  useEffect(() => {
    if (!isAddDialogOpen && cameraStream) {
      // Dừng camera khi đóng dialog
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [isAddDialogOpen, cameraStream]);

  // Xử lý khi quét được mã QR
  const handleQrCodeScanned = (result: string) => {
    try {
      // Giả sử định dạng QR là "SERIAL:APIKEY"
      const [serial, apiKey] = result.split(':');
      if (serial && apiKey && serial.length === 6 && apiKey.length === 5) {
        form.setValue('serial', serial);
        form.setValue('apiKey', apiKey);
        setActiveTab("manual"); // Chuyển sang tab nhập thủ công để xem kết quả
      }
    } catch (error) {
      console.warn('Error parsing QR code:', error);
    }
  };

  // Bắt đầu quét mã QR
  const startQrScanner = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia is not supported');
      return;
    }

    try {
      setQrScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setHasCameraPermission(true);
      
      // Kết nối stream với video element
      const videoElement = document.getElementById('qr-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
        
        // Bắt đầu quét mã QR
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Hàm quét mã QR
        const scanQRCode = () => {
          if (!videoElement || !context || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanQRCode);
            return;
          }
          
          // Thiết lập kích thước canvas bằng với video
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          
          // Vẽ frame hiện tại từ video lên canvas
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Lấy dữ liệu hình ảnh
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Quét mã QR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            // Đã tìm thấy mã QR
            console.log("QR code detected:", code.data);
            handleQrCodeScanned(code.data);
            setQrScanning(false);
            
            // Dừng camera
            if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
              setCameraStream(null);
            }
            
            return;
          }
          
          // Tiếp tục quét
          if (qrScanning) {
            requestAnimationFrame(scanQRCode);
          }
        };
        
        // Bắt đầu quét
        scanQRCode();
      }
    } catch (error) {
      console.warn('Error accessing camera:', error);
      setHasCameraPermission(false);
      setQrScanning(false);
    }
  };

  // Xử lý lỗi riêng biệt
  useEffect(() => {
    if (devicesError) {
      console.warn('Error fetching devices:', devicesError);
      if ((devicesError as any).response?.status === 401) {
        // Token không hợp lệ, chuyển hướng đến trang đăng nhập
        router.push('/login');
      }
    }
  }, [devicesError, router]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t.gardenList}</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            {t.helpGuide}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.addGarden}
          </Button>
        </div>
      </div>

      {/* Dialog thêm vườn mới với hỗ trợ quét mã QR */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newGarden}</DialogTitle>
          </DialogHeader>
          
          {isMobile ? (
            <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">
                  <Keyboard className="mr-2 h-4 w-4" />
                  {t.manualEntry}
                </TabsTrigger>
                <TabsTrigger value="qr">
                  <QrCode className="mr-2 h-4 w-4" />
                  {t.scanQrCode}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="serial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.serial}</FormLabel>
                          <FormControl>
                            <Input {...field} maxLength={6} />
                          </FormControl>
                          <FormDescription>{t.serialDesc}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.apiKey}</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" maxLength={5} />
                          </FormControl>
                          <FormDescription>{t.apiKeyDesc}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? t.connecting : t.connect}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="qr">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t.scanQrDesc}</p>
                  
                  <div className="flex justify-center">
                    {qrScanning ? (
                      <div className="relative w-full aspect-square max-w-[300px] bg-muted rounded-md overflow-hidden">
                        {hasCameraPermission ? (
                          <>
                            <video 
                              id="qr-video" 
                              className="w-full h-full object-cover"
                              autoPlay 
                              playsInline
                              muted
                            />
                            <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-8 pointer-events-none"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                            {t.qrNotSupported}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button onClick={startQrScanner} className="w-full max-w-[300px] h-12">
                        <QrCode className="mr-2 h-4 w-4" />
                        {t.scanQrCode}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="serial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.serial}</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={6} />
                      </FormControl>
                      <FormDescription>{t.serialDesc}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.apiKey}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" maxLength={5} />
                      </FormControl>
                      <FormDescription>{t.apiKeyDesc}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? t.connecting : t.connect}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.serial}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.lastConnected}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.wemosSerial}</TableCell>
                <TableCell>
                  <Badge variant={device.status === 'active' ? "default" : "secondary"}>
                    {device.status === 'active' ? t.online : t.offline}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {formatLastConnected(device.lastConnected)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedDevice(device.id)
                              setIsSettingsOpen(true)
                            }}
                          >
                            <Settings2 className="h-4 w-4" />
                            <span className="sr-only">{t.settings}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.settings}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Switch 
                      checked={device.status === 'active'} 
                      onCheckedChange={() => handleToggle(device.id, device.status === 'active')} 
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedDevice && isSettingsOpen && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedDeviceData?.name} - {t.deviceSettings}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t.deviceInfo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t.serial}:</span>
                    <span className="font-medium">{selectedDeviceData?.wemosSerial}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.status}:</span>
                    <Badge variant={selectedDeviceData?.status === 'active' ? "default" : "secondary"}>
                      {selectedDeviceData?.status === 'active' ? t.online : t.offline}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.lastConnected}:</span>
                    <span className="font-medium">{formatLastConnected(selectedDeviceData?.lastConnected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.firmwareVersion}:</span>
                    <span className="font-medium">{selectedDeviceData?.firmwareVersion || t.unknown}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.refreshing}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t.refresh}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.sensorData}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sensorData && sensorData.length > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span>{t.temperature}:</span>
                        <span className="font-medium">{sensorData[0].temperature?.toFixed(1)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.humidity}:</span>
                        <span className="font-medium">{sensorData[0].humidity?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.soilMoisture}:</span>
                        <span className="font-medium">{sensorData[0].soilMoisture?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.lightLevel}:</span>
                        <span className="font-medium">{sensorData[0].lightLevel?.toFixed(1)} lux</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {t.noData}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t.deviceSettings}</CardTitle>
                  <CardDescription>{t.deviceSettingsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <label htmlFor="led-control" className="flex items-center space-x-2">
                        <span>{t.ledControl}</span>
                      </label>
                      <Switch 
                        id="led-control"
                        checked={selectedDeviceData?.deviceStatus?.[0]?.ledStatus || false}
                        onCheckedChange={(checked) => 
                          handleDeviceControl(selectedDevice, { ledStatus: checked })
                        }
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <label htmlFor="fan-control" className="flex items-center space-x-2">
                        <span>{t.fanControl}</span>
                      </label>
                      <Switch 
                        id="fan-control"
                        checked={selectedDeviceData?.deviceStatus?.[0]?.fanStatus || false}
                        onCheckedChange={(checked) => 
                          handleDeviceControl(selectedDevice, { fanStatus: checked })
                        }
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <label htmlFor="water-pump-control" className="flex items-center space-x-2">
                        <span>{t.waterPumpControl}</span>
                      </label>
                      <Switch 
                        id="water-pump-control"
                        checked={selectedDeviceData?.deviceStatus?.[0]?.waterPumpStatus || false}
                        onCheckedChange={(checked) => 
                          handleDeviceControl(selectedDevice, { waterPumpStatus: checked })
                        }
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <label htmlFor="nutrient-pump-control" className="flex items-center space-x-2">
                        <span>{t.nutrientPumpControl}</span>
                      </label>
                      <Switch 
                        id="nutrient-pump-control"
                        checked={selectedDeviceData?.deviceStatus?.[0]?.nutrientPumpStatus || false}
                        onCheckedChange={(checked) => 
                          handleDeviceControl(selectedDevice, { nutrientPumpStatus: checked })
                        }
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      {selectedDeviceData?.status === 'active' ? (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Wifi className="h-3 w-3" />
                          <span>{t.connectionStatus}: {t.online}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <WifiOff className="h-3 w-3" />
                          <span>{t.connectionStatus}: {t.offline}</span>
                        </Badge>
                      )}
                    </div>
                    <Button 
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      {t.saveSettings}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Connection Guide Dialog */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.connectionGuide}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t.step1}</h3>
              <p className="text-muted-foreground">{t.step1Desc}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t.step2}</h3>
              <p className="text-muted-foreground">{t.step2Desc}</p>
              <div className="flex space-x-4 mt-2">
                <a 
                  href="/wemos-firmware.ino" 
                  download="GardenAI_Wemos_Firmware.ino"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Tải mã nguồn Wemos D1
                </a>
                <a 
                  href="/arduino-firmware.ino" 
                  download="GardenAI_Arduino_Firmware.ino"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Tải mã nguồn Arduino Uno
                </a>
              </div>
              <div className="bg-muted p-4 rounded-md mt-2">
                <p className="text-sm font-medium mb-2">Lưu ý quan trọng:</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Cập nhật thông tin WiFi, Serial và API Key trong mã nguồn Wemos D1</li>
                  <li>Cập nhật URL API để trỏ đến máy chủ của bạn</li>
                  <li>Cài đặt các thư viện cần thiết: ESP8266WiFi, ESP8266HTTPClient, ArduinoJson, DHT</li>
                  <li>Kiểm tra kết nối phần cứng giữa Wemos D1 và Arduino Uno</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t.step3}</h3>
              <p className="text-muted-foreground">{t.step3Desc}</p>
              <div className="mt-2">
                <a 
                  href="/qr-generator.html" 
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {t.qrGenerator}
                </a>
                <p className="text-xs text-muted-foreground mt-2">{t.qrGeneratorDesc}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t.step4}</h3>
              <p className="text-muted-foreground">{t.step4Desc}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t.step5}</h3>
              <p className="text-muted-foreground">{t.step5Desc}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsGuideOpen(false)}>{t.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


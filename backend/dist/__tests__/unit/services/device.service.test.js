"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../../setup");
const device_1 = require("../../../services/device");
describe('DeviceService', () => {
    describe('getAllDevices', () => {
        it('should return all devices for a user', async () => {
            const mockDevices = [
                {
                    id: '1',
                    userId: 'user-1',
                    wemosSerial: 'TEST001',
                    name: 'Test Device 1',
                    apiKey: 'test-key',
                    location: null,
                    status: 'active',
                    lastConnected: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deviceStatus: [{
                            fanStatus: true,
                            ledStatus: false,
                            waterPumpStatus: true,
                            nutrientPumpStatus: false
                        }]
                }
            ];
            setup_1.prismaMock.garden.findMany.mockResolvedValue(mockDevices);
            const result = await device_1.deviceService.getAllDevices('user-1');
            expect(result).toEqual(mockDevices);
            expect(setup_1.prismaMock.garden.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                include: {
                    deviceStatus: {
                        take: 1,
                        orderBy: { updatedAt: 'desc' }
                    }
                }
            });
        });
        it('should return empty array when no devices found', async () => {
            setup_1.prismaMock.garden.findMany.mockResolvedValue([]);
            const result = await device_1.deviceService.getAllDevices('user-1');
            expect(result).toEqual([]);
        });
    });
    describe('getDevice', () => {
        it('should return a single device with details', async () => {
            const mockDevice = {
                id: '1',
                userId: 'user-1',
                wemosSerial: 'TEST001',
                name: 'Test Device 1',
                apiKey: 'test-key',
                location: null,
                status: 'active',
                lastConnected: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                deviceStatus: [{
                        fanStatus: true,
                        ledStatus: false,
                        waterPumpStatus: true,
                        nutrientPumpStatus: false
                    }]
            };
            setup_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            const result = await device_1.deviceService.getDevice('1', 'user-1');
            expect(result).toEqual(mockDevice);
            expect(setup_1.prismaMock.garden.findUnique).toHaveBeenCalledWith({
                where: {
                    id: '1',
                    userId: 'user-1'
                },
                include: {
                    deviceStatus: {
                        take: 1,
                        orderBy: { updatedAt: 'desc' }
                    },
                    sensorData: {
                        take: 1,
                        orderBy: { recordedAt: 'desc' }
                    }
                }
            });
        });
        it('should throw error when device not found', async () => {
            setup_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            await expect(device_1.deviceService.getDevice('1', 'user-1')).rejects.toThrow('Device not found');
        });
    });
});
//# sourceMappingURL=device.service.test.js.map
/*
  Warnings:

  - You are about to alter the column `temperature` on the `SensorData` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(4,2)`.
  - You are about to alter the column `humidity` on the `SensorData` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(4,2)`.
  - You are about to alter the column `lightLevel` on the `SensorData` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(6,2)`.
  - You are about to alter the column `soilMoisture` on the `SensorData` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(4,2)`.

*/
-- AlterTable
ALTER TABLE "AIReport" ADD COLUMN     "reportFormat" TEXT NOT NULL DEFAULT 'PDF',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';

-- AlterTable
ALTER TABLE "AutomationRule" ADD COLUMN     "delayTime" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "lastExecuted" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduleDate" TIMESTAMP(3),
ADD COLUMN     "scheduleDay" INTEGER,
ADD COLUMN     "scheduleTime" TEXT,
ADD COLUMN     "scheduleType" TEXT;

-- AlterTable
ALTER TABLE "Garden" ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "firmwareVersion" TEXT;

-- AlterTable
ALTER TABLE "ReportSchedule" ADD COLUMN     "lastSent" TIMESTAMP(3),
ADD COLUMN     "nextScheduledSend" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SensorData" ALTER COLUMN "temperature" SET DATA TYPE DECIMAL(4,2),
ALTER COLUMN "humidity" SET DATA TYPE DECIMAL(4,2),
ALTER COLUMN "lightLevel" SET DATA TYPE DECIMAL(6,2),
ALTER COLUMN "soilMoisture" SET DATA TYPE DECIMAL(4,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "AIAlert" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "optimalTemperatureMin" DOUBLE PRECISION NOT NULL,
    "optimalTemperatureMax" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMin" DOUBLE PRECISION NOT NULL,
    "optimalHumidityMax" DOUBLE PRECISION NOT NULL,
    "optimalSoilMoistureMin" DOUBLE PRECISION NOT NULL,
    "optimalSoilMoistureMax" DOUBLE PRECISION NOT NULL,
    "optimalLightLevelMin" DOUBLE PRECISION NOT NULL,
    "optimalLightLevelMax" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantGarden" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "plantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "PlantGarden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceStatusHistory" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "fanStatus" BOOLEAN NOT NULL,
    "ledStatus" BOOLEAN NOT NULL,
    "nutrientPumpStatus" BOOLEAN NOT NULL,
    "waterPumpStatus" BOOLEAN NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_gardenId_createdAt_idx" ON "SystemLog"("gardenId", "createdAt");

-- CreateIndex
CREATE INDEX "DeviceStatusHistory_gardenId_changedAt_idx" ON "DeviceStatusHistory"("gardenId", "changedAt");

-- CreateIndex
CREATE INDEX "SensorData_gardenId_recordedAt_idx" ON "SensorData"("gardenId", "recordedAt");

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantGarden" ADD CONSTRAINT "PlantGarden_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantGarden" ADD CONSTRAINT "PlantGarden_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceStatusHistory" ADD CONSTRAINT "DeviceStatusHistory_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

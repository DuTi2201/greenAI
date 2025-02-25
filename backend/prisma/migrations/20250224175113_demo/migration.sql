/*
  Warnings:

  - You are about to drop the `ai_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `automation_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gardens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sensor_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_reports" DROP CONSTRAINT "ai_reports_garden_id_fkey";

-- DropForeignKey
ALTER TABLE "automation_rules" DROP CONSTRAINT "automation_rules_garden_id_fkey";

-- DropForeignKey
ALTER TABLE "device_status" DROP CONSTRAINT "device_status_garden_id_fkey";

-- DropForeignKey
ALTER TABLE "gardens" DROP CONSTRAINT "gardens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "report_schedules" DROP CONSTRAINT "report_schedules_garden_id_fkey";

-- DropForeignKey
ALTER TABLE "report_schedules" DROP CONSTRAINT "report_schedules_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sensor_data" DROP CONSTRAINT "sensor_data_garden_id_fkey";

-- DropForeignKey
ALTER TABLE "system_logs" DROP CONSTRAINT "system_logs_garden_id_fkey";

-- DropTable
DROP TABLE "ai_reports";

-- DropTable
DROP TABLE "automation_rules";

-- DropTable
DROP TABLE "device_status";

-- DropTable
DROP TABLE "gardens";

-- DropTable
DROP TABLE "report_schedules";

-- DropTable
DROP TABLE "sensor_data";

-- DropTable
DROP TABLE "system_logs";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "themePreference" TEXT NOT NULL DEFAULT 'light',
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garden" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wemosSerial" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastConnected" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorData" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "lightLevel" DOUBLE PRECISION NOT NULL,
    "soilMoisture" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceStatus" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "fanStatus" BOOLEAN NOT NULL DEFAULT false,
    "ledStatus" BOOLEAN NOT NULL DEFAULT false,
    "nutrientPumpStatus" BOOLEAN NOT NULL DEFAULT false,
    "waterPumpStatus" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "actionDevice" TEXT NOT NULL,
    "actionStatus" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "actionStatus" BOOLEAN NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReport" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "analysisPeriodStart" TIMESTAMP(3) NOT NULL,
    "analysisPeriodEnd" TIMESTAMP(3) NOT NULL,
    "geminiModelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "timeOfDay" TIMESTAMP(3) NOT NULL,
    "emailRecipient" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Garden_wemosSerial_key" ON "Garden"("wemosSerial");

-- CreateIndex
CREATE UNIQUE INDEX "Garden_apiKey_key" ON "Garden"("apiKey");

-- AddForeignKey
ALTER TABLE "Garden" ADD CONSTRAINT "Garden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceStatus" ADD CONSTRAINT "DeviceStatus_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "full_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "password_hash" TEXT NOT NULL,
    "preferred_language" TEXT NOT NULL DEFAULT 'vi',
    "theme_preference" TEXT NOT NULL DEFAULT 'light',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardens" (
    "id" UUID NOT NULL,
    "wemos_serial" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_connected" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_data" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "soil_moisture" DOUBLE PRECISION,
    "light_level" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_status" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "fan_status" BOOLEAN NOT NULL DEFAULT false,
    "led_status" BOOLEAN NOT NULL DEFAULT false,
    "nutrient_pump_status" BOOLEAN NOT NULL DEFAULT false,
    "water_pump_status" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "sensor_type" TEXT NOT NULL,
    "condition_operator" TEXT NOT NULL,
    "threshold_value" DOUBLE PRECISION NOT NULL,
    "action_device" TEXT NOT NULL,
    "action_status" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "analysis_period_start" TIMESTAMP(3) NOT NULL,
    "analysis_period_end" TIMESTAMP(3) NOT NULL,
    "gemini_model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "frequency" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "time_of_day" TIMESTAMP(3) NOT NULL,
    "email_recipient" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gardens_wemos_serial_key" ON "gardens"("wemos_serial");

-- AddForeignKey
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

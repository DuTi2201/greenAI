export interface AIReport {
  id: string;
  gardenId: string;
  reportType: string;
  result: {
    summary: string;
    recommendations: string[];
    alerts: string[];
    healthScore: number;
  };
  analysisPeriodStart: string;
  analysisPeriodEnd: string;
  geminiModelVersion: string;
  status: string;
  reportFormat: string;
  createdAt: string;
}

export interface ReportSchedule {
  id: string;
  userId: string;
  gardenId: string;
  frequency: string;
  dayOfWeek: number | null;
  timeOfDay: string;
  emailRecipient: string;
  reportType: string;
  isActive: boolean;
  lastSent: string | null;
  nextScheduledSend: string | null;
  createdAt: string;
  updatedAt: string;
} 
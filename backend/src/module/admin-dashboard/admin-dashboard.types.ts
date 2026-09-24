import { AppointmentRequestStatus } from "../../generated/prisma/enums";

export type DashboardMetricSummary = {
  totalAppointments: number;
  pendingRequests: number;
  totalPatients: number;
  totalDoctors: number;
  newEnquiries: number;
};

export type DashboardAppointmentRequest = {
  referenceId: string;
  parentName: string;
  childName: string;
  childAge: string;
  preferredDate: string;
  preferredTime: string | null;
  status: AppointmentRequestStatus;
};

export type DashboardScheduleSummary = {
  total: number;
  requested: number;
  assigned: number;
  completed: number;
  cancelled: number;
  range: {
    period: "TODAY" | "LAST_7_DAYS" | "LAST_15_DAYS" | "THIS_MONTH" | "CUSTOM";
    fromDate: string;
    toDate: string;
    label: string;
  };
};

export type DashboardActivity = {
  id: string;
  type: "APPOINTMENT" | "CONTACT";
  message: string;
  createdAt: string;
};

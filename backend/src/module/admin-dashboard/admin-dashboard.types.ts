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
  preferredTime: string;
  status: AppointmentRequestStatus;
};

export type DashboardScheduleSummary = {
  total: number;
  requested: number;
  assigned: number;
  completed: number;
  cancelled: number;
};

export type DashboardActivity = {
  id: string;
  type: "APPOINTMENT_REQUEST" | "CONTACT_ENQUIRY";
  message: string;
  createdAt: string;
};

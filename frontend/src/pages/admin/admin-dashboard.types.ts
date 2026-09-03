import { AuthenticatedUser } from "../login/login.types";

export type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type DashboardData = {
  admin: AuthenticatedUser;
  metrics: {
    totalAppointments: number;
    pendingRequests: number;
    totalPatients: number;
    totalDoctors: number;
    newEnquiries: number;
  };
  appointmentRequests: Array<{
    referenceId: string;
    parentName: string;
    childName: string;
    childAge: string;
    preferredDate: string;
    preferredTime: string;
    status: AppointmentStatus;
  }>;
  todaySchedule: {
    total: number;
    requested: number;
    assigned: number;
    completed: number;
    cancelled: number;
  };
  recentActivities: Array<{
    id: string;
    type: "APPOINTMENT_REQUEST" | "CONTACT_ENQUIRY";
    message: string;
    createdAt: string;
  }>;
};

export type DashboardResponse = { success: boolean; message?: string; data?: DashboardData };
export type SessionResponse = { success: boolean; data?: AuthenticatedUser };

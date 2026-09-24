import { AuthenticatedUser } from "../login/login.types";

export type AppointmentStatus =
  "REQUESTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export type SchedulePeriod =
  "TODAY" | "LAST_7_DAYS" | "LAST_15_DAYS" | "THIS_MONTH" | "CUSTOM";

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
    preferredTime: string | null;
    status: AppointmentStatus;
  }>;
  todaySchedule: {
    total: number;
    requested: number;
    assigned: number;
    completed: number;
    cancelled: number;
    range: {
      period: SchedulePeriod;
      fromDate: string;
      toDate: string;
      label: string;
    };
  };
  recentActivities: Array<{
    id: string;
    type: "APPOINTMENT" | "CONTACT";
    message: string;
    createdAt: string;
  }>;
};

export type DashboardResponse = {
  success: boolean;
  message?: string;
  data?: DashboardData;
};
export type SessionResponse = { success: boolean; data?: AuthenticatedUser };

export type AdminSearchResults = {
  query: string;
  totalResults: number;
  patients: Array<{
    patientId: string;
    patientName: string;
    parentName: string;
    primaryPhone: string;
    isActive: boolean;
  }>;
  appointments: Array<{
    referenceId: string;
    childName: string;
    parentName: string;
    status: string;
    preferredDate: string;
    preferredTime: string | null;
  }>;
  doctors: Array<{
    doctorId: string;
    loginId: string;
    firstName: string;
    lastName: string;
    designation: string;
    isActive: boolean;
  }>;
};

export type PerformancePeriod = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
export interface TrendPoint {
  label: string;
  appointments: number;
  completed: number;
}
export interface StatusPoint {
  status: "REQUESTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  count: number;
}
export interface PerformanceOverview {
  period: PerformancePeriod;
  range: { start: string; end: string };
  metrics: {
    totalAppointments: number;
    completedAppointments: number;
    newPatients: number;
    overallSatisfaction: number;
    completionRate: number;
    cancelledAppointments: number;
  };
  comparisons: {
    totalAppointments: number;
    completedAppointments: number;
    newPatients: number;
    overallSatisfaction: number;
  };
  appointmentTrend: TrendPoint[];
  appointmentsBySpecialization: Array<{
    specialization: string;
    count: number;
  }>;
  satisfactionTrend: Array<{ label: string; rating: number }>;
  statusDistribution: StatusPoint[];
}
export interface DoctorPerformanceListItem {
  doctorId: string;
  firstName: string;
  lastName: string;
  designation: string;
  assignedAppointments: number;
  completedAppointments: number;
  uniquePatients: number;
  completionRate: number;
}
export interface DoctorPerformance {
  doctor: {
    doctorId: string;
    firstName: string;
    lastName: string;
    designation: string;
    isActive: boolean;
  };
  period: PerformancePeriod;
  metrics: {
    assignedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    uniquePatients: number;
    completionRate: number;
    averageRating: number;
    feedbackResponses: number;
  };
  comparisons: { assignedAppointments: number; completedAppointments: number };
  appointmentTrend: TrendPoint[];
  statusDistribution: StatusPoint[];
}

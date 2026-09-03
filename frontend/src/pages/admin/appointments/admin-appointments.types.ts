export type AppointmentStatus = "REQUESTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type Appointment = {
  referenceId: string; patientId: string; parentName: string; childName: string; childAge: string;
  childDateOfBirth: string | null; phone: string; email: string; preferredDate: string; preferredTime: string;
  status: AppointmentStatus; scheduledDate: string | null; scheduledTime: string | null; assignmentNote: string | null;
  assignedDoctor: { doctorId: string; firstName: string; lastName: string; designation: string } | null;
  createdAt: string;
};
export type AppointmentSummary = { all: number; requested: number; assigned: number; completed: number; cancelled: number };
export type AppointmentDetail = { appointment: Appointment; patient: Record<string, unknown>; logs: Array<Record<string, any>>; caseHistory: Record<string, any> | null; previousAppointments: Appointment[] };
export type ApiResponse<T> = { success: boolean; message?: string; data?: T; errors?: Record<string, string[]> };

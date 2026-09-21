export type ContactRequestStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";
export type ContactFollowUpMethod = "CALL" | "WHATSAPP" | "EMAIL";

export interface ContactDoctor {
  doctorId: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export interface ContactRequest {
  referenceId: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: ContactRequestStatus;
  followUpMethod: ContactFollowUpMethod | null;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedDoctor: ContactDoctor | null;
  convertedAppointment: {
    referenceId: string;
    status: string;
    patient: { patientId: string };
  } | null;
}

export interface ContactActivity {
  event: string;
  previousStatus: ContactRequestStatus | null;
  newStatus: ContactRequestStatus | null;
  followUpMethod: ContactFollowUpMethod | null;
  note: string | null;
  createdAt: string;
  assignedDoctor: ContactDoctor | null;
  performedByAdmin: { fullName: string; loginId: string } | null;
}

export interface ContactRequestDetails extends ContactRequest {
  activities: ContactActivity[];
}

export interface ContactRequestSummary {
  all: number;
  new: number;
  inProgress: number;
  resolved: number;
}

export interface ContactRequestPage {
  items: ContactRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

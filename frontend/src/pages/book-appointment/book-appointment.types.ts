export interface AppointmentContent {
  hero: { title: string; tagline: string };
  help: { title: string; steps: Array<{ title: string; description: string }> };
  clinicHours: { weekdays: string; sunday: string };
  phone: string;
  email: string;
  timeSlots: string[];
  consentLabel: string;
  successMessage: string;
}

export interface AppointmentContentResponse { success: boolean; data: AppointmentContent; }

export interface AppointmentFormData {
  parentName: string;
  childName: string;
  childAge: string;
  childDateOfBirth: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  consent: boolean;
}

export interface AppointmentSubmitResponse {
  success: boolean;
  message: string;
  data?: { referenceId: string; patientId: string; status: string; receivedAt: string };
  errors?: Record<string, string[]>;
}

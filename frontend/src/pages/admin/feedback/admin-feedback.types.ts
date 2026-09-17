export type FeedbackModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EligibleAppointment {
  referenceId: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  feedbackInvitations: Array<{
    referenceId: string;
    status: string;
    response: {
      id: string;
      rating: number;
      moderationStatus: FeedbackModerationStatus;
      submittedAt: string;
    } | null;
  }>;
}

export interface EligiblePatient {
  patientId: string;
  patientName: string;
  parentName: string;
  primaryPhone: string;
  email: string | null;
  isActive: boolean;
  appointments: EligibleAppointment[];
}

export interface FeedbackShare {
  shortFeedbackLink: string;
  whatsappMessage: string;
  whatsappUrl: string;
}

export interface FeedbackInvitationResult {
  invitation: {
    referenceId: string;
    status: string;
    expiresAt: string;
    patient: EligiblePatient;
    appointment: { referenceId: string };
  };
  share: FeedbackShare;
}

export interface FeedbackResponse {
  id: string;
  rating: number;
  feedback: string;
  parentDisplayName: string;
  consentToPublish: boolean;
  moderationStatus: FeedbackModerationStatus;
  submittedAt: string;
  patient: { patientId: string; patientName: string; parentName: string };
  invitation: { referenceId: string };
}

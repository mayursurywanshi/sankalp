export type ClinicSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagramUrl: string;
  mapEmbedUrl: string;
  directionsUrl: string;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  workingDays: number[];
  maximumAdvanceBookingDays: number;
  feedbackExpiryHours: number;
  updatedAt?: string;
};

export type ContactLocationInput = Pick<
  ClinicSettings,
  | "phone"
  | "whatsapp"
  | "email"
  | "address"
  | "instagramUrl"
  | "mapEmbedUrl"
  | "directionsUrl"
>;
export type WorkingHoursInput = Pick<
  ClinicSettings,
  | "openingTime"
  | "closingTime"
  | "slotDurationMinutes"
  | "workingDays"
  | "maximumAdvanceBookingDays"
>;
export type FeedbackInput = Pick<ClinicSettings, "feedbackExpiryHours">;

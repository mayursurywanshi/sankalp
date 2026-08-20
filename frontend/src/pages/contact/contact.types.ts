export interface ContactDetail {
  id: string;
  label: string;
  value: string;
  href?: string;
}

export interface ContactContent {
  hero: { title: string; description: string };
  details: ContactDetail[];
  form: { title: string; successMessage: string };
  map: { embedUrl: string; label: string; directionsUrl: string };
}

export interface ContactResponse { success: boolean; data: ContactContent; }
export interface ContactFormData { name: string; phone: string; email: string; message: string; }
export interface ContactMessageResponse { success: boolean; message: string; data?: { referenceId: string; receivedAt: string }; errors?: Record<string, string[]>; }

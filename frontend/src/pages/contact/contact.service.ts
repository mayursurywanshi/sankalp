import { ContactFormData, ContactMessageResponse, ContactResponse } from "./contact.types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

export const getContactContent = async (): Promise<ContactResponse> => {
  const response = await fetch(`${API_URL}/api/contact`);
  if (!response.ok) throw new Error("Unable to load Contact page content.");
  return response.json() as Promise<ContactResponse>;
};

export const sendContactMessage = async (formData: ContactFormData): Promise<ContactMessageResponse> => {
  const response = await fetch(`${API_URL}/api/contact/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const result = await response.json() as ContactMessageResponse;
  if (!response.ok) throw result;
  return result;
};

import { ServicesResponse } from "./services.types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

export const getServicesContent = async (): Promise<ServicesResponse> => {
  const response = await fetch(`${API_URL}/api/services`);

  if (!response.ok) {
    throw new Error("Unable to load Services page content.");
  }

  return response.json() as Promise<ServicesResponse>;
};

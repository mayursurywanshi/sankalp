import { AboutResponse } from "./about.types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

export const getAboutContent = async (): Promise<AboutResponse> => {
  const response = await fetch(`${API_URL}/api/about`);

  if (!response.ok) {
    throw new Error("Unable to load About page content.");
  }

  return response.json() as Promise<AboutResponse>;
};

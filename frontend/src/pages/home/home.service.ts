import { HomeResponse } from "./home.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const getHomeContent = async (): Promise<HomeResponse> => {
  const response = await fetch(`${API_URL}/api/home`);
  if (!response.ok) throw new Error("Unable to load home page content.");
  return response.json() as Promise<HomeResponse>;
};

import { OurImpactResponse } from "./our-impact.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const getOurImpactContent = async (): Promise<OurImpactResponse> => {
  const response = await fetch(`${API_URL}/api/our-impact`);
  if (!response.ok) throw new Error("Unable to load Our Impact page content.");
  return response.json() as Promise<OurImpactResponse>;
};

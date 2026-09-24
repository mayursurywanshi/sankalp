export type PublicSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagramUrl: string;
  mapEmbedUrl: string;
  directionsUrl: string;
};
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
export const fetchPublicSettings = async () => {
  const response = await fetch(`${API_URL}/api/settings/public`);
  const result = (await response.json()) as {
    success: boolean;
    data?: PublicSettings;
  };
  if (!response.ok || !result.success || !result.data)
    throw new Error("Unable to load clinic settings.");
  return result.data;
};

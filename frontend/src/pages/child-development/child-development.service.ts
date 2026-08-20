import { ChildDevelopmentResponse } from "./child-development.types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:5000";

export const getChildDevelopmentContent = async (): Promise<ChildDevelopmentResponse> => {
  const response = await fetch(`${API_URL}/api/child-development`);

  if (!response.ok) {
    throw new Error("Unable to load Child Development page content.");
  }

  return response.json() as Promise<ChildDevelopmentResponse>;
};

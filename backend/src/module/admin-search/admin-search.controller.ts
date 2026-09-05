import { Request, Response } from "express";
import { searchAdminRecords } from "./admin-search.service";
import { adminSearchQuerySchema } from "./admin-search.validation";

export const getAdminSearch = async (request: Request, response: Response) => {
  const validation = adminSearchQuerySchema.safeParse(request.query);
  if (!validation.success) { response.status(400).json({ success: false, message: "Enter at least 2 characters to search.", errors: validation.error.flatten().fieldErrors }); return; }
  try { response.status(200).json({ success: true, data: await searchAdminRecords(validation.data.query) }); }
  catch (error) { console.error("Unable to search Admin records", error); response.status(500).json({ success: false, message: "Unable to search clinic records." }); }
};

import { Request, Response } from "express";
import {
  contactLocationSchema,
  feedbackSettingsSchema,
  workingHoursSchema,
} from "./settings.validation";
import {
  getSettings,
  publicSettings,
  updateContactLocation,
  updateFeedbackSettings,
  updateWorkingHours,
} from "./settings.service";

export const getAdminSettings = async (
  _request: Request,
  response: Response,
) => {
  response.status(200).json({ success: true, data: await getSettings() });
};
export const getPublicSettings = async (
  _request: Request,
  response: Response,
) => {
  response.status(200).json({ success: true, data: await publicSettings() });
};
const update = async (
  request: Request,
  response: Response,
  schema:
    | typeof contactLocationSchema
    | typeof workingHoursSchema
    | typeof feedbackSettingsSchema,
  action: typeof updateContactLocation,
) => {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted settings.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  const data = await action(parsed.data, response.locals.admin.id);
  response
    .status(200)
    .json({ success: true, message: "Settings updated successfully.", data });
};
export const patchContactLocation = (request: Request, response: Response) =>
  update(request, response, contactLocationSchema, updateContactLocation);
export const patchWorkingHours = (request: Request, response: Response) =>
  update(request, response, workingHoursSchema, updateWorkingHours);
export const patchFeedback = (request: Request, response: Response) =>
  update(request, response, feedbackSettingsSchema, updateFeedbackSettings);

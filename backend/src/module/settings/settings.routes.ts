import { Router } from "express";
import {
  getAdminSettings,
  getPublicSettings,
  patchContactLocation,
  patchFeedback,
  patchWorkingHours,
} from "./settings.controller";

export const adminSettingsRouter = Router();
adminSettingsRouter.get("/", getAdminSettings);
adminSettingsRouter.patch("/contact-location", patchContactLocation);
adminSettingsRouter.patch("/working-hours", patchWorkingHours);
adminSettingsRouter.patch("/feedback", patchFeedback);

export const publicSettingsRouter = Router();
publicSettingsRouter.get("/public", getPublicSettings);

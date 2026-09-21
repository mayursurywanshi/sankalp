import { Router } from "express";
import {
  getContactDetails,
  getContactRequests,
  getContactSummary,
  patchContactAssignment,
  patchContactFollowUp,
  patchContactStatus,
  postContactAppointment,
} from "./admin-contact-requests.controller";

const adminContactRequestsRouter = Router();

adminContactRequestsRouter.get("/", getContactRequests);
adminContactRequestsRouter.get("/summary", getContactSummary);
adminContactRequestsRouter.get("/:referenceId", getContactDetails);
adminContactRequestsRouter.patch(
  "/:referenceId/assignment",
  patchContactAssignment,
);
adminContactRequestsRouter.patch(
  "/:referenceId/follow-up",
  patchContactFollowUp,
);
adminContactRequestsRouter.patch("/:referenceId/status", patchContactStatus);
adminContactRequestsRouter.post(
  "/:referenceId/appointment",
  postContactAppointment,
);

export default adminContactRequestsRouter;

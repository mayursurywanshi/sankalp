import { Request, Response } from "express";
import {
  assignContactRequest,
  convertContactToAppointment,
  deleteContactRequest,
  getContactRequest,
  getContactRequestSummary,
  listContactRequests,
  updateContactFollowUp,
  updateContactStatus,
} from "./admin-contact-requests.service";
import {
  contactAppointmentSchema,
  contactAssignmentSchema,
  contactFollowUpSchema,
  contactReferenceSchema,
  contactRequestListSchema,
  contactStatusSchema,
} from "./admin-contact-requests.validation";

const invalidReference = (response: Response) =>
  response.status(400).json({
    success: false,
    message: "Enter a valid contact request reference.",
  });

export const getContactRequests = async (
  request: Request,
  response: Response,
) => {
  const input = contactRequestListSchema.safeParse(request.query);
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Invalid contact request filters.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  response
    .status(200)
    .json({ success: true, data: await listContactRequests(input.data) });
};

export const getContactSummary = async (
  _request: Request,
  response: Response,
) => {
  response
    .status(200)
    .json({ success: true, data: await getContactRequestSummary() });
};

export const getContactDetails = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  const data = await getContactRequest(reference.data);
  response
    .status(data ? 200 : 404)
    .json(
      data
        ? { success: true, data }
        : { success: false, message: "Contact request was not found." },
    );
};

export const removeContactRequest = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  const deleted = await deleteContactRequest(reference.data);
  if (!deleted) {
    response
      .status(404)
      .json({ success: false, message: "Contact request was not found." });
    return;
  }
  response.status(200).json({
    success: true,
    message: "Contact request deleted successfully.",
    data: deleted,
  });
};

export const patchContactAssignment = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  const input = contactAssignmentSchema.safeParse(request.body);
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the assignment details.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  const result = await assignContactRequest(
    reference.data,
    input.data,
    response.locals.admin.id,
  );
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Contact request was not found." });
    return;
  }
  if (result.outcome === "DOCTOR_NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "An active Doctor was not found." });
    return;
  }
  if (result.outcome === "RESOLVED") {
    response.status(409).json({
      success: false,
      message: "Reopen the resolved request before assigning a Doctor.",
    });
    return;
  }
  response.status(200).json({
    success: true,
    message: "Contact request assigned successfully.",
    data: result.data,
  });
};

export const patchContactFollowUp = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  const input = contactFollowUpSchema.safeParse(request.body);
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the follow-up details.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  const data = await updateContactFollowUp(
    reference.data,
    input.data,
    response.locals.admin.id,
  );
  response.status(data ? 200 : 404).json(
    data
      ? {
          success: true,
          message: "Follow-up preference saved successfully.",
          data,
        }
      : { success: false, message: "Contact request was not found." },
  );
};

export const patchContactStatus = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  const input = contactStatusSchema.safeParse(request.body);
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the status details.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  const data = await updateContactStatus(
    reference.data,
    input.data,
    response.locals.admin.id,
  );
  response.status(data ? 200 : 404).json(
    data
      ? {
          success: true,
          message: `Contact request marked ${input.data.status.toLowerCase().replace("_", " ")}.`,
          data,
        }
      : { success: false, message: "Contact request was not found." },
  );
};

export const postContactAppointment = async (
  request: Request,
  response: Response,
) => {
  const reference = contactReferenceSchema.safeParse(
    request.params.referenceId,
  );
  const input = contactAppointmentSchema.safeParse(request.body);
  if (!reference.success) {
    invalidReference(response);
    return;
  }
  if (!input.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the appointment details.",
      errors: input.error.flatten().fieldErrors,
    });
    return;
  }
  const result = await convertContactToAppointment(
    reference.data,
    input.data,
    response.locals.admin.id,
  );
  if (result.outcome === "NOT_FOUND") {
    response
      .status(404)
      .json({ success: false, message: "Contact request was not found." });
    return;
  }
  if (result.outcome === "ALREADY_CONVERTED") {
    response.status(409).json({
      success: false,
      message:
        "An appointment has already been created from this contact request.",
    });
    return;
  }
  if (result.outcome === "DUPLICATE_APPOINTMENT") {
    response.status(409).json({
      success: false,
      message:
        "An appointment request already exists for this child on the selected date.",
      data: { existingReferenceId: result.referenceId },
    });
    return;
  }
  response.status(201).json({
    success: true,
    message: "Appointment request created successfully.",
    data: result.data,
  });
};

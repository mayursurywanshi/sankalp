import { Request, Response } from "express";
import { CONTACT_CONTENT } from "../../constants/contact.constants";
import { receiveContactMessage } from "./contact.service";
import { contactMessageSchema } from "./contact.validation";

export const getContact = (_request: Request, response: Response): void => {
  response.status(200).json({ success: true, data: CONTACT_CONTENT });
};

export const submitContactMessage = async (request: Request, response: Response): Promise<void> => {
  const validation = contactMessageSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const receipt = await receiveContactMessage(validation.data);
    response.status(201).json({
      success: true,
      message: CONTACT_CONTENT.form.successMessage,
      data: { referenceId: receipt.referenceId, receivedAt: receipt.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("Unable to save contact message", error);
    response.status(500).json({
      success: false,
      message: "We could not save your message. Please try again.",
    });
  }
};

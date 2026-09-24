import { Request, Response } from "express";
import { CONTACT_CONTENT } from "../../constants/contact.constants";
import { getSettings } from "../settings/settings.service";
import { receiveContactMessage } from "./contact.service";
import { contactMessageSchema } from "./contact.validation";

export const getContact = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const settings = await getSettings();
  const digits = settings.whatsapp.replace(/\D/g, "");
  const details = CONTACT_CONTENT.details.map((item) => {
    if (item.id === "phone")
      return {
        ...item,
        value: settings.phone,
        href: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
      };
    if (item.id === "whatsapp")
      return {
        ...item,
        value: settings.whatsapp,
        href: `https://wa.me/${digits}`,
      };
    if (item.id === "email")
      return {
        ...item,
        value: settings.email,
        href: `mailto:${settings.email}`,
      };
    if (item.id === "address") return { ...item, value: settings.address };
    if (item.id === "timings")
      return {
        ...item,
        value: `${settings.openingTime}–${settings.closingTime}`,
      };
    return item;
  });
  response
    .status(200)
    .json({
      success: true,
      data: {
        ...CONTACT_CONTENT,
        details,
        map: {
          ...CONTACT_CONTENT.map,
          embedUrl: settings.mapEmbedUrl,
          directionsUrl: settings.directionsUrl,
        },
      },
    });
};

export const submitContactMessage = async (
  request: Request,
  response: Response,
): Promise<void> => {
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
      data: {
        referenceId: receipt.referenceId,
        receivedAt: receipt.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Unable to save contact message", error);
    response.status(500).json({
      success: false,
      message: "We could not save your message. Please try again.",
    });
  }
};

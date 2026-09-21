import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { ContactMessageInput } from "./contact.validation";

export const receiveContactMessage = async (message: ContactMessageInput) =>
  prisma.$transaction(async (transaction) => {
    const contact = await transaction.contactMessage.create({
      data: {
        ...message,
        referenceId: `SC-${randomUUID().slice(0, 8).toUpperCase()}`,
      },
      select: {
        id: true,
        referenceId: true,
        createdAt: true,
      },
    });
    await transaction.contactRequestActivity.create({
      data: {
        contactMessageId: contact.id,
        event: "RECEIVED",
        newStatus: "NEW",
      },
    });
    return contact;
  });

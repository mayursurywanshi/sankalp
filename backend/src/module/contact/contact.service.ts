import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database.config";
import { ContactMessageInput } from "./contact.validation";

export const receiveContactMessage = async (message: ContactMessageInput) =>
  prisma.contactMessage.create({
    data: {
      ...message,
      referenceId: `SC-${randomUUID().slice(0, 8).toUpperCase()}`,
    },
    select: {
      referenceId: true,
      createdAt: true,
    },
  });

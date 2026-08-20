import { randomUUID } from "node:crypto";
import { ContactMessageInput } from "./contact.validation";

export interface ContactMessageReceipt extends ContactMessageInput {
  referenceId: string;
  receivedAt: string;
}

const testStageMessages: ContactMessageReceipt[] = [];

export const receiveContactMessage = (message: ContactMessageInput): ContactMessageReceipt => {
  const receipt = {
    ...message,
    referenceId: `SC-${randomUUID().slice(0, 8).toUpperCase()}`,
    receivedAt: new Date().toISOString(),
  };

  testStageMessages.push(receipt);
  return receipt;
};

import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("https://"), "Use a secure HTTPS URL");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format");

export const contactLocationSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,20}$/, "Enter a valid phone number"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,20}$/, "Enter a valid WhatsApp number"),
  email: z.string().trim().email().max(120),
  address: z.string().trim().min(10).max(1000),
  instagramUrl: httpsUrl,
  mapEmbedUrl: httpsUrl,
  directionsUrl: httpsUrl,
});

export const workingHoursSchema = z
  .object({
    openingTime: time,
    closingTime: time,
    slotDurationMinutes: z
      .number()
      .int()
      .refine(
        (value) => [15, 30, 45, 60].includes(value),
        "Use 15, 30, 45 or 60 minutes",
      ),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .transform((days) => [...new Set(days)].sort()),
    maximumAdvanceBookingDays: z.number().int().min(1).max(365),
  })
  .refine((input) => input.openingTime < input.closingTime, {
    path: ["closingTime"],
    message: "Closing time must be after opening time",
  });

export const feedbackSettingsSchema = z.object({
  feedbackExpiryHours: z.number().int().min(1).max(168),
});

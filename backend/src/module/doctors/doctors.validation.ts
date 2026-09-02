import { z } from "zod";

const datePattern = /^\d{2}-\d{2}-\d{4}$/;

const parseDate = (value: string) => {
  if (!datePattern.test(value)) return null;
  const parts = value.split("-").map(Number);
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  if (day === undefined || month === undefined || year === undefined) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
};

const validDate = (message: string) => z.string().regex(datePattern, "Use DD-MM-YYYY format").refine((value) => parseDate(value), message);

export const doctorDetailsSchema = z.object({
  firstName: z.string().trim().min(2).max(50).regex(/^[\p{L} .'-]+$/u, "Enter a valid first name"),
  lastName: z.string().trim().min(2).max(50).regex(/^[\p{L} .'-]+$/u, "Enter a valid last name"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().toLowerCase().email().max(120),
  designation: z.string().trim().min(2).max(100),
  joiningDate: validDate("Enter a valid joining date"),
  dateOfBirth: validDate("Enter a valid date of birth").refine((value) => {
    const dob = parseDate(value);
    if (!dob) return false;
    const adultDate = new Date();
    adultDate.setFullYear(adultDate.getFullYear() - 18);
    return dob <= adultDate;
  }, "Doctor must be at least 18 years old"),
});

export const doctorCredentialsSchema = z.object({
  password: z.string().min(8).max(72).regex(/[A-Z]/, "Password requires an uppercase letter").regex(/[a-z]/, "Password requires a lowercase letter").regex(/\d/, "Password requires a number").regex(/[^A-Za-z0-9]/, "Password requires a special character"),
  confirm: z.literal(true, { error: "Confirmation is required" }),
});

export const toDatabaseDate = (value: string) => parseDate(value) as Date;
export type DoctorDetailsInput = z.infer<typeof doctorDetailsSchema>;
export type DoctorCredentialsInput = z.infer<typeof doctorCredentialsSchema>;

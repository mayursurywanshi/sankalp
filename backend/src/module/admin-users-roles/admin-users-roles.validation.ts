import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/, "Password requires an uppercase letter")
  .regex(/[a-z]/, "Password requires a lowercase letter")
  .regex(/\d/, "Password requires a number")
  .regex(/[^A-Za-z0-9]/, "Password requires a special character");

export const userRoleSchema = z.enum(["ADMIN", "DOCTOR"]);
export const userIdSchema = z.string().uuid("Enter a valid user ID");

export const usersListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: userRoleSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const createUserRoleSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("ADMIN"),
    fullName: z.string().trim().min(2).max(100),
    loginId: z
      .string()
      .trim()
      .min(3)
      .max(80)
      .regex(/^[A-Za-z0-9._-]+$/, "Login ID contains unsupported characters"),
    password: passwordSchema,
  }),
  z.object({
    role: z.literal("DOCTOR"),
    doctorId: z
      .string()
      .trim()
      .regex(/^DOC\d{6}$/, "Enter a valid Doctor ID"),
    password: passwordSchema,
  }),
]);

export const updateUserStatusSchema = z.object({ isActive: z.boolean() });

export type UsersListInput = z.infer<typeof usersListSchema>;
export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  role: z.enum(["ADMIN", "DOCTOR"], { error: "Select Admin or Doctor" }),
  loginId: z.string().trim().min(3, "Login ID is required").max(80),
  password: z.string().min(8, "Password must contain at least 8 characters").max(128),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

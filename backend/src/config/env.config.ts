import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

const validationResult = environmentSchema.safeParse(process.env);

if (!validationResult.success) {
  console.error(
    "Invalid environment variables:",
    validationResult.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment configuration");
}

export const env = validationResult.data;
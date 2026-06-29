import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username may only contain letters, numbers, and _ . -",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "Password is too long."),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  url: z.string().trim().url("Enter a valid URL (https://...)").max(500),
  imageUrl: z
    .union([z.string().trim().url("Enter a valid image URL"), z.literal("")])
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

import { z } from "zod";

// zod's built-in .url() only checks that the string parses as *a* URL — it
// happily accepts "javascript:", "data:", "vbscript:" etc, which is unsafe
// for anything rendered back out as an <a href> or <img src>. Restrict to
// http(s) explicitly.
function httpUrl(message: string) {
  return z
    .string()
    .trim()
    .max(500)
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, message);
}

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
  url: httpUrl("Enter a valid URL (https://...)"),
  imageUrl: z
    .union([httpUrl("Enter a valid image URL"), z.literal("")])
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  // Non-admin visibility choice: "private" (owner-only, no review) or
  // "public" (enters the admin review queue).
  visibility: z.enum(["private", "public"]).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

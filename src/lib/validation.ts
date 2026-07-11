import { z } from "zod";

// zod's built-in .url() only checks that the string parses as *a* URL — it
// happily accepts "javascript:", "data:", "vbscript:" etc, which is unsafe
// for anything rendered back out as an <a href> or <img src>. Restrict the
// protocol explicitly.
function urlWithProtocol(protocols: string[], message: string) {
  return z
    .string()
    .trim()
    .max(500)
    .refine((value) => {
      try {
        return protocols.includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, message);
}

const httpUrl = (message: string) =>
  urlWithProtocol(["http:", "https:"], message);
// Images embed straight into the page, so require TLS to avoid mixed content.
const httpsUrl = (message: string) => urlWithProtocol(["https:"], message);

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
  imageUrl: httpsUrl("A screenshot image URL is required (https://...)"),
  projectType: z.enum(["website", "claude_artifact"], {
    message: "Choose a project type.",
  }),
  pricing: z.enum(["free", "paid"], {
    message: "Choose free or paid.",
  }),
  categoryId: z.coerce.number().int().positive().optional(),
  // Non-admin visibility choice: "private" (owner-only, no review) or
  // "public" (enters the admin review queue).
  visibility: z.enum(["private", "public"]).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60, "Display name is too long.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be at most 280 characters.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .union([httpsUrl("Enter a valid image URL (https://...)"), z.literal("")])
    .optional(),
  websiteUrl: z
    .union([
      httpUrl("Enter a valid URL (https://...)"),
      z.literal(""),
    ])
    .optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const feedbackSchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Feedback is too short.")
    .max(500, "Feedback must be at most 500 characters."),
});

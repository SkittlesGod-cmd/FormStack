import { z } from "zod";

export const waitlistFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Please select your role"),
  brand_count: z.string().min(1, "Please select number of brands"),
  source: z.string().min(1, "Please tell us how you heard about us"),
  website: z.string(),
});

export const waitlistInsertSchema = waitlistFormSchema.omit({
  website: true,
});

export type WaitlistFormInput = z.infer<typeof waitlistFormSchema>;
export type WaitlistInsert = z.infer<typeof waitlistInsertSchema>;

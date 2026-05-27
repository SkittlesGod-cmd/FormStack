import { createClient } from "@/utils/supabase/client";

export const supabase = createClient();

// Waitlist row shape (mirrors the DB schema)
export type WaitlistInsert = {
  full_name: string;
  email: string;
  company: string;
  role: string;
  brand_count: string;
  source: string;
};

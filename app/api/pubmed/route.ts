import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { searchPubMed } from "@/lib/pubmed";
import { z } from "zod";

const bodySchema = z.object({
  query: z.string().min(1).max(300),
  max_results: z.number().int().min(1).max(10).optional().default(5),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const articles = await searchPubMed(parsed.data.query, parsed.data.max_results);
  return NextResponse.json({ articles });
}

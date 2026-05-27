import { NextResponse } from "next/server";
import { hasAdminSession, isWaitlistAdminConfigured } from "@/lib/admin-auth";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
  type WaitlistRow,
} from "@/utils/supabase/admin";

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: WaitlistRow[]) {
  const header = [
    "id",
    "created_at",
    "full_name",
    "email",
    "company",
    "role",
    "brand_count",
    "source",
  ];

  const body = rows.map((row) =>
    [
      row.id,
      row.created_at,
      row.full_name,
      row.email,
      row.company,
      row.role,
      row.brand_count,
      row.source,
    ]
      .map((value) => escapeCsvValue(String(value ?? "")))
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isWaitlistAdminConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { message: "Admin export is not configured." },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("waitlist")
    .select("id, created_at, full_name, email, company, role, brand_count, source")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Unable to export the waitlist right now." },
      { status: 500 }
    );
  }

  const filename = `enhancelabs-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(toCsv((data ?? []) as WaitlistRow[]), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

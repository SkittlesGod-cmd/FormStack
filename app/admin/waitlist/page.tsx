import type { Metadata } from "next";
import Link from "next/link";
import { hasAdminSession, isWaitlistAdminConfigured } from "@/lib/admin-auth";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
  type WaitlistRow,
} from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Waitlist Admin",
  robots: {
    index: false,
    follow: false,
  },
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LoginCard({ error }: { error?: string }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <p className="label-sm text-brand mb-3">Admin access</p>
      <h1 className="text-2xl font-bold text-gray-900">Waitlist dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">
        Enter the admin password to review signups and export the waitlist.
      </p>

      {error === "invalid" ? (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          The admin password was incorrect.
        </p>
      ) : null}

      {error === "config" ? (
        <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Admin access is not configured yet.
        </p>
      ) : null}

      <form
        action="/api/admin/login?next=/admin/waitlist"
        method="post"
        className="mt-6 space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Admin password
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Unlock dashboard
        </button>
      </form>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <p className="label-sm text-brand mb-3">Setup needed</p>
      <h1 className="text-2xl font-bold text-gray-900">Configure waitlist admin access</h1>
      <p className="mt-2 text-sm text-gray-500">
        The dashboard is implemented, but it needs server-only credentials before
        it can read the waitlist.
      </p>

      <div className="mt-6 rounded-2xl bg-gray-950 p-5 text-sm text-gray-100">
        <p><code>SUPABASE_SERVICE_ROLE_KEY=...</code></p>
        <p><code>WAITLIST_ADMIN_PASSWORD=...</code></p>
        <p><code>WAITLIST_ADMIN_SESSION_SECRET=...</code></p>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Add those to <code>.env.local</code>, restart the app, and this dashboard
        will unlock.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-gray-900">No waitlist entries yet</h2>
      <p className="mt-2 text-sm text-gray-500">
        New signups will appear here as soon as they come in.
      </p>
    </div>
  );
}

export default async function WaitlistAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!isWaitlistAdminConfigured() || !isSupabaseAdminConfigured()) {
    return (
      <div className="bg-gray-50 px-5 py-16">
        <SetupCard />
      </div>
    );
  }

  if (!(await hasAdminSession())) {
    return (
      <div className="bg-gray-50 px-5 py-16">
        <LoginCard error={error} />
      </div>
    );
  }

  const supabase = createAdminClient();
  const [{ data, error: loadError }, { count, error: countError }] = await Promise.all([
    supabase
      .from("waitlist")
      .select("id, created_at, full_name, email, company, role, brand_count, source")
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true }),
  ]);

  const rows = ((data ?? []) as WaitlistRow[]).filter(Boolean);
  const totalEntries = count ?? rows.length;
  const hasLoadError = Boolean(loadError || countError);

  return (
    <div className="bg-gray-50 px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-sm text-brand mb-3">Internal dashboard</p>
            <h1 className="text-3xl font-bold text-gray-900">Waitlist admin</h1>
            <p className="mt-2 text-sm text-gray-500">
              Review recent signups and export the full waitlist as CSV.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/waitlist/export"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              Export CSV
            </a>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total waitlist signups</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalEntries}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Newest signup</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {rows[0] ? formatTimestamp(rows[0].created_at) : "No entries yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Rows shown</p>
            <p className="mt-2 text-sm text-gray-700">
              Showing the most recent {rows.length} signups in the dashboard view.
            </p>
          </div>
        </div>

        {hasLoadError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
            Unable to load waitlist entries right now.
          </div>
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Brands</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 text-gray-500">
                        {formatTimestamp(row.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.full_name}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`mailto:${row.email}`}
                          className="text-brand hover:underline"
                        >
                          {row.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.company}</td>
                      <td className="px-4 py-3 text-gray-700">{row.role}</td>
                      <td className="px-4 py-3 text-gray-700">{row.brand_count}</td>
                      <td className="px-4 py-3 text-gray-700">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

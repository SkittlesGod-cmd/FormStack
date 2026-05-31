import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Clinical research, regulatory guidance, and product development for supplement brands.",
};

const CATEGORY_STYLES: Record<string, string> = {
  Formulation: "bg-brand/[0.08] text-brand border-brand/20",
  Compliance: "bg-amber-50 text-amber-700 border-amber-200",
  Industry: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 md:py-24">
      <div className="mb-14">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Insights
        </p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[40px]">
          Blog
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-500 max-w-lg">
          Clinical research, regulatory guidance, and product development for supplement brands.
        </p>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => {
          const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-[12px] text-gray-400">{formattedDate}</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    CATEGORY_STYLES[post.category] ?? "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {post.category}
                </span>
                <span className="text-[12px] text-gray-400">{post.readingTime} min read</span>
              </div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-gray-950 group-hover:text-brand transition-colors">
                {post.title}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-600">{post.excerpt}</p>
              <p className="mt-5 text-[13px] font-medium text-brand">
                Read more &rarr;
              </p>
            </Link>
          );
        })}
      </div>

      {/* Subscribe section */}
      <div className="mt-16 rounded-2xl border border-black/[0.06] bg-gray-50 px-8 py-10">
        <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-gray-950">
          Subscribe for updates
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
          New articles on clinical research, compliance, and supplement product development.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            aria-label="Email address"
            className="flex-1 min-w-[200px] rounded-full border border-black/[0.10] bg-white px-5 py-2.5 text-[13px] text-gray-950 placeholder-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
          <a
            href="mailto:support@formlayer.co?subject=Subscribe"
            className="inline-flex items-center rounded-full bg-gray-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Subscribe
          </a>
        </div>
      </div>
    </div>
  );
}

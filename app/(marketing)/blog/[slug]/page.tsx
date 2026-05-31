import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/lib/blog";
import { ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  };
}

const CATEGORY_STYLES: Record<string, string> = {
  Formulation: "bg-brand/[0.08] text-brand border-brand/20",
  Compliance: "bg-amber-50 text-amber-700 border-amber-200",
  Industry: "bg-gray-50 text-gray-600 border-gray-200",
};

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 md:py-20">
      {/* Back */}
      <Link
        href="/blog"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All posts
      </Link>

      {/* Header */}
      <header className="mb-10">
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
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-gray-950 leading-tight md:text-[34px]">
          {post.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-gray-500">{post.excerpt}</p>
      </header>

      <hr className="border-black/[0.06] mb-10" />

      {/* Body */}
      <article className="prose-blog">
        <MDXRemote source={post.content} />
      </article>

      {/* Footer */}
      <div className="mt-16 border-t border-black/[0.06] pt-10">
        <p className="text-[13px] text-gray-400 mb-6">More from the blog</p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:border-black/20 hover:bg-black/[0.02] transition"
        >
          <ArrowLeft className="size-3.5" />
          Back to all posts
        </Link>
      </div>
    </div>
  );
}

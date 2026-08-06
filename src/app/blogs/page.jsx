import BannerSection from "../components/home-components/BannerSection";
import BlogsList from "../components/blog-components/BlogsList";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { getAllBlogs, getFeaturedBlogs } from "@/lib/blogs";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("blogs");
}

export default async function Blogs() {
  await connection();
  const [blogs, featuredBlogs] = await Promise.all([
    getAllBlogs(),
    getFeaturedBlogs(),
  ]);

  return (
    <>
      <PageSeoJsonLd pageKey="blogs" />
      <BannerSection slides={featuredBlogs} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-3.5 font-[family-name:var(--font-fraunces)] text-base font-medium text-nf-text sm:text-lg">
          All blogs
        </h1>
        <BlogsList blogs={blogs} />
      </div>
    </>
  );
}

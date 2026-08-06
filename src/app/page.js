import BannerSection from "./components/home-components/BannerSection";
import RecentPosts from "./components/home-components/RecentPosts";
import LatestBlogs from "./components/home-components/LatestBlog";
import PageSeoJsonLd from "./components/common/PageSeoJsonLd";
import { getFeaturedBlogs } from "@/lib/blogs";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("home");
}

export default async function Home() {
  await connection();
  const featuredBlogs = await getFeaturedBlogs();

  return (
    <>
      <PageSeoJsonLd pageKey="home" />
      <h1 className="sr-only">
        NutriFactx, science-backed nutrition facts and wellness insights
      </h1>
      <BannerSection slides={featuredBlogs} />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <RecentPosts />
        <LatestBlogs />
      </div>
    </>
  );
}

import BannerSection from "./components/home-components/BannerSection";
import RecentPosts from "./components/home-components/RecentPosts";
import LatestBlogs from "./components/home-components/LatestBlog";
import PageSeoJsonLd from "./components/common/PageSeoJsonLd";
import { getFeaturedBlogs } from "@/lib/blogs";
import { buildPageMetadata } from "@/lib/siteSeo";

export const revalidate = 120;

export async function generateMetadata() {
  return buildPageMetadata("home");
}

export default async function Home() {
  const featuredBlogs = await getFeaturedBlogs();

  return (
    <>
      <PageSeoJsonLd pageKey="home" />
      <h1 className="sr-only">
        NutriFactx, science-backed nutrition facts and wellness insights
      </h1>
      <BannerSection slides={featuredBlogs} />
      <div className="nf-page space-y-8 py-8 sm:py-10">
        <RecentPosts />
        <LatestBlogs />
      </div>
    </>
  );
}

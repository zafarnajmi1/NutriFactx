import BlogsCard from "../common/BlogsCard";
import { getMostViewedBlogs } from "@/lib/blogs";

export default async function LatestBlogs() {
  const latestPosts = await getMostViewedBlogs(8);

  if (!latestPosts.length) return null;

  return (
    <section className="nf-animate-fade-up nf-delay-2">
      <h2 className="nf-section-title mb-3.5">
        Most viewed
      </h2>
      <div className="nf-posts-grid">
        {latestPosts.map((post) => (
          <BlogsCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            category={post.category}
            author={post.author}
            date={post.date}
            image={post.featuredImage}
            featured={post.isFeatured}
            href={`/blogs/${post.slug}`}
          />
        ))}
      </div>
    </section>
  );
}

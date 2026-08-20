import BlogsCard from "../common/BlogsCard";
import { getRecentBlogs } from "@/lib/blogs";

export default async function RecentPosts() {
  const recentPosts = await getRecentBlogs(4);

  if (!recentPosts.length) return null;

  return (
    <section className="nf-animate-fade-up nf-delay-1">
      <h2 className="nf-section-title mb-3.5">
        Recent posts
      </h2>
      <div className="nf-posts-grid">
        {recentPosts.map((post) => (
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

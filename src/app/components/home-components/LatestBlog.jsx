import BlogsCard from "../common/BlogsCard";
import { getLatestBlogs } from "@/lib/blogs";

export default async function LatestBlogs() {
  const latestPosts = await getLatestBlogs(4);

  if (!latestPosts.length) return null;

  return (
    <section className="nf-animate-fade-up nf-delay-2">
      <h2 className="mb-3.5 font-[family-name:var(--font-fraunces)] text-base font-medium text-nf-text sm:text-lg">
        Latest posts
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

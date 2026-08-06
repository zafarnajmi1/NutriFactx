import HorizontalBlogCard from "../common/HorizontalBlogCard";

export default function RelatedBlogsScroll({ posts = [] }) {
  if (!posts.length) return null;

  return (
    <section className="mt-10 border-t border-nf-border pt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-nf-text">
          Related blogs
        </h2>
        <p className="text-xs text-nf-muted sm:text-sm">Swipe to explore</p>
      </div>

      <div className="nf-related-scroll -mx-1 flex gap-4 overflow-x-auto px-1 pb-3">
        {posts.map((post) => (
          <div key={post.id} className="w-[min(85vw,22rem)] shrink-0 sm:w-[24rem]">
            <HorizontalBlogCard
              title={post.title}
              excerpt={post.excerpt}
              category={post.category}
              author={post.author}
              date={post.datetime || post.date}
              image={post.featuredImage}
              href={`/blogs/${post.slug}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

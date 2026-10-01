/**
 * Dynamic topic clusters from published posts in the database.
 * Local and live both use the same logic: whatever is in `posts` becomes hubs.
 * No hardcoded topic names — categories, tags, focus keywords, and shared slug terms.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "much",
  "my",
  "need",
  "of",
  "on",
  "or",
  "our",
  "out",
  "per",
  "really",
  "should",
  "simple",
  "than",
  "that",
  "the",
  "this",
  "to",
  "vs",
  "was",
  "what",
  "when",
  "why",
  "with",
  "you",
  "your",
  "explained",
  "guide",
  "guides",
  "benefits",
  "sources",
  "deficiency",
  "dosage",
  "effects",
  "overall",
  "importance",
  "during",
  "actually",
  "biggest",
  "popular",
  "claims",
]);

const SOURCE_RANK = {
  category: 0,
  tag: 1,
  keyword: 2,
  topic: 3,
};

const PRIMARY_RANK = {
  tag: 0,
  topic: 1,
  keyword: 2,
  category: 3,
};

export function slugifyTopic(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/[A-Z]/.test(raw) || raw.includes(" ")) return raw;
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isStopWord(word) {
  return STOP_WORDS.has(String(word || "").toLowerCase());
}

function publishedPosts(blogs = []) {
  return (Array.isArray(blogs) ? blogs : []).filter(
    (blog) => blog?.slug && blog.robotsIndex !== false,
  );
}

function buildClusterMeta(name, source) {
  const label = displayName(name);
  const slug = slugifyTopic(label);
  return {
    slug,
    name: label,
    title: `${label} Articles`,
    description: `Science-backed ${label.toLowerCase()} articles and practical guides from NutriFactx.`,
    focusKeyword: label.toLowerCase(),
    keywords: `${label.toLowerCase()}, NutriFactx ${label.toLowerCase()}`,
    source,
  };
}

function addTerm(terms, name, source, minPosts) {
  const clean = String(name || "").trim();
  if (!clean) return;
  const slug = slugifyTopic(clean);
  if (!slug || isStopWord(slug)) return;
  terms.push({ name: clean, source, minPosts });
}

/** Category, tags, focus keyword, and shared slug phrases from this post. */
function termsFromPost(blog) {
  const terms = [];
  addTerm(terms, blog?.category || "Nutrition", "category", 1);

  for (const tag of Array.isArray(blog?.tags) ? blog.tags : []) {
    addTerm(terms, tag, "tag", 1);
  }

  addTerm(terms, blog?.focusKeyword, "keyword", 2);

  const words = String(blog?.slug || "")
    .toLowerCase()
    .split("-")
    .filter(Boolean);

  for (let index = 0; index < words.length - 1; index += 1) {
    const first = words[index];
    const second = words[index + 1];
    if (isStopWord(first) || isStopWord(second)) continue;
    if (first.length < 3 || second.length < 3) continue;
    addTerm(terms, `${first} ${second}`, "topic", 2);
  }

  for (const word of words) {
    if (isStopWord(word) || word.length < 4) continue;
    addTerm(terms, word, "topic", 2);
  }

  return terms;
}

function mergeName(current, incoming, currentSource, incomingSource) {
  const currentRank = SOURCE_RANK[currentSource] ?? 9;
  const nextRank = SOURCE_RANK[incomingSource] ?? 9;
  if (nextRank < currentRank) return incoming;
  if (nextRank === currentRank && incoming.length > current.length) return incoming;
  return current;
}

export function listTopicClusters(blogs = []) {
  const published = publishedPosts(blogs);
  const buckets = new Map();

  for (const post of published) {
    for (const term of termsFromPost(post)) {
      const slug = slugifyTopic(term.name);
      if (!slug) continue;
      const existing = buckets.get(slug) || {
        name: term.name,
        source: term.source,
        minPosts: term.minPosts,
        posts: new Map(),
      };
      existing.name = mergeName(
        existing.name,
        term.name,
        existing.source,
        term.source,
      );
      if ((SOURCE_RANK[term.source] ?? 9) < (SOURCE_RANK[existing.source] ?? 9)) {
        existing.source = term.source;
      }
      existing.minPosts = Math.min(existing.minPosts, term.minPosts);
      existing.posts.set(post.slug, post);
      buckets.set(slug, existing);
    }
  }

  return [...buckets.values()]
    .map((bucket) => {
      const posts = [...bucket.posts.values()];
      if (posts.length < bucket.minPosts) return null;
      return {
        ...buildClusterMeta(bucket.name, bucket.source),
        source: bucket.source,
        posts,
      };
    })
    .filter(Boolean)
    .filter((cluster, _, all) => {
      if (cluster.source !== "topic" || cluster.slug.includes("-")) return true;
      return !all.some(
        (other) =>
          other.source === "topic" &&
          other.slug !== cluster.slug &&
          other.slug.split("-").includes(cluster.slug) &&
          other.posts.length >= cluster.posts.length,
      );
    })
    .sort((left, right) => right.posts.length - left.posts.length);
}

export function getTopicCluster(slug, blogs = []) {
  const clean = slugifyTopic(slug);
  if (!clean) return null;
  return listTopicClusters(blogs).find((cluster) => cluster.slug === clean) || null;
}

/** Best hub for this article from the same live/local post set. */
export function getPrimaryCluster(blog, blogs = []) {
  if (!blog?.slug) return null;
  const pool = publishedPosts(blogs);
  const clusters = listTopicClusters(pool.length ? pool : [blog]).filter((cluster) =>
    cluster.posts.some((post) => post.slug === blog.slug),
  );
  if (!clusters.length) {
    return buildClusterMeta(blog.category || "Nutrition", "category");
  }

  clusters.sort((left, right) => {
    const sourceDelta =
      (PRIMARY_RANK[left.source] ?? 9) - (PRIMARY_RANK[right.source] ?? 9);
    if (sourceDelta !== 0) return sourceDelta;
    return right.posts.length - left.posts.length;
  });
  return clusters[0];
}

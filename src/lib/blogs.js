import {
  getFeaturedPublished,
  getLatestPublished,
  getPostById,
  getPublishedPostBySlug,
  getRecentPublished,
  getRelatedPublished,
  listPublishedPosts,
  mapPostToBlog,
  searchPublishedPosts,
} from "./posts";
import { getVisibleCommentsBySlug } from "./comments";
import { shouldUseLocalDbFallback } from "./db";

/** @deprecated Prefer async helpers below — kept empty so client imports don't crash. */
export const allBlogs = [];

async function withBlogFallback(fn, fallback = []) {
  try {
    return await fn();
  } catch (error) {
    if (shouldUseLocalDbFallback(error)) {
      console.warn("[blogs] PostgreSQL unavailable:", error.message);
      return fallback;
    }
    throw error;
  }
}

export async function getAllBlogs() {
  return withBlogFallback(() => listPublishedPosts());
}

export async function getRecentBlogs(limit = 4) {
  return withBlogFallback(() => getRecentPublished(limit));
}

export async function getLatestBlogs(limit = 4) {
  return withBlogFallback(() => getLatestPublished(limit));
}

export async function getFeaturedBlogs(limit = 6) {
  return withBlogFallback(() => getFeaturedPublished(limit));
}

export async function getBlogBySlug(slug) {
  return withBlogFallback(() => getPublishedPostBySlug(slug), null);
}

export async function getRelatedBlogs(slug, limit = 6) {
  return withBlogFallback(() => getRelatedPublished(slug, limit));
}

export async function getBlogComments(slug) {
  return getVisibleCommentsBySlug(slug);
}

export async function searchBlogs(query, limit = 6) {
  return searchPublishedPosts(query, limit);
}

export async function getBlogById(id) {
  const row = await getPostById(id);
  if (!row || row.status !== "PUBLISHED") return null;
  return mapPostToBlog(row);
}

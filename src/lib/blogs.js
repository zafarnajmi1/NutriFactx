import { cache } from "react";
import {
  getFeaturedPublished,
  getLatestPublished,
  getPostById,
  getPublishedPostBySlug,
  getPublishedPostMetaBySlug,
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

/** One DB hit per request when metadata + page both need the article. */
export const getBlogBySlug = cache(async (slug) => {
  return withBlogFallback(() => getPublishedPostBySlug(slug), null);
});

/** Lightweight meta for <head> — no content HTML. */
export const getBlogMetaBySlug = cache(async (slug) => {
  return withBlogFallback(() => getPublishedPostMetaBySlug(slug), null);
});

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

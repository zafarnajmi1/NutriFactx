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

/** @deprecated Prefer async helpers below — kept empty so client imports don't crash. */
export const allBlogs = [];

export async function getAllBlogs() {
  return listPublishedPosts();
}

export async function getRecentBlogs(limit = 4) {
  return getRecentPublished(limit);
}

export async function getLatestBlogs(limit = 4) {
  return getLatestPublished(limit);
}

export async function getFeaturedBlogs(limit = 6) {
  return getFeaturedPublished(limit);
}

export async function getBlogBySlug(slug) {
  return getPublishedPostBySlug(slug);
}

export async function getRelatedBlogs(slug, limit = 6) {
  return getRelatedPublished(slug, limit);
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

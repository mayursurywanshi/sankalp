import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../config/database.config";
import { ImpactPostInput, ImpactPostListQuery, UpdateImpactPostInput } from "./admin-success-stories.validation";
import { impactUploadDirectory } from "./admin-success-stories.upload";

const selectPost = {
  id: true,
  postType: true,
  title: true,
  story: true,
  mediaType: true,
  mediaUrl: true,
  originalFileName: true,
  mimeType: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  admin: { select: { fullName: true } },
} as const;

export class DuplicateImpactPostError extends Error {}

const normalizePostText = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const ensurePostIsUnique = async (postType: "SUCCESS_STORY" | "PARENT_FEEDBACK", title: string, story: string, excludeId?: string) => {
  const possibleDuplicates = await prisma.ourImpactPost.findMany({
    where: { postType, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { title: true, story: true },
  });
  const normalizedTitle = normalizePostText(title);
  const normalizedStory = normalizePostText(story);
  if (possibleDuplicates.some((post) => normalizePostText(post.title) === normalizedTitle && normalizePostText(post.story) === normalizedStory)) {
    throw new DuplicateImpactPostError(`An identical ${postType === "SUCCESS_STORY" ? "Success Story" : "Parent Feedback"} already exists.`);
  }
};

export const listImpactPosts = async (query: ImpactPostListQuery) => {
  const where = { postType: query.type, status: query.status };
  const [items, total] = await prisma.$transaction([
    prisma.ourImpactPost.findMany({ where, select: selectPost, orderBy: { publishedAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.ourImpactPost.count({ where }),
  ]);
  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
};

export const getImpactPost = (id: string) => prisma.ourImpactPost.findUnique({ where: { id }, select: selectPost });

export const createImpactPost = async (adminId: string, input: ImpactPostInput, file: Express.Multer.File) => {
  await ensurePostIsUnique(input.postType, input.title, input.story);
  return prisma.ourImpactPost.create({
    data: {
      ...input,
      mediaType: file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE",
      mediaUrl: `/uploads/our-impact/${file.filename}`,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      createdBy: adminId,
    },
    select: selectPost,
  });
};

export const updateImpactPost = async (id: string, input: UpdateImpactPostInput, file?: Express.Multer.File) => {
  const current = await prisma.ourImpactPost.findUnique({ where: { id } });
  if (!current) return null;
  await ensurePostIsUnique(input.postType ?? current.postType, input.title ?? current.title, input.story ?? current.story, id);
  const updated = await prisma.ourImpactPost.update({
    where: { id },
    data: {
      ...input,
      ...(file ? {
        mediaType: file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE",
        mediaUrl: `/uploads/our-impact/${file.filename}`,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
      } : {}),
    },
    select: selectPost,
  });
  if (file) await removeStoredMedia(current.mediaUrl);
  return updated;
};

export const deleteImpactPost = async (id: string) => {
  const current = await prisma.ourImpactPost.findUnique({ where: { id } });
  if (!current) return null;
  await prisma.ourImpactPost.delete({ where: { id } });
  await removeStoredMedia(current.mediaUrl);
  return current;
};

export const listPublishedImpactPosts = async () => {
  const posts = await prisma.ourImpactPost.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, postType: true, title: true, story: true, mediaType: true, mediaUrl: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });
  const seen = new Set<string>();
  return posts.filter((post) => {
    const key = `${post.postType}|${normalizePostText(post.title)}|${normalizePostText(post.story)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const removeStoredMedia = async (mediaUrl: string) => {
  const filePath = path.resolve(process.cwd(), mediaUrl.replace(/^\/+/, ""));
  if (!filePath.startsWith(`${impactUploadDirectory}${path.sep}`)) return;
  await unlink(filePath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
};

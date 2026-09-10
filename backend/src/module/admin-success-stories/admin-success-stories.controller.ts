import { Request, Response } from "express";
import multer from "multer";
import { createImpactPost, deleteImpactPost, DuplicateImpactPostError, getImpactPost, listImpactPosts, removeStoredMedia, updateImpactPost } from "./admin-success-stories.service";
import { impactPostBodySchema, impactPostListQuerySchema, postIdSchema, updateImpactPostBodySchema } from "./admin-success-stories.validation";

const absoluteMediaUrl = (request: Request, post: Record<string, unknown>) => ({
  ...post,
  mediaUrl: `${request.protocol}://${request.get("host")}${post.mediaUrl}`,
});

const rejectUploadedFile = async (request: Request) => {
  if (request.file) await removeStoredMedia(`/uploads/our-impact/${request.file.filename}`);
};

export const getPosts = async (request: Request, response: Response) => {
  const validation = impactPostListQuerySchema.safeParse(request.query);
  if (!validation.success) { response.status(400).json({ success: false, message: "Invalid post filters.", errors: validation.error.flatten().fieldErrors }); return; }
  try {
    const result = await listImpactPosts(validation.data);
    response.status(200).json({ success: true, data: { ...result, items: result.items.map((post) => absoluteMediaUrl(request, post)) } });
  } catch (error) { console.error("Unable to list Our Impact posts", error); response.status(500).json({ success: false, message: "Unable to load posts." }); }
};

export const getPost = async (request: Request, response: Response) => {
  const id = postIdSchema.safeParse(request.params.postId);
  if (!id.success) { response.status(400).json({ success: false, message: "Enter a valid post ID." }); return; }
  try { const post = await getImpactPost(id.data); if (!post) { response.status(404).json({ success: false, message: "Post was not found." }); return; } response.status(200).json({ success: true, data: absoluteMediaUrl(request, post) }); }
  catch (error) { console.error("Unable to load Our Impact post", error); response.status(500).json({ success: false, message: "Unable to load the post." }); }
};

export const postPost = async (request: Request, response: Response) => {
  const validation = impactPostBodySchema.safeParse(request.body);
  if (!validation.success || !request.file) { await rejectUploadedFile(request); response.status(400).json({ success: false, message: request.file ? "Please correct the post fields." : "Select one photo or MP4 video.", errors: validation.success ? undefined : validation.error.flatten().fieldErrors }); return; }
  try { const post = await createImpactPost(response.locals.admin.id, validation.data, request.file); response.status(201).json({ success: true, message: "Post published successfully.", data: absoluteMediaUrl(request, post) }); }
  catch (error) { await rejectUploadedFile(request); if (error instanceof DuplicateImpactPostError) { response.status(409).json({ success: false, message: error.message }); return; } console.error("Unable to publish Our Impact post", error); response.status(500).json({ success: false, message: "Unable to publish the post." }); }
};

export const patchPost = async (request: Request, response: Response) => {
  const id = postIdSchema.safeParse(request.params.postId);
  const validation = updateImpactPostBodySchema.safeParse(request.body);
  if (!id.success || !validation.success || (Object.keys(request.body).length === 0 && !request.file)) { await rejectUploadedFile(request); response.status(400).json({ success: false, message: !id.success ? "Enter a valid post ID." : !validation.success ? "Please correct the post fields." : "Provide at least one field or a replacement media file.", errors: validation.success ? undefined : validation.error.flatten().fieldErrors }); return; }
  try { const post = await updateImpactPost(id.data, validation.data, request.file); if (!post) { await rejectUploadedFile(request); response.status(404).json({ success: false, message: "Post was not found." }); return; } response.status(200).json({ success: true, message: "Post updated successfully.", data: absoluteMediaUrl(request, post) }); }
  catch (error) { await rejectUploadedFile(request); if (error instanceof DuplicateImpactPostError) { response.status(409).json({ success: false, message: error.message }); return; } console.error("Unable to update Our Impact post", error); response.status(500).json({ success: false, message: "Unable to update the post." }); }
};

export const removePost = async (request: Request, response: Response) => {
  const id = postIdSchema.safeParse(request.params.postId);
  if (!id.success) { response.status(400).json({ success: false, message: "Enter a valid post ID." }); return; }
  try { const post = await deleteImpactPost(id.data); if (!post) { response.status(404).json({ success: false, message: "Post was not found." }); return; } response.status(200).json({ success: true, message: "Post deleted successfully." }); }
  catch (error) { console.error("Unable to delete Our Impact post", error); response.status(500).json({ success: false, message: "Unable to delete the post." }); }
};

export const handleUploadError = (error: Error, _request: Request, response: Response, next: (error?: unknown) => void) => {
  if (!(error instanceof multer.MulterError)) { next(error); return; }
  const message = error.code === "LIMIT_FILE_SIZE" ? "The selected file must not exceed 100 MB." : "Only JPG, JPEG, PNG, WebP, or MP4 files are allowed.";
  response.status(400).json({ success: false, message });
};

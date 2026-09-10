import { authorizedFetch } from "../admin-dashboard.service";
import { AdminImpactPost, ImpactPostForm, ImpactPostListResponse, ImpactPostResponse, ImpactPostStatus, ImpactPostType } from "./admin-success-stories.types";

const parse = async <T extends { success: boolean; message?: string }>(response: Response) => {
  const result = await response.json() as T;
  if (!response.ok || !result.success) {
    if (response.status === 401 || response.status === 403) throw new Error("SESSION_INVALID");
    const error = new Error(result.message ?? "Unable to process the post.") as Error & { status?: number; details?: T };
    error.status = response.status;
    error.details = result;
    throw error;
  }
  return result;
};

const toFormData = (form: ImpactPostForm, includeMedia: boolean) => {
  const data = new FormData();
  data.set("postType", form.postType);
  data.set("title", form.title.trim());
  data.set("story", form.story.trim());
  data.set("status", form.status);
  if (includeMedia && form.media) data.set("media", form.media);
  return data;
};

export const fetchImpactPosts = async (type?: ImpactPostType): Promise<AdminImpactPost[]> => {
  const query = new URLSearchParams({ page: "1", limit: "50" });
  if (type) query.set("type", type);
  const response = await authorizedFetch(`/api/admin/success-stories-posts?${query}`);
  const result = await parse<ImpactPostListResponse>(response);
  return result.data?.items ?? [];
};

export const publishImpactPost = async (form: ImpactPostForm) => parse<ImpactPostResponse>(await authorizedFetch("/api/admin/success-stories-posts", { method: "POST", body: toFormData(form, true) }));

export const updateImpactPost = async (postId: string, form: ImpactPostForm) => parse<ImpactPostResponse>(await authorizedFetch(`/api/admin/success-stories-posts/${encodeURIComponent(postId)}`, { method: "PATCH", body: toFormData(form, Boolean(form.media)) }));

export const changeImpactPostStatus = async (postId: string, status: ImpactPostStatus) => {
  const data = new FormData(); data.set("status", status);
  return parse<ImpactPostResponse>(await authorizedFetch(`/api/admin/success-stories-posts/${encodeURIComponent(postId)}`, { method: "PATCH", body: data }));
};

export const deleteImpactPost = async (postId: string) => parse<{ success: boolean; message: string }>(await authorizedFetch(`/api/admin/success-stories-posts/${encodeURIComponent(postId)}`, { method: "DELETE" }));

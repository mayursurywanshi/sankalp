export type ImpactPostType = "SUCCESS_STORY" | "PARENT_FEEDBACK";
export type ImpactPostStatus = "PUBLISHED" | "ARCHIVED";

export interface AdminImpactPost {
  id: string;
  postType: ImpactPostType;
  title: string;
  story: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  originalFileName: string;
  mimeType: string;
  status: ImpactPostStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  admin: { fullName: string } | null;
}

export interface ImpactPostForm {
  postType: ImpactPostType;
  title: string;
  story: string;
  status: ImpactPostStatus;
  media: File | null;
}

export interface ImpactPostListResponse {
  success: boolean;
  message?: string;
  data?: { items: AdminImpactPost[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
  errors?: Record<string, string[]>;
}

export interface ImpactPostResponse {
  success: boolean;
  message: string;
  data?: AdminImpactPost;
  errors?: Record<string, string[]>;
}

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import { clearAccessToken } from "../../login/auth-storage";
import { logoutAdmin } from "../admin-dashboard.service";
import { changeImpactPostStatus, deleteImpactPost, fetchImpactPosts, publishImpactPost, updateImpactPost } from "./admin-success-stories.service";
import { AdminImpactPost, ImpactPostForm, ImpactPostType } from "./admin-success-stories.types";
import "./AdminSuccessStories.css";

const emptyForm = (postType: ImpactPostType): ImpactPostForm => ({ postType, title: "", story: "", status: "PUBLISHED", media: null });
const acceptedMedia = "image/jpeg,image/png,image/webp,video/mp4";

export const AdminSuccessStories = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ImpactPostType>("SUCCESS_STORY");
  const [posts, setPosts] = useState<AdminImpactPost[]>([]);
  const [form, setForm] = useState<ImpactPostForm>(emptyForm("SUCCESS_STORY"));
  const [editing, setEditing] = useState<AdminImpactPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminImpactPost | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleError = useCallback((reason: unknown, fallback: string) => {
    if (reason instanceof Error && reason.message === "SESSION_INVALID") { clearAccessToken(); navigate("/login", { replace: true }); return; }
    const detail = reason as Error & { details?: { message?: string; errors?: Record<string, string[]> } };
    setFieldErrors(detail.details?.errors ?? {});
    setMessage({ type: "error", text: detail.details?.message ?? detail.message ?? fallback });
  }, [navigate]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try { setPosts(await fetchImpactPosts()); }
    catch (reason) { handleError(reason, "Unable to load Success Stories."); }
    finally { setLoading(false); }
  }, [handleError]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);
  useEffect(() => () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const visiblePosts = useMemo(() => posts.filter((post) => post.postType === activeTab), [posts, activeTab]);

  const switchTab = (postType: ImpactPostType) => {
    setActiveTab(postType); setEditing(null); setForm(emptyForm(postType)); setPreviewUrl(""); setMessage(null); setFieldErrors({});
  };

  const changeText = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); setFieldErrors((current) => ({ ...current, [name]: [] })); setMessage(null);
  };

  const changeMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const media = event.target.files?.[0] ?? null;
    if (media && media.size > 100 * 1024 * 1024) { setMessage({ type: "error", text: "The selected file must not exceed 100 MB." }); event.target.value = ""; return; }
    setForm((current) => ({ ...current, media }));
    setPreviewUrl(media ? URL.createObjectURL(media) : editing?.mediaUrl ?? "");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage(null); setFieldErrors({});
    if (!editing && !form.media) { setMessage({ type: "error", text: "Select one photo or MP4 video." }); return; }
    setSubmitting(true);
    try {
      const result = editing ? await updateImpactPost(editing.id, form) : await publishImpactPost(form);
      setMessage({ type: "success", text: result.message }); setEditing(null); setForm(emptyForm(activeTab)); setPreviewUrl(""); await loadPosts();
    } catch (reason) { handleError(reason, "Unable to publish the post."); }
    finally { setSubmitting(false); }
  };

  const editPost = (post: AdminImpactPost) => {
    setActiveTab(post.postType); setEditing(post); setForm({ postType: post.postType, title: post.title, story: post.story, status: post.status, media: null }); setPreviewUrl(post.mediaUrl); setMessage(null); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePublished = async (post: AdminImpactPost) => {
    setMessage(null);
    try { const next = post.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"; const result = await changeImpactPostStatus(post.id, next); setMessage({ type: "success", text: result.message }); await loadPosts(); }
    catch (reason) { handleError(reason, "Unable to update post visibility."); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return; setSubmitting(true);
    try { const result = await deleteImpactPost(deleteTarget.id); setDeleteTarget(null); setMessage({ type: "success", text: result.message }); await loadPosts(); }
    catch (reason) { handleError(reason, "Unable to delete the post."); }
    finally { setSubmitting(false); }
  };

  const logout = async () => { setLoggingOut(true); await logoutAdmin(); navigate("/login", { replace: true }); };

  return <div className="admin-impact-shell">
    <AdminSidebar onLogout={() => void logout()} loggingOut={loggingOut} />
    <main className="admin-impact-page">
      <header className="admin-impact-heading"><div><small>STORIES THAT INSPIRE</small><h1>Success Stories & Feedback</h1><p>Publish meaningful progress and family experiences on the public Our Impact page.</p></div><span>🌈</span></header>
      {message && <p className={`admin-impact-alert admin-impact-alert--${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
      <div className="admin-impact-workspace">
        <section className="admin-impact-library">
          <nav className="admin-impact-tabs" aria-label="Post type"><button type="button" className={activeTab === "SUCCESS_STORY" ? "is-active" : ""} onClick={() => switchTab("SUCCESS_STORY")}>Success Stories <b>{posts.filter((post) => post.postType === "SUCCESS_STORY").length}</b></button><button type="button" className={activeTab === "PARENT_FEEDBACK" ? "is-active" : ""} onClick={() => switchTab("PARENT_FEEDBACK")}>Parent Feedback <b>{posts.filter((post) => post.postType === "PARENT_FEEDBACK").length}</b></button></nav>
          {loading ? <div className="admin-impact-empty">Loading posts…</div> : visiblePosts.length === 0 ? <div className="admin-impact-empty"><span>🧸</span><h2>No posts yet</h2><p>Publish the first {activeTab === "SUCCESS_STORY" ? "success story" : "parent feedback"} using the form.</p></div> : <div className="admin-impact-grid">{visiblePosts.map((post) => <article className="admin-impact-card" key={post.id}>
            <div className="admin-impact-card__media">{post.mediaType === "VIDEO" ? <video controls preload="metadata"><source src={post.mediaUrl} type="video/mp4" /></video> : <img src={post.mediaUrl} alt={post.title} loading="lazy" />}</div>
            <div className="admin-impact-card__body"><div className="admin-impact-card__label"><span>{post.postType === "SUCCESS_STORY" ? "Success Story" : "Parent Feedback"}</span><i className={post.status === "PUBLISHED" ? "is-published" : "is-archived"}>{post.status}</i></div><h2>{post.title}</h2><p>{post.story}</p><small>Published {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · By {post.admin?.fullName ?? "Admin"}</small><div className="admin-impact-card__actions"><button type="button" onClick={() => editPost(post)} aria-label={`Edit ${post.title}`}><b aria-hidden="true">✎</b><span>Edit</span></button><button type="button" onClick={() => void togglePublished(post)} aria-label={`${post.status === "PUBLISHED" ? "Archive" : "Publish"} ${post.title}`}><b aria-hidden="true">{post.status === "PUBLISHED" ? "◉" : "◎"}</b><span>{post.status === "PUBLISHED" ? "Archive" : "Publish"}</span></button><button className="is-delete" type="button" onClick={() => setDeleteTarget(post)} aria-label={`Delete ${post.title}`}><b aria-hidden="true">🗑</b><span>Delete</span></button></div></div>
          </article>)}</div>}
        </section>
        <aside className="admin-impact-editor"><header><span>{editing ? "✏️" : "☁️"}</span><div><small>{editing ? "UPDATE POST" : "CREATE A NEW POST"}</small><h2>{editing ? "Edit Story / Feedback" : "Add New Story / Feedback"}</h2></div></header>
          <form onSubmit={submit}><fieldset><legend>Type</legend><label><input type="radio" checked={form.postType === "SUCCESS_STORY"} onChange={() => { setForm((current) => ({ ...current, postType: "SUCCESS_STORY" })); setActiveTab("SUCCESS_STORY"); }} /> Success Story</label><label><input type="radio" checked={form.postType === "PARENT_FEEDBACK"} onChange={() => { setForm((current) => ({ ...current, postType: "PARENT_FEEDBACK" })); setActiveTab("PARENT_FEEDBACK"); }} /> Parent Feedback</label></fieldset>
            <label>Title<input name="title" maxLength={150} value={form.title} onChange={changeText} placeholder="Enter a clear post title" required />{fieldErrors.title?.[0] && <small>{fieldErrors.title[0]}</small>}</label>
            <label>Upload Photo / Video<span className="admin-impact-upload"><input type="file" accept={acceptedMedia} onChange={changeMedia} /><b>☁</b><strong>Click to upload</strong><small>JPG, PNG, WebP or MP4 (maximum 100 MB)</small></span></label>
            {previewUrl && <div className="admin-impact-preview">{(form.media?.type ?? editing?.mimeType)?.startsWith("video/") ? <video src={previewUrl} controls /> : <img src={previewUrl} alt="Selected post preview" />}</div>}
            <label>Story / Feedback<textarea name="story" minLength={10} maxLength={5000} value={form.story} onChange={changeText} placeholder="Write the story or family feedback…" required />{fieldErrors.story?.[0] && <small>{fieldErrors.story[0]}</small>}<em>{form.story.length}/5000</em></label>
            <div className="admin-impact-editor__actions"><button type="submit" disabled={submitting}>{submitting ? "Saving…" : editing ? "Save Changes" : "Publish"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm(activeTab)); setPreviewUrl(""); }}>Cancel</button>}</div>
          </form>
        </aside>
      </div>
    </main>
    {deleteTarget && <div className="admin-impact-modal" role="dialog" aria-modal="true" aria-labelledby="delete-impact-title"><div><span>🗑️</span><h2 id="delete-impact-title">Delete this post?</h2><p><strong>{deleteTarget.title}</strong> and its uploaded media will be permanently removed.</p><footer><button type="button" onClick={() => setDeleteTarget(null)} disabled={submitting}>Keep Post</button><button className="is-delete" type="button" onClick={() => void confirmDelete()} disabled={submitting}>{submitting ? "Deleting…" : "Delete Post"}</button></footer></div></div>}
  </div>;
};

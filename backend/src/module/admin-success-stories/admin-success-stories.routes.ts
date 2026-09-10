import { Router } from "express";
import { getPost, getPosts, handleUploadError, patchPost, postPost, removePost } from "./admin-success-stories.controller";
import { uploadImpactMedia } from "./admin-success-stories.upload";

const adminSuccessStoriesRouter = Router();
adminSuccessStoriesRouter.get("/", getPosts);
adminSuccessStoriesRouter.post("/", uploadImpactMedia, postPost, handleUploadError);
adminSuccessStoriesRouter.get("/:postId", getPost);
adminSuccessStoriesRouter.patch("/:postId", uploadImpactMedia, patchPost, handleUploadError);
adminSuccessStoriesRouter.delete("/:postId", removePost);

export default adminSuccessStoriesRouter;

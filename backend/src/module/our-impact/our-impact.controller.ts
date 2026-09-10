import { Request, Response } from "express";
import { OUR_IMPACT_CONTENT } from "../../constants/our-impact.constants";
import { listPublishedImpactPosts } from "../admin-success-stories/admin-success-stories.service";

export const getOurImpact = async (request: Request, response: Response): Promise<void> => {
  try {
    const posts = await listPublishedImpactPosts();
    const origin = `${request.protocol}://${request.get("host")}`;
    response.status(200).json({
      success: true,
      data: {
        ...OUR_IMPACT_CONTENT,
        communityPosts: posts.map((post) => ({ ...post, mediaUrl: `${origin}${post.mediaUrl}` })),
      },
    });
  } catch (error) {
    console.error("Unable to load Our Impact content", error);
    response.status(500).json({ success: false, message: "Unable to load Our Impact content." });
  }
};

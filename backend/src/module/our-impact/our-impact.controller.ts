import { Request, Response } from "express";
import { OUR_IMPACT_CONTENT } from "../../constants/our-impact.constants";
import { listPublishedImpactPosts } from "../admin-success-stories/admin-success-stories.service";
import { listApprovedParentFeedback } from "../feedback/feedback.service";

export const getOurImpact = async (request: Request, response: Response): Promise<void> => {
  try {
    const [posts, approvedFeedback] = await Promise.all([listPublishedImpactPosts(), listApprovedParentFeedback()]);
    const origin = `${request.protocol}://${request.get("host")}`;
    response.status(200).json({
      success: true,
      data: {
        ...OUR_IMPACT_CONTENT,
        testimonials: {
          ...OUR_IMPACT_CONTENT.testimonials,
          items: [
            ...approvedFeedback.map((item) => ({ id: item.id, rating: item.rating, quote: item.feedback, parentName: item.parentDisplayName, relation: "Sankalp Parent" })),
            ...OUR_IMPACT_CONTENT.testimonials.items,
          ],
        },
        communityPosts: posts.map((post) => ({ ...post, mediaUrl: `${origin}${post.mediaUrl}` })),
      },
    });
  } catch (error) {
    console.error("Unable to load Our Impact content", error);
    response.status(500).json({ success: false, message: "Unable to load Our Impact content." });
  }
};

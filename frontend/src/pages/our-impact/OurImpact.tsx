import { useEffect, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import heroImage from "../../assets/our-impact/impact-hero.webp";
import featuredImage from "../../assets/our-impact/featured-aarav.webp";
import vihaanImage from "../../assets/our-impact/stories/vihaan.webp";
import myraImage from "../../assets/our-impact/stories/myra.webp";
import anayaImage from "../../assets/our-impact/stories/anaya.webp";
import anayaVideoImage from "../../assets/our-impact/videos/anaya-family.webp";
import vihaanVideoImage from "../../assets/our-impact/videos/vihaan-family.webp";
import aaravVideoImage from "../../assets/our-impact/videos/aarav-family.webp";
import { getOurImpactContent } from "./our-impact.service";
import { CommunityImpactPost, OurImpactContent } from "./our-impact.types";
import "./OurImpact.css";

const storyImages: Record<string, string> = { vihaan: vihaanImage, myra: myraImage, anaya: anayaImage };
const videoImages: Record<string, string> = { "anaya-family": anayaVideoImage, "vihaan-family": vihaanVideoImage, "aarav-family": aaravVideoImage };

interface StoryPopupContent {
  id: string;
  title: string;
  childDetails?: string;
  paragraphs: string[];
  highlights?: string[];
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
}

const CommunityPostMedia = ({ post }: { post: CommunityImpactPost }) => post.mediaType === "VIDEO"
  ? <video controls preload="metadata" aria-label={`${post.title} video`}><source src={post.mediaUrl} type="video/mp4" />Your browser does not support this video.</video>
  : <img src={post.mediaUrl} alt={post.title} loading="lazy" />;

const CommunityPosts = ({ posts, type, onRead }: { posts: CommunityImpactPost[]; type: CommunityImpactPost["postType"]; onRead: (story: StoryPopupContent) => void }) => {
  const seenPosts = new Set<string>();
  const matchingPosts = posts.filter((post) => {
    if (post.postType !== type) return false;
    const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const key = `${post.postType}|${normalize(post.title)}|${normalize(post.story)}`;
    if (seenPosts.has(key)) return false;
    seenPosts.add(key);
    return true;
  });
  if (matchingPosts.length === 0) return null;
  const isStory = type === "SUCCESS_STORY";

  return (
    <section className={`impact-section community-impact community-impact--${isStory ? "stories" : "feedback"}`} aria-labelledby={`community-${type.toLowerCase()}-title`}>
      <header><span>{isStory ? "Recently shared by Sankalp" : "New experiences from our families"}</span><h2 id={`community-${type.toLowerCase()}-title`}>{isStory ? "Latest Success Stories" : "Latest Parent Feedback"}</h2></header>
      <div className="community-impact__grid">
        {matchingPosts.map((post) => <article className="community-post-card" key={post.id}>
          <div className="community-post-card__media"><CommunityPostMedia post={post} /></div>
          <div className="community-post-card__content">
            <span>{isStory ? "Success Story" : "Parent Feedback"}</span>
            <h3>{post.title}</h3>
            <p>{post.story}</p>
            <small>Published {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(post.publishedAt))}</small>
            {isStory && <button className="impact-read-button" type="button" onClick={() => onRead({ id: post.id, title: post.title, paragraphs: [post.story], mediaUrl: post.mediaUrl, mediaType: post.mediaType })}>Read Full Story</button>}
          </div>
        </article>)}
      </div>
    </section>
  );
};

const StoryPopup = ({ story, onClose }: { story: StoryPopupContent; onClose: () => void }) => <div className="impact-story-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
  <article className="impact-story-modal__card" role="dialog" aria-modal="true" aria-labelledby="impact-story-modal-title">
    <button className="impact-story-modal__close" type="button" onClick={onClose} aria-label="Close full story" />
    <div className="impact-story-modal__media">{story.mediaType === "VIDEO" ? <video controls autoPlay={false} preload="metadata"><source src={story.mediaUrl} type="video/mp4" /></video> : <img src={story.mediaUrl} alt={story.title} />}</div>
    <div className="impact-story-modal__content"><span>FULL SUCCESS STORY</span><h2 id="impact-story-modal-title">{story.title}</h2>{story.childDetails && <strong>{story.childDetails}</strong>}{story.paragraphs.map((paragraph, index) => <p key={`${story.id}-${index}`}>{paragraph}</p>)}{story.highlights && story.highlights.length > 0 && <><h3>Progress highlights</h3><ul>{story.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></>}<button className="impact-story-modal__done" type="button" onClick={onClose}>Close Story</button></div>
  </article>
</div>;

const StatisticIcon = ({ index }: { index: number }) => {
  const icons = [
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="9" r="5" /><path d="M16 22c1-6 4-9 8-9s7 3 8 9v8M15 24l9 5 9-5M20 28l-2 14M28 28l2 14M18 42h-5M30 42h5" /></svg>,
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="14" r="5" /><circle cx="32" cy="14" r="5" /><path d="M8 39V27c0-5 3-8 8-8s8 3 8 8v12M24 39V27c0-5 3-8 8-8s8 3 8 8v12M13 28v11M19 28v11M29 28v11M35 28v11" /></svg>,
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="22" cy="26" r="16" /><circle cx="22" cy="26" r="9" /><circle cx="22" cy="26" r="3" /><path d="m22 26 18-18M31 8h9v9" /></svg>,
    <svg className="impact-statistic__star" viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 5.8 11.7 12.9 1.9-9.4 9.1 2.2 12.9L24 34.5l-11.5 6.1 2.2-12.9-9.4-9.1 12.9-1.9L24 5Z" /></svg>,
  ];

  return icons[index] ?? icons[0];
};

export const OurImpact = () => {
  const [content, setContent] = useState<OurImpactContent | null>(null);
  const [error, setError] = useState("");
  const [openStory, setOpenStory] = useState<StoryPopupContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    getOurImpactContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setError("We could not load the Our Impact page. Please try again."); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!openStory) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenStory(null); };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openStory]);

  if (error) return <main className="impact-status" role="alert"><h1>Unable to load Our Impact</h1><p>{error}</p></main>;
  if (!content) return <PageSkeleton cards={4} />;

  return (
    <main className="impact-page">
      <section className="impact-hero" aria-labelledby="impact-title">
        <div className="impact-hero__copy interactive-card"><span>Stories that inspire us</span><h1 id="impact-title">{content.hero.title}</h1><h2>{content.hero.tagline}</h2><p>{content.hero.description}</p></div>
        <div className="impact-hero__image interactive-card"><img src={heroImage} alt="Pediatric therapist supporting a child through play" /></div>
      </section>

      <section className="impact-statistics" aria-label="Sankalp impact statistics">
        {content.statistics.map((statistic, index) => <article className={`impact-statistic impact-statistic--${index + 1} interactive-card`} key={statistic.id}><span className={`impact-statistic__icon impact-statistic__icon--${index + 1}`}><StatisticIcon index={index} /></span><strong>{statistic.value}</strong><span className="impact-statistic__label">{statistic.label}</span><small>{statistic.description}</small></article>)}
      </section>

      <section className="featured-impact interactive-card" aria-labelledby="featured-story-title">
        <img src={featuredImage} alt={`${content.featuredStory.childName}'s progress journey`} />
        <div className="featured-impact__copy"><span>Featured success story</span><h2 id="featured-story-title">{content.featuredStory.title}</h2><p className="featured-impact__child">{content.featuredStory.childName}, {content.featuredStory.age}</p><p>{content.featuredStory.summary}</p><ul>{content.featuredStory.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul><button className="impact-read-button" type="button" onClick={() => setOpenStory({ id: content.featuredStory.id, title: content.featuredStory.title, childDetails: `${content.featuredStory.childName}, ${content.featuredStory.age}`, paragraphs: content.featuredStory.fullStory, highlights: content.featuredStory.highlights, mediaUrl: featuredImage, mediaType: "IMAGE" })}>{content.featuredStory.buttonLabel}</button></div>
      </section>

      <section className="impact-section impact-journeys" aria-labelledby="journeys-title">
        <header><span>Progress through personalized care</span><h2 id="journeys-title">More Success Stories</h2></header>
        <div className="impact-journeys__grid">{content.successStories.map((story) => <article className="impact-story-card interactive-card" key={story.id}><img src={storyImages[story.imageKey]} alt={`${story.childName}'s success story`} /><div><span>{story.childName}, {story.age}</span><h3>{story.title}</h3><p>{story.summary}</p><button className="impact-read-button" type="button" onClick={() => setOpenStory({ id: story.id, title: story.title, childDetails: `${story.childName}, ${story.age}`, paragraphs: story.fullStory, mediaUrl: storyImages[story.imageKey] ?? heroImage, mediaType: "IMAGE" })}>{story.buttonLabel}</button></div></article>)}</div>
      </section>

      <CommunityPosts posts={content.communityPosts ?? []} type="SUCCESS_STORY" onRead={setOpenStory} />

      <section className="impact-section parent-testimonials" aria-labelledby="testimonials-title">
        <header><span>{content.testimonials.subtitle}</span><h2 id="testimonials-title">{content.testimonials.title}</h2></header>
        <div className="parent-testimonials__grid">{content.testimonials.items.map((testimonial) => <article className="testimonial-card interactive-card" key={testimonial.id}><div className="testimonial-card__rating" aria-label={`${testimonial.rating} out of 5 stars`}>{"★".repeat(testimonial.rating)}</div><blockquote>{testimonial.quote}</blockquote><strong>{testimonial.parentName}</strong><span>{testimonial.relation}</span></article>)}</div>
      </section>

      <CommunityPosts posts={content.communityPosts ?? []} type="PARENT_FEEDBACK" onRead={setOpenStory} />

      <section className="impact-section video-testimonials" aria-labelledby="videos-title">
        <header><span>Families sharing their experiences</span><h2 id="videos-title">{content.videoTestimonials.title}</h2></header>
        <div className="video-testimonials__grid">{content.videoTestimonials.items.map((video) => <a className="video-card interactive-card" href={video.videoUrl} aria-label={`Play ${video.title}`} key={video.id}><span className="video-card__image"><img src={videoImages[video.thumbnailKey]} alt="" aria-hidden="true" /><span className="video-card__play">▶</span></span><strong>{video.title}</strong></a>)}</div>
      </section>
      {openStory && <StoryPopup story={openStory} onClose={() => setOpenStory(null)} />}
    </main>
  );
};

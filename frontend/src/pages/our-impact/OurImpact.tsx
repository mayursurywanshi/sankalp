import { useEffect, useState } from "react";
import { ButtonLink } from "../../components/button/ButtonLink";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import heroImage from "../../assets/our-impact/impact-hero.png";
import featuredImage from "../../assets/our-impact/featured-aarav.png";
import vihaanImage from "../../assets/our-impact/stories/vihaan.png";
import myraImage from "../../assets/our-impact/stories/myra.png";
import anayaImage from "../../assets/our-impact/stories/anaya.png";
import anayaVideoImage from "../../assets/our-impact/videos/anaya-family.png";
import vihaanVideoImage from "../../assets/our-impact/videos/vihaan-family.png";
import aaravVideoImage from "../../assets/our-impact/videos/aarav-family.png";
import { getOurImpactContent } from "./our-impact.service";
import { OurImpactContent } from "./our-impact.types";
import "./OurImpact.css";

const storyImages: Record<string, string> = { vihaan: vihaanImage, myra: myraImage, anaya: anayaImage };
const videoImages: Record<string, string> = { "anaya-family": anayaVideoImage, "vihaan-family": vihaanVideoImage, "aarav-family": aaravVideoImage };

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

  useEffect(() => {
    let isMounted = true;
    getOurImpactContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setError("We could not load the Our Impact page. Please try again."); });
    return () => { isMounted = false; };
  }, []);

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
        <div className="featured-impact__copy"><span>Featured success story</span><h2 id="featured-story-title">{content.featuredStory.title}</h2><p className="featured-impact__child">{content.featuredStory.childName}, {content.featuredStory.age}</p><p>{content.featuredStory.summary}</p><ul>{content.featuredStory.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul><ButtonLink href={content.featuredStory.buttonHref} size="small">{content.featuredStory.buttonLabel}</ButtonLink></div>
      </section>

      <section className="impact-section impact-journeys" aria-labelledby="journeys-title">
        <header><span>Progress through personalized care</span><h2 id="journeys-title">More Success Stories</h2></header>
        <div className="impact-journeys__grid">{content.successStories.map((story) => <article className="impact-story-card interactive-card" key={story.id}><img src={storyImages[story.imageKey]} alt={`${story.childName}'s success story`} /><div><span>{story.childName}, {story.age}</span><h3>{story.title}</h3><p>{story.summary}</p><ButtonLink href={story.buttonHref} size="small">{story.buttonLabel}</ButtonLink></div></article>)}</div>
      </section>

      <section className="impact-section parent-testimonials" aria-labelledby="testimonials-title">
        <header><span>{content.testimonials.subtitle}</span><h2 id="testimonials-title">{content.testimonials.title}</h2></header>
        <div className="parent-testimonials__grid">{content.testimonials.items.map((testimonial) => <article className="testimonial-card interactive-card" key={testimonial.id}><div className="testimonial-card__rating" aria-label={`${testimonial.rating} out of 5 stars`}>{"★".repeat(testimonial.rating)}</div><blockquote>{testimonial.quote}</blockquote><strong>{testimonial.parentName}</strong><span>{testimonial.relation}</span></article>)}</div>
      </section>

      <section className="impact-section video-testimonials" aria-labelledby="videos-title">
        <header><span>Families sharing their experiences</span><h2 id="videos-title">{content.videoTestimonials.title}</h2></header>
        <div className="video-testimonials__grid">{content.videoTestimonials.items.map((video) => <a className="video-card interactive-card" href={video.videoUrl} aria-label={`Play ${video.title}`} key={video.id}><span className="video-card__image"><img src={videoImages[video.thumbnailKey]} alt="" aria-hidden="true" /><span className="video-card__play">▶</span></span><strong>{video.title}</strong></a>)}</div>
      </section>
    </main>
  );
};

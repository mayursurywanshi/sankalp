export interface ImpactStatistic { id: string; value: string; label: string; description: string; }
export interface ImpactStory { id: string; imageKey: string; childName: string; age: string; title: string; summary: string; buttonLabel: string; buttonHref: string; }
export interface ParentTestimonial { id: string; rating: number; quote: string; parentName: string; relation: string; }
export interface VideoTestimonial { id: string; title: string; thumbnailKey: string; videoUrl: string; }

export interface OurImpactContent {
  hero: { title: string; tagline: string; description: string };
  statistics: ImpactStatistic[];
  featuredStory: ImpactStory & { highlights: string[] };
  successStories: ImpactStory[];
  testimonials: { title: string; subtitle: string; items: ParentTestimonial[] };
  videoTestimonials: { title: string; items: VideoTestimonial[] };
}

export interface OurImpactResponse { success: boolean; data: OurImpactContent; }

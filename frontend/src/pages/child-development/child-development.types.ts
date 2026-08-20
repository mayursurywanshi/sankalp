export interface DevelopmentAgeGroup {
  id: string;
  label: string;
  title: string;
  milestones: string[];
  guidance: string;
}

export interface ChildDevelopmentContent {
  hero: { title: string; tagline: string; description: string };
  milestones: { title: string; description: string; ageGroups: DevelopmentAgeGroup[] };
}

export interface ChildDevelopmentResponse {
  success: boolean;
  data: ChildDevelopmentContent;
}

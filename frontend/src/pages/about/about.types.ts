export interface AboutTextSection {
  title: string;
  description: string;
}

export interface AboutContent {
  hero: {
    title: string;
    tagline: string;
    description: string[];
  };
  story: {
    title: string;
    description: string[];
  };
  mission: AboutTextSection;
  vision: AboutTextSection;
  values: {
    title: string;
    items: string[];
  };
  specialist: {
    sectionTitle: string;
    name: string;
    designation: string;
    qualifications: string[];
  };
  approach: {
    title: string;
    steps: AboutTextSection[];
    summary: string;
  };
  callToAction: {
    title: string;
    description: string;
    buttonLabel: string;
  };
}

export interface AboutResponse {
  success: boolean;
  data: AboutContent;
}

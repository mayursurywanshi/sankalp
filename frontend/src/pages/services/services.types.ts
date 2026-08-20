export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  color: string;
}

export interface ServicesContent {
  hero: {
    title: string;
    description: string;
  };
  services: ServiceItem[];
}

export interface ServicesResponse {
  success: boolean;
  data: ServicesContent;
}

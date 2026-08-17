export interface HomeContent {
  title: string;
  description: string;
}

export interface HomeResponse {
  success: boolean;
  data: HomeContent;
}

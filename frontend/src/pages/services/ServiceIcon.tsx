import { ReactElement } from "react";

interface ServiceIconProps {
  serviceId: string;
}

export const ServiceIcon = ({ serviceId }: ServiceIconProps) => {
  const paths: Record<string, ReactElement> = {
    "pediatric-physiotherapy": <><circle cx="25" cy="14" r="5" /><path d="M24 20 15 31m9-11 8 8m-11-4 8 16m-3-8-9 8M9 15l6-5 6 5" /></>,
    "developmental-assessment": <><path d="M12 28c-5-5-3-13 4-14 2-8 13-8 15-1 8 0 10 10 4 14 3 7-5 13-11 8-6 5-15-1-12-7Z" /><path d="M18 19v8m6-12v17m6-13v9" /></>,
    "neuromotor-therapy": <><circle cx="18" cy="13" r="5" /><circle cx="31" cy="17" r="4" /><path d="M9 39c1-10 5-16 11-16 7 0 11 5 12 14m-12-6 8 3m-9-2-5 8m17-11 8 7m-3-14 4 5" /></>,
    "sensory-integration-therapy": <><path d="M17 9v14m-6-9 6 9m7-15v15m7-11-7 11m14-5-11 9" /><path d="M12 27c3-5 9-4 11 1 3-4 9-3 10 2 2 8-7 12-12 8-5 4-13-1-9-11Z" /></>,
    "gait-training": <><circle cx="24" cy="11" r="5" /><path d="m22 17-4 10 8 5 2 9m-10-14-7 7m15-2 9-5m-17 5-5 9" /><path d="M7 43h34" /></>,
    "postural-management": <><path d="M12 12h24v29H12zM18 12V7h12v5" /><path d="M18 21h12m-9 0v7m6-7v7m-9 7h12" /></>,
  };

  return <svg viewBox="0 0 48 48" aria-hidden="true">{paths[serviceId]}</svg>;
};

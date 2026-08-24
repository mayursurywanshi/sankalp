import { useEffect, useState } from "react";
import { HeroSection } from "./HeroSection";
import { WhyChooseUs } from "./WhyChooseUs";
import { HomeGuidance } from "./HomeGuidance";
import { getHomeContent } from "./home.service";

const fallbackDescription =
  "Compassionate physiotherapy and developmental care to help every child move, grow, and thrive.";

export const Home = () => {
  const [description, setDescription] = useState(fallbackDescription);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getHomeContent()
      .then(({ data }) => { if (isMounted) setDescription(data.description); })
      .catch(() => { if (isMounted) setDescription(fallbackDescription); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      <HeroSection description={description} isLoading={isLoading} />
      <WhyChooseUs />
      <HomeGuidance />
    </>
  );
};

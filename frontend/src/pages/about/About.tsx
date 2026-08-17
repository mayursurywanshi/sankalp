import { useEffect, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import { AboutCallToAction } from "./AboutCallToAction";
import { AboutHero } from "./AboutHero";
import { ApproachSection } from "./ApproachSection";
import { getAboutContent } from "./about.service";
import { AboutContent } from "./about.types";
import { PurposeSection } from "./PurposeSection";
import { SpecialistSection } from "./SpecialistSection";
import { StorySection } from "./StorySection";
import "./About.css";

export const About = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getAboutContent()
      .then(({ data }) => {
        if (isMounted) setContent(data);
      })
      .catch(() => {
        if (isMounted) setError("We could not load the About page. Please try again.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <main className="about-status" role="alert">
        <h1>Unable to load About Sankalp</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!content) {
    return <PageSkeleton cards={3} />;
  }

  return (
    <main className="about-page">
      <AboutHero content={content.hero} />
      <div className="about-story-purpose">
        <StorySection content={content.story} />
        <PurposeSection mission={content.mission} vision={content.vision} values={content.values} />
      </div>
      <div className="about-details">
        <SpecialistSection content={content.specialist} />
        <ApproachSection content={content.approach} />
      </div>
      <AboutCallToAction content={content.callToAction} />
    </main>
  );
};

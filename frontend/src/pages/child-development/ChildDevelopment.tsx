import { useEffect, useState } from "react";
import { ButtonLink } from "../../components/button/ButtonLink";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import heroImage from "../../assets/child-development/child-development-hero.png";
import earlyInterventionImage from "../../assets/child-development/early-intervention.png";
import zeroToTwoYearsImage from "../../assets/child-development/milestones/0-2-years.png";
import twoToFourYearsImage from "../../assets/child-development/milestones/2-4-years.png";
import fourToSixYearsImage from "../../assets/child-development/milestones/4-6-years.png";
import sixToEightYearsImage from "../../assets/child-development/milestones/6-8-years.png";
import eightToTenYearsImage from "../../assets/child-development/milestones/8-10-years.png";
import tenToTwelveYearsImage from "../../assets/child-development/milestones/10-12-years.png";
import twelvePlusYearsImage from "../../assets/child-development/milestones/12-plus-years.png";
import { getChildDevelopmentContent } from "./child-development.service";
import { ChildDevelopmentContent } from "./child-development.types";
import "./ChildDevelopment.css";

const milestoneImages: Record<string, string> = {
  "0-2-years": zeroToTwoYearsImage,
  "2-4-years": twoToFourYearsImage,
  "4-6-years": fourToSixYearsImage,
  "6-8-years": sixToEightYearsImage,
  "8-10-years": eightToTenYearsImage,
  "10-12-years": tenToTwelveYearsImage,
  "12-plus-years": twelvePlusYearsImage,
};

export const ChildDevelopment = () => {
  const [content, setContent] = useState<ChildDevelopmentContent | null>(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getChildDevelopmentContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setError("We could not load the Child Development page. Please try again."); });
    return () => { isMounted = false; };
  }, []);

  if (error) {
    return <main className="child-development-status" role="alert"><h1>Unable to load Child Development</h1><p>{error}</p></main>;
  }
  if (!content) return <PageSkeleton cards={6} />;

  const selectedAgeGroup = content.milestones.ageGroups[activeAgeGroup];
  if (!selectedAgeGroup) return null;

  return (
    <main className="child-development-page">
      <section className="child-development-hero" aria-labelledby="child-development-title">
        <div className="child-development-hero__copy interactive-card">
          <span>Supporting every stage</span>
          <h1 id="child-development-title">{content.hero.title}</h1>
          <h2>{content.hero.tagline}</h2>
          <p>{content.hero.description}</p>
        </div>
        <div className="child-development-hero__image interactive-card">
          <img src={heroImage} alt="Pediatric therapist helping a child learn through play" />
        </div>
      </section>

      <section className="development-milestones" aria-labelledby="milestones-title">
        <header className="development-milestones__heading">
          <span>Growing step by step</span>
          <h2 id="milestones-title">{content.milestones.title}</h2>
          <p>{content.milestones.description}</p>
        </header>
        <div className="development-tabs" role="tablist" aria-label="Developmental age groups">
          {content.milestones.ageGroups.map((ageGroup, index) => (
            <button id={`age-tab-${ageGroup.id}`} className={activeAgeGroup === index ? "development-tab is-active" : "development-tab"} type="button" role="tab" aria-selected={activeAgeGroup === index} aria-controls={`age-panel-${ageGroup.id}`} onClick={() => setActiveAgeGroup(index)} key={ageGroup.id}>
              {ageGroup.label}
            </button>
          ))}
        </div>
        <article id={`age-panel-${selectedAgeGroup.id}`} className="milestone-card interactive-card" role="tabpanel" aria-labelledby={`age-tab-${selectedAgeGroup.id}`}>
          <div className="milestone-card__image">
            <img src={milestoneImages[selectedAgeGroup.id]} alt={`Child demonstrating milestones for ${selectedAgeGroup.title}`} />
          </div>
          <div className="milestone-card__content">
            <span className="milestone-card__age">Development at</span>
            <h3>{selectedAgeGroup.title}</h3>
            <ul>{selectedAgeGroup.milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}</ul>
            <p>{selectedAgeGroup.guidance}</p>
          </div>
        </article>
      </section>

      <section className="early-intervention-card interactive-card" aria-labelledby="early-intervention-title">
        <div className="early-intervention-card__copy">
          <span>Timely support matters</span>
          <h2 id="early-intervention-title">{content.earlyIntervention.title}</h2>
          <p>{content.earlyIntervention.description}</p>
          <ButtonLink href={content.earlyIntervention.buttonHref}>{content.earlyIntervention.buttonLabel}</ButtonLink>
        </div>
        <img src={earlyInterventionImage} alt="Therapists supporting a child during an early intervention activity" />
      </section>
    </main>
  );
};

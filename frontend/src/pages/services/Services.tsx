import { useEffect, useState } from "react";
import { PageSkeleton } from "../../components/loading/PageSkeleton";
import heroImage from "../../assets/services/services-hero.png";
import pediatricPhysiotherapyImage from "../../assets/services/cards/pediatric-physiotherapy.png";
import developmentalAssessmentImage from "../../assets/services/cards/developmental-assessment.png";
import neuromotorTherapyImage from "../../assets/services/cards/neuromotor-therapy.png";
import sensoryIntegrationImage from "../../assets/services/cards/sensory-integration-therapy.png";
import gaitTrainingImage from "../../assets/services/cards/gait-training.png";
import posturalManagementImage from "../../assets/services/cards/postural-management.png";
import { ServiceIcon } from "./ServiceIcon";
import { getServicesContent } from "./services.service";
import { ServicesContent } from "./services.types";
import "./Services.css";

const serviceImages: Record<string, string> = {
  "pediatric-physiotherapy": pediatricPhysiotherapyImage,
  "developmental-assessment": developmentalAssessmentImage,
  "neuromotor-therapy": neuromotorTherapyImage,
  "sensory-integration-therapy": sensoryIntegrationImage,
  "gait-training": gaitTrainingImage,
  "postural-management": posturalManagementImage,
};

export const Services = () => {
  const [content, setContent] = useState<ServicesContent | null>(null);
  const [error, setError] = useState("");
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    getServicesContent()
      .then(({ data }) => { if (isMounted) setContent(data); })
      .catch(() => { if (isMounted) setError("We could not load the services. Please try again."); });

    return () => { isMounted = false; };
  }, []);

  if (error) {
    return <main className="services-status" role="alert"><h1>Unable to load Services</h1><p>{error}</p></main>;
  }

  if (!content) {
    return <PageSkeleton />;
  }

  return (
    <main className="services-page">
      <section className="services-hero" aria-labelledby="services-title">
        <div className="services-hero__copy">
          <span className="services-eyebrow">Care designed around every child</span>
          <h1 id="services-title">{content.hero.title}</h1>
          <p>{content.hero.description}</p>
        </div>
        <div className="services-hero__image">
          <img src={heroImage} alt="Pediatric therapist helping a child balance on a therapy ball" />
        </div>
      </section>

      <section className="services-list" aria-labelledby="services-list-title">
        <div className="services-list__heading">
          <span>How we can help</span>
          <h2 id="services-list-title">Support for every step of their journey</h2>
          <p>Specialized therapy that helps children build skills, independence and confidence.</p>
        </div>
        <div className="services-grid">
          {content.services.map((service, index) => (
            <article className={`service-card service-card--${service.color} ${activeCard === index ? "is-flipped" : ""}`} key={service.id}>
              <button
                className="service-card__button"
                type="button"
                aria-pressed={activeCard === index}
                aria-label={`${service.title}. ${activeCard === index ? "Show image" : "Show details"}`}
                onClick={() => setActiveCard((current) => current === index ? null : index)}
              >
                <span className="service-card__inner">
                  <span className="service-card__face service-card__front">
                    <img src={serviceImages[service.id]} alt="" aria-hidden="true" />
                    <span className="visually-hidden">{service.title}</span>
                  </span>
                  <span className="service-card__face service-card__back">
                    <span className="service-card__number">0{index + 1}</span>
                    <span className="service-card__icon"><ServiceIcon serviceId={service.id} /></span>
                    <h3 className="service-card__title">{service.title}</h3>
                    <p className="service-card__description">{service.description}</p>
                    <span className="service-card__hint">Click to return</span>
                  </span>
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
};

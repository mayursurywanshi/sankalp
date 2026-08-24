import { ReactNode, useState } from "react";
import expertCareImage from "../../assets/home-cards/expert-care.png";
import personalizedTherapyImage from "../../assets/home-cards/personalized-therapy.png";
import childCenteredImage from "../../assets/home-cards/child-centered.png";
import provenResultsImage from "../../assets/home-cards/proven-results.png";
import "./WhyChooseUs.css";

interface Feature {
  title: string;
  description: string;
  detail: string;
  color: string;
  icon: ReactNode;
}

const features: Feature[] = [
  { title: "Expert Care", description: "Experienced specialists dedicated to your child's well-being.", detail: "Our trained therapists combine clinical expertise with warm, attentive care for every child.", color: "purple",
    icon: <><circle cx="24" cy="18" r="7" /><path d="M10 41c1-9 7-14 14-14s13 5 14 14" /></> },
  { title: "Personalized Therapy", description: "Individualized treatment plans for better outcomes.", detail: "Each therapy plan is shaped around your child's abilities, needs, pace, and personal goals.", color: "teal",
    icon: <><path d="M24 41S8 32 8 19c0-8 10-11 16-3 6-8 16-5 16 3 0 13-16 22-16 22Z" /><path d="m17 25 5 5 10-11" /></> },
  { title: "Child-Centered", description: "Holistic care with compassion and patience.", detail: "Playful, positive sessions help children feel safe, engaged, understood, and ready to grow.", color: "violet",
    icon: <><circle cx="17" cy="18" r="6" /><circle cx="31" cy="18" r="6" /><path d="M12 39c1-8 5-12 12-12s11 4 12 12M24 27v13" /></> },
  { title: "Proven Results", description: "Helping children achieve their milestones with confidence.", detail: "Clear goals and regular progress tracking turn small steps into meaningful, lasting milestones.", color: "coral",
    icon: <><path d="M24 42S8 33 8 19c0-8 10-11 16-3 6-8 16-5 16 3 0 14-16 23-16 23Z" /><path d="m17 25 5 5 10-11" /></> },
];

const featureImages = [expertCareImage, personalizedTherapyImage, childCenteredImage, provenResultsImage];

export const WhyChooseUs = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="why-us" id="services" aria-labelledby="why-us-title">
      <h2 id="why-us-title">Why Choose Sankalp?</h2>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <article
            className={`feature-card ${activeCard === index ? "is-flipped" : ""}`}
            onMouseEnter={() => setActiveCard(index)}
            onMouseLeave={() => setActiveCard(null)}
            key={feature.title}
          >
            <button
              className="feature-card-button"
              type="button"
              aria-pressed={activeCard === index}
              aria-label={`${feature.title}. ${activeCard === index ? "Show summary" : "Show more"}`}
              onFocus={() => setActiveCard(index)}
              onBlur={() => setActiveCard(null)}
            >
              <span className="feature-card-inner">
                <span className="feature-card-face feature-card-front">
                  <span className="feature-animation-wrap">
                    <img src={featureImages[index]} alt="" aria-hidden="true" />
                  </span>
                  <span className="visually-hidden">{feature.title}. {feature.description}</span>
                </span>
                <span className={`feature-card-face feature-card-back ${feature.color}`}>
                  <span className={`feature-icon ${feature.color}`}>
                    <svg viewBox="0 0 48 48" aria-hidden="true">{feature.icon}</svg>
                  </span>
                  <span className="feature-title">{feature.title}</span>
                  <span className="feature-description">{feature.detail}</span>
                  <span className="feature-hint">Move cursor away to return</span>
                </span>
              </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

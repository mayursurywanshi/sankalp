import { useState } from "react";
import missionImage from "../../assets/about/purpose/mission.png";
import visionImage from "../../assets/about/purpose/vision.png";
import valuesImage from "../../assets/about/purpose/values.png";
import { AboutTextSection } from "./about.types";
import "./PurposeSection.css";

interface PurposeSectionProps {
  mission: AboutTextSection;
  vision: AboutTextSection;
  values: { title: string; items: string[] };
}

const MissionIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="9" /><circle cx="24" cy="24" r="2" /><path d="m26 21 10-10M31 11h5v5" /></svg>;
const VisionIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24s8-13 20-13 20 13 20 13-8 13-20 13S4 24 4 24Z" /><circle cx="24" cy="24" r="7" /></svg>;
const ValuesIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m7 16 8-8h18l8 8-17 25L7 16Z" /><path d="m15 8 9 33M33 8l-9 33M7 16h34M15 8l9 8 9-8" /></svg>;

export const PurposeSection = ({ mission, vision, values }: PurposeSectionProps) => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const cards = [
    { title: mission.title, image: missionImage, imageAlt: "Therapist and child working together toward a star", icon: <MissionIcon />, tone: "mission", content: <p>{mission.description}</p> },
    { title: vision.title, image: visionImage, imageAlt: "Therapist and child looking toward a bright future", icon: <VisionIcon />, tone: "vision", content: <p>{vision.description}</p> },
    { title: values.title, image: valuesImage, imageAlt: "Therapist and child completing a heart puzzle together", icon: <ValuesIcon />, tone: "values", content: <ul>{values.items.map((value) => <li key={value}>{value}</li>)}</ul> },
  ];

  return (
    <section className="purpose-section" aria-label="Sankalp mission, vision and values">
      {cards.map((card, index) => {
        const isActive = activeCard === index;
        return (
          <article
            className={`purpose-card${isActive ? " is-flipped" : ""}`}
            onMouseEnter={() => setActiveCard(index)}
            onMouseLeave={() => setActiveCard(null)}
            key={card.title}
          >
            <button className="purpose-card__button" type="button" aria-label={`${isActive ? "Hide" : "Show"} ${card.title} details`} aria-pressed={isActive} onFocus={() => setActiveCard(index)} onBlur={() => setActiveCard(null)}>
              <span className="purpose-card__inner">
                <span className="purpose-card__face purpose-card__front">
                  <img src={card.image} alt={card.imageAlt} />
                  <span className="purpose-card__front-title">{card.title}</span>
                  <span className="purpose-card__hint">Hover to learn more</span>
                </span>
                <span className="purpose-card__face purpose-card__back">
                  <span className={`purpose-section__icon ${card.tone}`}>{card.icon}</span>
                  <span className="purpose-card__back-title">{card.title}</span>
                  {card.content}
                  <span className="purpose-card__hint">Move cursor away to return</span>
                </span>
              </span>
            </button>
          </article>
        );
      })}
    </section>
  );
};

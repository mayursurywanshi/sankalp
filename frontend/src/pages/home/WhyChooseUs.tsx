import { ReactNode } from "react";
import "./WhyChooseUs.css";

interface Feature { title: string; description: string; color: string; icon: ReactNode; }

const features: Feature[] = [
  { title: "Expert Care", description: "Experienced specialists dedicated to your child's well-being.", color: "purple",
    icon: <><circle cx="24" cy="18" r="7" /><path d="M10 41c1-9 7-14 14-14s13 5 14 14" /></> },
  { title: "Personalized Therapy", description: "Individualized treatment plans for better outcomes.", color: "teal",
    icon: <><path d="M24 41S8 32 8 19c0-8 10-11 16-3 6-8 16-5 16 3 0 13-16 22-16 22Z" /><path d="m17 25 5 5 10-11" /></> },
  { title: "Child-Centered", description: "Holistic care with compassion and patience.", color: "violet",
    icon: <><circle cx="17" cy="18" r="6" /><circle cx="31" cy="18" r="6" /><path d="M12 39c1-8 5-12 12-12s11 4 12 12M24 27v13" /></> },
  { title: "Proven Results", description: "Helping children achieve their milestones with confidence.", color: "coral",
    icon: <><path d="M24 42S8 33 8 19c0-8 10-11 16-3 6-8 16-5 16 3 0 14-16 23-16 23Z" /><path d="m17 25 5 5 10-11" /></> },
];

export const WhyChooseUs = () => (
  <section className="why-us" id="services" aria-labelledby="why-us-title">
    <h2 id="why-us-title">Why Choose Sankalp?</h2>
    <div className="feature-grid">
      {features.map((feature) => (
        <article className="feature-card" key={feature.title}>
          <div className={`feature-icon ${feature.color}`}>
            <svg viewBox="0 0 48 48" aria-hidden="true">{feature.icon}</svg>
          </div>
          <h3>{feature.title}</h3><p>{feature.description}</p>
        </article>
      ))}
    </div>
  </section>
);

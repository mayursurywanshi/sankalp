import { AboutTextSection } from "./about.types";
import "./PurposeSection.css";

interface PurposeSectionProps {
  mission: AboutTextSection;
  vision: AboutTextSection;
  values: { title: string; items: string[] };
}

const MissionIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="9" /><circle cx="24" cy="24" r="2" /><path d="m26 21 10-10M31 11h5v5" /></svg>
);
const VisionIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24s8-13 20-13 20 13 20 13-8 13-20 13S4 24 4 24Z" /><circle cx="24" cy="24" r="7" /></svg>
);
const ValuesIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m7 16 8-8h18l8 8-17 25L7 16Z" /><path d="m15 8 9 33M33 8l-9 33M7 16h34M15 8l9 8 9-8" /></svg>
);

export const PurposeSection = ({ mission, vision, values }: PurposeSectionProps) => (
  <section className="purpose-section" aria-label="Sankalp mission, vision and values">
    <article>
      <div className="purpose-section__icon mission"><MissionIcon /></div>
      <h2>{mission.title}</h2><p>{mission.description}</p>
    </article>
    <article>
      <div className="purpose-section__icon vision"><VisionIcon /></div>
      <h2>{vision.title}</h2><p>{vision.description}</p>
    </article>
    <article>
      <div className="purpose-section__icon values"><ValuesIcon /></div>
      <h2>{values.title}</h2>
      <ul>{values.items.map((value) => <li key={value}>{value}</li>)}</ul>
    </article>
  </section>
);

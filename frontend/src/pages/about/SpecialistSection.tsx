import specialistImage from "../../assets/about/specialist.png";
import "./SpecialistSection.css";

interface SpecialistSectionProps {
  content: {
    sectionTitle: string;
    name: string;
    designation: string;
    qualifications: string[];
  };
}

export const SpecialistSection = ({ content }: SpecialistSectionProps) => (
  <section className="specialist-section">
    <div className="specialist-section__image">
      <img src={specialistImage} alt={`${content.name}, ${content.designation}`} />
    </div>
    <div className="specialist-section__copy">
      <h2>{content.sectionTitle}</h2>
      <span className="specialist-section__accent" />
      <h3>{content.name}</h3>
      <p className="specialist-section__designation">{content.designation}</p>
      <ul>{content.qualifications.map((qualification) => <li key={qualification}>{qualification}</li>)}</ul>
    </div>
  </section>
);

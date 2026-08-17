import facilityImage from "../../assets/about/facility.png";
import "./AboutHero.css";

interface AboutHeroProps {
  content: { title: string; tagline: string; description: string[] };
}

export const AboutHero = ({ content }: AboutHeroProps) => (
  <section className="about-hero">
    <div className="about-hero__content">
      <h1>{content.title}</h1>
      <h2>{content.tagline}</h2>
      <div className="about-hero__accent" />
      {content.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <div className="about-hero__image">
      <img src={facilityImage} alt="Sankalp child development therapy center" />
    </div>
  </section>
);

import heroImage from "../../assets/home-hero.png";
import { ButtonLink } from "../../components/button/ButtonLink";
import "./HeroSection.css";

interface HeroSectionProps { description: string; isLoading: boolean; }

export const HeroSection = ({ description, isLoading }: HeroSectionProps) => (
  <main className="hero" id="home">
    <div className="hero-copy">
      <p className="eyebrow">Helping Every Child</p>
      <h1>Reach Their<span>Full Potential</span></h1>
      <h2>Pediatric Physiotherapy &amp; Child Development Center</h2>
      <p className={isLoading ? "hero-description is-loading" : "hero-description"}>{description}</p>
      <div className="hero-actions">
        <ButtonLink href="#appointment">Book Appointment</ButtonLink>
        <ButtonLink href="#services" variant="outline">Explore Services</ButtonLink>
      </div>
    </div>
    <div className="hero-visual">
      <div className="shape shape-one" /><div className="shape shape-two" />
      <span className="spark spark-one">✦</span><span className="spark spark-two">◇</span>
      <span className="spark spark-three">✦</span>
      <img src={heroImage} alt="Therapist helping a child play with developmental toys" />
    </div>
  </main>
);

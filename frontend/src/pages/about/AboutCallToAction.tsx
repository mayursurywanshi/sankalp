import appointmentImage from "../../assets/about/appointment-illustration.png";
import { ButtonLink } from "../../components/button/ButtonLink";
import "./AboutCallToAction.css";

interface AboutCallToActionProps {
  content: { title: string; description: string; buttonLabel: string };
}

export const AboutCallToAction = ({ content }: AboutCallToActionProps) => (
  <section className="about-cta">
    <img src={appointmentImage} alt="" aria-hidden="true" />
    <div><h2>{content.title}</h2><p>{content.description}</p></div>
    <ButtonLink href="/appointment">{content.buttonLabel}</ButtonLink>
  </section>
);

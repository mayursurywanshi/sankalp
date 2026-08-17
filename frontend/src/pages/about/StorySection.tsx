import therapyImage from "../../assets/about/therapy-story.png";
import "./StorySection.css";

interface StorySectionProps {
  content: { title: string; description: string[] };
}

export const StorySection = ({ content }: StorySectionProps) => (
  <section className="story-section">
    <img src={therapyImage} alt="Therapist supporting a baby during physical therapy" />
    <div className="story-section__copy">
      <h2>{content.title}</h2>
      <span className="story-section__accent" />
      {content.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  </section>
);

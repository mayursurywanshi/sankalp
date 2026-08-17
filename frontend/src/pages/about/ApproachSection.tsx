import "./ApproachSection.css";

interface ApproachSectionProps {
  content: {
    title: string;
    steps: { title: string; description: string }[];
    summary: string;
  };
}

const icons = [
  <><rect x="12" y="9" width="24" height="31" rx="2" /><path d="M19 9V6h10v3M18 18h12M18 24h12M18 30h8" /></>,
  <><circle cx="18" cy="14" r="5" /><path d="M10 36c1-9 4-14 8-14 3 0 5 2 6 5M28 13c5-5 12 2 6 7M34 20l-8 8M28 34h10M33 29v10" /></>,
  <><circle cx="24" cy="10" r="5" /><circle cx="13" cy="31" r="5" /><circle cx="35" cy="31" r="5" /><path d="M24 15v9M18 28l6-4 6 4M18 37h12" /></>,
  <><path d="M9 38V26h7v12M20 38V18h7v20M31 38V9h7v29M6 38h36" /></>,
];

export const ApproachSection = ({ content }: ApproachSectionProps) => (
  <section className="approach-section">
    <h2>{content.title}</h2><span className="approach-section__accent" />
    <div className="approach-section__steps">
      {content.steps.map((step, index) => (
        <article key={step.title}>
          <div className={`approach-section__icon step-${index + 1}`}>
            <svg viewBox="0 0 48 48" aria-hidden="true">{icons[index]}</svg>
          </div>
          <h3>{step.title}</h3><p>{step.description}</p>
          {index < content.steps.length - 1 && <span className="approach-section__arrow">→</span>}
        </article>
      ))}
    </div>
    <p className="approach-section__summary">{content.summary}</p>
  </section>
);

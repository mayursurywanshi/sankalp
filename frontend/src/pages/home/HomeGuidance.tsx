import { useState } from "react";
import friendlyConversationImage from "../../assets/home/first-visit/friendly-conversation.png";
import childObservationImage from "../../assets/home/first-visit/child-observation.png";
import simpleActivitiesImage from "../../assets/home/first-visit/simple-activities.png";
import clearGuidanceImage from "../../assets/home/first-visit/clear-guidance.png";
import "./HomeGuidance.css";

const challenges = [
  { symbol: "◒", text: "Difficulty sitting, standing or walking independently" },
  { symbol: "⌁", text: "Frequent falls or difficulty with balance" },
  { symbol: "↗", text: "Difficulty running, jumping or climbing stairs" },
  { symbol: "◫", text: "Muscle weakness, stiffness or unusual movement patterns" },
  { symbol: "✋", text: "Difficulty using hands for play and everyday activities" },
  { symbol: "◉", text: "Sensitivity to sound, touch, movement or textures" },
  { symbol: "△", text: "Difficulty participating in school or playground activities" },
  { symbol: "♡", text: "Needing extra help with everyday routines" },
];

const guidanceSigns = [
  "Your child is not reaching expected movement milestones.",
  "Your child avoids physical activities or gets tired quickly.",
  "Teachers notice difficulty with sitting, writing or playground activities.",
  "Your child experiences pain while moving.",
  "Your child loses a skill they could previously perform.",
  "A doctor recommends developmental or physiotherapy support.",
];

const firstVisitSteps = [
  { title: "Friendly Conversation", description: "We begin by listening to your concerns and understanding your child’s history.", image: friendlyConversationImage, imageAlt: "Parent sharing concerns with a pediatric therapist while the child plays nearby" },
  { title: "Child-Friendly Observation", description: "The specialist observes movement, balance, posture, coordination and everyday abilities.", image: childObservationImage, imageAlt: "Pediatric therapist observing a child walking along a colorful movement path" },
  { title: "Simple Activities", description: "Your child participates in comfortable, age-appropriate activities through movement and play.", image: simpleActivitiesImage, imageAlt: "Pediatric therapist guiding a child through a playful stacking activity" },
  { title: "Clear Guidance", description: "We explain our observations and recommend appropriate next steps for your family.", image: clearGuidanceImage, imageAlt: "Pediatric therapist explaining recommendations to a child’s parents" },
];

export const HomeGuidance = () => {
  const [activeFirstVisitStep, setActiveFirstVisitStep] = useState<number | null>(null);

  return <div className="home-guidance">
    <section className="home-challenges" aria-labelledby="home-challenges-title">
      <header className="home-guidance__heading">
        <span>Recognising early signs</span>
        <h2 id="home-challenges-title">Is your child facing these challenges?</h2>
        <p>Every child develops at their own pace. Certain challenges may benefit from professional assessment and early guidance.</p>
      </header>
      <div className="home-challenges__grid">
        {challenges.map((challenge) => <article key={challenge.text}><span aria-hidden="true">{challenge.symbol}</span><p>{challenge.text}</p></article>)}
      </div>
      <div className="home-guidance__ticker" aria-label="Important guidance">
        <p>Noticing one of these signs does not always mean something is wrong. A professional assessment can help you better understand your child’s needs.</p>
      </div>
    </section>

    <section className="home-when-guidance" aria-labelledby="home-when-guidance-title">
      <div className="home-when-guidance__visual" aria-hidden="true"><span>♡</span><strong>Parents know their child best</strong><p>Asking for guidance is a positive first step.</p></div>
      <div className="home-when-guidance__content">
        <span>Knowing when to act</span>
        <h2 id="home-when-guidance-title">When should parents seek guidance?</h2>
        <p>You may consider speaking with a specialist when:</p>
        <ul>{guidanceSigns.map((sign) => <li key={sign}>{sign}</li>)}</ul>
      </div>
    </section>

    <section className="home-first-visit" aria-labelledby="home-first-visit-title">
      <header className="home-guidance__heading">
        <span>A calm and supportive beginning</span>
        <h2 id="home-first-visit-title">What happens during the first visit?</h2>
        <p>The first appointment helps us understand your concerns and your child’s individual needs.</p>
      </header>
      <div className="home-first-visit__steps">
        {firstVisitSteps.map((step, index) => {
          const isActive = activeFirstVisitStep === index;
          return <article className={`first-visit-card${isActive ? " is-flipped" : ""}`} onMouseEnter={() => setActiveFirstVisitStep(index)} onMouseLeave={() => setActiveFirstVisitStep(null)} key={step.title}>
            <button type="button" aria-label={`${step.title}. ${isActive ? "Showing details" : "Show details"}`} aria-pressed={isActive} onFocus={() => setActiveFirstVisitStep(index)} onBlur={() => setActiveFirstVisitStep(null)}>
              <span className="first-visit-card__inner">
                <span className="first-visit-card__face first-visit-card__front">
                  <img src={step.image} alt={step.imageAlt} />
                </span>
                <span className="first-visit-card__face first-visit-card__back">
                  <span className="first-visit-card__number">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </span>
              </span>
            </button>
          </article>;
        })}
      </div>
    </section>
  </div>;
};

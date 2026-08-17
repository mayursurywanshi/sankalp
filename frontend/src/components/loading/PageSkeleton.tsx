import "./PageSkeleton.css";

interface PageSkeletonProps { cards?: number; }

export const PageSkeleton = ({ cards = 6 }: PageSkeletonProps) => (
  <main className="page-skeleton" aria-live="polite" aria-busy="true">
    <span className="visually-hidden">Loading page content...</span>
    <section className="page-skeleton__hero" aria-hidden="true">
      <div className="page-skeleton__copy">
        <span className="skeleton-line skeleton-line--short" />
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--medium" />
      </div>
      <span className="skeleton-block page-skeleton__image" />
    </section>
    <section className="page-skeleton__content" aria-hidden="true">
      <span className="skeleton-line skeleton-line--section-title" />
      <div className="page-skeleton__grid">
        {Array.from({ length: cards }, (_, index) => <span className="skeleton-block page-skeleton__card" key={index} />)}
      </div>
    </section>
  </main>
);

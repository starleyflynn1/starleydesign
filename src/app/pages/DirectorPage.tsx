import React from 'react';

export function DirectorPage() {
  return (
    <main className="app-main">
      <section className="component-panel section-stack">
        <h2 className="section-title">Engineering Experiences, Directing Outcomes</h2>
        <div className="feature-grid director-feature-grid">
          <article className="feature-item">
            <h3 className="spotlight-text">The Vision</h3>
            <p className="feature-copy">
              For over a decade, I&apos;ve operated at the intersection of robust logic and
              human-centric design. My approach to technology is much like a director&apos;s
              approach to a production: every component must have a purpose, every interaction must
              tell a story, and the final experience must be seamless for the audience.
            </p>
            <p className="feature-copy">
              I specialize in building scalable design systems that don&apos;t just look good but
              function with technical integrity. Whether it&apos;s building complex
              applications or refining digital accessibility, my goal is to focus on architecting
              the digital stage to eliminate friction and empower the individual.
            </p>
          </article>
          <article className="feature-item">
            <h3 className="spotlight-text">The Craft</h3>
            <p className="feature-copy">
              My toolkit is a blend of high-level technical engineering and creative
              experimentation.
            </p>
            <p className="feature-copy">
              <strong>Technical Architecture:</strong> Building enterprise-grade systems with a
              focus on high-performance logic and scalable state management.
            </p>
            <p className="feature-copy">
              <strong>UX Engineering:</strong> Translating Figma visions into production-ready
              code, ensuring pixel-perfect fidelity across the browser.
            </p>
            <p className="feature-copy">
              <strong>Human-Centric Design:</strong> A relentless commitment to a11y, ensuring
              every performance is inclusive and intuitive for all.
            </p>
          </article>
          <article className="feature-item">
            <h3 className="spotlight-text">The Performance</h3>
            <p className="feature-copy">
              I am currently seeking to lead the development of next-generation interfaces as a
              Creative Technologist or UX Engineer. I&apos;m ready to bring complex design visions
              to life through a balance of technical structure and creative soul.
            </p>
          </article>
          <article className="feature-item">
            <h3 className="spotlight-text">Closing Note</h3>
            <p className="feature-copy">
              When I&apos;m not behind a screen, you can usually find me on stage. My recent
              performance in{' '}
              <a
                href="https://www.thesoundonstage.org/stage-reviews/stage-review-pets-and-their-humans-ludlow-village-players"
                className="link-button"
                target="_blank"
                rel="noreferrer"
              >
                Pets and Their Humans
              </a>
              {' '}informs my deep commitment to storytelling and empathy in UX Engineering.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

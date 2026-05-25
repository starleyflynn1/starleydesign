import React from 'react';

export function DirectorPage() {
  return (
    <main className="app-main director-page">
      <section className="component-panel section-stack portfolio-section">
        <h2 className="section-title">Engineering Experiences, Directing Outcomes</h2>
        <br />
        <article className="feature-item portfolio-card director-intro">
          <h3 className="section-header section-header-first">The Vision</h3>
          <div className="intro-grid">
            <figure className="profile-photo">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/images/director-starley-220.webp 220w, /images/director-starley-440.webp 440w"
                  sizes="(max-width: 767px) 72vw, 200px"
                />
                <img
                  src="/images/director-starley.png"
                  alt="Starley Flynn smiling in a theater auditorium"
                  width={220}
                  height={220}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </picture>
            </figure>

            <div className="director-intro-body">
              <p className="feature-copy">
                As a Senior Engineer and Creative Technologist, I focus on building systems that feel almost
                magical to the user: fast, accessible, scalable, and emotionally intuitive. I specialize in transforming
                complex technical constraints into seamless user experiences. <br/> <br/>  My approach to technology mirrors a director&apos;s
                approach to production: every component serves a purpose, every interaction supports the narrative, and the
                final experience feels intentional. <br/> <br/> I build scalable design systems that not only look exceptional, but also
                function with technical integrity. Whether developing enterprise applications or advancing digital accessibility,
                I create experiences that reduce friction and empower people.
              </p>
            </div>
          </div>
        </article>

        <div className="remaining-content">
          <article className="feature-item portfolio-card">
            <h3 className="section-header">The Craft</h3>
            <p className="feature-copy craft-intro">
              My toolkit is a blend of high-level technical engineering and creative experimentation.
            </p>
            <br />

            <div className="director-pillars">
              <div className="pillar-card">
                <strong>Technical Architecture</strong>
                <p className="feature-copy">
                  Engineering for scalability. Building enterprise systems that remain reliable, performant, and maintainable under real-world scale and complexity.
                </p>
              </div>

              <div className="pillar-card">
                <strong>UX Engineering</strong>
                <p className="feature-copy">
                  Performance as an aesthetic. Crafting high-fidelity user interfaces where visual precision, accessibility, and responsiveness work in harmony.
                </p>
              </div>

              <div className="pillar-card">
                <strong>Responsible AI Tooling</strong>
                <p className="feature-copy">
                  Integrating AI-assisted workflows that improve development velocity while maintaining code quality, accessibility, and architectural integrity.
                </p>
              </div>
            </div>
          </article>

          <article className="feature-item portfolio-card">
            <h3 className="section-header">The Performance</h3>
            <p className="feature-copy">
              I am currently seeking to lead the development of next-generation interfaces as a
              Creative Technologist or UX Engineer. I&apos;m ready to bring complex design visions
              to life through a balance of technical structure and creative soul.
            </p>
          </article>

          <article className="feature-item portfolio-card">
            <h3 className="section-header">Closing Note</h3>
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

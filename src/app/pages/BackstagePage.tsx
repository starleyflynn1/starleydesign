import React from 'react';

export function BackstagePage() {
  return (
    <main className="app-main backstage-page">
      <section id="transactional-ux-data-schemas" className="component-panel section-stack portfolio-section portfolio-deep-dive">
        <div className="portfolio-section-header">
          <h3 className="section-title">Transactional UX &amp; Data Schemas</h3>
          <p className="hero-description">
            An exploration of the Design System Architecture and the logic required to move a user from &quot;Discovery&quot; to
            &quot;Confirmation&quot; without losing the narrative thread of the experience.
          </p>
        </div>
        <div className="portfolio-grid portfolio-grid-split">
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Theatrical State Management</h4>
            <p className="feature-copy">
              Global themes are orchestrated via a centralized store, while localized interactions —
              such as seat hovers or selection states — utilize custom synchronization hooks. This
              dual-layered architecture is designed to keep transient state harmonized across the
              entire site without sacrificing performance.
            </p>
          </article>
          <article id="recursive-component-logic" className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Scalable Venue Logic</h4>
            <p className="feature-copy">
              By decoupling rendering primitives from venue geometry, the system is designed to
              support recursive-style mapping patterns that scale dynamically. The same
              architectural logic handles everything from 7-column calendars to complex, high-density theater grids.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Modular Data &amp; Introspection</h4>
            <p className="feature-copy">
              UI nodes and seating inventory are treated as modular objects rich with metadata for
              positioning, pricing, and accessibility. This schema is supported by an integrated
              developer console designed to enable real-time JSON state introspection and live
              debugging.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Optimistic UI &amp; Resilience</h4>
            <p className="feature-copy">
              Engineered for zero-latency, the interface reflects audience actions
              instantaneously. The implementation supports robust rollback semantics and optimistic hold/release logic for
              asynchronous API conflicts.
            </p>
          </article>
        </div>
      </section>

      <section id="global-theming-persistence" className="component-panel section-stack portfolio-section portfolio-deep-dive">
        <div className="portfolio-section-header">
          <h3 className="section-title">Global Theming &amp; Persistence</h3>
          <p className="hero-description">
            Architecture focused on environmental consistency and the technical magic
            behind the scenes.
          </p>
        </div>
        <div className="portfolio-grid portfolio-grid-split">
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">CSS Variable Architecture</h4>
            <p className="feature-copy">
              The system leverages a token-based approach where atmospheric modes are defined by semantic tokens{' '}
              rather than static hex codes. This strategy eliminates CSS bloat and reduces technical debt
              through a modular framework designed for system-wide re-skinning.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Persistence &amp; Middleware</h4>
            <p className="feature-copy">
              Designed to support persistence middleware layers, the current implementation uses{' '}
              localStorage and custom state synchronization hooks to ensure the user&apos;s
              preferred lighting and motion preference persist.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Theme Harmonization</h4>
            <p className="feature-copy">
              A technical deep-dive into luminosity capping. By normalizing brightness levels
              across different themes, the system ensures that switching environments never results
              in a flashbang effect.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Semantic Contrast Guardrails</h4>
            <p className="feature-copy">
              The system calculates contrast ratios on-the-fly to ensure semantic
              tokens maintain WCAG-compliant legibility regardless of the active atmospheric backdrop.
            </p>
          </article>
        </div>
      </section>

      <section id="accessibility-motion-control" className="component-panel section-stack portfolio-section portfolio-deep-dive">
        <div className="portfolio-section-header">
          <h3 className="section-title">Accessibility &amp; Motion Control</h3>
          <p className="hero-description">
            Ensuring the performance is accessible to every audience member, from the front row to
            the back of the balcony. Lighthouse accessibility score: 100/100
          </p>
        </div>
        <div className="portfolio-grid portfolio-grid-split">
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Motion Pause (WCAG 2.2)</h4>
            <p className="feature-copy">
              A global override that respects the prefers-reduced-motion query while
              providing a manual toggle. This stills the stage, stopping all ambient mist
              transitions and parallax effects.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Focus Management</h4>
            <p className="feature-copy">
              The system utilizes a strict focus-trap architecture for modals. Dynamic seat selections
              trigger aria-live announcements, providing immediate feedback for screen reader
              users on inventory changes.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Fluid Reflow</h4>
            <p className="feature-copy">
              Engineered for 400% zoom compatibility, orchestrating a layout that reflows gracefully.
              Interactive elements maintain a minimum 44px tap target for limited fine motor control.
            </p>
          </article>
          <article className="feature-item portfolio-card">
            <h4 className="spotlight-text feature-card-title">Low Glare Optiomization</h4>
            <p className="feature-copy">
              The Dark Mode implementation is calibrated for low-light environments (like a dim theater). The reduction of blue
              light emission and the high contrast ratios ensures that the UI remains legible without being disruptive to other
              members of the audience.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

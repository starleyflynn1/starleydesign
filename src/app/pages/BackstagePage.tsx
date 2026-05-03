import React from 'react';

export function BackstagePage() {
  return (
    <main className="app-main backstage-page">
      <section className="component-panel section-stack">
        <h2 className="section-title">Backstage</h2>
        <p className="hero-description">
          Technical Specifications &amp; Design System Architecture
        </p>
      </section>

      {/* Section 1: Transactional UX */}
      <section id="transactional-ux-data-schemas" className="component-panel section-stack">
        <h3 className="section-title">Transactional UX &amp; Data Schemas</h3>
        <p className="hero-description">
          This section explores the logic required to move a user from &quot;Discovery&quot; to
          &quot;Confirmation&quot; without losing the narrative thread of the experience.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Theatrical State Management</h4>
            <p className="feature-copy">
              Global themes are orchestrated via a **centralized store**, while localized interactions —
              such as **seat hovers** or **selection states** — utilize custom **synchronization hooks**. This
              dual-layered architecture is designed to keep **transient state** harmonized across the
              entire site without sacrificing **performance**.
            </p>
          </article>
          <article id="recursive-component-logic" className="feature-item">
            <h4 className="spotlight-text feature-card-title">Recursive &amp; Scalable Venue Logic</h4>
            <p className="feature-copy">
              By decoupling **rendering primitives** from **venue geometry**, the system is designed to
              support recursive-style **mapping patterns** that scale dynamically. The same
              architectural logic handles everything from 7-column calendars to complex, high-density theater grids.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Modular Data &amp; Introspection</h4>
            <p className="feature-copy">
              **UI nodes** and **seating inventory** are treated as modular objects rich with **metadata** for
              positioning, pricing, and accessibility. This **schema** is supported by an integrated
              developer console designed to enable real-time <code>JSON</code> state introspection and live
              debugging.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Optimistic UI &amp; Resilience</h4>
            <p className="feature-copy">
              Engineered for zero-latency, the interface reflects audience actions
              instantaneously. The implementation supports robust **rollback semantics**
              and **optimistic hold/release logic** for asynchronous <code>API</code> conflicts.
            </p>
          </article>
        </div>
      </section>

      {/* Section 2: Global Theming */}
      <section id="global-theming-persistence" className="component-panel section-stack">
        <h3 className="section-title">Global Theming &amp; Persistence</h3>
        <p className="hero-description">
          Architecture focused on environmental consistency and the technical &quot;magic&quot;
          behind the scenes.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">CSS Variable Architecture</h4>
            <p className="feature-copy">
            The system leverages a **token-based** approach where atmospheric modes are defined by **semantic tokens** 
            rather than static hex codes. This strategy eliminates **CSS bloat** and reduces **technical debt** 
            through a modular framework designed for system-wide **re-skinning**.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Persistence &amp; Middleware</h4>
            <p className="feature-copy">
              Designed to support **persistence middleware** layers, the current implementation uses
              <code>localStorage</code> and custom **state synchronization hooks** to ensure the user&apos;s
              preferred lighting and motion preference persist.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Theme Harmonization</h4>
            <p className="feature-copy">
              A technical deep-dive into **luminosity capping**. By normalizing **brightness** levels
              across different themes, the system ensures that switching environments never results 
              in a &quot;flashbang&quot; effect.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Semantic Contrast Guardrails</h4>
            <p className="feature-copy">
              The system calculates **contrast ratios** on-the-fly to ensure semantic
              tokens maintain <code>WCAG-compliant</code> legibility regardless of the active atmospheric backdrop.
            </p>
          </article>
        </div>
      </section>

      {/* Section 3: Accessibility */}
      <section id="accessibility-motion-control" className="component-panel section-stack">
        <h3 className="section-title">Accessibility &amp; Motion Control</h3>
        <p className="hero-description">
          Ensuring the performance is accessible to every audience member, from the front row to
          the back of the balcony. Lighthouse accessibility score: 100/100
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Motion Pause (WCAG 2.2)</h4>
            <p className="feature-copy">
              A global override that respects the <code>prefers-reduced-motion</code> query while
              providing a manual toggle. This stills the stage, stopping all ambient mist
              transitions and **parallax** effects.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Focus Management</h4>
            <p className="feature-copy">
            The system utilizes a strict **focus-trap** architecture for modals. Dynamic seat selections 
            trigger <code>aria-live</code> announcements, providing immediate feedback for screen reader 
            users on inventory changes.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Fluid Reflow</h4>
            <p className="feature-copy">
            Engineered for **400% zoom** compatibility, orchestrating a layout that reflows gracefully. 
            Interactive elements maintain a minimum **44px** tap target for limited fine motor control.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
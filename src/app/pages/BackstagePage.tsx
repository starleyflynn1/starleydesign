import React from 'react';

export function BackstagePage() {
  return (
    <main className="app-main backstage-page">
      {/* Section 1: Transactional UX */}
      <section id="transactional-ux-data-schemas" className="component-panel section-stack">
        <h3 className="section-title">Transactional UX &amp; Data Schemas</h3>
        <p className="hero-description">
          An exploration of the <strong>Design System Architecture</strong> and the logic required to move a user from &quot;Discovery&quot; to
          &quot;Confirmation&quot; without losing the narrative thread of the experience.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Theatrical State Management</h4>
            <p className="feature-copy">
              Global themes are orchestrated via a <strong>centralized store</strong>, while localized interactions —
              such as <strong>seat hovers</strong> or <strong>selection states</strong> — utilize custom <strong>synchronization hooks</strong>. This
              dual-layered architecture is designed to keep <strong>transient state</strong> harmonized across the
              entire site without sacrificing <strong>performance</strong>.
            </p>
          </article>
          <article id="recursive-component-logic" className="feature-item">
            <h4 className="spotlight-text feature-card-title">Recursive &amp; Scalable Venue Logic</h4>
            <p className="feature-copy">
              By decoupling <strong>rendering primitives</strong> from <strong>venue geometry</strong>, the system is designed to
              support recursive-style <strong>mapping patterns</strong> that scale dynamically. The same
              architectural logic handles everything from 7-column calendars to complex, high-density theater grids.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Modular Data &amp; Introspection</h4>
            <p className="feature-copy">
              <strong>UI nodes</strong> and <strong>seating inventory</strong> are treated as modular objects rich with <strong>metadata</strong> for
              positioning, pricing, and accessibility. This <strong>schema</strong> is supported by an integrated
              developer console designed to enable real-time <strong>JSON</strong> state introspection and live
              debugging.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Optimistic UI &amp; Resilience</h4>
            <p className="feature-copy">
              Engineered for zero-latency, the interface reflects audience actions
              instantaneously. The implementation supports robust <strong>rollback semantics</strong> 
              and <strong>optimistic hold/release logic</strong> for asynchronous <strong>API</strong> conflicts.
            </p>
          </article>
        </div>
      </section>

      {/* Section 2: Global Theming */}
      <section id="global-theming-persistence" className="component-panel section-stack">
        <h3 className="section-title">Global Theming &amp; Persistence</h3>
        <p className="hero-description">
          Architecture focused on environmental consistency and the technical magic
          behind the scenes.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">CSS Variable Architecture</h4>
            <p className="feature-copy">
            The system leverages a <strong>token-based</strong> approach where atmospheric modes are defined by <strong>semantic tokens</strong> 
             rather than static hex codes. This strategy eliminates CSS bloat and reduces technical debt
            through a modular framework designed for system-wide <strong>re-skinning</strong>.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Persistence &amp; Middleware</h4>
            <p className="feature-copy">
              Designed to support <strong>persistence middleware</strong> layers, the current implementation uses 
              <strong>localStorage</strong> and custom <strong>state synchronization hooks</strong> to ensure the user&apos;s
              preferred lighting and motion preference persist.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Theme Harmonization</h4>
            <p className="feature-copy">
              A technical deep-dive into <strong>luminosity capping</strong>. By normalizing <strong>brightness</strong> levels
              across different themes, the system ensures that switching environments never results 
              in a flashbang effect.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Semantic Contrast Guardrails</h4>
            <p className="feature-copy">
              The system calculates <strong>contrast ratios</strong> on-the-fly to ensure semantic
              tokens maintain <strong>WCAG-compliant</strong> legibility regardless of the active atmospheric backdrop.
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
              A global override that respects the <strong>prefers-reduced-motion</strong> query while
              providing a manual toggle. This stills the stage, stopping all ambient mist
              transitions and <strong>parallax</strong> effects.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Focus Management</h4>
            <p className="feature-copy">
            The system utilizes a strict <strong>focus-trap</strong> architecture for modals. Dynamic seat selections 
            trigger <strong>aria-live</strong> announcements, providing immediate feedback for screen reader 
            users on inventory changes.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text feature-card-title">Fluid Reflow</h4>
            <p className="feature-copy">
            Engineered for <strong>400% zoom</strong> compatibility, orchestrating a layout that reflows gracefully. 
            Interactive elements maintain a minimum <strong>44px</strong> tap target for limited fine motor control.
            </p>
          </article>
          <article className="feature-item">
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
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

      <section id="transactional-ux-data-schemas" className="component-panel section-stack">
        <h3 className="section-title">Transactional UX &amp; Data Schemas</h3>
        <p className="hero-description">
          This section explores the logic required to move a user from &quot;Discovery&quot; to
          &quot;Confirmation&quot; without losing the narrative thread of the experience.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text">State Management</h4>
            <p className="feature-copy">
              Global themes are managed via a centralized store, while localized interactions
              (like hovers or selections) use custom synchronization hooks to ensure transient
              states remain harmonized across the system.
            </p>
          </article>
          <article id="recursive-component-logic" className="feature-item">
            <h4 className="spotlight-text">Recursive &amp; Scalable Rendering</h4>
            <p className="feature-copy">
              The system employs recursive mapping and decoupled primitives to scale layouts
              dynamically, allowing the same logic to handle everything from 7-column calendars to
              complex, high-density seating grids.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Modular Data Schema</h4>
            <p className="feature-copy">
              Seats and UI nodes are treated as modular objects containing metadata for
              positioning, pricing, and accessibility, supported by an integrated debugger for
              real-time JSON state introspection.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Optimistic UI &amp; Resilience</h4>
            <p className="feature-copy">
              Designed for zero-latency, the interface reflects user actions instantaneously while
              utilizing robust rollback semantics to handle potential asynchronous API conflicts or
              reservation errors.
            </p>
          </article>
          <article id="scalable-venue-logic" className="feature-item">
            <h4 className="spotlight-text">Scalable Venue Logic</h4>
            <p className="feature-copy">
              Venue modeling is structured to scale with configurable rows, seats-per-row, aisle
              boundaries, and section types. This lets the same rendering primitives support
              different venue footprints while preserving consistent interaction rules and
              accessibility behavior.
            </p>
          </article>
        </div>
      </section>

      <section id="global-theming-persistence" className="component-panel section-stack">
        <h3 className="section-title">Global Theming &amp; Persistence</h3>
        <p className="hero-description">
          Architecture focused on environmental consistency and the technical &quot;magic&quot;
          behind the scenes that keeps the atmosphere intact across sessions.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text">CSS Variable Architecture</h4>
            <p className="feature-copy">
              The system uses a robust token-based approach. Atmospheric modes like Coastal Misty
              are not just hex codes; they are sets of semantic tokens (for example, --background,
              --foreground, --card, --muted, --border, --spotlight, and --velvet) that allow for
              instant, system-wide re-skinning without CSS bloat.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Persistence &amp; Middleware</h4>
            <p className="feature-copy">
              Designed to support persistence middleware layers, the current implementation uses
              localStorage and custom state synchronization hooks to ensure the user&apos;s
              preferred lighting (Theme), house settings (Dark Mode), and motion preference persist
              across page reloads.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Theme Harmonization</h4>
            <p className="feature-copy">
              A technical deep-dive into luminosity capping. By normalizing the brightness levels
              across different themes, the system ensures that switching from a dark environment to
              a misty one never results in a flashbang effect for the user.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Class-Driven Theme Runtime</h4>
            <p className="feature-copy">
              Theme switching is class-driven at the document root (`theme-*` plus `dark`), with a
              single source of truth in theme configuration for default modes and transition kinds.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Transition Engine &amp; Motion Guardrails</h4>
            <p className="feature-copy">
              Theme transitions route through `spotlight`, `crt`, `atmospheric`, and default
              animation profiles. Motion can be paused through controls aligned with
              `prefers-reduced-motion`, and large luminance jumps are softened by a capping step
              during transition.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Semantic Contrast Guardrails</h4>
            <p className="feature-copy">
              Beyond color, the system calculates contrast ratios on-the-fly to ensure semantic
              tokens, like interactive teals and warning ambers, maintain WCAG-compliant legibility
              regardless of the active atmospheric backdrop or lighting preset.
            </p>
          </article>
        </div>
      </section>

      <section id="accessibility-motion-control" className="component-panel section-stack">
        <h3 className="section-title">Accessibility &amp; Motion Control</h3>
        <p className="hero-description">
          Ensuring the performance is accessible to every audience member, from the front row to
          the back of the balcony.
        </p>
        <div className="feature-grid">
          <article className="feature-item">
            <h4 className="spotlight-text">Motion Pause (WCAG 2.1)</h4>
            <p className="feature-copy">
              A global override that respects the prefers-reduced-motion media query while
              providing a manual toggle. This silences the stage, stopping all ambient mist
              transitions and parallax effects for users with vestibular sensitivities.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Low-Glare Optimization</h4>
            <p className="feature-copy">
              The Dark Mode implementation is specifically calibrated for low-light environments
              (like a dim theater). By reducing blue light emission and maintaining high-contrast
              ratios for text, the UI remains legible without being disruptive to the surrounding
              environment.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Focus Management & Aria-Live</h4>
            <p className="feature-copy">
            To ensure a non-visual narrative of the 'Stage,' the system utilizes a strict focus-trap 
            architecture for modals and palette interfaces. Dynamic seat selections trigger aria-live 
            announcements, providing immediate feedback for screen reader users on inventory changes 
            and seat status updates without requiring a manual page scan.
            </p>
          </article>
          <article className="feature-item">
            <h4 className="spotlight-text">Fluid Reflow & Touch Targets</h4>
            <p className="feature-copy">
            The system is engineered for 400% zoom compatibility, ensuring the layout 
            reflows without loss of functionality. Interactive elements like the calendar and 
            seating chart maintain a minimum 44px tap target, supporting users with limited fine 
            motor control across all device scales.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

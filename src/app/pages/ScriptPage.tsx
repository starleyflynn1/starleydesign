import React, { Suspense, lazy, useState } from 'react';
import { Check, Copy, Download, FileText } from 'lucide-react';

const ScriptResumeModal = lazy(() =>
  import('../components/ScriptResumeModal').then((module) => ({ default: module.ScriptResumeModal }))
);

interface ScriptPageProps {
  resumeUrl: string;
}

const intentBasedSeatingAlgorithmSnippet = `function findSuggestedSeatIds(count) {
  const centerSeat = (seatsPerRow + 1) / 2;
  const targetRowIndex = Math.round((rows.length - 1) * 0.35);
  let bestNonAisle = null;
  let bestAny = null;

  for (const [rowIndex, row] of rows.entries()) {
    const rowSeats = seats
      .filter((seat) => seat.row === row && seat.status !== 'unavailable')
      .sort((a, b) => a.number - b.number);

    for (let start = 0; start <= rowSeats.length - count; start++) {
      const group = rowSeats.slice(start, start + count);
      const contiguous = group.every((seat, idx) => idx === 0 || seat.number === group[idx - 1].number + 1);
      if (!contiguous) continue;

      const minSeat = group[0].number;
      const maxSeat = group[group.length - 1].number;
      const crossesAisle = aisleBreaks.some((breakSeat) => breakSeat >= minSeat && breakSeat < maxSeat);
      const groupCenterSeat = group[Math.floor(group.length / 2)].number;
      const centerDistance = Math.abs(groupCenterSeat - centerSeat);
      const rowDistance = Math.abs(rowIndex - targetRowIndex);
      const vipCount = group.filter((seat) => seat.status === 'vip').length;
      const accessibleCount = group.filter((seat) => seat.status === 'accessible').length;

      const pickedSeatIds = new Set(group.map((seat) => seat.id));
      const remainingSeatNumbers = rowSeats
        .filter((seat) => !pickedSeatIds.has(seat.id))
        .map((seat) => seat.number)
        .sort((a, b) => a - b);

      let deadSeatSingles = 0;
      for (let i = 0; i < remainingSeatNumbers.length; i++) {
        const current = remainingSeatNumbers[i];
        const previous = remainingSeatNumbers[i - 1];
        const next = remainingSeatNumbers[i + 1];
        const hasLeftNeighbor = typeof previous === 'number' && current - previous === 1;
        const hasRightNeighbor = typeof next === 'number' && next - current === 1;
        if (!hasLeftNeighbor && !hasRightNeighbor) deadSeatSingles += 1;
      }

      const score =
        100
        - centerDistance * 15
        - rowDistance * 9
        + vipCount * 12
        - accessibleCount * 3
        - (crossesAisle ? 60 : 0)
        - deadSeatSingles * 18;

      const candidate = { ids: group.map((seat) => seat.id), score };
      if (!bestAny || score > bestAny.score) bestAny = candidate;
      if (!crossesAisle && (!bestNonAisle || score > bestNonAisle.score)) bestNonAisle = candidate;
    }
  }

  return (bestNonAisle ?? bestAny)?.ids ?? [];
}`;

const highDensityStateOrchestrationSnippet = `const seats = useMemo(() => {
  return generatedSeats.map((seat) => {
    const override = seatOverrides[seat.id];
    if (!override) return seat;
    return {
      ...seat,
      status: override,
      price: override === 'vip' ? 150 : 100, // Derived logic
    };
  });
}, [generatedSeats, seatOverrides]);

// Sparse status lookup during render
const getSeatStatus = (seat) => {
  if (selectedSeats.some(s => s.id === seat.id)) return 'selected';
  return seat.status;
};`;

const interactiveDebugSnapshotSnippet = `{
  "rows": 10,
  "seatsPerRow": 12,
  "selectedSeatIds": ["C-5", "C-6"],
  "ticketCount": 2,
  "sectionTypes": { "left": "mixed", "center": "vip", "right": "mixed" },
  "lastAction": "suggest_best_seats"
}`;

export function ScriptPage({ resumeUrl }: ScriptPageProps) {
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);

  const handleCopySnippet = async (snippetId: string, snippet: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedSnippetId(snippetId);
      setCopyToastMessage('Copied');
      window.setTimeout(() => {
        setCopiedSnippetId((current) => (current === snippetId ? null : current));
      }, 1200);
      window.setTimeout(() => {
        setCopyToastMessage((current) => (current === 'Copied' ? null : current));
      }, 1200);
    } catch {
      // Ignore clipboard failures in restricted browser environments.
    }
  };

  return (
    <>
      <main className="app-main backstage-page">
        <section id="technical-documentation" className="component-panel section-stack script-tech-section portfolio-section portfolio-deep-dive">
          <div className="script-tech-header portfolio-section-header">
            <h3 className="section-title">The Designed Stage</h3>
            <p className="hero-description">
             The architectural blueprints behind of the interaction systems of The Designed Stage.
              {' '}
              <a href="/backstage" className="link-button">
               <strong>Step Backstage</strong> 
              </a>
              {' '}to explore the underlying schemas, environmental persistence, and accessibility guardrails of the
              production.
            </p>
          </div>

          <div className="portfolio-grid portfolio-grid-split">
            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Planned System Architecture</h4>
              <p className="feature-copy">
                By moving away from improvising components and toward a Stage Manager&apos;s Script, we ensure the
                entire application reads from a single source of truth. This centralized orchestration model protects
                the patron&apos;s journey through four key technical acts:
              </p>
              <p className="feature-copy">
                <strong>The Orchestration Layer</strong>
                This is the master script that handles three critical cues: <br />
                <br />
                <em>State Consistency:</em> No seat is spotlighted as selected until the backend provides the cue. <br />
                <br />
                <em>Side Effect Management:</em> Coordinating the complex backstage handshakes between hold requests and{' '}
                payment gateways. <br /> 
                <br />
                <em>Conflict Resolution:</em> Acting as the arbiter if two patrons attempt to claim the same seat simultaneously.
              </p>
              <p className="feature-copy">
                <strong>The Box Office Lease (Temporary Holds)</strong>
                <br />
                Inventory is protected by treating seat selection as a lease pattern. <br />
                <br />
                <em>Optimistic UI:</em> To keep the performance fluid, the store updates the seat to "Pending" the moment a
                patron clicks. <br />
                <br />
                <em>Countdown to Curtains:</em> The store manages a high-integrity TTL (Time-to-Live) buffer. It syncs a
                10-minute timer with the server, broadcasts a "Warning" state as the hold nears expiration, and
                gracefully releases the inventory if the patron misses their cue.
              </p>
              <p className="feature-copy">
                <strong>Ensemble Synchronization (Real-Time)</strong>
                <br />
                A live performance requires everyone to see the same house. Utilizing WebSockets or SSE, the store
                ensures inventory is a live reflection of reality. When a seat is claimed, every active session
                receives an "Inventory Update" to recalibrate. This prevents the "broken fourth wall" of a patron reaching checkout only to find their seat was taken
                minutes ago.
              </p>
              <p className="feature-copy">
                <strong>The Scripted Journey (State Machine)</strong>
                <br />
                The booking flow is a narrative in five acts. By implementing a Finite State Machine (FSM), we ensure
                the patron cannot skip their marks-preventing "illegal transitions" like moving to Payment (Act 4)
                without a validated Lease (Act 2). This rigid logic ensures every journey ends in a successful
                "Pass to the Show."
              </p>
              <div className="script-tech-diagram-wrap script-tech-diagram-wrap-full">
                <img
                  src="/architecture-diagram.svg"
                  alt="Planned architecture diagram for seat inventory, state orchestration, and route synchronization"
                  className="script-tech-diagram script-tech-diagram-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </article>

            <article className="script-tech-card portfolio-card script-tech-card-code">
              <h4 className="spotlight-text">Intent-Based Seating Algorithm</h4>
              <p className="feature-copy">
                To keep the paradox of choice at bay for an audience member, this runtime algorithm acts as the digital
                usher that guides the patron to their best possible viewing experience. The evaluation prioritizes{' '}
                contiguous seat groups row-by-row to surface a single, high-fidelity recommendation that honors the
                patron&apos;s intent.
              </p>
              <p className="feature-copy">
                <strong>Finding the Golden Sightline</strong>
                <br />
                Each candidate group is scored against the sweet spot of the house—the intersection of the horizontal
                centerline and an optimal row depth (roughly 35% from the stage). The closer the ensemble matches this
                coordinate, the higher the sightline score.
              </p>
              <p className="feature-copy">
                <strong>Ensemble Blocking &amp; Aisle Cues</strong>
                <br />
                Only fully contiguous windows are cast. Groups that cross a configured aisle break receive a heavy
                blocking penalty, as the algorithm prioritizes keeping the party together in a single, uninterrupted row.
              </p>
              <p className="feature-copy">
                <strong>Managing the House Balance</strong>
                <br />
                The algorithm applies Dead-Seat Prevention to ensure the inventory remains marketable. Any selection
                that would strand an isolated single seat—the theatrical equivalent of a missed cue—is de-prioritized to
                preserve long-term sell-through health.
              </p>
              <p className="feature-copy">
                <strong>Auto-Selection</strong>
                <br />
                The highest-scoring group is spotlighted as the primary suggestion. This ensures a fast-paced Opening Night
                experience, balancing immersive sightline quality with the logistical needs of a live house.
              </p>
              <div className="script-tech-code-row">
                <button
                  type="button"
                  className="script-tech-copy-btn"
                  onClick={() => handleCopySnippet('intent-based-seating', intentBasedSeatingAlgorithmSnippet)}
                  aria-label="Copy intent-based seating algorithm snippet"
                  title={copiedSnippetId === 'intent-based-seating' ? 'Copied' : 'Copy snippet'}
                >
                  {copiedSnippetId === 'intent-based-seating' ? <Check className="script-tech-copy-icon" /> : <Copy className="script-tech-copy-icon" />}
                </button>
              </div>
              <pre className="script-tech-code" tabIndex={0}><code>{intentBasedSeatingAlgorithmSnippet}</code></pre>
            </article>

            <article className="script-tech-card portfolio-card script-tech-card-code">
              <h4 className="spotlight-text">High-Density State Orchestration</h4>
              <p className="feature-copy">
                To manage hundreds of interactive seats without the overhead of 500+ individual state observers, the house
                is rendered as a single memoized projection.
              </p>
              <p className="feature-copy">
                By using a Sparse Override Map for status changes and a Roving Tabindex for accessibility, the
                system maintains constant-time lookup for user interactions. This &quot;Backstage&quot; logic ensures that even as the
                house grows to thousands of seats, the UI remains fluid, achieving a 95+ Lighthouse performance score{' '}
                by minimizing React re-renders and DOM thrashing.
              </p>
              <div className="script-tech-code-row">
                <button
                  type="button"
                  className="script-tech-copy-btn"
                  onClick={() => handleCopySnippet('high-density-state', highDensityStateOrchestrationSnippet)}
                  aria-label="Copy high-density state orchestration snippet"
                  title={copiedSnippetId === 'high-density-state' ? 'Copied' : 'Copy snippet'}
                >
                  {copiedSnippetId === 'high-density-state' ? <Check className="script-tech-copy-icon" /> : <Copy className="script-tech-copy-icon" />}
                </button>
              </div>
              <pre className="script-tech-code" tabIndex={0}><code>{highDensityStateOrchestrationSnippet}</code></pre>
            </article>

            <article className="script-tech-card portfolio-card script-tech-card-code">
              <h4 className="spotlight-text">Interactive Debug Snapshot</h4>
              <p className="feature-copy">
                Built-in developer diagnostics provide real-time visibility into seat logic and ticket constraints.
                This transparency bridges the gap between design and engineering, facilitating seamless quality assurance, clear demo
                narration, and deep-dive architecture walkthroughs.
              </p>
              <div className="script-tech-code-row">
                <button
                  type="button"
                  className="script-tech-copy-btn"
                  onClick={() => handleCopySnippet('debug-snapshot', interactiveDebugSnapshotSnippet)}
                  aria-label="Copy interactive debug snapshot snippet"
                  title={copiedSnippetId === 'debug-snapshot' ? 'Copied' : 'Copy snippet'}
                >
                  {copiedSnippetId === 'debug-snapshot' ? <Check className="script-tech-copy-icon" /> : <Copy className="script-tech-copy-icon" />}
                </button>
              </div>
              <pre className="script-tech-code" tabIndex={0}><code>{interactiveDebugSnapshotSnippet}</code></pre>
            </article>
          </div>
        </section>

        <section id="education-cloud-design-doc" className="component-panel section-stack script-tech-section portfolio-section portfolio-deep-dive">
          <div className="script-tech-header portfolio-section-header">
            <h3 className="section-title">Salesforce Education Cloud</h3>
            <p className="hero-description">
              Product and UX reference notes focused on course registration, degree planning, and program comparison
              patterns used in Education Cloud.
            </p>
          </div>

          <div className="portfolio-grid portfolio-grid-split">
            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Intelligent Degree Planner</h4>
              <p className="feature-copy">
                The drag-and-drop term planner automates requirement validation. By mapping planned courses against
                remaining credits in real-time, it removes the guesswork from prerequisite sequencing and keeps
                students on the fastest track to completion.
              </p>
              <a
                className="script-tech-link"
                href="https://trailhead.salesforce.com/content/learn/modules/student-success-with-education-cloud/explore-the-learner-portal"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learner Portal Documentation
              </a>
              <a
                href="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/student-success-with-education-cloud/explore-the-learner-portal/images/fac4363dfd265f015157b81309b9a1a3_kix.59jefz262pux.png"
                target="_blank"
                rel="noopener noreferrer"
                className="script-tech-diagram-wrap"
              >
                <img
                  src="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/student-success-with-education-cloud/explore-the-learner-portal/images/fac4363dfd265f015157b81309b9a1a3_kix.59jefz262pux.png"
                  alt="Education Cloud Intelligent Degree Planner reference screenshot"
                  className="script-tech-diagram"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  width={1024}
                  height={571}
                />
              </a>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Intelligent Program Comparison Engine</h4>
              <p className="feature-copy">
                The platform's degree comparison tool surfaces critical differences in program duration and credit
                hours. This side-by-side analysis automates 'what-if' scenarios, allowing advisors and learners to
                instantly see requirement gaps and make informed transfer decisions.
              </p>
              <a
                className="script-tech-link"
                href="https://trailhead.salesforce.com/content/learn/modules/student-success-with-education-cloud/explore-the-learner-portal"
                target="_blank"
                rel="noopener noreferrer"
              >
                Program Comparison Documentation
              </a>
              <a
                href="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/student-success-with-education-cloud/explore-the-learner-portal/images/57744418e2bda8603c198b4f0a2aa55e_kix.6nom3yc8kfna.png"
                target="_blank"
                rel="noopener noreferrer"
                className="script-tech-diagram-wrap"
              >
                <img
                  src="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/student-success-with-education-cloud/explore-the-learner-portal/images/57744418e2bda8603c198b4f0a2aa55e_kix.6nom3yc8kfna.png"
                  alt="Education Cloud Intelligent Program Comparison Engine reference screenshot"
                  className="script-tech-diagram"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  width={1024}
                  height={572}
                />
              </a>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Course Search and Registration</h4>
              <p className="feature-copy">
                Education Cloud streamlines registration by consolidating search, seat availability, and cart
                management into a single view. This eliminates context switching, allowing learners to verify
                eligibility and enroll in one seamless flow.
              </p>
              <a
                className="script-tech-link"
                href="https://help.salesforce.com/s/articleView?id=sfdo.ec_course_search_and_registration.htm&type=5"
                target="_blank"
                rel="noopener noreferrer"
              >
                Course Registration Reference
              </a>
              <a
                href="https://sf-zdocs-cdn-prod.zoominsoftware.com/tdta-education_cloud-260-0-0-production-enus/e66d9fbf-c55a-4f61-88e7-f7e98b63ac3e/education_cloud/images/course_search_and_registration.png"
                target="_blank"
                rel="noopener noreferrer"
                className="script-tech-diagram-wrap"
              >
                <img
                  src="https://sf-zdocs-cdn-prod.zoominsoftware.com/tdta-education_cloud-260-0-0-production-enus/e66d9fbf-c55a-4f61-88e7-f7e98b63ac3e/education_cloud/images/course_search_and_registration.png"
                  alt="Salesforce Education Cloud course search and registration UI reference"
                  className="script-tech-diagram"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  width={1011}
                  height={786}
                />
              </a>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Education Cloud Architecture</h4>
              <p className="feature-copy">
                The platform unifies the student experience by centering all data around the learner lifecycle. By
                combining specialized apps for academic success with powerful automation, Education Cloud eliminates
                silos from recruitment through to alumni relations.
              </p>
              <a
                className="script-tech-link"
                href="https://trailhead.salesforce.com/content/learn/modules/education-cloud-basics/education-cloud-tools-and-benefits"
                target="_blank"
                rel="noopener noreferrer"
              >
                Education Cloud Tools and Benefits
              </a>
              <a
                href="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/education-cloud-basics/education-cloud-tools-and-benefits/images/aa92349165c809c196b7ca79e668f4bd_kix.alariidpt8ma.png"
                target="_blank"
                rel="noopener noreferrer"
                className="script-tech-diagram-wrap"
              >
                <img
                  src="https://res.cloudinary.com/hy4kyit2a/f_auto,fl_lossy,q_70/learn/modules/education-cloud-basics/education-cloud-tools-and-benefits/images/aa92349165c809c196b7ca79e668f4bd_kix.alariidpt8ma.png"
                  alt="Salesforce Education Cloud architecture highlights reference screenshot"
                  className="script-tech-diagram"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  width={1600}
                  height={852}
                />
              </a>
            </article>
          </div>
        </section>

        <section id="google-engineering-process" className="component-panel section-stack script-tech-section portfolio-section portfolio-deep-dive">
          <div className="script-tech-header portfolio-section-header">
            <h3 className="section-title">Google</h3>
            <p className="hero-description">
              The delivery framework used for proprietary platform work, from product alignment through rollout,
              observability, and operational learning.
            </p>
          </div>

          <div className="portfolio-grid portfolio-grid-stack">
            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Requirement Discovery and Product Alignment</h4>
              <p className="feature-copy">
                Work starts with a clearly defined problem statement and shared success metrics. I partner with PMs, UX, and
                domain stakeholders to align on user outcomes, edge cases, and non-functional constraints so
                implementation scope and Definition of Done remain explicit from day one.
              </p>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Design Phase and Technical Review</h4>
              <p className="feature-copy">
                Before production code, I draft a technical design that maps service boundaries, data contracts, and
                risk trade-offs such as latency, consistency, and operational complexity. The design is reviewed with
                engineering peers to validate reuse opportunities and reduce architectural drift.
              </p>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Iterative Implementation</h4>
              <p className="feature-copy">
                Execution is milestone-driven with small, atomic PRs that keep review quality high and blast radius
                low. This workflow improves collaboration across engineers and speeds decisions around code quality,
                security posture, and long-term maintainability.
              </p>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Layered Test Cycle</h4>
              <p className="feature-copy">
                Validation follows a layered strategy: unit tests for core logic, integration tests for service
                boundaries, and end-to-end checks for real user journeys. Pre-release confidence is reinforced in{' '}
                staging and canary environments using production-like configuration patterns.
              </p>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Deployment and Controlled Rollout</h4>
              <p className="feature-copy">
                Launches are progressive, not binary. Feature flags and phased rollout gates enable real-time
                monitoring at low exposure levels first, with fast disable paths when telemetry signals regressions in
                latency, reliability, or error rates.
              </p>
            </article>

            <article className="script-tech-card portfolio-card">
              <h4 className="spotlight-text">Observability and Post-Launch Learning</h4>
              <p className="feature-copy">
                After release, ownership shifts to operational visibility and continuous improvement. Dashboards,
                alerting, and incident review loops feed directly into backlog refinement so each cycle improves system
                resilience, developer velocity, and user trust.
              </p>
            </article>
          </div>
        </section>

        <section className="component-panel section-stack portfolio-section">
          <h3 className="section-title">Resume</h3>
          <p className="hero-description">
            Access the theatrical preview of my professional journey or download the PDF directly.
          </p>
          <div className="script-actions">
            <button className="script-open-btn" onClick={() => setIsResumeOpen(true)}>
              <FileText className="w-4 h-4" />
              View Resume
            </button>
            <a className="script-download-btn" href={resumeUrl} download>
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        </section>
      </main>

      {isResumeOpen && (
        <Suspense fallback={null}>
          <ScriptResumeModal
            resumeUrl={resumeUrl}
            isOpen={isResumeOpen}
            onClose={() => setIsResumeOpen(false)}
          />
        </Suspense>
      )}

      {copyToastMessage && (
        <div className="script-copy-toast" role="status" aria-live="polite">
          {copyToastMessage}
        </div>
      )}
    </>
  );
}

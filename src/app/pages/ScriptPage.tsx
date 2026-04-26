import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, FileText } from 'lucide-react';

interface ScriptPageProps {
  resumeUrl: string;
}

export function ScriptPage({ resumeUrl }: ScriptPageProps) {
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  return (
    <>
      <main className="app-main">
        <section className="component-panel section-stack">
          <h2 className="section-title">Script</h2>
          <p className="hero-description">
            Open a cinematic preview of my resume or download the PDF directly.
          </p>
          <div className="script-actions">
            <button className="script-open-btn" onClick={() => setIsResumeOpen(true)}>
              <FileText className="w-4 h-4" />
              Open Resume
            </button>
            <a className="script-download-btn" href={resumeUrl} download>
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isResumeOpen && (
          <div className="script-modal-wrap">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="script-modal-backdrop"
              onClick={() => setIsResumeOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="script-modal-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="script-modal-header">
                <h3 className="section-title script-modal-title">Resume Preview</h3>
                <button
                  onClick={() => setIsResumeOpen(false)}
                  className="script-modal-close-btn"
                  aria-label="Close resume preview"
                >
                  <span aria-hidden="true" className="script-modal-close-glyph">×</span>
                </button>
              </div>

              <div className="script-modal-content">
                <iframe title="Resume PDF" src={resumeUrl} className="script-resume-frame" />
              </div>

              <div className="script-modal-footer">
                <a className="script-download-btn" href={resumeUrl} download>
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

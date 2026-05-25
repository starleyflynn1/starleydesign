import React from 'react';
import { Download } from 'lucide-react';

interface ScriptResumeModalProps {
  resumeUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ScriptResumeModal({ resumeUrl, isOpen, onClose }: ScriptResumeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="script-modal-wrap script-modal-wrap--open">
      <div className="script-modal-backdrop script-modal-backdrop--animate" onClick={onClose} aria-hidden />
      <div
        className="script-modal-panel script-modal-panel--animate"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Resume preview"
      >
        <div className="script-modal-header">
          <h3 className="section-title script-modal-title">Resume Preview</h3>
          <button
            onClick={onClose}
            className="script-modal-close-btn"
            aria-label="Close resume preview"
          >
            <span aria-hidden="true" className="script-modal-close-glyph">
              ×
            </span>
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
      </div>
    </div>
  );
}

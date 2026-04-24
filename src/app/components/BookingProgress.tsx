import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface BookingProgressProps {
  currentStep: number;
  steps: Step[];
}

export function BookingProgress({ currentStep, steps }: BookingProgressProps) {
  return (
    <div className="booking-progress-root">
      <div className="booking-progress-track-wrap">
        <div className="booking-progress-track">
          <div
            className="booking-progress-fill"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        <div className="booking-progress-steps">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <div key={step.number} className="booking-step-item">
                <div
                  className={`booking-step-bubble ${
                    isCompleted
                      ? 'booking-step-completed'
                      : isCurrent
                      ? 'booking-step-current'
                      : 'booking-step-pending'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <span>{step.number}</span>}
                </div>

                <div className="booking-step-meta">
                  <div
                    className={`booking-step-title ${
                      isCurrent
                        ? 'booking-step-title-current'
                        : isCompleted
                        ? 'booking-step-title-completed'
                        : 'booking-step-title-pending'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="booking-step-desc">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

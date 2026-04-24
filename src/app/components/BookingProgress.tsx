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
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-border">
          <div
            className="absolute top-0 left-0 h-full bg-spotlight transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isPending = step.number > currentStep;

            return (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-spotlight border-spotlight text-stage-base'
                      : isCurrent
                      ? 'bg-stage-depth border-spotlight text-spotlight ring-4 ring-spotlight/20'
                      : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <span>{step.number}</span>}
                </div>

                <div className="mt-3 text-center max-w-32">
                  <div
                    className={`text-sm ${
                      isCurrent ? 'text-spotlight' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

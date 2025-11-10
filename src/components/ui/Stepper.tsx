import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Step {
  id: string;
  name: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepChange?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className,
  onStepChange,
}) => {
  const handleStepClick = (index: number) => {
    if (onStepChange) {
      onStepChange(index);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-start justify-between gap-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-1 flex-col items-start text-left px-3 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  className="focus:outline-none"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full border-2 text-sm font-semibold transition-all duration-200',
                      isCompleted
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : isActive
                        ? 'border-primary text-primary bg-primary/10 shadow-sm'
                        : 'border-border text-muted-foreground bg-background',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                </button>
                <p
                  className={cn(
                    'mt-3 text-sm font-semibold leading-snug max-w-[18rem] break-words',
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.name}
                </p>
                {step.description ? (
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug max-w-[18rem]">
                    {step.description}
                  </p>
                ) : null}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-px mt-6 transition-all duration-200',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-foreground">
            Step {currentStep + 1} / {steps.length}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </div>
        </div>

        <div className="w-full bg-border rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="text-center">
          <h3 className="text-base font-semibold text-foreground">{steps[currentStep].name}</h3>
          {steps[currentStep].description && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

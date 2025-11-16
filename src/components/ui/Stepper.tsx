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
    <div className={cn('w-full space-y-3', className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center gap-1.5">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;

          const indicatorClass = cn(
            'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors',
            isCompleted
              ? 'bg-primary border-primary text-white'
              : isActive
              ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground bg-background',
          );

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                className="flex flex-1 items-center gap-1.5 text-left"
              >
                <span className={indicatorClass}>
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-semibold leading-tight',
                      isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground/90 line-clamp-2 leading-snug">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'h-px flex-1 min-w-[20px]',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {currentStep + 1}/{steps.length}
          </span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-1 rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{steps[currentStep].name}</p>
          {steps[currentStep].description && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

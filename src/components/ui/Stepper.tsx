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
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : isActive
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground bg-background'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  )}
                </div>
              </div>
              
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-all duration-200',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-border rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        {/* Current Step Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            {steps[currentStep].name}
          </h3>
          {steps[currentStep].description && (
            <p className="text-sm text-muted-foreground mt-1">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const Stepper2: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isActive
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground bg-background'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
            </div>
            
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-all duration-200',
                  isCompleted ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
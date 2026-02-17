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
    if (onStepChange && index <= currentStep) {
      onStepChange(index);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Stepper */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-8 left-0 right-0 flex items-center px-8">
            <div className="flex-1 flex items-center gap-2">
              {steps.map((_, index) => {
                if (index === steps.length - 1) return null;
                const isCompleted = index < currentStep;
                return (
                  <div
                    key={`line-${index}`}
                    className={cn(
                      'h-0.5 flex-1 transition-all duration-500',
                      isCompleted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div className="relative flex items-start justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isClickable = index <= currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex flex-col items-center gap-3 group relative flex-1',
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                >
                  {/* Circle Indicator */}
                  <div
                    className={cn(
                      'relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all duration-300',
                      'shadow-lg',
                      isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white scale-100'
                        : isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 scale-110 shadow-xl shadow-blue-200 dark:shadow-blue-900/50'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 scale-95',
                      isClickable && !isActive && 'group-hover:scale-105 group-hover:border-blue-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-7 w-7 stroke-[3]" />
                    ) : (
                      <span className="text-xl font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="text-center max-w-[180px]">
                    <p
                      className={cn(
                        'text-sm font-semibold mb-1 transition-colors',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isCompleted
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {step.name}
                    </p>
                    {step.description && (
                      <p
                        className={cn(
                          'text-xs leading-relaxed transition-colors',
                          isActive
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-500 dark:text-gray-500'
                        )}
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tablet Stepper */}
      <div className="hidden md:block lg:hidden">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = index <= currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                  'border-2',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-600'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
                  isClickable && 'hover:shadow-md cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 transition-all',
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 stroke-[2.5]" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={cn(
                      'text-sm font-semibold mb-1',
                      isActive || isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Adım {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>

          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {steps[currentStep].name}
            </p>
            {steps[currentStep].description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {steps[currentStep].description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { createContext, useContext, ReactNode } from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form context type
interface FormContextType<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, any>;
}

// Create form context
const FormContext = createContext<FormContextType<any> | null>(null);

// Form provider props
interface FormProviderProps<T extends FieldValues> {
  children: ReactNode;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

// Form provider component
export const FormProvider = <T extends FieldValues>({
  children,
  schema,
  defaultValues,
  onSubmit,
  mode = 'onChange',
  reValidateMode = 'onChange',
}: FormProviderProps<T>) => {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode,
    reValidateMode,
  });

  const { handleSubmit, formState } = form;
  const { isSubmitting, isValid, errors } = formState;

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  const contextValue: FormContextType<T> = {
    form,
    isSubmitting,
    isValid,
    errors,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleFormSubmit} noValidate>
        {children}
      </form>
    </FormContext.Provider>
  );
};

// Hook to use form context
export const useFormContext = <T extends FieldValues>(): FormContextType<T> => {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  
  return context as FormContextType<T>;
};

// Hook to use form field
export const useFormField = <T extends FieldValues>(
  name: Path<T>
) => {
  const { form } = useFormContext<T>();
  const { register, formState, setValue, watch } = form;
  const { errors, touchedFields, isDirty } = formState;
  
  const fieldError = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);
  
  return {
    register: register(name),
    error: fieldError,
    isTouched,
    isDirty,
    value,
    setValue: (value: any) => setValue(name, value),
  };
};

// Form field wrapper component
interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  children: (field: {
    register: any;
    error?: any;
    isTouched: boolean;
    isDirty: boolean;
    value: any;
    setValue: (value: any) => void;
  }) => ReactNode;
}

export const FormField = <T extends FieldValues>({
  name,
  children,
}: FormFieldProps<T>) => {
  const field = useFormField<T>(name);
  return <>{children(field)}</>;
};

// Form error display component
interface FormErrorProps {
  name: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ name, className }) => {
  const { errors } = useFormContext();
  const error = errors[name];
  
  if (!error) return null;
  
  return (
    <p className={`text-sm text-error mt-1 ${className || ''}`}>
      {error.message}
    </p>
  );
};

// Form submit button component
interface FormSubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  children,
  loading,
  disabled,
  className,
  variant = 'primary',
  size = 'md',
}) => {
  const { isSubmitting, isValid } = useFormContext();
  
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting || loading || !isValid}
      className={`
        inline-flex items-center justify-center px-4 py-2 border border-transparent 
        text-sm font-medium rounded-md shadow-sm transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary' : ''}
        ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary-hover focus:ring-secondary' : ''}
        ${variant === 'outline' ? 'bg-background text-foreground border-border hover:bg-muted focus:ring-ring' : ''}
        ${variant === 'ghost' ? 'text-foreground hover:bg-muted focus:ring-ring' : ''}
        ${variant === 'danger' ? 'bg-error text-error-foreground hover:bg-error-hover focus:ring-error' : ''}
        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : ''}
        ${size === 'md' ? 'px-4 py-2 text-sm' : ''}
        ${size === 'lg' ? 'px-6 py-3 text-base' : ''}
        ${className || ''}
      `}
    >
      {isSubmitting || loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Form reset button component
interface FormResetButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const FormResetButton: React.FC<FormResetButtonProps> = ({
  children,
  className,
  variant = 'outline',
  size = 'md',
}) => {
  const { form } = useFormContext();
  
  const handleReset = () => {
    form.reset();
  };
  
  return (
    <button
      type="button"
      onClick={handleReset}
      className={`
        inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md 
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variant === 'outline' ? 'bg-background text-foreground border-border hover:bg-muted focus:ring-ring' : ''}
        ${variant === 'ghost' ? 'text-foreground hover:bg-muted focus:ring-ring' : ''}
        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : ''}
        ${size === 'md' ? 'px-4 py-2 text-sm' : ''}
        ${size === 'lg' ? 'px-6 py-3 text-base' : ''}
        ${className || ''}
      `}
    >
      {children}
    </button>
  );
};

export default FormProvider;

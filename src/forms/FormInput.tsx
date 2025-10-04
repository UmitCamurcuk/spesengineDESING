import React, { forwardRef } from 'react';
import { FormField, FormError } from './FormProvider';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { Radio } from '../components/ui/Radio';
import { FileInput } from '../components/ui/FileInput';
import { DatePicker } from '../components/ui/DatePicker';
import { FieldValues, Path } from 'react-hook-form';

// Form input props
interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Text input component
export const FormTextInput = <T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
  disabled,
  className,
  helperText,
  leftIcon,
  rightIcon,
}: FormInputProps<T>) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Input
            {...register}
            label={label}
            placeholder={placeholder}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Email input component
export const FormEmailInput = <T extends FieldValues>({
  name,
  label = 'Email',
  placeholder = 'Enter your email',
  required = true,
  disabled,
  className,
  helperText,
}: FormInputProps<T>) => {
  return (
    <FormTextInput<T>
      name={name}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      helperText={helperText}
    />
  );
};

// Password input component
export const FormPasswordInput = <T extends FieldValues>({
  name,
  label = 'Password',
  placeholder = 'Enter your password',
  required = true,
  disabled,
  className,
  helperText,
}: FormInputProps<T>) => {
  return (
    <FormTextInput<T>
      name={name}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      helperText={helperText}
    />
  );
};

// Number input component
export const FormNumberInput = <T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
  disabled,
  className,
  helperText,
  min,
  max,
  step,
}: FormInputProps<T> & {
  min?: number;
  max?: number;
  step?: number;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Input
            {...register}
            type="number"
            label={label}
            placeholder={placeholder}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Select input component
export const FormSelectInput = <T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
  disabled,
  className,
  helperText,
  options,
}: FormInputProps<T> & {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Select
            {...register}
            label={label}
            placeholder={placeholder}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            options={options}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Textarea component
export const FormTextarea = <T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
  disabled,
  className,
  helperText,
  rows = 4,
}: FormInputProps<T> & {
  rows?: number;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Textarea
            {...register}
            label={label}
            placeholder={placeholder}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            rows={rows}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Checkbox component
export const FormCheckbox = <T extends FieldValues>({
  name,
  label,
  required,
  disabled,
  className,
  helperText,
}: FormInputProps<T>) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Checkbox
            {...register}
            label={label}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            checked={value}
            onChange={(checked) => setValue(checked)}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Radio component
export const FormRadio = <T extends FieldValues>({
  name,
  label,
  required,
  disabled,
  className,
  helperText,
  options,
}: FormInputProps<T> & {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <Radio
            {...register}
            label={label}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            options={options}
            value={value}
            onChange={(selectedValue) => setValue(selectedValue)}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// File input component
export const FormFileInput = <T extends FieldValues>({
  name,
  label,
  required,
  disabled,
  className,
  helperText,
  accept,
  multiple,
}: FormInputProps<T> & {
  accept?: string;
  multiple?: boolean;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <FileInput
            {...register}
            label={label}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            accept={accept}
            multiple={multiple}
            value={value}
            onChange={(files) => setValue(files)}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Date picker component
export const FormDatePicker = <T extends FieldValues>({
  name,
  label,
  required,
  disabled,
  className,
  helperText,
  minDate,
  maxDate,
}: FormInputProps<T> & {
  minDate?: Date;
  maxDate?: Date;
}) => {
  return (
    <FormField<T>
      name={name}
      children={({ register, error, isTouched, value, setValue }) => (
        <div className={className}>
          <DatePicker
            {...register}
            label={label}
            error={error?.message}
            helperText={helperText}
            required={required}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
            value={value}
            onChange={(date) => setValue(date)}
            className={isTouched && error ? 'border-error' : ''}
          />
          <FormError name={name as string} />
        </div>
      )}
    />
  );
};

// Form field array component
interface FormFieldArrayProps<T extends FieldValues> {
  name: Path<T>;
  children: (index: number, remove: () => void) => React.ReactNode;
  addButtonText?: string;
  maxItems?: number;
  minItems?: number;
}

export const FormFieldArray = <T extends FieldValues>({
  name,
  children,
  addButtonText = 'Add Item',
  maxItems,
  minItems = 0,
}: FormFieldArrayProps<T>) => {
  const { form } = useFormContext<T>();
  const { control, watch, setValue } = form;
  
  const fields = watch(name as any) || [];
  
  const addItem = () => {
    if (!maxItems || fields.length < maxItems) {
      setValue(name as any, [...fields, {}]);
    }
  };
  
  const removeItem = (index: number) => {
    if (fields.length > minItems) {
      const newFields = fields.filter((_: any, i: number) => i !== index);
      setValue(name as any, newFields);
    }
  };
  
  return (
    <div>
      {fields.map((_: any, index: number) => (
        <div key={index} className="mb-4">
          {children(index, () => removeItem(index))}
        </div>
      ))}
      
      {(!maxItems || fields.length < maxItems) && (
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 text-sm text-primary hover:text-primary-hover border border-primary rounded-md hover:bg-primary/5 transition-colors"
        >
          {addButtonText}
        </button>
      )}
    </div>
  );
};

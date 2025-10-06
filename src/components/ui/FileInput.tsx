import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { Upload, X, File, Image, FileText } from 'lucide-react';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  value?: File | File[] | null;
  onChange?: (files: File | File[] | null) => void;
  variant?: 'default' | 'drag';
  preview?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({
  label,
  error,
  helperText,
  accept,
  multiple = false,
  maxSize,
  value,
  onChange,
  variant = 'default',
  preview = true,
  className,
  id,
  ...props
}) => {
  const fileInputId = id || `file-input-${Math.random().toString(36).substr(2, 9)}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) {
      onChange?.(null);
      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check file size
    if (maxSize) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
          alert(`File ${files[i].name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
          // Reset input value on error
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
      }
    }

    if (multiple) {
      onChange?.(Array.from(files));
    } else {
      onChange?.(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index?: number) => {
    if (multiple && Array.isArray(value)) {
      const newFiles = value.filter((_, i) => i !== index);
      onChange?.(newFiles.length > 0 ? newFiles : null);
    } else {
      onChange?.(null);
    }
    // Reset input value when removing files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type.includes('text')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const files = multiple && Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-foreground">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors duration-200',
          variant === 'drag' && 'p-6',
          variant === 'default' && 'p-4',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-input hover:border-primary',
          error && 'border-error',
          props.disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
          {...props}
        />

        <div className="text-center">
          <Upload className={cn(
            'mx-auto text-muted-foreground',
            variant === 'drag' ? 'h-8 w-8' : 'h-6 w-6'
          )} />
          <div className="mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={props.disabled}
              className={cn(
                'text-sm font-medium text-primary hover:text-primary-hover',
                props.disabled && 'cursor-not-allowed'
              )}
            >
              {variant === 'drag' ? 'Click to upload or drag and drop' : 'Choose files'}
            </button>
            {!multiple && <p className="text-xs text-muted-foreground">or drag and drop</p>}
          </div>
          {accept && (
            <p className="text-xs text-muted-foreground mt-1">
              Accepted formats: {accept}
            </p>
          )}
          {maxSize && (
            <p className="text-xs text-muted-foreground">
              Max size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          )}
        </div>
      </div>

      {preview && files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={multiple ? index : file.name}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(multiple ? index : undefined)}
                className="p-1 text-muted-foreground hover:text-error transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};


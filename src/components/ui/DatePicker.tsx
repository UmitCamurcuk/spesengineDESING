import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  format?: 'date' | 'datetime' | 'time';
  variant?: 'default' | 'filled';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  helperText,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  format = 'date',
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const datePickerId = id || `date-picker-${Math.random().toString(36).substr(2, 9)}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? (value instanceof Date ? value : new Date(value)) : null
  );
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const date = value instanceof Date ? value : new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDate = (date: Date) => {
    if (format === 'time') {
      return date.toLocaleTimeString('en-US', { hour12: false });
    } else if (format === 'datetime') {
      return date.toLocaleString();
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange?.(date);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange?.(null);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const baseClasses = 'w-full px-3 py-2 text-sm bg-background text-foreground border rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-muted-foreground';

  const variantClasses = {
    default: error
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-input focus:border-ring focus:ring-ring/20',
    filled: error
      ? 'bg-error-background border-error focus:border-error focus:ring-error/20'
      : 'bg-muted border-border focus:bg-background focus:border-ring focus:ring-ring/20',
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={datePickerId} className="block text-xs font-medium text-foreground">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      <div className="relative" ref={datePickerRef}>
        <input
          id={datePickerId}
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            baseClasses,
            variantClasses[variant],
            'cursor-pointer',
            className
          )}
          {...props}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>

        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg">
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-muted rounded"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <h3 className="text-sm font-medium text-foreground">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-muted rounded"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-medium text-muted-foreground text-center py-1">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDateDisabled(date)}
                    className={cn(
                      'h-8 w-8 text-xs rounded hover:bg-muted transition-colors',
                      !isCurrentMonth && 'text-muted-foreground',
                      isDateSelected(date) && 'bg-primary text-primary-foreground',
                      isToday(date) && !isDateSelected(date) && 'bg-muted text-foreground',
                      isDateDisabled(date) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

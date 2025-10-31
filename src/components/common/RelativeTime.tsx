import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';

interface RelativeTimeProps {
  date: string | Date | null | undefined;
  includeTime?: boolean;
  showFullDateAfter?: number; // Show full date after X days (default: 7)
  className?: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  includeTime = false,
  showFullDateAfter = 7,
  className = '',
}) => {
  const { t } = useLanguage();
  const { formatDateTime } = useDateFormatter();

  if (!date) {
    return <span className={className}>—</span>;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (Number.isNaN(dateObj.getTime())) {
    return <span className={className}>—</span>;
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  // Handle future dates
  if (diffMs < 0) {
    return (
      <span className={className} title={formatDateTime(dateObj, { includeTime: true })}>
        {formatDateTime(dateObj, { includeTime })}
      </span>
    );
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Online: less than 1 minute ago
  if (diffSeconds < 60) {
    return (
      <span className={className}>
        <span className="inline-flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          {t('common.online') || 'Online'}
        </span>
      </span>
    );
  }

  // Just now: 1-2 minutes ago
  if (diffMinutes < 2) {
    return (
      <span className={className}>
        {t('common.just_now') || 'Az önce'}
      </span>
    );
  }

  // Minutes ago
  if (diffMinutes < 60) {
    const minutesText = diffMinutes === 1 
      ? (t('common.minute_ago') || '1 dakika önce')
      : (t('common.minutes_ago', { count: diffMinutes }) || `${diffMinutes} dakika önce`);
    return <span className={className}>{minutesText}</span>;
  }

  // Hours ago
  if (diffHours < 24) {
    const hoursText = diffHours === 1
      ? (t('common.hour_ago') || '1 saat önce')
      : (t('common.hours_ago', { count: diffHours }) || `${diffHours} saat önce`);
    return <span className={className}>{hoursText}</span>;
  }

  // Days ago
  if (diffDays < showFullDateAfter) {
    const daysText = diffDays === 1
      ? (t('common.day_ago') || '1 gün önce')
      : (t('common.days_ago', { count: diffDays }) || `${diffDays} gün önce`);
    return <span className={className}>{daysText}</span>;
  }

  // Show full date for older entries
  return (
    <span className={className} title={formatDateTime(dateObj, { includeTime: true })}>
      {formatDateTime(dateObj, { includeTime })}
    </span>
  );
};


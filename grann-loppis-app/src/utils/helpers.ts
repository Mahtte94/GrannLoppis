import { EventStatus } from '../types';

/**
 * Calculate the current status of an event based on its date range
 * An event is:
 * - ACTIVE if today is between startDate and endDate (inclusive)
 * - COMPLETED if today is after endDate
 * - UPCOMING if today is before startDate
 */
export function getEventStatus(startDate: Date, endDate: Date): EventStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
    return EventStatus.ACTIVE;
  } else if (today.getTime() > end.getTime()) {
    return EventStatus.COMPLETED;
  } else {
    return EventStatus.UPCOMING;
  }
}

/**
 * Get a user-friendly status text in Swedish
 */
export function getStatusText(status: EventStatus): string {
  switch (status) {
    case EventStatus.ACTIVE:
      return 'Pågår nu';
    case EventStatus.UPCOMING:
      return 'Kommande';
    case EventStatus.COMPLETED:
      return 'Avslutad';
    default:
      return status;
  }
}

/**
 * Format a date to Swedish locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };

  return new Date(date).toLocaleDateString('sv-SE', options || defaultOptions);
}

/**
 * Format a date range to Swedish locale
 * Examples:
 * - Same day: "12 oktober 2025"
 * - Same month: "12-15 oktober 2025"
 * - Different months: "30 september - 3 oktober 2025"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleDateString('sv-SE', { month: 'long' });
    const year = start.getFullYear();
    return `${startDay}-${endDay} ${month} ${year}`;
  }

  // Different months
  const startStr = formatDate(start, { day: 'numeric', month: 'long' });
  const endStr = formatDate(end, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // +1 to include both start and end days
}

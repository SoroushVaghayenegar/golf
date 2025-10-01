// Timezone utilities for user's local time
/**
 * Get current date and time in user's local timezone
 */
export function getNow(): Date {
  return new Date();
}

/**
 * Convert a date to user's local timezone
 */
export function toLocalTime(date: Date): Date {
  return new Date(date);
}

/**
 * Create a date with specific components in user's local timezone
 */
export function createDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Get today's date in user's local timezone (start of day)
 * Returns tomorrow if current time is between 9:59pm and 11:59pm
 */
export function getToday(): Date {
  const now = getNow();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Between 9:59pm and 11:59pm, return tomorrow as "today"
  const isLateEvening = hour >= 21;
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (isLateEvening) {
    today.setDate(today.getDate() + 1);
  }
  
  return today;
}

/**
 * Check if a date is in the past relative to user's local time
 */
export function isPastDate(date: Date): boolean {
  const today = getToday();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

/**
 * Check if the actual current calendar day should be disabled
 * (after 9:59pm user's local time)
 */
export function isTodayDisabled(): boolean {
  const now = getNow();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return hour >= 22 || (hour === 21 && minute >= 59); // 9:59pm or later
}

/**
 * Get the minimum selectable date in user's local timezone
 */
export function getMinSelectableDate(): Date {
  if (isTodayDisabled()) {
    const tomorrow = getToday();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  return getToday();
}

/**
 * Check if a date should be disabled in user's local timezone
 */
export function isDateDisabled(date: Date): boolean {
  const today = getToday();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  // Disable past dates
  if (compareDate < today) {
    return true;
  }
  
  // Disable the actual current calendar day if it's after 9:59pm user's local time
  if (compareDate.getTime() === today.getTime() && isTodayDisabled()) {
    return true;
  }
  
  return false;
}

export function formatDatesForAPI(dates: Date[]): string {
  return dates.map(formatDateForAPI).join(',');
}

/**
 * Format a date to YYYY-MM-DD string - preserves calendar date without timezone conversion
 */
export function formatDateForAPI(date: Date): string {
  // Use the calendar date components directly to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Parse a datetime string and return it in user's local timezone
 */
export function parseDateTime(dateTimeString: string): Date {
  // Remove 'T' and replace with space for better parsing
  const dateString = dateTimeString.replace('T', ' ');
  const date = new Date(dateString);
  return toLocalTime(date);
}

/**
 * Format a date to display user's local time
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current user's local time as a formatted string
 */
export function getCurrentTime(): string {
  return formatLocalTime(new Date());
} 
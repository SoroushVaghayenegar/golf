// Vancouver timezone utilities
const VANCOUVER_TIMEZONE = 'America/Vancouver';

/**
 * Get current date and time in Vancouver timezone
 */
export function getVancouverNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
}

/**
 * Convert a date to Vancouver timezone
 */
export function toVancouverTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
}

/**
 * Create a date in Vancouver timezone with specific components
 */
export function createVancouverDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
  const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  return new Date(dateString + 'T00:00:00.000Z');
}

/**
 * Get today's date in Vancouver timezone (start of day)
 */
export function getVancouverToday(): Date {
  const now = getVancouverNow();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Check if a date is in the past relative to Vancouver time
 */
export function isPastDateInVancouver(date: Date): boolean {
  const vancouverToday = getVancouverToday();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < vancouverToday;
}

/**
 * Check if today should be disabled (after 10pm Vancouver time)
 */
export function isTodayDisabledInVancouver(): boolean {
  const vancouverNow = getVancouverNow();
  return vancouverNow.getHours() >= 22; // 10pm or later
}

/**
 * Get the minimum selectable date in Vancouver timezone
 */
export function getMinSelectableDateInVancouver(): Date {
  if (isTodayDisabledInVancouver()) {
    const tomorrow = getVancouverToday();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  return getVancouverToday();
}

/**
 * Check if a date should be disabled in Vancouver timezone
 */
export function isDateDisabledInVancouver(date: Date): boolean {
  const vancouverToday = getVancouverToday();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  // Disable past dates
  if (compareDate < vancouverToday) {
    return true;
  }
  
  // Disable today if it's after 10pm Vancouver time
  if (compareDate.getTime() === vancouverToday.getTime() && isTodayDisabledInVancouver()) {
    return true;
  }
  
  return false;
}

export function formatDatesForAPI(dates: Date[]): string {
  return dates.map(formatDateForAPI).join(',');
}

/**
 * Format a date to YYYY-MM-DD string in Vancouver timezone
 */
export function formatDateForAPI(date: Date): string {
  const vancouverDate = toVancouverTime(date);
  const year = vancouverDate.getFullYear();
  const month = vancouverDate.getMonth() + 1;
  const day = vancouverDate.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Parse a datetime string and return it in Vancouver timezone
 */
export function parseDateTimeInVancouver(dateTimeString: string): Date {
  // Remove 'T' and replace with space for better parsing
  const dateString = dateTimeString.replace('T', ' ');
  const date = new Date(dateString);
  return toVancouverTime(date);
}

/**
 * Format a date to display Vancouver time
 */
export function formatVancouverTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Vancouver',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current Vancouver time as a formatted string
 */
export function getCurrentVancouverTime(): string {
  return formatVancouverTime(new Date());
} 
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param date - The date to format
 * @param language - The language to use for formatting ('en' or 'es')
 * @returns A formatted time ago string
 */
export function formatTimeAgo(date: Date, language: 'en' | 'es' = 'en'): string {
  try {
    const locale = language === 'es' ? es : undefined;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  } catch (error) {
    // Fallback to a simple date format if there's an error
    return format(date, 'PPp');
  }
}
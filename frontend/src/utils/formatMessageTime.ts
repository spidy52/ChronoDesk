/**
 * Formats a date/string into a human-readable time string like "10:23 AM".
 */
export function formatMessageTime(
  date: Date | string | number
): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

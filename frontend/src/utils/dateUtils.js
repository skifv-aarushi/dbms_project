/**
 * Formats a date string (e.g. "2026-10-10T00:00:00.000Z" or "2026-10-10")
 * into a human-readable date like "10 Oct 2026".
 *
 * Uses direct string parsing to avoid UTC timezone offset shifts.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  
  // Extract YYYY-MM-DD
  const raw = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString();
  const datePart = raw.split('T')[0];
  const parts = datePart.split('-');
  
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = monthNames[monthIdx] || month;
  const dayNum = parseInt(day, 10);
  
  return `${dayNum} ${monthName} ${year}`;
}

/**
 * Formats a 24-hour time string (e.g. "15:30:00" or "15:30")
 * into 12-hour format with AM/PM (e.g. "3:30 PM").
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  
  if (isNaN(hours)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' hours should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Combines date and time into a friendly string.
 * E.g. "10 Oct 2026 at 3:30 PM"
 */
export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  const d = formatDate(dateStr);
  const t = formatTime(timeStr);
  if (!t) return d;
  return `${d} at ${t}`;
}

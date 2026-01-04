/**
 * Formats a date to YYYY-MM-DD using local time to avoid timezone shifts.
 */
export const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a Date object for Today at 00:00:00 local time.
 */
export const getTodayLocal = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns a Date object for Yesterday at 00:00:00 local time.
 */
export const getYesterdayLocal = (): Date => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Formats a date object to a time string (HH:MM).
 */
export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Extracts the YYYY-MM-DD part from an ISO string or Date object.
 */
export const extractDatePart = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDateToISO(d);
};

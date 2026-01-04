/**
 * Formats a number with thousands separators and 2 decimal places.
 * Example: 10435 => "10,435.00"
 */
export const formatAmount = (num: number): string => {
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

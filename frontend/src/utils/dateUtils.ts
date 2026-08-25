/**
 * @file dateUtils.ts
 * @notice Centralized Date and Time formatting utility for the Digital Product Passport application.
 *
 * Enforces enterprise-standardized formats across all user-facing components:
 * - Date only: "24 August 2026"
 * - Date & Time: "24 August 2026, 3:45 PM"
 */

export type DateInput = number | bigint | string | Date | undefined | null;

/**
 * Converts various date/timestamp input formats into a valid JavaScript Date object.
 * Automatically handles Unix second timestamps (10 digits) vs millisecond timestamps (13 digits).
 */
export function normalizeDate(input: DateInput): Date | null {
  if (input === undefined || input === null || input === "") {
    return null;
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  let numVal: number;
  if (typeof input === "bigint") {
    numVal = Number(input);
  } else if (typeof input === "string") {
    // Check if string is a numeric timestamp
    const parsedNum = Number(input);
    if (!isNaN(parsedNum) && /^\d+$/.test(input.trim())) {
      numVal = parsedNum;
    } else {
      const parsedDate = new Date(input);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
  } else {
    numVal = input;
  }

  if (numVal <= 0 || isNaN(numVal)) {
    return null;
  }

  // If timestamp is in seconds (standard Unix timestamp < 100 billion), convert to milliseconds
  const ms = numVal < 100_000_000_000 ? numVal * 1000 : numVal;
  const dateObj = new Date(ms);
  return isNaN(dateObj.getTime()) ? null : dateObj;
}

/**
 * Formats a timestamp as a standardized user-facing Date string:
 * E.g., "24 August 2026", "1 January 2027", "9 February 2028"
 *
 * @param input - Unix timestamp (seconds or ms), ISO string, bigint, or Date
 * @param fallback - Fallback string if date is null/invalid (default: "N/A")
 */
export function formatDate(input: DateInput, fallback: string = "N/A"): string {
  const date = normalizeDate(input);
  if (!date) return fallback;

  // Formats as "24 August 2026"
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats a timestamp as a standardized user-facing Date & Time string:
 * E.g., "24 August 2026, 3:45 PM", "5 September 2026, 12:30 PM"
 *
 * @param input - Unix timestamp (seconds or ms), ISO string, bigint, or Date
 * @param fallback - Fallback string if date is null/invalid (default: "N/A")
 */
export function formatDateTime(input: DateInput, fallback: string = "N/A"): string {
  const date = normalizeDate(input);
  if (!date) return fallback;

  const datePart = formatDate(date, fallback);
  const timePart = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Formats only the time component in 12-hour format:
 * E.g., "3:45 PM", "12:30 AM"
 */
export function formatTime(input: DateInput, fallback: string = "N/A"): string {
  const date = normalizeDate(input);
  if (!date) return fallback;

  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

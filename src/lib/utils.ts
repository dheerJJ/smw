import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees (₹) with Indian number comma grouping (e.g., ₹1,50,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in Indian standard DD/MM/YYYY
 */
export function formatDateIN(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(date);
  }
}

/**
 * Format datetime in Indian standard DD/MM/YYYY, hh:mm a
 */
export function formatDateTimeIN(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy, hh:mm a");
  } catch {
    return String(date);
  }
}

/**
 * Format time in 12-hour format with AM/PM (e.g., "10:30 AM")
 */
export function formatTimeIN(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "hh:mm a");
  } catch {
    return String(date);
  }
}

/**
 * Standardize Indian phone number to E.164 (+91XXXXXXXXXX)
 */
export function normalizeIndianPhone(phone: string): { valid: boolean; formatted: string; error?: string } {
  if (!phone) return { valid: false, formatted: "", error: "Phone number is required" };
  
  // Strip all non-numeric characters except +
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Must be 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      formatted: phone,
      error: "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)",
    };
  }

  return {
    valid: true,
    formatted: `+91${cleaned}`,
  };
}

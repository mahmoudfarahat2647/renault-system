import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate warranty end date and remaining time
 */
export function getCalculatorValues(dateStr: string) {
  const startDate = new Date(dateStr);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 3);

  const now = new Date();
  const expired = now > endDate;

  if (expired) {
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      years: 0,
      months: 0,
      days: 0,
      expired: true,
      remainTime: "Expired",
    };
  }

  let years = endDate.getFullYear() - now.getFullYear();
  let months = endDate.getMonth() - now.getMonth();
  let days = endDate.getDate() - now.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years}Y`);
  if (months > 0) parts.push(`${months}M`);
  if (days > 0) parts.push(`${days}D`);

  // Format as "year - month - day"
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    years,
    months,
    days,
    expired: false,
    remainTime: `${years} y - ${months} m - ${days} d`,
  };
}

/**
 * Generate a unique pastel color based on VIN hash
 */
export function getVinColor(vin: string): string {
  if (!vin) return "transparent";

  let hash = 0;
  for (let i = 0; i < vin.length; i++) {
    hash = vin.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs((hash * 137) % 360);
  return `hsl(${h}, 85%, 96%)`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

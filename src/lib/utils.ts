import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    notation: num > 1000000 ? 'compact' : 'standard'
  }).format(num);
}

export function formatNumber(value: string | number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "N/A";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals
  }).format(num);
}

export function parseZoraError(error: Error | { message: string } | unknown): string {
  if (!error) return "Unknown error";
  
  // Convert unknown error to a type we can work with
  const errorWithMessage = error as { message?: string };
  
  // Handle specific Zora errors
  if (errorWithMessage.message && errorWithMessage.message.includes("insufficient")) {
    return "Insufficient funds for this transaction";
  }
  
  if (errorWithMessage.message && errorWithMessage.message.includes("slippage")) {
    return "Price changed too much. Try again with higher slippage tolerance";
  }

  if (errorWithMessage.message && errorWithMessage.message.includes("EthAmountTooSmall")) {
    return "ETH amount is too small. Please increase the amount you want to spend.";
  }
  
  // Return the original error message if no specific case matches
  return errorWithMessage.message || "An error occurred with the Zora API";
}

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

export function parseZoraError(error: any): string {
  if (!error) return "Unknown error";
  
  // Handle specific Zora errors
  if (error.message && error.message.includes("insufficient")) {
    return "Insufficient funds for this transaction";
  }
  
  if (error.message && error.message.includes("slippage")) {
    return "Price changed too much. Try again with higher slippage tolerance";
  }

  if (error.message && error.message.includes("EthAmountTooSmall")) {
    return "ETH amount is too small. Please increase the amount you want to spend.";
  }
  
  // Return the original error message if no specific case matches
  return error.message || "An error occurred with the Zora API";
}

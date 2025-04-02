/**
 * Format an ADA amount (in lovelace) to a human-readable string with the ₳ symbol
 * @param amount Amount in lovelace (1 ADA = 1,000,000 lovelace)
 * @param includeSymbol Whether to include the ₳ symbol
 * @returns Formatted ADA amount
 */
export const formatAdaAmount = (amount: number | null, includeSymbol = true): string => {
  if (amount === null) return includeSymbol ? '0 ₳' : '0';
  
  // Convert from lovelace to ADA
  const adaAmount = amount / 1000000;
  
  // Format with thousands separators
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(adaAmount);
  
  return includeSymbol ? `${formattedAmount} ₳` : formattedAmount;
};

/**
 * Parse an ADA string input to lovelace (smallest unit)
 * @param input ADA amount as string (may include commas and ₳ symbol)
 * @returns Amount in lovelace
 */
export const parseAdaInput = (input: string): number => {
  // Remove ₳ symbol and commas
  const cleanedInput = input.replace(/[₳,]/g, '');
  
  // Parse as number
  const adaAmount = parseFloat(cleanedInput);
  
  // Convert to lovelace (1 ADA = 1,000,000 lovelace)
  return isNaN(adaAmount) ? 0 : Math.round(adaAmount * 1000000);
};

/**
 * Format a date to a human-readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a percentage value
 * @param value Percentage value (0-100)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a wallet address to show a shortened version
 * @param address Full wallet address
 * @param charsToShow Number of characters to show at start and end
 * @returns Shortened address
 */
export const formatWalletAddress = (address: string, charsToShow = 6): string => {
  if (!address || address.length <= charsToShow * 2) return address;
  
  return `${address.substring(0, charsToShow)}...${address.substring(address.length - charsToShow)}`;
};

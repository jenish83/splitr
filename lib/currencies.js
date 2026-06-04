// by default, the currency is INR
export const DEFAULT_CURRENCY = "INR";

//Object containing all currencies with their respective symbols
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$" },
  INR: { code: "INR", symbol: "₹" },
  EUR: { code: "EUR", symbol: "€" },
  GBP: { code: "GBP", symbol: "£" },
  AUD: { code: "AUD", symbol: "A$" },
  CAD: { code: "CAD", symbol: "C$" },
  JPY: { code: "JPY", symbol: "¥" },
};

//Array of supported 
// so this becomes ["USD", "INR", "EUR", "GBP", "AUD", "CAD"]
export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES);

const STORAGE_KEY = "splitr-currency";

//Function to get the storage kys
export function getStorageKey() {
  return STORAGE_KEY;
}

//Function to check if the currency is valid
export function isValidCurrency(code) {
  return typeof code === "string" && code in CURRENCIES;
}

//Function to get the currency metadata
export function getCurrencyMeta(code) {
  return CURRENCIES[isValidCurrency(code) ? code : DEFAULT_CURRENCY];
}

//Function to format the money
export function formatMoney(amount, currencyCode, options = {}) {
  const { symbol } = getCurrencyMeta(currencyCode);
  const num = Number(amount) || 0;
  const abs = Math.abs(num).toFixed(2);

  //If the currency is signed, return the signed amount
  if (options.signed) {
    if (num > 0) return `+${symbol}${abs}`;
    if (num < 0) return `-${symbol}${abs}`;
    return `${symbol}${abs}`;
  }

  if (num < 0) return `-${symbol}${abs}`;
  return `${symbol}${abs}`;
}

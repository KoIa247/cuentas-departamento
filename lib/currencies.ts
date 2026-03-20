export const CURRENCIES = [
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "USD", symbol: "$", name: "US Dollar" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

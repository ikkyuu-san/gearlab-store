export type OrderCurrency = "MMK" | "THB";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatMMK(amount: number) {
  return `${numberFormat.format(amount)} Ks`;
}

export function formatOrderAmount(amount: number, currency: OrderCurrency) {
  return currency === "MMK" ? formatMMK(amount) : `${numberFormat.format(amount)} THB`;
}

/** DHL-style numeric tail; prefix is Westridge Logistics (WRL). */
const DIGITS = "0123456789";
const PREFIX = "WRL";

export function generateTrackingNumber(): string {
  let tail = "";
  for (let i = 0; i < 12; i++) {
    tail += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }
  return `${PREFIX}${tail}`;
}

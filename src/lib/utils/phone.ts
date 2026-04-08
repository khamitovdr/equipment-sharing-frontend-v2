/** Strip everything except digits from a string. */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Format a phone string into +7 (XXX) XXX-XX-XX.
 *
 * Handles common Russian entry patterns:
 * - "8..." → treated as "+7..."
 * - "9..." → treated as "+79..."
 * - "+7..." / "7..." → used directly
 */
export function formatPhone(raw: string): string {
  if (!raw) return "";

  let digits = extractDigits(raw);

  // Normalise leading digit
  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.length > 0 && digits[0] === "9") {
    digits = "7" + digits;
  }

  // Cap at 11 digits (7 + 10)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";

  // Build formatted string progressively
  let result = "+7";
  const rest = digits.slice(1); // digits after "7"

  if (rest.length === 0) return result;

  result += " (";
  result += rest.slice(0, 3);

  if (rest.length <= 3) return result;

  result += ") ";
  result += rest.slice(3, 6);

  if (rest.length <= 6) return result;

  result += "-";
  result += rest.slice(6, 8);

  if (rest.length <= 8) return result;

  result += "-";
  result += rest.slice(8, 10);

  return result;
}

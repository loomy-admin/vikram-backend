import crypto from 'crypto';

/**
 * Generates a random 10-digit numeric access code string.
 * e.g. "4820193857"
 * Guaranteed to be exactly 10 numeric digits.
 */
export function generate10DigitCode(): string {
  // First digit 1-9 to avoid leading zero confusion if needed, or any 10 digits
  const firstDigit = Math.floor(1 + Math.random() * 9).toString();
  const remainingDigits = crypto.randomInt(100000000, 999999999).toString();
  return `${firstDigit}${remainingDigits}`;
}

/**
 * Generates a random 6-digit numeric OTP string.
 * e.g. "384910"
 */
export function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generates an array of N unique 10-digit numeric codes.
 */
export function generateBulk10DigitCodes(quantity: number, existingCodesSet: Set<string> = new Set()): string[] {
  const result: string[] = [];
  const generatedSet = new Set<string>();

  while (result.length < quantity) {
    const code = generate10DigitCode();
    if (!existingCodesSet.has(code) && !generatedSet.has(code)) {
      generatedSet.add(code);
      result.push(code);
    }
  }

  return result;
}

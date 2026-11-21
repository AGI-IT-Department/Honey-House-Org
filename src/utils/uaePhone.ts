// Standard UAE Mobile Phone Utility
// Format: +971 followed by 9 digits starting with 5 (e.g., +971568326116)

const ARABIC_DIGITS_MAP: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9"
};

export const UAE_PHONE_REGEX = /^\+9715\d{8}$/;

export function toAsciiDigits(input: string): string {
  return (input || "").replace(/[٠-٩۰-۹]/g, ch => ARABIC_DIGITS_MAP[ch] || ch);
}

/**
 * Normalizes any UAE mobile phone input into standard `+9715XXXXXXXX` format.
 * Handles:
 * - 9 digits starting with 5:      "568326116"        -> "+971568326116"
 * - 10 digits starting with 05:    "0568326116"       -> "+971568326116"
 * - 12 digits starting with 9715:  "971568326116"     -> "+971568326116"
 * - 14 digits starting with 009715:"00971568326116"   -> "+971568326116"
 * - +971 with extra leading 0:     "+9710568326116"   -> "+971568326116"
 * - Spaces, dashes, Arabic digits: "+971 56-832 6116" -> "+971568326116"
 *
 * Non-UAE numbers (e.g. +20...) are returned trimmed without corruption.
 */
export function normalizeUAEPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = toAsciiDigits(String(raw))
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .trim();

  if (!cleaned) return "";

  const digits = cleaned.replace(/\D/g, "");

  // 9 digits starting with 5 (e.g. 568326116)
  if (/^5\d{8}$/.test(digits)) {
    return `+971${digits}`;
  }
  // 10 digits starting with 05 (e.g. 0568326116)
  if (/^05\d{8}$/.test(digits)) {
    return `+971${digits.slice(1)}`;
  }
  // 12 digits starting with 9715 (e.g. 971568326116 or +971568326116)
  if (/^9715\d{8}$/.test(digits)) {
    return `+${digits}`;
  }
  // 13 digits starting with 97105 (e.g. +9710568326116)
  if (/^97105\d{8}$/.test(digits)) {
    return `+971${digits.slice(4)}`;
  }
  // 14 digits starting with 009715 (e.g. 00971568326116)
  if (/^009715\d{8}$/.test(digits)) {
    return `+${digits.slice(2)}`;
  }
  // 15 digits starting with 0097105 (e.g. 009710568326116)
  if (/^0097105\d{8}$/.test(digits)) {
    return `+971${digits.slice(6)}`;
  }

  return cleaned;
}

/**
 * Checks whether a phone string (after UAE normalization) conforms to +9715XXXXXXXX.
 */
export function isValidUAEPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return UAE_PHONE_REGEX.test(normalizeUAEPhone(raw));
}

/**
 * Auto-formats during typing/pasting as soon as a complete UAE mobile pattern is recognized,
 * otherwise preserves user input (with Arabic digits converted to ASCII).
 */
export function formatUAEPhoneInput(raw: string): string {
  const ascii = toAsciiDigits(raw).replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
  const normalized = normalizeUAEPhone(ascii);
  if (UAE_PHONE_REGEX.test(normalized)) {
    return normalized;
  }
  return ascii;
}

/**
 * Returns validation details for live UI feedback under customer phone inputs.
 */
export function getUAEPhoneFeedback(raw: string): {
  valid: boolean;
  normalized: string;
  hint: string;
} {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      normalized: "",
      hint: "Standard UAE format: +9715XXXXXXXX (9 digits starting with 5)"
    };
  }

  const normalized = normalizeUAEPhone(trimmed);
  if (UAE_PHONE_REGEX.test(normalized)) {
    return {
      valid: true,
      normalized,
      hint: `Standard UAE format: ${normalized}`
    };
  }

  const digits = toAsciiDigits(trimmed).replace(/\D/g, "");
  let localPart = digits;
  if (digits.startsWith("00971")) localPart = digits.slice(5);
  else if (digits.startsWith("971")) localPart = digits.slice(3);
  if (localPart.startsWith("0")) localPart = localPart.slice(1);

  if (localPart.length > 0 && !localPart.startsWith("5")) {
    return {
      valid: false,
      normalized,
      hint: "UAE mobile number must start with 5 after +971 (e.g. +971568326116)"
    };
  }

  return {
    valid: false,
    normalized,
    hint: `Enter 9 digits starting with 5 (${localPart.length}/9 digits) — e.g. +971568326116`
  };
}

/**
 * Extracts a searchable digit fragment so searching "0568326116", "568326116", "971568326116",
 * or "+971568326116" matches stored "+971568326116" numbers seamlessly.
 */
export function getSearchablePhoneFragment(queryStr: string): string {
  const trimmed = toAsciiDigits(queryStr).trim();
  const normalized = normalizeUAEPhone(trimmed);
  if (UAE_PHONE_REGEX.test(normalized)) {
    return normalized;
  }
  const digitsOnly = trimmed.replace(/[\s\-()]/g, "");
  if (/^05\d*$/.test(digitsOnly)) {
    return digitsOnly.slice(1);
  }
  return trimmed;
}

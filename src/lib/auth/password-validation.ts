/**
 * Password validation and strength checking utility
 * GDPR & Security Compliance
 */

export interface PasswordValidation {
  isValid: boolean;
  strength: "weak" | "fair" | "good" | "strong";
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

const MIN_PASSWORD_LENGTH = 10;
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;

/**
 * Validate password against security requirements
 * Requirements:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  const requirements = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSpecialChar: SPECIAL_CHARS.test(password),
  };

  if (!requirements.minLength) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!requirements.hasUppercase) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }
  if (!requirements.hasLowercase) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }
  if (!requirements.hasNumber) {
    errors.push("Password must contain at least one number (0-9)");
  }
  if (!requirements.hasSpecialChar) {
    errors.push("Password must contain at least one special character (!@#$%^&* etc)");
  }

  // Calculate strength
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  if (metRequirements >= 5) strength = "strong";
  else if (metRequirements >= 4) strength = "good";
  else if (metRequirements >= 3) strength = "fair";
  else strength = "weak";

  const isValid = errors.length === 0;

  return {
    isValid,
    strength,
    errors,
    requirements,
  };
}

/**
 * Get color class for password strength indicator
 */
export function getStrengthColor(strength: string): string {
  switch (strength) {
    case "strong":
      return "bg-success-600 text-success-600";
    case "good":
      return "bg-info-600 text-info-600";
    case "fair":
      return "bg-warning-600 text-warning-600";
    case "weak":
      return "bg-danger-600 text-danger-600";
    default:
      return "bg-slate-300 text-slate-300";
  }
}

/**
 * Get strength label
 */
export function getStrengthLabel(strength: string): string {
  return strength.charAt(0).toUpperCase() + strength.slice(1);
}

/**
 * Password validation rules aligned with backend constraints:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character from: @#$%^&+=!?.
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: {
    level: 0 | 1 | 2 | 3 | 4;
    label: string;
    color: string;
  };
  criteria: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function validatePassword(password: string): PasswordValidation {
  const criteria = {
    minLength: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[@#$%^&+=!?.]/.test(password),
  };

  const errors: string[] = [];

  if (!criteria.minLength) {
    errors.push("Le mot de passe doit contenir au moins 12 caractères");
  }
  if (!criteria.hasUpperCase) {
    errors.push("Le mot de passe doit contenir au moins une majuscule (A-Z)");
  }
  if (!criteria.hasLowerCase) {
    errors.push("Le mot de passe doit contenir au moins une minuscule (a-z)");
  }
  if (!criteria.hasNumber) {
    errors.push("Le mot de passe doit contenir au moins un chiffre (0-9)");
  }
  if (!criteria.hasSpecialChar) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial (@#$%^&+=!?.)");
  }

  const isValid = Object.values(criteria).every((v) => v === true);

  const metCount = Object.values(criteria).filter(Boolean).length;

  let strength: PasswordValidation["strength"];

  if (password.length === 0) {
    strength = { level: 0, label: "", color: "" };
  } else if (metCount <= 2) {
    strength = { level: 1, label: "Très faible", color: "bg-red-500" };
  } else if (metCount === 3) {
    strength = { level: 2, label: "Faible", color: "bg-orange-500" };
  } else if (metCount === 4) {
    strength = { level: 3, label: "Moyen", color: "bg-yellow-500" };
  } else {
    strength = { level: 4, label: "Fort", color: "bg-green-500" };
  }

  return { isValid, errors, strength, criteria };
}

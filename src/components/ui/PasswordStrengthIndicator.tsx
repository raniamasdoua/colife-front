import { Check, X } from "lucide-react";
import { validatePassword } from "../../utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  /** When true: shows only the strength bar + label (compact, no criteria list) */
  compact?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  compact = false,
}: PasswordStrengthIndicatorProps) {
  const { strength, criteria } = validatePassword(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                strength.level >= level ? strength.color : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        {strength.label && (
          <span className="text-xs font-medium text-gray-500 shrink-0">{strength.label}</span>
        )}
      </div>

      {/* Criteria list (full mode only) */}
      {!compact && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <CriteriaItem met={criteria.minLength} label="12 caractères min." />
          <CriteriaItem met={criteria.hasUpperCase} label="Majuscule (A-Z)" />
          <CriteriaItem met={criteria.hasLowerCase} label="Minuscule (a-z)" />
          <CriteriaItem met={criteria.hasNumber} label="Chiffre (0-9)" />
          <CriteriaItem met={criteria.hasSpecialChar} label="Caractère spécial" />
        </div>
      )}
    </div>
  );
}

function CriteriaItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <Check className="w-3 h-3 text-green-500 shrink-0" />
      ) : (
        <X className="w-3 h-3 text-gray-300 shrink-0" />
      )}
      <span className={met ? "text-green-700" : "text-gray-400"}>{label}</span>
    </div>
  );
}

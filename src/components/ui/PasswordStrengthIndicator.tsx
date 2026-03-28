import { Check, X } from "lucide-react";
import { validatePassword } from "../../utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, criteria } = validatePassword(password);

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex gap-1 mb-1.5">
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
          <p className="text-xs text-gray-500">
            Force : <span className="font-medium text-gray-700">{strength.label}</span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <CriteriaItem met={criteria.minLength} label="Au moins 12 caractères" />
        <CriteriaItem met={criteria.hasUpperCase} label="Une majuscule (A-Z)" />
        <CriteriaItem met={criteria.hasLowerCase} label="Une minuscule (a-z)" />
        <CriteriaItem met={criteria.hasNumber} label="Un chiffre (0-9)" />
        <CriteriaItem met={criteria.hasSpecialChar} label="Un caractère spécial (@#$%^&+=!?.)" />
      </div>
    </div>
  );
}

function CriteriaItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      )}
      <span className={met ? "text-green-700" : "text-gray-500"}>{label}</span>
    </div>
  );
}

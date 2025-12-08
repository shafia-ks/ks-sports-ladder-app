"use client";

import { getStrengthColor, getStrengthLabel, PasswordValidation } from "@/lib/auth/password-validation";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PasswordStrengthProps {
  validation: PasswordValidation;
}

export function PasswordStrength({ validation }: PasswordStrengthProps) {
  const strengthColors = {
    weak: "from-danger-500 to-danger-600",
    fair: "from-warning-500 to-warning-600",
    good: "from-info-500 to-info-600",
    strong: "from-success-500 to-success-600",
  };

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-700">Password Strength</p>
          <span className={`text-xs font-semibold ${validation.isValid ? "text-success-600" : "text-slate-600"}`}>
            {getStrengthLabel(validation.strength)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 bg-gradient-to-r ${strengthColors[validation.strength]}`}
            style={{
              width: `${(Object.values(validation.requirements).filter(Boolean).length / 5) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">Requirements:</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            {validation.requirements.minLength ? (
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${validation.requirements.minLength ? "text-slate-700" : "text-slate-500"}`}>
              At least 10 characters
            </span>
          </li>
          <li className="flex items-center gap-2">
            {validation.requirements.hasUppercase ? (
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${validation.requirements.hasUppercase ? "text-slate-700" : "text-slate-500"}`}>
              One uppercase letter (A-Z)
            </span>
          </li>
          <li className="flex items-center gap-2">
            {validation.requirements.hasLowercase ? (
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${validation.requirements.hasLowercase ? "text-slate-700" : "text-slate-500"}`}>
              One lowercase letter (a-z)
            </span>
          </li>
          <li className="flex items-center gap-2">
            {validation.requirements.hasNumber ? (
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${validation.requirements.hasNumber ? "text-slate-700" : "text-slate-500"}`}>
              One number (0-9)
            </span>
          </li>
          <li className="flex items-center gap-2">
            {validation.requirements.hasSpecialChar ? (
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${validation.requirements.hasSpecialChar ? "text-slate-700" : "text-slate-500"}`}>
              One special character (!@#$%^& etc)
            </span>
          </li>
        </ul>
      </div>

      {/* Error Messages */}
      {validation.errors.length > 0 && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 space-y-1">
          {validation.errors.map((error, idx) => (
            <p key={idx} className="text-xs text-danger-700 flex items-start gap-2">
              <span className="mt-0.5">•</span>
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

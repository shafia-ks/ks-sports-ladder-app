import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type BadgeVariant = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", icon: Icon, children, className = "" }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

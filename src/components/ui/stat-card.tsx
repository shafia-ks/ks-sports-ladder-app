import Link, { type LinkProps } from "next/link";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

type StatCardVariant = "primary" | "info" | "warning" | "danger" | "neutral";

interface StatCardProps {
  label?: string; // New simple prop
  title?: string; // Legacy prop
  value: string | number;
  icon?: ReactNode; // Allow ReactNode for flexibility
  trend?: {
    value: number;
    isPositive: boolean;
  } | number | null; // Support simple number or null
  subtitle?: string;
  variant?: StatCardVariant;
  loading?: boolean;
  link?: LinkProps<string>["href"];
  alert?: boolean; // New prop to highlight urgent items
}

const variantStyles: Record<StatCardVariant, { iconBg: string; iconColor: string }> = {
  primary: { iconBg: "bg-brand-100", iconColor: "text-brand-700" },
  info: { iconBg: "bg-blue-100", iconColor: "text-blue-700" },
  warning: { iconBg: "bg-amber-100", iconColor: "text-amber-700" },
  danger: { iconBg: "bg-red-100", iconColor: "text-red-700" },
  neutral: { iconBg: "bg-slate-100", iconColor: "text-slate-700" },
};

export function StatCard({
  label,
  title,
  value,
  icon,
  trend,
  subtitle,
  variant = "neutral",
  loading = false,
  link,
  alert = false,
}: StatCardProps) {
  const { iconBg, iconColor } = variantStyles[variant];
  const displayTitle = label || title || "";

  // Handle trend as simple number (rank change)
  const trendDisplay = typeof trend === 'number' && trend !== 0 ? (
    <div className="mt-2 flex items-center gap-1 text-xs font-semibold">
      {trend > 0 ? (
        <>
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span className="text-green-600">+{trend} positions</span>
        </>
      ) : (
        <>
          <TrendingDown className="h-3 w-3 text-red-600" />
          <span className="text-red-600">{trend} positions</span>
        </>
      )}
    </div>
  ) : typeof trend === 'object' && trend ? (
    <div className="mt-2 flex items-center gap-1 text-xs font-semibold">
      <span className={trend.isPositive ? "text-success-600" : "text-danger-600"}>
        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
      </span>
      <span className="text-slate-500">from last period</span>
    </div>
  ) : null;

  const content = (
    <div className={`card p-4 ${alert ? "border-2 border-amber-400 bg-amber-50" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-slate-600">{displayTitle}</p>
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          {trendDisplay}
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${iconBg} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block transition hover:shadow-md">
        {content}
      </Link>
    );
  }

  return content;
}


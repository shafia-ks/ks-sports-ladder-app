import Link, { type LinkProps } from "next/link";
import { LucideIcon } from "lucide-react";

type StatCardVariant = "primary" | "info" | "warning" | "danger" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: StatCardVariant;
  loading?: boolean;
  link?: LinkProps<string>["href"];
}

const variantStyles: Record<StatCardVariant, { iconBg: string; iconColor: string }> = {
  primary: { iconBg: "bg-brand-100", iconColor: "text-brand-700" },
  info: { iconBg: "bg-blue-100", iconColor: "text-blue-700" },
  warning: { iconBg: "bg-amber-100", iconColor: "text-amber-700" },
  danger: { iconBg: "bg-red-100", iconColor: "text-red-700" },
  neutral: { iconBg: "bg-slate-100", iconColor: "text-slate-700" },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "neutral",
  loading = false,
  link,
}: StatCardProps) {
  const { iconBg, iconColor } = variantStyles[variant];

  const content = (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold">
          <span className={trend.isPositive ? "text-success-600" : "text-danger-600"}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-500">from last period</span>
        </div>
      )}
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

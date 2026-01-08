import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";

interface BreadcrumbItem {
    label: string;
    href?: Route | string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                    {item.href ? (
                        <Link
                            href={item.href as Route}
                            className="hover:text-brand-600 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-900 font-medium">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}

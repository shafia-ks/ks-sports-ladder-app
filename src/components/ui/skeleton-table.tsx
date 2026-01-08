import { cn } from "@/lib/utils/cn";

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
    return (
        <div className={cn("card overflow-hidden", className)}>
            {/* Header */}
            <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${100 / columns}%` }} />
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-3">
                        <div className="flex gap-4 items-center">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div
                                    key={colIndex}
                                    className="h-4 bg-slate-200 rounded animate-pulse"
                                    style={{
                                        width: `${100 / columns}%`,
                                        animationDelay: `${rowIndex * 50 + colIndex * 25}ms`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface SkeletonTableMobileProps {
    items?: number;
    className?: string;
}

export function SkeletonTableMobile({ items = 5, className }: SkeletonTableMobileProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-24"></div>
                                <div className="h-3 bg-slate-200 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="h-6 w-6 bg-slate-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <div className="h-3 bg-slate-200 rounded w-12"></div>
                            <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-3 bg-slate-200 rounded w-12"></div>
                            <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </div>
                        <div className="space-y-1">
                            <div className="h-3 bg-slate-200 rounded w-12"></div>
                            <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

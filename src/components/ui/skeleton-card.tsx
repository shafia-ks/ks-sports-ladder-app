import { cn } from "@/lib/utils/cn";

interface SkeletonCardProps {
    className?: string;
    rows?: number;
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
    return (
        <div className={cn("card p-6 animate-pulse", className)}>
            <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface SkeletonStatCardProps {
    className?: string;
}

export function SkeletonStatCard({ className }: SkeletonStatCardProps) {
    return (
        <div className={cn("card p-4 animate-pulse", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-5 w-5 bg-slate-200 rounded"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
        </div>
    );
}

interface SkeletonAvatarProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12"
    };

    return (
        <div className={cn("rounded-full bg-slate-200 animate-pulse", sizeClasses[size], className)} />
    );
}

interface SkeletonListProps {
    items?: number;
    className?: string;
}

export function SkeletonList({ items = 5, className }: SkeletonListProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 animate-pulse">
                    <SkeletonAvatar size="sm" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

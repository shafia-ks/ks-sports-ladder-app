import { User } from "lucide-react";
import Image from "next/image";

interface AvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({ name, email, src, size = "sm" }: AvatarProps) {
  const initials = (name || email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const dimension = sizeMap[size];

  if (src) {
    return (
      <div
        className={`${dimension} relative overflow-hidden rounded-full border border-slate-200 bg-slate-100`}
      >
        <Image
          src={src}
          alt={name || email || "User avatar"}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimension} flex items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-brand-50 to-slate-100 text-slate-700`}
      aria-label={name || email || "User avatar"}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

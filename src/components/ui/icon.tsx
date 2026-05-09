import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
} as const;

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
}: IconProps) {
  return (
    <IconComponent size={sizeMap[size]} className={cn("shrink-0", className)} />
  );
}

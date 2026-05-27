import { createElement, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
}

export function GlassCard({ children, className, as: Tag = "div" }: GlassCardProps) {
  return createElement(
    Tag,
    {
      className: cn(
        "relative rounded-[20px] overflow-hidden",
        "border border-white/[0.08]",
        "bg-white/[0.04] backdrop-blur-xl",
        "transition-colors duration-300",
        "hover:border-white/[0.14] hover:bg-white/[0.06]",
        className
      ),
    },
    children
  );
}

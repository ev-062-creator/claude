"use client";
import React from "react";
import { cn } from "@/lib/utils";

// Native tooltip stub — sem dependência Radix
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function TooltipTrigger({ children, asChild: _a }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}
const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

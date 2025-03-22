import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", color = "primary", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4 border-2",
      md: "w-8 h-8 border-3",
      lg: "w-12 h-12 border-4",
    };

    const colorClasses = {
      primary: "border-primary/30 border-t-primary",
      secondary: "border-secondary/30 border-t-secondary",
      white: "border-white/30 border-t-white",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner }; 
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass" | "glow";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 btn-shimmer": variant === "default",
            "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20": variant === "destructive",
            "border border-border bg-transparent hover:bg-input hover:text-foreground": variant === "outline",
            "bg-input text-foreground hover:bg-input/80": variant === "secondary",
            "hover:bg-input hover:text-foreground bg-transparent": variant === "ghost",
            "text-primary underline-offset-4 hover:underline bg-transparent": variant === "link",
            "glass text-foreground hover:bg-white/30 dark:hover:bg-black/30": variant === "glass",
            "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30 text-glow btn-shimmer": variant === "glow",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

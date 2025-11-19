import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GradientCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: "coral" | "blue" | "pink" | "hero";
}

export const GradientCard = ({ 
  gradient = "coral", 
  className, 
  children,
  ...props 
}: GradientCardProps) => {
  const gradientClasses = {
    coral: "bg-gradient-to-br from-[hsl(15,100%,75%)] to-[hsl(340,80%,70%)]",
    blue: "bg-gradient-to-br from-[hsl(200,80%,65%)] to-[hsl(260,70%,65%)]",
    pink: "bg-gradient-to-br from-[hsl(320,75%,75%)] to-[hsl(260,70%,70%)]",
    hero: "bg-gradient-to-br from-[hsl(15,100%,75%)] to-[hsl(200,80%,65%)]",
  };

  return (
    <div 
      className={cn(
        "rounded-2xl p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-medium)] hover:scale-[1.02]",
        gradientClasses[gradient],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

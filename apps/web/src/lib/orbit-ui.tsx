import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * OrbitCard: Premium glassmorphic card for Sophiie Orbit/Space.
 */
export const OrbitCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    title?: string; 
    description?: string;
    headerAction?: React.ReactNode;
  }
>(({ className, children, title, description, headerAction, ...props }, ref) => (
  <Card 
    ref={ref}
    className={cn("bg-zinc-950/50 border-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/[0.08]", className)} 
    {...props}
  >
    {(title || description || headerAction) && (
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && <CardTitle className="text-zinc-100 text-lg font-semibold tracking-tight">{title}</CardTitle>}
            {description && <CardDescription className="text-zinc-500 text-xs">{description}</CardDescription>}
          </div>
          {headerAction}
        </div>
      </CardHeader>
    )}
    <CardContent>{children}</CardContent>
  </Card>
));
OrbitCard.displayName = "OrbitCard";

/**
 * OrbitHeader: Consistent gradient header for portals.
 */
export const OrbitHeader = ({ 
  title, 
  subtitle, 
  actions 
}: { 
  title: string; 
  subtitle?: string; 
  actions?: React.ReactNode 
}) => (
  <div className="flex justify-between items-start mb-12">
    <div className="space-y-2">
      <h1 className="text-5xl font-bold tracking-tighter text-white">
        {title}
      </h1>
      {subtitle && <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-4">{actions}</div>}
  </div>
);

/**
 * OrbitButton: Secondary/Primary ghost styled button.
 */
export const OrbitButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 border-white/[0.05] hover:border-white/[0.1] backdrop-blur-sm transition-all duration-200",
        className
      )}
      {...props}
    />
  )
);
OrbitButton.displayName = "OrbitButton";

/**
 * OrbitLoader: Consistent spinning loader.
 */
export const OrbitLoader = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center p-4", className)}>
    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
  </div>
);

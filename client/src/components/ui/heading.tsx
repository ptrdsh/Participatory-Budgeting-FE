import React from "react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  className?: string;
  children: React.ReactNode;
}

export function Heading({ className, children }: HeadingProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  );
}

interface HeadingTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function HeadingTitle({ className, children }: HeadingTitleProps) {
  return (
    <h1 className={cn("text-2xl font-bold tracking-tight", className)}>
      {children}
    </h1>
  );
}

interface HeadingDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function HeadingDescription({ className, children }: HeadingDescriptionProps) {
  return (
    <p className={cn("text-muted-foreground", className)}>
      {children}
    </p>
  );
}
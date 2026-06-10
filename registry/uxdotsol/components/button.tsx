"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type UxSolButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success";

export type UxSolButtonSize = "sm" | "md" | "lg" | "icon";

export interface UxSolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UxSolButtonVariant;
  size?: UxSolButtonSize;
}

const baseClasses = [
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl",
  "font-semibold tracking-tight outline-none transition-[background-color,color,opacity,transform,border-color] duration-150",
  "cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:ring-2 focus-visible:ring-zinc-950/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "dark:focus-visible:ring-zinc-50/15 dark:focus-visible:ring-offset-[#111113]",
];

const variantClasses: Record<UxSolButtonVariant, string[]> = {
  primary: [
    "border border-zinc-900 bg-zinc-900 text-white shadow-sm hover:opacity-80 active:opacity-100",
    "dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900",
  ],
  secondary: [
    "border border-zinc-200 bg-zinc-100 text-zinc-700 shadow-sm hover:bg-zinc-200 hover:text-zinc-900",
    "dark:border-white/10 dark:bg-white/7 dark:text-zinc-300 dark:hover:bg-white/11 dark:hover:text-zinc-100",
  ],
  outline: [
    "border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
    "dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/7 dark:hover:text-zinc-100",
  ],
  ghost: [
    "border border-transparent bg-transparent text-zinc-700 shadow-none hover:bg-zinc-100 hover:text-zinc-900",
    "dark:text-zinc-300 dark:hover:bg-white/6 dark:hover:text-zinc-100",
  ],
  destructive: [
    "border border-red-200 bg-red-50 text-red-500 shadow-sm hover:bg-red-100",
    "dark:border-red-500/20 dark:bg-red-500/8 dark:text-red-400 dark:hover:bg-red-500/12",
    "focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/25",
  ],
  success: [
    "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100",
    "dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15",
  ],
};

const sizeClasses: Record<UxSolButtonSize, string> = {
  sm: "h-9 min-w-9 px-3 text-[12.5px]",
  md: "h-10 min-w-10 px-4 text-[13.5px]",
  lg: "h-11 min-w-11 px-5 text-sm",
  icon: "h-10 w-10 p-0",
};

export function UxSolButton({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  children,
  ...props
}: UxSolButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default UxSolButton;

"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold tracking-wide uppercase text-sm",
        "min-h-[44px]",
        "transition-all duration-200 active:scale-95 select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        fullWidth && "w-full",
        variant === "primary" &&
          !disabled &&
          "bg-gradient-to-b from-[#e0263a] to-[#8f0f1e] text-white shadow-[0_0_20px_rgba(224,38,58,0.5)] hover:shadow-[0_0_28px_rgba(224,38,58,0.75)] border border-red-400/30",
        variant === "primary" &&
          disabled &&
          "bg-neutral-800 text-neutral-500 border border-neutral-700",
        variant === "secondary" &&
          "bg-neutral-900 text-amber-300 border border-amber-400/40 hover:bg-neutral-800",
        variant === "danger" &&
          "bg-red-950 text-red-300 border border-red-500/50 hover:bg-red-900",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

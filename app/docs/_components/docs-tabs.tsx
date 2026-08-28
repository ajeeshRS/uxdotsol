"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

import { EASE_IN_OUT } from "@/lib/motion";

export type DocsTabOption<T extends string> = {
  value: T;
  label: string;
  panelId: string;
};

export function DocsTabs<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly DocsTabOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  const indicatorId = useId();
  const reduceMotion = useReducedMotion();

  const selectTab = (index: number, buttons: HTMLButtonElement[]) => {
    const option = options[index];
    if (!option) return;

    onValueChange(option.value);
    buttons[index]?.focus();
  };

  return (
    <div
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-1 dark:bg-black"
      role="tablist"
      aria-label={label}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <div key={option.value} className="relative shrink-0">
            {isSelected ? (
              <motion.span
                layoutId={`docs-tab-indicator-${indicatorId}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-neutral-900"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.25, ease: EASE_IN_OUT }
                }
              />
            ) : null}
            <button
              id={`${option.panelId}-tab`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={option.panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(event) => {
                const buttons = Array.from(
                  event.currentTarget
                    .closest('[role="tablist"]')
                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
                );

                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  selectTab((index + 1) % options.length, buttons);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  selectTab((index - 1 + options.length) % options.length, buttons);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  selectTab(0, buttons);
                } else if (event.key === "End") {
                  event.preventDefault();
                  selectTab(options.length - 1, buttons);
                }
              }}
              className={`relative z-10 min-h-11 touch-manipulation rounded-xl px-4 text-sm font-medium transition-[color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none ${
                isSelected
                  ? "text-neutral-950 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - Merges class names: clsx joins conditionals, twMerge resolves Tailwind conflicts.
 * @example cn("p-2", condition && "p-4") // -> "p-4" when condition is true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { clsx, type ClassValue } from "clsx";

/**
 * Join class names. No conflict resolution (keeps the client bundle small):
 * to override a base utility, pass it with the important modifier, e.g. "h-12!".
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

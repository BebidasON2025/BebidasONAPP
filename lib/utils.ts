import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number | string | null | undefined): string {
  const numValue = Number(value)
  if (isNaN(numValue) || value === null || value === undefined) {
    return "R$ 0,00"
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue)
}

export function toSafeNumber(value: unknown): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

export function formatBRL(n: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0)
  } catch {
    return `R$ ${(n || 0).toFixed(2)}`
  }
}

export const formatCurrency = formatBRL

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR")
}

import { Badge } from "@/components/ui/badge"

export function OrderStatusBadge({ status = "novo" as string }) {
  const map: Record<string, string> = {
    novo: "bg-slate-700 text-white",
    pendente: "bg-orange-500 text-black",
    pago: "bg-green-600 text-white",
    cancelado: "bg-red-600 text-white",
  }
  return <Badge className={map[status] || "bg-slate-700 text-white"}>{status}</Badge>
}

export function InvoiceStatusBadge({ status = "emitida" as string }) {
  const map: Record<string, string> = {
    emitida: "bg-blue-600 text-white",
    paga: "bg-green-600 text-white",
    cancelada: "bg-red-600 text-white",
  }
  return <Badge className={map[status] || "bg-slate-700 text-white"}>{status}</Badge>
}

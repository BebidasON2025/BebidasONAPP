"use client"

import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format"

export type ReceiptItem = {
  id: string
  description: string
  qty: number
  price: number
}

export type ReceiptData = {
  storeName: string
  phone: string | null
  address: string | null
  number: string
  dateTime: string
  clientName: string
  items: ReceiptItem[]
  total: number
  paid?: boolean
}

export default function ReceiptCard({ data, className }: { data: ReceiptData; className?: string }) {
  const sub = data.items.reduce((acc, it) => acc + it.qty * it.price, 0)

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-700 bg-[#0f172a] text-slate-100 shadow-lg",
        "p-3 sm:p-6 md:p-8 w-full max-w-[680px] mx-auto",
        className,
      )}
    >
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide text-amber-400">
          {data.storeName}
        </div>
        <div className="text-xs sm:text-sm text-slate-300">Comprovante de Venda</div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="text-xs sm:text-sm text-slate-400">Cliente (Devedor):</div>
        <div className="text-lg sm:text-xl font-semibold break-words">{data.clientName}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="space-y-1">
          <div className="text-slate-400">Telefone:</div>
          <div className="font-medium">{data.phone || "—"}</div>
          <div className="text-slate-400 mt-2 sm:mt-3">Endereço:</div>
          <div className="font-medium break-words">{data.address || "—"}</div>
        </div>
        <div className="space-y-1 sm:text-right">
          <div className="text-slate-400">Documento:</div>
          <div className="font-medium">—</div>
          <div className="text-slate-400 mt-2 sm:mt-3">Venda Nº:</div>
          <div className="font-mono">{data.number}</div>
          <div className="text-slate-400 mt-2 sm:mt-3">Data e Hora:</div>
          <div className="font-medium">{data.dateTime}</div>
        </div>
      </div>

      <hr className="my-4 sm:my-6 border-slate-700" />

      <div className="text-xs sm:text-sm font-semibold mb-2">Itens da Venda:</div>

      {data.items.length === 0 ? (
        <div className="text-xs sm:text-sm text-slate-400 italic">Nenhum item encontrado para este pedido.</div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {data.items.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
            >
              <div className="flex-1">
                <div className="font-medium text-sm sm:text-base break-words">{it.description}</div>
                <div className="text-xs text-slate-400">{`${it.qty} un. x ${formatBRL(it.price)}`}</div>
              </div>
              <div className="text-right font-semibold text-sm sm:text-base">{formatBRL(it.qty * it.price)}</div>
            </div>
          ))}
        </div>
      )}

      <hr className="my-4 sm:my-6 border-slate-700" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-0 sm:items-end">
        <div className="space-y-1">
          <div className="text-xs sm:text-sm text-slate-400">Subtotal dos Itens:</div>
          <div className="font-medium text-sm sm:text-base">{formatBRL(sub)}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs sm:text-sm text-slate-400">Valor Final:</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400">{formatBRL(data.total)}</div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex justify-center sm:justify-end">
        <span className="rounded-full bg-slate-700/60 text-slate-100 text-xs font-semibold px-3 py-1">
          {data.paid ? "PAGAMENTO À VISTA" : "PAGAMENTO A PRAZO"}
        </span>
      </div>
    </div>
  )
}

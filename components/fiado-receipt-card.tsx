"use client"

import { formatBRL } from "@/lib/format"

export type ReceiptData = {
  storeName: string
  phone: string | null
  document: string | null
  address: string | null
  number: string
  dateTime: string
  clientName: string
  items: { description: string; qty: number; price: number }[]
  total: number
  paid?: boolean
}

export default function FiadoReceiptCard({ data }: { data: ReceiptData }) {
  const dt = new Date(data.dateTime)
  const dateStr = `${dt.toLocaleDateString()} às ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.price, 0)

  return (
    <div
      className="rounded-xl p-3 sm:p-4 md:p-6 shadow-lg w-full max-w-full text-xs sm:text-sm"
      style={{ background: "#19222C", color: "#E6EDF5" }}
    >
      <div className="text-center mb-3 sm:mb-4">
        <div style={{ color: "#f5b301" }} className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide">
          {data.storeName}
        </div>
        <div className="opacity-80 -mt-1 text-xs sm:text-sm">Comprovante de Venda</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div>
          <div className="opacity-70">Telefone:</div>
          <div className="font-medium break-all">{data.phone || "—"}</div>
        </div>
        <div>
          <div className="opacity-70">Documento:</div>
          <div className="font-medium">{data.document || "—"}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="opacity-70">Endereço:</div>
          <div className="font-medium text-xs sm:text-sm break-words">{data.address || "—"}</div>
        </div>
        <div>
          <div className="opacity-70">Venda N°:</div>
          <div className="font-medium text-xs sm:text-sm">BEB{data.number}</div>
        </div>
        <div>
          <div className="opacity-70">Data e Hora:</div>
          <div className="font-medium text-xs sm:text-sm break-words">{dateStr}</div>
        </div>
      </div>

      <div className="my-3 sm:my-4 border-t border-white/10" />

      <div className="mb-2">
        <div className="opacity-70 text-xs sm:text-sm">Cliente (Devedor):</div>
        <div className="text-base sm:text-lg font-semibold break-words">{data.clientName}</div>
      </div>

      <div className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">Itens da Venda:</div>
      <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
        {data.items.length === 0 ? (
          <div className="px-2 sm:px-3 py-2 sm:py-3 opacity-80 text-xs sm:text-sm">Nenhum item.</div>
        ) : (
          data.items.map((it, idx) => (
            <div
              key={idx}
              className="px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between bg-white/5 odd:bg-white/0"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-medium text-xs sm:text-sm break-words">{it.description}</div>
                <div className="text-xs opacity-70">
                  {it.qty} un. x {formatBRL(it.price)}
                </div>
              </div>
              <div className="font-semibold text-xs sm:text-sm whitespace-nowrap">{formatBRL(it.qty * it.price)}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3 sm:items-end">
        <div>
          <div className="opacity-70 text-xs sm:text-sm">Subtotal dos Itens:</div>
          <div className="font-semibold text-sm sm:text-base">{formatBRL(subtotal)}</div>
        </div>
        <div className="text-left sm:text-right">
          <div className="opacity-70 text-xs sm:text-sm">Valor Final:</div>
          <div style={{ color: "#f5b301" }} className="text-xl sm:text-2xl font-extrabold">
            {formatBRL(data.total)}
          </div>
          <div className="mt-1 sm:mt-2">
            <span
              className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#6b7280", color: "#e5e7eb" }}
            >
              {data.paid ? "PAGO" : "PAGAMENTO A PRAZO"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

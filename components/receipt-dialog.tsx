"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { toPng } from "html-to-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import ReceiptCard, { type ReceiptItem, type ReceiptData } from "./receipt-card"

type BaseData = {
  id: string
  clientName: string
  date: string
  total: number
  paid?: boolean
  phone?: string | null
  address?: string | null
}

const itemsCache = new Map<string, ReceiptItem[]>()

export default function ReceiptDialog({
  open,
  onOpenChange,
  base,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  base: BaseData | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async (id: string) => {
    if (itemsCache.has(id)) {
      setItems(itemsCache.get(id)!)
      return
    }

    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`/api/pedidos/${id}/items`, {
        cache: "no-store",
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const json = await res.json()
      if (json?.ok) {
        const itemsData = json.data as ReceiptItem[]
        itemsCache.set(id, itemsData)
        setItems(itemsData)
      } else {
        setItems([])
      }
    } catch (error) {
      console.warn("Failed to load items:", error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !base?.id) {
      setItems([])
      return
    }
    loadItems(base.id)
  }, [open, base?.id, loadItems])

  const data: ReceiptData | null = useMemo(() => {
    if (!base) return null
    return {
      storeName: "BEBIDAS ON",
      phone: base.phone || null,
      address: base.address || null,
      number: base.id.slice(0, 6).toUpperCase(),
      dateTime: base.date,
      clientName: base.clientName,
      items,
      total: base.total,
      paid: base.paid,
    }
  }, [base, items])

  async function saveImage() {
    if (!ref.current) return
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        backgroundColor: "#0f172a",
        pixelRatio: 2,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `comprovante-${base?.id || "pedido"}.png`
      a.click()
    } catch (error) {
      console.error("Failed to save image:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[min(95vw,820px)]
          sm:max-w-[820px]
          max-h-[90vh]
          overflow-y-auto
          bg-[#0b1220]
          p-2 sm:p-4 md:p-6
        "
      >
        <DialogHeader className="pb-2 sm:pb-3">
          <DialogTitle className="text-base sm:text-lg md:text-xl">Comprovante</DialogTitle>
        </DialogHeader>

        {data ? (
          <div className="space-y-2 sm:space-y-3">
            <div className="max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
              <div ref={ref as any} className="mx-auto overflow-hidden">
                <ReceiptCard data={data} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-slate-400 pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                {loading ? "Carregando itens..." : `${items.length} itens`}
              </div>
              <Button
                onClick={saveImage}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs sm:text-sm px-3 py-2 w-full sm:w-auto"
                disabled={loading}
              >
                Salvar imagem
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

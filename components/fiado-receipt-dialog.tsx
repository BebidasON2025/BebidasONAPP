"use client"

import { useRef } from "react"
import { toPng } from "html-to-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import FiadoReceiptCard, { type ReceiptData } from "./fiado-receipt-card"

export type FiadoReceiptView = {
  id: string
  clientName: string
  phone?: string | null
  email?: string | null
  clientAddress?: string | null
  items: { description: string; qty: number; price: number }[]
  total: number
  dueDate?: string | null
  method: string
  date: string
  paid?: boolean
}

export default function FiadoReceiptDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  receipt: FiadoReceiptView | null
}) {
  const ref = useRef<HTMLDivElement>(null)

  async function saveImage() {
    if (!ref.current) return
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        backgroundColor: "#0f1720",
        pixelRatio: 2,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `comprovante-fiado-${receipt?.id || "comprovante"}.png`
      a.click()
    } catch (e) {
      console.error(e)
    }
  }

  const cardData: ReceiptData | null = receipt
    ? {
        storeName: "BEBIDAS ON",
        phone: receipt.phone || null,
        document: null,
        address: receipt.clientAddress || null,
        number: receipt.id.slice(0, 6).toUpperCase(),
        dateTime: receipt.date,
        clientName: receipt.clientName,
        items: receipt.items || [],
        total: receipt.total,
        paid: receipt.paid,
      }
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto p-3 sm:p-6 sm:max-w-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg sm:text-xl">Comprovante de Fiado</DialogTitle>
        </DialogHeader>

        {cardData ? (
          <div className="space-y-3">
            <div ref={ref as any} className="overflow-hidden">
              <FiadoReceiptCard data={cardData} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
              <Button onClick={saveImage} className="bg-amber-500 hover:bg-amber-600 text-black text-sm px-4 py-2">
                Salvar imagem
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm opacity-70">Selecione um comprovante</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

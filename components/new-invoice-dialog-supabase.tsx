"use client"

import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"

export default function NewInvoiceDialogSupabase({ children, onSaved }: { children: ReactNode; onSaved?: () => void }) {
  const store = useAppStore()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({ number: "", clientId: "", total: 0, status: "emitida", notes: "" })

  async function submit() {
    if (!form.number || !form.clientId) return
    try {
      setSaving(true)
      setErr(null)
      const res = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: form.number,
          clientId: form.clientId,
          total: Number(form.total || 0),
          status: form.status,
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
      setOpen(false)
      setForm({ number: "", clientId: "", total: 0, status: "emitida", notes: "" })
      onSaved?.()
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl hc-panel">
        <DialogHeader>
          <DialogTitle>Nova Nota Fiscal</DialogTitle>
          <DialogDescription>Cria a nota diretamente no Supabase.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {err ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1 md:col-span-1">
              <Label>Número</Label>
              <Input
                className="hc-field"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {store.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Total</Label>
              <Input
                className="hc-field"
                type="number"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="hc-field">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Observações</Label>
              <Textarea
                className="hc-field"
                rows={1}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

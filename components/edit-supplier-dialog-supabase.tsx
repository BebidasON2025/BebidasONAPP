"use client"

import { type ReactNode, useEffect, useState } from "react"
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
import type { Supplier } from "@/lib/store"

export default function EditSupplierDialogSupabase({
  children,
  supplier,
  onSaved,
}: {
  children: ReactNode
  supplier: Supplier
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: supplier.name,
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    cnpj: supplier.cnpj ?? "",
  })

  useEffect(() => {
    if (open) {
      setForm({
        name: supplier.name,
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        cnpj: supplier.cnpj ?? "",
      })
      setErr(null)
    }
  }, [open, supplier])

  async function submit() {
    try {
      setSaving(true)
      setErr(null)
      const res = await fetch("/api/fornecedores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: supplier.id,
          patch: { name: form.name, email: form.email || null, phone: form.phone || null, cnpj: form.cnpj || null },
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setOpen(false)
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
          <DialogTitle>Editar Fornecedor</DialogTitle>
          <DialogDescription>Atualiza direto no banco de dados.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {err ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Nome</Label>
              <Input
                className="hc-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>CNPJ</Label>
              <Input
                className="hc-field"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Email</Label>
              <Input
                className="hc-field"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <Input
                className="hc-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
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

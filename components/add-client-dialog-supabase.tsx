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
import { Textarea } from "@/components/ui/textarea"

export default function AddClientDialogSupabase({ children, onSaved }: { children: ReactNode; onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    nome: "", 
    email: "", 
    telefone: "",
    endereco: "",
    documento: "",
    observacoes: ""
  })

  function reset() {
    setForm({ nome: "", email: "", telefone: "", endereco: "", documento: "", observacoes: "" })
    setErr(null)
  }

  async function submit() {
    if (!form.nome) return
    try {
      setSaving(true)
      setErr(null)
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nome: form.nome, 
          email: form.email || null, 
          telefone: form.telefone || null,
          endereco: form.endereco || null,
          documento: form.documento || null,
          observacoes: form.observacoes || null
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setOpen(false)
      reset()
      onSaved?.()
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (setOpen(v), v || reset())}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl hc-panel">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>Cadastre um novo cliente no sistema.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {err ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}
          
          {/* <CHANGE> Added more fields to match database schema */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Nome *</Label>
              <Input
                className="hc-field"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid gap-1">
              <Label>Documento (CPF/CNPJ)</Label>
              <Input
                className="hc-field"
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                placeholder="000.000.000-00"
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
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <Input
                className="hc-field"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Endereço</Label>
            <Input
              className="hc-field"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid gap-1">
            <Label>Observações</Label>
            <Textarea
              className="hc-field"
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o cliente"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Client = {
  id?: string
  nome?: string
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  documento?: string | null
  observacoes?: string | null
}

type Props = {
  customer?: Client
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
}

export default function EditClientDialogSupabase({ customer, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState<Client>({
    id: "",
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    documento: "",
    observacoes: "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (customer) {
      setForm({
        id: customer.id || "",
        nome: customer.nome || "",
        email: customer.email || "",
        telefone: customer.telefone || "",
        endereco: customer.endereco || "",
        documento: customer.documento || "",
        observacoes: customer.observacoes || "",
      })
    }
  }, [customer])

  async function save() {
    try {
      setSaving(true)
      setErr(null)

      const method = form.id ? "PATCH" : "POST"
      const body = form.id
        ? JSON.stringify({ 
            id: form.id, 
            patch: { 
              nome: form.nome, 
              email: form.email, 
              telefone: form.telefone,
              endereco: form.endereco,
              documento: form.documento,
              observacoes: form.observacoes
            } 
          })
        : JSON.stringify({ 
            nome: form.nome, 
            email: form.email, 
            telefone: form.telefone,
            endereco: form.endereco,
            documento: form.documento,
            observacoes: form.observacoes
          })

      const res = await fetch("/api/clientes", {
        method,
        headers: { "content-type": "application/json" },
        body,
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao salvar")

      onSaved?.()
      onOpenChange?.(false)
    } catch (e: any) {
      setErr(String(e.message || e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{customer?.id ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>
        )}

        <div className="grid gap-4 py-4">
          {/* <CHANGE> Added more fields to match database schema */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={form.nome || ""}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Documento</Label>
              <Input
                placeholder="CPF/CNPJ"
                value={form.documento || ""}
                onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Email</Label>
              <Input
                placeholder="email@exemplo.com"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Telefone</Label>
              <Input
                placeholder="(11) 99999-9999"
                value={form.telefone || ""}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Endereço</Label>
            <Input
              placeholder="Rua, número, bairro, cidade"
              value={form.endereco || ""}
              onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Observações</Label>
            <Textarea
              placeholder="Informações adicionais"
              rows={3}
              value={form.observacoes || ""}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={saving}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={saving || !form.nome?.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {saving ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

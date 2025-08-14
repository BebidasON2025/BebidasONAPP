"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SearchInput from "@/components/search-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { formatBRL, formatDateTime } from "@/lib/format"
import AddFinanceEntryDialogSupabase from "@/components/add-finance-entry-dialog-supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical, TrendingUp, TrendingDown, DollarSign, RefreshCw, Plus } from "lucide-react"
import { mapLancamentoRowToStore } from "@/lib/map-db"
import ConfirmationDialog from "@/components/confirmation-dialog"

function parseSafe(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function FinanceiroPage() {
  const { finance, setFinanceEntries } = useAppStore()
  const [q, setQ] = useState("")
  const [t, setT] = useState<"todos" | "entrada" | "saida">("todos")
  const [m, setM] = useState<string>("todos")
  const [err, setErr] = useState<string | null>(null)
  const [serverDetails, setServerDetails] = useState<any>(null)
  const [busyDelete, setBusyDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; entryId: string }>({ open: false, entryId: "" })

  async function loadFromDB() {
    try {
      setLoading(true)
      setErr(null)
      setServerDetails(null)
      const res = await fetch("/api/financeiro", { cache: "no-store" })
      const text = await res.text()
      const j = parseSafe(text)
      if (!res.ok || !j?.ok) {
        if (j) setServerDetails(j)
        throw new Error(j?.error || `HTTP ${res.status} ${res.statusText}`)
      }
      setFinanceEntries((j.data as any[]).map(mapLancamentoRowToStore))
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFromDB()
  }, [])

  const all = finance.entries
  const entradas = all.filter((e) => e.type === "entrada").reduce((s, e) => s + e.amount, 0)
  const saidas = all.filter((e) => e.type === "saida").reduce((s, e) => s + e.amount, 0)
  const saldo = entradas - saidas

  const analytics = useMemo(() => {
    const totalTransactions = all.length
    const avgTransaction = totalTransactions > 0 ? (entradas + saidas) / totalTransactions : 0

    return {
      totalTransactions,
      avgTransaction,
      entradas,
      saidas,
      saldo,
    }
  }, [all, entradas, saidas, saldo])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return all
      .filter((e) => (t === "todos" ? true : e.type === t))
      .filter((e) => (m === "todos" ? true : (e.method || "").toLowerCase() === m.toLowerCase()))
      .filter(
        (e) =>
          (e.description || "").toLowerCase().includes(query) ||
          (e.category || "").toLowerCase().includes(query) ||
          (e.method || "").toLowerCase().includes(query),
      )
  }, [all, q, t, m])

  async function remove(id: string) {
    try {
      setBusyDelete(id)
      const res = await fetch("/api/financeiro", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
      await loadFromDB()
      setConfirmDelete({ open: false, entryId: "" })
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setBusyDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setConfirmDelete({ open: true, entryId: id })
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader
        title="Gestão Financeira"
        description="Controle completo das suas finanças com análises detalhadas"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={loadFromDB}
              disabled={loading}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <AddFinanceEntryDialogSupabase onSaved={loadFromDB}>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lançamento
              </Button>
            </AddFinanceEntryDialogSupabase>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Total de Entradas</p>
                <p className="text-2xl font-bold text-white">{formatBRL(analytics.entradas)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">Total de Saídas</p>
                <p className="text-2xl font-bold text-white">{formatBRL(analytics.saidas)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${analytics.saldo >= 0 ? "from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40" : "from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40"} transition-all duration-300`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Saldo Total</p>
                <p className={`text-2xl font-bold ${analytics.saldo >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                  {formatBRL(analytics.saldo)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${analytics.saldo >= 0 ? "text-blue-400" : "text-orange-400"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Transações</p>
                <p className="text-2xl font-bold text-white">{analytics.totalTransactions}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Histórico de Lançamentos
            <span className="ml-auto text-sm font-normal text-slate-400">{filtered.length} lançamentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar lançamentos..."
              className="bg-slate-800/50 border-slate-700 focus:border-green-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={t} onValueChange={(v: any) => setT(v)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-green-500">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
              <Select value={m} onValueChange={(v) => setM(v)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-green-500">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {err ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
                {err}
              </div>
            </div>
          ) : null}

          {serverDetails ? (
            <details>
              <summary className="text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                Detalhes do servidor
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900/50 p-3 text-xs border border-slate-800">
                {JSON.stringify(serverDetails || {}, null, 2)}
              </pre>
            </details>
          ) : null}

          <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/30">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300 font-medium">Tipo</TableHead>
                  <TableHead className="text-slate-300 font-medium">Descrição</TableHead>
                  <TableHead className="text-slate-300 font-medium">Categoria</TableHead>
                  <TableHead className="text-slate-300 font-medium">Método</TableHead>
                  <TableHead className="text-right text-slate-300 font-medium">Valor</TableHead>
                  <TableHead className="text-slate-300 font-medium">Data</TableHead>
                  <TableHead className="w-10 text-slate-300 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin text-green-400" />
                        <span>Carregando lançamentos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      Nenhum lançamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e, index) => (
                    <TableRow
                      key={e.id}
                      className="border-slate-800 hover:bg-slate-800/20 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <Badge
                          variant={e.type === "entrada" ? "default" : "destructive"}
                          className={`capitalize ${e.type === "entrada" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}
                        >
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium">{e.description}</TableCell>
                      <TableCell className="text-slate-300">{e.category}</TableCell>
                      <TableCell className="text-slate-300">{e.method}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${e.type === "entrada" ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatBRL(e.amount)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{formatDateTime(e.date)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-slate-700/50 transition-colors duration-200"
                            >
                              <EllipsisVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteClick(e.id)}
                              disabled={busyDelete === e.id}
                            >
                              {busyDelete === e.id ? "Excluindo..." : "Excluir"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, entryId: "" })}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir este lançamento definitivamente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => remove(confirmDelete.entryId)}
        loading={busyDelete === confirmDelete.entryId}
      />
    </div>
  )
}

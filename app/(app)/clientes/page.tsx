"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SearchInput from "@/components/search-input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { formatBRL } from "@/lib/format"
import { downloadCSV, downloadJSON } from "@/lib/download"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Users, TrendingUp, UserPlus, Download, RefreshCw } from "lucide-react"
import AddClientDialogSupabase from "@/components/add-client-dialog-supabase"
import EditClientDialogSupabase from "@/components/edit-client-dialog-supabase"
import { mapClienteRowToStore } from "@/lib/map-db"
import ConfirmationDialog from "@/components/confirmation-dialog"

export default function ClientesPage() {
  const store = useAppStore()
  const { customers, setCustomers } = store
  const [q, setQ] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [serverDetails, setServerDetails] = useState<any>(null)
  const [busyDelete, setBusyDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState<boolean>(() => (useAppStore as any).persist?.hasHydrated?.() ?? true)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; clientId: string }>({ open: false, clientId: "" })
  const [editingClient, setEditingClient] = useState<any>(null)

  useEffect(() => {
    const api = (useAppStore as any).persist
    if (api?.onFinishHydration) {
      const unsub = api.onFinishHydration(() => setHydrated(true))
      return () => unsub?.()
    }
  }, [])

  function parseSafe(text: string) {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async function loadFromDB() {
    try {
      setLoading(true)
      setErr(null)
      setServerDetails(null)
      const res = await fetch("/api/clientes", { cache: "no-store" })
      const contentType = res.headers.get("content-type") || ""
      const text = await res.text()
      if (!res.ok) {
        const j = contentType.includes("application/json") ? parseSafe(text) : null
        if (j) setServerDetails(j)
        throw new Error(`${res.status} ${res.statusText}${j?.error ? ` - ${j.error}` : ""}`)
      }
      const json = parseSafe(text)
      if (!json?.ok) {
        setServerDetails(json)
        throw new Error(json?.error || "Falha ao consultar clientes.")
      }
      setCustomers((json.data as any[]).map(mapClienteRowToStore))
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hydrated) return
    loadFromDB()
  }, [hydrated])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return customers.filter(
      (c) =>
        (c.name?.toLowerCase() ?? "").includes(query) ||
        (c.email?.toLowerCase() ?? "").includes(query) ||
        (c.phone ?? "").includes(query),
    )
  }, [customers, q])

  const analytics = useMemo(() => {
    const totalClients = customers.length
    const totalRevenue = customers.reduce((sum, client) => sum + (client.totalSpent || 0), 0)
    const activeClients = customers.filter((c) => (c.totalSpent || 0) > 0).length
    const avgSpending = totalClients > 0 ? totalRevenue / totalClients : 0

    return {
      totalClients,
      totalRevenue,
      activeClients,
      avgSpending,
    }
  }, [customers])

  function exportarJSON() {
    downloadJSON(filtered, "clientes.json")
  }
  function exportarCSV() {
    const rows = filtered.map((c) => ({
      id: c.id,
      nome: c.name,
      email: c.email ?? "",
      telefone: c.phone ?? "",
      total_gasto: c.totalSpent ?? 0,
    }))
    downloadCSV(rows, "clientes.csv")
  }

  async function deleteCliente(id: string) {
    try {
      setBusyDelete(id)
      const res = await fetch("/api/clientes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const text = await res.text()
      const json = parseSafe(text)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status} - ${text}`)
      await loadFromDB()
      setConfirmDelete({ open: false, clientId: "" })
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setBusyDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setConfirmDelete({ open: true, clientId: id })
  }

  const handleEditClick = (client: any) => {
    setEditingClient(client)
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader
        title="Gestão de Clientes"
        description="Gerencie sua base de clientes com análises detalhadas"
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={loadFromDB}
              disabled={loading}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              variant="secondary"
              onClick={exportarJSON}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="secondary"
              onClick={exportarCSV}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <AddClientDialogSupabase onSaved={loadFromDB}>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Cliente</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </AddClientDialogSupabase>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{analytics.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Receita Total</p>
                <p className="text-2xl font-bold text-white">{formatBRL(analytics.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Clientes Ativos</p>
                <p className="text-2xl font-bold text-white">{analytics.activeClients}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">Gasto Médio</p>
                <p className="text-2xl font-bold text-white">{formatBRL(analytics.avgSpending)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Lista de Clientes
            <span className="ml-auto text-sm font-normal text-slate-400">{filtered.length} clientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar clientes por nome, email ou telefone..."
              className="bg-slate-800/50 border-slate-700 focus:border-blue-500"
            />
          </div>

          {err ? (
            <div className="mb-4 space-y-2">
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-400"></div>
                  {`Erro ao carregar do banco: ${err}`}
                </div>
              </div>
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
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/30">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/30">
                  <TableHead className="text-slate-300 font-medium">Nome</TableHead>
                  <TableHead className="text-slate-300 font-medium">Email</TableHead>
                  <TableHead className="text-slate-300 font-medium">Telefone</TableHead>
                  <TableHead className="text-right text-slate-300 font-medium">Total Gasto</TableHead>
                  <TableHead className="w-10 text-slate-300 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
                        <span>Carregando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      Nenhum cliente cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c, index) => (
                    <TableRow
                      key={c.id}
                      className="border-slate-800 hover:bg-slate-800/20 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-white">{c.name}</TableCell>
                      <TableCell className="text-slate-300">{c.email ?? "—"}</TableCell>
                      <TableCell className="text-slate-300">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-green-400">
                        {formatBRL(c.totalSpent ?? 0)}
                      </TableCell>
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
                          <DropdownMenuContent align="end" className="w-44 bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(c)}
                              className="text-blue-400 hover:bg-blue-500/10"
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteClick(c.id)}
                              disabled={busyDelete === c.id}
                            >
                              {busyDelete === c.id ? "Excluindo..." : "Excluir"}
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
        onOpenChange={(open) => setConfirmDelete({ open, clientId: "" })}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente definitivamente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => deleteCliente(confirmDelete.clientId)}
        loading={busyDelete === confirmDelete.clientId}
      />

      <EditClientDialogSupabase
        customer={editingClient}
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        onSaved={loadFromDB}
      />
    </div>
  )
}

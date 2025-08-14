"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/page-header"
import SearchInput from "@/components/search-input"
import { useEffect, useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { downloadJSON, downloadCSV } from "@/lib/download"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical, Building2, Users, Download, RefreshCw, UserPlus, TrendingUp } from "lucide-react"
import AddSupplierDialogSupabase from "@/components/add-supplier-dialog-supabase"
import EditSupplierDialogSupabase from "@/components/edit-supplier-dialog-supabase"
import { mapFornecedorRowToStore } from "@/lib/map-db"

function parseSafe(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function FornecedoresPage() {
  const { suppliers, setSuppliers } = useAppStore()
  const [q, setQ] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [serverDetails, setServerDetails] = useState<any>(null)
  const [busyDelete, setBusyDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadFromDB() {
    try {
      setLoading(true)
      setErr(null)
      setServerDetails(null)
      const res = await fetch("/api/fornecedores", { cache: "no-store" })
      const text = await res.text()
      const j = parseSafe(text)
      if (!res.ok || !j?.ok) {
        if (j) setServerDetails(j)
        throw new Error(j?.error || `HTTP ${res.status} ${res.statusText}`)
      }
      setSuppliers((j.data as any[]).map(mapFornecedorRowToStore))
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFromDB()
  }, [])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.email?.toLowerCase() ?? "").includes(query) ||
        (s.phone ?? "").includes(query) ||
        (s.cnpj ?? "").includes(query),
    )
  }, [suppliers, q])

  const analytics = useMemo(() => {
    const totalSuppliers = suppliers.length
    const suppliersWithEmail = suppliers.filter((s) => s.email).length
    const suppliersWithPhone = suppliers.filter((s) => s.phone).length
    const suppliersWithCNPJ = suppliers.filter((s) => s.cnpj).length

    return {
      totalSuppliers,
      suppliersWithEmail,
      suppliersWithPhone,
      suppliersWithCNPJ,
    }
  }, [suppliers])

  function exportarJSON() {
    downloadJSON(filtered, "fornecedores.json")
  }
  function exportarCSV() {
    const rows = filtered.map((s) => ({
      id: s.id,
      nome: s.name,
      email: s.email ?? "",
      telefone: s.phone ?? "",
      cnpj: s.cnpj ?? "",
    }))
    downloadCSV(rows, "fornecedores.csv")
  }

  async function deleteFornecedor(id: string) {
    try {
      if (!window.confirm("Excluir fornecedor definitivamente no Supabase?")) return
      setBusyDelete(id)
      const res = await fetch("/api/fornecedores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
      await loadFromDB()
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setBusyDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHeader
        title="Gestão de Fornecedores"
        description="Gerencie sua rede de fornecedores com controle completo"
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
            <AddSupplierDialogSupabase onSaved={loadFromDB}>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Fornecedor</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </AddSupplierDialogSupabase>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-400">Total Fornecedores</p>
                <p className="text-2xl font-bold text-white">{analytics.totalSuppliers}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Com Email</p>
                <p className="text-2xl font-bold text-white">{analytics.suppliersWithEmail}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Com Telefone</p>
                <p className="text-2xl font-bold text-white">{analytics.suppliersWithPhone}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Com CNPJ</p>
                <p className="text-2xl font-bold text-white">{analytics.suppliersWithCNPJ}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-400" />
            Lista de Fornecedores
            <span className="ml-auto text-sm font-normal text-slate-400">{filtered.length} fornecedores</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar por nome, email, telefone ou CNPJ..."
              className="bg-slate-800/50 border-slate-700 focus:border-orange-500"
            />
          </div>

          {err ? (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
                {err}
              </div>
            </div>
          ) : null}

          {serverDetails ? (
            <details className="mb-4">
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
                  <TableHead className="text-slate-300 font-medium">Nome</TableHead>
                  <TableHead className="text-slate-300 font-medium">Email</TableHead>
                  <TableHead className="text-slate-300 font-medium">Telefone</TableHead>
                  <TableHead className="text-slate-300 font-medium">CNPJ</TableHead>
                  <TableHead className="w-10 text-slate-300 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin text-orange-400" />
                        <span>Carregando fornecedores...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      Nenhum fornecedor cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s, index) => (
                    <TableRow
                      key={s.id}
                      className="border-slate-800 hover:bg-slate-800/20 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-white">{s.name}</TableCell>
                      <TableCell className="text-slate-300">{s.email ?? "—"}</TableCell>
                      <TableCell className="text-slate-300">{s.phone ?? "—"}</TableCell>
                      <TableCell className="text-slate-300">{s.cnpj ?? "—"}</TableCell>
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
                            <EditSupplierDialogSupabase supplier={s} onSaved={loadFromDB}>
                              <DropdownMenuItem asChild>
                                <button className="w-full text-left text-orange-400 hover:bg-orange-500/10">
                                  Editar
                                </button>
                              </DropdownMenuItem>
                            </EditSupplierDialogSupabase>
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteFornecedor(s.id)}
                              disabled={busyDelete === s.id}
                            >
                              {busyDelete === s.id ? "Excluindo..." : "Excluir"}
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
    </div>
  )
}

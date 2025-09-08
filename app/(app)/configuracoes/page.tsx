"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CashRegisterSystem } from "@/components/cash-register-system"
import { Settings, Database, Wrench } from "lucide-react"

type Diag = {
  ok: boolean
  db?: string
  meta?: { version?: string; now?: string }
  existsProdutos?: boolean
  produtosCount?: number | null
  tables?: string[]
  error?: string
  stage?: string
  hints?: string[]
}
type ResetRes = {
  ok: boolean
  steps?: Array<{ step: string; ok: boolean; error?: string }>
  produtosCount?: number | null
  db?: string
  error?: string
}

export default function ConfiguracoesPage() {
  const [diag, setDiag] = useState<Diag | null>(null)
  const [reset, setReset] = useState<ResetRes | null>(null)
  const [loading, setLoading] = useState<"diag" | "reset" | null>(null)

  async function runDiag() {
    setLoading("diag")
    setReset(null)
    try {
      const res = await fetch("/api/db-diagnostico", { cache: "no-store" })
      const data = (await res.json()) as Diag
      setDiag(data)
    } catch (e: any) {
      setDiag({ ok: false, error: String(e) })
    } finally {
      setLoading(null)
    }
  }

  async function runReset() {
    setLoading("reset")
    setDiag(null)
    try {
      const res = await fetch("/api/db-reset", { cache: "no-store" })
      const data = (await res.json()) as ResetRes
      setReset(data)
    } catch (e: any) {
      setReset({ ok: false, error: String(e) })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
          <Settings className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Configurações</h1>
          <p className="text-slate-400">Gerencie o sistema de caixa e configurações do banco de dados.</p>
        </div>
      </div>

      <CashRegisterSystem />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Diagnóstico do Banco
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={runDiag}
              disabled={loading === "diag"}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading === "diag" ? "Verificando..." : "Diagnosticar Banco"}
            </Button>
            {diag ? (
              <pre className="max-h-80 overflow-auto rounded-md bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-300">
                {JSON.stringify(diag, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">Nenhum diagnóstico executado ainda.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-400" />
              Reinstalar Banco PT‑BR
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={runReset}
              disabled={loading === "reset"}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading === "reset" ? "Reinstalando..." : "Reinstalar Banco PT‑BR"}
            </Button>
            {reset ? (
              <pre className="max-h-80 overflow-auto rounded-md bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-300">
                {JSON.stringify(reset, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-slate-400 text-center py-4">
                Executa reset do schema público e instala tabelas em português.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white">Dicas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-400">1</span>
              </div>
              <p>Garanta que POSTGRES_URL (ou similares) esteja definido com a Connection String do Postgres.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-400">2</span>
              </div>
              <p>Rode "Diagnosticar Banco" para validar conexão e existência das tabelas.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-400">3</span>
              </div>
              <p>Se faltar tabelas, clique em "Reinstalar Banco PT‑BR".</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-amber-400">4</span>
              </div>
              <p>Abra o caixa manualmente todos os dias para começar a registrar vendas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

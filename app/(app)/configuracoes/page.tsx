"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <p className="text-muted-foreground">
        Ferramentas para diagnosticar a conexão e reinstalar o banco em Português (PT‑BR).
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hc-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Diagnóstico do Banco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={runDiag}
              disabled={loading === "diag"}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {loading === "diag" ? "Verificando..." : "Diagnosticar Banco"}
            </Button>
            {diag ? (
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-[#1f242c] p-3 text-xs">
                {JSON.stringify(diag, null, 2)}
              </pre>
            ) : (
              <div className="text-sm hc-muted">Nenhum diagnóstico executado ainda.</div>
            )}
          </CardContent>
        </Card>

        <Card className="hc-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reinstalar Banco PT‑BR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={runReset}
              disabled={loading === "reset"}
              className="bg-[#1d2430] border border-[#3f4b60] hover:bg-[#232c3d] text-white"
            >
              {loading === "reset" ? "Reinstalando..." : "Reinstalar Banco PT‑BR"}
            </Button>
            {reset ? (
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-[#1f242c] p-3 text-xs">
                {JSON.stringify(reset, null, 2)}
              </pre>
            ) : (
              <div className="text-sm hc-muted">Executa reset do schema público e instala tabelas em português.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="hc-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dicas rápidas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm hc-muted space-y-1">
          <div>1) Garanta que POSTGRES_URL (ou similares) esteja definido com a Connection String do Postgres.</div>
          <div>2) Rode “Diagnosticar Banco” para validar conexão e existência da tabela produtos.</div>
          <div>3) Se faltar tabelas, clique em “Reinstalar Banco PT‑BR”.</div>
          <div>4) Volte para Estoque e recarregue a página.</div>
        </CardContent>
      </Card>
    </div>
  )
}

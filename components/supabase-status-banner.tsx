"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Check = {
  ok: boolean
  error?: string | null
  productsCount?: number | null
  supabaseUrl?: string
  hints?: string[]
}

export default function SupabaseStatusBanner() {
  const [state, setState] = useState<{ loading: boolean; data?: Check; err?: string }>({ loading: true })

  async function runCheck() {
    setState({ loading: true })
    try {
      const res = await fetch("/api/supabase-check", { cache: "no-store" })
      const data = (await res.json()) as Check
      if (!res.ok) {
        setState({ loading: false, data, err: data.error || "Falha na verificação" })
      } else {
        setState({ loading: false, data })
      }
    } catch (e: any) {
      setState({ loading: false, err: String(e) })
    }
  }

  useEffect(() => {
    runCheck()
  }, [])

  const hasError = state.err || (state.data && state.data.ok === false)

  if (!hasError) return null

  const message =
    state.err ||
    state.data?.error ||
    "Não foi possível validar o acesso ao Supabase. Verifique suas variáveis de ambiente."

  return (
    <div className="bg-red-600/90 text-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-2 text-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="font-semibold">Falha ao conectar no Supabase</div>
            <div className="opacity-90 break-all">{message}</div>
            {state.data?.supabaseUrl ? <div className="opacity-80">{`URL: ${state.data.supabaseUrl}`}</div> : null}
            {state.data?.hints?.length ? (
              <ul className="list-disc pl-5 opacity-90">
                {state.data.hints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-[#1d2430] border border-[#3f4b60] hover:bg-[#232c3d] text-white"
              onClick={runCheck}
              disabled={state.loading}
            >
              {state.loading ? "Verificando..." : "Tentar novamente"}
            </Button>
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md bg-black/30 px-3 py-2 text-sm ring-1 ring-black/20 hover:bg-black/40"
            >
              Abrir Settings &gt; API
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

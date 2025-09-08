import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data, error } = await supabase.from("pedidos").select("*").eq("id", id).single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ ok: false, error: "Erro ao buscar pedido" }, { status: 500 })
    }

    if (data) {
      console.log("[v0] Raw order data from DB:", JSON.stringify({ id: data.id, itens: data.itens }))

      // Properly handle JSONB items column
      if (data.itens === null || data.itens === undefined) {
        data.itens = []
      } else if (typeof data.itens === "string") {
        try {
          data.itens = JSON.parse(data.itens)
        } catch (e) {
          console.error("[v0] Failed to parse itens JSON:", e)
          data.itens = []
        }
      } else if (!Array.isArray(data.itens)) {
        console.error("[v0] Unexpected itens format:", typeof data.itens, data.itens)
        data.itens = []
      }

      console.log("[v0] Processed order items:", JSON.stringify(data.itens))
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get the current cash register (today's)
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("caixa")
      .select("*")
      .gte("data_abertura", today)
      .order("data_abertura", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Supabase error:", error)
      return NextResponse.json({ ok: false, error: "Erro ao buscar caixa" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: data || null })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { action, valor_inicial, automatic } = body

    if (action === "open") {
      if (!valor_inicial || valor_inicial < 0) {
        return NextResponse.json({ ok: false, error: "Valor inicial inválido" }, { status: 400 })
      }

      // Check if there's already an open cash register today
      const today = new Date().toISOString().split("T")[0]
      const { data: existing } = await supabase
        .from("caixa")
        .select("*")
        .eq("status", "aberto")
        .gte("data_abertura", today)
        .single()

      if (existing) {
        return NextResponse.json({ ok: false, error: "Já existe um caixa aberto hoje" }, { status: 400 })
      }

      // Create new cash register
      const { data, error } = await supabase
        .from("caixa")
        .insert({
          status: "aberto",
          valor_inicial: valor_inicial,
          valor_atual: valor_inicial,
          data_abertura: new Date().toISOString(),
          vendas_total: 0,
          pedidos_count: 0,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ ok: false, error: "Erro ao abrir caixa" }, { status: 500 })
      }

      return NextResponse.json({ ok: true, data })
    }

    if (action === "close") {
      // Get current open cash register
      const { data: currentCash, error: fetchError } = await supabase
        .from("caixa")
        .select("*")
        .eq("status", "aberto")
        .single()

      if (fetchError || !currentCash) {
        return NextResponse.json({ ok: false, error: "Nenhum caixa aberto encontrado" }, { status: 400 })
      }

      // Get today's sales to update totals
      const today = new Date().toISOString().split("T")[0]
      const { data: sales } = await supabase.from("pedidos").select("total").eq("status", "pago").gte("data", today)

      const totalSales = sales?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0
      const ordersCount = sales?.length || 0

      // Close the cash register
      const { data, error } = await supabase
        .from("caixa")
        .update({
          status: "fechado",
          data_fechamento: new Date().toISOString(),
          vendas_total: totalSales,
          pedidos_count: ordersCount,
          valor_atual: currentCash.valor_inicial + totalSales,
        })
        .eq("id", currentCash.id)
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        return NextResponse.json({ ok: false, error: "Erro ao fechar caixa" }, { status: 500 })
      }

      return NextResponse.json({ ok: true, data })
    }

    return NextResponse.json({ ok: false, error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const pedidoId = searchParams.get("pedido_id")

    if (!pedidoId) {
      return NextResponse.json({ error: "pedido_id is required" }, { status: 400 })
    }

    const { data: pedido, error } = await supabase.from("pedidos").select("itens").eq("id", pedidoId).single()

    if (error) {
      console.error("Error fetching order:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = pedido?.itens || []
    const mappedData = items.map((item: any, index: number) => ({
      id: `${pedidoId}-${index}`, // Generate unique ID for compatibility
      pedido_id: pedidoId,
      produto_id: item.produto_id,
      qtd: item.qtd || 1,
      preco: item.preco || 0,
      produto_nome: item.nome || "Produto",
      subtotal: item.subtotal || item.qtd * item.preco || 0,
    }))

    return NextResponse.json({ data: mappedData })
  } catch (error) {
    console.error("Error in itens-pedido API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

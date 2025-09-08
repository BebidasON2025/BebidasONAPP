import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    const supabase = getSupabaseAdmin()

    console.log("[v0] Debugging recent orders...")

    // Get recent orders with their items
    const { data: orders, error } = await supabase
      .from("pedidos")
      .select("id, numero_pedido, total, status, itens, criado_em")
      .order("criado_em", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching orders for debug:", error)
      return NextResponse.json({ ok: false, error: error.message })
    }

    console.log("[v0] Debug - Recent orders analysis:")

    const analysis = orders.map((order, index) => {
      const itemsAnalysis = {
        hasItems: order.itens !== null && order.itens !== undefined,
        itemsType: typeof order.itens,
        isArray: Array.isArray(order.itens),
        itemsLength: Array.isArray(order.itens) ? order.itens.length : 0,
        itemsContent: order.itens,
      }

      console.log(`[v0] Order ${index + 1} (${order.numero_pedido}):`, {
        id: order.id,
        total: order.total,
        status: order.status,
        ...itemsAnalysis,
      })

      return {
        order: {
          id: order.id,
          numero_pedido: order.numero_pedido,
          total: order.total,
          status: order.status,
          criado_em: order.criado_em,
        },
        itemsAnalysis,
      }
    })

    return NextResponse.json({
      ok: true,
      ordersAnalyzed: orders.length,
      analysis,
    })
  } catch (error) {
    console.error("[v0] Debug orders error:", error)
    return NextResponse.json({ ok: false, error: String(error) })
  }
}

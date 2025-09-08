import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { cliente_nome_texto, metodo, status, total, data, itens } = body

    // Generate order number
    const { count } = await supabase.from("pedidos").select("*", { count: "exact", head: true })

    const orderNumber = `VENDA${String((count || 0) + 1).padStart(5, "0")}`

    // Create the retroactive order
    const { data: order, error: orderError } = await supabase
      .from("pedidos")
      .insert({
        numero_pedido: orderNumber,
        cliente_nome_texto: cliente_nome_texto || "Cliente",
        metodo,
        status,
        total,
        data,
        retroativo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating retroactive order:", orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items
    if (itens && itens.length > 0) {
      const orderItems = itens.map((item: any) => ({
        pedido_id: order.id,
        produto_id: item.produto_id,
        qtd: item.qtd,
        preco: item.preco,
        criado_em: new Date().toISOString(),
      }))

      const { error: itemsError } = await supabase.from("itens_pedido").insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)
        // Don't fail the entire operation, just log the error
      }

      // Update product stock if the order is paid
      if (status === "pago") {
        for (const item of itens) {
          await supabase.rpc("update_product_stock", {
            product_id: item.produto_id,
            quantity_sold: item.qtd,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: "Pedido retroativo criado com sucesso",
    })
  } catch (error) {
    console.error("Error in retroactive order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

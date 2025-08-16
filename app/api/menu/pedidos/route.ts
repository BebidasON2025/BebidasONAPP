import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente, itens, total, metodo_pagamento, observacoes } = body

    // Validate required fields
    if (!cliente || !itens || !Array.isArray(itens) || itens.length === 0 || !total) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios: cliente, itens, total",
        },
        { status: 400 },
      )
    }

    // Generate order number
    const orderNumber = `VENDA${String(Date.now()).slice(-6)}`

    // Create order
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        numero: orderNumber,
        cliente: cliente.nome || cliente,
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        total: Number.parseFloat(total),
        status: "pendente",
        metodo_pagamento: metodo_pagamento || "pix",
        observacoes: observacoes || "",
        origem: "cardapio",
      })
      .select()
      .single()

    if (pedidoError) {
      console.error("[v0] Error creating order:", pedidoError)
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
    }

    // Create order items
    const orderItems = itens.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      qtd: Number.parseInt(item.quantidade),
      preco: Number.parseFloat(item.preco),
    }))

    const { error: itensError } = await supabase.from("itens_pedido").insert(orderItems)

    if (itensError) {
      console.error("[v0] Error creating order items:", itensError)
      // Try to delete the order if items failed
      await supabase.from("pedidos").delete().eq("id", pedido.id)
      return NextResponse.json({ error: "Erro ao criar itens do pedido" }, { status: 500 })
    }

    // Update stock for each item
    for (const item of itens) {
      const { error: stockError } = await supabase.rpc("update_stock", {
        product_id: item.produto_id,
        quantity_sold: Number.parseInt(item.quantidade),
      })

      if (stockError) {
        console.error("[v0] Error updating stock:", stockError)
        // Continue processing other items even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      pedido: {
        id: pedido.id,
        numero: pedido.numero,
        status: pedido.status,
        total: pedido.total,
      },
      message: "Pedido criado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Menu order API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

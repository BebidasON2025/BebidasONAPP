import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      pedido_cardapio_id,
      cliente_nome,
      cliente_telefone,
      itens,
      total,
      forma_pagamento,
      tipo_entrega,
      endereco_entrega,
      valor_pago,
      troco,
      status = "pago",
    } = body

    const { data: novoPedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        cliente_nome_texto: cliente_nome,
        telefone: cliente_telefone,
        metodo: forma_pagamento,
        status: status,
        total: total,
        tipo_entrega: tipo_entrega,
        endereco_entrega: endereco_entrega,
        valor_pago: valor_pago,
        troco: troco,
        origem: "cardapio_digital",
      })
      .select()
      .single()

    if (pedidoError) {
      throw new Error(`Erro ao criar pedido: ${pedidoError.message}`)
    }

    for (const item of itens) {
      // Create order item
      const { error: itemError } = await supabase.from("itens_pedido").insert({
        pedido_id: novoPedido.id,
        produto_id: item.produto_id,
        qtd: item.quantidade,
        preco: item.preco,
      })

      if (itemError) {
        console.error("Erro ao criar item do pedido:", itemError)
        continue
      }

      if (status === "pago") {
        const { error: stockError } = await supabase.rpc("atualizar_estoque", {
          produto_id: item.produto_id,
          quantidade: -item.quantidade,
        })

        if (stockError) {
          console.error("Erro ao atualizar estoque:", stockError)
        }
      }
    }

    const { error: financeError } = await supabase.from("lancamentos_financeiros").insert({
      descricao: `Venda ${novoPedido.numero_pedido || novoPedido.id} - ${cliente_nome}`,
      valor: total,
      tipo: "entrada",
      categoria: "Vendas",
      metodo: forma_pagamento,
      pedido_id: novoPedido.id,
    })

    if (financeError) {
      console.error("Erro ao criar lançamento financeiro:", financeError)
    }

    return NextResponse.json({
      ok: true,
      pedido_id: novoPedido.id,
      numero_pedido: novoPedido.numero_pedido,
      message: "Pedido sincronizado com sucesso!",
    })
  } catch (error: any) {
    console.error("Erro na sincronização do pedido:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

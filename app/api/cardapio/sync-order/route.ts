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
        telefone_cliente: cliente_telefone,
        metodo: forma_pagamento,
        status: status,
        total: total,
        tipo_entrega: tipo_entrega,
        endereco_entrega: endereco_entrega,
        valor_pago: valor_pago,
        troco: troco,
        origem: "cardapio_digital",
        itens: itens.map((item: any) => ({
          produto_id: item.produto_id,
          nome: item.nome_produto || "Produto",
          qtd: item.quantidade,
          quantidade: item.quantidade,
          preco: item.preco,
          preco_unitario: item.preco,
          subtotal: item.preco * item.quantidade,
        })),
        ...(status === "pago" && {
          transacao_financeira: {
            tipo: "entrada",
            descricao: `Venda ${pedido_cardapio_id} - ${cliente_nome}`,
            categoria: "Vendas",
            valor: total,
            metodo: forma_pagamento,
            data: new Date().toISOString(),
          },
          data_pagamento: new Date().toISOString(),
        }),
      })
      .select()
      .single()

    if (pedidoError) {
      throw new Error(`Erro ao criar pedido: ${pedidoError.message}`)
    }

    if (status === "pago") {
      for (const item of itens) {
        const { error: stockError } = await supabase.rpc("atualizar_estoque", {
          produto_id: item.produto_id,
          quantidade: -item.quantidade,
        })

        if (stockError) {
          console.error("Erro ao atualizar estoque:", stockError)
        }
      }
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

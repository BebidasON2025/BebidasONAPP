import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API integrar-pedido chamada")
    const supabase = getSupabaseAdmin()
    const pedidoData = await request.json()

    console.log("[v0] Dados recebidos:", JSON.stringify(pedidoData, null, 2))

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        cliente_nome_texto: pedidoData.cliente?.nome || pedidoData.cliente_nome || "Cliente",
        cliente_telefone: pedidoData.cliente?.telefone || pedidoData.cliente_telefone || "",
        cliente_endereco: pedidoData.cliente?.endereco || pedidoData.endereco_entrega || "",
        metodo: pedidoData.metodoPagamento || "Dinheiro",
        status: pedidoData.metodoPagamento === "Fiado" ? "pendente" : "pago",
        total: pedidoData.total || 0,
        observacoes: pedidoData.observacoes || "",
        data: new Date().toISOString(),
      })
      .select()
      .single()

    if (pedidoError) {
      console.log("[v0] Erro ao inserir pedido:", pedidoError)
      throw pedidoError
    }

    console.log("[v0] Pedido inserido com sucesso:", pedido.id)

    const itensArray = pedidoData.itens || pedidoData.items || []

    if (itensArray && itensArray.length > 0) {
      const itens = itensArray.map((item: any) => ({
        pedido_id: pedido.id,
        produto_nome: item.nome || item.produto_nome,
        qtd: item.quantidade,
        preco: item.preco || item.preco_unitario,
      }))

      console.log("[v0] Inserindo itens:", itens)

      const { error: itensError } = await supabase.from("itens_pedido").insert(itens)

      if (itensError) {
        console.log("[v0] Erro ao inserir itens:", itensError)
        throw itensError
      }

      for (const item of itensArray) {
        const produtoNome = item.nome || item.produto_nome
        const { data: produto } = await supabase.from("produtos").select("estoque").eq("nome", produtoNome).single()

        if (produto) {
          const novoEstoque = Math.max(0, produto.estoque - item.quantidade)
          await supabase.from("produtos").update({ estoque: novoEstoque }).eq("nome", produtoNome)
          console.log("[v0] Estoque atualizado para", produtoNome, ":", novoEstoque)
        }
      }
    }

    console.log("[v0] Integração concluída com sucesso")
    return NextResponse.json({
      success: true,
      pedido_id: pedido.id,
      message: "Pedido integrado com sucesso!",
    })
  } catch (error) {
    console.error("[v0] Erro na integração do pedido:", error)
    return NextResponse.json({ success: false, error: "Erro ao integrar pedido" }, { status: 500 })
  }
}

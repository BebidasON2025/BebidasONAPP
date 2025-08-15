import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const pedidoData = await request.json()

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        cliente_nome_texto: pedidoData.cliente?.nome || "Cliente",
        cliente_telefone: pedidoData.cliente?.telefone || "",
        cliente_endereco: pedidoData.cliente?.endereco || "",
        metodo: pedidoData.metodoPagamento || "Dinheiro",
        status: pedidoData.metodoPagamento === "Fiado" ? "pendente" : "pago",
        total: pedidoData.total || 0,
        observacoes: pedidoData.observacoes || "",
        data: new Date().toISOString(),
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    if (pedidoData.itens && pedidoData.itens.length > 0) {
      const itens = pedidoData.itens.map((item: any) => ({
        pedido_id: pedido.id,
        produto_nome: item.nome,
        qtd: item.quantidade,
        preco: item.preco,
      }))

      const { error: itensError } = await supabase.from("itens_pedido").insert(itens)

      if (itensError) throw itensError

      for (const item of pedidoData.itens) {
        const { data: produto } = await supabase.from("produtos").select("estoque").eq("nome", item.nome).single()

        if (produto) {
          const novoEstoque = Math.max(0, produto.estoque - item.quantidade)

          await supabase.from("produtos").update({ estoque: novoEstoque }).eq("nome", item.nome)
        }
      }
    }

    return NextResponse.json({
      success: true,
      pedido_id: pedido.id,
      message: "Pedido integrado com sucesso!",
    })
  } catch (error) {
    console.error("Erro na integração do pedido:", error)
    return NextResponse.json({ success: false, error: "Erro ao integrar pedido" }, { status: 500 })
  }
}

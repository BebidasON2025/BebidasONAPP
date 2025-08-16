import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const { data: produtos, error } = await supabase.from("produtos").select("*").order("nome")

    if (error) {
      console.error("[v0] Error fetching products for menu:", error)
      return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 })
    }

    // Format data for menu consumption
    const menuProducts =
      produtos?.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        estoque: produto.estoque,
        disponivel: produto.estoque > 0,
        imagem: produto.imagem,
        codigo_barras: produto.codigo_barras,
      })) || []

    return NextResponse.json({
      success: true,
      produtos: menuProducts,
      total: menuProducts.length,
    })
  } catch (error) {
    console.error("[v0] Menu products API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

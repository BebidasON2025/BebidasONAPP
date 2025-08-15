import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { produtos } = await request.json()

    if (!Array.isArray(produtos)) {
      return NextResponse.json({ error: "Produtos deve ser um array" }, { status: 400 })
    }

    const results = []

    for (const produto of produtos) {
      try {
        const { data: existingProduct } = await supabase
          .from("produtos")
          .select("*")
          .or(`nome.eq.${produto.nome},codigo_barras.eq.${produto.codigo_barras || produto.id}`)
          .single()

        if (existingProduct) {
          const { data, error } = await supabase
            .from("produtos")
            .update({
              nome: produto.nome,
              preco: produto.preco,
              estoque: produto.estoque || 0,
              categoria: produto.categoria || "Geral",
              descricao: produto.descricao || "",
              imagem: produto.imagem || "",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProduct.id)
            .select()

          if (error) throw error
          results.push({ action: "updated", product: data[0] })
        } else {
          const { data, error } = await supabase
            .from("produtos")
            .insert({
              nome: produto.nome,
              preco: produto.preco,
              estoque: produto.estoque || 0,
              categoria: produto.categoria || "Geral",
              descricao: produto.descricao || "",
              imagem: produto.imagem || "",
              codigo_barras: produto.codigo_barras || produto.id?.toString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()

          if (error) throw error
          results.push({ action: "created", product: data[0] })
        }
      } catch (error) {
        console.error(`Error processing product ${produto.nome}:`, error)
        results.push({ action: "error", product: produto, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${produtos.length} produtos`,
      results,
    })
  } catch (error) {
    console.error("Error syncing products:", error)
    return NextResponse.json(
      {
        error: "Erro ao sincronizar produtos",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

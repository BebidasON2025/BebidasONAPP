import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const produtoId = searchParams.get("produto_id")

    if (!produtoId) {
      return NextResponse.json({ error: "produto_id é obrigatório" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("precos_compra")
      .select("preco_compra")
      .eq("produto_id", produtoId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar preço de compra:", error)
      return NextResponse.json({ error: "Erro ao buscar preço de compra" }, { status: 500 })
    }

    return NextResponse.json({ preco_compra: data?.preco_compra || 0 })
  } catch (error) {
    console.error("Erro na API de preços de compra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { produto_id, preco_compra } = await request.json()

    if (!produto_id || preco_compra === undefined) {
      return NextResponse.json({ error: "produto_id e preco_compra são obrigatórios" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("precos_compra")
      .upsert(
        {
          produto_id,
          preco_compra: Number(preco_compra),
        },
        {
          onConflict: "produto_id",
        },
      )
      .select()

    if (error) {
      console.error("Erro ao salvar preço de compra:", error)
      return NextResponse.json({ error: "Erro ao salvar preço de compra" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Erro na API de preços de compra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const [produtosResult, categoriasResult] = await Promise.all([
      supabase.from("produtos").select("*").eq("ativo", true),
      supabase.from("categorias").select("*").eq("ativo", true),
    ])

    return NextResponse.json({
      produtos: produtosResult.data || [],
      categorias: categoriasResult.data || [],
    })
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    return NextResponse.json({ produtos: [], categorias: [] }, { status: 500 })
  }
}

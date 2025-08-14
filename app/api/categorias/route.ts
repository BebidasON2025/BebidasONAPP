import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    const { data: categorias, error } = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ ok: true, data: [] })
    }

    return NextResponse.json({ ok: true, data: categorias || [] })
  } catch (error) {
    console.error("Error in categories API:", error)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("categorias")
      .insert([
        {
          nome: body.nome,
          cor: body.cor || "blue",
          icone: body.icone || "Box",
          ativo: body.ativo !== undefined ? body.ativo : true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("Error in categories POST:", error)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("categorias")
      .update({
        nome: body.nome,
        cor: body.cor,
        icone: body.icone,
        ativo: body.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error("Error in categories PUT:", error)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()
    const id = body.id

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("categorias").update({ ativo: false }).eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error in categories DELETE:", error)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}

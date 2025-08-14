import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

const TABLE = "produtos"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("produtos").select("*").order("criado_em", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ ok: true, data: [] })
    }

    const products = (data || []).map((p: any) => ({
      id: p.id,
      nome: p.nome || "",
      preco: Number(p.preco || 0),
      estoque: Number(p.estoque || 0),
      categoria: p.categoria || null,
      alerta_estoque: Number(p.alerta_estoque || 10),
      codigo_barras: p.codigo_barras || null,
      imagem: p.imagem || null,
      created_at: p.criado_em || null,
    }))

    return NextResponse.json({ ok: true, data: products })
  } catch (e: any) {
    console.error("API error:", e)
    return NextResponse.json({ ok: true, data: [] })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const toInsert = {
      nome: body.nome ?? body.name ?? "",
      preco: Number(body.preco ?? body.price ?? 0),
      estoque: Number(body.estoque ?? body.stock ?? 0),
      categoria: body.categoria ?? body.category ?? null,
      alerta_estoque: Number(body.alerta_estoque ?? 10),
      codigo_barras: body.codigo_barras ?? body.barcode ?? null,
      imagem: body.imagem ?? null,
    }

    const r = await supabase.from(TABLE).insert(toInsert).select("*").single()
    if (r.error) {
      console.error("Insert error:", r.error)
      return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, data: r.data })
  } catch (e: any) {
    console.error("POST error:", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, patch } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "Campo 'id' é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const upd: Record<string, any> = {}
    if (patch?.nome !== undefined || patch?.name !== undefined) upd.nome = patch?.nome ?? patch?.name ?? null
    if (patch?.preco !== undefined || patch?.price !== undefined) upd.preco = Number(patch?.preco ?? patch?.price ?? 0)
    if (patch?.estoque !== undefined || patch?.stock !== undefined)
      upd.estoque = Number(patch?.estoque ?? patch?.stock ?? 0)
    if (patch?.categoria !== undefined || patch?.category !== undefined)
      upd.categoria = patch?.categoria ?? patch?.category ?? null
    if (patch?.alerta_estoque !== undefined) upd.alerta_estoque = Number(patch?.alerta_estoque ?? 10)
    if (patch?.codigo_barras !== undefined || patch?.barcode !== undefined)
      upd.codigo_barras = patch?.codigo_barras ?? patch?.barcode ?? null
    if (patch?.imagem !== undefined) upd.imagem = patch?.imagem ?? null

    const r = await supabase.from(TABLE).update(upd).eq("id", id).select("*").single()
    if (r.error) {
      console.error("Update error:", r.error)
      return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, data: r.data })
  } catch (e: any) {
    console.error("PATCH error:", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json().catch(() => ({}))
    if (!id) return NextResponse.json({ ok: false, error: "Campo 'id' é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const r = await supabase.from(TABLE).delete().eq("id", id)
    if (r.error) {
      console.error("Delete error:", r.error)
      return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("DELETE error:", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

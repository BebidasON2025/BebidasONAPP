import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists, isMissingTableError } from "@/lib/db-helpers"

const TABLE = "lancamentos_financeiros"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: true, data: [], table: null })

    const orderCols = ["data", "criado_em", "created_at"]
    let data: any[] = []
    let lastErr: any = null

    for (const col of orderCols) {
      const r = await supabase
        .from(TABLE)
        .select("*")
        .order(col as any, { ascending: false })
      if (!r.error) {
        data = r.data || []
        lastErr = null
        break
      }
      lastErr = r.error
    }

    if (lastErr) {
      if (isMissingTableError(lastErr)) return NextResponse.json({ ok: true, data: [], table: TABLE })
      return NextResponse.json({ ok: false, error: lastErr.message, data: [] }, { status: 500 })
    }

    const mapped = data.map((x: any) => ({
      id: x.id,
      tipo: x.tipo ?? x.type ?? "entrada",
      descricao: x.descricao ?? x.description ?? "",
      categoria: x.categoria ?? x.category ?? null,
      metodo: x.metodo ?? x.method ?? null,
      valor: Number(x.valor ?? x.amount ?? 0),
      data: x.data ?? x.criado_em ?? x.created_at ?? null,
      raw: x,
    }))

    return NextResponse.json({ ok: true, data: mapped, table: TABLE })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { type, description, category, amount, method } = body || {}
    if (!type || !description || !category || amount == null || !method) {
      return NextResponse.json(
        { ok: false, error: "Campos obrigatórios: type, description, category, amount, method" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists)
      return NextResponse.json({ ok: false, error: "Tabela 'lancamentos_financeiros' inexistente." }, { status: 400 })

    const r = await supabase
      .from(TABLE)
      .insert({
        tipo: type,
        descricao: description,
        categoria: category,
        valor: Number(amount || 0),
        metodo: method,
        data: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: r.data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "Campo 'id' é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists)
      return NextResponse.json({ ok: false, error: "Tabela 'lancamentos_financeiros' inexistente." }, { status: 400 })

    const r = await supabase.from(TABLE).delete().eq("id", id)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

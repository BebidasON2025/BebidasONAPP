import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists, isMissingTableError } from "@/lib/db-helpers"

const TABLE = "fornecedores"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: true, data: [], table: null })

    const r = await supabase.from(TABLE).select("*").order("criado_em", { ascending: false })
    if (r.error) {
      if (isMissingTableError(r.error)) return NextResponse.json({ ok: true, data: [], table: TABLE })
      return NextResponse.json({ ok: false, error: r.error.message, data: [] }, { status: 500 })
    }

    const data = (r.data || []).map((s: any) => ({
      id: s.id,
      nome: s.nome ?? s.name ?? "",
      email: s.email ?? null,
      telefone: s.telefone ?? s.phone ?? null,
      cnpj: s.cnpj ?? s.tax_id ?? null,
      created_at: s.criado_em ?? null,
      raw: s,
    }))
    return NextResponse.json({ ok: true, data, table: TABLE })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'fornecedores' inexistente." }, { status: 400 })

    const toInsert = {
      nome: body.nome ?? body.name ?? "",
      email: body.email ?? null,
      telefone: body.telefone ?? body.phone ?? null,
      cnpj: body.cnpj ?? null,
    }
    const r = await supabase.from(TABLE).insert(toInsert).select("*").single()
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: r.data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, patch } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "Campo 'id' é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'fornecedores' inexistente." }, { status: 400 })

    const upd: Record<string, any> = {}
    if (patch?.name !== undefined || patch?.nome !== undefined) upd.nome = patch?.name ?? patch?.nome ?? null
    if (patch?.email !== undefined) upd.email = patch.email ?? null
    if (patch?.phone !== undefined || patch?.telefone !== undefined)
      upd.telefone = patch?.phone ?? patch?.telefone ?? null
    if (patch?.cnpj !== undefined) upd.cnpj = patch.cnpj ?? null

    const r = await supabase.from(TABLE).update(upd).eq("id", id).select("*").single()
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
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'fornecedores' inexistente." }, { status: 400 })

    const r = await supabase.from(TABLE).delete().eq("id", id)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

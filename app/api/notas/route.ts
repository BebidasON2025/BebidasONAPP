import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function isMissingTableError(err: any) {
  const code = (err?.code || "").toString().toUpperCase()
  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST301" ||
    /relation .* does not exist/i.test(err?.message || "") ||
    /table .* does not exist/i.test(err?.message || "") ||
    /could not find the table .* in the schema cache/i.test(err?.message || "")
  )
}
function err(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}
async function selectPreferTable(tables: string[]) {
  const supabase = getSupabaseServerClient()
  for (const t of tables) {
    const r = await supabase.from(t).select("id", { head: true, count: "exact" })
    if (!r.error) return { table: t, supabase }
    if (!isMissingTableError(r.error)) throw r.error
  }
  return { table: tables[tables.length - 1], supabase }
}

export async function GET() {
  try {
    const { table, supabase } = await selectPreferTable(["notas_fiscais", "nota_fiscal"])
    const cols = "id, numero, cliente_id, total, status, data, criado_em, atualizado_em"
    const { data, error } = await supabase.from(table).select(cols).order("data", { ascending: false })
    if (error) return err(500, error.message)
    return NextResponse.json({ ok: true, table, data })
  } catch (e: any) {
    return err(500, String(e?.message || e))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { number, clientId, total, status = "emitida", dueDate } = body || {}
    if (!number || !clientId) return err(400, "Campos 'number' e 'clientId' são obrigatórios")

    const { table, supabase } = await selectPreferTable(["notas_fiscais", "nota_fiscal"])
    const { data, error } = await supabase
      .from(table)
      .insert({
        numero: number,
        cliente_id: clientId,
        total: Number(total || 0),
        status,
        data: new Date().toISOString(),
      })
      .select("id, numero, cliente_id, total, status, data, criado_em, atualizado_em")
      .single()
    if (error) return err(500, error.message)
    return NextResponse.json({ ok: true, table, data })
  } catch (e: any) {
    return err(500, String(e?.message || e))
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, status } = body || {}
    if (!id || !status) return err(400, "Campos 'id' e 'status' são obrigatórios")

    const { table, supabase } = await selectPreferTable(["notas_fiscais", "nota_fiscal"])
    const { data, error } = await supabase
      .from(table)
      .update({ status })
      .eq("id", id)
      .select("id, numero, total, status")
      .single()
    if (error) return err(500, error.message)
    return NextResponse.json({ ok: true, table, data })
  } catch (e: any) {
    return err(500, String(e?.message || e))
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id } = body || {}
    if (!id) return err(400, "Campo 'id' é obrigatório")
    const { table, supabase } = await selectPreferTable(["notas_fiscais", "nota_fiscal"])
    const { error } = await supabase.from(table).delete().eq("id", id)
    if (error) return err(500, error.message)
    return NextResponse.json({ ok: true, table })
  } catch (e: any) {
    return err(500, String(e?.message || e))
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db-helpers"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("itens_pedido").select("*").order("id", { ascending: false })

    if (error) {
      console.error("Error fetching order items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in itens-pedido API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

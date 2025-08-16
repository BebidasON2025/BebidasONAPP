import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("produtos").select("imagem").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ imagem: data?.imagem || null })
  } catch (error) {
    console.error("Error fetching product image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

function normalizeToLocalDate(date: Date): string {
  // Use local timezone instead of forcing UTC offset
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export async function GET() {
  try {
    const supabase = createClient()

    const today = new Date()
    const todayStr = normalizeToLocalDate(today)

    const { data: orders, error } = await supabase
      .from("pedidos")
      .select("total, data, criado_em")
      .eq("status", "pago")
      .gte("data", `${todayStr}T00:00:00.000Z`)
      .lte("data", `${todayStr}T23:59:59.999Z`)

    if (error) {
      console.error("Error fetching today's sales:", error)
      return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
    }

    const filteredOrders =
      orders?.filter((order) => {
        const orderDate = new Date(order.data || order.criado_em)
        const orderDateStr = normalizeToLocalDate(orderDate)
        return orderDateStr === todayStr
      }) || []

    const total = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const firstOrderTime = filteredOrders.length > 0 ? filteredOrders[0].data || filteredOrders[0].criado_em : null

    return NextResponse.json({
      total,
      count: filteredOrders.length,
      firstOrderTime,
    })
  } catch (error) {
    console.error("Error in today's sales API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    const startDate = `${date}T00:00:00.000Z`
    const endDate = `${date}T23:59:59.999Z`

    // Get cash register data for the day
    const { data: cashData } = await supabase
      .from("caixa")
      .select("*")
      .gte("data_abertura", startDate)
      .lte("data_abertura", endDate)
      .order("data_abertura", { ascending: false })
      .limit(1)
      .single()

    const { data: orders } = await supabase
      .from("pedidos")
      .select("*")
      .gte("criado_em", startDate)
      .lte("criado_em", endDate)

    console.log(`[v0] Daily report for ${date}: Found ${orders?.length || 0} orders`)

    const paidOrders = orders?.filter((o) => o.status === "pago") || []
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

    console.log(`[v0] Daily report calculations: ${paidOrders.length} paid orders, R$ ${totalRevenue} total revenue`)

    let topProduct = ""
    if (paidOrders.length > 0) {
      const productSales: { [key: string]: number } = {}

      paidOrders.forEach((order) => {
        if (order.itens && Array.isArray(order.itens)) {
          order.itens.forEach((item: any) => {
            const productName = item.nome || "Produto"
            const quantity = Number(item.qtd || item.quantidade || 1)
            productSales[productName] = (productSales[productName] || 0) + quantity
          })
        }
      })

      const topProductEntry = Object.entries(productSales).sort(([, a], [, b]) => b - a)[0]
      topProduct = topProductEntry ? `${topProductEntry[0]} (${topProductEntry[1]} unidades)` : ""
    }

    let status: "excellent" | "good" | "warning" | "poor" = "poor"
    let message = ""

    if (!cashData) {
      status = "poor"
      message = "Caixa não foi aberto hoje. Lembre-se de abrir o caixa para registrar vendas corretamente."
    } else if (cashData.status === "fechado") {
      if (totalRevenue > 500) {
        status = "excellent"
        message = `Excelente dia! Caixa fechado corretamente com ${formatBRL(totalRevenue)} em vendas e ${paidOrders.length} pedidos pagos.`
      } else if (totalRevenue > 200) {
        status = "good"
        message = `Bom dia de vendas! Caixa fechado com ${formatBRL(totalRevenue)} em vendas. Continue assim!`
      } else if (totalRevenue > 0) {
        status = "warning"
        message = `Dia com poucas vendas. Total de ${formatBRL(totalRevenue)}. Considere estratégias para aumentar as vendas.`
      } else {
        status = "poor"
        message = "Nenhuma venda registrada hoje. Verifique se o sistema está funcionando corretamente."
      }
    } else if (cashData.status === "aberto") {
      if (totalRevenue > 300) {
        status = "good"
        message = `Bom dia de vendas até agora! ${formatBRL(totalRevenue)} em vendas. Lembre-se de fechar o caixa ao final do dia.`
      } else if (totalRevenue > 0) {
        status = "warning"
        message = `${formatBRL(totalRevenue)} em vendas hoje. Caixa ainda está aberto - lembre-se de fechar ao final do dia.`
      } else {
        status = "warning"
        message = "Caixa aberto mas nenhuma venda registrada ainda hoje."
      }
    }

    const finalAmount = Number(cashData?.valor_inicial || 0) + totalRevenue

    const report = {
      date,
      cashRegister: {
        opened: !!cashData,
        closed: cashData?.status === "fechado",
        openTime: cashData?.data_abertura,
        closeTime: cashData?.data_fechamento,
        initialAmount: Number(cashData?.valor_inicial || 0),
        finalAmount: cashData?.status === "fechado" ? Number(cashData?.valor_final || finalAmount) : finalAmount,
        isAutomatic: cashData?.fechamento_automatico || false,
      },
      sales: {
        totalRevenue,
        totalOrders: orders?.length || 0,
        paidOrders: paidOrders.length,
        averageTicket,
        topProduct,
      },
      summary: {
        status,
        message,
      },
    }

    console.log(`[v0] Daily report generated:`, report)

    return NextResponse.json({ ok: true, data: report })
  } catch (error) {
    console.error("Daily report API error:", error)
    return NextResponse.json({ ok: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

function formatBRL(value: number) {
  if (isNaN(value) || value === null || value === undefined) {
    return "R$ 0,00"
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

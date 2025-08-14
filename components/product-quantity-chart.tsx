"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

type Order = {
  id?: string | number
  status?: string
  created_at?: string
  createdAt?: string
  date?: string
  data?: string
}

type Product = {
  id: string
  nome?: string
  name?: string
}

function EmptyState({ text = "Nenhuma venda por quantidade registrada." }) {
  return <div className="hc-muted py-10 text-center">{text}</div>
}

export default function ProductQuantityChart({
  orders = [],
  products = [],
}: {
  orders?: Order[]
  products?: Product[]
}) {
  const [productQuantities, setProductQuantities] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadProductQuantities = async () => {
      try {
        setLoading(true)

        // Filter paid orders only
        const paidOrders = (orders || []).filter((o) => (o.status || "").toLowerCase() === "pago")

        if (paidOrders.length === 0) {
          setProductQuantities([])
          return
        }

        // Create a map to aggregate quantities by product
        const quantityMap = new Map<string, { name: string; quantity: number }>()

        // Load items for each paid order
        for (const order of paidOrders) {
          try {
            const response = await fetch(`/api/pedidos/${order.id}/items`)
            if (response.ok) {
              const result = await response.json()
              if (result.ok && Array.isArray(result.data)) {
                for (const item of result.data) {
                  const productName = item.description || "Produto"
                  const qty = Number(item.qty || 0)

                  if (qty > 0) {
                    const existing = quantityMap.get(productName)
                    if (existing) {
                      existing.quantity += qty
                    } else {
                      quantityMap.set(productName, { name: productName, quantity: qty })
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error loading items for order ${order.id}:`, error)
          }
        }

        // Convert map to array and sort by quantity (descending)
        const quantities = Array.from(quantityMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10) // Show top 10 products

        setProductQuantities(quantities)
      } catch (error) {
        console.error("Error loading product quantities:", error)
        setProductQuantities([])
      } finally {
        setLoading(false)
      }
    }

    loadProductQuantities()
  }, [orders])

  const totalQuantity = React.useMemo(
    () => productQuantities.reduce((sum, p) => sum + p.quantity, 0),
    [productQuantities],
  )

  if (loading) {
    return (
      <Card className="hc-panel">
        <CardHeader className="border-b hc-divider">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-blue-400">📊</span>
            Vendas por Quantidade
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-64 bg-gray-600 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hc-panel">
      <CardHeader className="border-b hc-divider">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-blue-400">📊</span>
          Vendas por Quantidade
          <span className="text-xs hc-muted font-normal">Total: {totalQuantity} unidades</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {productQuantities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productQuantities} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2a3342" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="#9aa4b2"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis stroke="#9aa4b2" tickFormatter={(v) => `${v} un`} width={60} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121721",
                    border: "1px solid #3f4b60",
                    borderRadius: 8,
                    color: "#e5e7eb",
                  }}
                  formatter={(value: any) => [`${value} unidades`, "Vendido"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar
                  dataKey="quantity"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

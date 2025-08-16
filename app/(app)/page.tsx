"use client"

import { Button } from "@/components/ui/button"
import PageHeader from "@/components/page-header"
import StatCard from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, BarChart3 } from "lucide-react"
import LowStockList from "@/components/low-stock-list"
import { formatBRL } from "@/lib/format"
import SalesChart from "@/components/sales-chart"
import ProfitChart from "@/components/profit-chart"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

export default function Page() {
  const [data, setData] = useState({
    products: [],
    customers: [],
    orders: [],
    loading: false, // Start with loading false for faster initial render
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          supabase.from("produtos").select("*"),
          supabase.from("clientes").select("*"),
          supabase.from("pedidos").select("*"),
        ])

        setData({
          products: productsRes?.data || [],
          customers: customersRes?.data || [],
          orders: ordersRes?.data || [],
          loading: false,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    loadData()
  }, [])

  const { products, customers, orders } = data

  const paidOrders = orders.filter((o: any) => o?.status?.toLowerCase() === "pago")
  const vendasTotais = paidOrders.reduce((sum: number, o: any) => sum + Number(o?.total ?? 0), 0)
  const lowCount = products.filter((p: any) => (p?.estoque || 0) <= (p?.alerta_estoque || 10)).length

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <PageHeader
        title="Painel"
        description="Visão geral do seu negócio."
        actions={
          <Button className="bg-amber-500 hover:bg-amber-600 text-black text-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        }
      />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard variant="green" title="Vendas" value={formatBRL(vendasTotais)} rightIcon="$" />
        <StatCard variant="blue" title="Clientes" value={String(customers.length)} rightIcon="users" />
        <StatCard variant="orange" title="Pedidos" value={String(orders.length)} rightIcon="cart" />
        <StatCard
          variant="red"
          title="Estoque"
          value={String(products.length)}
          subtitle={lowCount > 0 ? `${lowCount} produtos com estoque baixo` : "Estoque ok"}
          rightIcon="box"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <SalesChart orders={orders} defaultRange="today" />

        <Card className="hc-panel">
          <CardHeader className="border-b hc-divider">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Alerta de Estoque Baixo
            </CardTitle>
            <p className="text-sm hc-muted mt-2">Produtos que precisam de reposição urgente.</p>
          </CardHeader>
          <CardContent className="hc-muted py-4">
            <LowStockList />
            {lowCount > 0 && <div className="text-amber-400 text-sm mt-3 text-right">Ver todos ({lowCount})</div>}
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <ProfitChart orders={orders} />
      </div>
    </div>
  )
}

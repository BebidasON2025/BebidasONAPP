"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyReportCard } from "@/components/daily-report-card"
import { formatBRL } from "@/lib/format"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase-client"
import { BarChart3, TrendingUp, Package, DollarSign, Download, FileText, PieChartIcon, Calendar } from "lucide-react"
import { downloadJSON, downloadCSV } from "@/lib/download-utils"

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"]

type PeriodType = "today" | "7days" | "1month"

export default function RelatoriosPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("today")
  const [data, setData] = useState({
    products: [],
    customers: [],
    orders: [],
    loading: true,
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
        console.error("Error loading data:", error)
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    loadData()
  }, [])

  const todayDate = new Date().toISOString().split("T")[0]

  const filteredData = useMemo(() => {
    const now = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case "today":
        startDate.setHours(0, 0, 0, 0)
        break
      case "7days":
        startDate.setDate(now.getDate() - 7)
        break
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const filteredOrders = data.orders.filter((order: any) => {
      const orderDate = new Date(order.criado_em || order.created_at)
      return orderDate >= startDate
    })

    const paidOrders = filteredOrders.filter((o: any) => o?.status?.toLowerCase() === "pago")

    return {
      orders: filteredOrders,
      paidOrders,
      products: data.products,
      customers: data.customers,
    }
  }, [data, selectedPeriod])

  const metrics = useMemo(() => {
    const { paidOrders, products } = filteredData

    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0
    let productsSold = 0
    const productProfits: { [key: string]: { profit: number; quantity: number; revenue: number; cost: number } } = {}

    paidOrders.forEach((order: any) => {
      const orderTotal = Number(order.total || 0)
      totalRevenue += orderTotal

      if (order.itens) {
        try {
          const items = typeof order.itens === "string" ? JSON.parse(order.itens) : order.itens
          items.forEach((item: any) => {
            const product = products.find((p: any) => p.nome === item.produto_nome || p.nome === item.nome)
            if (product) {
              const quantity = Number(item.quantidade || 1)
              const sellingPrice = Number(item.preco_unitario || item.preco || product.preco || 0)
              const purchasePrice = Number(product.preco_compra || 0)
              const itemRevenue = sellingPrice * quantity
              const itemCost = purchasePrice * quantity
              const itemProfit = itemRevenue - itemCost

              totalCost += itemCost
              totalProfit += itemProfit
              productsSold += quantity

              if (!productProfits[product.nome]) {
                productProfits[product.nome] = { profit: 0, quantity: 0, revenue: 0, cost: 0 }
              }
              productProfits[product.nome].profit += itemProfit
              productProfits[product.nome].quantity += quantity
              productProfits[product.nome].revenue += itemRevenue
              productProfits[product.nome].cost += itemCost
            }
          })
        } catch (error) {
          console.error("Error parsing order items:", error)
        }
      }
    })

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      averageTicket,
      productsSold,
      totalOrders: filteredData.orders.length,
      paidOrders: paidOrders.length,
      productProfits: Object.entries(productProfits)
        .map(([name, data]) => ({
          name,
          ...data,
          profitMargin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit),
    }
  }, [filteredData])

  const periodLabels = {
    today: "Hoje",
    "7days": "Últimos 7 dias",
    "1month": "Último mês",
  }

  function exportarJSON() {
    const reportData = {
      period: selectedPeriod,
      periodLabel: periodLabels[selectedPeriod],
      generatedAt: new Date().toISOString(),
      metrics,
      orders: filteredData.paidOrders,
      products: filteredData.products,
    }
    downloadJSON(reportData, `relatorio-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`)
  }

  function exportarCSV() {
    const rows = filteredData.paidOrders.map((order: any) => ({
      data: order.criado_em || order.created_at,
      cliente: order.cliente_nome || "N/A",
      total: order.total,
      status: order.status,
      metodo_pagamento: order.metodo_pagamento || "N/A",
    }))
    downloadCSV(rows, `relatorio-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.csv`)
  }

  if (data.loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <PageHeader title="Relatórios" description="Carregando dados..." />
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Carregando relatórios...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500" id="report-root">
      <PageHeader
        title="Relatórios Completos"
        description={`Relatório detalhado - ${periodLabels[selectedPeriod]}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="secondary"
              onClick={exportarJSON}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="secondary"
              onClick={exportarCSV}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        }
      />

      <DailyReportCard date={todayDate} />

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">Período:</span>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("today")}
                className={selectedPeriod === "today" ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}
              >
                Hoje
              </Button>
              <Button
                variant={selectedPeriod === "7days" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("7days")}
                className={selectedPeriod === "7days" ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}
              >
                7 dias
              </Button>
              <Button
                variant={selectedPeriod === "1month" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod("1month")}
                className={selectedPeriod === "1month" ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}
              >
                1 mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Receita Total</p>
                <p className="text-2xl font-bold text-white">{formatBRL(metrics.totalRevenue)}</p>
                <p className="text-xs text-slate-400">{metrics.paidOrders} pedidos pagos</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-400">Custo Total</p>
                <p className="text-2xl font-bold text-white">{formatBRL(metrics.totalCost)}</p>
                <p className="text-xs text-slate-400">{metrics.productsSold} produtos vendidos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-400 rotate-180" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${metrics.totalProfit >= 0 ? "from-blue-500/10 to-blue-600/5 border-blue-500/20" : "from-orange-500/10 to-orange-600/5 border-orange-500/20"} hover:border-opacity-40 transition-all duration-300`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                  {formatBRL(metrics.totalProfit)}
                </p>
                <p className="text-xs text-slate-400">Margem: {metrics.profitMargin.toFixed(1)}%</p>
              </div>
              <DollarSign className={`h-8 w-8 ${metrics.totalProfit >= 0 ? "text-blue-400" : "text-orange-400"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Ticket Médio</p>
                <p className="text-2xl font-bold text-white">{formatBRL(metrics.averageTicket)}</p>
                <p className="text-xs text-slate-400">{metrics.totalOrders} pedidos totais</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="pb-4 border-b border-slate-800">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            Relatório Detalhado - {periodLabels[selectedPeriod]}
          </CardTitle>
          <p className="text-sm text-slate-400">Resumo completo de entradas, saídas e lucratividade</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Resumo Financeiro
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Receita Bruta:</span>
                  <span className="text-green-400 font-medium">{formatBRL(metrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Custo dos Produtos:</span>
                  <span className="text-red-400 font-medium">-{formatBRL(metrics.totalCost)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="text-white font-medium">Lucro Líquido:</span>
                  <span className={`font-bold ${metrics.totalProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                    {formatBRL(metrics.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Margem de Lucro:</span>
                  <span className="text-amber-400 font-medium">{metrics.profitMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Indicadores de Vendas
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total de Pedidos:</span>
                  <span className="text-blue-400 font-medium">{metrics.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Pedidos Pagos:</span>
                  <span className="text-green-400 font-medium">{metrics.paidOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Produtos Vendidos:</span>
                  <span className="text-purple-400 font-medium">{metrics.productsSold} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Ticket Médio:</span>
                  <span className="text-amber-400 font-medium">{formatBRL(metrics.averageTicket)}</span>
                </div>
              </div>
            </div>
          </div>

          {metrics.productProfits.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                Top 5 Produtos Mais Lucrativos
              </h4>
              <div className="space-y-2">
                {metrics.productProfits.slice(0, 5).map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold text-sm">#{index + 1}</span>
                      <span className="text-white font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{formatBRL(product.profit)}</div>
                      <div className="text-xs text-slate-400">
                        {product.quantity} vendidos • {product.profitMargin.toFixed(1)}% margem
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
          <TabsTrigger
            value="vendas"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
          >
            Vendas
          </TabsTrigger>
          <TabsTrigger
            value="categorias"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="metodos"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            Métodos
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas">
          <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
            <CardHeader className="pb-4 border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                Evolução das Vendas
              </CardTitle>
              <p className="text-sm text-slate-400">Vendas por período selecionado</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 relative">
                {filteredData.paidOrders.length > 0 ? (
                  <div className="h-full flex flex-col relative">
                    {/* Background grid */}
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage: `
                          linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                          backgroundSize: "40px 40px",
                        }}
                      />
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex items-end gap-3 px-6 relative z-10">
                      {(() => {
                        // Group orders by date
                        const salesByDate = filteredData.paidOrders.reduce((acc: any, order: any) => {
                          const date = new Date(order.criado_em || order.created_at).toLocaleDateString("pt-BR", {
                            month: "short",
                            day: "2-digit",
                          })
                          if (!acc[date]) acc[date] = 0
                          acc[date] += Number(order.total || 0)
                          return acc
                        }, {})

                        const maxValue = Math.max(...Object.values(salesByDate))
                        const entries = Object.entries(salesByDate)

                        return entries.map(([date, value]: [string, any], index) => (
                          <div key={date} className="flex-1 flex flex-col items-center group relative">
                            {/* Glow effect */}
                            <div
                              className="absolute bottom-0 w-full opacity-0 group-hover:opacity-30 transition-all duration-500 blur-xl"
                              style={{
                                height: `${(value / maxValue) * 100}%`,
                                minHeight: "8px",
                                background: "linear-gradient(to top, #f59e0b, #fbbf24, #fcd34d)",
                              }}
                            />

                            {/* Main bar */}
                            <div
                              className="w-full relative rounded-t-xl transition-all duration-700 ease-out transform hover:scale-105 cursor-pointer"
                              style={{
                                height: `${(value / maxValue) * 100}%`,
                                minHeight: "8px",
                                background: `linear-gradient(135deg, 
                                  #f59e0b 0%, 
                                  #fbbf24 25%, 
                                  #fcd34d 50%, 
                                  #fde047 75%, 
                                  #facc15 100%
                                )`,
                                boxShadow: `
                                  0 4px 20px rgba(245, 158, 11, 0.3),
                                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                                `,
                                animation: `slideUp 0.8s ease-out ${index * 0.1}s both`,
                              }}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 rounded-t-xl overflow-hidden">
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                  style={{
                                    background:
                                      "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                                    transform: "translateX(-100%)",
                                    animation: "shimmer 2s infinite",
                                  }}
                                />
                              </div>

                              {/* Top highlight */}
                              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl" />
                            </div>

                            {/* Date label */}
                            <div className="mt-3 text-xs font-medium text-slate-400 group-hover:text-amber-300 transition-colors duration-300">
                              {date}
                            </div>

                            {/* Value tooltip */}
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                              <div className="bg-slate-800/95 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-2 shadow-xl">
                                <div className="text-xs text-amber-400 font-bold whitespace-nowrap">
                                  {formatBRL(value)}
                                </div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800/95" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>

                    {/* Total summary */}
                    <div className="mt-6 text-center relative z-10">
                      <div className="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-full px-6 py-3">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-slate-300">Total do período:</span>
                        <span className="text-lg font-bold text-amber-400">{formatBRL(metrics.totalRevenue)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="relative mb-6">
                        <TrendingUp className="h-16 w-16 mx-auto opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                      </div>
                      <p className="text-lg font-medium">Nenhuma venda registrada</p>
                      <p className="text-sm opacity-70">para o período selecionado</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
            <CardHeader className="pb-4 border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-400" />
                Vendas por Categoria
              </CardTitle>
              <p className="text-sm text-slate-400">Distribuição de vendas por categoria</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-end gap-2 px-4">
                    {(() => {
                      // Group orders by category
                      const salesByCategory = filteredData.orders.reduce((acc: any, order: any) => {
                        if (order.itens) {
                          try {
                            const items = typeof order.itens === "string" ? JSON.parse(order.itens) : order.itens
                            items.forEach((item: any) => {
                              const category = item.categoria || "N/A"
                              const existing = acc.find((a: any) => a.name === category)
                              if (existing) {
                                existing.value +=
                                  Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1)
                              } else {
                                acc.push({
                                  name: category,
                                  value: Number(item.preco_unitario || item.preco || 0) * Number(item.quantidade || 1),
                                })
                              }
                            })
                          } catch (error) {
                            console.error("Error parsing order items:", error)
                          }
                        }
                        return acc
                      }, [])

                      const maxValue = Math.max(...salesByCategory.map((entry: any) => entry.value))

                      return salesByCategory.map((entry: any, index: number) => (
                        <div key={entry.name} className="flex-1 flex flex-col items-center group">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-400 hover:to-blue-300 relative overflow-hidden"
                            style={{ height: `${(entry.value / maxValue) * 100}%`, minHeight: "4px" }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="mt-2 text-xs text-slate-400 text-center">{entry.name}</div>
                          <div className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {formatBRL(entry.value)}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-slate-400">
                      Total: <span className="text-blue-400 font-medium">{formatBRL(metrics.totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metodos">
          <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
            <CardHeader className="pb-4 border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Métodos de Pagamento
              </CardTitle>
              <p className="text-sm text-slate-400">Vendas por método de pagamento</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-end gap-2 px-4">
                    {(() => {
                      // Group orders by payment method
                      const salesByMethod = filteredData.orders.reduce((acc: any, order: any) => {
                        const method = order.metodo_pagamento || "N/A"
                        const existing = acc.find((a: any) => a.name === method)
                        if (existing) {
                          existing.value += Number(order.total || 0)
                        } else {
                          acc.push({ name: method, value: Number(order.total || 0) })
                        }
                        return acc
                      }, [])

                      const maxValue = Math.max(...salesByMethod.map((entry: any) => entry.value))

                      return salesByMethod.map((entry: any, index: number) => (
                        <div key={entry.name} className="flex-1 flex flex-col items-center group">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-400 hover:to-green-300 relative overflow-hidden"
                            style={{ height: `${(entry.value / maxValue) * 100}%`, minHeight: "4px" }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="mt-2 text-xs text-slate-400 text-center">{entry.name}</div>
                          <div className="text-xs text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {formatBRL(entry.value)}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-sm text-slate-400">
                      Total: <span className="text-green-400 font-medium">{formatBRL(metrics.totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400">Receitas</p>
                    <p className="text-2xl font-bold text-white">{formatBRL(metrics.totalRevenue)}</p>
                    <p className="text-xs text-slate-400">{metrics.paidOrders} pedidos pagos</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-400">Despesas</p>
                    <p className="text-2xl font-bold text-white">{formatBRL(metrics.totalCost)}</p>
                    <p className="text-xs text-slate-400">{metrics.productsSold} produtos vendidos</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-400 rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br ${metrics.totalProfit >= 0 ? "from-blue-500/10 to-blue-600/5 border-blue-500/20" : "from-orange-500/10 to-orange-600/5 border-orange-500/20"}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Lucro/Prejuízo</p>
                    <p
                      className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}
                    >
                      {formatBRL(metrics.totalProfit)}
                    </p>
                    <p className="text-xs text-slate-400">Margem: {metrics.profitMargin.toFixed(1)}%</p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${metrics.totalProfit >= 0 ? "text-blue-400" : "text-orange-400"}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
            <CardHeader className="pb-4 border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Resumo Financeiro
              </CardTitle>
              <p className="text-sm text-slate-400">Análise completa das finanças</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-slate-400">
                {filteredData.orders.length === 0 ? (
                  <p>Adicione lançamentos financeiros para ver análises detalhadas.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-left">
                      <h4 className="font-semibold text-white mb-2">Resumo do Período</h4>
                      <p className="text-sm text-slate-300">Total de transações: {filteredData.orders.length}</p>
                      <p className="text-sm text-slate-300">Entradas: {filteredData.paidOrders.length}</p>
                      <p className="text-sm text-slate-300">
                        Saídas: {filteredData.orders.length - filteredData.paidOrders.length}
                      </p>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-white mb-2">Indicadores</h4>
                      <p className="text-sm text-slate-300">Margem: {metrics.profitMargin.toFixed(1)}%</p>
                      <p className="text-sm text-slate-300">Ticket médio: {formatBRL(metrics.averageTicket)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

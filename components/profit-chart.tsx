"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TrendingUp, DollarSign, Package, Eye, BarChart3 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase-client"
import { formatBRL } from "@/lib/format"

interface ProfitChartProps {
  orders: any[]
}

interface ProductDetail {
  name: string
  fullName: string
  profit: number
  quantity: number
  profitPerUnit: number
  sellingPrice: number
  purchasePrice: number
  profitMargin: number
  currentStock: number
}

export default function ProfitChart({ orders }: ProfitChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "7days" | "1month">("today")
  const [products, setProducts] = useState<any[]>([])
  const [percentage, setPercentage] = useState<number>(0)
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    console.log("[v0] ProfitChart received orders:", orders.length)
    console.log("[v0] ProfitChart orders sample:", orders.slice(0, 2))
    orders.forEach((order, index) => {
      console.log(`[v0] ProfitChart order ${index} itens:`, order.itens)
    })
  }, [orders])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase.from("produtos").select("*")
        console.log("[v0] ProfitChart loaded products:", data?.length)
        console.log("[v0] ProfitChart products with preco_compra:", data?.filter((p) => p.preco_compra > 0).length)
        setProducts(data || [])
      } catch (error) {
        console.error("Error loading products:", error)
      }
    }
    loadProducts()
  }, [])

  const profitData = useMemo(() => {
    console.log("[v0] ProfitChart calculating profit data...")
    if (!products.length || !orders.length) {
      console.log("[v0] ProfitChart: No products or orders available")
      return []
    }

    const now = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case "today":
        startDate.setHours(0, 0, 0, 0)
        break
      case "7days":
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case "1month":
        startDate.setMonth(now.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
    }

    const filteredOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.criado_em || order.created_at || order.data)
      const isInPeriod = orderDate >= startDate && order.status?.toLowerCase() === "pago"
      console.log(`[v0] ProfitChart order ${order.id}: ${orderDate.toISOString()}, inPeriod: ${isInPeriod}`)
      return isInPeriod
    })

    console.log("[v0] ProfitChart filtered orders:", filteredOrders.length)

    const productProfits: {
      [key: string]: {
        name: string
        profit: number
        quantity: number
        sellingPrice: number
        purchasePrice: number
        currentStock: number
      }
    } = {}

    filteredOrders.forEach((order: any) => {
      const orderItems = order.itens || []
      console.log(`[v0] ProfitChart order ${order.id} has ${orderItems.length} items`)

      orderItems.forEach((item: any) => {
        const product = products.find((p) => p.id === item.produto_id)
        if (product && product.preco_compra > 0) {
          const sellingPrice = Number(item.preco || item.preco_unitario || product.preco || 0)
          const purchasePrice = Number(product.preco_compra || 0)
          const quantity = Number(item.qtd || item.quantidade || 1)
          const profitPerUnit = sellingPrice - purchasePrice
          const totalProfit = profitPerUnit * quantity

          const productName = item.nome || product.nome
          if (!productProfits[productName]) {
            productProfits[productName] = {
              name: productName,
              profit: 0,
              quantity: 0,
              sellingPrice: sellingPrice,
              purchasePrice: purchasePrice,
              currentStock: Number(product.estoque || 0),
            }
          }
          productProfits[productName].profit += totalProfit
          productProfits[productName].quantity += quantity
        }
      })
    })

    const result = Object.values(productProfits)
      .filter((item) => item.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map((item) => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
        fullName: item.name,
        profit: item.profit,
        quantity: item.quantity,
        profitPerUnit: item.profit / item.quantity,
        sellingPrice: item.sellingPrice,
        purchasePrice: item.purchasePrice,
        profitMargin: item.sellingPrice > 0 ? ((item.sellingPrice - item.purchasePrice) / item.sellingPrice) * 100 : 0,
        currentStock: item.currentStock,
      }))

    console.log("[v0] ProfitChart calculated profit data:", result.length, "products")
    console.log("[v0] ProfitChart profit data sample:", result.slice(0, 2))

    const maxProfit = Math.max(...result.map((d) => d.profit))
    setPercentage(maxProfit > 0 ? (result[0]?.profit / maxProfit) * 100 : 0)

    return result
  }, [orders, products, selectedPeriod])

  const totalProfit = profitData.reduce((sum, item) => sum + item.profit, 0)

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-green-400">Lucro Total: {formatBRL(data.profit)}</p>
          <p className="text-blue-400">Lucro/Unidade: {formatBRL(data.profitPerUnit)}</p>
          <p className="text-gray-300">Vendidos: {data.quantity} unid.</p>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Card className="hc-panel">
        <CardHeader className="border-b hc-divider">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <CardTitle className="text-base">Lucro por Produto</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-semibold">{formatBRL(totalProfit)}</span>
            </div>
          </div>
          <p className="text-sm hc-muted mt-2">Produtos mais lucrativos no período selecionado.</p>

          <div className="flex gap-2 mt-4">
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
        </CardHeader>

        <CardContent className="p-6">
          {profitData.length > 0 ? (
            <div className="h-80 space-y-4">
              <div className="text-xs text-gray-400 mb-6 font-medium tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse" />
                Top produtos mais lucrativos • Clique para ver detalhes
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent">
                {profitData.map((item, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => handleProductClick(item)}
                      className="group space-y-2 p-4 rounded-xl bg-gradient-to-r from-gray-800/40 to-gray-700/30 backdrop-blur-sm border border-gray-700/40 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
                          <span className="text-gray-300 font-medium group-hover:text-green-400 transition-colors">
                            {item.name}
                          </span>
                          <Eye className="h-4 w-4 text-gray-500 group-hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-lg drop-shadow-sm">
                            {formatBRL(item.profit)}
                          </span>
                          <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                            #{index + 1}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-full h-6 relative overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-400 rounded-full transition-all duration-1000 ease-out relative group-hover:from-green-400 group-hover:via-emerald-300 group-hover:to-teal-400"
                          style={{
                            width: `${Math.max((item.profit / totalProfit) * 100, 10)}%`,
                            animation: `expandBar 1.2s ease-out ${index * 150}ms both`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 bg-gray-800/30 px-2 py-1 rounded-md">
                            {item.quantity} vendidos
                          </span>
                          <span className="text-emerald-400 font-medium">{formatBRL(item.profitPerUnit)}/unid</span>
                        </div>
                        <div className="text-gray-400">{((item.profit / totalProfit) * 100).toFixed(1)}% do total</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center p-8 rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-700/20 backdrop-blur-sm border border-gray-700/30">
                <div className="relative mb-4">
                  <TrendingUp className="h-16 w-16 text-gray-500 mx-auto animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-shimmer-slow" />
                </div>
                <p className="text-gray-400 font-medium">Nenhum lucro registrado para o período selecionado.</p>
                <p className="text-gray-500 text-sm mt-2">Faça algumas vendas para ver os dados aqui!</p>
              </div>
            </div>
          )}

          <style jsx>{`
            @keyframes expandBar {
              from {
                width: 0%;
                opacity: 0;
              }
              to {
                width: 100%;
                opacity: 1;
              }
            }
            
            @keyframes shimmer-slow {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
            
            .animate-shimmer-slow {
              animation: shimmer-slow 3s infinite;
            }
            
            .scrollbar-thin::-webkit-scrollbar {
              width: 4px;
            }
            
            .scrollbar-thumb-green-500\/20::-webkit-scrollbar-thumb {
              background-color: rgba(34, 197, 94, 0.2);
              border-radius: 2px;
            }
            
            .scrollbar-track-transparent::-webkit-scrollbar-track {
              background: transparent;
            }
          `}</style>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-400" />
              Detalhes do Produto
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">{selectedProduct.fullName}</h3>
                <div className="text-3xl font-bold text-green-400">{formatBRL(selectedProduct.profit)}</div>
                <div className="text-sm text-slate-400">Lucro total no período</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Preço de Venda</span>
                  </div>
                  <div className="text-xl font-bold text-blue-400">{formatBRL(selectedProduct.sellingPrice)}</div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-slate-300">Preço de Compra</span>
                  </div>
                  <div className="text-xl font-bold text-red-400">{formatBRL(selectedProduct.purchasePrice)}</div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-slate-300">Lucro/Unidade</span>
                  </div>
                  <div className="text-xl font-bold text-green-400">{formatBRL(selectedProduct.profitPerUnit)}</div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-slate-300">Margem de Lucro</span>
                  </div>
                  <div className="text-xl font-bold text-amber-400">{selectedProduct.profitMargin.toFixed(1)}%</div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-slate-300">Qtd. Vendida</span>
                  </div>
                  <div className="text-xl font-bold text-purple-400">{selectedProduct.quantity} unid.</div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Estoque Atual</span>
                  </div>
                  <div className="text-xl font-bold text-slate-400">{selectedProduct.currentStock} unid.</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { formatBRL } from "@/lib/format"
import { format, subDays, addDays, startOfDay, endOfDay, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { OrderDetailsModal } from "@/components/order-details-modal"

type Order = {
  id?: string | number
  numero_pedido?: string
  total?: number | string
  status?: string
  created_at?: string
  createdAt?: string
  date?: string
  data?: string
  cliente_nome_texto?: string
  metodo?: string
}

function getOrderDate(o: Order): Date | null {
  const raw = (o.created_at as string) || (o.createdAt as string) || (o.date as string) || (o.data as string)
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function toNumber(n: unknown) {
  const v = Number(n)
  return isNaN(v) ? 0 : v
}

function buildDailySales(orders: Order[], selectedDate: Date) {
  const paid = (orders || []).filter((o) => (o.status || "").toLowerCase() === "pago")

  const dayStart = startOfDay(selectedDate)
  const dayEnd = endOfDay(selectedDate)

  // Create hourly buckets for the selected day
  const buckets = Array.from({ length: 24 }).map((_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, "0")}:00`,
    total: 0,
    count: 0,
    orders: [] as Order[], // Add orders array to track individual orders per hour
  }))

  // Fill buckets with order data
  for (const order of paid) {
    const orderDate = getOrderDate(order)
    if (!orderDate) continue

    if (orderDate >= dayStart && orderDate <= dayEnd) {
      const hour = orderDate.getHours()
      buckets[hour].total += toNumber(order.total)
      buckets[hour].count += 1
      buckets[hour].orders.push(order) // Store individual orders
    }
  }

  return buckets.filter((bucket) => bucket.total > 0)
}

function getDayStats(orders: Order[], selectedDate: Date) {
  const paid = (orders || []).filter((o) => (o.status || "").toLowerCase() === "pago")

  const dayStart = startOfDay(selectedDate)
  const dayEnd = endOfDay(selectedDate)

  const dayOrders = paid.filter((order) => {
    const orderDate = getOrderDate(order)
    return orderDate && orderDate >= dayStart && orderDate <= dayEnd
  })

  const totalSales = dayOrders.reduce((sum, order) => sum + toNumber(order.total), 0)
  const totalOrders = dayOrders.length

  return { totalSales, totalOrders }
}

export default function DailySalesChart({ orders = [] }: { orders?: Order[] }) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = React.useState(false)

  const dailyData = React.useMemo(() => {
    return buildDailySales(orders, selectedDate)
  }, [orders, selectedDate])

  const dayStats = React.useMemo(() => {
    return getDayStats(orders, selectedDate)
  }, [orders, selectedDate])

  const maxValue = React.useMemo(() => {
    return Math.max(...dailyData.map((d) => d.total), 1)
  }, [dailyData])

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId)
    setOrderDetailsOpen(true)
  }

  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1))
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const isToday = isSameDay(selectedDate, new Date())
  const isFutureDate = selectedDate > new Date()

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 shadow-2xl">
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-amber-400">📊</span>
              Vendas por Dia
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousDay}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 min-w-[140px] bg-transparent"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date)
                        setCalendarOpen(false)
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDay}
                disabled={isFutureDate}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 bg-transparent"
                >
                  Hoje
                </Button>
              )}
            </div>
          </div>

          {/* Day Summary */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400">Total de Vendas</p>
              <p className="text-xl font-bold text-white">{formatBRL(dayStats.totalSales)}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400">Pedidos</p>
              <p className="text-xl font-bold text-white">{dayStats.totalOrders}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {dailyData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-lg font-medium">Nenhuma venda registrada</p>
              <p className="text-sm">
                {isToday
                  ? "Ainda não há vendas hoje"
                  : `Não houve vendas em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-400 font-medium">
                Vendas por horário - {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dailyData.map((item, index) => {
                  const percentage = (item.total / maxValue) * 100

                  return (
                    <div key={item.hour} className="space-y-2">
                      <div
                        className="group flex items-center gap-4 py-3 px-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-700/50 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-16 text-sm text-slate-400 font-mono font-medium group-hover:text-amber-400 transition-colors">
                          {item.label}
                        </div>

                        <div className="flex-1 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full h-10 relative overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-1000 ease-out flex items-center justify-between px-4 relative group-hover:from-amber-400 group-hover:via-yellow-400 group-hover:to-orange-400"
                            style={{
                              width: `${Math.max(percentage, 12)}%`,
                            }}
                          >
                            <span className="text-xs font-medium text-black/80">
                              {item.count} {item.count === 1 ? "pedido" : "pedidos"}
                            </span>
                            <span className="text-sm font-bold text-black drop-shadow-sm">{formatBRL(item.total)}</span>
                          </div>
                        </div>
                      </div>

                      {item.orders.length > 0 && (
                        <div className="ml-20 space-y-1">
                          {item.orders.map((order) => (
                            <button
                              key={order.id}
                              onClick={() => handleOrderClick(String(order.id))}
                              className="w-full text-left p-2 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-slate-400 group-hover:text-amber-400" />
                                  <span className="text-xs text-slate-300 group-hover:text-white">
                                    {order.numero_pedido || `Pedido ${order.id}`}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    • {order.cliente_nome_texto || "Cliente"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">{order.metodo}</span>
                                  <span className="text-xs font-medium text-green-400">
                                    {formatBRL(toNumber(order.total))}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsModal orderId={selectedOrderId} open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen} />
    </>
  )
}

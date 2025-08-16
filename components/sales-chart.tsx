"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/format"

type Order = {
  id?: string | number
  total?: number | string
  status?: string
  created_at?: string
  createdAt?: string
  date?: string
  data?: string
}

type RangeKey = "today" | "week" | "month"

function getOrderDate(o: Order): Date | null {
  const raw = (o.created_at as string) || (o.createdAt as string) || (o.date as string) || (o.data as string)
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfNDaysAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function ddmm(d: Date) {
  const day = String(d.getDate()).padStart(2, "0")
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${mo}`
}

function hh(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:00`
}

function toNumber(n: unknown) {
  const v = Number(n)
  return isNaN(v) ? 0 : v
}

function buildSeries(orders: Order[], range: RangeKey) {
  const paid = (orders || []).filter((o) => (o.status || "").toLowerCase() === "pago")

  if (range === "today") {
    const now = new Date()
    // Force timezone to local and get fresh date string
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

    console.log(`[v0] SalesChart: Current timestamp: ${now.toISOString()}`)
    console.log(`[v0] SalesChart: Today calculated as: ${todayStr}`)

    const buckets = Array.from({ length: 24 }).map((_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      keyHour: h,
      total: 0,
    }))

    for (const o of paid) {
      const d = getOrderDate(o)
      if (!d) continue

      const orderStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      console.log(`[v0] SalesChart: Order date: ${d.toISOString()}, normalized: ${orderStr}, today: ${todayStr}`)

      if (orderStr === todayStr) {
        const h = d.getHours()
        buckets[h].total += toNumber(o.total)
        console.log(`[v0] SalesChart: Adding R$ ${o.total} to hour ${h}`)
      } else {
        console.log(`[v0] SalesChart: Skipping order from ${orderStr} (not today: ${todayStr})`)
      }
    }
    return buckets
  }

  if (range === "week") {
    const start = startOfNDaysAgo(6) // 7 pontos incluindo hoje
    const map = new Map<string, { label: string; total: number; keyDate: string }>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      map.set(key, { label: ddmm(d), total: 0, keyDate: key })
    }
    for (const o of paid) {
      const d = getOrderDate(o)
      if (!d) continue
      if (d >= start) {
        const key = d.toISOString().slice(0, 10)
        const bucket = map.get(key)
        if (bucket) bucket.total += toNumber(o.total)
      }
    }
    return Array.from(map.values())
  }

  // month
  const start = startOfNDaysAgo(29) // 30 pontos
  const map = new Map<string, { label: string; total: number; keyDate: string }>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, { label: ddmm(d), total: 0, keyDate: key })
  }
  for (const o of paid) {
    const d = getOrderDate(o)
    if (!d) continue
    if (d >= start) {
      const key = d.toISOString().slice(0, 10)
      const bucket = map.get(key)
      if (bucket) bucket.total += toNumber(o.total)
    }
  }
  return Array.from(map.values())
}

function EmptyState({ text = "Nenhuma venda registrada para o período." }) {
  return <div className="hc-muted py-10 text-center">{text}</div>
}

export default function SalesChart({
  orders = [],
  defaultRange = "today",
}: {
  orders?: Order[]
  defaultRange?: RangeKey
}) {
  const [range, setRange] = React.useState<RangeKey>(defaultRange)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  React.useEffect(() => {
    console.log("[v0] SalesChart received orders:", orders.length)
    console.log("[v0] SalesChart orders sample:", orders.slice(0, 2))
    const paidOrders = orders.filter((o) => (o.status || "").toLowerCase() === "pago")
    console.log("[v0] SalesChart paid orders:", paidOrders.length)

    if (range === "today") {
      const now = new Date()
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      console.log(`[v0] SalesChart: Debug - Today is: ${todayStr}`)

      paidOrders.forEach((order, index) => {
        const orderDate = getOrderDate(order)
        if (orderDate) {
          const orderStr = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)
          const isToday = orderStr === todayStr
          console.log(
            `[v0] SalesChart order ${index}: ${orderDate.toISOString()}, orderDate: ${orderStr}, today: ${todayStr}, isToday: ${isToday}, total: ${order.total}`,
          )
        }
      })
    }

    const timer = setTimeout(() => forceUpdate(), 100)
    return () => clearTimeout(timer)
  }, [orders, range])

  const data = React.useMemo(() => {
    const result = buildSeries(orders, range)
    console.log("[v0] SalesChart data points:", result.length)
    console.log("[v0] SalesChart data sample:", result.slice(0, 3))
    if (range === "today") {
      const hour21 = result.find((item: any) => item.keyHour === 21)
      if (hour21) {
        console.log("[v0] SalesChart hour 21 data:", hour21)
      }
    }
    return result
  }, [orders, range])

  const totalPeriodo = React.useMemo(() => {
    const total = data.reduce((s, p: any) => s + toNumber(p.total), 0)
    console.log("[v0] SalesChart total for period:", total)
    return total
  }, [data])

  return (
    <Card className="hc-panel">
      <CardHeader className="border-b hc-divider">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-amber-400">{"$"}</span>{" "}
            {range === "today" ? "Vendas - Hoje" : range === "week" ? "Vendas - 7 dias" : "Vendas - 30 dias"}
            <span className="text-xs hc-muted font-normal">Total: {formatBRL(totalPeriodo)}</span>
          </CardTitle>

          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList className="bg-[#1d2430] border border-[#3f4b60]">
              <TabsTrigger value="today" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                Hoje
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                7 dias
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                30 dias
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {data.every((d: any) => toNumber(d.total) === 0) ? (
          <EmptyState />
        ) : (
          <div className="h-64 space-y-3">
            <div className="text-xs text-gray-400 mb-6 font-medium tracking-wide">
              Vendas por {range === "today" ? "hora" : "período"}
            </div>
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {data.map((item: any, index: number) => {
                const value = toNumber(item.total)
                const maxValue = Math.max(...data.map((d: any) => toNumber(d.total)))
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

                if (value === 0) return null

                return (
                  <div
                    key={index}
                    className="group flex items-center gap-4 py-2 px-3 rounded-xl bg-gradient-to-r from-gray-800/30 to-gray-700/20 backdrop-blur-sm border border-gray-700/30 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
                  >
                    <div className="w-14 text-xs text-gray-400 font-mono font-medium group-hover:text-amber-400 transition-colors">
                      {item.label}
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full h-8 relative overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 relative group-hover:from-amber-400 group-hover:via-yellow-400 group-hover:to-orange-400"
                        style={{
                          width: `${Math.max(percentage, 8)}%`,
                        }}
                      >
                        <span className="text-xs font-bold text-black drop-shadow-sm relative z-10">
                          {formatBRL(value)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

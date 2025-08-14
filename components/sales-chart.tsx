"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
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
    const start = startOfToday()
    const buckets = Array.from({ length: 24 }).map((_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      keyHour: h,
      total: 0,
    }))
    for (const o of paid) {
      const d = getOrderDate(o)
      if (!d) continue
      if (d >= start && sameDay(d, start)) {
        const h = d.getHours()
        buckets[h].total += toNumber(o.total)
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
  const data = React.useMemo(() => buildSeries(orders, range), [orders, range])
  const totalPeriodo = React.useMemo(() => data.reduce((s, p: any) => s + toNumber(p.total), 0), [data])

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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2a3342" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#9aa4b2" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9aa4b2"
                  tickFormatter={(v) => formatBRL(v).replace("R$ ", "")}
                  width={60}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#121721",
                    border: "1px solid #3f4b60",
                    borderRadius: 8,
                    color: "#e5e7eb",
                  }}
                  formatter={(value: any) => [formatBRL(value as number), "Vendas"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                  isAnimationActive
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

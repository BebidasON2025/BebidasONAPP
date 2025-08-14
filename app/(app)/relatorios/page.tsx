"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store"
import { formatBRL } from "@/lib/format"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { downloadJSON, downloadCSV } from "@/lib/download"
import { BarChart3, TrendingUp, Users, Package, DollarSign, Download, FileText, PieChartIcon } from "lucide-react"

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"]

export default function RelatoriosPage() {
  const store = useAppStore()
  const entradas = store.finance.entries.filter((e) => e.type === "entrada")
  const saidas = store.finance.entries.filter((e) => e.type === "saida")
  const vendasTotal = entradas.reduce((s, e) => s + e.amount, 0)
  const gastosTotal = saidas.reduce((s, e) => s + e.amount, 0)
  const lucroTotal = vendasTotal - gastosTotal

  const salesData = entradas
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString("pt-BR", { month: "short", day: "2-digit" }),
      value: e.amount,
    }))

  const categoryData = store.finance.entries
    .reduce(
      (acc, entry) => {
        const existing = acc.find((item) => item.name === entry.category)
        if (existing) {
          existing.value += entry.amount
        } else {
          acc.push({ name: entry.category, value: entry.amount })
        }
        return acc
      },
      [] as { name: string; value: number }[],
    )
    .slice(0, 6)

  const methodData = store.finance.entries.reduce(
    (acc, entry) => {
      const existing = acc.find((item) => item.name === entry.method)
      if (existing) {
        existing.value += entry.amount
      } else {
        acc.push({ name: entry.method, value: entry.amount })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  function exportarJSON() {
    downloadJSON(store, "bebidas-on-relatorio.json")
  }
  function exportarCSV() {
    const rows = entradas.map((e) => ({
      tipo: e.type,
      descricao: e.description,
      categoria: e.category,
      valor: e.amount,
      metodo: e.method,
      data: e.date,
    }))
    downloadCSV(rows, "financeiro.csv")
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500" id="report-root">
      <PageHeader
        title="Relatórios Avançados"
        description="Análises detalhadas e insights estratégicos do seu negócio"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Vendas Totais</p>
                <p className="text-2xl font-bold text-white">{formatBRL(vendasTotal)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Total de Pedidos</p>
                <p className="text-2xl font-bold text-white">{store.orders.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Clientes</p>
                <p className="text-2xl font-bold text-white">{store.customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">Produtos</p>
                <p className="text-2xl font-bold text-white">{store.products.length}</p>
              </div>
              <Package className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodData}>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
                    <p className="text-2xl font-bold text-white">{formatBRL(vendasTotal)}</p>
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
                    <p className="text-2xl font-bold text-white">{formatBRL(gastosTotal)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-400 rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br ${lucroTotal >= 0 ? "from-blue-500/10 to-blue-600/5 border-blue-500/20" : "from-orange-500/10 to-orange-600/5 border-orange-500/20"}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Lucro/Prejuízo</p>
                    <p className={`text-2xl font-bold ${lucroTotal >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                      {formatBRL(lucroTotal)}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${lucroTotal >= 0 ? "text-blue-400" : "text-orange-400"}`} />
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
                {store.finance.entries.length === 0 ? (
                  <p>Adicione lançamentos financeiros para ver análises detalhadas.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-left">
                      <h4 className="font-semibold text-white mb-2">Resumo do Período</h4>
                      <p className="text-sm text-slate-300">Total de transações: {store.finance.entries.length}</p>
                      <p className="text-sm text-slate-300">Entradas: {entradas.length}</p>
                      <p className="text-sm text-slate-300">Saídas: {saidas.length}</p>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-white mb-2">Indicadores</h4>
                      <p className="text-sm text-slate-300">
                        Margem: {vendasTotal > 0 ? ((lucroTotal / vendasTotal) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-slate-300">
                        Ticket médio: {formatBRL(entradas.length > 0 ? vendasTotal / entradas.length : 0)}
                      </p>
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

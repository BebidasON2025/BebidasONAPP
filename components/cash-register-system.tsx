"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Banknote, Lock, Unlock, Clock, DollarSign, TrendingUp, AlertCircle, Calendar } from "lucide-react"
import { formatBRL } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"

interface CashRegister {
  id: string
  status: "aberto" | "fechado"
  valor_inicial: number
  valor_atual: number
  data_abertura: string
  data_fechamento?: string
  vendas_total: number
  pedidos_count: number
}

export function CashRegisterSystem() {
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(false)
  const [openAmount, setOpenAmount] = useState("")
  const [openDialogOpen, setOpenDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCashRegister()

    // Check for automatic closure at midnight
    const checkMidnight = () => {
      const now = new Date()
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (cashRegister?.status === "aberto") {
          closeCashRegister(true) // Auto close
        }
      }
    }

    const interval = setInterval(checkMidnight, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [cashRegister?.status])

  const loadCashRegister = async () => {
    try {
      const res = await fetch("/api/caixa")
      if (res.ok) {
        const data = await res.json()
        setCashRegister(data.data)
      }
    } catch (error) {
      console.error("Error loading cash register:", error)
    }
  }

  const openCashRegister = async () => {
    if (!openAmount || Number.parseFloat(openAmount) < 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "Informe um valor inicial válido para abrir o caixa.",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          valor_inicial: Number.parseFloat(openAmount),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCashRegister(data.data)
        setOpenAmount("")
        setOpenDialogOpen(false)
        toast({
          variant: "success",
          title: "Caixa aberto",
          description: `Caixa aberto com valor inicial de ${formatBRL(Number.parseFloat(openAmount))}.`,
        })
      } else {
        throw new Error("Erro ao abrir caixa")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível abrir o caixa. Tente novamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const closeCashRegister = async (isAutomatic = false) => {
    setLoading(true)
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          automatic: isAutomatic,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCashRegister(data.data)
        toast({
          variant: "success",
          title: isAutomatic ? "Caixa fechado automaticamente" : "Caixa fechado",
          description: isAutomatic ? "O caixa foi fechado automaticamente à meia-noite." : "Caixa fechado com sucesso.",
        })
      } else {
        throw new Error("Erro ao fechar caixa")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fechar o caixa. Tente novamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    return status === "aberto"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getStatusIcon = (status: string) => {
    return status === "aberto" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700 shadow-2xl">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Banknote className="h-6 w-6 text-amber-400" />
          </div>
          Sistema de Caixa
          {cashRegister && (
            <Badge className={`${getStatusColor(cashRegister.status)} flex items-center gap-1 capitalize`}>
              {getStatusIcon(cashRegister.status)}
              {cashRegister.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {!cashRegister || cashRegister.status === "fechado" ? (
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Caixa Fechado</h3>
            <p className="text-slate-400 mb-6">O caixa está fechado. Abra o caixa para começar a registrar vendas.</p>

            <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-amber-400" />
                    Abrir Caixa
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="openAmount" className="text-slate-300">
                      Valor inicial do caixa
                    </Label>
                    <Input
                      id="openAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={openAmount}
                      onChange={(e) => setOpenAmount(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white mt-2"
                    />
                    <p className="text-sm text-slate-400 mt-1">
                      Informe o valor em dinheiro disponível no caixa para iniciar o dia.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={openCashRegister}
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      {loading ? "Abrindo..." : "Abrir Caixa"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cash Register Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-blue-400">Valor Inicial</p>
                    <p className="text-xl font-bold text-white">{formatBRL(cashRegister.valor_inicial)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-sm text-green-400">Vendas do Dia</p>
                    <p className="text-xl font-bold text-white">{formatBRL(cashRegister.vendas_total)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Banknote className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="text-sm text-amber-400">Total no Caixa</p>
                    <p className="text-xl font-bold text-white">{formatBRL(cashRegister.valor_atual)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Cash Register Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Informações do Caixa
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data de Abertura:</span>
                    <span className="text-white">{formatDateTime(cashRegister.data_abertura)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pedidos Processados:</span>
                    <span className="text-white">{cashRegister.pedidos_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <Badge className={`${getStatusColor(cashRegister.status)} text-xs`}>{cashRegister.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Fechamento Automático
                </h4>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Configurado para 00:00</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    O caixa será fechado automaticamente à meia-noite se estiver aberto.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Actions */}
            <div className="flex justify-center">
              <Button
                onClick={() => closeCashRegister(false)}
                disabled={loading}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600"
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "Fechando..." : "Fechar Caixa"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

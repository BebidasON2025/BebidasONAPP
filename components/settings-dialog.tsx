"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Settings, Bell, Database, Shield, Banknote, Clock, DollarSign, AlertCircle, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RetroactiveOrderDialog } from "./retroactive-order-dialog"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CashRegisterStatus {
  isOpen: boolean
  openedAt: string | null
  closedAt: string | null
  initialAmount: number
  currentAmount: number
  autoCloseEnabled: boolean
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    lowStockAlert: 10,
    notifications: true,
    soundAlerts: false,
    companyName: "Bebidas ON",
    taxRate: 0,
  })

  const [cashRegister, setCashRegister] = useState<CashRegisterStatus>({
    isOpen: false,
    openedAt: null,
    closedAt: null,
    initialAmount: 0,
    currentAmount: 0,
    autoCloseEnabled: true, // Set automatic closing as default
  })

  const [initialAmount, setInitialAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [retroactiveDialogOpen, setRetroactiveDialogOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadCashRegisterStatus()
    }
  }, [open])

  useEffect(() => {
    if (!cashRegister.autoCloseEnabled || !cashRegister.isOpen) {
      return
    }

    const checkMidnightClose = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()

      if (hours === 0 && minutes === 0 && seconds === 0) {
        closeCashRegisterAutomatic()
      }
    }

    const interval = setInterval(checkMidnightClose, 1000)
    return () => clearInterval(interval)
  }, [cashRegister.isOpen, cashRegister.autoCloseEnabled])

  const loadCashRegisterStatus = async () => {
    try {
      const salesResponse = await fetch("/api/vendas/hoje")
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        const currentAmount = salesData.total || 0

        const savedState = localStorage.getItem("cash-register-state")
        let cashState = {
          isOpen: false,
          openedAt: null,
          closedAt: null,
          initialAmount: 0,
          autoCloseEnabled: true,
        }

        if (savedState) {
          try {
            const parsed = JSON.parse(savedState)
            cashState = { ...cashState, ...parsed }
          } catch (e) {
            console.warn("Failed to parse saved cash register state")
          }
        }

        setCashRegister({
          ...cashState,
          currentAmount: currentAmount,
        })
      } else {
        setCashRegister({
          isOpen: false,
          openedAt: null,
          closedAt: null,
          initialAmount: 0,
          currentAmount: 0,
          autoCloseEnabled: true,
        })
      }
    } catch (error) {
      console.error("Error loading cash register status:", error)
      setCashRegister({
        isOpen: false,
        openedAt: null,
        closedAt: null,
        initialAmount: 0,
        currentAmount: 0,
        autoCloseEnabled: true,
      })
    }
  }

  const openCashRegister = async () => {
    try {
      setLoading(true)

      const now = new Date().toISOString()
      const newState = {
        isOpen: true,
        openedAt: now,
        initialAmount: Number(initialAmount) || 0,
        autoCloseEnabled: cashRegister.autoCloseEnabled,
      }

      localStorage.setItem("cash-register-state", JSON.stringify(newState))

      setCashRegister((prev) => ({
        ...prev,
        ...newState,
      }))

      setInitialAmount("")
      toast({
        title: "Caixa aberto",
        description: `Caixa aberto manualmente. Vendas do dia: ${formatBRL(cashRegister.currentAmount)}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o caixa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const closeCashRegister = async () => {
    try {
      setLoading(true)

      const now = new Date().toISOString()
      const newState = {
        isOpen: false,
        closedAt: now,
        autoCloseEnabled: cashRegister.autoCloseEnabled,
      }

      localStorage.setItem(
        "cash-register-state",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("cash-register-state") || "{}"),
          ...newState,
        }),
      )

      setCashRegister((prev) => ({
        ...prev,
        ...newState,
      }))

      toast({
        title: "Caixa fechado",
        description: `Caixa fechado com total de vendas: ${formatBRL(cashRegister.currentAmount)}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fechar o caixa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const closeCashRegisterAutomatic = async () => {
    try {
      const now = new Date().toISOString()
      const newState = {
        isOpen: false,
        closedAt: now,
        autoCloseEnabled: cashRegister.autoCloseEnabled,
      }

      localStorage.setItem(
        "cash-register-state",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("cash-register-state") || "{}"),
          ...newState,
        }),
      )

      setCashRegister((prev) => ({
        ...prev,
        ...newState,
      }))

      toast({
        title: "Caixa fechado automaticamente",
        description: `Caixa fechado às 00:00 com total de vendas: ${formatBRL(cashRegister.currentAmount)}`,
        duration: 10000,
      })
    } catch (error) {
      console.error("Error closing cash register automatically:", error)
    }
  }

  const handleSave = async () => {
    localStorage.setItem("app-settings", JSON.stringify(settings))

    const currentState = JSON.parse(localStorage.getItem("cash-register-state") || "{}")
    localStorage.setItem(
      "cash-register-state",
      JSON.stringify({
        ...currentState,
        autoCloseEnabled: cashRegister.autoCloseEnabled,
      }),
    )

    onOpenChange(false)

    toast({
      title: "Configurações salvas",
      description: "Todas as configurações foram salvas com sucesso",
    })
  }

  const formatBRL = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) {
      return "R$ 0,00"
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("pt-BR")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-xl">
              <Settings className="h-6 w-6 text-orange-400" />
              Configurações do Sistema
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 py-4">
              {/* Cash Register System */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 text-lg font-semibold text-green-400">
                  <Banknote className="h-5 w-5" />
                  Sistema de Caixa
                </div>

                {/* Cash Register Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Status do Caixa</Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          cashRegister.isOpen
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }
                      >
                        {cashRegister.isOpen ? "Aberto" : "Fechado"}
                      </Badge>
                      {cashRegister.autoCloseEnabled && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Auto-fechar 00:00
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-300">Valor Atual</Label>
                    <div className="text-2xl font-bold text-green-400">{formatBRL(cashRegister.currentAmount)}</div>
                  </div>
                </div>

                {/* Cash Register Details */}
                {cashRegister.isOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg bg-gray-800/50">
                    <div>
                      <Label className="text-xs text-gray-400">Aberto em</Label>
                      <p className="text-sm text-white">{formatDateTime(cashRegister.openedAt)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Valor Inicial</Label>
                      <p className="text-sm text-white">{formatBRL(cashRegister.initialAmount)}</p>
                    </div>
                  </div>
                )}

                {/* Cash Register Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-close" className="text-sm text-gray-300">
                      Fechamento automático à meia-noite
                    </Label>
                    <Switch
                      id="auto-close"
                      checked={cashRegister.autoCloseEnabled}
                      onCheckedChange={(checked) => setCashRegister({ ...cashRegister, autoCloseEnabled: checked })}
                    />
                  </div>

                  {!cashRegister.isOpen ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="initial-amount" className="text-sm text-gray-300">
                          Valor inicial para abertura do caixa (opcional)
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="initial-amount"
                              type="number"
                              placeholder="0,00"
                              value={initialAmount}
                              onChange={(e) => setInitialAmount(e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white pl-10"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <Button
                            onClick={openCashRegister}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                          >
                            {loading ? "Abrindo..." : "Abrir Caixa"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-300">
                          <p className="font-medium">Sistema Baseado em Vendas</p>
                          <p>
                            O valor atual é calculado automaticamente com base nas vendas do dia. Vendas atuais:{" "}
                            {formatBRL(cashRegister.currentAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={closeCashRegister} disabled={loading} variant="destructive" className="w-full">
                      {loading ? "Fechando..." : "Fechar Caixa"}
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Retroactive Orders Section */}
              <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-lg font-semibold text-amber-400">
                  <History className="h-5 w-5" />
                  Vendas Retroativas
                </div>

                <p className="text-sm text-gray-300">
                  Adicione vendas de datas passadas que foram esquecidas no sistema.
                </p>

                <Button
                  onClick={() => setRetroactiveDialogOpen(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <History className="h-4 w-4 mr-2" />
                  Adicionar Venda Retroativa
                </Button>
              </div>

              <Separator className="bg-gray-600" />

              {/* Company Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Shield className="h-4 w-4" />
                  Empresa
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm text-gray-300">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="company-name"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Notifications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Bell className="h-4 w-4" />
                  Notificações
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="text-sm text-gray-300">
                      Ativar notificações
                    </Label>
                    <Switch
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-alerts" className="text-sm text-gray-300">
                      Alertas sonoros
                    </Label>
                    <Switch
                      id="sound-alerts"
                      checked={settings.soundAlerts}
                      onCheckedChange={(checked) => setSettings({ ...settings, soundAlerts: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low-stock" className="text-sm text-gray-300">
                      Alerta de estoque baixo (unidades)
                    </Label>
                    <Input
                      id="low-stock"
                      type="number"
                      value={settings.lowStockAlert}
                      onChange={(e) =>
                        setSettings({ ...settings, lowStockAlert: Number.parseInt(e.target.value) || 10 })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* System Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Database className="h-4 w-4" />
                  Sistema
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh" className="text-sm text-gray-300">
                      Atualização automática
                    </Label>
                    <Switch
                      id="auto-refresh"
                      checked={settings.autoRefresh}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval" className="text-sm text-gray-300">
                      Intervalo de atualização (segundos)
                    </Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      value={settings.refreshInterval}
                      onChange={(e) =>
                        setSettings({ ...settings, refreshInterval: Number.parseInt(e.target.value) || 30 })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      min="10"
                      max="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate" className="text-sm text-gray-300">
                      Taxa de imposto (%)
                    </Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: Number.parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RetroactiveOrderDialog open={retroactiveDialogOpen} onOpenChange={setRetroactiveDialogOpen} />
    </>
  )
}

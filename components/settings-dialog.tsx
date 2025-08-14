"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Database, Shield } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    lowStockAlert: 10,
    notifications: true,
    soundAlerts: false,
    companyName: "Bebidas ON",
    taxRate: 0,
  })

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem("app-settings", JSON.stringify(settings))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                  onChange={(e) => setSettings({ ...settings, lowStockAlert: Number.parseInt(e.target.value) || 10 })}
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
                  onChange={(e) => setSettings({ ...settings, refreshInterval: Number.parseInt(e.target.value) || 30 })}
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

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { Bell, Settings, Menu, X, AlertTriangle } from "lucide-react"
import "../styles/contrast.css"
import SupabaseStatusBanner from "@/components/supabase-status-banner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SettingsDialog from "@/components/settings-dialog"
import { useAppStore } from "@/lib/store" // Fixed import path from @/store/useAppStore to @/lib/store

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [lastLowStockCount, setLastLowStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { products } = useAppStore()

  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)

      return () => clearTimeout(timer)
    } catch (error) {
      console.error("[v0] Layout initialization error:", error)
      setHasError(true)
      setIsLoading(false)
    }
  }, [])

  const lowStockProducts = Array.isArray(products) ? products.filter((p) => p.estoque <= (p.alerta_estoque || 10)) : []

  useEffect(() => {
    setLastLowStockCount(lowStockProducts.length)
  }, [lowStockProducts.length])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium">Carregando sistema...</p>
          <p className="text-sm text-gray-400">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold">Erro ao carregar</h1>
          <p className="text-gray-400">Ocorreu um erro ao inicializar o sistema. Tente recarregar a página.</p>
          <Button onClick={() => window.location.reload()} className="bg-amber-500 hover:bg-amber-600 text-black">
            Recarregar
          </Button>
        </div>
      </div>
    )
  }

  const notifications = [
    ...lowStockProducts.map((product) => ({
      id: `low-stock-${product.id}`,
      type: "warning" as const,
      title: "Estoque Baixo",
      message: `${product.nome} tem apenas ${product.estoque} unidades`,
      time: "Agora",
    })),
  ]

  return (
    <div className="min-h-screen w-full flex text-white bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-[260px] w-full">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 bg-gray-800 border-b border-gray-700">
          <div className="h-full flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700 p-2 transition-all duration-200"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell
                    className={`h-5 w-5 transition-transform duration-200 ${notificationsOpen ? "rotate-12" : ""}`}
                  />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>

                {notificationsOpen && (
                  <div className="fixed top-14 right-4 w-[calc(100vw-2rem)] max-w-72 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-xl shadow-2xl shadow-black/50 z-[60] sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-72 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-600/30 flex items-center justify-between bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-t-xl">
                      <h3 className="font-semibold text-white text-sm">Notificações</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-gray-400 hover:text-white hover:bg-gray-600/50 p-1 rounded-lg transition-all duration-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma notificação
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <div
                            key={notification.id}
                            className="p-3 border-b border-gray-600/20 last:border-b-0 hover:bg-gradient-to-r hover:from-gray-700/30 hover:to-gray-800/30 transition-all duration-200 cursor-pointer group animate-in slide-in-from-left-1"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {notification.type === "warning" ? (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <AlertTriangle className="h-4 w-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Bell className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-sm group-hover:text-blue-300 transition-colors duration-200">
                                  {notification.title}
                                </h4>
                                <p className="text-gray-300 text-xs mt-1 break-words leading-relaxed">
                                  {notification.message}
                                </p>
                                <span className="text-gray-400 text-xs mt-1.5 inline-block">{notification.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-b-xl border-t border-gray-600/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-gray-300 hover:text-white hover:bg-gray-600/50 transition-all duration-200"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          Marcar todas como lidas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700 p-2 transition-all duration-200"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <SupabaseStatusBanner />

        <main className="px-4 py-6 md:px-8 md:py-8 w-full overflow-x-hidden">{children}</main>
      </div>

      {notificationsOpen && <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

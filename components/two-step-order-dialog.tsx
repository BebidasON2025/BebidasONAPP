"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  X,
  Loader2,
  Search,
  Mic,
  MicOff,
  User,
  CreditCard,
  MapPin,
} from "lucide-react"
import { formatCurrency } from "@/lib/format"

interface Client {
  id: number
  nome: string
  telefone?: string
}

interface Product {
  id: number
  nome: string
  categoria?: string
  preco: number
  imagem?: string
  estoque: number
}

interface TwoStepOrderDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: () => void
  children?: React.ReactNode
}

function NewOrderDialog({ open, onOpenChange, onSaved, children }: TwoStepOrderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen

  const [step, setStep] = useState(1)
  const [loadingData, setLoadingData] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro")
  const [status, setStatus] = useState("pago")
  const [discount, setDiscount] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [observations, setObservations] = useState("")
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [dataCache, setDataCache] = useState<{
    clients: Client[]
    products: Product[]
    timestamp: number
  } | null>(null)

  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedItemForQuantity, setSelectedItemForQuantity] = useState<{ product: Product; quantity: number } | null>(
    null,
  )
  const [tempQuantity, setTempQuantity] = useState("")

  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  useEffect(() => {
    if (dialogOpen) {
      loadRealData()
    }
  }, [dialogOpen])

  const loadRealData = async () => {
    if (dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION) {
      setClients(dataCache.clients)
      setProducts(dataCache.products)
      return
    }

    setLoadingData(true)
    try {
      const [clientsResponse, productsResponse] = await Promise.all([fetch("/api/clientes"), fetch("/api/produtos")])

      let clientsData: Client[] = []
      let productsData: Product[] = []

      if (clientsResponse.ok) {
        const clientsResult = await clientsResponse.json()
        if (Array.isArray(clientsResult)) {
          clientsData = clientsResult
        } else if (clientsResult.data && Array.isArray(clientsResult.data)) {
          clientsData = clientsResult.data
        } else if (clientsResult.clientes && Array.isArray(clientsResult.clientes)) {
          clientsData = clientsResult.clientes
        }
      }

      if (productsResponse.ok) {
        const productsResult = await productsResponse.json()
        let allProducts: Product[] = []

        if (Array.isArray(productsResult)) {
          allProducts = productsResult
        } else if (productsResult.data && Array.isArray(productsResult.data)) {
          allProducts = productsResult.data
        } else if (productsResult.produtos && Array.isArray(productsResult.produtos)) {
          productsData = productsResult.produtos
        }

        productsData = allProducts.filter((p) => p.estoque > 0)
      }

      const cacheData = {
        clients: clientsData,
        products: productsData,
        timestamp: Date.now(),
      }
      setDataCache(cacheData)

      setClients(clientsData)
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleClientChange = (value: string) => {
    if (value === "clear") {
      setSelectedClient(null)
      setClientName("")
      setClientPhone("")
    } else {
      const client = clients.find((c) => c.id.toString() === value)
      setSelectedClient(client?.nome || null)
      setClientName(client?.nome || "")
      setClientPhone(client?.telefone || "")
    }
  }

  useEffect(() => {
    if (paymentMethod === "Fiado") {
      setStatus("pendente")
    } else {
      setStatus("pago")
    }
  }, [paymentMethod])

  const getClientName = (client: Client | undefined) => client?.nome || ""
  const getClientPhone = (client: Client | undefined) => client?.telefone || ""

  const getSelectedClientInfo = () => {
    return clients.find((client) => client.id.toString() === selectedClient)
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.product.preco * item.quantity, 0)
  }

  const getTotal = () => {
    return getSubtotal() - discount + deliveryFee
  }

  const canProceedToStep2 = () => {
    return cart.length > 0
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
    }
  }

  const handleQuantityClick = (item: { product: Product; quantity: number }) => {
    setSelectedItemForQuantity(item)
    setTempQuantity(item.quantity.toString())
    setQuantityDialogOpen(true)
  }

  const handleQuantitySubmit = () => {
    if (selectedItemForQuantity) {
      const newQuantity = Number.parseInt(tempQuantity) || 0
      updateQuantity(selectedItemForQuantity.product.id, newQuantity)
      setQuantityDialogOpen(false)
      setSelectedItemForQuantity(null)
      setTempQuantity("")
    }
  }

  const startVoiceSearch = () => {
    setIsListening(!isListening)
  }

  const handleCreateOrder = async () => {
    setLoading(true)

    try {
      // Prepare order data
      const orderData = {
        cliente_nome_texto: selectedClient?.nome || clientName || null,
        cliente_id: selectedClient?.id || null,
        metodo: paymentMethod, // Changed from metodo_pagamento to metodo
        status: status,
        desconto: discount,
        taxa_entrega: deliveryFee,
        total: getTotal(),
        items: cart.map((item) => ({
          produto_id: item.product.id,
          qtd: item.quantity,
          preco: item.product.preco,
        })),
      }

      // Save order to database
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar pedido")
      }

      // Reset form and close dialog
      setCart([])
      setSelectedClient(null)
      setClientName("")
      setClientPhone("")
      setDeliveryAddress("")
      setObservations("")
      setDiscount(0)
      setDeliveryFee(0)
      setStep(1)
      setDialogOpen(false)

      // Call callback to refresh orders list
      onSaved?.()
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      alert("Erro ao criar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        setFilteredProducts(
          products.filter(
            (product) =>
              product.nome.toLowerCase().includes(query) ||
              (product.categoria && product.categoria.toLowerCase().includes(query)),
          ),
        )
      } else {
        setFilteredProducts(products)
      }
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, products])

  useEffect(() => {
    if (!dialogOpen) {
      setStep(1)
      setCart([])
      setSelectedClient(null)
      setClientName("")
      setClientPhone("")
      setPaymentMethod("Dinheiro")
      setStatus("pago")
      setDiscount(0)
      setDeliveryFee(0)
      setDeliveryAddress("")
      setObservations("")
      setSearchQuery("")
    }
  }, [dialogOpen])

  if (children && !isControlled) {
    return (
      <>
        <div onClick={() => setDialogOpen(true)} className="cursor-pointer">
          {children}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] mx-auto overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-700">
              <DialogTitle className="flex items-center gap-2">
                {step === 2 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="p-1">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                Novo Pedido - Etapa {step} de 2{loadingData && <Loader2 className="h-4 w-4 animate-spin" />}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-1">
              {step === 1 && (
                <div className="space-y-4 py-4">
                  {cart.length > 0 && (
                    <Card className="bg-gray-900 text-white">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 text-white">Itens Selecionados</h3>
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div key={item.product.id} className="bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate">
                                    {item.product.nome || "Produto sem nome"}
                                  </div>
                                  <div className="text-sm text-gray-300">{formatCurrency(item.product.preco)} cada</div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <button
                                      className="w-8 text-center font-medium text-white text-sm hover:bg-gray-600 rounded px-1 py-0.5 transition-colors"
                                      onClick={() => handleQuantityClick(item)}
                                    >
                                      {item.quantity}
                                    </button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-400 hover:bg-red-900/20"
                                    onClick={() => removeFromCart(item.product.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right mt-2">
                                <span className="text-green-400 font-bold">
                                  {formatCurrency(item.product.preco * item.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}

                          <div className="border-t border-gray-700 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-white">Total:</span>
                              <span className="text-xl font-bold text-green-400">{formatCurrency(getSubtotal())}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="bg-gradient-to-r from-indigo-900/50 to-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 shadow-lg">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300 h-4 w-4" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar produtos..."
                          className="pl-10 bg-gray-800/80 border-indigo-600/50 text-white placeholder:text-gray-400 hover:border-indigo-500 transition-colors"
                        />
                      </div>
                      <Button
                        onClick={startVoiceSearch}
                        disabled={isListening}
                        size="sm"
                        className={`px-3 shadow-md transition-all duration-200 ${
                          isListening
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                        }`}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                    {searchQuery && (
                      <div className="mt-2 text-sm text-indigo-200">
                        {filteredProducts.length} produto(s) encontrado(s)
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="ml-2 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-800/50 h-6 px-2"
                        >
                          Limpar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">
                      Selecionar Produtos
                      {!loadingData && filteredProducts.length > 0 && (
                        <span className="text-sm text-gray-600 ml-2">({filteredProducts.length} disponíveis)</span>
                      )}
                      {loadingData && <span className="text-sm text-gray-600 ml-2">(carregando...)</span>}
                    </h3>

                    {loadingData ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Card key={index} className="bg-gray-800 border-gray-600 animate-pulse">
                            <CardContent className="p-3">
                              <div className="aspect-square bg-gray-700 rounded-lg mb-3"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery
                          ? `Nenhum produto encontrado para "${searchQuery}"`
                          : "Nenhum produto disponível no momento"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map((product) => (
                          <Card
                            key={product.id}
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98] bg-gray-800 border-gray-600"
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-3">
                              <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                {product.imagem ? (
                                  <img
                                    src={product.imagem || "/placeholder.svg"}
                                    alt={product.nome}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                      target.nextElementSibling?.classList.remove("hidden")
                                    }}
                                  />
                                ) : null}
                                <div className={`text-3xl ${product.imagem ? "hidden" : ""}`}>
                                  {product.categoria?.toLowerCase().includes("cerveja")
                                    ? "🍺"
                                    : product.categoria?.toLowerCase().includes("refrigerante")
                                      ? "🥤"
                                      : product.categoria?.toLowerCase().includes("energético")
                                        ? "⚡"
                                        : product.categoria?.toLowerCase().includes("água")
                                          ? "💧"
                                          : product.categoria?.toLowerCase().includes("suco")
                                            ? "🧃"
                                            : "🍺"}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm leading-tight text-white line-clamp-2 min-h-[2.5rem] flex items-center">
                                  {product.nome}
                                </h4>

                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded truncate flex-1 text-center">
                                    {product.categoria || "Sem categoria"}
                                  </span>
                                  <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 shrink-0">
                                    {product.estoque}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-center pt-2 border-t border-gray-600">
                                  <span className="font-bold text-base text-green-400 text-center">
                                    {formatCurrency(product.preco)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 py-4">
                  <Card className="bg-gray-900 text-white">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 text-white">Resumo do Pedido</h3>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.product.id} className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate">
                                  {item.product.nome || "Produto sem nome"}
                                </div>
                                <div className="text-sm text-gray-300">{formatCurrency(item.product.preco)} cada</div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <button
                                    className="w-8 text-center font-medium text-white text-sm hover:bg-gray-600 rounded px-1 py-0.5 transition-colors"
                                    onClick={() => handleQuantityClick(item)}
                                  >
                                    {item.quantity}
                                  </button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-900/20"
                                  onClick={() => removeFromCart(item.product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right mt-2">
                              <span className="text-green-400 font-bold">
                                {formatCurrency(item.product.preco * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-gray-700 pt-3 space-y-2">
                          <div className="flex justify-between text-gray-300">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(getSubtotal())}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-red-400">
                              <span>Desconto:</span>
                              <span>-{formatCurrency(discount)}</span>
                            </div>
                          )}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-blue-400">
                              <span>Taxa Entrega:</span>
                              <span>+{formatCurrency(deliveryFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                            <span className="text-lg font-bold text-white">Total:</span>
                            <span className="text-xl font-bold text-green-400">{formatCurrency(getTotal())}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 p-4 rounded-xl border border-blue-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Informações do Cliente</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-blue-100 font-medium">Cliente Cadastrado</Label>
                        <Select value={selectedClient || ""} onValueChange={handleClientChange}>
                          <SelectTrigger className="bg-gray-800/80 border-blue-600/50 text-white hover:border-blue-500 transition-colors">
                            <SelectValue
                              placeholder={loadingData ? "Carregando clientes..." : "Selecione um cliente"}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-blue-600/50">
                            {selectedClient && (
                              <SelectItem value="clear" className="text-red-400 hover:bg-red-900/20">
                                ❌ Limpar seleção
                              </SelectItem>
                            )}
                            {loadingData && (
                              <SelectItem value="loading" disabled className="text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Carregando...
                              </SelectItem>
                            )}
                            {!loadingData && clients.length === 0 && (
                              <SelectItem value="no-clients" disabled className="text-gray-400">
                                Nenhum cliente cadastrado
                              </SelectItem>
                            )}
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()} className="text-white">
                                {getClientName(client)} {getClientPhone(client) && `- ${getClientPhone(client)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-blue-100 font-medium">Nome do Cliente (texto)</Label>
                        <Input
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Cliente não cadastrado"
                          disabled={!!selectedClient}
                          className="bg-gray-800/80 border-blue-600/50 text-white placeholder:text-gray-400 disabled:opacity-50 hover:border-blue-500 transition-colors"
                        />
                        {selectedClient && <p className="text-xs text-blue-300">Cliente selecionado da lista</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 p-4 rounded-xl border border-emerald-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-600 rounded-lg shadow-md">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Pagamento & Status</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-emerald-100 font-medium">Método de Pagamento</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="bg-gray-800/80 border-emerald-600/50 text-white hover:border-emerald-500 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-emerald-600/50">
                            <SelectItem value="Dinheiro" className="text-white">
                              💵 Dinheiro
                            </SelectItem>
                            <SelectItem value="Pix" className="text-white">
                              📱 Pix
                            </SelectItem>
                            <SelectItem value="Cartão" className="text-white">
                              💳 Cartão
                            </SelectItem>
                            <SelectItem value="Fiado" className="text-white">
                              📝 Fiado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-emerald-100 font-medium">Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={paymentMethod === "Fiado"}>
                          <SelectTrigger className="bg-gray-800/80 border-emerald-600/50 text-white disabled:opacity-50 hover:border-emerald-500 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-emerald-600/50">
                            <SelectItem value="pago" className="text-white">
                              ✅ PAGO
                            </SelectItem>
                            <SelectItem value="pendente" className="text-white">
                              ⏳ PENDENTE
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {paymentMethod === "Fiado" && (
                          <p className="text-xs text-yellow-400">Status automático: PENDENTE para Fiado</p>
                        )}
                        {paymentMethod !== "Fiado" && (
                          <p className="text-xs text-green-400">Status automático: PAGO para {paymentMethod}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-4 rounded-xl border border-purple-700/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-600 rounded-lg shadow-md">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Detalhes Financeiros & Entrega</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-purple-100 font-medium">Desconto</Label>
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-purple-100 font-medium">Taxa Entrega</Label>
                        <Input
                          type="number"
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <Label className="text-purple-100 font-medium">Endereço de Entrega</Label>
                      <Input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Rua, número, bairro, cidade"
                        className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-100 font-medium">Observações</Label>
                      <Textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Observações sobre o pedido..."
                        rows={3}
                        className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-gray-600 bg-gray-900">
              <Button
                variant="outline"
                onClick={() => setStep(step === 1 ? 1 : 1)}
                className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:border-gray-400 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {step === 1 ? "Produtos" : "Voltar"}
              </Button>

              {step === 1 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Próximo: Finalizar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    `Finalizar - ${formatCurrency(getTotal())}`
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
          <DialogContent className="w-[90vw] max-w-sm">
            <DialogHeader>
              <DialogTitle>Alterar Quantidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">{selectedItemForQuantity?.product.nome}</label>
                <Input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(e.target.value)}
                  placeholder="Digite a quantidade"
                  className="mt-1"
                  min="0"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuantityDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleQuantitySubmit} className="flex-1">
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children}
      <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] mx-auto overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-700">
          <DialogTitle className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Novo Pedido - Etapa {step} de 2{loadingData && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {step === 1 && (
            <div className="space-y-4 py-4">
              {cart.length > 0 && (
                <Card className="bg-gray-900 text-white">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-white">Itens Selecionados</h3>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.product.id} className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">
                                {item.product.nome || "Produto sem nome"}
                              </div>
                              <div className="text-sm text-gray-300">{formatCurrency(item.product.preco)} cada</div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <button
                                  className="w-8 text-center font-medium text-white text-sm hover:bg-gray-600 rounded px-1 py-0.5 transition-colors"
                                  onClick={() => handleQuantityClick(item)}
                                >
                                  {item.quantity}
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:bg-red-900/20"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right mt-2">
                            <span className="text-green-400 font-bold">
                              {formatCurrency(item.product.preco * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="border-t border-gray-700 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-white">Total:</span>
                          <span className="text-xl font-bold text-green-400">{formatCurrency(getSubtotal())}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-gradient-to-r from-indigo-900/50 to-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 shadow-lg">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300 h-4 w-4" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="pl-10 bg-gray-800/80 border-indigo-600/50 text-white placeholder:text-gray-400 hover:border-indigo-500 transition-colors"
                    />
                  </div>
                  <Button
                    onClick={startVoiceSearch}
                    disabled={isListening}
                    size="sm"
                    className={`px-3 shadow-md transition-all duration-200 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm text-indigo-200">
                    {filteredProducts.length} produto(s) encontrado(s)
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="ml-2 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-800/50 h-6 px-2"
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">
                  Selecionar Produtos
                  {!loadingData && filteredProducts.length > 0 && (
                    <span className="text-sm text-gray-600 ml-2">({filteredProducts.length} disponíveis)</span>
                  )}
                  {loadingData && <span className="text-sm text-gray-600 ml-2">(carregando...)</span>}
                </h3>

                {loadingData ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="bg-gray-800 border-gray-600 animate-pulse">
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gray-700 rounded-lg mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery
                      ? `Nenhum produto encontrado para "${searchQuery}"`
                      : "Nenhum produto disponível no momento"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-gray-400 hover:scale-[1.02] active:scale-[0.98] bg-gray-800 border-gray-600"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {product.imagem ? (
                              <img
                                src={product.imagem || "/placeholder.svg"}
                                alt={product.nome}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  target.nextElementSibling?.classList.remove("hidden")
                                }}
                              />
                            ) : null}
                            <div className={`text-3xl ${product.imagem ? "hidden" : ""}`}>
                              {product.categoria?.toLowerCase().includes("cerveja")
                                ? "🍺"
                                : product.categoria?.toLowerCase().includes("refrigerante")
                                  ? "🥤"
                                  : product.categoria?.toLowerCase().includes("energético")
                                    ? "⚡"
                                    : product.categoria?.toLowerCase().includes("água")
                                      ? "💧"
                                      : product.categoria?.toLowerCase().includes("suco")
                                        ? "🧃"
                                        : "🍺"}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm leading-tight text-white line-clamp-2 min-h-[2.5rem] flex items-center">
                              {product.nome}
                            </h4>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded truncate flex-1 text-center">
                                {product.categoria || "Sem categoria"}
                              </span>
                              <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 shrink-0">
                                {product.estoque}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-center pt-2 border-t border-gray-600">
                              <span className="font-bold text-base text-green-400 text-center">
                                {formatCurrency(product.preco)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-4">
              <Card className="bg-gray-900 text-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-white">Resumo do Pedido</h3>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">
                              {item.product.nome || "Produto sem nome"}
                            </div>
                            <div className="text-sm text-gray-300">{formatCurrency(item.product.preco)} cada</div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <button
                                className="w-8 text-center font-medium text-white text-sm hover:bg-gray-600 rounded px-1 py-0.5 transition-colors"
                                onClick={() => handleQuantityClick(item)}
                              >
                                {item.quantity}
                              </button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-white hover:bg-gray-600"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-400 hover:bg-red-900/20"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right mt-2">
                          <span className="text-green-400 font-bold">
                            {formatCurrency(item.product.preco * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-gray-700 pt-3 space-y-2">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(getSubtotal())}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-red-400">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-blue-400">
                          <span>Taxa Entrega:</span>
                          <span>+{formatCurrency(deliveryFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                        <span className="text-lg font-bold text-white">Total:</span>
                        <span className="text-xl font-bold text-green-400">{formatCurrency(getTotal())}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 p-4 rounded-xl border border-blue-700/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Informações do Cliente</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-blue-100 font-medium">Cliente Cadastrado</Label>
                    <Select value={selectedClient || ""} onValueChange={handleClientChange}>
                      <SelectTrigger className="bg-gray-800/80 border-blue-600/50 text-white hover:border-blue-500 transition-colors">
                        <SelectValue placeholder={loadingData ? "Carregando clientes..." : "Selecione um cliente"} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-blue-600/50">
                        {selectedClient && (
                          <SelectItem value="clear" className="text-red-400 hover:bg-red-900/20">
                            ❌ Limpar seleção
                          </SelectItem>
                        )}
                        {loadingData && (
                          <SelectItem value="loading" disabled className="text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Carregando...
                          </SelectItem>
                        )}
                        {!loadingData && clients.length === 0 && (
                          <SelectItem value="no-clients" disabled className="text-gray-400">
                            Nenhum cliente cadastrado
                          </SelectItem>
                        )}
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()} className="text-white">
                            {getClientName(client)} {getClientPhone(client) && `- ${getClientPhone(client)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-100 font-medium">Nome do Cliente (texto)</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Cliente não cadastrado"
                      disabled={!!selectedClient}
                      className="bg-gray-800/80 border-blue-600/50 text-white placeholder:text-gray-400 disabled:opacity-50 hover:border-blue-500 transition-colors"
                    />
                    {selectedClient && <p className="text-xs text-blue-300">Cliente selecionado da lista</p>}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 p-4 rounded-xl border border-emerald-700/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-600 rounded-lg shadow-md">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Pagamento & Status</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-emerald-100 font-medium">Método de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-gray-800/80 border-emerald-600/50 text-white hover:border-emerald-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-emerald-600/50">
                        <SelectItem value="Dinheiro" className="text-white">
                          💵 Dinheiro
                        </SelectItem>
                        <SelectItem value="Pix" className="text-white">
                          📱 Pix
                        </SelectItem>
                        <SelectItem value="Cartão" className="text-white">
                          💳 Cartão
                        </SelectItem>
                        <SelectItem value="Fiado" className="text-white">
                          📝 Fiado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-emerald-100 font-medium">Status</Label>
                    <Select value={status} onValueChange={setStatus} disabled={paymentMethod === "Fiado"}>
                      <SelectTrigger className="bg-gray-800/80 border-emerald-600/50 text-white disabled:opacity-50 hover:border-emerald-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-emerald-600/50">
                        <SelectItem value="pago" className="text-white">
                          ✅ PAGO
                        </SelectItem>
                        <SelectItem value="pendente" className="text-white">
                          ⏳ PENDENTE
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentMethod === "Fiado" && (
                      <p className="text-xs text-yellow-400">Status automático: PENDENTE para Fiado</p>
                    )}
                    {paymentMethod !== "Fiado" && (
                      <p className="text-xs text-green-400">Status automático: PAGO para {paymentMethod}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-4 rounded-xl border border-purple-700/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Detalhes Financeiros & Entrega</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-purple-100 font-medium">Desconto</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-purple-100 font-medium">Taxa Entrega</Label>
                    <Input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="text-purple-100 font-medium">Endereço de Entrega</Label>
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-100 font-medium">Observações</Label>
                  <Textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações sobre o pedido..."
                    rows={3}
                    className="bg-gray-800/80 border-purple-600/50 text-white placeholder:text-gray-400 hover:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-gray-600 bg-gray-900">
          <Button
            variant="outline"
            onClick={() => setStep(step === 1 ? 1 : 1)}
            className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 1 ? "Produtos" : "Voltar"}
          </Button>

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Próximo: Finalizar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateOrder}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                `Finalizar - ${formatCurrency(getTotal())}`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewOrderDialog
export { NewOrderDialog as TwoStepOrderDialog }

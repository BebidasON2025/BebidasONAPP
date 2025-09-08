"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, Package, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  nome: string
  preco_venda: number
  estoque: number
}

interface OrderItem {
  produto_id: string
  produto_nome: string
  qtd: number
  preco: number
  subtotal: number
}

interface RetroactiveOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RetroactiveOrderDialog({ open, onOpenChange }: RetroactiveOrderDialogProps) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("12:00")
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadProducts()
      // Set default date to yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setSelectedDate(yesterday.toISOString().split("T")[0])
    }
  }, [open])

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/produtos")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find((item) => item.produto_id === product.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.produto_id === product.id ? { ...item, qtd: item.qtd + 1, subtotal: (item.qtd + 1) * item.preco } : item,
        ),
      )
    } else {
      setOrderItems([
        ...orderItems,
        {
          produto_id: product.id,
          produto_nome: product.nome,
          qtd: 1,
          preco: product.preco_venda,
          subtotal: product.preco_venda,
        },
      ])
    }
  }

  const updateQuantity = (produto_id: string, newQtd: number) => {
    if (newQtd <= 0) {
      setOrderItems(orderItems.filter((item) => item.produto_id !== produto_id))
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.produto_id === produto_id ? { ...item, qtd: newQtd, subtotal: newQtd * item.preco } : item,
        ),
      )
    }
  }

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const handleSubmit = async () => {
    if (!selectedDate || orderItems.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione uma data e adicione pelo menos um produto",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Create the order with the selected date and time
      const orderDateTime = new Date(`${selectedDate}T${selectedTime}:00.000Z`)

      const orderData = {
        cliente_nome_texto: customerName || "Cliente",
        metodo: paymentMethod,
        status: "pago",
        total: getTotalAmount(),
        data: orderDateTime.toISOString(),
        retroativo: true,
        itens: orderItems,
      }

      const response = await fetch("/api/pedidos/retroativo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        toast({
          title: "Pedido adicionado",
          description: `Pedido retroativo de ${formatBRL(getTotalAmount())} adicionado para ${formatDate(selectedDate)}`,
        })

        // Reset form
        setOrderItems([])
        setCustomerName("")
        setSelectedDate("")
        setSelectedTime("12:00")
        onOpenChange(false)
      } else {
        throw new Error("Erro ao criar pedido retroativo")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o pedido retroativo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Adicionar Venda Retroativa
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh]">
          {/* Left Column - Order Configuration */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium">Venda Retroativa</p>
                  <p>Use este sistema para adicionar vendas de datas passadas que foram esquecidas no sistema.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Data da Venda</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Horário</Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Nome do Cliente (opcional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Digite o nome do cliente"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Pix">PIX</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Fiado">Fiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Selection */}
            <div className="space-y-3">
              <Label className="text-sm text-slate-300">Selecionar Produtos</Label>
              <ScrollArea className="h-48 border border-slate-600 rounded-lg">
                <div className="p-3 space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{product.nome}</p>
                        <p className="text-xs text-slate-400">{formatBRL(product.preco_venda)}</p>
                      </div>
                      <Badge className="bg-slate-600 text-slate-200">Estoque: {product.estoque}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column - Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Itens do Pedido</Label>
              <Badge className="bg-green-500/20 text-green-400">Total: {formatBRL(getTotalAmount())}</Badge>
            </div>

            <ScrollArea className="h-96 border border-slate-600 rounded-lg">
              <div className="p-3 space-y-3">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum produto selecionado</p>
                    <p className="text-xs">Clique nos produtos à esquerda para adicionar</p>
                  </div>
                ) : (
                  orderItems.map((item) => (
                    <div
                      key={item.produto_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-600"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.produto_nome}</p>
                        <p className="text-sm text-slate-400">{formatBRL(item.preco)} cada</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.produto_id, item.qtd - 1)}
                          className="h-8 w-8 p-0 border-slate-600"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-white">{item.qtd}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.produto_id, item.qtd + 1)}
                          className="h-8 w-8 p-0 border-slate-600"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-green-400">{formatBRL(item.subtotal)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || orderItems.length === 0}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? "Adicionando..." : `Adicionar Venda - ${formatBRL(getTotalAmount())}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

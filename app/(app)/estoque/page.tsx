"use client"

import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SearchInput from "@/components/search-input"
import { useEffect, useMemo, useState, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { formatBRL } from "@/lib/format"
import AddProductDialogSupabase from "@/components/add-product-dialog-supabase"
import EditProductDialogSupabase from "@/components/edit-product-dialog-supabase"
import ConfirmationDialog from "@/components/confirmation-dialog"
import { AdvancedCategoryDialog } from "@/components/advanced-category-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tag } from "lucide-react"
import {
  EllipsisVertical,
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ShoppingCart,
  Beer,
  Zap,
  Snowflake,
  Coffee,
  Droplets,
  Box,
  Grid3X3,
  XCircle,
  Wine,
  Sandwich,
  Candy,
  Cigarette,
  Utensils,
  ShoppingBag,
  Truck,
  Flame,
  Apple,
  Milk,
  Beef,
  Fish,
  Cake,
  Pizza,
  IceCream,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DbCategory {
  id: number
  nome: string
  cor: string
  icone: string
  ativo: boolean
}

const mapProdutoRowToStore = (row) => {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    codigo_barras: row.codigo_barras,
    preco: row.preco,
    estoque: row.estoque,
    alerta_estoque: row.alerta_estoque,
    imagem: row.imagem,
  }
}

const getIconComponent = (iconName: string) => {
  const iconMap = {
    Package,
    Coffee,
    Zap,
    Droplets,
    Snowflake,
    Wine,
    Sandwich,
    Candy,
    Cigarette,
    Utensils,
    ShoppingBag,
    Truck,
    Flame,
    Apple,
    Milk,
    Beef,
    Fish,
    Cake,
    Pizza,
    IceCream,
    Beer,
    Box,
  }
  return iconMap[iconName] || Package
}

export default function EstoquePage() {
  const store = useAppStore()
  const { products, setProducts } = store

  const [q, setQ] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Geral")
  const [hydrated, setHydrated] = useState<boolean>(() => {
    return (useAppStore as any).persist?.hasHydrated?.() ?? true
  })

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [serverDetails, setServerDetails] = useState<any>(null)
  const [busyDelete, setBusyDelete] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean
    productId: string
    productName: string
  }>({
    open: false,
    productId: "",
    productName: "",
  })
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    const api = (useAppStore as any).persist
    if (api?.onFinishHydration) {
      const unsub = api.onFinishHydration(() => setHydrated(true))
      return () => unsub?.()
    }
  }, [])

  function parseSafe(text: string) {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  const loadFromDB = useCallback(async () => {
    try {
      setLoading(true)
      setErr(null)
      setServerDetails(null)

      const res = await fetch("/api/produtos", { cache: "no-store" })
      const contentType = res.headers.get("content-type") || ""
      const text = await res.text()

      if (!res.ok) {
        const j = contentType.includes("application/json") ? parseSafe(text) : null
        if (j) setServerDetails(j)
        throw new Error(`${res.status} ${res.statusText}${j?.error ? ` - ${j.error}` : ""}`)
      }

      const json = parseSafe(text)
      if (!json?.ok) {
        setServerDetails(json)
        throw new Error(json?.error || "Falha ao consultar produtos.")
      }
      setProducts((json.data as any[]).map(mapProdutoRowToStore))
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [setProducts])

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true)
      const res = await fetch("/api/categorias")
      const data = await res.json()

      if (res.ok && data.ok && Array.isArray(data.data)) {
        setDbCategories(data.data)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    loadFromDB()
    loadCategories()
  }, [hydrated, loadFromDB, loadCategories])

  const filtered = useMemo(() => {
    const productsArray = Array.isArray(products) ? products : []
    const query = q.toLowerCase()
    return productsArray.filter((p) => {
      const matchesCategory =
        selectedCategory === "Geral" || (p.categoria?.toLowerCase() ?? "").includes(selectedCategory.toLowerCase())

      const matchesSearch =
        (p.nome?.toLowerCase() ?? "").includes(query) ||
        (p.categoria?.toLowerCase() ?? "").includes(query) ||
        (p.codigo_barras?.toLowerCase() ?? "").includes(query)

      return matchesCategory && matchesSearch
    })
  }, [products, q, selectedCategory])

  const analytics = useMemo(() => {
    const productsArray = Array.isArray(products) ? products : []
    const total = productsArray.length
    const lowStock = productsArray.filter((p) => p.estoque <= (p.alerta_estoque || 0)).length
    const totalValue = productsArray.reduce((sum, p) => sum + (p.preco || 0) * (p.estoque || 0), 0)
    const avgPrice = total > 0 ? productsArray.reduce((sum, p) => sum + (p.preco || 0), 0) / total : 0

    return { total, lowStock, totalValue, avgPrice }
  }, [products])

  async function deleteProduto(id: string, name: string) {
    setDeleteConfirmation({
      open: true,
      productId: id,
      productName: name,
    })
  }

  async function confirmDelete() {
    try {
      setBusyDelete(deleteConfirmation.productId)
      const res = await fetch("/api/produtos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirmation.productId }),
      })
      const text = await res.text()
      const json = parseSafe(text)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status} - ${text}`)
      await loadFromDB()
      setDeleteConfirmation({ open: false, productId: "", productName: "" })
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setBusyDelete(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || ""
    if (cat.includes("cerveja") || cat.includes("bebida")) return "🍺"
    if (cat.includes("refrigerante")) return "🥤"
    if (cat.includes("água")) return "💧"
    if (cat.includes("energético")) return "⚡"
    if (cat.includes("outros")) return "📦"
    return "🍹"
  }

  const categories = useMemo(() => {
    const baseCategories = [
      { name: "Geral", icon: Package, color: "bg-blue-600 hover:bg-blue-500 border-blue-500 shadow-blue-500/20" },
    ]

    if (loadingCategories || dbCategories.length === 0) {
      return baseCategories
    }

    const dynamicCategories = dbCategories.map((category) => {
      const IconComponent = getIconComponent(category.icone)
      return {
        name: category.nome,
        icon: IconComponent,
        color: `${category.cor} hover:${category.cor.replace("600", "500")} border-${category.cor.split("-")[1]}-500 shadow-${category.cor.split("-")[1]}-500/20`,
      }
    })

    return [...baseCategories, ...dynamicCategories]
  }, [dbCategories, loadingCategories])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Gerencie seus produtos com controle inteligente de estoque"
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setShowCategoryDialog(true)}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex-1 sm:flex-none"
            >
              <Tag className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gerenciar Categorias</span>
              <span className="sm:hidden">Categorias</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                loadFromDB()
                loadCategories()
              }}
              disabled={loading}
              className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all duration-200 flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <AddProductDialogSupabase
              onSaved={() => {
                loadFromDB()
                loadCategories()
              }}
            >
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none">
                <Package className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </AddProductDialogSupabase>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hc-panel border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Produtos</p>
                <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  {analytics.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-all duration-300 group-hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card className="hc-panel border-red-500/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-400 group-hover:text-red-300 transition-colors">
                  {analytics.lowStock}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400 group-hover:text-red-300 transition-all duration-300 group-hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card className="hc-panel border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Categorias Ativas</p>
                <p className="text-2xl font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                  {
                    new Set(
                      (Array.isArray(products) ? products : []).filter((p) => p.categoria).map((p) => p.categoria),
                    ).size
                  }
                </p>
              </div>
              <Grid3X3 className="h-8 w-8 text-orange-400 group-hover:text-orange-300 transition-all duration-300 group-hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card className="hc-panel border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Produtos em Falta</p>
                <p className="text-2xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  {(Array.isArray(products) ? products : []).filter((p) => (p.estoque || 0) === 0).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-all duration-300 group-hover:scale-110" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hc-panel hover:border-gray-600/40 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.name
              return (
                <Button
                  key={category.name}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    ${
                      isSelected
                        ? `${category.color} text-white shadow-lg transform scale-105`
                        : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500 hover:scale-105"
                    }
                    transition-all duration-300 font-medium hover:shadow-lg
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="hc-panel">
        <CardHeader className="pb-4 border-b hc-divider">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Lista de Produtos
              {selectedCategory !== "Geral" && (
                <span className="text-sm font-normal text-gray-400">- {selectedCategory}</span>
              )}
            </CardTitle>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
              {filtered.length} produtos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-400 transition-colors" />
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Buscar produtos por nome, categoria ou código de barras..."
                className="pl-10 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {err && (
            <div className="mb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Erro ao carregar do banco: {err}
                </div>
              </div>
              {serverDetails && (
                <details className="rounded-lg bg-gray-800/50 p-3 hover:bg-gray-800/70 transition-colors">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                    Detalhes do servidor
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-300">
                    {JSON.stringify(serverDetails || {}, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="animate-pulse">Carregando produtos...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <Package className="h-12 w-12 text-gray-500 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 mb-2">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-500">
                {q || selectedCategory !== "Geral"
                  ? "Tente ajustar sua busca ou filtro"
                  : "Adicione produtos para começar"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product, index) => (
                <Card
                  key={product.id}
                  className="hc-panel hover:border-amber-500/40 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/10 group hover:-translate-y-2 animate-in slide-in-from-bottom-4 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-t-lg overflow-hidden group-hover:from-amber-900/20 group-hover:via-gray-900 group-hover:to-black transition-all duration-500">
                      {product.imagem ? (
                        <img
                          src={product.imagem || "/placeholder.svg"}
                          alt={product.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl opacity-50 group-hover:opacity-70 transition-all duration-300 group-hover:scale-110">
                            {getCategoryIcon(product.categoria || "")}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bg-black/20 hover:bg-black/60 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110"
                            >
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-700">
                            <DropdownMenuItem
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingProduct(product)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 flex items-center gap-2 transition-colors"
                              onClick={() => deleteProduto(product.id, product.nome || "Produto")}
                              disabled={busyDelete === product.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              {busyDelete === product.id ? "Excluindo..." : "Excluir"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {(product.estoque || 0) <= (product.alerta_estoque || 0) && (
                        <div className="absolute top-2 left-2 animate-pulse">
                          <Badge className="bg-red-500/90 text-white border-0 shadow-lg hover:bg-red-500 transition-colors">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Baixo
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="space-y-1">
                        <h3
                          className="font-bold text-white text-lg leading-tight group-hover:text-amber-400 transition-colors duration-300"
                          title={product.nome}
                        >
                          {product.nome}
                        </h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-gray-300 transition-colors">
                          <span className="text-xs">{getCategoryIcon(product.categoria || "")}</span>
                          {product.categoria || "Sem categoria"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
                            {formatBRL(product.preco || 0)}
                          </span>
                          <div className="flex items-center gap-1 text-gray-400 group-hover:text-gray-300 transition-colors">
                            <Package className="h-3 w-3" />
                            <span className="text-sm">{product.estoque || 0} unid.</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 max-w-[80px] sm:max-w-none">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${
                              (product.estoque || 0) > (product.alerta_estoque || 0)
                                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full animate-pulse ${
                                (product.estoque || 0) > (product.alerta_estoque || 0) ? "bg-green-400" : "bg-red-400"
                              }`}
                            />
                            <span className="hidden sm:inline">
                              {(product.estoque || 0) > (product.alerta_estoque || 0) ? "Disponível" : "Baixo"}
                            </span>
                            <span className="sm:hidden">
                              {(product.estoque || 0) > (product.alerta_estoque || 0) ? "OK" : "Baixo"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <EditProductDialogSupabase
          product={editingProduct}
          onSaved={() => {
            loadFromDB()
            setEditingProduct(null)
          }}
          open={!!editingProduct}
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null)
          }}
        >
          <div />
        </EditProductDialogSupabase>
      )}

      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation({ open, productId: "", productName: "" })}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${deleteConfirmation.productName}"? Esta ação não pode ser desfeita e o produto será removido permanentemente do sistema.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={busyDelete === deleteConfirmation.productId}
      />

      {showCategoryDialog && (
        <AdvancedCategoryDialog
          open={showCategoryDialog}
          onOpenChange={(open) => {
            setShowCategoryDialog(open)
            if (!open) {
              loadCategories()
            }
          }}
          onCategoriesChange={loadCategories}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  X,
  Plus,
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
} from "lucide-react"

interface Category {
  id: number
  nome: string
  cor: string
  icone: string
  ativo: boolean
}

interface AdvancedCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoriesChange: () => void
}

const AVAILABLE_ICONS = [
  { name: "Package", icon: Package, value: "Package" },
  { name: "Coffee", icon: Coffee, value: "Coffee" },
  { name: "Beer", icon: Beer, value: "Beer" }, // Added Beer icon for cerveja category
  { name: "Zap", icon: Zap, value: "Zap" },
  { name: "Droplets", icon: Droplets, value: "Droplets" },
  { name: "Snowflake", icon: Snowflake, value: "Snowflake" },
  { name: "Wine", icon: Wine, value: "Wine" },
  { name: "Sandwich", icon: Sandwich, value: "Sandwich" },
  { name: "Candy", icon: Candy, value: "Candy" },
  { name: "Cigarette", icon: Cigarette, value: "Cigarette" },
  { name: "Utensils", icon: Utensils, value: "Utensils" },
  { name: "ShoppingBag", icon: ShoppingBag, value: "ShoppingBag" },
  { name: "Truck", icon: Truck, value: "Truck" },
  { name: "Flame", icon: Flame, value: "Flame" },
  { name: "Apple", icon: Apple, value: "Apple" },
  { name: "Milk", icon: Milk, value: "Milk" },
  { name: "Beef", icon: Beef, value: "Beef" },
  { name: "Fish", icon: Fish, value: "Fish" },
  { name: "Cake", icon: Cake, value: "Cake" },
  { name: "Pizza", icon: Pizza, value: "Pizza" },
  { name: "IceCream", icon: IceCream, value: "IceCream" },
]

const AVAILABLE_COLORS = [
  { name: "Azul", value: "blue", border: "border-blue-500", text: "text-blue-100", bg: "bg-blue-600" },
  { name: "Verde", value: "green", border: "border-green-500", text: "text-green-100", bg: "bg-green-600" },
  { name: "Vermelho", value: "red", border: "border-red-500", text: "text-red-100", bg: "bg-red-600" },
  { name: "Amarelo", value: "yellow", border: "border-yellow-500", text: "text-yellow-100", bg: "bg-yellow-600" },
  { name: "Roxo", value: "purple", border: "border-purple-500", text: "text-purple-100", bg: "bg-purple-600" },
  { name: "Rosa", value: "pink", border: "border-pink-500", text: "text-pink-100", bg: "bg-pink-600" },
  { name: "Laranja", value: "orange", border: "border-orange-500", text: "text-orange-100", bg: "bg-orange-600" },
  { name: "Ciano", value: "cyan", border: "border-cyan-500", text: "text-cyan-100", bg: "bg-cyan-600" },
  { name: "Índigo", value: "indigo", border: "border-indigo-500", text: "text-indigo-100", bg: "bg-indigo-600" },
  { name: "Cinza", value: "gray", border: "border-gray-500", text: "text-gray-100", bg: "bg-gray-600" },
]

export function AdvancedCategoryDialog({ open, onOpenChange, onCategoriesChange }: AdvancedCategoryDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ nome: "", cor: "blue", icone: "Package" })

  const loadCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/categorias")
      const data = await res.json()
      if (data.ok) {
        setCategories(data.data || [])
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.nome.trim()) return

    try {
      setError(null)
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newCategory.nome.trim(),
          cor: newCategory.cor,
          icone: newCategory.icone,
          ativo: true,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Erro ao adicionar categoria")
      }

      setNewCategory({ nome: "", cor: "blue", icone: "Package" })
      await loadCategories()
      onCategoriesChange()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const removeCategory = async (id: number) => {
    try {
      setError(null)
      const res = await fetch("/api/categorias", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Erro ao remover categoria")
      }

      await loadCategories()
      onCategoriesChange()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find((i) => i.value === iconName)
    return iconData ? iconData.icon : Package
  }

  const getColorClasses = (colorValue: string) => {
    const colorData = AVAILABLE_COLORS.find((c) => c.value === colorValue)
    return colorData || AVAILABLE_COLORS[0]
  }

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gerenciar Categorias
          </DialogTitle>
        </DialogHeader>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-md">{error}</div>}

        {/* Add New Category */}
        <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium">Nova Categoria</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Nome</Label>
              <Input
                value={newCategory.nome}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da categoria..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Ícone</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {AVAILABLE_ICONS.slice(0, 10).map((iconData) => {
                  const IconComponent = iconData.icon
                  return (
                    <button
                      key={iconData.value}
                      onClick={() => setNewCategory((prev) => ({ ...prev, icone: iconData.value }))}
                      className={`p-2 rounded border-2 transition-colors ${
                        newCategory.icone === iconData.value
                          ? "border-blue-500 bg-blue-600/20"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Cor</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCategory((prev) => ({ ...prev, cor: color.value }))}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      newCategory.cor === color.value ? "border-white scale-110" : "border-slate-600 hover:scale-105"
                    } ${color.bg}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600">
              <span className="text-slate-300 text-sm">Preview:</span>
              {(() => {
                const IconComponent = getIconComponent(newCategory.icone)
                const colorClasses = getColorClasses(newCategory.cor)
                return (
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm">{newCategory.nome || "Nome da categoria"}</span>
                  </div>
                )
              })()}
            </div>
            <Button onClick={addCategory} className="bg-green-600 hover:bg-green-500">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          <h3 className="text-white font-medium">Categorias Existentes</h3>
          {loading ? (
            <div className="text-slate-400 text-center py-8">Carregando categorias...</div>
          ) : categories.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Nenhuma categoria encontrada</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icone)
                const colorClasses = getColorClasses(category.cor)
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text}`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{category.nome}</span>
                    </div>
                    <Button
                      onClick={() => removeCategory(category.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="border-slate-600 text-slate-300">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

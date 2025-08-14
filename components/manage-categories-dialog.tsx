"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Tags, X } from "lucide-react"

export default function ManageCategoriesDialog() {
  const [open, setOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [categories, setCategories] = useState([
    "Cervejas",
    "Refrigerantes",
    "Energéticos",
    "Sucos",
    "Águas",
    "Gelos",
    "Diversos",
    "Destilados",
    "Vinhos",
    "Salgadinhos",
    "Doces",
    "Cigarros",
  ])

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter((cat) => cat !== categoryToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
        >
          <Tags className="w-4 h-4 mr-2" />
          Gerenciar Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Gerenciar Categorias</DialogTitle>
          <DialogDescription className="text-slate-400">Adicione ou remova categorias de produtos.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-slate-300">Nova Categoria</Label>
            <div className="flex gap-2">
              <Input
                className="bg-slate-800/50 border-slate-600/50 text-slate-100 focus:border-amber-500/50"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex: Bebidas Quentes"
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <Button
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-300">Categorias Existentes</Label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-800/30 rounded-lg border border-slate-600/30">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 pr-1"
                >
                  {category}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20 hover:text-red-300"
                    onClick={() => removeCategory(category)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setOpen(false)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium"
            >
              Concluído
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Tags, RefreshCw } from 'lucide-react'

type Category = {
  id: string
  nome: string
  cor: string
  icone: string
  ativo: boolean
}

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CategoryManagementDialog({ open, onOpenChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/categorias')
      const data = await res.json()
      
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao carregar categorias')
      }
      
      setCategories(data.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const addCategory = async () => {
    if (!newCategory.trim()) return
    
    try {
      setSaving(true)
      setError(null)
      
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCategory.trim() })
      })
      
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao adicionar categoria')
      }
      
      setNewCategory("")
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (id: string) => {
    try {
      setError(null)
      
      const res = await fetch('/api/categorias', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao remover categoria')
      }
      
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gerenciar Categorias
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addCategory()}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={saving}
            />
            <Button 
              onClick={addCategory} 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              disabled={saving || !newCategory.trim()}
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Carregando...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma categoria encontrada
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {category.nome}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export default function ImageUpload({
  value,
  onChange,
  label = "Imagem",
  placeholder = "Selecione uma imagem",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value || "")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem.")
      return
    }

    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Erro ao carregar imagem:", error)
      alert("Erro ao carregar a imagem. Tente novamente.")
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview("")
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-300">{label}</Label>

      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg">
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 bg-red-600 hover:bg-red-700 shadow-lg opacity-80 hover:opacity-100 transition-all"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            isUploading
              ? "border-blue-500 bg-blue-900/20"
              : "border-gray-600 hover:border-gray-500 bg-gray-800/30 hover:bg-gray-800/50"
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-sm text-blue-400">Carregando imagem...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-gray-500 mb-3" />
              <p className="text-sm text-gray-300 mb-1 font-medium">{placeholder}</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP</p>
            </>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {!preview && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Imagem
        </Button>
      )}
    </div>
  )
}

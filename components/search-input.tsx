"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import MicButton from "./mic-button"

export default function SearchInput({
  value = "",
  onChange,
  placeholder = "Buscar...",
  enableVoice = false,
}: {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  enableVoice?: boolean
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-300" />
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="pl-8 hc-field"
      />
      {enableVoice ? (
        <div className="absolute right-1.5 top-1.5">
          <MicButton onResult={(t) => onChange?.(t)} title="Falar para buscar" />
        </div>
      ) : null}
    </div>
  )
}

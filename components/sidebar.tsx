"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Package, Receipt, ShoppingCart, Users, Wallet, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const principal = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
]
const gestao = [
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/fiado", label: "Comprovante Fiado", icon: Receipt },
  { href: "/clientes", label: "Clientes", icon: Users },
]
const analises = [{ href: "/relatorios", label: "Relatórios", icon: BarChart3 }]

function Group({
  title,
  items,
  onItemClick,
}: {
  title: string
  items: { href: string; label: string; icon: any }[]
  onItemClick?: () => void
}) {
  const pathname = usePathname()
  return (
    <div className="px-3">
      <div className="text-[10px] uppercase tracking-wide font-semibold text-black/70 px-2 pt-4 pb-2">{title}</div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-[#C98C0A] text-black shadow-sm" : "text-black/85 hover:bg-black/10 hover:text-black",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col bg-[#F2A90A] fixed left-0 top-0 h-screen z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 h-screen z-50 w-[280px] flex-col bg-[#F2A90A] transition-transform duration-300 ease-in-out flex",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-black hover:bg-black/10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <SidebarContent onItemClick={onClose} />
      </aside>
    </>
  )
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <>
      {/* Topo com logo e título */}
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-5">
        <div className="relative w-14 h-14 rounded-full overflow-hidden ring-4 ring-white shadow-md">
          <Image
            src="/images/logo.png"
            alt="Logo Bebidas ON"
            fill
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              target.parentElement!.innerHTML =
                '<div class="w-full h-full bg-amber-600 flex items-center justify-center text-white font-bold text-xl">B</div>'
            }}
          />
        </div>
        <div className="text-center leading-tight">
          <div className="font-semibold text-black">Bebidas ON</div>
          <div className="text-xs text-black/70">Delivery</div>
        </div>
      </div>

      {/* divisória sutil */}
      <div className="h-px bg-black/10 mx-3" />

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto">
        <Group title="PRINCIPAL" items={principal as any} onItemClick={onItemClick} />
        <Group title="GESTÃO" items={gestao as any} onItemClick={onItemClick} />
        <Group title="ANÁLISES" items={analises as any} onItemClick={onItemClick} />
      </nav>

      {/* Rodapé com logo e créditos */}
      <div className="mt-auto bg-black/5 border-t border-black/10 px-4 py-3 flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/80">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              target.parentElement!.innerHTML =
                '<div class="w-full h-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs">B</div>'
            }}
          />
        </div>
        <div className="text-xs text-black/85 leading-tight">
          <div className="font-semibold text-black">Renan</div>
          <div>Desenvolvido por GV SOFTWARE</div>
        </div>
      </div>
    </>
  )
}

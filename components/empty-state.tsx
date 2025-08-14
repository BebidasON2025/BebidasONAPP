import type { LucideIcon } from "lucide-react"

export default function EmptyState({
  icon: Icon,
  title = "Nada por aqui",
  subtitle,
}: {
  icon: LucideIcon
  title?: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">
      <Icon className="h-10 w-10 text-slate-500" />
      <div className="text-slate-300">{title}</div>
      {subtitle ? <div className="text-sm">{subtitle}</div> : null}
    </div>
  )
}

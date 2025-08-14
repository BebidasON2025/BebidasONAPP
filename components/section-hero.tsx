import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export default function SectionHero({
  icon: Icon,
  title = "Título da Seção",
  description,
  actions,
}: {
  icon: LucideIcon
  title?: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <Card className="bg-[#171b22] border-[#262b35]">
      <CardContent className="flex items-center justify-between gap-4 p-4 md:p-5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg grid place-items-center bg-amber-500/15 border border-amber-500/30">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
            {description ? <p className="text-sm text-slate-400">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  )
}

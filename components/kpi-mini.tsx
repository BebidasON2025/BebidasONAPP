import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

const toneStyles: Record<
  "green" | "blue" | "purple" | "orange" | "yellow",
  { icon: string; value: string; box: string; border: string }
> = {
  green: { icon: "text-green-400", value: "text-green-400", box: "bg-green-500/10", border: "border-green-500/30" },
  blue: { icon: "text-blue-400", value: "text-blue-400", box: "bg-blue-500/10", border: "border-blue-500/30" },
  purple: {
    icon: "text-purple-400",
    value: "text-purple-400",
    box: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  orange: {
    icon: "text-orange-400",
    value: "text-orange-400",
    box: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  yellow: {
    icon: "text-yellow-400",
    value: "text-yellow-400",
    box: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
}

export default function KpiMini({
  icon: Icon,
  label = "Total",
  value = "0",
  tone = "green",
}: {
  icon: LucideIcon
  label?: string
  value?: string
  tone?: "green" | "blue" | "purple" | "orange" | "yellow"
}) {
  const t = toneStyles[tone]
  return (
    <Card className="bg-[#171b22] border-[#262b35]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`h-9 w-9 rounded-md grid place-items-center ${t.box} border ${t.border}`}>
          <Icon className={`h-5 w-5 ${t.icon}`} />
        </div>
        <div className="leading-tight">
          <div className="text-xs text-slate-400">{label}</div>
          <div className={`text-lg font-semibold ${t.value}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Tone = "green" | "red" | "yellow" | "blue" | "slate" | "orange"

const toneMap: Record<Tone, string> = {
  green: "text-green-400",
  red: "text-red-400",
  yellow: "text-yellow-300",
  blue: "text-blue-300",
  slate: "text-slate-200",
  orange: "text-orange-300",
}

export default function MetricCard({
  title = "Título",
  value = "0",
  hint,
  tone = "slate",
}: {
  title?: string
  value?: string
  hint?: string
  tone?: Tone
}) {
  return (
    <Card className="hc-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${toneMap[tone]}`}>{value}</div>
        {hint ? <div className="text-xs hc-muted mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign, CheckCircle, CreditCard, Clock } from "lucide-react"
import type { JSX } from "react"

type Variant = "green" | "blue" | "orange" | "red"
type RightIcon = "$" | "users" | "cart" | "box" | "check" | "credit" | "clock"

const bg: Record<Variant, string> = {
  green: "bg-green-600",
  blue: "bg-blue-600",
  orange: "bg-orange-500",
  red: "bg-red-500",
}

const iconMap: Record<RightIcon, JSX.Element> = {
  $: <DollarSign className="h-6 w-6 text-white/90" />,
  users: <Users className="h-6 w-6 text-white/90" />,
  cart: <ShoppingCart className="h-6 w-6 text-white/90" />,
  box: <Package className="h-6 w-6 text-white/90" />,
  check: <CheckCircle className="h-6 w-6 text-white/90" />,
  credit: <CreditCard className="h-6 w-6 text-white/90" />,
  clock: <Clock className="h-6 w-6 text-white/90" />,
}

export default function StatCard({
  variant = "green",
  title = "Título",
  value = "0",
  subtitle,
  rightIcon = "$",
}: {
  variant?: Variant
  title?: string
  value?: string
  subtitle?: string
  rightIcon?: RightIcon
}) {
  return (
    <Card className={`border-none text-white ${bg[variant]}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
        {iconMap[rightIcon]}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold leading-none tracking-tight">{value}</div>
        {subtitle ? <div className="text-xs mt-1 opacity-90">{subtitle}</div> : null}
      </CardContent>
    </Card>
  )
}

"use client"

interface LowStockListProps {
  products?: any[]
}

export default function LowStockList({ products = [] }: LowStockListProps) {
  const safeProducts = Array.isArray(products) ? products : []
  const low = safeProducts.filter((p) => (p?.estoque || 0) <= (p?.alerta_estoque || 10))

  if (low.length === 0) {
    return (
      <div className="rounded-md border hc-divider bg-[#1f242c] px-3 py-2 text-sm hc-muted">
        Nenhum produto com estoque baixo.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
        <div className="text-red-400 font-medium">Alerta de Estoque Baixo</div>
        <div className="text-xs text-red-200/80">Produtos que precisam de reposição urgente.</div>
      </div>
      {low.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-md border hc-divider bg-[#1f242c] px-3 py-2"
        >
          <div>
            <div className="font-medium text-slate-100">{p.nome}</div>
            <div className="text-xs hc-muted">{p.categoria ?? "—"}</div>
          </div>
          <div className="text-sm font-medium">{p.estoque === 0 ? "0 unid." : `${p.estoque} unid.`}</div>
        </div>
      ))}
    </div>
  )
}

"use client"

import type { ReactNode } from "react"

export default function PageHeader({
  title = "Título",
  description,
  actions,
}: {
  title?: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? <p className="text-sm hc-muted mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="border-b hc-divider" />
    </header>
  )
}

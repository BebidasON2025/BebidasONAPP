"use client"

/**
 * Wrap any element that is used as a DialogTrigger inside <StopClickPropagation>
 * to avoid dialogs opening and immediately closing when inside clickable table rows.
 *
 * Example:
 *  <DialogTrigger asChild>
 *    <StopClickPropagation>
 *      <Button size="sm">Editar</Button>
 *    </StopClickPropagation>
 *  </DialogTrigger>
 */
import type { PropsWithChildren } from "react"

export default function StopClickPropagation({ children }: PropsWithChildren) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        // shadcn Dialog closes on outside mousedown; prevent bubbling
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      className="inline-flex"
      role="none"
      data-stop-propagation
    >
      {children}
    </span>
  )
}

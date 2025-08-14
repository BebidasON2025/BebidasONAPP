"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

export default function MicButton({
  onResult,
  className,
  lang = "pt-BR",
  size = "icon",
  title = "Falar",
}: {
  onResult: (text: string) => void
  className?: string
  lang?: string
  size?: "sm" | "icon" | "default"
  title?: string
}) {
  const [listening, setListening] = useState(false)
  const rec = useSpeechRecognition({
    lang,
    onResult: (t) => {
      onResult(t)
      setListening(false)
    },
  })

  function toggle() {
    if (!rec.supported) return
    if (listening) {
      rec.stop()
      setListening(false)
    } else {
      rec.start()
      setListening(true)
    }
  }

  return (
    <Button
      type="button"
      size={size as any}
      variant="ghost"
      onClick={toggle}
      title={rec.supported ? title : "Voz não suportada"}
      className={cn(
        "shrink-0",
        listening ? "text-red-400 hover:text-red-500" : "text-slate-300 hover:text-slate-200",
        className,
      )}
      disabled={!rec.supported}
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )
}

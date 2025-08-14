"use client"

// Hook simples para reconhecimento de voz (pt-BR) via Web Speech API
export function useSpeechRecognition({
  lang = "pt-BR",
  onResult,
}: {
  lang?: string
  onResult: (text: string) => void
}) {
  const supported =
    typeof window !== "undefined" &&
    // @ts-expect-error webkit fallback
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  let recognition: any = null
  if (supported && typeof window !== "undefined") {
    // @ts-expect-error webkit fallback
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SR()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
  }

  const listeningRef = { value: false }

  function start() {
    if (!recognition) return
    if (listeningRef.value) return
    listeningRef.value = true
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim()
      if (transcript) onResult(transcript)
    }
    recognition.onend = () => {
      listeningRef.value = false
    }
    try {
      recognition.start()
    } catch {
      // alguns browsers jogam erro se start for chamado enquanto já está ativo
    }
  }

  function stop() {
    if (!recognition) return
    try {
      recognition.stop()
    } catch {}
    listeningRef.value = false
  }

  return { supported: Boolean(supported), start, stop }
}

"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export function ErrorBoundary({ children, fallback: Fallback }: ErrorBoundaryProps) {
  const [state, setState] = React.useState<ErrorBoundaryState>({ hasError: false })

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Error Boundary caught an error:", error.error)
      setState({ hasError: true, error: error.error })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Error Boundary caught an unhandled promise rejection:", event.reason)
      setState({ hasError: true, error: new Error(event.reason) })
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  const resetError = () => {
    setState({ hasError: false, error: undefined })
  }

  if (state.hasError) {
    if (Fallback) {
      return <Fallback error={state.error!} resetError={resetError} />
    }

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Algo deu errado</h1>
          <p className="text-gray-400 mb-6">Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar Página
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

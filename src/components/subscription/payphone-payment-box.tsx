"use client"

import React, { useLayoutEffect, useState, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface PayphonePaymentBoxProps {
  userEmail: string
  userName: string
  userDocumentId: string
}

declare global {
  interface Window {
    PPaymentButtonBox?: any
  }
}

function waitForPayphoneScript(timeoutMs: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PPaymentButtonBox) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      reject(new Error('Script de Payphone no cargó. Recarga la página.'))
    }, timeoutMs)

    const intervalId = setInterval(() => {
      if (window.PPaymentButtonBox) {
        clearTimeout(timeoutId)
        clearInterval(intervalId)
        resolve()
      }
    }, 100)
  })
}

export function PayphonePaymentBox({
  userEmail,
  userName,
  userDocumentId
}: PayphonePaymentBoxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false) // Prevents duplicate init calls
  const containerRef = useRef<HTMLDivElement>(null)
  const ppbInstanceRef = useRef<any>(null)
  const isInitializedRef = useRef(false)

  useLayoutEffect(() => {
    let isMounted = true

    const initPayment = async () => {
      if (isInitializedRef.current) return
      if (isInitializing) return // Prevent duplicate calls from React StrictMode or double-clicks

      setIsInitializing(true)
      try {
        // 1. Wait for PayPhone script
        await waitForPayphoneScript()

        const containerElement = containerRef.current
        if (!containerElement) {
          throw new Error('Contenedor de pago no disponible')
        }

        // 2. Fetch PayPhone config from server (credentials never exposed to client bundle)
        const initResponse = await fetch('/api/payphone/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userDocumentId,
            userName,
            userEmail,
          }),
        })

        if (!initResponse.ok) {
          const data = await initResponse.json().catch(() => ({}))
          throw new Error(data.error || 'Error al inicializar el pago')
        }

        const config = await initResponse.json()

        // 3. Render PayPhone button
        containerElement.innerHTML = ''

        const ppbInstance = new window.PPaymentButtonBox(config)
        ppbInstanceRef.current = ppbInstance
        ppbInstance.render('pp-button')

        isInitializedRef.current = true

        if (isMounted) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[Payphone] Error:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al inicializar Payphone')
          setIsLoading(false)
        }
      } finally {
        // Always reset initializing state, even on error
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initPayment()

    return () => {
      isMounted = false

      if (ppbInstanceRef.current) {
        if (typeof ppbInstanceRef.current.destroy === 'function') {
          ppbInstanceRef.current.destroy()
        }
        ppbInstanceRef.current = null
      }

      const container = containerRef.current || document.getElementById('pp-button')
      if (container) container.innerHTML = ''

      isInitializedRef.current = false
    }
  }, [userEmail, userName, userDocumentId, isInitializing])

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando Payphone...</span>
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div ref={containerRef} id="pp-button" className="min-h-[100px]" />
    </div>
  )
}

"use client"

import React, { useEffect, useState } from 'react'
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

export function PayphonePaymentBox({
  userEmail,
  userName,
  userDocumentId
}: PayphonePaymentBoxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const initPayment = async () => {
      try {
        // 1. Esperar a que el script de Payphone cargue (ya está en layout.tsx)
        if (!window.PPaymentButtonBox) {
          // Esperar máximo 10 segundos
          for (let i = 0; i < 100; i++) {
            await new Promise(resolve => setTimeout(resolve, 100))
            if (window.PPaymentButtonBox) break
          }
        }

        // 2. Validar que el script cargó
        if (!window.PPaymentButtonBox) {
          throw new Error('Script de Payphone no cargó. Recarga la página.')
        }

        // 3. Generar transaction ID
        const txId = `SUB-${Date.now()}`.substring(0, 50)

        // 4. Crear suscripción en backend
        const subResponse = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userDocumentId,
            plan: 'pro',
            amount: 499,
            clientTransactionId: txId,
          }),
        })

        if (!subResponse.ok) {
          throw new Error('Error al crear suscripción')
        }

        // 5. Obtener credenciales
        const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID

        if (!storeId) {
          throw new Error('STORE_ID no configurado')
        }

        // 6. Configurar Payphone (según documentación oficial)
        const config = {
          storeId: storeId,
          currency: "USD",
          reference: `Suscripción Pro - ${userName}`.substring(0, 100),

          amount: 499,
          amountWithoutTax: 419,
          amountWithTax: 80,
          tax: 0,
          service: 0,
          tip: 0,

          phoneNumber: "+593999999999",
          email: userEmail,
          documentId: "0000000000",
          identificationType: 1,

          clientTransactionId: txId,
          lang: "es",
          defaultMethod: "card",
          timeZone: -5,
          lat: "-0.180653",
          lng: "-78.467838",
          optionalParameter: txId,

          returnUrl: `${window.location.origin}/thank-you`
        }

        // 7. Renderizar botón (SIN await - render() NO es async)
        console.log('[Payphone] Inicializando con config:', config)

        const ppb = new window.PPaymentButtonBox(config)
        ppb.render('pp-button')

        console.log('[Payphone] Botón renderizado correctamente')

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[Payphone] Error:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al inicializar Payphone')
          setIsLoading(false)
        }
      }
    }

    initPayment()

    return () => { isMounted = false }
  }, [userEmail, userName, userDocumentId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando Payphone...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return <div id="pp-button" className="min-h-[100px]" />
}

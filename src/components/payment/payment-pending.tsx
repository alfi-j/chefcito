"use client"

import React, { useEffect, useState } from 'react'
import { Clock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentPendingProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
  onRedirect?: () => void
}

export function PaymentPending({
  transactionId,
  clientTransactionId,
  reference,
  onRedirect
}: PaymentPendingProps) {
  const [countdown, setCountdown] = useState(5)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!isRedirecting && onRedirect) {
            setIsRedirecting(true)
            onRedirect()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onRedirect, isRedirecting])

  return (
    <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="mx-auto">
          <Loader2 className="h-20 w-20 text-yellow-600 dark:text-yellow-400 animate-spin" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
            Procesando Pago
          </CardTitle>
          <CardDescription className="text-yellow-600 dark:text-yellow-300 text-base">
            Estamos verificando tu pago, por favor espera...
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Información del pago pendiente */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-3 border border-yellow-200 dark:border-yellow-800">
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {transactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transacción:</span>
              <span className="text-sm font-mono text-xs">{transactionId}</span>
            </div>
          )}
          {clientTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID Cliente:</span>
              <span className="text-sm font-mono text-xs truncate max-w-[200px]">
                {clientTransactionId}
              </span>
            </div>
          )}
        </div>

        {/* Mensaje de estado */}
        <div className="text-center space-y-2 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Verificando con el banco...</span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Este proceso puede tomar unos segundos. No cierres esta ventana.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        {/* Botón manual de redirección */}
        <Button
          onClick={() => {
            setIsRedirecting(true)
            onRedirect?.()
          }}
          variant="outline"
          className="w-full border-yellow-300 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-950/30"
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Redirigiendo...
            </>
          ) : (
            <>
              Volver al Perfil
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Contador de auto-redirect */}
        {countdown > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo en {countdown} segundo{countdown > 1 ? 's' : ''}...</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

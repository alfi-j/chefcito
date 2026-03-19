"use client"

import React, { useEffect, useState } from 'react'
import { XCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentFailedProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
  onRetry?: () => void
  onRedirect?: () => void
}

export function PaymentFailed({
  transactionId,
  clientTransactionId,
  reference,
  onRetry,
  onRedirect
}: PaymentFailedProps) {
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
    <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="mx-auto">
          <XCircle className="h-20 w-20 text-red-600 dark:text-red-400 animate-in zoom-in duration-300" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-red-700 dark:text-red-400">
            Pago Cancelado
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-300 text-base">
            No se pudo completar tu pago
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Detalles del intento fallido */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-3 border border-red-200 dark:border-red-800">
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

        {/* Mensaje de ayuda */}
        <div className="text-center space-y-2 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            ¿Qué puedes hacer?
          </p>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 text-left">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Verifica que tu tarjeta tenga fondos suficientes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Confirma que los datos de tu tarjeta sean correctos
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Intenta con otro método de pago
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        {/* Botones de acción */}
        <div className="flex gap-2 w-full">
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex-1 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button
            onClick={() => {
              setIsRedirecting(true)
              onRedirect?.()
            }}
            variant="destructive"
            className="flex-1"
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
        </div>

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

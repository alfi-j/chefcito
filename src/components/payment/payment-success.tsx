"use client"

import React, { useEffect, useState } from 'react'
import { CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentSuccessProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
  amount?: string
  onRedirect?: () => void
}

export function PaymentSuccess({
  transactionId,
  clientTransactionId,
  reference,
  amount,
  onRedirect
}: PaymentSuccessProps) {
  const [countdown, setCountdown] = useState(3)
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
    <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="mx-auto">
          <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400 animate-in zoom-in duration-300" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-400">
            ¡Pago Exitoso!
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300 text-base">
            Tu suscripción Pro ha sido activada correctamente
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Detalles del pago */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-3 border border-green-200 dark:border-green-800">
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ${parseFloat(amount).toFixed(2)} USD
              </span>
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

        {/* Mensaje de beneficios */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Ahora tienes acceso a todas las funcionalidades Pro:
          </p>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Reportes avanzados
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              KDS ilimitado
            </li>
            <li className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Soporte prioritario
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        {/* Contador de auto-redirect */}
        {countdown > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo en {countdown} segundo{countdown > 1 ? 's' : ''}...</span>
          </div>
        )}
        
        {/* Botón manual de redirección */}
        <Button
          onClick={() => {
            setIsRedirecting(true)
            onRedirect?.()
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
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
      </CardFooter>
    </Card>
  )
}

"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentStatusPollProps {
  clientTransactionId: string | undefined
  transactionId: string | undefined
  reference: string | undefined
  amount: string | undefined
  initialStatusCode: string
}

/**
 * PaymentStatusPoll component
 *
 * Polls the subscription status every 3 seconds for up to 60 seconds.
 * If the webhook already activated the subscription, it redirects early.
 * If timeout is reached with no activation, shows a "Contact support" message.
 */
export function PaymentStatusPoll({
  clientTransactionId,
  transactionId,
  reference,
  amount,
  initialStatusCode,
}: PaymentStatusPollProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'polling' | 'activated' | 'timeout' | 'redirecting'>('polling')
  const [elapsed, setElapsed] = useState(0)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  const POLL_INTERVAL_MS = 3000
  const POLL_TIMEOUT_MS = 60000
  const [pollCount, setPollCount] = useState(0)

  const checkSubscriptionStatus = useCallback(async () => {
    if (!clientTransactionId) return

    try {
      setPollCount(prev => prev + 1)
      // Log each poll attempt for debugging
      console.log(`[PaymentStatusPoll] Polling subscription status (attempt #${pollCount + 1}) for:`, clientTransactionId)

      const response = await fetch(`/api/subscriptions/status?clientTransactionId=${encodeURIComponent(clientTransactionId)}`)

      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          const currentStatus = data.subscription.status
          setSubscriptionStatus(currentStatus)
          console.log(`[PaymentStatusPoll] Status received:`, currentStatus)

          // Early exit if status is active (payment approved)
          if (currentStatus === 'active') {
            setStatus('activated')
            setStatus('redirecting')
            console.log('[PaymentStatusPoll] Subscription activated, redirecting...')
            setTimeout(() => {
              router.push('/profile?payment=success&txId=' + clientTransactionId)
            }, 1000)
            return
          }

          // Early exit if status is cancelled (payment failed/cancelled)
          if (currentStatus === 'cancelled') {
            console.log('[PaymentStatusPoll] Subscription cancelled, stopping polling')
            setStatus('timeout') // Reuse timeout state to show "contact support" UI
            return
          }
        }
      } else {
        console.warn('[PaymentStatusPoll] Failed to fetch status, response status:', response.status)
      }
    } catch (error) {
      console.error('[PaymentStatusPoll] Error checking subscription status:', error)
    }
  }, [clientTransactionId, router, pollCount])

  useEffect(() => {
    // If we already have a terminal status from server-side, don't poll
    if (initialStatusCode === '3' || initialStatusCode === '2') {
      setStatus(initialStatusCode === '3' ? 'redirecting' : 'timeout')
      if (initialStatusCode === '3') {
        setTimeout(() => {
          router.push('/profile?payment=success&txId=' + clientTransactionId)
        }, 2000)
      }
      return
    }

    // If no clientTransactionId, can't poll
    if (!clientTransactionId) {
      setStatus('timeout')
      return
    }

    // Start polling
    const startTime = Date.now()
    const pollInterval = setInterval(() => {
      const timeElapsed = Date.now() - startTime
      setElapsed(Math.floor(timeElapsed / 1000))

      if (timeElapsed >= POLL_TIMEOUT_MS) {
        clearInterval(pollInterval)
        setStatus('timeout')
        return
      }

      checkSubscriptionStatus()
    }, POLL_INTERVAL_MS)

    // Also check immediately
    checkSubscriptionStatus()

    return () => clearInterval(pollInterval)
  }, [clientTransactionId, initialStatusCode, checkSubscriptionStatus, router])

  if (status === 'redirecting') {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-green-700">
              ¡Pago Exitoso!
            </CardTitle>
            <CardDescription className="text-green-600 text-base">
              Tu suscripción Pro ha sido activada correctamente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-card rounded-lg p-4 space-y-3 border border-green-200">
            {reference && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concepto:</span>
                <span className="text-sm font-medium">{reference}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monto:</span>
                <span className="text-sm font-semibold text-green-600">
                  ${(parseFloat(amount) / 100).toFixed(2)} USD
                </span>
              </div>
            )}
            {clientTransactionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID Cliente:</span>
                <span className="text-sm font-mono text-xs truncate max-w-[200px]">{clientTransactionId}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo a tu perfil...</span>
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (status === 'timeout') {
    return (
      <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <AlertTriangle className="h-20 w-20 text-yellow-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-yellow-700">
              Verificando tu Pago
            </CardTitle>
            <CardDescription className="text-yellow-600 text-base">
              Estamos procesando tu pago. Puede tomar unos minutos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {clientTransactionId && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ID de Transacción (para soporte):</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {clientTransactionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Si tu pago no se refleja en unos minutos, contacta a soporte con este ID.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="text-center space-y-2 p-4 bg-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">¿Qué está pasando?</p>
            <ul className="text-sm text-yellow-700 space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Tu pago puede estar siendo procesado por el banco
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                La activación automática puede tardar hasta 5 minutos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Si no se activa, contacta a soporte con el ID de transacción
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <Button
            onClick={() => router.push('/profile')}
            className="w-full"
          >
            Ir al Perfil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Verificar de Nuevo
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Polling state
  return (
    <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50/50 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <Clock className="h-20 w-20 text-yellow-600 mx-auto animate-pulse" />
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-yellow-700">
            Verificando Pago
          </CardTitle>
          <CardDescription className="text-yellow-600 text-base">
            Confirmando tu suscripción Pro...
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-card rounded-lg p-4 space-y-3 border border-yellow-200">
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className="text-sm font-semibold text-yellow-600">
                ${(parseFloat(amount) / 100).toFixed(2)} USD
              </span>
            </div>
          )}
          {clientTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID Cliente:</span>
              <span className="text-sm font-mono text-xs truncate max-w-[200px]">{clientTransactionId}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 p-4 bg-yellow-100 rounded-lg">
          <Clock className="h-5 w-5 animate-spin text-yellow-700" />
          <div className="text-center">
            <p className="text-sm font-medium text-yellow-800">
              Verificando con el servidor...
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {elapsed}s transcurridos ({pollCount} intentos)
            </p>
            {subscriptionStatus && (
              <p className="text-xs text-yellow-600 mt-1 font-mono">
                Estado actual: {subscriptionStatus}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        <Button
          onClick={() => router.push('/profile')}
          variant="outline"
          className="w-full"
        >
          Ir al Perfil (puede mostrar estado antiguo)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

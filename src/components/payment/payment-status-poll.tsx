"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Timer } from 'lucide-react'
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
 * Polls the subscription status every 3 seconds for up to 5 minutes (PayPhone reversal window).
 * Every 3rd poll, it also POSTs to /api/payphone/confirm to actively try to activate
 * the subscription via PayPhone Confirm API.
 *
 * Shows a countdown timer with urgency indicator when < 60 seconds remain.
 * PayPhone reverses transactions automatically if Confirm API is not called within 5 minutes.
 */
export function PaymentStatusPoll({
  clientTransactionId,
  transactionId,
  reference,
  amount,
  initialStatusCode,
}: PaymentStatusPollProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'polling' | 'activated' | 'timeout' | 'redirecting' | 'cancelled'>('polling')
  const [elapsed, setElapsed] = useState(0)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const POLL_INTERVAL_MS = 3000
  const POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes — PayPhone reversal window
  const URGENCY_THRESHOLD_MS = 60 * 1000 // 60 seconds — show urgency UI
  const [pollCount, setPollCount] = useState(0)

  /**
   * Call the confirm endpoint to actively try to activate the subscription.
   * This is the critical call that tells PayPhone to finalize the transaction.
   */
  const callConfirmEndpoint = useCallback(async (): Promise<{ success: boolean; status?: string }> => {
    if (!clientTransactionId) return { success: false }

    try {
      const response = await fetch('/api/payphone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTransactionId,
          ...(transactionId ? { id: transactionId } : {}),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[PaymentStatusPoll] Confirm endpoint response:', data)
        return { success: true, status: data.status }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setConfirmError(errorData.error || 'Error calling confirm endpoint')
        return { success: false }
      }
    } catch (error) {
      console.error('[PaymentStatusPoll] Error calling confirm endpoint:', error)
      setConfirmError('Network error calling confirm endpoint')
      return { success: false }
    }
  }, [clientTransactionId, transactionId])

  /**
   * Check subscription status via GET endpoint.
   */
  const checkSubscriptionStatus = useCallback(async () => {
    if (!clientTransactionId) return { earlyExit: false }

    try {
      setPollCount(prev => prev + 1)
      const currentPollCount = pollCount + 1

      console.log(`[PaymentStatusPoll] Polling subscription status (attempt #${currentPollCount}) for:`, clientTransactionId)

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
            return { earlyExit: true }
          }

          // Early exit if status is cancelled (payment failed/cancelled)
          if (currentStatus === 'cancelled') {
            console.log('[PaymentStatusPoll] Subscription cancelled, stopping polling')
            setStatus('cancelled')
            return { earlyExit: true }
          }
        }
      } else {
        console.warn('[PaymentStatusPoll] Failed to fetch status, response status:', response.status)
      }
    } catch (error) {
      console.error('[PaymentStatusPoll] Error checking subscription status:', error)
      return { earlyExit: false }
    }

    return { earlyExit: false }
  }, [clientTransactionId, router, pollCount])

  useEffect(() => {
    // If we already have a terminal status from server-side, don't poll
    if (initialStatusCode === '3') {
      setStatus('redirecting')
      setTimeout(() => {
        router.push('/profile?payment=success&txId=' + clientTransactionId)
      }, 2000)
      return
    }
    if (initialStatusCode === '2') {
      setStatus('cancelled')
      return
    }

    // If no clientTransactionId, can't poll
    if (!clientTransactionId) {
      setStatus('timeout')
      return
    }

    // Start polling with countdown timer
    const startTime = Date.now()

    // First poll immediately
    const doPoll = async () => {
      const timeElapsed = Date.now() - startTime
      setElapsed(Math.floor(timeElapsed / 1000))

      const remaining = POLL_TIMEOUT_MS - timeElapsed

      // Time's up — PayPhone would have reversed the transaction
      if (remaining <= 0) {
        setStatus('timeout')
        return
      }

      // Every 3rd poll, call the confirm endpoint to actively try to activate
      const currentPollCount = pollCount + 1
      if (currentPollCount % 3 === 1) {
        console.log('[PaymentStatusPoll] Calling confirm endpoint (poll #' + currentPollCount + ')')
        const confirmResult = await callConfirmEndpoint()

        // If confirm returned a terminal status, handle it
        if (confirmResult.success && confirmResult.status === 'active') {
          setStatus('redirecting')
          setTimeout(() => {
            router.push('/profile?payment=success&txId=' + clientTransactionId)
          }, 1000)
          return
        }
        if (confirmResult.success && confirmResult.status === 'cancelled') {
          setStatus('cancelled')
          return
        }
      }

      // Also check subscription status
      const { earlyExit } = await checkSubscriptionStatus()
      if (earlyExit) return

      // Schedule next poll
      setTimeout(doPoll, POLL_INTERVAL_MS)
    }

    const pollTimeout = setTimeout(doPoll, 0)

    // Also update elapsed time display every second
    const timerInterval = setInterval(() => {
      const timeElapsed = Date.now() - startTime
      setElapsed(Math.floor(timeElapsed / 1000))

      if (timeElapsed >= POLL_TIMEOUT_MS) {
        setStatus('timeout')
        clearInterval(timerInterval)
      }
    }, 1000)

    return () => {
      clearTimeout(pollTimeout)
      clearInterval(timerInterval)
    }
  }, [clientTransactionId, initialStatusCode, checkSubscriptionStatus, callConfirmEndpoint, router, pollCount])

  const remainingMs = POLL_TIMEOUT_MS - elapsed * 1000
  const isUrgent = remainingMs > 0 && remainingMs < URGENCY_THRESHOLD_MS
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

  // Redirecting state
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

  // Cancelled state
  if (status === 'cancelled') {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <AlertTriangle className="h-20 w-20 text-red-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-red-700">
              Pago Cancelado
            </CardTitle>
            <CardDescription className="text-red-600 text-base">
              Tu pago fue cancelado o rechazado
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {clientTransactionId && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ID de Transacción:</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {clientTransactionId}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="text-center space-y-2 p-4 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800 font-medium">¿Qué puedes hacer?</p>
            <ul className="text-sm text-red-700 space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Intenta nuevamente con otro método de pago
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Verifica que tu tarjeta tenga fondos suficientes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Contacta a tu banco si el problema persiste
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
            onClick={() => router.refresh()}
            variant="outline"
            className="w-full"
          >
            Intentar de Nuevo
          </Button>
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
              Tiempo de Verificación Agotado
            </CardTitle>
            <CardDescription className="text-yellow-600 text-base">
              No pudimos confirmar tu pago en el tiempo esperado
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
                    Si tu pago fue cobrado pero no se activó, contacta a soporte con este ID.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {confirmError && (
            <Alert variant="destructive">
              <AlertDescription>
                Error al confirmar con PayPhone: {confirmError}
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
                PayPhone puede revertir transacciones no confirmadas en 5 minutos
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

  // Polling state with countdown timer
  return (
    <Card className={`w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500 ${
      isUrgent ? 'border-red-300 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'
    }`}>
      <CardHeader className="text-center space-y-4 pb-2">
        {isUrgent ? (
          <Timer className="h-20 w-20 text-red-600 mx-auto animate-pulse" />
        ) : (
          <Clock className="h-20 w-20 text-yellow-600 mx-auto animate-pulse" />
        )}
        <div className="space-y-2">
          <CardTitle className={`text-3xl font-bold ${
            isUrgent ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {isUrgent ? '¡Tiempo Limitado!' : 'Verificando Pago'}
          </CardTitle>
          <CardDescription className={isUrgent ? 'text-red-600 text-base' : 'text-yellow-600 text-base'}>
            {isUrgent
              ? `Quedan ${remainingSeconds}s para confirmar tu pago`
              : 'Confirmando tu suscripción Pro...'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className={`rounded-lg p-4 space-y-3 border ${
          isUrgent ? 'bg-white border-red-200' : 'bg-card border-yellow-200'
        }`}>
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className={`text-sm font-semibold ${
                isUrgent ? 'text-red-600' : 'text-yellow-600'
              }`}>
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

        {/* Countdown timer */}
        <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
          isUrgent ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          {isUrgent ? (
            <Timer className="h-5 w-5 animate-spin text-red-700" />
          ) : (
            <Clock className="h-5 w-5 animate-spin text-yellow-700" />
          )}
          <div className="text-center">
            <p className={`text-sm font-medium ${
              isUrgent ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {isUrgent
                ? '⚠️ Confirmando con urgencia...'
                : 'Verificando con el servidor...'}
            </p>
            <p className={`text-xs mt-1 ${
              isUrgent ? 'text-red-700 font-bold' : 'text-yellow-700'
            }`}>
              {elapsed}s transcurridos · {remainingSeconds}s restantes ({pollCount} intentos)
            </p>
            {subscriptionStatus && (
              <p className="text-xs text-yellow-600 mt-1 font-mono">
                Estado actual: {subscriptionStatus}
              </p>
            )}
          </div>
        </div>

        {confirmError && (
          <Alert variant="destructive">
            <AlertDescription>
              Error al confirmar: {confirmError}
            </AlertDescription>
          </Alert>
        )}
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

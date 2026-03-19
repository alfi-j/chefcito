import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PaymentSuccess } from '@/components/payment/payment-success'
import { PaymentFailed } from '@/components/payment/payment-failed'
import { PaymentPending } from '@/components/payment/payment-pending'

export const metadata: Metadata = {
  title: 'Resultado del Pago | Chefcito',
  description: 'Verifica el estado de tu pago de suscripción Pro',
  robots: 'noindex, nofollow'
}

interface ThankYouPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams
  
  // Extraer parámetros de Payphone
  const transactionId = params.transactionId as string | undefined
  const clientTransactionId = params.clientTransactionId as string | undefined
  const status = params.status as string | undefined
  const statusCode = params.statusCode as string | undefined
  const reference = params.reference as string | undefined
  const amount = params.amount as string | undefined

  // Validar parámetros requeridos mínimos
  if (!clientTransactionId) {
    // Redirigir al perfil si no hay parámetros válidos
    redirect('/profile?payment=invalid')
  }

  // Determinar el estado del pago
  // statusCode: 3 = Aprobado, 2 = Cancelado, otros = Pendiente/Desconocido
  const paymentStatus = statusCode === '3' || status === 'Approved' 
    ? 'success' 
    : statusCode === '2' || status === 'Canceled' || status === 'Error'
      ? 'failed'
      : 'pending'

  // Preparar props comunes
  const commonProps = {
    transactionId: transactionId || undefined,
    clientTransactionId: clientTransactionId || undefined,
    reference: reference || undefined,
    amount: amount || undefined,
  }

  // Funciones de redirección (se ejecutarán en el cliente)
  const handleRedirect = () => {
    // Esta función se ejecutará en el cliente
    window.location.href = '/profile'
  }

  const handleRetry = () => {
    // Redirigir al perfil para reintentar el pago
    window.location.href = '/profile?payment=retry'
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-lg">
        {paymentStatus === 'success' && (
          <PaymentSuccess 
            {...commonProps} 
            onRedirect={handleRedirect}
          />
        )}
        
        {paymentStatus === 'failed' && (
          <PaymentFailed 
            {...commonProps}
            onRetry={handleRetry}
            onRedirect={handleRedirect}
          />
        )}
        
        {paymentStatus === 'pending' && (
          <PaymentPending 
            {...commonProps}
            onRedirect={handleRedirect}
          />
        )}
      </div>
    </main>
  )
}

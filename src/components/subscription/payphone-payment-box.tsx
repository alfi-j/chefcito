"use client"

import React, { useEffect, useState } from 'react'

interface PayphonePaymentBoxProps {
  userEmail: string
  userName: string
  userDocumentId: string
}

declare global {
  interface Window {
    PPaymentButtonBox: any
  }
}

// Función para esperar a que el script de Payphone esté disponible
async function waitForPayphoneScript(timeoutMs: number = 10000): Promise<void> {
  console.log('[PayphoneScript] Iniciando espera del script de Payphone...')
  
  return new Promise((resolve, reject) => {
    // Verifica inmediatamente
    if (window.PPaymentButtonBox) {
      console.log('[PayphoneScript] PPaymentButtonBox ya está disponible')
      resolve()
      return
    }

    // Polling cada 100ms con timeout
    const startTime = Date.now()
    const interval = setInterval(() => {
      if (window.PPaymentButtonBox) {
        clearInterval(interval)
        const loadTime = Date.now() - startTime
        console.log(`[PayphoneScript] PPaymentButtonBox disponible después de ${loadTime}ms`)
        resolve()
        return
      }
      
      if (Date.now() - startTime >= timeoutMs) {
        clearInterval(interval)
        const errorMsg = `Payphone script no cargó en ${timeoutMs}ms`
        console.error('[PayphoneScript] TIMEOUT:', errorMsg)
        reject(new Error(errorMsg))
      }
    }, 100)
  })
}

export function PayphonePaymentBox({
  userEmail,
  userName,
  userDocumentId
}: PayphonePaymentBoxProps) {
  const [clientTransactionId, setClientTransactionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generar ID único y crear suscripción
  useEffect(() => {
    let isMounted = true
    
    const generateAndCreate = async () => {
      console.log('[PayphonePaymentBox] === INICIANDO ===')
      console.log('[PayphonePaymentBox] userDocumentId:', userDocumentId)
      
      const newClientTransactionId = `SUB-${userDocumentId}-${Date.now()}`
      setClientTransactionId(newClientTransactionId)

      // Crear suscripción en el backend
      try {
        console.log('[PayphonePaymentBox] Creando suscripción para:', userDocumentId)
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userDocumentId,
            plan: 'pro',
            amount: 499,
            clientTransactionId: newClientTransactionId,
          }),
        })

        const responseData = await response.json()
        console.log('[PayphonePaymentBox] Respuesta del backend:', response.status, responseData)

        if (!response.ok) {
          console.error('[PayphonePaymentBox] Error al crear suscripción:', responseData)
          if (isMounted) {
            setError(`Error del servidor: ${responseData.error || 'Error desconocido'}`)
          }
        }
      } catch (error) {
        console.error('[PayphonePaymentBox] Excepción creando suscripción:', error)
        if (isMounted) {
          setError(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          console.log('[PayphonePaymentBox] Cambiando isLoading a false')
        }
      }
    }

    generateAndCreate()

    return () => {
      isMounted = false
    }
  }, [userDocumentId])

  // Inicializar Payphone cuando clientTransactionId esté disponible
  useEffect(() => {
    let isMounted = true

    const initializePayphone = async () => {
      if (!clientTransactionId || isLoading) {
        return
      }

      try {
        console.log('[PayphonePaymentBox] === INICIALIZANDO PAYPHONE ===')
        
        // Verificar credenciales
        const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN
        const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID

        if (!token || !storeId) {
          console.error('[PayphonePaymentBox] Credenciales no configuradas')
          setError('Credenciales de Payphone no configuradas')
          return
        }

        // Esperar a que el script de Payphone esté disponible
        console.log('[PayphonePaymentBox] Esperando script de Payphone...')
        await waitForPayphoneScript(10000)

        // Verificar que PPaymentButtonBox esté disponible
        console.log('[PayphonePaymentBox] window.PPaymentButtonBox existe:', !!window.PPaymentButtonBox)
        console.log('[PayphonePaymentBox] window.PPaymentButtonBox es función:', typeof window.PPaymentButtonBox === 'function')

        if (!window.PPaymentButtonBox) {
          throw new Error('window.PPaymentButtonBox no está disponible')
        }

        // Calcular montos correctamente (IVA 12% en Ecuador)
        const amount = 499
        // Opción: monto incluye IVA - desglosamos correctamente
        const amountWithoutTax = Math.round(amount / 1.12)  // 446 (base sin IVA)
        const tax = amount - amountWithoutTax                // 53 (12% IVA)
        const amountWithTax = 0  // No hay monto adicional sujeto a impuesto

        // URL de redirección - Usar variable de entorno si existe
        const returnUrl = process.env.NEXT_PUBLIC_PAYPHONE_RETURN_URL || `${window.location.origin}/api/payphone/success`

        // Verificar dominio para desarrollo
        const currentDomain = window.location.origin
        const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')
        
        if (isLocalhost) {
          console.warn('[PayphonePaymentBox] ⚠️ ADVERTENCIA: Estás usando localhost')
          console.warn('[PayphonePaymentBox] Payphone requiere que el dominio esté registrado en Payphone Developer')
          console.warn('[PayphonePaymentBox] Para desarrollo local, usa ngrok:')
          console.warn('[PayphonePaymentBox]   1. Ejecuta: ngrok http 3000')
          console.warn('[PayphonePaymentBox]   2. Registra la URL de ngrok en Payphone Developer')
          console.warn('[PayphonePaymentBox]   3. Accede desde la URL de ngrok (no localhost)')
        }

        console.log('[PayphonePaymentBox] returnUrl configurado:', returnUrl)
        console.log('[PayphonePaymentBox] Dominio actual:', currentDomain)
        console.log('[PayphonePaymentBox] window.location.origin:', window.location.origin)

        // Validar longitud de clientTransactionId (máximo 50 caracteres según docs Payphone)
        const safeClientTransactionId = clientTransactionId.length > 50
          ? clientTransactionId.substring(0, 50)
          : clientTransactionId

        // Validar longitud de reference (máximo 100 caracteres según docs Payphone)
        const reference = `Suscripción Pro Chefcito - ${userName}`
        const safeReference = reference.length > 100
          ? reference.substring(0, 100)
          : reference

        // Generar lat/lng dinámicos basados en timestamp para evitar patrón repetitivo
        // Payphone puede rechazar coordenadas idénticas en múltiples transacciones como "sospechoso"
        const baseLat = -0.180653
        const baseLng = -78.467838
        const latVariation = (Date.now() % 1000) / 1000000  // Variación mínima de 0.000001
        const lngVariation = (clientTransactionId.length % 1000) / 1000000
        const dynamicLat = (baseLat + latVariation).toFixed(6)
        const dynamicLng = (baseLng + lngVariation).toFixed(6)

        // Configuración de Payphone
        // NOTA: documentId, identificationType y phoneNumber son OPCIONALES
        // Se omiten intencionalmente para evitar rechazo por datos falsos/repetitivos
        // Payphone solicitará estos datos al usuario durante el checkout
        const config = {
          token: token,
          clientTransactionId: safeClientTransactionId,
          amount: amount,
          amountWithoutTax: amountWithoutTax,
          amountWithTax: amountWithTax,
          tax: tax,
          service: 0,
          tip: 0,
          currency: "USD",
          storeId: storeId,
          reference: safeReference,
          lang: "es",
          defaultMethod: "card",
          timeZone: -5,
          lat: dynamicLat,  // Coordenadas con variación mínima para evitar patrón repetitivo
          lng: dynamicLng,  // Coordenadas con variación mínima para evitar patrón repetitivo
          optionalParameter: safeClientTransactionId,
          email: userEmail,  // Email real del usuario - ESTE SÍ SE ENVÍA
          returnUrl: returnUrl
          // documentId: OMITIDO (Payphone lo solicitará al usuario)
          // identificationType: OMITIDO (Payphone lo solicitará al usuario)
          // phoneNumber: OMITIDO (Payphone lo solicitará al usuario)
        }

        console.log('[PayphonePaymentBox] Configuración de Payphone:', {
          ...config,
          token: config.token.substring(0, 10) + '...'
        })

        // Log explícito de campos omitidos para evitar error 400
        console.log('[PayphonePaymentBox] Campos OMITIDOS intencionalmente (opcionales - Payphone los solicitará al usuario):')
        console.log('  - documentId: OMITIDO (evita rechazo por dato falso/repetitivo)')
        console.log('  - identificationType: OMITIDO (requiere documentId real)')
        console.log('  - phoneNumber: OMITIDO (evita rechazo por dato falso/repetitivo)')
        console.log('[PayphonePaymentBox] Campos ENVIADOS:')
        console.log('  - email:', config.email, '(real del usuario)')
        console.log('  - clientTransactionId length:', config.clientTransactionId.length, '(máx 50)')
        console.log('  - reference length:', config.reference.length, '(máx 100)')
        console.log('  - lat:', config.lat, '(dinámico para evitar patrón repetitivo)')
        console.log('  - lng:', config.lng, '(dinámico para evitar patrón repetitivo)')
        console.log('  - returnUrl:', config.returnUrl)
        console.log('  - window.location.origin:', window.location.origin)

        console.log('[PayphonePaymentBox] ⚠️ VERIFICACIÓN DE DOMINIO:')
        console.log('  Dominio actual:', currentDomain)
        console.log('  ¿Está este dominio registrado en Payphone Developer?')
        console.log('  Si NO, obtendrás error 400 - Usa ngrok: `ngrok http 3000` y registra esa URL')

        // Validar fórmula de montos antes de enviar
        const calculatedTotal = config.amountWithoutTax + config.amountWithTax + config.tax + config.service + config.tip
        console.log('[PayphonePaymentBox] Validación de montos:', {
          amount: config.amount,
          calculatedTotal,
          match: calculatedTotal === config.amount
        })

        // Crear instancia de Payphone
        console.log('[PayphonePaymentBox] Creando instancia PPaymentButtonBox...')
        const ppb = new window.PPaymentButtonBox(config)

        // Renderizar en el contenedor
        console.log('[PayphonePaymentBox] Renderizando en #pp-button...')
        ppb.render('pp-button')
        
        console.log('[PayphonePaymentBox] === RENDERIZADO COMPLETADO ===')
      } catch (error) {
        console.error('[PayphonePaymentBox] ERROR durante inicialización:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Error al inicializar Payphone')
        }
      }
    }

    initializePayphone()

    return () => {
      isMounted = false
    }
  }, [clientTransactionId, isLoading, userEmail, userName, userDocumentId])

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-destructive text-sm font-medium">Error al cargar Payphone</p>
        <p className="text-destructive/70 text-xs mt-1">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando Payphone...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contenedor del botón de Payphone - La UI oficial se renderiza aquí */}
      <div id="pp-button" className="flex justify-center" />
    </div>
  )
}

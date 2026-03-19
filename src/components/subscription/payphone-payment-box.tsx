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

        // ============================================
        // DIAGNÓSTICO DE CREDENCIALES
        // ============================================
        console.log('[PayphonePaymentBox] 🔍 DIAGNÓSTICO DE CREDENCIALES:')
        console.log('NEXT_PUBLIC_PAYPHONE_TOKEN existe:', !!process.env.NEXT_PUBLIC_PAYPHONE_TOKEN)
        console.log('NEXT_PUBLIC_PAYPHONE_STORE_ID existe:', !!process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID)
        console.log('Token (primeros 10 chars):', process.env.NEXT_PUBLIC_PAYPHONE_TOKEN?.substring(0, 10) + '...')
        console.log('StoreID:', process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID)
        console.log('Todas las env vars PAYPHONE disponibles:', Object.keys(process.env).filter(k => k.includes('PAYPHONE')))
        // ============================================

        // Verificar credenciales
        const token = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN
        const storeId = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID

        if (!token || !storeId) {
          console.error('[PayphonePaymentBox] Credenciales no configuradas')
          console.error('[PayphonePaymentBox] Token:', token ? '✓ presente' : '✗ AUSENTE')
          console.error('[PayphonePaymentBox] StoreID:', storeId ? '✓ presente' : '✗ AUSENTE')
          setError('Credenciales de Payphone no configuradas')
          return
        }

        console.log('[PayphonePaymentBox] ✓ Credenciales validadas correctamente')

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

        // URL de redirección - Usar variable de entorno o fallback a window.location.origin
        const returnUrl = process.env.NEXT_PUBLIC_PAYPHONE_RETURN_URL || `${window.location.origin}/api/payphone/success`

        // Verificar dominio para desarrollo
        const currentDomain = window.location.origin
        const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')

        // LOGS EXPLÍCITOS PARA DEBUGGING DEL ERROR 400
        console.log('[PayphonePaymentBox] 🔍 DEBUGGING ERROR 400:')
        console.log('  returnUrl configurado:', returnUrl)
        console.log('  NEXT_PUBLIC_PAYPHONE_RETURN_URL:', process.env.NEXT_PUBLIC_PAYPHONE_RETURN_URL || 'no definida')
        console.log('  window.location.origin:', window.location.origin)
        console.log('  currentDomain:', currentDomain)
        console.log('  ¿Es localhost?:', isLocalhost)
        console.log('\n  ⚠️ VERIFICA EN PAYPHONE DEVELOPER:')
        console.log(`    Web Domain debe ser: ${isLocalhost ? 'localhost' : currentDomain.replace('http://', '').replace('https://', '')}`)
        console.log(`    Response URL debe ser: ${returnUrl}`)

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

        // Generar lat/lng como ENTEROS según documentación oficial de Payphone
        // Error 800: "Lat: No es entero entre -90 y 90", "Lng: No es entero entre -180 y 180"
        // Payphone requiere ENTEROS, NO strings con decimales
        const baseLat = -0.180653
        const baseLng = -78.467838
        // Redondear a ENTERO como requiere Payphone
        const latInt = Math.round(baseLat)  // Resultado: 0 (entero)
        const lngInt = Math.round(baseLng)  // Resultado: -78 (entero)
        
        // Validar que estén dentro del rango permitido
        const safeLat = Math.max(-90, Math.min(90, latInt))
        const safeLng = Math.max(-180, Math.min(180, lngInt))

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
          timeZone: -5,  // ENTERO válido (-12 a 14)
          lat: safeLat,  // ✅ ENTERO (NO string) - Requerido por Payphone Error 800
          lng: safeLng,  // ✅ ENTERO (NO string) - Requerido por Payphone Error 800
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
        console.log('  - lat:', config.lat, '(ENTERO - Payphone requiere entero NO string)')
        console.log('  - lng:', config.lng, '(ENTERO - Payphone requiere entero NO string)')
        console.log('  - timeZone:', config.timeZone, '(ENTERO válido entre -12 y 14)')
        console.log('  - returnUrl:', config.returnUrl)
        console.log('  - window.location.origin:', window.location.origin)
        console.log('[PayphonePaymentBox] 🔍 VALIDACIONES CRÍTICAS:')
        console.log('  - lat es número:', typeof config.lat === 'number', '(debe ser true)')
        console.log('  - lng es número:', typeof config.lng === 'number', '(debe ser true)')
        console.log('  - lat en rango [-90, 90]:', config.lat >= -90 && config.lat <= 90)
        console.log('  - lng en rango [-180, 180]:', config.lng >= -180 && config.lng <= 180)
        console.log('  - clientTransactionId length <= 50:', config.clientTransactionId.length <= 50)
        console.log('  - reference length <= 100:', config.reference.length <= 100)

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

        // ============================================
        // VALIDACIÓN COMPLETA DE PARÁMETROS SEGÚN DOCUMENTACIÓN PAYPHONE
        // ============================================
        const validationErrors: string[] = []

        // 1. Validar amount (debe ser entero entre 1 y 99999999)
        if (!Number.isInteger(config.amount) || config.amount < 1 || config.amount > 99999999) {
          validationErrors.push(`amount: ${config.amount} no es entero válido entre 1-99999999`)
        }

        // 2. Validar fórmula de montos
        if (calculatedTotal !== config.amount) {
          validationErrors.push(`amount (${config.amount}) != suma de componentes (${calculatedTotal})`)
        }

        // 3. Validar currency (debe ser exactamente "USD")
        if (config.currency !== "USD") {
          validationErrors.push(`currency: ${config.currency} debe ser "USD"`)
        }

        // 4. Validar clientTransactionId (máximo 50 caracteres)
        if (config.clientTransactionId.length > 50) {
          validationErrors.push(`clientTransactionId: ${config.clientTransactionId.length} chars excede máximo de 50`)
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(config.clientTransactionId)) {
          validationErrors.push(`clientTransactionId: contiene caracteres especiales inválidos`)
        }

        // 5. Validar reference (máximo 100 caracteres)
        if (config.reference.length > 100) {
          validationErrors.push(`reference: ${config.reference.length} chars excede máximo de 100`)
        }

        // 6. Validar lat (debe ser número entero entre -90 y 90)
        if (typeof config.lat !== 'number' || !Number.isInteger(config.lat)) {
          validationErrors.push(`lat: ${config.lat} (${typeof config.lat}) debe ser ENTERO, NO string`)
        }
        if (config.lat < -90 || config.lat > 90) {
          validationErrors.push(`lat: ${config.lat} fuera de rango [-90, 90]`)
        }

        // 7. Validar lng (debe ser número entero entre -180 y 180)
        if (typeof config.lng !== 'number' || !Number.isInteger(config.lng)) {
          validationErrors.push(`lng: ${config.lng} (${typeof config.lng}) debe ser ENTERO, NO string`)
        }
        if (config.lng < -180 || config.lng > 180) {
          validationErrors.push(`lng: ${config.lng} fuera de rango [-180, 180]`)
        }

        // 8. Validar timeZone (debe ser entero entre -12 y 14)
        if (typeof config.timeZone !== 'number' || !Number.isInteger(config.timeZone)) {
          validationErrors.push(`timeZone: ${config.timeZone} debe ser entero`)
        }
        if (config.timeZone < -12 || config.timeZone > 14) {
          validationErrors.push(`timeZone: ${config.timeZone} fuera de rango [-12, 14]`)
        }

        // 9. Validar returnUrl (debe ser URL absoluta con protocolo)
        try {
          const urlObj = new URL(config.returnUrl)
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            validationErrors.push(`returnUrl: protocolo ${urlObj.protocol} inválido, debe ser http:// o https://`)
          }
        } catch (e) {
          validationErrors.push(`returnUrl: ${config.returnUrl} no es URL válida`)
        }

        // 10. Validar email (formato válido)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(config.email)) {
          validationErrors.push(`email: ${config.email} formato inválido`)
        }

        // 11. Validar storeId (UUID válido - formato estándar)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(config.storeId)) {
          validationErrors.push(`storeId: ${config.storeId} no es UUID válido`)
        }

        // 12. Validar token (no vacío)
        if (!config.token || config.token.trim().length === 0) {
          validationErrors.push(`token: vacío o inválido`)
        }

        // Si hay errores de validación, mostrar y detener
        if (validationErrors.length > 0) {
          console.error('[PayphonePaymentBox] ❌ VALIDACIONES FALLIDAS:', validationErrors)
          const errorMessage = `Validaciones fallidas:\n${validationErrors.map(e => `  • ${e}`).join('\n')}`
          setError(errorMessage)
          return
        }

        console.log('[PayphonePaymentBox] ✅ TODAS LAS VALIDACIONES PASARON CORRECTAMENTE')
        console.log('[PayphonePaymentBox] Parámetros listos para enviar a Payphone')

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

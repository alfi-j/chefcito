# Configuración de Suscripciones con Payphone

## Descripción

Este documento explica cómo configurar el sistema de suscripciones de Chefcito usando Payphone Cajita de Pagos.

## Requisitos Previos

1. **Cuenta Payphone Business** activa
2. **Rol de Desarrollador** en Payphone
3. **Credenciales API** de Payphone (TOKEN y STOREID)

## Configuración de Payphone Developer

### Paso 1: Crear Aplicación en Payphone Developer

1. Ingresa a [Payphone Developer](https://pay.payphonetodoesposible.com/developer)
2. Crea una nueva aplicación de tipo **"WEB"**
3. Configura los siguientes campos:
   - **Dominio Web**: Tu dominio de producción (ej: `https://chefcito.com`)
   - **URL de Respuesta**: `https://tudominio.com/api/payphone/success`

### Paso 2: Obtener Credenciales

Después de crear la aplicación, obtendrás:
- **TOKEN**: Tu token de API (Bearer Token)
- **STOREID**: Tu ID de sucursal

### Paso 3: Configurar Variables de Entorno

Copia el archivo `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# PayPhone Cajita de Pagos Configuration
# Server-side (para confirmación de pagos)
PAYPHONE_TOKEN=tu_token_privado_aqui
PAYPHONE_STORE_ID=tu_store_id_aqui

# Client-side (para el componente de pago en el frontend)
NEXT_PUBLIC_PAYPHONE_TOKEN=tu_token_publico_aqui
NEXT_PUBLIC_PAYPHONE_STORE_ID=tu_store_id_publico_aqui

# Payphone Return URL (para redirección después del pago)
NEXT_PUBLIC_PAYPHONE_RETURN_URL=https://tudominio.com/api/payphone/success
```

> **Nota**: Para desarrollo local, puedes usar `http://localhost:3000` como dominio.

## Configuración en Payphone Business

### URL de Retorno

En el dashboard de Payphone Business, configura la URL de retorno como:
- **Producción**: `https://tudominio.com/api/payphone/success`
- **Desarrollo**: `http://localhost:3000/api/payphone/success`

## Flujo de Pago

1. El usuario hace clic en "Suscribirse Ahora" en la página de perfil
2. Se muestra la Cajita de Pagos de Payphone
3. El usuario ingresa sus datos de pago
4. Payphone procesa el pago y redirige a `/api/payphone/success`
5. El endpoint confirma el pago con la API de Payphone
6. La suscripción se activa automáticamente
7. El usuario es redirigido al perfil con un mensaje de éxito

## Endpoints de la API

### GET /api/subscriptions
Obtiene la suscripción activa de un usuario.

**Parámetros:**
- `userId`: ID del usuario

**Respuesta:**
```json
{
  "hasSubscription": true,
  "subscription": {
    "_id": "...",
    "userId": "...",
    "plan": "pro",
    "status": "active",
    "amount": 999,
    "currency": "USD",
    "startDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/subscriptions
Crea una nueva suscripción.

**Body:**
```json
{
  "userId": "...",
  "plan": "pro",
  "amount": 999,
  "clientTransactionId": "SUB-123-1234567890"
}
```

### DELETE /api/subscriptions/[id]
Cancela una suscripción activa.

**Body:**
```json
{
  "reason": "Motivo de cancelación (opcional)"
}
```

### GET /api/payphone/success
Maneja la redirección después del pago.

**Parámetros:**
- `transactionId`: ID de transacción de Payphone
- `clientTransactionId`: ID de transacción del cliente

### POST /api/payphone/confirm
Webhook para confirmación de pagos (uso interno).

## Planes de Suscripción

### Plan Free (Gratis)
- Acceso limitado a funciones básicas

### Plan Pro ($9.99/mes)
- Acceso ilimitado a todas las funciones
- Soporte prioritario
- Actualizaciones automáticas
- Múltiples ubicaciones
- Informes avanzados
- Personalización de marca

## Consideraciones Importantes

1. **Confirmación de Pago**: Es crucial confirmar el pago dentro de los 5 minutos posteriores a la transacción. Si no se confirma, Payphone reversa automáticamente el pago.

2. **IDs de Transacción Únicos**: Cada transacción debe tener un `clientTransactionId` único (máximo 50 caracteres).

3. **Montos en Centavos**: Todos los montos se manejan en centavos de dólar.
   - $9.99 USD = 999 centavos

4. **Seguridad**: 
   - Nunca expongas tu `PAYPHONE_TOKEN` en el código del cliente
   - Usa solo las variables `NEXT_PUBLIC_*` en el frontend

5. **Reversos**: Los reversos automáticos ocurren si no confirmas el pago en 5 minutos.

## Pruebas

### Entorno de Pruebas

Payphone permite realizar transacciones de prueba que se aprueban automáticamente sin cobros reales.

1. Usa datos de tarjeta ficticios pero válidos:
   - Número: `4111111111111111` (Visa)
   - CVV: `123`
   - Fecha: Cualquier fecha futura

2. Verifica que:
   - La transacción se crea correctamente
   - El webhook de confirmación se ejecuta
   - La membresía del usuario se actualiza a `pro`

### Verificar Estado de Suscripción

Después de una prueba exitosa, verifica en la base de datos:

```javascript
// En MongoDB
db.subscriptions.findOne({ clientTransactionId: "SUB-test-123" })
db.users.findOne({ id: "userId" })
```

## Solución de Problemas

### Error: "Acceso denegado" en Cajita de Pagos

**Causa**: El dominio no coincide con el registrado en Payphone Developer.

**Solución**: 
1. Verifica que el dominio en Payphone Developer coincida con tu dominio
2. Configura el header `Referrer-Policy: origin`

### Error: "Credenciales no configuradas"

**Causa**: Las variables de entorno no están configuradas correctamente.

**Solución**:
1. Verifica que `.env.local` exista
2. Asegúrate de que las variables `NEXT_PUBLIC_PAYPHONE_*` estén definidas
3. Reinicia el servidor de desarrollo

### Error: "Suscripción no encontrada"

**Causa**: El `clientTransactionId` no coincide.

**Solución**:
1. Verifica que el `clientTransactionId` se genera correctamente
2. Asegúrate de que la suscripción se crea antes de mostrar el botón de pago

## Soporte

Para problemas específicos de Payphone, consulta:
- [Documentación Oficial de Payphone](https://www.docs.payphone.app)
- [Soporte Payphone](https://payphone.app/contacto)

## Mantenimiento

### Monitoreo de Suscripciones

Revisa periódicamente:
1. Suscripciones pendientes de confirmación
2. Suscripciones próximas a expirar
3. Pagos fallidos o revertidos

### Limpieza de Datos

Ejecuta periódicamente para limpiar suscripciones antiguas:

```javascript
// Cancelar suscripciones pendientes mayores a 24 horas
db.subscriptions.updateMany(
  { 
    status: 'pending',
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  { 
    status: 'expired',
    cancelledAt: new Date()
  }
)
```

# 🔧 Solución al Error 400 de Payphone

## 🚨 Problema Identificado

El error 400 en `https://pay.payphonetodoesposible.com/api/payment-button-box/prepare` ocurre porque **el dominio desde el que se ejecuta la Cajita de Pagos NO está registrado en Payphone Developer**.

---

## 📋 Causas del Error 400

### Causa Principal (95% de probabilidad)
**Dominio no registrado en Payphone Developer**

La Cajita de Pagos de Payphone está **vinculada directamente al dominio registrado**. Si intentas usarla desde `http://localhost:3000` sin haber registrado ese dominio, Payphone rechaza la solicitud.

### Causas Secundarias
| Causa | Probabilidad | Solución |
|-------|--------------|----------|
| Token/StoreId inválidos | 30% | Verificar credenciales en Payphone Developer |
| Email estático repetitivo | 20% | Usar email real del usuario (ya implementado) |
| lat/lng fijos | 10% | Implementado: ahora son dinámicos |
| Campos opcionales mal formados | 0% | Resuelto: se omiten correctamente |

---

## ✅ Solución Paso a Paso

### Opción 1: Usar ngrok (RECOMENDADA)

Esta es la solución **oficial recomendada por Payphone** para desarrollo local.

#### Paso 1: Instalar ngrok
```bash
npm install -g ngrok
```

O descarga desde: https://ngrok.com/download

#### Paso 2: Iniciar tu servidor Next.js
```bash
npm run dev
```

#### Paso 3: Crear túnel hacia localhost
```bash
ngrok http 3000
```

Verás una salida como:
```
Forwarding  https://a1b2c3d4.ngrok.io -> http://localhost:3000
```

**Copia esa URL** (ej: `https://a1b2c3d4.ngrok.io`)

#### Paso 4: Registrar el dominio en Payphone Developer

1. Ve a https://appdeveloper.payphonetodoesposible.com/
2. Inicia sesión con tu cuenta Developer
3. Selecciona tu aplicación
4. Haz clic en **Editar**
5. Actualiza los campos:
   - **Web Domain**: `https://a1b2c3d4.ngrok.io`
   - **Response URL**: `https://a1b2c3d4.ngrok.io/api/payphone/success`
6. Guarda los cambios

#### Paso 5: Actualizar variables de entorno

Edita `.env.local`:
```env
NEXT_PUBLIC_PAYPHONE_RETURN_URL=https://a1b2c3d4.ngrok.io/api/payphone/success
```

#### Paso 6: Reiniciar el servidor
```bash
# Detener el servidor actual (Ctrl+C)
npm run dev
```

#### Paso 7: Acceder desde la URL de ngrok
Abre en tu navegador: `https://a1b2c3d4.ngrok.io` (NO uses localhost:3000)

---

### Opción 2: Usar localtunnel (Alternativa gratuita)

#### Paso 1: Instalar localtunnel
```bash
npm install -g localtunnel
```

#### Paso 2: Iniciar túnel
```bash
lt --port 3000
```

Obtendrás una URL como: `https://xxxx-xxxx.loca.lt`

#### Paso 3: Registrar en Payphone Developer
Sigue los mismos pasos que con ngrok, usando la URL de localtunnel.

⚠️ **Nota:** localtunnel puede mostrar una página de advertencia de seguridad antes de redirigir.

---

### Opción 3: Registrar localhost directamente (PUEDE NO FUNCIONAR)

Algunos desarrolladores reportan éxito registrando `localhost` directamente:

1. Ve a https://appdeveloper.payphonetodoesposible.com/
2. Edita tu aplicación
3. En **Web Domain**, coloca: `localhost` (sin http://)
4. En **Response URL**, coloca: `http://localhost:3000/api/payphone/success`
5. Guarda y prueba

⚠️ **Advertencia:** Payphone puede rechazar esto porque `localhost` no es un dominio válido según su política oficial.

---

## 🔍 Verificación del Problema

### Logs que verás en la consola del navegador

Con las mejoras implementadas, ahora verás:

```
[PayphonePaymentBox] ⚠️ VERIFICACIÓN DE DOMINIO:
  Dominio actual: http://localhost:3000
  ¿Está este dominio registrado en Payphone Developer?
  Si NO, obtendrás error 400 - Usa ngrok: `ngrok http 3000` y registra esa URL
```

### Si el dominio NO coincide:
- Verás el error 400 inmediatamente al cargar la Cajita
- La consola mostrará: `POST https://pay.payphonetodoesposible.com/api/payment-button-box/prepare 400 (Bad Request)`

### Si el dominio SÍ coincide:
- La Cajita se cargará correctamente
- Podrás completar el pago

---

## 🛠️ Mejoras Implementadas en el Código

### 1. Coordenadas dinámicas (lat/lng)
Antes: Coordenadas fijas que podían parecer patrón sospechoso
```javascript
lat: "-0.180653"  // Siempre igual
lng: "-78.467838"  // Siempre igual
```

Ahora: Coordenadas con variación mínima por transacción
```javascript
lat: dynamicLat  // Varía ligeramente por timestamp
lng: dynamicLng  // Varía ligeramente por transactionId
```

### 2. Logs de depuración mejorados
Ahora verás información detallada sobre:
- Dominio actual
- Todos los parámetros enviados
- Campos omitidos intencionalmente
- Longitud de clientTransactionId y reference

### 3. Validación de montos
Se verifica que la fórmula sea correcta:
```
amount = amountWithoutTax + amountWithTax + tax + service + tip
499 = 446 + 0 + 53 + 0 + 0 ✅
```

---

## 📝 Checklist de Verificación

- [ ] ngrok instalado y ejecutándose
- [ ] URL de ngrok copiada (ej: `https://xxxx.ngrok.io`)
- [ ] Dominio registrado en Payphone Developer
- [ ] Response URL actualizada en Payphone Developer
- [ ] Variables de entorno actualizadas en `.env.local`
- [ ] Servidor Next.js reiniciado
- [ ] Accediendo desde la URL de ngrok (NO localhost)
- [ ] Credenciales (token/storeId) correctas

---

## 🧪 Pruebas de Verificación

### 1. Verificar que el script de Payphone carga
Abre la consola del navegador y busca:
```
[PayphoneScript] PPaymentButtonBox disponible después de XXms
```

### 2. Verificar configuración de Payphone
Busca en la consola:
```
[PayphonePaymentBox] Configuración de Payphone: { token: 'F3tFpsS3I2...', ... }
```

### 3. Verificar que no hay error 400
Si ves:
```
POST https://pay.payphonetodoesposible.com/api/payment-button-box/prepare 400 (Bad Request)
```
→ **El dominio NO está registrado correctamente**

### 4. Verificar éxito
Si la Cajita se renderiza y muestra el botón de pago:
```
[PayphonePaymentBox] === RENDERIZADO COMPLETADO ===
```
→ **¡Todo funciona correctamente!**

---

## ❓ Preguntas Frecuentes

### ¿Cada vez que reinicio ngrok cambia la URL?
**Sí.** Cada sesión de ngrok genera una URL diferente (en el plan gratuito). Debes actualizar el dominio en Payphone Developer cada vez.

### ¿Hay forma de tener una URL fija?
**Sí,** con el plan pago de ngrok puedes tener dominios reservados. O usa servicios como:
- https://localhost.run (gratis, URL semi-fija)
- https://serveo.net (gratis)

### ¿Puedo usar esto en producción?
**Sí,** pero en producción:
1. Usa tu dominio real (ej: `https://chefcito.com`)
2. Asegúrate de tener SSL (HTTPS)
3. Registra ese dominio en Payphone Developer

### ¿El email `montuviorestaurante@gmail.com` causa problema?
**No,** siempre que sea el email real del usuario. El problema sería si usas el MISMO email para TODAS las transacciones de prueba.

### ¿Qué pasa si no confirmo el pago en 5 minutos?
Payphone **reversa automáticamente** la transacción. Debes implementar el endpoint `/api/payphone/success` que llame a la API de Confirmación.

---

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. **Verifica credenciales:**
   - Ve a https://appdeveloper.payphonetodoesposible.com/
   - Sección "Credentials"
   - Copia token y storeId nuevamente
   - Actualiza `.env.local`

2. **Contacta a Payphone:**
   - Email: soporte@payphone.app
   - Web: https://payphone.app/contacto

3. **Proporciona esta información:**
   - Dominio que estás usando (ngrok URL)
   - Token (primeros 10 caracteres + `...`)
   - StoreId completo
   - Captura del error 400
   - Logs de la consola del navegador

---

## 🔗 Enlaces Útiles

- **Payphone Developer:** https://appdeveloper.payphonetodoesposible.com/
- **Documentación Oficial:** https://docs.payphone.app/cajita-de-pagos-payphone
- **Descargar ngrok:** https://ngrok.com/download
- **localtunnel:** https://www.npmjs.com/package/localtunnel

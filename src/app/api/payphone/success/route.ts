import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// GET /api/payphone/success - Redirigir a página Thank You con parámetros de Payphone
export async function GET(request: Request) {
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    
    // Extraer todos los parámetros de Payphone
    const transactionId = searchParams.get('transactionId') || searchParams.get('id') || '';
    const clientTransactionId = searchParams.get('clientTransactionId') || '';
    const status = searchParams.get('status') || '';
    const statusCode = searchParams.get('statusCode') || '';
    const reference = searchParams.get('reference') || '';
    const amount = searchParams.get('amount') || '';
    const optionalParameter = searchParams.get('optionalParameter') || '';

    console.log('[Payphone Success] Parámetros recibidos:', {
      transactionId,
      clientTransactionId,
      status,
      statusCode,
      reference,
      amount
    });

    // Validar parámetros mínimos requeridos
    if (!clientTransactionId) {
      console.error('[Payphone Success] Parámetro clientTransactionId faltante');
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    // Confirmar pago con Payphone API para obtener estado actualizado
    const payphoneToken = process.env.PAYPHONE_TOKEN;
    const payphoneStoreId = process.env.PAYPHONE_STORE_ID;

    if (!payphoneToken || !payphoneStoreId) {
      console.error('[Payphone Success] Credenciales de Payphone no configuradas');
      return NextResponse.redirect(new URL('/profile?payment=error', request.url));
    }

    // Confirmar transacción con Payphone
    const confirmResponse = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payphoneToken}`
      },
      body: JSON.stringify({
        id: parseInt(transactionId) || 0,
        clientTxId: clientTransactionId
      })
    });

    let finalStatusCode = statusCode;
    let finalStatus = status;
    let finalAmount = amount;
    let finalReference = reference;

    if (confirmResponse.ok) {
      const result = await confirmResponse.json();
      console.log('[Payphone Success] Respuesta de Payphone:', result);
      
      // Usar datos actualizados de Payphone si están disponibles
      finalStatusCode = result.statusCode?.toString() || statusCode;
      finalStatus = result.status || status;
      finalAmount = result.amount?.toString() || amount;
      finalReference = result.reference || reference;

      // Actualizar suscripción en base de datos solo si el pago fue aprobado
      if (finalStatusCode === '3') {
        const subscription = await Subscription.findOne({ clientTransactionId });
        
        if (subscription && subscription.status !== 'active') {
          subscription.status = 'active';
          subscription.payphoneTransactionId = result.transactionId?.toString();
          subscription.startDate = new Date();

          // Actualizar usuario a Pro
          await User.findOneAndUpdate(
            { id: subscription.userId },
            { membership: 'pro' }
          );

          await subscription.save();
          console.log('[Payphone Success] Suscripción activada:', subscription._id);
        }
      } else if (finalStatusCode === '2') {
        // Pago cancelado - actualizar estado en BD
        const subscription = await Subscription.findOne({ clientTransactionId });
        
        if (subscription && subscription.status !== 'cancelled') {
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          subscription.cancellationReason = 'Pago cancelado o fallido';
          await subscription.save();
          console.log('[Payphone Success] Suscripción cancelada:', subscription._id);
        }
      }
    } else {
      console.warn('[Payphone Success] No se pudo confirmar con Payphone:', confirmResponse.status);
      // Usar los parámetros originales si falla la confirmación
    }

    // Redirigir a la página Thank You con todos los parámetros
    const thankYouUrl = new URL('/thank-you', request.url);
    thankYouUrl.searchParams.set('transactionId', transactionId);
    thankYouUrl.searchParams.set('clientTransactionId', clientTransactionId);
    thankYouUrl.searchParams.set('status', finalStatus);
    thankYouUrl.searchParams.set('statusCode', finalStatusCode);
    
    if (finalReference) {
      thankYouUrl.searchParams.set('reference', finalReference);
    }
    
    if (finalAmount) {
      thankYouUrl.searchParams.set('amount', finalAmount);
    }

    console.log('[Payphone Success] Redirigiendo a:', thankYouUrl.toString());
    return NextResponse.redirect(thankYouUrl);
  } catch (error) {
    console.error('[Payphone Success] Error:', error);
    return NextResponse.redirect(new URL('/profile?payment=error', request.url));
  }
}

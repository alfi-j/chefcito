import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';
import { initializeDatabase } from '@/lib/database-service';
import { requireAuth } from '@/lib/auth';
import { newClientTransactionId } from '@/lib/subscription';

// GET /api/subscriptions - Obtener suscripción del restaurante
export async function GET(request: Request) {
  try {
    await initializeDatabase();

    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID es requerido' },
        { status: 400 }
      );
    }

    // Only members of the restaurant can read its subscription
    const user = await User.findOne({ id: auth.userId });
    const isMember = user?.restaurantIds?.includes(restaurantId) || user?.restaurantId === restaurantId;
    if (!isMember) {
      return NextResponse.json(
        { error: 'No autorizado para este restaurante' },
        { status: 403 }
      );
    }

    // Buscar suscripciones activas o pendientes del restaurante
    const subscription = await Subscription.findOne({
      restaurantId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: subscription.toObject()
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscripción' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Crear nueva suscripción
export async function POST(request: Request) {
  try {
    console.log('[Subscription API] Iniciando creación de suscripción...')
    await initializeDatabase()

    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json()
    const { restaurantId, plan, amount } = body

    console.log('[Subscription API] Datos recibidos:', { restaurantId, plan, amount })

    if (!restaurantId || !plan || !amount) {
      console.error('[Subscription API] Faltan datos requeridos')
      return NextResponse.json(
        { error: 'restaurantId, plan y amount son requeridos' },
        { status: 400 }
      )
    }

    // Validar plan
    if (!['free', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      )
    }

    // Verificar que el restaurante existe y pertenece al usuario autenticado
    const restaurant = await Restaurant.findOne({ id: restaurantId })
    console.log('[Subscription API] Restaurante encontrado:', restaurant ? 'Sí' : 'No')

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    if (restaurant.ownerId !== auth.userId) {
      return NextResponse.json(
        { error: 'No autorizado para este restaurante' },
        { status: 403 }
      )
    }

    // Cancelar suscripciones activas previas
    await Subscription.updateMany(
      { restaurantId, status: { $in: ['active', 'pending'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    )

    // Crear nueva suscripción con clientTransactionId generado en el servidor
    console.log('[Subscription API] Creando suscripción...')
    const subscription = await Subscription.create({
      restaurantId,
      plan,
      status: 'pending',
      amount,
      currency: 'USD',
      clientTransactionId: newClientTransactionId(),
      startDate: new Date()
    })
    console.log('[Subscription API] Suscripción creada:', subscription._id)

    return NextResponse.json({
      success: true,
      subscription: subscription.toObject()
    }, { status: 201 })
  } catch (error) {
    console.error('[Subscription API] Error detallado:', error)
    console.error('[Subscription API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[Subscription API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al crear suscripción', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
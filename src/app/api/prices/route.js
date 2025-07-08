import { getProductPrice } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');

  if (!itemId) {
    return new Response(JSON.stringify({ error: 'Item ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validar que itemId sea un número válido
  const parsedItemId = parseInt(itemId);
  if (isNaN(parsedItemId) || parsedItemId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid Item ID format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const price = await Promise.race([
      getProductPrice(parsedItemId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 30000)
      )
    ]);
    
    if (price === null) {
      return new Response(JSON.stringify({ error: 'Price not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ price }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    
    // No exponer detalles del error en producción
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
      error: 'Database connection error',
      ...((!isProduction) && { details: error.message })
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
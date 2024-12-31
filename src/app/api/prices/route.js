export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
  
    if (!itemId) {
      return new Response(JSON.stringify({ error: 'Item ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    try {
      const price = await Promise.race([
        getProductPrice(itemId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
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
      return new Response(JSON.stringify({ 
        error: 'Database connection error',
        details: error.message 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
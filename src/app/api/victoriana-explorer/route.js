import { getVictorianaTables, getVictorianaTableStructure, getVictorianaSampleData } from '@/lib/dbVictoriana';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const tableName = searchParams.get('table');
  const limit = searchParams.get('limit') || 10;

  try {
    let result;

    switch (action) {
      case 'tables':
        // Listar todas las tablas
        result = await getVictorianaTables();
        break;
      
      case 'structure':
        // Obtener estructura de una tabla específica
        if (!tableName) {
          return new Response(JSON.stringify({ error: 'Table name is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await getVictorianaTableStructure(tableName);
        break;
      
      case 'sample':
        // Obtener datos de ejemplo de una tabla
        if (!tableName) {
          return new Response(JSON.stringify({ error: 'Table name is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await getVictorianaSampleData(tableName, limit);
        break;
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action. Use: tables, structure, or sample' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database explorer error:', error);
    
    const isProduction = process.env.NODE_ENV === 'production';
    const errorResponse = {
      error: 'Database error',
      ...((!isProduction) && { details: error.message })
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
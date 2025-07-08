'use client';

import { useState } from 'react';
import Link from 'next/link';
import VictorianaLogo from '@/components/common/VictorianaLogo';
import VictorianaFooter from '@/components/common/VictorianaFooter';

export default function TestConnection() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/victoriana-test');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Error al realizar la prueba: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-black p-4">
      <div className="max-w-sm mx-auto mb-8">
        <VictorianaLogo className="w-full h-auto text-black" width="300" height="120" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Prueba de Conexión</h1>
        <p className="text-gray-600">Verificar conexión con la base de datos de La Victoriana</p>
      </div>

      <div className="flex justify-center mb-6 space-x-4">
        <Link 
          href="/la-victoriana"
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
        >
          ← Volver
        </Link>
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Ejecutar Prueba'}
        </button>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="max-w-4xl mx-auto">
          {/* Variables de entorno */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Variables de Entorno</h2>
            <div className="font-mono text-sm">
              {Object.entries(results.environmentVars).map(([key, value]) => (
                <div key={key} className="mb-1">
                  <span className="text-gray-600">{key}:</span> 
                  <span className="ml-2">{value || '[vacío]'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resultados de pruebas */}
          <div className="space-y-4">
            {results.testResults.map((result, idx) => (
              <div 
                key={idx}
                className={`bg-white rounded-lg shadow-lg p-4 border-2 ${
                  result.success ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{result.configName}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✓ Exitoso' : '✗ Falló'}
                  </span>
                </div>

                {result.success ? (
                  <div className="text-sm text-gray-600">
                    <p><strong>Base de datos:</strong> {result.details.database}</p>
                    <p><strong>SQL Server:</strong> {result.details.sqlVersion}</p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="text-red-600 font-medium">Error: {result.error.message}</p>
                    {result.error.code && (
                      <p className="text-gray-600">Código: {result.error.code}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Configuración exitosa */}
          {results.testResults.some(r => r.success) && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ¡Conexión Exitosa!
              </h3>
              <p className="text-green-700">
                La siguiente configuración funcionó correctamente:
              </p>
              <pre className="mt-2 bg-white p-3 rounded border text-xs overflow-x-auto">
                {JSON.stringify(
                  results.testResults.find(r => r.success),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      <VictorianaFooter />
    </main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VictorianaLogo from '@/components/common/VictorianaLogo';
import VictorianaFooter from '@/components/common/VictorianaFooter';

export default function VictorianaExplorer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableStructure, setTableStructure] = useState([]);
  const [sampleData, setSampleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar lista de tablas al montar el componente
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/victoriana-explorer?action=tables');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTables(data.data);
    } catch (err) {
      setError('Error al cargar tablas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableDetails = async (tableName) => {
    setLoading(true);
    setError('');
    setSelectedTable(tableName);
    
    try {
      // Obtener estructura
      const structureResponse = await fetch(`/api/victoriana-explorer?action=structure&table=${tableName}`);
      const structureData = await structureResponse.json();
      if (!structureResponse.ok) throw new Error(structureData.error);
      setTableStructure(structureData.data);

      // Obtener datos de ejemplo
      const sampleResponse = await fetch(`/api/victoriana-explorer?action=sample&table=${tableName}&limit=5`);
      const sampleData = await sampleResponse.json();
      if (!sampleResponse.ok) throw new Error(sampleData.error);
      setSampleData(sampleData.data);
    } catch (err) {
      setError('Error al cargar detalles de tabla: ' + err.message);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Explorador de Base de Datos</h1>
        <p className="text-gray-600">Herramienta para explorar las tablas de La Victoriana</p>
      </div>

      <div className="flex justify-center mb-6">
        <Link 
          href="/la-victoriana"
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
        >
          ← Volver
        </Link>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de tablas */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Tablas disponibles</h2>
          {loading && !selectedTable ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table.TABLE_NAME}
                  onClick={() => fetchTableDetails(table.TABLE_NAME)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                    selectedTable === table.TABLE_NAME ? 'bg-blue-100 font-semibold' : ''
                  }`}
                >
                  {table.TABLE_NAME}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Estructura de tabla */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            {selectedTable ? `Estructura de ${selectedTable}` : 'Selecciona una tabla'}
          </h2>
          {loading && selectedTable ? (
            <p className="text-gray-500">Cargando...</p>
          ) : tableStructure.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Columna</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Tamaño</th>
                    <th className="text-left p-2">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {tableStructure.map((col) => (
                    <tr key={col.COLUMN_NAME} className="border-b">
                      <td className="p-2 font-mono">{col.COLUMN_NAME}</td>
                      <td className="p-2">{col.DATA_TYPE}</td>
                      <td className="p-2">{col.CHARACTER_MAXIMUM_LENGTH || '-'}</td>
                      <td className="p-2">{col.IS_NULLABLE}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Selecciona una tabla para ver su estructura</p>
          )}
        </div>
      </div>

      {/* Datos de ejemplo */}
      {sampleData.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6 bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">Datos de ejemplo (primeras 5 filas)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {Object.keys(sampleData[0]).map((key) => (
                    <th key={key} className="text-left p-2 font-mono">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2">
                        {value !== null ? String(value).substring(0, 50) : 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VictorianaFooter />
    </main>
  );
}
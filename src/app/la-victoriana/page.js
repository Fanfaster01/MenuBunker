'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VictorianaFooter from '@/components/common/VictorianaFooter';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function LaVictoriana() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para generar el path basado en el nombre del departamento
  const generatePath = (codigo, nombre) => {
    // Generar path consistente basado en el nombre real de la BD
    const cleanName = nombre.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e') 
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final

    return `/la-victoriana/departamento/${codigo}`;
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/victoriana-departments');
      const data = await response.json();
      
      if (response.ok) {
        // Agregar path a cada departamento
        const departmentsWithPath = data.departments.map(dept => ({
          ...dept,
          path: generatePath(dept.codigo, dept.nombre)
        }));
        setDepartments(departmentsWithPath);
      } else {
        setError(data.error || 'Error al cargar departamentos');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-sm mx-auto mb-8">
        <Image 
          src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
          alt="La Victoriana Logo"
          width={300}
          height={300}
          className="mx-auto"
          priority
        />
      </div>

      <div className="flex justify-center mb-6">
        <Link 
          href="/"
          className="group relative bg-gradient-to-r from-[#C8302E] to-[#A02624] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Volver al Inicio
          </span>
          <div className="absolute inset-0 rounded-full bg-[#C8A882] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner 
          message="Cargando departamentos..."
          size="large"
        />
      ) : error ? (
        <ErrorDisplay 
          error={error}
          onRetry={fetchDepartments}
          title="Error al cargar departamentos"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {departments.map((department) => (
            <Link 
              href={department.path} 
              key={department.codigo}
              className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-[#C8A882] hover:shadow-xl hover:border-[#C8302E] transition-all duration-200 text-center h-32 text-white group"
            >
              <div className="flex flex-col justify-center h-full">
                <span className="font-bold text-lg mb-2 text-white group-hover:text-[#C8A882]">{department.nombre}</span>
                <span className="text-sm text-[#C8A882]">{department.total_productos} productos</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <VictorianaFooter />
    </main>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import ImageModal from './ImageModal';

export default function ContornosSection({ title = "CONTORNOS" }) {
  const [selectedImage, setSelectedImage] = useState(null);
  
  const contornos = [
    {
      name: "Ensalada césar",
      id: "2502",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Pico de gallo",
      id: "3881",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Ensalada mixta",
      id: "2442",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Aguacate",
      id: "2508",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Yuca sancochada / frita",
      id: "6640",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Puré de papa",
      id: "2439",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Arroz blanco",
      id: "2443",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Tomate Relleno",
      id: "6896",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Vegetales al grill",
      id: "1051",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Papas fritas",
      id: "1045",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Papas al ajillo",
      id: "6613",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Papas rústicas con salsa Búnker",
      id: "7165",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Tostones",
      id: "6665",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Tostones al ajillo",
      id: "6848",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Queso a la plancha",
      id: "6442",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "Puré de Zanahoria",
      id: "6639",
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const { prices, loading, error } = useProductPrices(contornos);

  // Función para formatear el precio
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "Cargando...";
    return `${price.toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="text-center py-4">Cargando contornos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="text-center py-4 text-red-600">Error al cargar los contornos</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contornos.map((contorno) => (
          <div 
            key={contorno.id}
            className="bg-white shadow-lg rounded-lg p-3 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{contorno.name}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedImage(contorno)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Image size={20} />
                </button>
                <span className="font-bold text-gray-800">
                  {formatPrice(prices[contorno.id])}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.imageUrl}
        title={selectedImage?.name}
      />
    </div>
  );
}
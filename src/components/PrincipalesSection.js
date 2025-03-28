"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';
import ContornosSection from './common/ContornosSection';

export default function PrincipalesSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const principalesItems = [
    {
      name: "SALTEADO DE MARISCOS",
      description: "Camarón, calamar, pulpo y guacuco en concha, salteados en vino blanco, acompañados de vegetales al grill y papas fritas.",
      id: "2510",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PARRILLA CLÁSICA",
      description: "Pollo, lomito y chorizo ahumado a las brasas, acompañados de papas fritas.",
      id: "2363",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PARRILLA MAR Y TIERRA",
      description: "Mariscos salteados en vino blanco, acompañados de lomito y pollo a la parrilla, vegetales y papas fritas.",
      id: "2509",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "NOSTRA PARMIGIANA",
      description: "Milanesa de pollo en salsa al estilo napolitano y quesos frescos gratinados, acompañada de un (1) contorno de su elección.",
      id: "2541",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "LOMITO O POLLO AL CHAMPIÑÓN",
      description: "Acompañado de un (1) contorno de su elección.",
      id: "2534",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PESCA DEL DÍA",
      description: "Pescado blanco a la plancha ó al ajillo, acompañado de un (1) contorno de su elección.",
      id: "4132",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "SALMÓN",
      description: "Salmón a la plancha ó al ajillo, acompañado de un (1) contorno de su elección.",
      id: "6891",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PASTA BÚNKER",
      description: "Linguini en salsa blanca, acompañada de costillas de cerdo ahumadas en casa más una (1) proteína de su elección.",
      id: "3966",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "RISOTTO DE MARISCOS",
      description: "Arroz cremoso, con un sofrito tradicional y mariscos frescos.",
      id: "3588",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PASTA MARINERA",
      description: "Linguini en salsa roja, acompañado de mix de mariscos salteados en vino blanco, coronada con queso parmesano.",
      id: "7051",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "RISOTTO DE PUNTA AHUMADA",
      description: "Arroz cremoso, punta trasera de res ahumada, acompañado con queso parmesano.",
      id: "2341",
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const { prices, loading, error } = useProductPrices(principalesItems);

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "Cargando...";
    return `${price.toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="PRINCIPALES" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="PRINCIPALES" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="PRINCIPALES" />

      <div className="space-y-6">
        {/* Principales Items */}
        <div className="grid gap-4">
          {principalesItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedImage(item)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Image size={20} />
                  </button>
                  <span className="font-bold text-lg text-gray-800">
                    {formatPrice(prices[item.id])}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Contornos Section */}
        <ContornosSection title="CONTORNOS" />
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.imageUrl}
        title={selectedImage?.name}
      />

      <Footer />
    </div>
  );
}
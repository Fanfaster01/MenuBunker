"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function EnsaladasSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const ensaladas = [
    {
      name: "CÉSAR",
      description: "Mix de lechuga, aderezo de anchoas, crocante de tocineta, crotones de pan y queso parmesano.",
      id: "1102",
      baseItem: true,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "SPRING",
      description: "Mix de lechuga, melocotón, queso de cabra, almendras fileteadas y miel mostaza.",
      id: "4138",
      baseItem: true,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "ENSALADA DE PALMITOS",
      description: "Mix de lechuga, aguacate y palmitos.",
      id: "6835",
      baseItem: true,
      isShared: true,
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const proteinas = [
    {
      name: "Pollo a la plancha",
      id: "2491",
      isAdditional: true
    },
    {
      name: "Pollo crispy",
      id: "2492",
      isAdditional: true
    },
    {
      name: "Lomito a la plancha",
      id: "2545",
      isAdditional: true
    },
    {
      name: "Camarones salteados",
      id: "2546",
      isAdditional: true
    }
  ];

  const { prices: ensaladaPrices, loading: ensaladaLoading, error: ensaladaError } 
  = useProductPrices(ensaladas);
const { prices: proteinaPrices, loading: proteinaLoading, error: proteinaError } 
  = useProductPrices(proteinas);

const loading = ensaladaLoading || proteinaLoading;
const error = ensaladaError || proteinaError;

const formatPrice = (price) => {
  return `${price?.toFixed(2)}€`;
};

if (loading) {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="ENSALADAS" />
      <div className="text-center py-4">Cargando precios...</div>
      <Footer />
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="ENSALADAS" />
      <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
      <Footer />
    </div>
  );
}

return (
  <div className="min-h-screen bg-white text-gray-900 p-4">
    <Header title="ENSALADAS" />

    <div className="space-y-6">
      {/* Ensaladas Base */}
      <div className="grid gap-4">
        {ensaladas.map((item) => (
          <div 
            key={item.id}
            className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                {item.isShared && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Para compartir</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedImage(item)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Image size={20} />
                </button>
                <span className="font-bold text-lg text-gray-800">
                  {formatPrice(ensaladaPrices[item.id])}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mt-2">{item.description}</p>
          </div>
        ))}
      </div>

{/* Sección de Proteínas Adicionales */}
<div className="mt-8">
  <h2 className="text-xl font-bold mb-4">ADICIONALES</h2>
  <div className="grid gap-3">
    {proteinas.map((proteina) => (
      <div 
        key={proteina.id}
        className="bg-white shadow-lg rounded-lg p-3 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{proteina.name}</h3>
          <span className="font-bold text-gray-800">
            + {formatPrice(proteinaPrices[proteina.id])}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* Notas Informativas */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
        <p className="text-gray-600 text-sm text-center">
          Personaliza tu ensalada agregando la proteína de tu preferencia
        </p>
        <p className="text-gray-500 text-xs text-center italic">
          Los precios de los adicionales se suman al precio base de la ensalada
        </p>
      </div>
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
"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function DesayunosSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const desayunoItems = [
    {
      name: "CRIOLLO",
      description: "Trío de arepas, caraotas, carne mechada, perico y queso blanco.",
      id: "6596",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "AMERICANO",
      description: "Panquecas acompañadas de huevo y tocineta, con mermelada de frutos rojos.",
      id: "6597",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "HUEVOS BENEDICTINOS",
      description: "Pan de auyama, huevos pochados cubiertos de salsa holandesa y tocineta crocante.",
      id: "6599",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "TRÍO DE AREPAS",
      description: "Con tres rellenos de tu preferencia (Uno por arepa)",
      id: "6606",
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const empanadas = [
    {
      name: "POLLO",
      id: "6601"
    },
    {
      name: "CARNE MECHADA",
      id: "6602"
    },
    {
      name: "QUESO BLANCO",
      id: "6633"
    },
    {
      name: "JAMÓN CON QUESO BLANCO",
      id: "6604"
    },
    {
      name: "CARAOTA CON QUESO BLANCO",
      id: "6605"
    },
    {
      name: "PABELLÓN",
      id: "6635"
    },
    {
      name: "CAZÓN",
      id: "6636"
    }
  ];

  const { prices: desayunoPrices, loading: desayunoLoading, error: desayunoError } 
    = useProductPrices(desayunoItems);
  const { prices: empanadaPrices, loading: empanadaLoading, error: empanadaError } 
    = useProductPrices(empanadas);

  const loading = desayunoLoading || empanadaLoading;
  const error = desayunoError || empanadaError;

  const formatPrice = (price) => {
    return `${price?.toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="DESAYUNOS" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="DESAYUNOS" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="DESAYUNOS" />

      <div className="space-y-6">
        {/* Desayunos Items */}
        <div className="space-y-4">
          {desayunoItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white shadow-md rounded-lg p-4 border border-[#C8A882] hover:border-[#8B7355] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg mb-2 text-[#8B7355]">{item.name}</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedImage(item)}
                    className="text-gray-500 hover:text-[#8B7355] transition-colors"
                  >
                    <Image size={18} />
                  </button>
                  <span className="font-bold text-lg text-[#C8A882]">
                    {formatPrice(desayunoPrices[item.id])}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Empanadas Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-[#C8A882]">EMPANADAS</h2>
          <div className="space-y-3">
            {empanadas.map((empanada) => (
              <div 
                key={empanada.id}
                className="bg-white shadow-md rounded-lg p-3 border border-[#C8A882] hover:border-[#8B7355] hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#8B7355]">{empanada.name}</h3>
                  <span className="font-bold text-[#C8A882]">
                    {formatPrice(empanadaPrices[empanada.id])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horario */}
        <div className="mt-4 p-4 bg-[#FDF6E3] rounded-lg border border-[#C8A882]">
          <p className="text-gray-600 text-sm text-center">
            De 7am a 12pm (Sábados y domingos)
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
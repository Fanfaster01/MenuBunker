"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function CortesSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const cortesItems = [
    {
      name: "PUNTA TRASERA ANGUS",
      description: "Ración de 300g",
      id: "4096",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "SOLOMO DE RES",
      description: "Ración de 300g",
      id: "4058",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "PORKBELLY",
      description: "Ración de 300g",
      id: "6535",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "BRISKET",
      description: "Ración de 300g",
      id: "6566",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "COSTILLAS DE CERDO BBQ",
      description: "Ración de 300g",
      id: "6907",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CENTRO DE LOMITO",
      description: "Ración de 300g",
      id: "6436",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CHURRASCO DE MUSLO",
      description: "Ración de 300g",
      id: "2446",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "ASADO DE TIRA DE CERDO",
      description: "Ración de 300g",
      id: "4137",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "COSTILLAS DE CERDO AHUMADAS",
      description: "Ración de 300g",
      id: "3940",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CHULETA DE LOMO DE CERDO",
      description: "Ración de 300g",
      id: "6648",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "MILANESA DE POLLO",
      description: "Ración de 300g",
      id: "6900",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "ASADO DE TIRA DE RES ANGUS",
      description: "Ración de 300g",
      id: "4084",
      isKiloOnly: false,
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const { prices, loading, error } = useProductPrices(cortesItems);

  const formatPrice = (price) => {
    return `${price?.toFixed(2)}$`;
  };

  const calculatePrices = (price, isKiloOnly) => {
    if (!price) return { rationPrice: 0, kiloPrice: 0 };
    
    const kiloPrice = price;
    const rationPrice = isKiloOnly ? price : price * 0.3;

    return { rationPrice, kiloPrice };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="CORTES AL CARBÓN" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="CORTES AL CARBÓN" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="CORTES AL CARBÓN" />

      <div className="space-y-6">
        <div className="grid gap-4">
          {cortesItems.map((item) => {
            const { rationPrice, kiloPrice } = calculatePrices(prices[item.id], item.isKiloOnly);
            
            return (
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
                    <div className="text-right">
                      <span className="font-bold text-lg text-gray-800">
                        {formatPrice(rationPrice)}
                      </span>
                      {!item.isKiloOnly && (
                        <div className="text-sm text-gray-500">
                          {formatPrice(kiloPrice)}/kg
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-gray-600 text-sm text-center">
            Los cortes incluyen una salsa de cortesía.
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
"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function MenuInfantilSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const menuInfantil = [
    {
      name: "PASTA BOLOGNESA",
      description: "Linguini bañado en salsa bolognesa.",
      id: "4128", // El item_id real de la base de datos
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CHICKEN FINGERS",
      description: "Bastones de pollo empanizados con panko acompañados de papas fritas.",
      price: 99,
      id: "16",
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const { prices, loading, error } = useProductPrices(menuInfantil);

  const formatPrice = (price) => {
    return `${price?.toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="MENÚ INFANTIL" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="MENÚ INFANTIL" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="MENÚ INFANTIL" />

      <div className="space-y-6">
        <div className="space-y-4">
          {menuInfantil.map((item) => (
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
                    {formatPrice(prices[item.id])}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
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
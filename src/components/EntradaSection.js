"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function EntradasSection() {
  const [selectedImage, setSelectedImage] = useState(null);

  const entradaItems = [
    {
      name: "TABLA DE EMBUTIDOS",
      description: "Variedad de embutidos para degustar, frutos secos, aceitunas, mermelada de fresa, mozzarella de búfala y pan tostado.",
      id: "3997",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CROQUETAS SERRANAS",
      description: "Croquetas de jamón serrano acompañadas de una salsa de piña.",
      id: "6629",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CARPACCIO DE RES",
      description: "Lomito braseado, marinado en pimienta, aderezo de queso de cabra y alcaparras, parmesano, rugula fresca, tomates secos, merey y champiñones confitados.",
      id: "2456",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "SOPA DE CEBOLLA",
      description: "Caldo de vegetales acompañado de cebolla caramelizada en vino tinto, coronado con una crosta de pan gratinado y queso parmesano.",
      id: "3624",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CEVICHE",
      description: "Pescado fresco macerado con una 'sarsa tradicional' de vegetales y acompañado de chips de batata. SARSA: Mix de vegetales que componen el ceviche.",
      id: "4115",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "AREPITAS DE CHICHARRÓN",
      description: "Cuatro (4) und, acompañadas de natilla ó queso guayanés.",
      id: "6894", 
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CANASTA DE CAMARONES",
      description: "Canasta de plátano frito rellena de camarones marinados con salsa de ajíes y vegetales frescos.",
      id: "2346",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CAMARONES AL AJILLO",
      description: "Camarones preparados al ajillo.",
      id: "6441",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "SOPA DE MARISCOS",
      description: "Caldo concentrado de mariscos con pulpo, camarón, calamar y pescado blanco, con un toque de limón y cilantro fresco.",
      id: "7115", 
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "TEQUEÑOS",
      description: "Cinco (5) unidades grandes.",
      id: "6415", 
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ];

  const { prices, loading, error } = useProductPrices(entradaItems);

  const formatPrice = (price) => {
    return `${price?.toFixed(2)}$`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="ENTRADAS" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="ENTRADAS" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="ENTRADAS" />

      <div className="space-y-6">
        <div className="grid gap-4">
          {entradaItems.map((item) => (
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
"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function BebidasSection() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('cafe');
  const [showExtras, setShowExtras] = useState(false);

  // Definir categorías de bebidas
  const categories = [
    { id: 'cafe', name: 'CAFÉ / BEBIDAS CALIENTES' },
    { id: 'naturales', name: 'NATURALES' },
    { id: 'verdes', name: 'VERDES' },
    { id: 'frappuccinos', name: 'FRAPPUCCINOS' },
    { id: 'merengadas', name: 'MERENGADAS' },
    { id: 'infusiones', name: 'INFUSIONES FRÍAS' },
    { id: 'cocteles', name: 'COCTELES' },
    { id: 'autor', name: 'COCTELES DE AUTOR' },
    { id: 'cervezas', name: 'CERVEZAS' },
    { id: 'licores', name: 'LICORES' },
    { id: 'whisky', name: 'WHISKY' },
    { id: 'ron', name: 'RON' },
    { id: 'vodka', name: 'VODKA' },
    { id: 'ginebra', name: 'GINEBRA' },
    { id: 'tequila', name: 'TEQUILA' },
  ];

  // Definir elementos por categoría
  const bebidas = {
    cafe: [
      { name: "ESPRESSO", id: "6728", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AMERICANO", id: "6729", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CAPUCCINO", id: "6731", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE", id: "6734", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE VAINILLA", id: "6737", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOCACCINO", id: "6741", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MACCHIATO", id: "6743", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE MACCHIATO", id: "6744", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "BOMBOM", id: "6745", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TODDY CALIENTE", id: "6747", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "INFUSIÓN", id: "6791", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AFOGATO", id: "8112", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    naturales: [
      { name: "FRUTOS ROJOS", id: "6674", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "FRESA", id: "1060", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MELOCOTON", id: "2581", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PIÑA", id: "7095", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MORA", id: "1062", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PARCHITA", id: "1061", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONADA", id: "1027", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LECHOSA", id: "2506", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMON-GENGIBRE", id: "6675", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    verdes: [
      { name: "CELERY", description: "Pepino, piña, celery, zumo de limón y cordial de jengibre.", id: "6682", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    extras: [
      { name: "LECHE CONDENSADA", id: "3946", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "GRANADINA", id: "6902", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "HIERBABUENA", id: "3901", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    frappuccinos: [
      { name: "CARAMELO", id: "6690", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CHOCOLATE", id: "6691", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NUTELLA", id: "6692", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    merengadas: [
      { name: "MANTECADO", id: "6685", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CHOCOLATE", id: "6686", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NUTELLA", id: "6687", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TODDY FRÍO", id: "6826", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONADA DE COCO", id: "6827", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PIE DE LIMÓN", id: "6688", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    infusiones: [
      { 
        name: "MOCKTAIL DE JAMAICA", 
        description: "Cordial de jamaica, zumo de limón o parchita y soda.", 
        id: "6676", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "FRUTOS ROJOS", 
        description: "Cordial de frutos rojos, té de jamaica y zumo de limón.", 
        id: "6680", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "MOCKTAIL DE KIWI", 
        description: "Cordial de kiwi, zumo de parchita y soda.", 
        id: "6677", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BÚNKER", 
        description: "Té verde, cordial de kiwi, jarabe de jengibre y zumo de limón.", 
        id: "6679", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "MOCKTAIL DE NARANJA", 
        description: "Zumo de naranja, sour de parchita y soda.", 
        id: "", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    cocteles: [
      { name: "PIÑA COLADA", id: "6693", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOJITO", id: "6696", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MARGARITA", id: "6710", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "DAIQUIRI", id: "6797", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "GIN TONIC", id: "6700", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOSCOW MULE", id: "6701", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TINTO DE VERANO", id: "", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MIMOSA", id: "6798", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CUBA LIBRE", id: "6799", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MANHATTAN", id: "6801", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "APEROL NEGRONI", id: "", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NEGRONI", id: "6803", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "DRY MARTINI", id: "6804", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    autor: [
      { 
        name: "BÚNKER", 
        description: "Ron ST 1796, cordial de jamaica, zumo de naranja y zumo de piña.", 
        id: "6697", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "APEROL DE LA CASA", 
        description: "Aperol, zumo de piña, oleo de naranja, prosecco Poggio y soda.", 
        id: "6705", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "TROPICAL", 
        description: "Ron ST Gran Reserva, Aperol, cointreau, zumo de naranja y de piña.", 
        id: "6703", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROSA GRILL", 
        description: "Ginebra Bombay Sapphire, cordial de jamaica, zumo de piña y naranja, bitter de angostura y piña grillada.", 
        id: "6702", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "RED NIGHT", 
        description: "Campari, licor y zumo de naranja, cordial de frutos rojos, zumo de limón y soda.", 
        id: "6911", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "JÄGER FRESH", 
        description: "Vodka Stolichnaya, Jagermeister, cordial de cerezas, Dry Vermut y zumo de parchita.", 
        id: "6704", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    cervezas: [
      { name: "POLAR LIGHT 220ML", id: "6751", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "POLAR PILSEN 220ML", id: "6752", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SOLERA AZUL 220ML", id: "6753", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SOLERA VERDE 220ML", id: "6754", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "ZULIA 220ML", id: "6755", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "IMPORTADA UND", id: "6757", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    licores: [
      { name: "FRANGELICO", id: "6820", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "COINTREAU", id: "6821", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONCELLO", id: "6822", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "BAILEYS", id: "6823", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "JAGERMEISTER", id: "6824", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AMARETTO", id: "6825", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SAMBUCA", id: "6851", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    whisky: [
      { 
        name: "OLD PARR 12 AÑOS", 
        options: [
          { type: "Trago", id: "6810" },
          { type: "Servicio", id: "6777", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "OLD PARR SILVER", 
        options: [
          { type: "Servicio", id: "9502S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 12 AÑOS", 
        options: [
          { type: "Trago", id: "6811" },
          { type: "Servicio", id: "6778", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 18 AÑOS", 
        options: [
          { type: "Servicio", id: "6779", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROYAL SALUTE", 
        options: [
          { type: "Servicio", id: "6780", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BLACK LABEL 12 AÑOS", 
        options: [
          { type: "Trago", id: "9506T" },
          { type: "Servicio", id: "9506S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    ron: [
      { 
        name: "PLANAS DIPLOMÁTICO", 
        options: [
          { type: "Servicio", id: "", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST 1796", 
        options: [
          { type: "Trago", id: "6805" },
          { type: "Servicio", id: "6771", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST LINAJE", 
        options: [
          { type: "Trago", id: "6806" },
          { type: "Servicio", id: "6772", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST GRAN RESERVA", 
        options: [
          { type: "Trago", id: "6807" },
          { type: "Servicio", id: "6773", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE EXTRA AÑEJO", 
        options: [
          { type: "Trago", id: "6808" },
          { type: "Servicio", id: "6774", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE ULTRA AÑEJO", 
        options: [
          { type: "Trago", id: "6809" },
          { type: "Servicio", id: "6775", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    vodka: [
      { 
        name: "GREY GOOSE", 
        options: [
          { type: "Trago", id: "6812" },
          { type: "Servicio", id: "6781", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "STOLICHNAYA", 
        options: [
          { type: "Trago", id: "6813" },
          { type: "Servicio", id: "6782", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBERTO CAVALLI", 
        options: [
          { type: "Servicio", id: "6783", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ABSOLUT ORIGINAL", 
        options: [
          { type: "Trago", id: "6814" },
          { type: "Servicio", id: "6784", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    ginebra: [
      { 
        name: "BOMBAY SAPPHIRE", 
        options: [
          { type: "Trago", id: "6815" },
          { type: "Servicio", id: "6785", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "THE LONDON N° 1", 
        options: [
          { type: "Trago", id: "6817" },
          { type: "Servicio", id: "6787", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "HENDRICK'S", 
        options: [
          { type: "Trago", id: "6818" },
          { type: "Servicio", id: "6788", description: "Botella 0.70L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    tequila: [
      { 
        name: "JOSE CUERVO REPOSADO", 
        options: [
          { type: "Trago", id: "6819" },
          { type: "Servicio", id: "6789", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
  };

  // Preparar lista de productos para obtener precios
  const getProductsList = () => {
    const products = [];
    const categoryItems = bebidas[activeCategory] || [];
    
    categoryItems.forEach(item => {
      if (item.options) {
        // Para categorías con opciones de trago/servicio
        item.options.forEach(option => {
          products.push({ id: option.id, name: `${item.name} - ${option.type}` });
        });
      } else {
        // Para productos normales
        products.push(item);
      }
    });
    
    return products;
  };

  // Obtener precios para la categoría activa
  const { prices, loading, error } = useProductPrices(getProductsList());

  // Formatear el precio
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "Cargando...";
    return `${price.toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="BEBIDAS" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="BEBIDAS" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="BEBIDAS" />

      {/* Menú de categorías */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-4 pb-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeCategory === category.id
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                setActiveCategory(category.id);
                if (!(category.id === 'naturales' || category.id === 'verdes')) {
                  setShowExtras(false);
                }
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Título de la categoría actual */}
        <h2 className="text-xl font-bold mb-4">
          {categories.find(cat => cat.id === activeCategory)?.name}
        </h2>

        {/* Si la categoría es naturales o verdes, mostrar botón de extras */}
        {(activeCategory === 'naturales' || activeCategory === 'verdes') && (
          <button
            className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-md mb-4 inline-flex items-center"
            onClick={() => setShowExtras(!showExtras)}
          >
            {showExtras ? 'Ocultar extras' : 'Mostrar extras'}
          </button>
        )}

        {/* Extras (para jugos) */}
        {showExtras && (activeCategory === 'naturales' || activeCategory === 'verdes') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">EXTRAS</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {bebidas.extras.map((extra) => (
                <div 
                  key={extra.id}
                  className="bg-white shadow-md rounded-lg p-3 border border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{extra.name}</h4>
                    <span className="font-bold text-gray-800">
                      {formatPrice(prices[extra.id]) || "+0.50$"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Elementos de la categoría */}
        <div className="grid gap-4">
          {bebidas[activeCategory]?.map((item) => (
            <div 
              key={item.id || item.name}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  )}

                  {/* Para categorías de licores que tienen opciones de trago/servicio */}
                  {item.options && (
                    <div className="mt-3 space-y-2">
                      {item.options.map((option) => (
                        <div key={option.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div>
                            <span className="font-medium text-amber-800">{option.type}</span>
                            {option.description && (
                              <span className="text-xs text-gray-500 ml-2">
                                {option.description}
                              </span>
                            )}
                          </div>
                          <span className="font-bold">
                            {formatPrice(prices[option.id])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Para productos que no tienen opciones de trago/servicio */}
                {!item.options && (
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
                )}
                
                {/* Para productos con opciones, mostrar solo el botón de imagen */}
                {item.options && (
                  <button
                    onClick={() => setSelectedImage(item)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Image size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Si no hay elementos en la categoría */}
          {(!bebidas[activeCategory] || bebidas[activeCategory].length === 0) && (
            <div className="text-center py-4 text-gray-500">
              No hay productos disponibles en esta categoría
            </div>
          )}
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
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
      { name: "ESPRESSO", id: "8101", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AMERICANO", id: "8102", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CAPUCCINO", id: "8103", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE", id: "8104", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE VAINILLA", id: "8105", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOCACCINO", id: "8106", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MACCHIATO", id: "8107", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LATTE MACCHIATO", id: "8108", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "BOMBOM", id: "8109", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TODDY CALIENTE", id: "8110", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "INFUSIÓN", id: "8111", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AFOGATO", id: "8112", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    naturales: [
      { name: "FRUTOS ROJOS", id: "8201", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "FRESA", id: "8202", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MELOCOTON", id: "8203", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PIÑA", id: "8204", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MORA", id: "8205", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PARCHITA", id: "8206", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONADA", id: "8207", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LECHOSA", id: "8208", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMON-GENGIBRE", id: "8209", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    verdes: [
      { name: "CELERY", description: "Pepino, piña, celery, zumo de limón y cordial de jengibre.", id: "8301", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    extras: [
      { name: "LECHE", id: "8401", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LECHE CONDENSADA", id: "8402", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "YOGURT", id: "8403", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "GRANADINA", id: "8404", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "HIERBABUENA", id: "8405", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    frappuccinos: [
      { name: "CARAMELO", id: "8501", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CHOCOLATE", id: "8502", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NUTELLA", id: "8503", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    merengadas: [
      { name: "MANTECADO", id: "8601", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CHOCOLATE", id: "8602", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NUTELLA", id: "8603", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TODDY FRÍO", id: "8604", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONADA DE COCO", id: "8605", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PIE DE LIMÓN", id: "8606", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    infusiones: [
      { 
        name: "MOCKTAIL DE JAMAICA", 
        description: "Cordial de jamaica, zumo de limón o parchita y soda.", 
        id: "8701", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "FRUTOS ROJOS", 
        description: "Cordial de frutos rojos, té de jamaica y zumo de limón.", 
        id: "8702", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "MOCKTAIL DE KIWI", 
        description: "Cordial de kiwi, zumo de parchita y soda.", 
        id: "8703", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BÚNKER", 
        description: "Té verde, cordial de kiwi, jarabe de jengibre y zumo de limón.", 
        id: "8704", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "MOCKTAIL DE NARANJA", 
        description: "Zumo de naranja, sour de parchita y soda.", 
        id: "8705", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    cocteles: [
      { name: "PIÑA COLADA", id: "9101", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOJITO", id: "9102", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MARGARITA", id: "9103", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "DAIQUIRI", id: "9104", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "GIN TONIC", id: "9105", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MOSCOW MULE", id: "9106", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "TINTO DE VERANO", id: "9107", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MIMOSA", id: "9108", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "CUBA LIBRE", id: "9109", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MANHATTAN", id: "9110", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "APEROL NEGRONI", id: "9111", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "NEGRONI", id: "9112", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "DRY MARTINI", id: "9113", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    autor: [
      { 
        name: "BÚNKER", 
        description: "Ron ST 1796, cordial de jamaica, zumo de naranja y zumo de piña.", 
        id: "9201", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "APEROL DE LA CASA", 
        description: "Aperol, zumo de piña, oleo de naranja, prosecco Poggio y soda.", 
        id: "9202", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "TROPICAL", 
        description: "Ron ST Gran Reserva, Aperol, cointreau, zumo de naranja y de piña.", 
        id: "9203", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROSA GRILL", 
        description: "Ginebra Bombay Sapphire, cordial de jamaica, zumo de piña y naranja, bitter de angostura y piña grillada.", 
        id: "9204", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "RED NIGHT", 
        description: "Campari, licor y zumo de naranja, cordial de frutos rojos, zumo de limón y soda.", 
        id: "9205", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "JÄGER FRESH", 
        description: "Vodka Stolichnaya, Jagermeister, cordial de cerezas, Dry Vermut y zumo de parchita.", 
        id: "9206", 
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    cervezas: [
      { name: "POLAR LIGHT 220ML", id: "9301", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "POLAR PILSEN 220ML", id: "9302", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SOLERA AZUL 220ML", id: "9303", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SOLERA VERDE 220ML", id: "9304", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "ZULIA 220ML", id: "9305", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "IMPORTADA UND", id: "9306", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    licores: [
      { name: "FRANGELICO", id: "9401", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "COINTREAU", id: "9402", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONCELLO", id: "9403", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "BAILEYS", id: "9404", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "JAGERMEISTER", id: "9405", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "AMARETTO", id: "9406", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "SAMBUCA", id: "9407", imageUrl: "URL_DE_LA_IMAGEN" },
    ],
    whisky: [
      { 
        name: "OLD PARR 12 AÑOS", 
        options: [
          { type: "Trago", id: "9501T" },
          { type: "Servicio", id: "9501S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "OLD PARR SILVER", 
        options: [
          { type: "Trago", id: "9502T" },
          { type: "Servicio", id: "9502S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 12 AÑOS", 
        options: [
          { type: "Trago", id: "9503T" },
          { type: "Servicio", id: "9503S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 18 AÑOS", 
        options: [
          { type: "Trago", id: "9504T" },
          { type: "Servicio", id: "9504S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROYAL SALUTE", 
        options: [
          { type: "Trago", id: "9505T" },
          { type: "Servicio", id: "9505S", description: "Botella 0.75L" }
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
          { type: "Trago", id: "9601T" },
          { type: "Servicio", id: "9601S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST 1796", 
        options: [
          { type: "Trago", id: "9602T" },
          { type: "Servicio", id: "9602S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST LINAJE", 
        options: [
          { type: "Trago", id: "9603T" },
          { type: "Servicio", id: "9603S", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST GRAN RESERVA", 
        options: [
          { type: "Trago", id: "9604T" },
          { type: "Servicio", id: "9604S", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE EXTRA AÑEJO", 
        options: [
          { type: "Trago", id: "9605T" },
          { type: "Servicio", id: "9605S", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE ULTRA AÑEJO", 
        options: [
          { type: "Trago", id: "9606T" },
          { type: "Servicio", id: "9606S", description: "Botella 0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    vodka: [
      { 
        name: "GREY GOOSE", 
        options: [
          { type: "Trago", id: "9701T" },
          { type: "Servicio", id: "9701S", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "STOLICHNAYA", 
        options: [
          { type: "Trago", id: "9702T" },
          { type: "Servicio", id: "9702S", description: "Botella 0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBERTO CAVALLI", 
        options: [
          { type: "Trago", id: "9703T" },
          { type: "Servicio", id: "9703S", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ABSOLUT ORIGINAL", 
        options: [
          { type: "Trago", id: "9704T" },
          { type: "Servicio", id: "9704S", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    ginebra: [
      { 
        name: "BOMBAY SAPPHIRE", 
        options: [
          { type: "Trago", id: "9801T" },
          { type: "Servicio", id: "9801S", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "THE LONDON N° 1", 
        options: [
          { type: "Trago", id: "9802T" },
          { type: "Servicio", id: "9802S", description: "Botella 1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "HENDRICK'S", 
        options: [
          { type: "Trago", id: "9803T" },
          { type: "Servicio", id: "9803S", description: "Botella 0.70L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    tequila: [
      { 
        name: "JOSE CUERVO REPOSADO", 
        options: [
          { type: "Trago", id: "9901T" },
          { type: "Servicio", id: "9901S", description: "Botella 0.75L" }
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
    return `${price.toFixed(2)}$`;
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
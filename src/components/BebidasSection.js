"use client";

import { useState } from 'react';
import { useProductPrices } from '@/hooks/useProductPrices';
import { Image, Coffee, Droplets, Wine, Beer } from 'lucide-react';
import Header from './common/Header';
import Footer from './common/Footer';
import ImageModal from './common/ImageModal';

export default function BebidasSection() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeGroup, setActiveGroup] = useState('calientes');
  const [activeCategory, setActiveCategory] = useState('cafe');
  const [showExtras, setShowExtras] = useState(false);

  // Agrupar categorías en grupos principales
  const groups = [
    {
      id: 'calientes',
      name: 'CALIENTES',
      icon: Coffee,
      categories: [
        { id: 'cafe', name: 'CAFÉ Y TÉ' }
      ]
    },
    {
      id: 'frias',
      name: 'FRÍAS',
      icon: Droplets,
      categories: [
        { id: 'naturales', name: 'NATURALES' },
        { id: 'verdes', name: 'VERDES' },
        { id: 'frappuccinos', name: 'FRAPPÉS' },
        { id: 'merengadas', name: 'BATIDOS' },
        { id: 'infusiones', name: 'INFUSIONES' }
      ]
    },
    {
      id: 'alcoholicas',
      name: 'COCTELES',
      icon: Wine,
      categories: [
        { id: 'cocteles', name: 'CLÁSICOS' },
        { id: 'autor', name: 'DE AUTOR' }
      ]
    },
    {
      id: 'licores',
      name: 'LICORES',
      icon: Beer,
      categories: [
        { id: 'cervezas', name: 'CERVEZAS' },
        { id: 'whisky', name: 'WHISKY' },
        { id: 'ron', name: 'RON' },
        { id: 'vodka', name: 'VODKA' },
        { id: 'ginebra', name: 'GINEBRA' },
        { id: 'tequila', name: 'TEQUILA' },
        { id: 'licores', name: 'OTROS' }
      ]
    }
  ];

  // Bebidas organizadas por categoría
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
      { name: "MELOCOTÓN", id: "2581", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PIÑA", id: "7095", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "MORA", id: "1062", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "PARCHITA", id: "1061", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMONADA", id: "1027", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LECHOSA", id: "2506", imageUrl: "URL_DE_LA_IMAGEN" },
      { name: "LIMÓN-JENGIBRE", id: "6675", imageUrl: "URL_DE_LA_IMAGEN" },
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
          { type: "Botella", id: "6777", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "OLD PARR SILVER", 
        options: [
          { type: "Botella", id: "9502S", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 12 AÑOS", 
        options: [
          { type: "Trago", id: "6811" },
          { type: "Botella", id: "6778", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BUCHANANS 18 AÑOS", 
        options: [
          { type: "Botella", id: "6779", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROYAL SALUTE", 
        options: [
          { type: "Botella", id: "6780", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "BLACK LABEL 12 AÑOS", 
        options: [
          { type: "Trago", id: "9506T" },
          { type: "Botella", id: "9506S", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    ron: [
      { 
        name: "PLANAS DIPLOMÁTICO", 
        options: [
          { type: "Botella", id: "", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST 1796", 
        options: [
          { type: "Trago", id: "6805" },
          { type: "Botella", id: "6771", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST LINAJE", 
        options: [
          { type: "Trago", id: "6806" },
          { type: "Botella", id: "6772", description: "0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ST GRAN RESERVA", 
        options: [
          { type: "Trago", id: "6807" },
          { type: "Botella", id: "6773", description: "0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE EXTRA AÑEJO", 
        options: [
          { type: "Trago", id: "6808" },
          { type: "Botella", id: "6774", description: "0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBLE ULTRA AÑEJO", 
        options: [
          { type: "Trago", id: "6809" },
          { type: "Botella", id: "6775", description: "0.7L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    vodka: [
      { 
        name: "GREY GOOSE", 
        options: [
          { type: "Trago", id: "6812" },
          { type: "Botella", id: "6781", description: "1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "STOLICHNAYA", 
        options: [
          { type: "Trago", id: "6813" },
          { type: "Botella", id: "6782", description: "0.75L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ROBERTO CAVALLI", 
        options: [
          { type: "Botella", id: "6783", description: "1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "ABSOLUT ORIGINAL", 
        options: [
          { type: "Trago", id: "6814" },
          { type: "Botella", id: "6784", description: "1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    ginebra: [
      { 
        name: "BOMBAY SAPPHIRE", 
        options: [
          { type: "Trago", id: "6815" },
          { type: "Botella", id: "6785", description: "1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "THE LONDON N° 1", 
        options: [
          { type: "Trago", id: "6817" },
          { type: "Botella", id: "6787", description: "1L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
      { 
        name: "HENDRICK'S", 
        options: [
          { type: "Trago", id: "6818" },
          { type: "Botella", id: "6788", description: "0.70L" }
        ],
        imageUrl: "URL_DE_LA_IMAGEN" 
      },
    ],
    tequila: [
      { 
        name: "JOSE CUERVO REPOSADO", 
        options: [
          { type: "Trago", id: "6819" },
          { type: "Botella", id: "6789", description: "0.75L" }
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

  // Encontrar el grupo actual
  const currentGroup = groups.find(group => group.id === activeGroup);

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

      {/* Grupos principales */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {groups.map((group) => {
            const IconComponent = group.icon;
            return (
              <button
                key={group.id}
                className={`p-4 rounded-lg text-center transition-all duration-200 ${
                  activeGroup === group.id
                    ? "bg-[#C8A882] text-white shadow-lg"
                    : "bg-gray-100 text-[#8B7355] hover:bg-gray-200"
                }`}
                onClick={() => {
                  setActiveGroup(group.id);
                  setActiveCategory(group.categories[0].id);
                  setShowExtras(false);
                }}
              >
                <IconComponent className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{group.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subategorías del grupo seleccionado */}
      {currentGroup && currentGroup.categories.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {currentGroup.categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === category.id
                    ? "bg-[#8B7355] text-white shadow-md"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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
      )}

      <div className="space-y-4">
        {/* Si la categoría es naturales o verdes, mostrar botón de extras */}
        {(activeCategory === 'naturales' || activeCategory === 'verdes') && (
          <button
            className="px-4 py-2 bg-[#C8A882] bg-opacity-20 text-[#8B7355] border border-[#C8A882] rounded-lg mb-4 inline-flex items-center font-medium"
            onClick={() => setShowExtras(!showExtras)}
          >
            {showExtras ? 'Ocultar extras' : 'Mostrar extras'}
          </button>
        )}

        {/* Extras (para jugos) */}
        {showExtras && (activeCategory === 'naturales' || activeCategory === 'verdes') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-[#C8A882]">EXTRAS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bebidas.extras.map((extra) => (
                <div 
                  key={extra.id}
                  className="bg-white shadow-md rounded-lg p-3 border border-[#C8A882]"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-[#8B7355]">{extra.name}</h4>
                    <span className="font-bold text-[#C8A882]">
                      {formatPrice(prices[extra.id]) || "+0.50€"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Elementos de la categoría - Diseño compacto para móviles */}
        <div className="space-y-4">
          {bebidas[activeCategory]?.map((item) => (
            <div 
              key={item.id || item.name}
              className="bg-white shadow-md rounded-lg p-4 border border-[#C8A882] hover:border-[#8B7355] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-lg mb-1 text-[#8B7355]">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  )}

                  {/* Para categorías de licores que tienen opciones de trago/servicio */}
                  {item.options && (
                    <div className="space-y-2 mt-2">
                      {item.options.map((option) => (
                        <div key={option.id} className="flex justify-between items-center py-1">
                          <div className="flex-1">
                            <span className="font-medium text-[#8B7355] text-sm">{option.type}</span>
                            {option.description && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({option.description})
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#C8A882] ml-2">
                            {formatPrice(prices[option.id])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Para productos que no tienen opciones de trago/servicio */}
                {!item.options && (
                  <div className="flex items-center gap-3 flex-shrink-0">
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
                )}
                
                {/* Para productos con opciones, mostrar solo el botón de imagen */}
                {item.options && (
                  <button
                    onClick={() => setSelectedImage(item)}
                    className="text-gray-500 hover:text-[#8B7355] transition-colors flex-shrink-0"
                  >
                    <Image size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Si no hay elementos en la categoría */}
          {(!bebidas[activeCategory] || bebidas[activeCategory].length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay productos disponibles en esta categoría</p>
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
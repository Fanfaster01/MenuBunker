import { useState, useEffect } from 'react';

export default function useVictorianaPrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchPrice = async (itemId) => {
    if (!itemId) return null;

    // Si ya tenemos el precio en caché
    if (prices[itemId] !== undefined) {
      return prices[itemId];
    }

    // Si ya estamos cargando este precio
    if (loading[itemId]) {
      return null;
    }

    setLoading(prev => ({ ...prev, [itemId]: true }));
    setErrors(prev => ({ ...prev, [itemId]: null }));

    try {
      const response = await fetch(`/api/victoriana-prices?itemId=${itemId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error fetching price');
      }

      setPrices(prev => ({ ...prev, [itemId]: data.price }));
      return data.price;
    } catch (error) {
      console.error(`Error fetching price for item ${itemId}:`, error);
      setErrors(prev => ({ ...prev, [itemId]: error.message }));
      setPrices(prev => ({ ...prev, [itemId]: null }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const fetchMultiplePrices = async (itemIds) => {
    const promises = itemIds.map(id => fetchPrice(id));
    await Promise.all(promises);
  };

  const getPrice = (itemId) => {
    return prices[itemId] || null;
  };

  const isLoading = (itemId) => {
    return loading[itemId] || false;
  };

  const getError = (itemId) => {
    return errors[itemId] || null;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'Consultar';
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return {
    prices,
    loading,
    errors,
    fetchPrice,
    fetchMultiplePrices,
    getPrice,
    isLoading,
    getError,
    formatPrice
  };
}
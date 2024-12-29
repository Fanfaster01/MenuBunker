"use client";

import { useState, useEffect } from 'react';

export function useProductPrices(items) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          items.map(async item => {
            const res = await fetch(`/api/prices?itemId=${item.id}`);
            if (!res.ok) throw new Error('Error fetching price');
            return res.json();
          })
        );
        
        const newPrices = {};
        responses.forEach((response, index) => {
          newPrices[items[index].id] = response.price;
        });
        
        setPrices(newPrices);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (items && items.length > 0) {
      fetchPrices();
    }
  }, [JSON.stringify(items)]); // Dependencia más estable

  return { prices, loading, error };
}
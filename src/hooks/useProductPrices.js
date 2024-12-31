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
         items.map(item => 
           Promise.race([
             fetch(`/api/prices?itemId=${item.id}`).then(res => res.json()),
             new Promise((_, reject) => 
               setTimeout(() => reject(new Error('Timeout')), 5000)
             )
           ])
         )
       );
       
       const newPrices = {};
       responses.forEach((response, index) => {
         newPrices[items[index].id] = response.price;
       });
       
       setPrices(newPrices);
       setLoading(false);
     } catch (err) {
       setError(err);
       console.error('Error fetching prices:', err);
       setLoading(false);
     }
   };

   if (items && items.length > 0) {
     fetchPrices();
   }
 }, [JSON.stringify(items)]);

 return { prices, loading, error };
}
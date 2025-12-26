// src/components/common/TruckImage.jsx
import React, { useState, useEffect } from 'react';

/**
 * TruckImage - reusable truck photo with sensible defaults
 *
 * Props:
 * - id: truck ID to fetch image from backend (optional)
 * - src: optional custom URL (overrides id)
 * - width: number (default 160)
 * - height: number (default 100)
 * - alt: string (default 'Truck photo')
 * - className: string (extra classes)
 *
 * Notes on sizes:
 * - Common card thumbnail size works well at 160x100 (16:10) or 150x100 (3:2)
 * - Use object-cover to crop nicely inside rounded container
 */

export default function TruckImage({
  id,
  src,
  width = 160,
  height = 100,
  alt = 'Truck photo',
  className = '',
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const placeholder = `https://placehold.co/${width}x${height}?text=TRUCK`;

  useEffect(() => {
    // If src is provided directly, use it
    if (src) {
      setImageSrc(src);
      return;
    }

    // If id is provided, fetch truck data from backend
    if (id) {
      const fetchTruckImage = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          
          const response = await fetch(`${API_URL}/api/trucks/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const truck = data.data?.truck || data.truck || data.data || data;
            
            if (truck.image) {
              // Image path is relative, prepend API_URL
              const fullImageUrl = `${API_URL}${truck.image}`;
              setImageSrc(fullImageUrl);
            } else {
              setImageSrc(placeholder);
            }
          } else {
            console.error(`❌ TruckImage ID ${id} - Fetch failed:`, response.status);
            setImageSrc(placeholder);
          }
        } catch (error) {
          console.error('Failed to fetch truck image:', error);
          setImageSrc(placeholder);
        }
      };

      fetchTruckImage();
    } else {
      setImageSrc(placeholder);
    }
  }, [id, src, placeholder]);

  const finalSrc = imageSrc || placeholder;

  return (
    <img
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={`w-full h-auto rounded-lg object-cover bg-gray-100 ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      onError={(e) => {
        // Fallback if external link fails
        e.currentTarget.onerror = null;
        e.currentTarget.src = placeholder;
      }}
    />
  );
}
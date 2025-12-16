// src/components/common/TruckImage.jsx
import React from 'react';

/**
 * TruckImage - reusable truck photo with sensible defaults
 *
 * Props:
 * - src: optional custom URL
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
  src,
  width = 160,
  height = 100,
  alt = 'Truck photo',
  className = '',
}) {
  // Prefer provided src; otherwise use a simple placeholder
  // placehold.co is fast and simple; picsum alternative shown below if needed:
  const placeholder = `https://placehold.co/${width}x${height}?text=TRUCK`;
  const finalSrc = src || placeholder;

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
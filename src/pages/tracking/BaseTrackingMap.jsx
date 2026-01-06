/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import { miningAreaApi } from 'services/management'; // BE2 untuk mining area master data

const BaseTrackingMap = ({
  children,
  onMapReady,
  showCompass = true,
  showMapStyleToggle = true,
  showAutoCenter = true,
  showFitRoutes = false,
  onFitRoutes,
  additionalControls = null,
  sidebarContent = null,
  bottomControls = null,
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mapStyle, setMapStyle] = useState('satellite');
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  const miningBoundsRef = useRef(null);
  const initGuardRef = useRef(false);

  // --- Geofence helpers & movement utilities ---
  // Will be loaded from backend (GeoJSON)
  const [polygonLatLng, setPolygonLatLng] = useState([]);

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  // Haversine distance in meters between [lat, lng]
  const haversineMeters = (a, b) => {
    const R = 6371000; // m
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  // Convert a move of meters with bearing to new [lat, lng]
  const moveByMeters = (start, distanceM, bearingDeg) => {
    const R = 6371000; // Earth radius in meters
    const brng = toRad(bearingDeg);
    const lat1 = toRad(start[0]);
    const lng1 = toRad(start[1]);
    const lat2 = Math.asin(
      Math.sin(lat1) + (distanceM / R) * Math.cos(brng) * Math.cos(lat1) + 0 // keep formula simple for small distances; this is sufficient for 10m steps
    );
    // For small distances, use equirectangular approximation for longitude delta
    const dLng = (distanceM / (R * Math.cos(lat1))) * Math.sin(brng);
    const lng2 = lng1 + dLng;
    return [toDeg(lat2), toDeg(lng2)];
  };

  // Point in polygon (ray casting), polygon is array of [lat, lng]
  const pointInPolygon = (pt, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0],
        yi = poly[i][1];
      const xj = poly[j][0],
        yj = poly[j][1];
      const intersect =
        yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Centroid of polygon (simple average; adequate for local movement guidance)
  const polygonCentroid = (poly) => {
    if (!poly || poly.length === 0) return [0, 0];
    let sumLat = 0,
      sumLng = 0;
    poly.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return [sumLat / poly.length, sumLng / poly.length];
  };

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      // Guard against double-invocation in React Strict Mode and hot reloads
      if (
        !mapRef.current ||
        map ||
        initGuardRef.current ||
        (mapRef.current && mapRef.current._leaflet_id) ||
        (mapRef.current &&
          mapRef.current.classList &&
          mapRef.current.classList.contains('leaflet-container')) ||
        (mapRef.current &&
          mapRef.current.querySelector &&
          mapRef.current.querySelector('.leaflet-pane'))
      ) {
        return;
      }
      if (mapRef.current && !map) {
        try {
          // mark initializing before awaiting
          initGuardRef.current = true;
          const L = await import('leaflet');

          // Initialize map centered on PT Borneo Indobara geofence area
          const mapInstance = L.default.map(mapRef.current, {
            center: [-3.58, 115.6],
            zoom: 13,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true,
          });

          mapInstance.getContainer().style.outline = 'none';

          // Ensure proper layer ordering to prevent marker hover movement
          try {
            const routesPane = mapInstance.createPane('routesPane');
            routesPane.style.zIndex = 399;
            routesPane.style.pointerEvents = 'auto';
            const markersPane = mapInstance.createPane('markersPane');
            markersPane.style.zIndex = 400; // above routes
            markersPane.style.pointerEvents = 'auto';
          } catch (_e) {
            // noop; creating panes is best-effort
            void _e;
          }

          // Add tile layers
          const satelliteLayer = L.default.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              attribution: 'Tiles &copy; Esri',
              keepBuffer: 3,
              updateWhenZooming: true,
              updateWhenIdle: true,
            }
          );

          const osmLayer = L.default.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              keepBuffer: 3,
              updateWhenZooming: true,
              updateWhenIdle: true,
            }
          );

          satelliteLayer.addTo(mapInstance);
          mapInstance.satelliteLayer = satelliteLayer;
          mapInstance.osmLayer = osmLayer;

          // Fetch and add geofence from backend
          try {
            const res = await miningAreaApi.getBoundaries(); // Pakai miningAreaApi dari BE2
            console.log('🗺️ Mining area response:', res);

            // Response format: { success: true, data: GeoJSON }
            const geo = res?.data;

            if (geo && geo.type === 'FeatureCollection' && geo.features) {
              console.log('✅ Valid GeoJSON received with', geo.features.length, 'features');

              L.default
                .geoJSON(geo, {
                  style: (feature) => {
                    // Different colors for different zone types
                    const zoneType = feature.properties?.zone_type;
                    const colors = {
                      loading: '#3b82f6', // blue
                      dumping: '#ef4444', // red
                      hauling: '#10b981', // green
                      restricted: '#f59e0b', // yellow
                    };

                    return {
                      color: colors[zoneType] || '#3b82f6',
                      weight: 3,
                      opacity: 0.8,
                      fillColor: colors[zoneType] || '#3b82f6',
                      fillOpacity: 0.1,
                      dashArray: '10, 10',
                    };
                  },
                  onEachFeature: (feature, layer) => {
                    // Add popup with zone info
                    if (feature.properties) {
                      const props = feature.properties;
                      layer.bindPopup(`
                        <div class="p-2">
                          <h3 class="font-bold text-sm">${props.name || 'Unknown Zone'}</h3>
                          <p class="text-xs text-gray-600">${props.description || ''}</p>
                          <p class="text-xs mt-1">Type: <span class="font-medium">${props.zone_type || 'N/A'}</span></p>
                        </div>
                      `);
                    }
                  },
                })
                .addTo(mapInstance);

              // Try to compute primary polygon ring for utilities (use first feature)
              try {
                const firstFeature = geo.features[0];
                const coords = firstFeature?.geometry?.coordinates?.[0] || [];
                const latlng = (coords || []).map(([lng, lat]) => [lat, lng]);
                if (latlng.length > 0) {
                  setPolygonLatLng(latlng);
                  console.log('📍 Polygon coordinates set:', latlng.length, 'points');
                }
              } catch (err) {
                console.warn('Failed to extract polygon coordinates:', err);
              }
            } else {
              console.warn('⚠️ Invalid GeoJSON format received:', geo);
            }
          } catch (e) {
            console.error('❌ Failed to load mining area boundaries:', e?.message || e);
          }

          // Compute mining area bounds for zoom-based hiding (after polygon load)
          try {
            if (polygonLatLng && polygonLatLng.length > 0) {
              const bounds = L.default.latLngBounds(polygonLatLng);
              miningBoundsRef.current = bounds;
            }
          } catch (_e) {
            // noop; bounds computation is best-effort
            void _e;
          }

          setMap(mapInstance);
          setLoading(false);

          // Notify parent component that map is ready
          if (onMapReady) {
            onMapReady(mapInstance, {
              polygonLatLng,
              haversineMeters,
              moveByMeters,
              pointInPolygon,
              polygonCentroid,
            });
          }
        } catch (error) {
          console.error('Error initializing map:', error);
          setLoading(false);
        }
      }
    };

    initializeMap();
  }, []); // Empty deps: intentionally run once on mount, map

  // Invalidate map size when sidebar visibility changes to avoid right-edge clipping
  useEffect(() => {
    if (!map) return;
    // Delay to allow CSS transition to complete before recalculating map size
    const t = setTimeout(() => {
      try {
        map.invalidateSize({ animate: false });
      } catch (e) {
        console.warn('invalidateSize (sidebar) failed:', e);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [map, sidebarVisible]);

  // Invalidate map size on window resize and update window width
  useEffect(() => {
    const onResize = () => {
      setWindowWidth(window.innerWidth);
      if (map) {
        try {
          map.invalidateSize({ animate: false });
        } catch (e) {
          console.warn('invalidateSize (resize) failed:', e);
        }
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  // Cleanup on unmount: remove map and reset guard
  useEffect(() => {
    return () => {
      try {
        if (map) map.remove();
        initGuardRef.current = false;
      } catch (e) {
        console.warn('Error removing map on unmount:', e);
      }
    };
  }, [map]);

  const resetMapView = () => {
    if (map) {
      map.setView([-3.58, 115.6], 13);
    }
  };

  return (
    <div className="h-full flex">
      {/* Toggle Button - only show if sidebarContent is provided */}
      {sidebarContent && (
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className={`fixed top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 border border-gray-300 shadow-lg transition-all duration-300 flex items-center rounded-r-lg px-2 py-3`}
          style={{
            // Ensure this stays below the sidebar (which uses z-50)
            zIndex: 40,
            left: sidebarVisible
              ? windowWidth < 1020
                ? '315px'
                : '605px'
              : windowWidth < 1020
                ? '0px'
                : '288px',
          }}
          title={sidebarVisible ? 'Hide Vehicle List' : 'Show Vehicle List'}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              sidebarVisible ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Sidebar - only show if sidebarContent is provided */}
      {sidebarContent && (
        <div
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
            sidebarVisible ? 'w-80' : 'w-0 overflow-hidden'
          }`}
        >
          {/* Scrollable sidebar content area */}
          <div className="flex-1 overflow-y-auto bg-linear-to-r from-blue-50 to-indigo-50">
            <div className="p-4 border-b border-gray-200">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: 'grab', zIndex: 0 }}
        />

        {/* Map Controls */}
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2"
          style={{ zIndex: 1000, pointerEvents: 'none' }}
        >
          <div
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-3"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Map Style Toggle */}
            {showMapStyleToggle && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMapStyle('osm');
                    if (map) {
                      map.removeLayer(map.satelliteLayer);
                      map.addLayer(map.osmLayer);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    mapStyle === 'osm'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => {
                    setMapStyle('satellite');
                    if (map) {
                      map.removeLayer(map.osmLayer);
                      map.addLayer(map.satelliteLayer);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Satellite
                </button>
              </div>
            )}

            {/* Additional Controls */}
            {additionalControls}
          </div>
        </div>

        {/* Top Right Controls */}
        <div
          className="absolute top-4 right-4 flex flex-col gap-2"
          style={{ zIndex: 1000, pointerEvents: 'none' }}
        >
          {/* Compass */}
          {showCompass && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="flex flex-col items-center relative">
                <span className="text-xs font-bold text-gray-700 mb-1">N</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" stroke="#374151" strokeWidth="1" fill="white" />
                  <polygon
                    points="12,6 13.5,11 12,10.5 10.5,11"
                    fill="#ef4444"
                    stroke="#dc2626"
                    strokeWidth="0.5"
                  />
                  <polygon
                    points="12,18 10.5,13 12,13.5 13.5,13"
                    fill="#6b7280"
                    stroke="#4b5563"
                    strokeWidth="0.5"
                  />
                  <circle cx="12" cy="12" r="1" fill="#374151" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls (consumer-provided) */}
        {bottomControls}

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
          {/* Fit Routes Button */}
          {showFitRoutes && onFitRoutes && (
            <button
              onClick={onFitRoutes}
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Fit Routes</span>
            </button>
          )}

          {/* Auto Center Button */}
          {showAutoCenter && (
            <button
              onClick={resetMapView}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="7" strokeWidth="2" />
                <line x1="12" y1="3" x2="12" y2="7" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="12" x2="7" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="17" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium">Auto Center</span>
            </button>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div
            className="absolute inset-0 bg-white/80 flex items-center justify-center"
            style={{ zIndex: 1001 }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Children components can render additional map elements */}
        {children}
      </div>
    </div>
  );
};

export default BaseTrackingMap;

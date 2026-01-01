/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import BaseTrackingMap from './BaseTrackingMap';
import { trackingAPI, historyAPI } from 'services/tracking'; // BE1 Tracking & History API
import { trucksApi } from 'services/management';
import TirePressureDisplay from '../../components/dashboard/TirePressureDisplay';
import DatePicker from '../../components/common/DatePicker';

const HistoryTrackingMap = () => {
  // Test mode disabled; use only backend data
  const USE_TEST_ROUTE = false;
  const [map, setMap] = useState(null);
  const [, setMapUtils] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterSelections, setClusterSelections] = useState(
    new Set(['1-199', '200-399', '400-599', '600-799', '800-999'])
  );
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [routeMetaByVehicle, setRouteMetaByVehicle] = useState({});
  const [routeVisible, setRouteVisible] = useState({});
  const [routeColors] = useState([
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9', 
  ]);

  // History-specific states
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [shiftMode, setShiftMode] = useState('day');
  const [customStart, setCustomStart] = useState('08:00');
  const [customEnd, setCustomEnd] = useState('20:00');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [isAutoCenterEnabled, setIsAutoCenterEnabled] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(500);
  const [currentPlaybackTireData, setCurrentPlaybackTireData] = useState(null);
  const [currentPlaybackTimestamp, setCurrentPlaybackTimestamp] = useState(null);
  const [isUsingHistoricalData, setIsUsingHistoricalData] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Allow loading history by explicit truck id (useful for soft-deleted trucks)
  const [truckSearchId, setTruckSearchId] = useState('');
  const [deletedAtByVehicle, setDeletedAtByVehicle] = useState({});

  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const routeStartMarkersRef = useRef({}); // Track route start markers
  const manualRouteRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  // Resolve vehicle identifier (keep as-is; backend should accept it)
  const resolveTruckUUID = (vehicleId) => {
    if (!vehicleId) return null;
    const idStr = String(vehicleId);
    if (idStr.length === 36 && idStr.includes('-')) return idStr;
    return idStr;
  };

  const getDayWindow = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (shiftMode === 'night') {
        // Night shift: 16:00 (4 PM) to 08:00 (8 AM) next day
        const start = new Date(y, m - 1, d, 16, 0, 0, 0);
        const end = new Date(y, m - 1, d + 1, 8, 0, 0, 0);
        return { start, end };
      }
      if (shiftMode === 'custom') {
        const [sh, sm] = (customStart || '08:00').split(':').map(Number);
        const [eh, em] = (customEnd || '16:00').split(':').map(Number);
        let start = new Date(y, m - 1, d, sh || 0, sm || 0, 0, 0);
        let end = new Date(y, m - 1, d, eh || 0, em || 0, 0, 0);
        if (end <= start) end = new Date(y, m - 1, d + 1, eh || 0, em || 0, 0, 0);
        return { start, end };
      }
      // Day shift: 08:00 (8 AM) to 16:00 (4 PM)
      const start = new Date(y, m - 1, d, 8, 0, 0, 0);
      const end = new Date(y, m - 1, d, 16, 0, 0, 0);
      return { start, end };
    } catch {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0, 0);
      return { start, end };
    }
  };

  const extractTruckNumber = (idOrName) => {
    if (!idOrName) return null;
    const str = String(idOrName);
    // For TPMS serial numbers, use last 3 digits or show as "T1", "T2", etc.
    if (str.length > 6) {
      return str.slice(-3); // Last 3 digits for serial numbers
    }
    const m = str.match(/(\d{1,4})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const inSelectedCluster = (truckId) => {
    if (!clusterSelections || clusterSelections.size === 0) return true;
    const n = extractTruckNumber(truckId);
    if (n == null) return false;
    for (const key of clusterSelections) {
      const [lo, hi] = key.split('-').map(Number);
      if (n >= lo && n <= hi) return true;
    }
    return false;
  };

  const loadRouteHistory = async (truckId, timeRange = '24h', windowOverride = null) => {
    try {
      console.log(`📍 Loading route history for truck ${truckId} (${timeRange})`);

      const { start, end } = windowOverride || getDayWindow(selectedDate);
      // Fetch truck metadata (to get deleted_at) so we can exclude history after deletion
      let deletedAt = null;
      try {
        const metaRes = await trucksApi.getById(truckId);
        const meta = metaRes?.data?.truck || metaRes?.data || {};
        const deletedRaw = meta?.deletedAt || meta?.deleted_at || meta?.deleted_at_timestamp || null;
        if (deletedRaw) deletedAt = new Date(deletedRaw);
        if (deletedAt) {
          setDeletedAtByVehicle((prev) => ({ ...prev, [String(truckId)]: deletedAt }));
        }
      } catch (metaErr) {
        console.warn('Could not fetch truck metadata for deletion info:', metaErr.message || metaErr);
      }
      
      // Try NEW History API first
      try {
        console.log('🆕 Attempting History API with sensor snapshots...');
        console.log('📍 API Config:', {
          baseUrl: import.meta.env.VITE_TRACKING_API_BASE_URL,
          truckId,
          dateRange: { start: start.toISOString(), end: end.toISOString() }
        });
        
        const response = await historyAPI.getTruckHistory(truckId, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          limit: 10000
        });
        
        console.log('📥 History API Response:', response);
        console.log('📊 Response Type:', typeof response, 'Has success?', response?.success, 'Has data?', !!response?.data);
        
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          const historyData = response.data;
          
          console.log(`📦 Received ${historyData.length} history points for truck ${truckId}`);
          
          // IMPORTANT: Filter to ensure we only get data for THIS truck
          // Backend might return data for all trucks, so we filter client-side
          const filteredData = historyData.filter(point => {
            // Check if this point belongs to the requested truck
            const pointTruckId = point.truck_id || point.truckId || point.truck_info?.truck_id;
            return String(pointTruckId) === String(truckId);
          });
          
          if (filteredData.length === 0) {
            console.warn(`⚠️ No data found for truck ${truckId} after filtering. Received ${historyData.length} points total.`);
            return { points: [], records: [], tireData: [] };
          }
          
          console.log(`✅ Filtered to ${filteredData.length} points for truck ${truckId} (removed ${historyData.length - filteredData.length} points from other trucks)`);
          
          // Convert API response to route points format
          let enriched = filteredData
            .map((point) => {
              const lat = parseFloat(point.location?.lat);
              const lng = parseFloat(point.location?.lng);
              const t = point.timestamp ? new Date(point.timestamp) : null;
              
              // Convert tires array to tireData format matching old structure
              const tireData = (point.tires || []).map((tire) => ({
                tireNo: tire.tireNo,
                position: tire.position,
                tempValue: tire.temperature,
                tirepValue: tire.pressure,
                exType: tire.status,
                bat: tire.battery,
                timestamp: tire.timestamp ? new Date(tire.timestamp) : null
              }));
              
              // Extract truck_info from snapshot (for deleted trucks)
              const truckInfo = point.truck_info || {};
              
                return { 
                lat, 
                lng, 
                t, 
                raw: point, 
                speed: point.location?.speed || null,
                heading: point.location?.heading || null,
                tireData: tireData,
                // Preserve truck snapshot info
                truckSnapshot: {
                  name: truckInfo.truck_name,
                  plate: truckInfo.truck_plate,
                  vin: truckInfo.truck_vin,
                  model: truckInfo.truck_model,
                  year: truckInfo.truck_year,
                  driver: truckInfo.driver_name,
                  vendor: truckInfo.vendor_name
                }
              };
            })
            .filter((r) => !isNaN(r.lat) && !isNaN(r.lng) && r.lat !== 0 && r.lng !== 0)
              .filter((r) => !deletedAt || !r.t || r.t < deletedAt)
              .sort((a, b) => {
                // Sort by timestamp (oldest first)
                if (!a.t || !b.t) return 0;
                return a.t - b.t;
              });
          
          const routePoints = enriched.map((r) => [r.lat, r.lng]);
          const initialTireData = enriched.length > 0 ? enriched[0].tireData : [];
          
          console.log(`✅ NEW API: Loaded ${routePoints.length} route points`);
          console.log(`🔧 Sensors per point: ${initialTireData.length}`);
          console.log(`📊 Metadata:`, response.meta);
          
          setIsUsingHistoricalData(true); // Mark as using accurate historical data
          
          return { 
            points: routePoints, 
            records: enriched, 
            tireData: initialTireData,
            meta: response.meta
          };
        } else {
          console.warn('⚠️ History API returned no data, falling back to old API...');
          console.warn('Response details:', {
            success: response?.success,
            dataLength: response?.data?.length,
            meta: response?.meta
          });
        }
      } catch (historyError) {
        console.error('⚠️ History API FAILED - Details:');
        console.error('  Error:', historyError.message);
        console.error('  Stack:', historyError.stack);
      }
      
      // No fallback - if History API fails or returns no data, return empty
      console.warn(`⚠️ No history data available for truck ${truckId} in selected date range`);
      return { points: [], records: [], tireData: [] };
    } catch (error) {
      console.error(`❌ Failed to load route history for truck ${truckId}:`, error);
      return { points: [], records: [], tireData: [] };
    }
  };

  const calculateRouteDistance = (routePoints) => {
    if (routePoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const lat1 = routePoints[i - 1][0];
      const lng1 = routePoints[i - 1][1];
      const lat2 = routePoints[i][0];
      const lng2 = routePoints[i][1];

      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      totalDistance += distance;
    }

    return totalDistance;
  };

  const onMapReady = (mapInstance, utils) => {
    setMap(mapInstance);
  };

  // Load vehicles and route history
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setIsAutoRefreshing(true);
        setLoading(true);

        const { start: selectedStart, end: selectedEnd } = getDayWindow(selectedDate);

        // Load basic vehicle data from Tracking API (active trucks only)
        const response = await trackingAPI.getLiveTracking();
        let vehicleData = [];
        
        if (response && response.success && Array.isArray(response.data?.trucks)) {
          const trucks = response.data.trucks;
          
          vehicleData = trucks
            .map((truck) => {
              const id = truck.truck_id ? String(truck.truck_id) : null;
              const location = truck.location;
              
              if (!location || !location.latitude || !location.longitude) {
                console.warn(`⚠️ No location data for truck ${id}`);
                return null;
              }
              
              const lat = parseFloat(location.latitude);
              const lng = parseFloat(location.longitude);
              
              if (!id || !isFinite(lat) || !isFinite(lng)) return null;
              
              // Calculate average battery from device
              const battery = truck.device?.battery?.average || 0;
              
              // Map sensors to tireData format
              const tireData = (truck.sensors || []).map((sensor) => ({
                tireNo: sensor.tireNo,
                sensorNo: sensor.sensorNo,
                tempValue: sensor.tempValue,
                tirepValue: sensor.tirepValue,
                exType: sensor.exType,
                bat: sensor.bat,
              }));
              
              return {
                id,
                truckNumber: truck.truck_id,
                truckName: truck.truck_name,
                plateNumber: truck.plate_number,
                model: truck.model,
                driver: truck.driver?.name || 'Unknown Driver',
                position: [lat, lng], // This will be replaced with history start position
                livePosition: [lat, lng], // Store live position separately
                status: truck.status || 'active',
                speed: 0,
                heading: 0,
                fuel: 0,
                battery: battery,
                signal: truck.device?.status === 'active' ? 'good' : 'unknown',
                lastUpdate: location.last_update ? new Date(location.last_update) : new Date(),
                route: 'Mining Area',
                load: 'Unknown',
                tireData: tireData,
                device: truck.device,
                sensorSummary: truck.sensor_summary,
              };
            })
            .filter(Boolean);
        } else {
          console.error('❌ Tracking API failed, no vehicles loaded');
        }

        // Load deleted trucks that might have history in the selected date range
        try {
          const allTrucksResponse = await trucksApi.getAll({ 
            limit: 1000,
            includeDeleted: true
          });
          const allTrucks = allTrucksResponse?.data?.trucks || allTrucksResponse?.data || [];
          
          console.log(`📦 Loaded ${allTrucks.length} total trucks (including deleted) from management API`);
          
          // Find trucks that were deleted but might have history in selected date range
          const deletedTrucks = allTrucks.filter(truck => {
            const deletedAtField = truck.deleted_at || truck.deletedAt || truck.deleted_at_timestamp;
            if (!deletedAtField) return false;
            
            try {
              const deletedDate = new Date(deletedAtField);
              const selectedDate = new Date(selectedStart);
              return selectedDate <= deletedDate;
            } catch (e) {
              return false;
            }
          });
          
          console.log(`📦 Found ${deletedTrucks.length} deleted trucks with potential history for ${selectedStart.toLocaleDateString()}`);
          
          // Add deleted trucks to vehicleData WITHOUT checking history first
          // History will be loaded later in the loadRouteHistory loop
          for (const truck of deletedTrucks) {
            const truckId = String(truck.id || truck.truck_id);
            
            if (vehicleData.find(v => v.id === truckId)) {
              continue;
            }
            
            const deletedAtField = truck.deleted_at || truck.deletedAt || truck.deleted_at_timestamp;
            
            vehicleData.push({
              id: truckId,
              truckNumber: truck.id || truck.truck_id,
              truckName: truck.name || truck.truck_name,
              plateNumber: truck.plate || truck.plate_number,
              model: truck.model,
              driver: 'Unknown Driver',
              position: [0, 0],
              livePosition: [0, 0],
              status: 'offline',
              speed: 0,
              heading: 0,
              fuel: 0,
              battery: 0,
              signal: 'offline',
              lastUpdate: new Date(deletedAtField),
              route: 'Mining Area',
              load: 'Unknown',
              tireData: [],
              device: null,
              sensorSummary: null,
              isDeleted: true,
              deletedAt: new Date(deletedAtField)
            });
            
            console.log(`   ✅ Added deleted truck ${truckId} (${truck.plate || truck.plate_number}) to vehicle list`);
          }
        } catch (error) {
          console.error('⚠️ Could not load deleted trucks:', error.message);
        }

        // Load route history for each vehicle BEFORE setting vehicles state
        const routesData = {};
        const routeVisibilityData = {};

        for (const vehicle of vehicleData) {
          console.log(`🔄 Loading route history for vehicle: ${vehicle.id}`);
          const history = await loadRouteHistory(vehicle.id, '24h');
          console.log(`📍 Route points loaded for ${vehicle.id}:`, history.points.length);
          if (history.points.length > 0) {
            // Store route with proper isolation per vehicle
            routesData[vehicle.id] = [...history.points]; // Clone array to prevent reference issues
            routeVisibilityData[vehicle.id] = true;
            // store meta records for stats
            routeMetaByVehicleRef.current[vehicle.id] = [...history.records]; // Clone records too
            
            // IMPORTANT: Update vehicle position to first point in history route
            // This ensures marker shows historical start position, not current live position
            vehicle.position = [history.points[0][0], history.points[0][1]]; // Clone coordinates
            console.log(`📍 Updated ${vehicle.id} marker to history start:`, vehicle.position);
            console.log(`   First point: [${history.points[0][0]}, ${history.points[0][1]}]`);
            console.log(`   Last point: [${history.points[history.points.length-1][0]}, ${history.points[history.points.length-1][1]}]`);
          } else {
            console.warn(`⚠️ No route points found for vehicle ${vehicle.id}`);
          }
        }

        setVehicles(vehicleData);
        setVehicleRoutes(routesData);
        setRouteVisible(routeVisibilityData);
        // commit meta records from ref to state to avoid stale closure
        setRouteMetaByVehicle((prev) => ({ ...prev, ...routeMetaByVehicleRef.current }));
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('Failed to load history data:', error);
      } finally {
        setLoading(false);
        setIsAutoRefreshing(false);
      }
    };

    if (map) {
      loadHistoryData();
      // Auto-refresh every 60 seconds for today's history
      // This ensures new route data appears automatically when trucks are added
      const interval = setInterval(loadHistoryData, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [map, selectedDate, shiftMode, customStart, customEnd]);

  // Update markers and routes when data changes
  useEffect(() => {
    if (map && vehicles.length > 0) {
      // Clear existing markers and routes
      Object.values(markersRef.current).forEach((marker) => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });

      Object.values(routeLinesRef.current).forEach((routeLine) => {
        if (routeLine && map.hasLayer(routeLine)) {
          map.removeLayer(routeLine);
        }
      });

      // Clear route start markers
      Object.values(routeStartMarkersRef.current).forEach((marker) => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });

      markersRef.current = {};
      routeLinesRef.current = {};
      routeStartMarkersRef.current = {};

      // Add vehicle markers and routes
      vehicles.forEach((vehicle, index) => {
        const colors = {
          active: '#10b981',
          idle: '#f59e0b',
          maintenance: '#ef4444',
          offline: '#6b7280',
        };

        if (!inSelectedCluster(vehicle.id)) {
          return;
        }

        const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || '';
        const icon = L.divIcon({
          html: `
            <div style="position: relative;">
              <div style="
                background: ${colors[vehicle.status] || colors.offline};
                color: #ffffff;
                border: 2px solid #ffffff;
                border-radius: 6px;
                padding: 2px 6px;
                min-width: 26px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              ">
                ${truckNum}
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${colors[vehicle.status] || colors.offline};
                margin: 0 auto;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
              "></div>
            </div>
          `,
          className: 'custom-truck-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        // Check if marker already exists to prevent duplicates
        let marker = markersRef.current[vehicle.id];
        if (!marker) {
          marker = L.marker(vehicle.position, {
            icon,
            zIndexOffset: 2000,
            pane: 'markersPane',
          }).addTo(map);
          markersRef.current[vehicle.id] = marker;

          marker.on('click', () => {
            try {
              marker.bringToFront();
            } catch {
              /* empty */
            }
            console.log('[History] Marker clicked:', vehicle.id);

            // Hide the static marker immediately when selected to prevent duplication
            try {
              marker.setOpacity(0);
            } catch {
              /* empty */
            }

            setSelectedVehicle(vehicle);
            setPlaybackIndex(0);
            setIsPlaybackPlaying(false);
          });
        } else {
          // Update existing marker position and icon
          // Only update if this vehicle is not currently selected for playback
          if (!selectedVehicle || selectedVehicle.id !== vehicle.id) {
            marker.setLatLng(vehicle.position);
            marker.setIcon(icon);
          }
        }

        // Add route line if exists and visible
        const routeHistory = vehicleRoutes[vehicle.id] || [];
        if (routeHistory.length > 1 && routeVisible[vehicle.id] !== false) {
          const routeColor = routeColors[index % routeColors.length];

          console.log(`🗺️ Drawing route for ${vehicle.id}:`, {
            points: routeHistory.length,
            firstPoint: routeHistory[0],
            lastPoint: routeHistory[routeHistory.length - 1],
            color: routeColor
          });

          const routeLine = L.polyline(routeHistory, {
            color: routeColor,
            weight: 3,
            opacity: 0.9,
            smoothFactor: 2,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: vehicle.status === 'active' ? undefined : '10, 10',
            pane: 'routesPane',
          }).addTo(map);

          routeLinesRef.current[vehicle.id] = routeLine;

          // Add route start marker (tracked to prevent duplicates)
          if (routeHistory.length > 0) {
            const startIcon = L.divIcon({
              html: `
                <div style="
                  background: white;
                  border: 2px solid ${routeColor};
                  border-radius: 50%;
                  width: 16px;
                  height: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  <div style="
                    background: ${routeColor};
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  "></div>
                </div>
              `,
              className: 'route-start-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });

            const startMarker = L.marker(routeHistory[0], { icon: startIcon })
              .addTo(map)
              .bindTooltip(`${vehicle.id} - Route Start (${routeHistory.length} points)`, {
                permanent: false,
                direction: 'top',
              });
            
            // Track the start marker for cleanup
            routeStartMarkersRef.current[vehicle.id] = startMarker;
          }

          // Add route info tooltip
          routeLine.bindTooltip(
            `
            <div class="text-sm">
              <strong>${vehicle.id} Route</strong><br/>
              Points: ${routeHistory.length}<br/>
              Distance: ~${calculateRouteDistance(routeHistory).toFixed(1)} km<br/>
              Status: ${vehicle.status.toUpperCase()}
            </div>
          `,
            {
              sticky: true,
            }
          );
        }
      });

      // Remove markers that are no longer in vehicles data
      const currentVehicleIds = new Set(vehicles.map((v) => v.id));
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentVehicleIds.has(id)) {
          const marker = markersRef.current[id];
          if (marker && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
          delete markersRef.current[id];
        }
      });
      
      // Remove route start markers that are no longer needed
      Object.keys(routeStartMarkersRef.current).forEach((id) => {
        if (!currentVehicleIds.has(id)) {
          const marker = routeStartMarkersRef.current[id];
          if (marker && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
          delete routeStartMarkersRef.current[id];
        }
      });

      // Update marker visibility based on selection
      Object.keys(markersRef.current).forEach((id) => {
        const marker = markersRef.current[id];
        if (marker) {
          try {
            if (selectedVehicle && selectedVehicle.id === id) {
              // Hide static marker when selected (playback marker will be shown)
              marker.setOpacity(0);
            } else {
              // Show static marker when not selected
              marker.setOpacity(1);
            }
          } catch {
            /* empty */
          }
        }
      });
    }
  }, [map, vehicles, routeVisible, routeColors, vehicleRoutes, clusterSelections, selectedVehicle]);

  // Update playback marker position and tire data
  useEffect(() => {
    if (!map || !selectedVehicle) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (routeHistory.length === 0 || playbackIndex >= routeHistory.length) return;

    const currentPosition = routeHistory[playbackIndex];
    
    // Update tire data from current history point
    const currentRecord = routeMetaByVehicle[selectedVehicle.id]?.[playbackIndex];
    if (currentRecord) {
      // Update timestamp
      setCurrentPlaybackTimestamp(currentRecord.t);
      
      // Update tire data
      if (currentRecord.tireData && currentRecord.tireData.length > 0) {
        console.log(`🔄 Playback ${playbackIndex + 1}/${routeHistory.length} | Time: ${currentRecord.t?.toLocaleTimeString('id-ID') || 'N/A'}`);
        console.log('📊 Sensors:', currentRecord.tireData.length, '| Sample:', {
          tire1_temp: currentRecord.tireData[0]?.tempValue + '°C',
          tire1_pressure: currentRecord.tireData[0]?.tirepValue + ' kPa'
        });
        setCurrentPlaybackTireData(currentRecord.tireData);
      } else {
        console.warn(`⚠️ No tire data at index ${playbackIndex}`);
        setCurrentPlaybackTireData(null);
      }
    }

    // Create or update playback marker
    if (!playbackMarkerRef.current) {
      // eslint-disable-next-line no-undef
      const L = window.L || require('leaflet');
      const playbackIcon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 4px 8px rgba(0,0,0,0.3); }
              70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), 0 4px 8px rgba(0,0,0,0.3); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 4px 8px rgba(0,0,0,0.3); }
            }
          </style>
        `,
        className: 'playback-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      playbackMarkerRef.current = L.marker(currentPosition, {
        icon: playbackIcon,
        zIndexOffset: 3000,
        pane: 'markersPane',
      }).addTo(map);
    } else {
      playbackMarkerRef.current.setLatLng(currentPosition);
    }

    // Update tooltip
    if (playbackMarkerRef.current) {
      playbackMarkerRef.current.bindTooltip(
        `
        <div class="text-sm">
          <strong>${selectedVehicle.id} Playback</strong><br/>
          Point: ${playbackIndex + 1} / ${routeHistory.length}<br/>
          Progress: ${Math.round((playbackIndex / Math.max(1, routeHistory.length - 1)) * 100)}%
        </div>
      `,
        {
          permanent: false,
          direction: 'top',
        }
      );
    }

    // Auto-center map on playback marker if enabled
    if (isAutoCenterEnabled) {
      map.setView(currentPosition, map.getZoom());
    }
  }, [map, selectedVehicle, playbackIndex, vehicleRoutes, isAutoCenterEnabled]);

  // Keep a ref for meta updates inside async loops
  const routeMetaByVehicleRef = useRef({});
  useEffect(() => {
    routeMetaByVehicleRef.current = routeMetaByVehicle;
  }, [routeMetaByVehicle]);

  // Compute journey stats for selected vehicle
  const [journeyStats, setJourneyStats] = useState(null);
  useEffect(() => {
    if (!selectedVehicle) {
      setJourneyStats(null);
      return;
    }
    const recs = routeMetaByVehicle[selectedVehicle.id] || [];
    const pts = vehicleRoutes[selectedVehicle.id] || [];
    if (!recs.length && pts.length < 2) {
      setJourneyStats(null);
      return;
    }

    let distanceKm = calculateRouteDistance(pts);
    let startT = null,
      endT = null;
    let durationHrs = null,
      avgSpeed = null;
    if (recs.length > 0) {
      const sorted = recs.filter((r) => r.t && !isNaN(r.t)).sort((a, b) => a.t - b.t);
      if (sorted.length > 1) {
        startT = sorted[0].t;
        endT = sorted[sorted.length - 1].t;
        const ms = endT - startT;
        durationHrs = ms > 0 ? ms / 3600000 : null;
        if (durationHrs && durationHrs > 0) avgSpeed = distanceKm / durationHrs;
      }
    }
    setJourneyStats({ distanceKm, startT, endT, durationHrs, avgSpeed, points: pts.length });
  }, [selectedVehicle, routeMetaByVehicle, vehicleRoutes]);

  // Optionally load alerts count for selected vehicle within window
  const [alertCount, setAlertCount] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  useEffect(() => {
    const loadAlerts = async () => {
      if (!selectedVehicle) {
        setAlertCount(null);
        return;
      }
      const { start, end } = getDayWindow(selectedDate);
      try {
        setAlertsLoading(true);
        const params = {
          truckId: selectedVehicle.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          limit: 500,
        };
        // Alerts tidak tersedia dari TPMS, set count ke 0
        setAlertCount(0);
      } catch (e) {
        setAlertCount(null);
      } finally {
        setAlertsLoading(false);
      }
    };
    loadAlerts();
  }, [selectedVehicle, selectedDate, shiftMode, customStart, customEnd]);

  // Create/remove playback marker when vehicle is selected
  useEffect(() => {
    if (!map) return;

    // Remove existing playback marker
    if (playbackMarkerRef.current && map.hasLayer(playbackMarkerRef.current)) {
      map.removeLayer(playbackMarkerRef.current);
      playbackMarkerRef.current = null;
    }
    
    // Reset playback tire data when vehicle is deselected
    if (!selectedVehicle) {
      setCurrentPlaybackTireData(null);
    }

    // Recreate any missing static markers so all trucks remain selectable
    try {
      vehicles.forEach((vehicle) => {
        const existing = markersRef.current[vehicle.id];
        const hasLayer = existing && map.hasLayer(existing);
        if (!hasLayer) {
          const colors = {
            active: '#10b981',
            idle: '#f59e0b',
            maintenance: '#ef4444',
            offline: '#6b7280',
          };
          const truckNum = vehicle.truckNumber || extractTruckNumber(vehicle.id) || '';
          const icon = L.divIcon({
            html: `
              <div style="position: relative;">
                <div style="
                  background: ${colors[vehicle.status] || colors.offline};
                  color: #ffffff;
                  border: 2px solid #ffffff;
                  border-radius: 6px;
                  padding: 2px 6px;
                  min-width: 26px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 12px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                ">
                  ${truckNum}
                </div>
                <div style="
                  width: 0; height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-top: 8px solid ${colors[vehicle.status] || colors.offline};
                  margin: 0 auto;
                  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
                "></div>
              </div>
            `,
            className: 'custom-truck-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          });
          const marker = L.marker(vehicle.position, {
            icon,
            zIndexOffset: 2000,
            pane: 'markersPane',
          }).addTo(map);
          markersRef.current[vehicle.id] = marker;
          marker.on('click', () => {
            try {
              marker.bringToFront();
            } catch {
              /* empty */
            }
            setSelectedVehicle(vehicle);
            setPlaybackIndex(0);
            setIsPlaybackPlaying(false);
          });
        }
      });
    } catch {
      /* empty */
    }

    // Reset playback when vehicle changes
    if (selectedVehicle) {
      const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
      if (routeHistory.length > 0) {
        setPlaybackIndex(0);
        setIsPlaybackPlaying(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
        // Place the playback truck icon at the starting point
        try {
          createOrUpdatePlaybackMarker(routeHistory[0]);
        } catch {
          /* empty */
        }
      }
    }

    return () => {
      if (playbackMarkerRef.current && map.hasLayer(playbackMarkerRef.current)) {
        map.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }
    };
  }, [map, selectedVehicle, vehicleRoutes]);

  // Load history for a specific truck id (can be used for deleted trucks)
  const handleLoadById = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const history = await loadRouteHistory(id);
      if (history && history.points && history.points.length > 0) {
        setVehicleRoutes((prev) => ({ ...prev, [String(id)]: history.points }));
        setRouteVisible((prev) => ({ ...prev, [String(id)]: true }));
        setSelectedVehicle({ id: String(id), plateNumber: String(id) });
        // center map to first point if available
        if (map && history.points[0]) {
          map.setView(history.points[0], 13);
        }
      } else {
        // clear selection if no data
        setSelectedVehicle(null);
        setVehicleRoutes((prev) => {
          const next = { ...prev };
          delete next[String(id)];
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load by id:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual dummy route rendering removed (backend-only)
  useEffect(() => {
    if (!map) return;
    // no-op
  }, [map]);

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="pb-3 border-b border-gray-200 mb-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-900">History Tracking</h4>
            <p className="text-xs text-gray-500 mt-0.5">Pantau riwayat perjalanan kendaraan</p>
            
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 mt-1">
              {isAutoRefreshing && (
                <span className="flex items-center gap-1 text-[10px] text-blue-600">
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  Refreshing...
                </span>
              )}
              {!isAutoRefreshing && lastRefreshTime && (
                <span className="text-[10px] text-gray-400">
                  Last update: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          {selectedVehicle && (
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setPlaybackIndex(0);
                setIsPlaybackPlaying(false);
                setCurrentPlaybackTireData(null);
                setCurrentPlaybackTimestamp(null);
                if (playbackTimerRef.current) {
                  clearInterval(playbackTimerRef.current);
                  playbackTimerRef.current = null;
                }
                console.log('✓ Vehicle deselected, static markers restored');
              }}
              className="shrink-0 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              title="Clear selection"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-6 pr-1 z-[9999]">
        {/* Selected Vehicle Info */}
        {selectedVehicle && (
          <div className="px-3 py-2 rounded-lg border bg-blue-50 border-blue-300">
            <div className="flex items-start gap-2">
              <span className="text-base">🚛</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-700">
                  {selectedVehicle.plateNumber || selectedVehicle.id}
                </div>
                <div className="text-[10px] mt-0.5 text-blue-600">
                  Viewing historical route playback
                </div>
                {/* Show snapshot data if available from current playback point */}
                {currentPlaybackTimestamp && routeMetaByVehicle[selectedVehicle.id]?.[playbackIndex]?.truckSnapshot && (() => {
                  const snapshot = routeMetaByVehicle[selectedVehicle.id][playbackIndex].truckSnapshot;
                  return (
                    <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                      {snapshot.name && (
                        <div className="text-[10px] text-blue-600">
                          📋 <span className="font-medium">Name:</span> {snapshot.name}
                        </div>
                      )}
                      {snapshot.plate && (
                        <div className="text-[10px] text-blue-600">
                          🚗 <span className="font-medium">Plate:</span> {snapshot.plate}
                        </div>
                      )}
                      {snapshot.driver && (
                        <div className="text-[10px] text-blue-600">
                          👤 <span className="font-medium">Driver:</span> {snapshot.driver}
                        </div>
                      )}
                      {snapshot.vendor && (
                        <div className="text-[10px] text-blue-600">
                          🏢 <span className="font-medium">Vendor:</span> {snapshot.vendor}
                        </div>
                      )}
                      <div className="text-[9px] text-blue-500 italic mt-1">
                        ✓ Data from historical snapshot
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        
        {/* API Status Indicator - Only show if using historical data */}
        {selectedVehicle && isUsingHistoricalData && (
          <div className="px-3 py-2 rounded-lg border bg-green-50 border-green-300">
            <div className="flex items-start gap-2">
              <span className="text-base">✓</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-green-700">
                  Historical Data Active
                </div>
                <div className="text-[10px] mt-0.5 text-green-600">
                  Akurat dari sensor history database
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deleted truck info: show when truck has deleted_at and affects selected date */}
        {selectedVehicle && deletedAtByVehicle[String(selectedVehicle.id)] && (() => {
          const del = new Date(deletedAtByVehicle[String(selectedVehicle.id)]);
          const { start, end } = getDayWindow(selectedDate);
          if (del <= start) {
            return (
              <div className="px-3 py-2 rounded-lg border bg-red-50 border-red-300 text-red-700 text-sm">
                This vehicle was deleted on {del.toLocaleString()}. No history is available for the selected period.
              </div>
            );
          }
          if (del > start && del <= end) {
            return (
              <div className="px-3 py-2 rounded-lg border bg-yellow-50 border-yellow-300 text-yellow-800 text-sm">
                This vehicle was deleted on {del.toLocaleString()}. Only history before that time is available for this date.
              </div>
            );
          }
          return null;
        })}
        
        {/* Date & Shift Section */}
        <div className="min-w-0">
          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Periode Waktu
          </h5>
          <div className="space-y-2.5">
            <div>
              <DatePicker
                label="Tanggal"
                value={selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()}
                onChange={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  }
                }}
                maxDate={new Date()}
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shift Kerja</label>
              <select
                value={shiftMode}
                onChange={(e) => setShiftMode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="day">Siang (08:00–16:00)</option>
                <option value="night">Malam (16:00–08:00)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {shiftMode === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mulai</label>
                  <input
                    type="time"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selesai</label>
                  <input
                    type="time"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        {/* Load by Truck ID (include soft-deleted trucks) */}
        <div className="min-w-0">
          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Load by Truck ID</h5>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter truck ID or plate"
              value={truckSearchId}
              onChange={(e) => setTruckSearchId(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
            />
            <button
              onClick={() => handleLoadById(truckSearchId)}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md"
              disabled={loading || !truckSearchId}
            >
              Load
            </button>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Tip: gunakan ID jika kendaraan sudah dihapus untuk melihat riwayat.</div>
        </div>

        {/* Cluster Filter Section */}
        <div className="min-w-0">
          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Filter Cluster
          </h5>
          <div className="grid grid-cols-2 gap-1.5">
            {['1-199', '200-399', '400-599', '600-799', '800-999'].map((range) => (
              <label
                key={range}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer select-none ${
                  clusterSelections.has(range)
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 shrink-0"
                  checked={clusterSelections.has(range)}
                  onChange={(e) => {
                    setClusterSelections((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(range);
                      else next.delete(range);
                      return next;
                    });
                  }}
                  disabled={loading}
                />
                <span className="truncate">{range}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        {/* Current Point Alerts Section - Only show if alert exists at current point */}
        {selectedVehicle && currentPlaybackTireData && (() => {
          const alerts = [];
          const MAX_ALERTS_DISPLAY = 3; // Limit displayed alerts
          
          currentPlaybackTireData.forEach(tire => {
            const temp = tire.tempValue;
            const pressure = tire.tirepValue; // Already in PSI
            
            // ✅ NEW THRESHOLDS (Dec 2025 Update) - Same as TirePressureDisplay
            // Temperature: Normal <85°C, Warning ≥85°C, Critical ≥100°C
            // Pressure: Normal 100-119 PSI, Critical Low <90 PSI, Critical High ≥120 PSI
            
            // Check temperature alerts
            if (temp >= 100) {
              alerts.push({ tire: tire.tireNo, type: 'critical', message: 'Temperature Critical', value: `${temp.toFixed(1)}°C`, priority: 3 });
            } else if (temp >= 85) {
              alerts.push({ tire: tire.tireNo, type: 'warning', message: 'Temperature Warning', value: `${temp.toFixed(1)}°C`, priority: 2 });
            }
            
            // Check pressure alerts (pressure is already in PSI, no conversion needed)
            const psi = pressure; // No conversion - backend already sends PSI
            if (psi < 90) {
              alerts.push({ tire: tire.tireNo, type: 'critical', message: 'Pressure Critical Low', value: `${psi.toFixed(1)} PSI`, priority: 3 });
            } else if (psi < 100) {
              alerts.push({ tire: tire.tireNo, type: 'warning', message: 'Pressure Low', value: `${psi.toFixed(1)} PSI`, priority: 2 });
            } else if (psi >= 120) {
              alerts.push({ tire: tire.tireNo, type: 'critical', message: 'Pressure Critical High', value: `${psi.toFixed(1)} PSI`, priority: 3 });
            }
          });
          
          return alerts.length > 0 ? (
            <div className="min-w-0">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                🚨 Alerts di Titik Ini
              </h5>
              <div className="space-y-1.5">
                {alerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`px-2 py-1.5 rounded-md border text-xs ${
                      alert.type === 'critical' 
                        ? 'bg-red-50 border-red-300 text-red-700' 
                        : 'bg-orange-50 border-orange-300 text-orange-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold">Ban {alert.tire}: {alert.message}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">{alert.value}</div>
                      </div>
                      <span className="text-base shrink-0">{alert.type === 'critical' ? '🔴' : '⚠️'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-2"></div>
            </div>
          ) : null;
        })()}

        <div className="border-t border-gray-200"></div>

        {/* Tire Pressure Section */}
        <div className="min-w-0 pb-2">
          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>Tekanan Ban</span>
            {currentPlaybackTireData && (
              <span className={`text-[10px] font-normal ${isUsingHistoricalData ? 'text-green-600' : 'text-orange-600'}`}>
                {isUsingHistoricalData ? '✓ Historical' : '~ Simulated'}
              </span>
            )}
          </h5>
          
          {/* Data Source Warning */}
          {currentPlaybackTireData && !isUsingHistoricalData && (
            <div className="mb-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-[10px] text-orange-700">
              <div className="flex items-start gap-1">
                <span>⚠️</span>
                <span>Data simulasi. Untuk data akurat, pastikan History API aktif.</span>
              </div>
            </div>
          )}
          
          {/* Timestamp Info */}
          {currentPlaybackTimestamp && (
            <div className={`mb-2 px-2 py-1.5 rounded text-[10px] ${
              isUsingHistoricalData 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">📅 Recorded:</span>
                <span className="font-mono">
                  {currentPlaybackTimestamp.toLocaleString('id-ID', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-medium">📍 Position:</span>
                <span className="font-mono">
                  {playbackIndex + 1} / {vehicleRoutes[selectedVehicle?.id]?.length || 0}
                </span>
              </div>
              {currentPlaybackTireData && currentPlaybackTireData.length > 0 && (
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-medium">🔧 Sensors:</span>
                  <span className="font-mono">
                    {currentPlaybackTireData.length} active
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="w-full overflow-hidden">
            <TirePressureDisplay
              selectedTruckId={resolveTruckUUID(selectedVehicle?.id) || selectedVehicle?.id}
              tireData={currentPlaybackTireData || selectedVehicle?.tireData}
              showHeader={false}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // const additionalControls = (
  //   <div className="border-l border-gray-300 pl-3 flex items-center gap-2">
  //     <span className="text-xs text-gray-600">Routes:</span>
  //     <button
  //       onClick={() => {
  //         vehicles.forEach((vehicle) => {
  //           if (!routeVisible[vehicle.id]) {
  //             // toggleRouteVisibility(vehicle.id);
  //           }
  //         });
  //       }}
  //       className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
  //     >
  //       Show All
  //     </button>
  //     <button
  //       onClick={() => {
  //         vehicles.forEach((vehicle) => {
  //           if (routeVisible[vehicle.id]) {
  //             // toggleRouteVisibility(vehicle.id);
  //           }
  //         });
  //       }}
  //       className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
  //     >
  //       Hide All
  //     </button>
  //   </div>
  // );

  // Playback functions
  const hasHistory = (vehicleId) => {
    const pts = vehicleRoutes[vehicleId] || [];
    return Array.isArray(pts) && pts.length > 1;
  };

  const createOrUpdatePlaybackMarker = (latlng) => {
    if (!map || !latlng) return;
    // eslint-disable-next-line no-undef
    const L = window.L || require('leaflet');

    if (!playbackMarkerRef.current) {
      const truckNum =
        selectedVehicle?.truckNumber || extractTruckNumber(selectedVehicle?.id) || '';
      const colors = {
        active: '#10b981',
        idle: '#f59e0b',
        maintenance: '#ef4444',
        offline: '#6b7280',
      };
      const badgeColor = colors[selectedVehicle?.status] || colors.offline;
      const icon = L.divIcon({
        html: `
          <div style="position: relative;">
            <div style="
              background: ${badgeColor};
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 6px;
              padding: 2px 6px;
              min-width: 26px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            ">
              ${truckNum}
            </div>
            <div style="
              width: 0; height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${badgeColor};
              margin: 0 auto;
              filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
            "></div>
          </div>
        `,
        className: 'playback-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      playbackMarkerRef.current = L.marker(latlng, {
        icon,
        zIndexOffset: 3000,
        pane: 'markersPane',
      }).addTo(map);
    } else {
      try {
        playbackMarkerRef.current.setLatLng(latlng);
      } catch (e) {
        console.warn('Failed to update playback marker position:', e);
      }
    }
  };

  const startPlayback = () => {
    if (!selectedVehicle || !hasHistory(selectedVehicle.id)) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (playbackIndex >= routeHistory.length - 1) {
      setPlaybackIndex(0); // Reset to start if at end
    }

    // Remove the static truck marker at the start so only the start dot remains
    try {
      const staticMarker = markersRef.current[selectedVehicle.id];
      if (staticMarker && map && map.hasLayer(staticMarker)) {
        map.removeLayer(staticMarker);
      }
      delete markersRef.current[selectedVehicle.id];
    } catch {
      /* empty */
    }

    setIsPlaybackPlaying(true);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);

    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((currentIndex) => {
        const maxIndex = routeHistory.length - 1;
        if (currentIndex >= maxIndex) {
          // Auto-stop at end
          setIsPlaybackPlaying(false);
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
          return maxIndex;
        }
        return currentIndex + 1;
      });
    }, playbackSpeedMs);
  };

  const pausePlayback = () => {
    setIsPlaybackPlaying(false);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  const stopPlayback = () => {
    pausePlayback();
    setPlaybackIndex(0);
    setCurrentPlaybackTireData(null); // Reset tire data to original
    setCurrentPlaybackTimestamp(null); // Reset timestamp
    const pts = selectedVehicle ? vehicleRoutes[selectedVehicle.id] || [] : [];
    if (pts.length > 0) createOrUpdatePlaybackMarker(pts[0]);
  };

  // Update playback timer when speed changes
  useEffect(() => {
    if (!isPlaybackPlaying || !selectedVehicle) return;
    pausePlayback();
    setTimeout(() => startPlayback(), 50); // Small delay to ensure clean restart
  }, [playbackSpeedMs]);

  // Auto-stop playback when reaching the end
  useEffect(() => {
    if (!selectedVehicle || !isPlaybackPlaying) return;

    const routeHistory = vehicleRoutes[selectedVehicle.id] || [];
    if (playbackIndex >= routeHistory.length - 1) {
      setIsPlaybackPlaying(false);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
  }, [playbackIndex, selectedVehicle, vehicleRoutes, isPlaybackPlaying]);

  // Cleanup playback marker/timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (playbackMarkerRef.current && map) {
        try {
          map.removeLayer(playbackMarkerRef.current);
        } catch {
          /* empty */
        }
        playbackMarkerRef.current = null;
      }
    };
  }, [map]);

  const onFitRoutes = () => {
    if (map) {
      const allRoutes = Object.values(vehicleRoutes).flat();
      if (allRoutes.length > 0) {
        const bounds = [];
        allRoutes.forEach((point) => bounds.push(point));

        if (bounds.length > 0) {
          // eslint-disable-next-line no-undef
          const L = window.L || require('leaflet');
          const group = new L.featureGroup();
          bounds.forEach((point) => {
            L.marker(point).addTo(group);
          });
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }
  };

  const bottomControls = (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
      style={{ zIndex: 1000 }}
    >
      {selectedVehicle && hasHistory(selectedVehicle.id) ? (
        <>
          {/* Play/Pause */}
          <button
            onClick={() => (isPlaybackPlaying ? pausePlayback() : startPlayback())}
            className={`px-3 py-1 rounded text-white text-xs ${isPlaybackPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isPlaybackPlaying ? 'Pause' : 'Play'}
          </button>
          {/* Step Back */}
          <button
            onClick={() => setPlaybackIndex((i) => Math.max(0, i - 1))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
          >
            -1
          </button>
          {/* Skip Back 10 */}
          <button
            onClick={() => setPlaybackIndex((i) => Math.max(0, i - 10))}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
            title="Skip back 10 points"
          >
            -10
          </button>
          {/* Timeline */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={(vehicleRoutes[selectedVehicle.id] || []).length - 1}
              value={Math.min(playbackIndex, (vehicleRoutes[selectedVehicle.id] || []).length - 1)}
              onChange={(e) => setPlaybackIndex(Number(e.target.value))}
              className="w-64"
            />
            <span className="text-xs text-gray-700 min-w-[72px] text-right">
              {Math.min(playbackIndex, (vehicleRoutes[selectedVehicle.id] || []).length - 1)} /{' '}
              {(vehicleRoutes[selectedVehicle.id] || []).length - 1}
            </span>
          </div>
          {/* Step Forward */}
          <button
            onClick={() =>
              setPlaybackIndex((i) =>
                Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 1)
              )
            }
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
          >
            +1
          </button>
          {/* Skip Forward 10 */}
          <button
            onClick={() =>
              setPlaybackIndex((i) =>
                Math.min((vehicleRoutes[selectedVehicle.id] || []).length - 1, i + 10)
              )
            }
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
            title="Skip forward 10 points"
          >
            +10
          </button>
          {/* Speed */}
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Speed:</span>
            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="border border-gray-300 rounded px-1 py-0.5 text-xs"
            >
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={200}>5x</option>
            </select>
          </div>
          {/* Stop */}
          <button
            onClick={stopPlayback}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs"
          >
            Stop
          </button>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">Pilih kendaraan untuk playback.</span>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            Play
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            -1
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            -10
          </button>
          <input type="range" className="w-64 opacity-50" disabled />
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            +1
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            +10
          </button>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Speed:</span>
            <select className="border border-gray-300 rounded px-1 py-0.5 text-xs" disabled>
              <option>1x</option>
            </select>
          </div>
          <button
            className="px-2 py-1 rounded bg-gray-200 text-gray-500 text-xs cursor-not-allowed"
            disabled
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );

  return (
    <BaseTrackingMap
      onMapReady={onMapReady}
      sidebarContent={sidebarContent}
      // additionalControls={additionalControls}
      bottomControls={bottomControls}
      showCompass={true}
      showMapStyleToggle={true}
      showAutoCenter={true}
      showFitRoutes={true}
      onFitRoutes={onFitRoutes}
    />
  );
};

export default HistoryTrackingMap;

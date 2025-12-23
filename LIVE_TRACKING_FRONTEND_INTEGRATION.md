# 🗺️ LIVE TRACKING & LOCATION HISTORY - Frontend Integration Guide

## 📋 Overview

Dokumentasi lengkap untuk integrasi **Live Tracking** dan **Location History** TPMS Backend API ke frontend. API menyediakan data real-time GPS location dari 5 trucks dengan sensor data lengkap.

---

## 🔑 Authentication

### Testing Mode (Development)
```env
TESTING_MODE=true  # di .env backend
```
**Tidak perlu JWT token** untuk testing local.

### Production Mode
```javascript
// Login dulu untuk dapat token
const response = await fetch('http://192.168.21.18:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data } = await response.json();
const token = data.token;

// Gunakan token di header
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 🚀 API Endpoints

### 1. Get All Trucks with Live Location

**Endpoint:**
```
GET /api/trucks/live-tracking
```

**URL:**
```
http://192.168.21.18:3001/api/trucks/live-tracking
```

**Description:**
Mendapatkan semua trucks dengan GPS location terbaru, sensor data, dan battery status.

**Parameters:**
Tidak ada parameter. Return semua trucks aktif.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Live tracking data retrieved successfully",
  "data": {
    "trucks": [
      {
        "truck_id": 1,
        "plate_number": "B 9001 SIM",
        "truck_name": "Simulator Truck SIM01",
        "model": "Mitsubishi Fuso",
        "type": "Dump Truck",
        "status": "active",
        "driver": {
          "id": 1,
          "name": "Budi Santoso",
          "phone": "081234567890"
        },
        "device": {
          "id": 1,
          "serial_number": "DEV-SIM01",
          "status": "active",
          "battery": {
            "bat1": 85,
            "bat2": 88,
            "bat3": 90,
            "average": 88
          }
        },
        "location": {
          "latitude": -3.579108,
          "longitude": 115.619921,
          "recorded_at": "2025-12-15T07:43:40.190Z",
          "last_update": "2025-12-15T07:43:40.197Z"
        },
        "sensors": [
          {
            "id": 1,
            "sn": "SN-001-SIM01",
            "tireNo": 1,
            "sensorNo": 1,
            "tempValue": 52.3,
            "tirepValue": 95.5,
            "exType": "normal",
            "bat": 88,
            "updated_at": "2025-12-15T07:43:40.300Z"
          }
          // ... 9 sensors lainnya
        ],
        "sensor_summary": {
          "total_sensors": 10,
          "avg_temperature": "52.4",
          "avg_pressure": "95.5",
          "critical_count": 0,
          "warning_count": 2
        }
      }
      // ... 4 trucks lainnya (total 5 trucks)
    ],
    "summary": {
      "total_trucks": 5,
      "trucks_with_location": 5,
      "trucks_without_location": 0
    }
  },
  "timestamp": "2025-12-15T07:43:45.000Z"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Failed to fetch live tracking data",
  "error": "Database connection failed"
}
```

---

### 2. Get Single Truck Tracking with History

**Endpoint:**
```
GET /api/trucks/:id/tracking
```

**URL:**
```
http://192.168.21.18:3001/api/trucks/1/tracking
```

**Description:**
Mendapatkan detail tracking satu truck dengan location history (default 50 records terbaru).

**Parameters:**
- `id` (path parameter) - Truck ID
- `limit` (query parameter, optional) - Jumlah location history (default: 50, max: 200)

**Example:**
```
GET /api/trucks/1/tracking?limit=100
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Truck tracking data retrieved successfully",
  "data": {
    "truck_id": 1,
    "plate_number": "B 9001 SIM",
    "truck_name": "Simulator Truck SIM01",
    "model": "Mitsubishi Fuso",
    "type": "Dump Truck",
    "status": "active",
    "driver": {
      "id": 1,
      "name": "Budi Santoso",
      "phone": "081234567890"
    },
    "device": {
      "id": 1,
      "serial_number": "DEV-SIM01",
      "status": "active"
    },
    "current_location": {
      "latitude": -3.579108,
      "longitude": 115.619921,
      "recorded_at": "2025-12-15T07:43:40.190Z"
    },
    "location_history": [
      {
        "latitude": -3.579108,
        "longitude": 115.619921,
        "recorded_at": "2025-12-15T07:43:40.190Z",
        "created_at": "2025-12-15T07:43:40.197Z"
      },
      {
        "latitude": -3.578950,
        "longitude": 115.619800,
        "recorded_at": "2025-12-15T07:38:40.190Z",
        "created_at": "2025-12-15T07:38:40.197Z"
      }
      // ... up to 50 locations (atau sesuai limit)
    ],
    "sensors": [
      {
        "id": 1,
        "sn": "SN-001-SIM01",
        "tireNo": 1,
        "sensorNo": 1,
        "tempValue": 52.3,
        "tirepValue": 95.5,
        "exType": "normal",
        "bat": 88,
        "updated_at": "2025-12-15T07:43:40.300Z"
      }
      // ... 9 sensors lainnya
    ]
  },
  "timestamp": "2025-12-15T07:43:45.000Z"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Truck not found"
}
```

---

## 💻 Frontend Implementation

### React + Axios Example

#### 1. Setup API Client

```javascript
// src/api/client.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.21.18:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor (jika production mode)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### 2. Live Tracking Service

```javascript
// src/services/trackingService.js
import apiClient from '../api/client';

export const trackingService = {
  // Get all trucks with live location
  getLiveTracking: async () => {
    try {
      const response = await apiClient.get('/api/trucks/live-tracking');
      return response.data;
    } catch (error) {
      console.error('Error fetching live tracking:', error);
      throw error;
    }
  },

  // Get single truck tracking with history
  getTruckTracking: async (truckId, limit = 50) => {
    try {
      const response = await apiClient.get(`/api/trucks/${truckId}/tracking`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching truck tracking:', error);
      throw error;
    }
  },
};
```

#### 3. Live Tracking Component (Map View)

```javascript
// src/components/LiveTrackingMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { trackingService } from '../services/trackingService';
import 'leaflet/dist/leaflet.css';

const LiveTrackingMap = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trucks data
  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const response = await trackingService.getLiveTracking();
      
      if (response.success) {
        setTrucks(response.data.trucks);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch tracking data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrucks();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Center map on Kalimantan (mining area)
  const center = [-3.5, 115.5];

  return (
    <div className="live-tracking-map">
      <div className="map-header">
        <h2>Live Truck Tracking</h2>
        <button onClick={fetchTrucks} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <MapContainer center={center} zoom={10} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {trucks.map((truck) => (
          truck.location && (
            <Marker
              key={truck.truck_id}
              position={[truck.location.latitude, truck.location.longitude]}
            >
              <Popup>
                <div className="truck-popup">
                  <h3>{truck.plate_number}</h3>
                  <p><strong>Model:</strong> {truck.model}</p>
                  <p><strong>Driver:</strong> {truck.driver?.name || 'N/A'}</p>
                  <p><strong>Battery:</strong> {truck.device?.battery.average}%</p>
                  <p><strong>Sensors:</strong> {truck.sensor_summary?.total_sensors}</p>
                  <p><strong>Avg Temp:</strong> {truck.sensor_summary?.avg_temperature}°C</p>
                  <p><strong>Avg Pressure:</strong> {truck.sensor_summary?.avg_pressure} PSI</p>
                  {truck.sensor_summary?.critical_count > 0 && (
                    <p className="critical">
                      ⚠️ {truck.sensor_summary.critical_count} Critical Sensors
                    </p>
                  )}
                  <p className="timestamp">
                    Last Update: {new Date(truck.location.recorded_at).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      <div className="truck-list">
        <h3>Truck Status ({trucks.length})</h3>
        {trucks.map((truck) => (
          <div key={truck.truck_id} className="truck-card">
            <div className="truck-info">
              <span className="plate">{truck.plate_number}</span>
              <span className="model">{truck.model}</span>
            </div>
            <div className="truck-status">
              {truck.location ? (
                <span className="online">● Online</span>
              ) : (
                <span className="offline">● Offline</span>
              )}
              <span className="battery">🔋 {truck.device?.battery.average}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
```

#### 4. Truck History Component (Single Truck Path)

```javascript
// src/components/TruckHistoryMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { trackingService } from '../services/trackingService';

const TruckHistoryMap = ({ truckId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await trackingService.getTruckTracking(truckId, 100);
        if (response.success) {
          setTrackingData(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [truckId]);

  if (loading) return <div>Loading...</div>;
  if (!trackingData) return <div>No data available</div>;

  // Convert location history to polyline coordinates
  const pathCoordinates = trackingData.location_history.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  // Current location
  const currentPos = trackingData.current_location
    ? [trackingData.current_location.latitude, trackingData.current_location.longitude]
    : null;

  return (
    <div className="truck-history-map">
      <div className="history-header">
        <h2>Tracking History - {trackingData.plate_number}</h2>
        <div className="truck-details">
          <p><strong>Model:</strong> {trackingData.model}</p>
          <p><strong>Driver:</strong> {trackingData.driver?.name}</p>
          <p><strong>History Points:</strong> {trackingData.location_history.length}</p>
        </div>
      </div>

      <MapContainer
        center={currentPos || [-3.5, 115.5]}
        zoom={12}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Draw path */}
        <Polyline positions={pathCoordinates} color="blue" weight={3} opacity={0.7} />

        {/* Current location marker */}
        {currentPos && (
          <Marker position={currentPos}>
            <Popup>
              <div>
                <h3>Current Location</h3>
                <p>{trackingData.plate_number}</p>
                <p>{new Date(trackingData.current_location.recorded_at).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* History markers (show every 10th point to avoid clutter) */}
        {trackingData.location_history
          .filter((_, index) => index % 10 === 0)
          .map((loc, index) => (
            <Marker
              key={index}
              position={[loc.latitude, loc.longitude]}
              opacity={0.5}
            >
              <Popup>
                <div>
                  <p>Point {index}</p>
                  <p>{new Date(loc.recorded_at).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      <div className="sensor-data">
        <h3>Sensor Data ({trackingData.sensors.length})</h3>
        <div className="sensor-grid">
          {trackingData.sensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`sensor-card ${sensor.exType}`}
            >
              <div className="sensor-header">
                <span>Tire {sensor.tireNo}</span>
                <span className={`status ${sensor.exType}`}>
                  {sensor.exType === 'critical' && '🔴'}
                  {sensor.exType === 'warning' && '🟡'}
                  {sensor.exType === 'normal' && '🟢'}
                </span>
              </div>
              <div className="sensor-values">
                <p>🌡️ {sensor.tempValue}°C</p>
                <p>💨 {sensor.tirepValue} PSI</p>
                <p>🔋 {sensor.bat}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TruckHistoryMap;
```

---

## 🎨 Styling Example (CSS)

```css
/* src/styles/tracking.css */

.live-tracking-map {
  padding: 20px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.map-header button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.map-header button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.truck-popup h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.truck-popup p {
  margin: 5px 0;
}

.truck-popup .critical {
  color: #dc3545;
  font-weight: bold;
}

.truck-popup .timestamp {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
}

.truck-list {
  margin-top: 20px;
}

.truck-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
}

.truck-card .plate {
  font-weight: bold;
  font-size: 16px;
}

.truck-card .online {
  color: #28a745;
}

.truck-card .offline {
  color: #dc3545;
}

.sensor-card {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
}

.sensor-card.critical {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.sensor-card.warning {
  border-color: #ffc107;
  background-color: #fffdf0;
}

.sensor-card.normal {
  border-color: #28a745;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}
```

---

## 🔄 Real-time Updates (Polling vs WebSocket)

### Option 1: Polling (Simple)

```javascript
// Poll every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchTrucks();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

**Pros:**
- Simple to implement
- Works with any backend
- Easy to debug

**Cons:**
- Not real-time (delay up to 30 seconds)
- More HTTP requests
- Higher bandwidth usage

### Option 2: WebSocket (Real-time)

```javascript
// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';

export const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        // Retry connection
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, isConnected };
};

// Usage in component
const LiveTrackingMap = () => {
  const WS_URL = 'ws://192.168.21.18:3001/ws';
  const { data: wsData, isConnected } = useWebSocket(WS_URL);

  useEffect(() => {
    if (wsData && wsData.type === 'location_update') {
      // Update specific truck location
      updateTruckLocation(wsData.truck);
    }
  }, [wsData]);

  // ... rest of component
};
```

**Pros:**
- Real-time updates (instant)
- Lower bandwidth usage
- Better user experience

**Cons:**
- More complex to implement
- Requires WebSocket support
- Connection management needed

---

## 📊 Data Update Frequency

**Simulator Schedule:**
- GPS Location: Updated every **5 minutes**
- Sensor Data: Updated every **5 minutes**
- Alert Events: Real-time when threshold exceeded

**Recommended Polling Interval:**
- Live Map View: **30 seconds**
- Truck Detail View: **15 seconds**
- History View: **On demand** (no auto-refresh)

---

## 🎯 Best Practices

### 1. Error Handling

```javascript
const fetchTrucks = async () => {
  try {
    const response = await trackingService.getLiveTracking();
    
    if (response.success) {
      setTrucks(response.data.trucks);
    } else {
      // Handle API error
      showErrorNotification(response.message);
    }
  } catch (error) {
    if (error.response) {
      // Server error (4xx, 5xx)
      showErrorNotification(`Error: ${error.response.status}`);
    } else if (error.request) {
      // Network error
      showErrorNotification('Network error. Please check your connection.');
    } else {
      // Other errors
      showErrorNotification('An error occurred.');
    }
  }
};
```

### 2. Loading States

```javascript
{loading && (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>Loading tracking data...</p>
  </div>
)}
```

### 3. Empty States

```javascript
{!loading && trucks.length === 0 && (
  <div className="empty-state">
    <p>No trucks found</p>
    <button onClick={fetchTrucks}>Retry</button>
  </div>
)}
```

### 4. Offline Handling

```javascript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

{!isOnline && (
  <div className="offline-banner">
    ⚠️ You are offline. Data may not be up to date.
  </div>
)}
```

### 5. Performance Optimization

```javascript
// Memoize expensive calculations
const trucksWithAlerts = useMemo(() => {
  return trucks.filter(
    (truck) => truck.sensor_summary?.critical_count > 0
  );
}, [trucks]);

// Debounce search input
const debouncedSearch = useDebounce(searchTerm, 500);
```

---

## 🧪 Testing

### Test dengan cURL

```bash
# Test live tracking
curl http://192.168.21.18:3001/api/trucks/live-tracking

# Test single truck tracking
curl "http://192.168.21.18:3001/api/trucks/1/tracking?limit=50"

# Test dengan token (production)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.21.18:3001/api/trucks/live-tracking
```

### Test dengan Postman

1. **Import Collection:**
   - File: `postman/TPMS.postman_collection.json`

2. **Set Environment Variables:**
   ```
   API_URL = http://192.168.21.18:3001
   TOKEN = (your JWT token)
   ```

3. **Test Endpoints:**
   - `GET {{API_URL}}/api/trucks/live-tracking`
   - `GET {{API_URL}}/api/trucks/1/tracking`

---

## 🐛 Troubleshooting

### Problem: CORS Error

**Error:**
```
Access to fetch at 'http://192.168.21.18:3001/api/trucks/live-tracking' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
Backend sudah configure CORS untuk development. Pastikan:
```env
NODE_ENV=development
```

### Problem: Connection Timeout

**Error:**
```
Failed to fetch: Network request failed
```

**Solution:**
1. Cek server running: `node server.js`
2. Cek firewall: `netsh advfirewall set allprofiles state off`
3. Cek IP benar: `ipconfig | findstr "IPv4"`
4. Test ping: `ping 192.168.21.18`

### Problem: Empty Location Data

**Issue:** Truck ada tapi `location: null`

**Solution:**
Simulator baru generate data setiap 5 menit. Tunggu atau force generate:
```bash
node scripts/live-tracking-simulator.js once
```

---

## 📝 Environment Variables

**Frontend (.env):**
```env
# Development
REACT_APP_API_URL=http://192.168.21.18:3001

# Production
REACT_APP_API_URL=https://be-tpms.connectis.my.id

# WebSocket URL
REACT_APP_WS_URL=ws://192.168.21.18:3001/ws
```

**Backend (.env):**
```env
# Testing Mode - Bypass JWT
TESTING_MODE=true

# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:tpmstrukqaz@localhost:5432/TPMS

# Simulator
AUTO_START_SIMULATOR=true
```

---

## 🚀 Quick Start

### 1. Start Backend

```bash
# Navigate to backend
cd tpms-backend

# Install dependencies
npm install

# Start server
npm run dev
# atau
node server.js
```

### 2. Start Frontend

```bash
# Navigate to frontend
cd tpms-frontend

# Install dependencies
npm install

# Set environment variable
echo "REACT_APP_API_URL=http://192.168.21.18:3001" > .env

# Start development server
npm start
```

### 3. Access Application

```
http://localhost:3000
```

---

## 📚 Additional Resources

- **Backend API Documentation:** `docs/POSTMAN_DOCUMENTATION.md`
- **Testing Guide:** `TESTING_MODE_QUICK_GUIDE.md`
- **Network Troubleshooting:** `NETWORK_TROUBLESHOOTING.md`
- **Location Fix Details:** `LOCATION_TRACKING_FIX.md`

---

## ✅ Checklist Integrasi

- [ ] Backend running di `http://192.168.21.18:3001`
- [ ] TESTING_MODE=true di .env backend
- [ ] Firewall off atau port 3001 allowed
- [ ] Frontend bisa ping ke IP backend
- [ ] Test endpoint `/api/trucks/live-tracking` success
- [ ] Map library installed (Leaflet/MapBox/Google Maps)
- [ ] API client configured dengan correct base URL
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Auto-refresh/polling configured (30s recommended)
- [ ] Sensor data display implemented
- [ ] Alert indicators implemented

---

**Happy Coding! 🚀**

Jika ada masalah atau pertanyaan, silakan check:
- Console browser (F12) untuk error messages
- Network tab untuk API responses
- Backend logs untuk server-side errors

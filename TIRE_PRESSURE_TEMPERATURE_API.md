# 🛞 Tire Pressure & Temperature API Documentation

## 📋 Overview

API ini menyediakan endpoint untuk mengambil data **suhu (temperature)** dan **tekanan ban (tire pressure)** dari sensor TPMS (Tire Pressure Monitoring System) yang terpasang pada truck. Data real-time ini penting untuk monitoring kondisi ban dan mencegah kecelakaan.

**Base URL:** `http://192.168.21.18:3001/api`

**Authentication:** Bearer Token (JWT) - *TESTING_MODE: Currently bypassed*

---

## 📡 Available Endpoints

### 1. Get Live Tracking with Tire Data (Recommended)
### 2. Get Specific Truck Tire Data
### 3. Get Real-time Tire Data by Device SN
### 4. Get Sensor List with Filters

---

## 1️⃣ Get Live Tracking with Tire Data

**Endpoint terbaik untuk monitoring real-time semua truck + data sensor ban.**

### Endpoint
```
GET /api/trucks/live-tracking
```

### Description
Mengambil data **semua truck aktif** dengan lokasi GPS terbaru, data sensor ban (pressure & temperature), status battery, dan informasi driver.

### Headers
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Response Success (200)
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
        "model": "Simulator Dump Truck Model",
        "type": "Dump Truck",
        "status": "active",
        "driver": {
          "id": 1,
          "name": "Simulator Driver 1",
          "phone": "081234567890"
        },
        "device": {
          "id": 1,
          "serial_number": "DEV-SIM01",
          "status": "active",
          "battery": {
            "bat1": 85,
            "bat2": 90,
            "bat3": 88,
            "average": 88
          }
        },
        "location": {
          "latitude": -3.583235,
          "longitude": 115.608048,
          "recorded_at": "2025-12-18T02:48:00.000Z",
          "last_update": "2025-12-18T02:48:01.123Z"
        },
        "sensors": [
          {
            "id": 1,
            "sn": "SENS-SIM01-T01",
            "tireNo": 1,
            "sensorNo": 1,
            "tempValue": 45.2,
            "tirepValue": 95.5,
            "exType": "normal",
            "bat": 95,
            "updated_at": "2025-12-18T02:48:00.000Z"
          },
          {
            "id": 2,
            "sn": "SENS-SIM01-T02",
            "tireNo": 2,
            "sensorNo": 2,
            "tempValue": 89.8,
            "tirepValue": 82.1,
            "exType": "critical",
            "bat": 92,
            "updated_at": "2025-12-18T02:48:00.000Z"
          }
          // ... 8 more sensors (total 10 per truck)
        ],
        "sensor_summary": {
          "total_sensors": 10,
          "avg_temperature": "52.3",
          "avg_pressure": "94.7",
          "critical_count": 1,
          "warning_count": 2
        }
      }
      // ... more trucks
    ],
    "summary": {
      "total_trucks": 5,
      "trucks_with_location": 5,
      "trucks_without_location": 0
    }
  },
  "timestamp": "2025-12-18T02:48:02.123Z"
}
```

### Sensor Data Fields Explanation

| Field | Type | Description | Unit | Example |
|-------|------|-------------|------|---------|
| `id` | Integer | Sensor unique ID | - | `1` |
| `sn` | String | Sensor serial number | - | `"SENS-SIM01-T01"` |
| `tireNo` | Integer | Tire position number (1-10) | - | `1` |
| `sensorNo` | Integer | Sensor number | - | `1` |
| `tempValue` | Float | **Tire temperature** | °C (Celsius) | `45.2` |
| `tirepValue` | Float | **Tire pressure** | PSI | `95.5` |
| `exType` | String | Alert status | - | `"normal"`, `"warning"`, `"critical"` |
| `bat` | Integer | Sensor battery level | % | `95` |
| `updated_at` | DateTime | Last sensor update | ISO 8601 | `"2025-12-18T02:48:00.000Z"` |

### Alert Status (exType)

| Status | Description | Condition |
|--------|-------------|-----------|
| `normal` | Normal operation | Pressure: 80-105 PSI, Temp: < 85°C |
| `warning` | Caution needed | Approaching limits |
| `critical` | **Immediate action required** | Pressure: < 80 or > 105 PSI, Temp: > 85°C |

### Example: Filter Critical Sensors
```javascript
// Get all trucks with critical tire alerts
const response = await fetch('http://192.168.21.18:3001/api/trucks/live-tracking');
const data = await response.json();

data.data.trucks.forEach(truck => {
  const criticalTires = truck.sensors.filter(s => s.exType === 'critical');
  if (criticalTires.length > 0) {
    console.log(`🚨 ${truck.plate_number}: ${criticalTires.length} critical tires!`);
    criticalTires.forEach(tire => {
      console.log(`  Tire ${tire.tireNo}: ${tire.tirepValue} PSI, ${tire.tempValue}°C`);
    });
  }
});
```

---

## 2️⃣ Get Specific Truck Tire Data

**Endpoint untuk mengambil data ban dari satu truck tertentu.**

### Endpoint
```
GET /api/trucks/:id/tires
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | Integer | ✅ Yes | Truck ID | 

### Example Request
```bash
curl -X GET "http://192.168.21.18:3001/api/trucks/1/tires" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Tire pressure data retrieved successfully",
  "data": {
    "truckId": 1,
    "truckNumber": "B 9001 SIM",
    "tirePressures": [
      {
        "position": "Front Left",
        "tireNumber": 1,
        "pressure": 95.5,
        "status": "normal",
        "temperature": 45.2,
        "lastUpdated": "2025-12-18T02:48:00.000Z"
      },
      {
        "position": "Front Right",
        "tireNumber": 2,
        "pressure": 82.1,
        "status": "critical",
        "temperature": 89.8,
        "lastUpdated": "2025-12-18T02:48:00.000Z"
      }
      // ... 8 more tires (total 10)
    ],
    "lastUpdated": "2025-12-18T02:48:02.123Z"
  }
}
```

### Response Error (404)
```json
{
  "success": false,
  "message": "Truck not found"
}
```

### Response Error (400)
```json
{
  "success": false,
  "message": "Invalid truck ID provided"
}
```

---

## 3️⃣ Get Real-time Tire Data by Device SN

**Endpoint untuk mengambil data ban berdasarkan Serial Number device.**

### Endpoint
```
GET /api/iot/realtime/tires/:sn
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sn` | String | ✅ Yes | Device serial number | 

### Example Request
```bash
curl -X GET "http://192.168.21.18:3001/api/iot/realtime/tires/DEV-SIM01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Realtime tire data retrieved successfully",
  "data": {
    "device": {
      "id": 1,
      "sn": "DEV-SIM01",
      "status": "active",
      "truck_id": 1
    },
    "sensors": [
      {
        "id": 1,
        "sn": "SENS-SIM01-T01",
        "tireNo": 1,
        "sensorNo": 1,
        "tempValue": 45.2,
        "tirepValue": 95.5,
        "exType": "normal",
        "bat": 95,
        "updated_at": "2025-12-18T02:48:00.000Z"
      }
      // ... more sensors
    ]
  },
  "timestamp": "2025-12-18T02:48:02.123Z"
}
```

---

## 4️⃣ Get Sensor List with Filters

**Endpoint untuk mengambil daftar sensor dengan filter.**

### Endpoint
```
GET /api/iot/sensors
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | Integer | ❌ No | Page number (default: 1) | `1` |
| `limit` | Integer | ❌ No | Items per page (default: 20) | `20` |
| `device_id` | Integer | ❌ No | Filter by device ID | `1` |
| `truck_id` | Integer | ❌ No | Filter by truck ID | `1` |
| `exType` | String | ❌ No | Filter by alert status | `critical` |
| `sortBy` | String | ❌ No | Sort field | `tempValue` |
| `sortOrder` | String | ❌ No | Sort direction | `desc` |

### Example Request
```bash
# Get all critical sensors sorted by temperature (descending)
curl -X GET "http://192.168.21.18:3001/api/iot/sensors?exType=critical&sortBy=tempValue&sortOrder=desc&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Sensors retrieved successfully",
  "data": [
    {
      "id": 2,
      "sn": "SENS-SIM01-T02",
      "tireNo": 2,
      "sensorNo": 2,
      "tempValue": 89.8,
      "tirepValue": 82.1,
      "exType": "critical",
      "bat": 92,
      "device_id": 1,
      "device": {
        "sn": "DEV-SIM01",
        "truck": {
          "plate": "B 9001 SIM",
          "name": "Simulator Truck SIM01"
        }
      },
      "updated_at": "2025-12-18T02:48:00.000Z"
    }
    // ... more sensors
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## 🔧 Frontend Integration Examples

### React + Axios Implementation

#### 1. Create Service File: `services/tireService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://192.168.21.18:3001/api';

// Create axios instance with default config
const tireAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests (if not in testing mode)
tireAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const tireService = {
  /**
   * Get live tracking data for all trucks with tire sensors
   */
  getLiveTracking: async () => {
    try {
      const response = await tireAPI.get('/trucks/live-tracking');
      return response.data;
    } catch (error) {
      console.error('Error fetching live tracking:', error);
      throw error;
    }
  },

  /**
   * Get tire data for specific truck
   * @param {number} truckId - Truck ID
   */
  getTruckTires: async (truckId) => {
    try {
      const response = await tireAPI.get(`/trucks/${truckId}/tires`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tires for truck ${truckId}:`, error);
      throw error;
    }
  },

  /**
   * Get real-time tire data by device serial number
   * @param {string} deviceSN - Device serial number
   */
  getRealtimeTiresByDevice: async (deviceSN) => {
    try {
      const response = await tireAPI.get(`/iot/realtime/tires/${deviceSN}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tires for device ${deviceSN}:`, error);
      throw error;
    }
  },

  /**
   * Get filtered sensor list
   * @param {Object} filters - Filter parameters
   */
  getSensors: async (filters = {}) => {
    try {
      const response = await tireAPI.get('/iot/sensors', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  },

  /**
   * Get all critical tire sensors across all trucks
   */
  getCriticalTires: async () => {
    try {
      const response = await tireAPI.get('/iot/sensors', {
        params: {
          exType: 'critical',
          sortBy: 'tempValue',
          sortOrder: 'desc',
          limit: 100,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching critical tires:', error);
      throw error;
    }
  },
};

export default tireService;
```

---

#### 2. React Component: `TirePressureMonitor.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import tireService from '../services/tireService';
import './TirePressureMonitor.css';

const TirePressureMonitor = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);

  // Fetch live tracking data
  useEffect(() => {
    fetchLiveData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      const response = await tireService.getLiveTracking();
      setTrucks(response.data.trucks);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tire data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get severity badge color
  const getSeverityClass = (exType) => {
    switch (exType) {
      case 'critical':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      default:
        return 'badge-normal';
    }
  };

  // Get pressure status icon
  const getPressureIcon = (exType) => {
    switch (exType) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '🟢';
    }
  };

  if (loading && trucks.length === 0) {
    return <div className="loading">Loading tire data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="tire-monitor">
      <div className="header">
        <h2>🛞 Tire Pressure & Temperature Monitor</h2>
        <button onClick={fetchLiveData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="summary-cards">
        {trucks.map((truck) => (
          <div
            key={truck.truck_id}
            className={`truck-card ${
              truck.sensor_summary?.critical_count > 0 ? 'critical' : ''
            }`}
            onClick={() => setSelectedTruck(truck)}
          >
            <div className="truck-header">
              <h3>{truck.plate_number}</h3>
              <span className="truck-status">{truck.status}</span>
            </div>

            <div className="truck-info">
              <p className="truck-model">{truck.model}</p>
              {truck.driver && <p className="driver">👤 {truck.driver.name}</p>}
            </div>

            {truck.sensor_summary && (
              <div className="sensor-stats">
                <div className="stat">
                  <span className="label">🌡️ Avg Temp</span>
                  <span className="value">{truck.sensor_summary.avg_temperature}°C</span>
                </div>
                <div className="stat">
                  <span className="label">💨 Avg Pressure</span>
                  <span className="value">{truck.sensor_summary.avg_pressure} PSI</span>
                </div>
                <div className="stat">
                  <span className="label">🔴 Critical</span>
                  <span className="value critical">
                    {truck.sensor_summary.critical_count}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">🟡 Warning</span>
                  <span className="value warning">
                    {truck.sensor_summary.warning_count}
                  </span>
                </div>
              </div>
            )}

            <div className="tire-grid">
              {truck.sensors.slice(0, 10).map((sensor) => (
                <div
                  key={sensor.id}
                  className={`tire-indicator ${getSeverityClass(sensor.exType)}`}
                  title={`Tire ${sensor.tireNo}: ${sensor.tirepValue} PSI, ${sensor.tempValue}°C`}
                >
                  <span className="tire-number">{sensor.tireNo}</span>
                  <span className="tire-icon">{getPressureIcon(sensor.exType)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedTruck && (
        <div className="modal-overlay" onClick={() => setSelectedTruck(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedTruck.plate_number} - Detailed Tire Data
              </h2>
              <button onClick={() => setSelectedTruck(null)} className="close-btn">
                ✕
              </button>
            </div>

            <div className="tire-details">
              {selectedTruck.sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className={`tire-detail-card ${getSeverityClass(sensor.exType)}`}
                >
                  <div className="tire-header">
                    <h3>Tire {sensor.tireNo}</h3>
                    <span className={`badge ${getSeverityClass(sensor.exType)}`}>
                      {sensor.exType}
                    </span>
                  </div>

                  <div className="tire-metrics">
                    <div className="metric">
                      <span className="metric-label">🌡️ Temperature</span>
                      <span className="metric-value">
                        {sensor.tempValue.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">💨 Pressure</span>
                      <span className="metric-value">
                        {sensor.tirepValue.toFixed(1)} PSI
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">🔋 Battery</span>
                      <span className="metric-value">{sensor.bat}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">📡 Sensor</span>
                      <span className="metric-value">{sensor.sn}</span>
                    </div>
                  </div>

                  <div className="tire-footer">
                    <small>
                      Last updated: {new Date(sensor.updated_at).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TirePressureMonitor;
```

---

#### 3. CSS Styling: `TirePressureMonitor.css`

```css
.tire-monitor {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.refresh-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.refresh-btn:hover {
  background: #0056b3;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.truck-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.truck-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.truck-card.critical {
  border-left: 5px solid #dc3545;
}

.truck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.truck-header h3 {
  font-size: 22px;
  color: #333;
  margin: 0;
}

.truck-status {
  padding: 4px 12px;
  background: #28a745;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
}

.truck-info {
  margin-bottom: 20px;
}

.truck-model {
  color: #666;
  font-size: 14px;
  margin: 5px 0;
}

.driver {
  color: #888;
  font-size: 13px;
  margin: 5px 0;
}

.sensor-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 5px;
}

.stat .value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat .value.critical {
  color: #dc3545;
}

.stat .value.warning {
  color: #ffc107;
}

.tire-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.tire-indicator {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.tire-indicator:hover {
  transform: scale(1.1);
}

.tire-indicator.badge-normal {
  border-color: #28a745;
  background: #d4edda;
}

.tire-indicator.badge-warning {
  border-color: #ffc107;
  background: #fff3cd;
}

.tire-indicator.badge-critical {
  border-color: #dc3545;
  background: #f8d7da;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.tire-number {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.tire-icon {
  font-size: 16px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.tire-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.tire-detail-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #ddd;
}

.tire-detail-card.badge-normal {
  border-color: #28a745;
  background: #f8fff9;
}

.tire-detail-card.badge-warning {
  border-color: #ffc107;
  background: #fffef8;
}

.tire-detail-card.badge-critical {
  border-color: #dc3545;
  background: #fff8f8;
}

.tire-detail-card .tire-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tire-detail-card .tire-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.badge.badge-normal {
  background: #28a745;
  color: white;
}

.badge.badge-warning {
  background: #ffc107;
  color: #333;
}

.badge.badge-critical {
  background: #dc3545;
  color: white;
}

.tire-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.tire-footer {
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.tire-footer small {
  color: #888;
  font-size: 11px;
}

.loading,
.error {
  text-align: center;
  padding: 50px;
  font-size: 18px;
}

.error {
  color: #dc3545;
}

/* Responsive Design */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .sensor-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .tire-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .tire-details {
    grid-template-columns: 1fr;
  }
}
```

---

## 📊 Data Visualization Example

### Chart Component: `TirePressureChart.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import tireService from '../services/tireService';

const TirePressureChart = ({ truckId }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchTireData();
  }, [truckId]);

  const fetchTireData = async () => {
    try {
      const response = await tireService.getTruckTires(truckId);
      const tires = response.data.tirePressures;

      setChartData({
        labels: tires.map(t => `Tire ${t.tireNumber}`),
        datasets: [
          {
            label: 'Pressure (PSI)',
            data: tires.map(t => t.pressure),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            yAxisID: 'y',
          },
          {
            label: 'Temperature (°C)',
            data: tires.map(t => t.temperature),
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            yAxisID: 'y1',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Pressure (PSI)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (!chartData) return <div>Loading chart...</div>;

  return <Line data={chartData} options={options} />;
};

export default TirePressureChart;
```

---

## 🚨 Real-time Alert Monitoring

### WebSocket Integration for Live Alerts

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useTireAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io('http://192.168.21.18:3001', {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket for tire alerts');
    });

    // Listen for tire sensor updates
    socket.on('sensor_update', (data) => {
      // Check if critical or warning
      if (data.exType === 'critical' || data.exType === 'warning') {
        setAlerts(prev => [
          {
            id: Date.now(),
            tireNo: data.tireNo,
            truck: data.truck,
            pressure: data.tirepValue,
            temperature: data.tempValue,
            severity: data.exType,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9), // Keep last 10 alerts
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return alerts;
};

export default useTireAlerts;
```

---

## 🧪 Testing Examples

### Test with cURL

```bash
# 1. Get live tracking with tire data
curl -X GET "http://192.168.21.18:3001/api/trucks/live-tracking"

# 2. Get specific truck tires
curl -X GET "http://192.168.21.18:3001/api/trucks/1/tires"

# 3. Get tire data by device SN
curl -X GET "http://192.168.21.18:3001/api/iot/realtime/tires/DEV-SIM01"

# 4. Get critical sensors only
curl -X GET "http://192.168.21.18:3001/api/iot/sensors?exType=critical&limit=20"

# 5. Get sensors for specific truck
curl -X GET "http://192.168.21.18:3001/api/iot/sensors?truck_id=1&limit=10"
```

### Test with PowerShell

```powershell
# Get live tracking
$response = Invoke-RestMethod "http://192.168.21.18:3001/api/trucks/live-tracking"
$response.data.trucks | ForEach-Object {
    Write-Host "$($_.plate_number): $($_.sensor_summary.critical_count) critical tires"
}

# Get critical tires
$critical = Invoke-RestMethod "http://192.168.21.18:3001/api/iot/sensors?exType=critical"
Write-Host "Total critical tires: $($critical.pagination.total)"
```

---

## ⚡ Performance Optimization Tips

### 1. Polling Interval
```javascript
// Recommended intervals based on use case
const POLLING_INTERVALS = {
  critical: 5000,    // 5 seconds for critical monitoring
  normal: 30000,     // 30 seconds for dashboard
  background: 60000  // 1 minute for background updates
};
```

### 2. Data Caching
```javascript
// Cache tire data to reduce API calls
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const getCachedTireData = async (truckId) => {
  const cached = cache.get(truckId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await tireService.getTruckTires(truckId);
  cache.set(truckId, { data, timestamp: Date.now() });
  return data;
};
```

### 3. Filter Only What You Need
```javascript
// Instead of fetching all sensors, filter by truck
const sensors = await tireService.getSensors({
  truck_id: selectedTruckId,
  limit: 10 // Only get 10 sensors per truck
});
```

---

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
   ```javascript
   const API_BASE_URL = process.env.NODE_ENV === 'production'
     ? 'https://api.example.com'
     : 'http://192.168.21.18:3001';
   ```

2. **Store JWT tokens securely**
   ```javascript
   // Use httpOnly cookies or secure localStorage
   const token = localStorage.getItem('token');
   ```

3. **Implement request timeout**
   ```javascript
   tireAPI.defaults.timeout = 10000; // 10 seconds
   ```

4. **Handle token expiration**
   ```javascript
   tireAPI.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         // Redirect to login
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );
   ```

---

## 📝 Error Handling

### Common Error Responses

| Status Code | Error | Description | Solution |
|-------------|-------|-------------|----------|
| 400 | Bad Request | Invalid truck ID | Verify truck ID is valid integer |
| 401 | Unauthorized | Missing/invalid token | Check JWT token |
| 404 | Not Found | Truck/device not found | Verify resource exists |
| 500 | Internal Server Error | Server error | Contact backend team |

### Error Handling Example
```javascript
try {
  const data = await tireService.getTruckTires(truckId);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 404:
        alert('Truck not found');
        break;
      case 401:
        alert('Please login again');
        break;
      default:
        alert('Failed to fetch tire data');
    }
  } else if (error.request) {
    // Request made but no response
    alert('Network error - please check connection');
  } else {
    // Other errors
    alert('Unexpected error occurred');
  }
}
```

---

## 📚 API Response Summary

### Key Response Fields

**Live Tracking Response:**
- `trucks[]` - Array of all trucks
  - `sensors[]` - Array of 10 tire sensors per truck
    - `tempValue` - **Temperature in °C**
    - `tirepValue` - **Pressure in PSI**
    - `exType` - Alert status (normal/warning/critical)
    - `tireNo` - Tire position (1-10)
  - `sensor_summary` - Aggregated statistics
    - `avg_temperature` - Average temp across all tires
    - `avg_pressure` - Average pressure across all tires
    - `critical_count` - Number of critical alerts
    - `warning_count` - Number of warnings

**Truck Tires Response:**
- `tirePressures[]` - Array of tire data
  - `pressure` - **Pressure in PSI**
  - `temperature` - **Temperature in °C**
  - `status` - Status (normal/warning/critical)
  - `tireNumber` - Tire position
  - `position` - Tire position name (e.g., "Front Left")

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies: `npm install axios`
- [ ] Create `services/tireService.js` with API calls
- [ ] Create `TirePressureMonitor.jsx` component
- [ ] Add CSS styling `TirePressureMonitor.css`
- [ ] Test API endpoints with cURL/PowerShell
- [ ] Implement real-time updates (30s interval)
- [ ] Add error handling and loading states
- [ ] Test with different trucks and alert conditions
- [ ] Implement WebSocket for instant alerts (optional)
- [ ] Deploy to production with HTTPS

---

## 📞 Support & Documentation

**Backend Server:** `http://192.168.21.18:3001`  
**WebSocket:** `ws://192.168.21.18:3001/ws`  
**Testing Mode:** JWT authentication currently bypassed  
**Database:** PostgreSQL "TPMS"  
**Total Sensors:** 50 sensors (5 trucks × 10 sensors)

**Related Documentation:**
- Alert Events API: `/docs/ALERT_EVENTS_API.md`
- Live Tracking API: `/docs/LIVE_TRACKING_FRONTEND_INTEGRATION.md`
- IoT API Testing Guide: `/docs/IOT_API_TESTING_GUIDE.md`

---

**Last Updated:** December 18, 2025  
**API Version:** v1.0  
**Status:** ✅ Production Ready

# 🚀 Frontend Integration Guide - December 2025

**Date:** December 19, 2025  
**Backend Version:** 2.0.0  
**Status:** Ready for Production Integration

---

## 📋 Summary of Changes

### Issues Fixed:
1. ✅ **Route Conflict Fixed** - History tracking endpoints now accessible
2. ✅ **Network Configuration** - Backend accessible via mobile hotspot
3. ✅ **Authentication Mode** - TESTING_MODE enabled for development
4. ✅ **Login System** - JWT authentication working properly

### Key Updates:
- Fixed route ordering in `history.js` to prevent 404 errors
- Configured backend for network access from external devices
- Enabled TESTING_MODE for easier frontend development
- All endpoints tested and verified working

---

## 🌐 Network Configuration

### Backend Information:
```
Base URL: http://10.114.197.10:3001
Environment: Development
Network: Mobile Hotspot
Authentication: TESTING_MODE enabled (no token required for now)
```

### Important Notes:
- ⚠️ Backend IP may change if reconnected to different network
- ⚠️ Both laptops must stay connected to same hotspot
- ⚠️ If connection fails, check IP with: `ipconfig`

---

## 🔐 Authentication

### Current Mode: TESTING_MODE = true

**What this means:**
- ✅ All endpoints accessible without JWT token
- ✅ No need to implement token management yet
- ✅ Focus on UI/UX integration first
- ⚠️ Will be disabled in production

### Login Endpoint (for future use):

**Endpoint:**
```
POST http://10.114.197.10:3001/api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@tpms.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Administrator",
      "email": "admin@tpms.com",
      "role": "superadmin"
    }
  }
}
```

**When TESTING_MODE is disabled, use token in headers:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📍 API Endpoints

### Base URL
```
http://10.114.197.10:3001
```

---

## 1️⃣ History Tracking Endpoints (NEW - FIXED)

### Get Truck History
```
GET /api/history/trucks/{id}
```

**Description:** Get location history with tire sensor snapshots

**Parameters:**
- `id` (path) - Truck ID (integer)
- `start_date` (query, optional) - ISO date string
- `end_date` (query, optional) - ISO date string
- `limit` (query, optional) - Number of records (default: 100)

**Example Request:**
```javascript
fetch('http://10.114.197.10:3001/api/history/trucks/1?limit=50')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "truck_id": 1,
  "count": 50,
  "data": [
    {
      "timestamp": "2025-12-19T04:24:56.588Z",
      "location": {
        "lat": -3.600941,
        "lng": 115.484431
      },
      "tire_sensors": [
        {
          "position": "front_left_outer",
          "pressure_psi": 110.5,
          "temperature_celsius": 45.2,
          "status": "normal"
        }
        // ... more tire sensors
      ]
    }
    // ... more history records
  ]
}
```

---

### Get Truck Timeline
```
GET /api/history/trucks/{id}/timeline
```

**Description:** Alias for `/api/history/trucks/{id}` - Same functionality

**Example:**
```javascript
axios.get('http://10.114.197.10:3001/api/history/trucks/1/timeline', {
  params: {
    limit: 20,
    start_date: '2025-12-19T00:00:00Z'
  }
})
.then(response => console.log(response.data));
```

---

### Get Truck Statistics
```
GET /api/history/trucks/{id}/stats
```

**Description:** Get aggregated statistics for each tire (avg, min, max)

**Example Request:**
```javascript
fetch('http://10.114.197.10:3001/api/history/trucks/1/stats')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "truck_id": 1,
  "data": {
    "front_left_outer": {
      "pressure": {
        "avg": 110.5,
        "min": 105.0,
        "max": 115.0
      },
      "temperature": {
        "avg": 45.2,
        "min": 40.0,
        "max": 50.0
      },
      "count": 100
    },
    "front_left_inner": {
      // ... similar structure
    }
    // ... other tire positions
  }
}
```

---

## 2️⃣ Live Tracking Endpoints

### Get All Trucks Live Tracking
```
GET /api/trucks/live-tracking
```

**Description:** Get all trucks with current GPS locations and tire sensors

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/trucks/live-tracking')
  .then(res => res.json())
  .then(data => {
    console.log(`Tracking ${data.data.length} trucks`);
  });
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "truck_id": 1,
      "plate_number": "KH-1234-AB",
      "driver_name": "John Doe",
      "current_location": {
        "lat": -3.600941,
        "lng": 115.484431,
        "timestamp": "2025-12-19T04:30:00Z"
      },
      "tire_sensors": [
        {
          "position": "front_left_outer",
          "pressure_psi": 110.5,
          "temperature_celsius": 45.2,
          "status": "normal"
        }
        // ... more sensors
      ],
      "status": "active"
    }
    // ... more trucks
  ]
}
```

---

### Get Single Truck Tracking
```
GET /api/trucks/{id}/tracking
```

**Description:** Get detailed tracking info for specific truck

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/trucks/1/tracking')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 3️⃣ Alerts Endpoints

### Get Active Alerts
```
GET /api/alerts/active
```

**Description:** Get all currently active alerts (unresolved)

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/alerts/active')
  .then(res => res.json())
  .then(data => {
    console.log(`${data.data.length} active alerts`);
  });
```

**Response:**
```json
{
  "success": true,
  "count": 228,
  "data": [
    {
      "id": 1,
      "truck_id": 1,
      "sensor_id": 5,
      "alert_type": "high_pressure",
      "severity": "warning",
      "message": "Tire pressure above threshold",
      "tire_position": "front_left_outer",
      "value": 120.5,
      "threshold": 115.0,
      "created_at": "2025-12-19T04:00:00Z",
      "is_resolved": false
    }
    // ... more alerts
  ]
}
```

---

### Get All Alerts (with filters)
```
GET /api/alerts
```

**Query Parameters:**
- `truck_id` (optional) - Filter by truck
- `severity` (optional) - Filter by severity: "critical", "warning", "info"
- `is_resolved` (optional) - Filter by status: true/false
- `limit` (optional) - Limit results
- `page` (optional) - Page number

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/alerts?severity=critical&is_resolved=false')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 4️⃣ Trucks Endpoints

### Get All Trucks
```
GET /api/trucks
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/trucks?page=1&limit=20')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "plate_number": "KH-1234-AB",
      "model": "Dump Truck",
      "status": "active",
      "driver": {
        "id": 1,
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### Get Truck Location History
```
GET /api/trucks/{id}/history
```

**Description:** Get GPS location history for specific truck

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `limit` (optional)

**Example:**
```javascript
fetch('http://10.114.197.10:3001/api/trucks/1/history?limit=100')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🎨 Frontend Implementation Examples

### React Example - Fetch History

```javascript
import { useState, useEffect } from 'react';

function TruckHistory({ truckId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(
          `http://10.114.197.10:3001/api/history/trucks/${truckId}?limit=50`
        );
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.data);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [truckId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>History ({history.length} records)</h2>
      {history.map((record, index) => (
        <div key={index}>
          <p>Time: {new Date(record.timestamp).toLocaleString()}</p>
          <p>Location: {record.location.lat}, {record.location.lng}</p>
          <p>Tires: {record.tire_sensors.length} sensors</p>
        </div>
      ))}
    </div>
  );
}

export default TruckHistory;
```

---

### React Example - Live Tracking

```javascript
import { useState, useEffect } from 'react';

function LiveTracking() {
  const [trucks, setTrucks] = useState([]);
  
  useEffect(() => {
    // Fetch live tracking data
    async function fetchLiveData() {
      try {
        const response = await fetch(
          'http://10.114.197.10:3001/api/trucks/live-tracking'
        );
        const data = await response.json();
        
        if (data.success) {
          setTrucks(data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    fetchLiveData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Live Tracking - {trucks.length} Trucks</h2>
      {trucks.map(truck => (
        <div key={truck.truck_id}>
          <h3>{truck.plate_number}</h3>
          <p>Driver: {truck.driver_name}</p>
          <p>Location: {truck.current_location.lat}, {truck.current_location.lng}</p>
          <p>Status: {truck.status}</p>
        </div>
      ))}
    </div>
  );
}

export default LiveTracking;
```

---

### Axios Configuration (Recommended)

```javascript
// src/config/api.js
import axios from 'axios';

const API_BASE_URL = 'http://10.114.197.10:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for future token management
apiClient.interceptors.request.use(
  (config) => {
    // When TESTING_MODE is disabled, add token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Using Axios Client

```javascript
// src/services/truckService.js
import apiClient from '../config/api';

export const truckService = {
  // Get history
  getHistory: (truckId, params = {}) => {
    return apiClient.get(`/api/history/trucks/${truckId}`, { params });
  },

  // Get timeline
  getTimeline: (truckId, params = {}) => {
    return apiClient.get(`/api/history/trucks/${truckId}/timeline`, { params });
  },

  // Get stats
  getStats: (truckId, params = {}) => {
    return apiClient.get(`/api/history/trucks/${truckId}/stats`, { params });
  },

  // Get live tracking
  getLiveTracking: () => {
    return apiClient.get('/api/trucks/live-tracking');
  },

  // Get single truck tracking
  getTruckTracking: (truckId) => {
    return apiClient.get(`/api/trucks/${truckId}/tracking`);
  },

  // Get active alerts
  getActiveAlerts: () => {
    return apiClient.get('/api/alerts/active');
  }
};
```

---

### Usage in Component

```javascript
import { useState, useEffect } from 'react';
import { truckService } from './services/truckService';

function Dashboard() {
  const [trucks, setTrucks] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [trucksData, alertsData] = await Promise.all([
          truckService.getLiveTracking(),
          truckService.getActiveAlerts()
        ]);

        setTrucks(trucksData.data);
        setAlerts(alertsData.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Trucks: {trucks.length}</p>
      <p>Active Alerts: {alerts.length}</p>
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Issue: Connection Timeout

**Symptoms:**
- Frontend cannot connect to backend
- "Network Error" or "ERR_CONNECTION_REFUSED"

**Solutions:**
1. Check both laptops connected to same hotspot
2. Verify backend IP hasn't changed:
   ```bash
   ipconfig | findstr "IPv4"
   ```
3. Check backend is running:
   ```bash
   curl http://10.114.197.10:3001/health
   ```

---

### Issue: 404 Not Found

**Symptoms:**
- Endpoint returns 404 error

**Solutions:**
1. Verify endpoint URL is correct
2. Check route in backend logs
3. Common mistakes:
   - Using `/api/v1/...` instead of `/api/...`
   - Wrong truck ID (use integer, not string)
   - Missing `/trucks/` in history endpoint

**Correct URLs:**
- ✅ `/api/history/trucks/1`
- ❌ `/api/history/1`
- ❌ `/api/v1/history/trucks/1`

---

### Issue: CORS Error

**Symptoms:**
- Browser console shows CORS policy error

**Solutions:**
- Backend already configured for development
- CORS allows all origins in development mode
- If issue persists, check browser console for exact error

---

### Issue: Empty Data

**Symptoms:**
- API returns empty array or null data

**Solutions:**
1. Check if truck ID exists:
   ```javascript
   fetch('http://10.114.197.10:3001/api/trucks')
   ```
2. Verify data exists in database
3. Check date range filters (if used)

---

## 📊 Data Models (TypeScript)

```typescript
// Truck History Record
interface HistoryRecord {
  timestamp: string; // ISO date string
  location: {
    lat: number;
    lng: number;
  };
  tire_sensors: TireSensor[];
}

// Tire Sensor
interface TireSensor {
  position: string; // e.g., "front_left_outer"
  pressure_psi: number;
  temperature_celsius: number;
  status: 'normal' | 'warning' | 'critical';
}

// Live Tracking
interface LiveTracking {
  truck_id: number;
  plate_number: string;
  driver_name: string;
  current_location: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  tire_sensors: TireSensor[];
  status: 'active' | 'inactive' | 'maintenance';
}

// Alert
interface Alert {
  id: number;
  truck_id: number;
  sensor_id: number;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  tire_position: string;
  value: number;
  threshold: number;
  created_at: string;
  is_resolved: boolean;
}

// Tire Statistics
interface TireStats {
  pressure: {
    avg: number;
    min: number;
    max: number;
  };
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  count: number;
}
```

---

## ⚙️ Environment Variables

Create `.env.local` in your frontend project:

```properties
# React / Create React App
REACT_APP_API_URL=http://10.114.197.10:3001

# Vite
VITE_API_URL=http://10.114.197.10:3001

# Next.js
NEXT_PUBLIC_API_URL=http://10.114.197.10:3001
```

**Usage:**
```javascript
// React/CRA
const API_URL = process.env.REACT_APP_API_URL;

// Vite
const API_URL = import.meta.env.VITE_API_URL;

// Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

---

## 🚦 Testing Checklist

Before starting frontend development:

- [ ] Can access backend health check: `http://10.114.197.10:3001/health`
- [ ] Can fetch truck list: `/api/trucks`
- [ ] Can fetch history: `/api/history/trucks/1`
- [ ] Can fetch live tracking: `/api/trucks/live-tracking`
- [ ] Can fetch alerts: `/api/alerts/active`
- [ ] Both laptops on same network
- [ ] Backend logs show incoming requests
- [ ] No CORS errors in browser console

---

## 📝 Quick Reference

### All Available Endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/login` | POST | Login |
| `/api/trucks` | GET | List all trucks |
| `/api/trucks/live-tracking` | GET | Live tracking all trucks |
| `/api/trucks/{id}` | GET | Get truck details |
| `/api/trucks/{id}/tracking` | GET | Single truck tracking |
| `/api/trucks/{id}/history` | GET | Truck location history |
| `/api/history/trucks/{id}` | GET | History with sensors |
| `/api/history/trucks/{id}/timeline` | GET | Timeline (alias) |
| `/api/history/trucks/{id}/stats` | GET | Tire statistics |
| `/api/alerts` | GET | All alerts |
| `/api/alerts/active` | GET | Active alerts only |

---

## 🎯 Next Steps

1. **Development Phase:**
   - ✅ TESTING_MODE enabled
   - ✅ No token required
   - ✅ Focus on UI/UX
   - ✅ Test all endpoints

2. **Before Production:**
   - [ ] Disable TESTING_MODE
   - [ ] Implement JWT token management
   - [ ] Add error handling
   - [ ] Add loading states
   - [ ] Test with real authentication

3. **Production Deployment:**
   - [ ] Update API_URL to production domain
   - [ ] Enable HTTPS
   - [ ] Implement token refresh
   - [ ] Add proper error messages

---

## 📞 Support

**Backend Developer:** Rendhi  
**Backend Status:** Running  
**Last Updated:** December 19, 2025

**If issues occur:**
1. Check backend logs
2. Verify network connection
3. Test endpoints with curl/Postman first
4. Check browser console for errors

---

## ✅ Summary

**What's Working:**
- ✅ All 10 endpoints tested and verified
- ✅ History tracking fixed (404 → 200)
- ✅ Live tracking operational
- ✅ Alerts system working (228 active alerts)
- ✅ Network access configured
- ✅ TESTING_MODE enabled for easy development

**Backend Configuration:**
- Base URL: `http://10.114.197.10:3001`
- TESTING_MODE: `true`
- Authentication: Not required (for now)
- CORS: Enabled for all origins (dev)

**Ready for Integration:** ✅

---

**Happy Coding! 🚀**

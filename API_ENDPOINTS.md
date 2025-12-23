# 📡 TPMS API Endpoints Documentation

**Version:** 2.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Last Updated:** December 18, 2025

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Trucks](#trucks)
3. [Sensors](#sensors)
4. [IoT Data](#iot-data)
5. [Location Tracking](#location-tracking)
6. [History & Analytics](#history--analytics) ⭐ **NEW**
7. [Alerts](#alerts)
8. [Drivers](#drivers)
9. [Vendors](#vendors)

---

## 🔐 Authentication

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

## 🚛 Trucks

### Get All Trucks
```
GET /trucks
```

### Get Truck by ID
```
GET /trucks/:id
```

### Create Truck
```
POST /trucks
```

### Update Truck
```
PUT /trucks/:id
```

### Delete Truck
```
DELETE /trucks/:id
```

---

## 📊 Sensors

### Get All Sensors
```
GET /sensors
```

### Get Sensor by Device
```
GET /sensors/device/:deviceId
```

### Update Sensor
```
PUT /sensors/:id
```

---

## 🌐 IoT Data

### Receive IoT Data
```
POST /iot/data
```

**Description:** Endpoint untuk menerima data dari IoT device (GPS, battery, sensor readings)

**Request Body:**
```json
{
  "sn": "DEV001",
  "lat": -3.5,
  "lng": 115.5,
  "bat1": 85,
  "bat2": 90,
  "bat3": 88,
  "lock": 0,
  "sensor": [
    {
      "sn": "SENS001",
      "tempValue": 65.5,
      "tirepValue": 95.2,
      "exType": "normal",
      "bat": 85
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data received and processed",
  "data": {
    "device": {
      "id": 1,
      "sn": "DEV001",
      "bat1": 85,
      "bat2": 90,
      "bat3": 88
    },
    "location": {
      "id": 1234,
      "lat": -3.5,
      "lng": 115.5,
      "recorded_at": "2025-12-18T07:30:00.000Z"
    },
    "sensors_updated": 10,
    "sensor_history_created": 10
  }
}
```

**Notes:**
- Otomatis create location record
- Otomatis update sensor values
- Otomatis create sensor_history snapshot (10 records)
- Trigger alert checking

---

## 📍 Location Tracking

### Get Latest Location
```
GET /locations/truck/:truckId/latest
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "lat": -3.5,
    "lng": 115.5,
    "recorded_at": "2025-12-18T07:30:00.000Z",
    "device": {
      "sn": "DEV001",
      "truck": {
        "plate": "B 9001 SIM"
      }
    }
  }
}
```

### Get Location History
```
GET /locations/truck/:truckId
```

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): Number of records (default: 100)

---

## ⭐ History & Analytics (NEW)

### Get Truck History with Sensor Data
```
GET /history/trucks/:truckId
```

**Description:**  
Mendapatkan timeline lokasi truck dengan snapshot data sensor di setiap lokasi.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | string (ISO 8601) | No | Filter from date | `2025-12-18T00:00:00Z` |
| `endDate` | string (ISO 8601) | No | Filter to date | `2025-12-18T23:59:59Z` |
| `limit` | integer | No | Max locations (default: 100) | `50` |

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/history/trucks/1?startDate=2025-12-18T00:00:00Z&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-12-18T07:31:12.097Z",
      "location": {
        "lat": -3.429668,
        "lng": 115.559287
      },
      "tires": [
        {
          "tireNo": 1,
          "position": "Front Left Outer",
          "temperature": 55.49,
          "pressure": 92.08,
          "status": "normal",
          "battery": 99,
          "timestamp": "2025-12-18T07:31:12.097Z"
        },
        {
          "tireNo": 2,
          "position": "Front Left Inner",
          "temperature": 32.87,
          "pressure": 93.74,
          "status": "normal",
          "battery": 97,
          "timestamp": "2025-12-18T07:31:12.097Z"
        }
        // ... 8 more tires
      ]
    }
    // ... more locations
  ],
  "meta": {
    "truckId": 1,
    "truckPlate": "B 9001 SIM",
    "totalLocations": 50,
    "dateRange": {
      "start": "2025-12-18T00:00:00.000Z",
      "end": "2025-12-18T23:59:59.999Z"
    }
  }
}
```

**Use Cases:**
- Timeline view dengan kondisi ban di setiap lokasi
- Playback perjalanan truck
- Historical analysis
- Alert investigation

---

### Get Sensor Statistics
```
GET /history/trucks/:truckId/stats
```

**Description:**  
Mendapatkan statistik agregat (avg, min, max) dari sensor data dalam periode tertentu.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string (ISO 8601) | No | Filter from date |
| `endDate` | string (ISO 8601) | No | Filter to date |
| `tireNo` | integer (1-10) | No | Filter for specific tire |

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/history/trucks/1/stats?startDate=2025-12-18T00:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "truck": {
      "id": 1,
      "plate": "B 9001 SIM"
    },
    "period": {
      "start": "2025-12-18T00:00:00.000Z",
      "end": "2025-12-18T23:59:59.999Z",
      "totalReadings": 288
    },
    "tires": [
      {
        "tireNo": 1,
        "position": "Front Left Outer",
        "temperature": {
          "avg": 58.34,
          "min": 45.2,
          "max": 72.5,
          "unit": "°C"
        },
        "pressure": {
          "avg": 95.67,
          "min": 88.3,
          "max": 102.4,
          "unit": "PSI"
        },
        "alerts": {
          "critical": 2,
          "warning": 5
        }
      }
      // ... 9 more tires
    ]
  }
}
```

**Use Cases:**
- Dashboard analytics
- Performance monitoring
- Maintenance planning
- Trend analysis

---

## 🚨 Alerts

### Get All Alerts
```
GET /alerts
```

### Get Alert Events
```
GET /alert-events
```

**Query Parameters:**
- `truckId` (optional)
- `status` (optional): active, resolved
- `severity` (optional): normal, warning, critical
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "alert_id": 5,
      "truck_id": 1,
      "sensor_id": 10,
      "value": 125.5,
      "message": "High tire pressure detected on Tire 1",
      "status": "active",
      "created_at": "2025-12-18T07:30:00.000Z",
      "alert": {
        "code": "HIGH_PRESSURE",
        "name": "High Tire Pressure",
        "severity": "warning"
      },
      "truck": {
        "plate": "B 9001 SIM"
      },
      "sensor": {
        "tireNo": 1,
        "sn": "SENS001"
      }
    }
  ]
}
```

### Resolve Alert
```
PUT /alert-events/:id/resolve
```

---

## 👨‍✈️ Drivers

### Get All Drivers
```
GET /drivers
```

### Get Driver by ID
```
GET /drivers/:id
```

### Create Driver
```
POST /drivers
```

### Update Driver
```
PUT /drivers/:id
```

### Delete Driver
```
DELETE /drivers/:id
```

---

## 🏢 Vendors

### Get All Vendors
```
GET /vendors
```

### Get Vendor by ID
```
GET /vendors/:id
```

### Create Vendor
```
POST /vendors
```

### Update Vendor
```
PUT /vendors/:id
```

### Delete Vendor
```
DELETE /vendors/:id
```

---

## 🔄 Data Flow - IoT to History

```
IoT Device sends GPS + Sensor Data
        ↓
POST /api/v1/iot/data
        ↓
Backend Transaction:
  1. Update device (bat1, bat2, bat3)
  2. Create location record
  3. Update all sensor values
  4. Create sensor_history snapshots (10 records)
  5. Check & create alerts
        ↓
Database Updated:
  - device (1 update)
  - location (1 insert)
  - sensor (10 updates)
  - sensor_history (10 inserts)
  - alert_events (0-N inserts)
        ↓
Frontend can query:
  - GET /history/trucks/:id → Timeline with tire data
  - GET /history/trucks/:id/stats → Statistics
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... } // optional
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... } // optional
  }
}
```

---

## 🔑 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Notes

1. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
2. **Pagination**: Use `limit` parameter for large datasets
3. **Rate Limiting**: API has rate limiting (to be implemented)
4. **WebSocket**: Real-time updates available via WebSocket on port 3001
5. **Sensor History**: Only available for locations created after Dec 18, 2025

---

## 🔗 Related Documentation

- [Frontend Integration Guide](./docs/FRONTEND_SENSOR_LOCATION_HISTORY_GUIDE.md)
- [Sensor History Implementation](./docs/SENSOR_HISTORY_IMPLEMENTATION.md)
- [Live Tracking API](./docs/LIVE_TRACKING_API.md)
- [Alert System Documentation](./docs/ALERT_API_DOCUMENTATION.md)

---

**For support, contact the backend team or refer to the documentation in `/docs` folder.**

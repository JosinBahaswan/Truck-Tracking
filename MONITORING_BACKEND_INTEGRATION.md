# 🔄 Monitoring Pages Backend Integration

**Date:** December 22, 2025  
**Status:** ✅ Completed

## 📝 Summary

Halaman **Temperature Monitoring** dan **Tire Pressure Monitoring** sudah diintegrasikan dengan backend real menggunakan API endpoint `/api/trucks/live-tracking`.

---

## 🆕 Changes Made

### 1. **New API Service Created**

**File:** `src/services/tracking/monitoring.api.js`

Functions:
- ✅ `getTemperatureMonitoring()` - Mengambil data temperature sensors dari semua truck
- ✅ `getTirePressureMonitoring()` - Mengambil data tire pressure sensors dari semua truck
- ✅ `getTruckSensors(truckId)` - Mengambil data sensor spesifik truck

### 2. **Updated Pages**

#### Temperature Monitoring (`src/pages/monitoring/TemperatureMonitoring.jsx`)
**Before:**
- Menggunakan `trucksApi.getAll()` dari management API
- Data dummy/mock dari backend management

**After:**
- ✅ Menggunakan `monitoringAPI.getTemperatureMonitoring()`
- ✅ Data real-time dari `/api/trucks/live-tracking`
- ✅ Auto-refresh setiap 30 detik
- ✅ Tampilan simplified: No | Truck | Sensor | Temp | Status

#### Tire Pressure Monitoring (`src/pages/monitoring/TirePressureMonitoring.jsx`)
**Before:**
- Menggunakan `trucksApi.getAll()` dari management API
- Status dihitung manual di frontend

**After:**
- ✅ Menggunakan `monitoringAPI.getTirePressureMonitoring()`
- ✅ Data real-time dari `/api/trucks/live-tracking`
- ✅ Status sudah dikalkulasi di backend
- ✅ Auto-refresh setiap 30 detik
- ✅ Tampilan simplified: No | Truck | Serial Number | Pressure | Temperature | Status

---

## 🔗 API Endpoint Used

### Base Endpoint
```
GET http://10.145.139.10:3001/api/trucks/live-tracking
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "truck_id": 1,
        "plate_number": "B 9001 SIM",
        "truck_name": "Simulator Truck",
        "sensors": [
          {
            "id": 1,
            "sn": "SENS-SIM01-T01",
            "tireNo": 1,
            "tempValue": 45.2,
            "tirepValue": 95.5,
            "exType": "normal",
            "bat": 95,
            "updated_at": "2025-12-22T..."
          }
        ]
      }
    ]
  }
}
```

### Data Transformation

**Temperature Monitoring:**
```javascript
{
  id: "1-sensor1",
  truckCode: "B 9001 SIM",
  truckName: "Simulator Truck",
  sensorId: "SENS-SIM01-T01",
  temperature: 45.2,
  status: "normal",
  timestamp: "2025-12-22..."
}
```

**Tire Pressure Monitoring:**
```javascript
{
  id: "1-sensor1",
  truckCode: "B 9001 SIM",
  truckName: "Simulator Truck",
  serialNumber: "SENS-SIM01-T01",
  pressure: 95.5,
  temperature: 45.2,
  status: "Normal",
  timestamp: "2025-12-22..."
}
```

---

## ⚙️ Configuration

Backend URL configured in `.env`:
```env
VITE_TRACKING_API_BASE_URL=http://10.145.139.10:3001
```

---

## 🚀 Features

### Temperature Monitoring
- ✅ Real-time temperature data dari semua truck
- ✅ Color-coded temperature values (red/yellow/green)
- ✅ Status badges (Normal/Warning/Critical)
- ✅ Auto-refresh every 30 seconds
- ✅ Search & filter by truck and status
- ✅ Pagination support
- ✅ Stats cards (Total/Normal/Warning/Critical)

### Tire Pressure Monitoring
- ✅ Real-time tire pressure & temperature
- ✅ Color-coded pressure & temperature values
- ✅ Status badges (Normal/High Pressure/Low Pressure/High Temp/Low Battery/Lost)
- ✅ Auto-refresh every 30 seconds
- ✅ Search & filter by truck and status
- ✅ Pagination support
- ✅ Stats cards (Total/Normal/Warning/Critical)

---

## 📊 Display Columns

### Temperature Monitoring Table
| Column | Description |
|--------|-------------|
| No | Row number |
| Truck | Truck code + name |
| Sensor | Sensor ID/Serial Number |
| Temperature | Temperature value with color coding |
| Status | Status badge |

### Tire Pressure Monitoring Table
| Column | Description |
|--------|-------------|
| No | Row number |
| Truck | Truck code + name |
| Serial Number | Sensor serial number |
| Pressure | Pressure value (PSI) with color coding |
| Temperature | Temperature value (°C) with color coding |
| Status | Status badge |

---

## 🔄 Auto-Refresh

Both pages auto-refresh every **30 seconds** untuk mendapatkan data terbaru dari backend.

---

## ✅ Testing Checklist

- [x] API service created and exported
- [x] Temperature monitoring menggunakan API baru
- [x] Tire pressure monitoring menggunakan API baru
- [x] Data loading dengan loading state
- [x] Error handling untuk API failures
- [x] Auto-refresh functionality
- [x] Search & filter working
- [x] Pagination working
- [x] Stats calculation correct
- [x] Status badges with correct colors
- [x] Temperature/pressure color coding

---

## 🎯 Next Steps (Optional Enhancements)

1. **WebSocket Integration** - Real-time updates tanpa polling
2. **Export to Excel/PDF** - Download functionality
3. **Historical Data** - Graph/chart untuk trend analysis
4. **Alert Notifications** - Toast/notification untuk critical status
5. **Detailed View Modal** - Click sensor untuk lihat detail lengkap

---

## 📝 Notes

- Backend endpoint: `http://10.145.139.10:3001/api/trucks/live-tracking`
- Data refresh interval: 30 seconds
- Timeout: 30 seconds
- Authentication: JWT token from localStorage (`authToken`)

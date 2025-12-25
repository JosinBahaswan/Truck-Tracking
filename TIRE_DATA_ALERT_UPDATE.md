# 🔄 Tire Data & Alert System Update - December 2025

## 📋 Overview

Update sistem alert TPMS untuk menghasilkan data yang lebih realistis sesuai dengan standar operasional truk tambang:
- **Alert Frequency**: Dikurangi dari 5% menjadi **1%**
- **Normal Data**: Meningkat menjadi **99%** (lebih banyak kondisi normal)
- **Thresholds**: Disesuaikan dengan standar mining truck industry

---

## 🎯 Perubahan Konfigurasi Alert

### **Alert Configuration (SEBELUM)**
```javascript
ALERT_CONFIG: {
  MAX_TRUCKS_WITH_ALERTS: 2,           // Max 2 trucks with alerts
  SENSOR_ANOMALY_PROBABILITY: 0.05,    // 5% alert frequency
}
```

### **Alert Configuration (SESUDAH)** ✅
```javascript
ALERT_CONFIG: {
  MAX_TRUCKS_WITH_ALERTS: 1,           // Max 1 truck with alerts
  SENSOR_ANOMALY_PROBABILITY: 0.01,    // 1% alert frequency ⬇️ 5x lebih jarang
}
```

**Impact**: Alert hanya muncul pada ~1% dari total sensor readings (sangat jarang, lebih realistis)

---

## 📊 Perubahan Threshold & Data Ranges

### **1. Temperature Thresholds**

#### **SEBELUM:**
```javascript
Normal Range:     55-79°C
Warning Temp:     > 80°C
Critical Temp:    > 90°C
```

#### **SESUDAH:** ✅
```javascript
Normal Range:     60-84°C    // ⬆️ Lebih lebar, sesuai mining truck standards
Warning Temp:     ≥ 85°C     // ⬆️ Threshold naik
Critical Temp:    ≥ 100°C    // ⬆️ Threshold naik (lebih realistis)

Anomaly Ranges:
├─ Warning:  85-95°C
└─ Critical: 100-105°C
```

**Mining Truck Standards:**
- Normal operational: **60-84°C** ✅
- Warning range: **85-99°C** (elevated but manageable)
- Critical: **≥100°C** (requires immediate action)

---

### **2. Pressure Thresholds**

#### **SEBELUM:**
```javascript
Normal Range:         90-105 PSI
Critical Low:         < 85 PSI
Critical High:        > 110 PSI
```

#### **SESUDAH:** ✅
```javascript
Normal Range:         100-119 PSI    // ⬆️ Lebih tinggi, sesuai mining truck
Critical Low:         < 90 PSI       // ⬇️ Threshold turun
Critical High:        ≥ 120 PSI      // ⬆️ Threshold naik

Anomaly Ranges:
├─ Low Pressure:  85-89 PSI
└─ High Pressure: 120-125 PSI
```

**Mining Truck Standards:**
- Optimal pressure: **100-120 PSI** ✅
- Low critical: **<90 PSI** (underinflation risk)
- High critical: **≥120 PSI** (overinflation risk)

---

### **3. Base Value Initialization**

#### **SEBELUM:**
```javascript
baseTemp:     60-75°C
basePressure: 95-105 PSI
```

#### **SESUDAH:** ✅
```javascript
baseTemp:     65-80°C       // ⬆️ Range lebih tinggi
basePressure: 105-115 PSI   // ⬆️ Range lebih tinggi & optimal
```

---

## 📡 API Response Format (Tidak Berubah)

Data format yang dikirim ke frontend **tetap sama**, hanya nilai-nilai data yang berubah:

### **WebSocket Message: `truck_locations_update`**

```json
{
  "type": "truck_locations_update",
  "timestamp": "2025-12-23T13:40:00.000Z",
  "trucks": [
    {
      "id": 1,
      "truck_id": "B 9001 SIM",
      "location": {
        "lat": -3.681035,
        "lng": 115.622797
      },
      "sensors": [
        {
          "id": 1,
          "tireNo": 1,
          "sensorNo": "SN-001",
          "temp": 72.3,           // ✅ Normal range (60-84°C)
          "pressure": 108.5,      // ✅ Normal range (100-119 PSI)
          "exType": "normal",     // ✅ 99% data akan "normal"
          "battery": 85,
          "timestamp": "2025-12-23T13:40:00.000Z"
        },
        {
          "id": 2,
          "tireNo": 2,
          "sensorNo": "SN-002",
          "temp": 67.8,           // ✅ Normal
          "pressure": 112.3,      // ✅ Normal
          "exType": "normal",
          "battery": 82,
          "timestamp": "2025-12-23T13:40:00.000Z"
        }
      ],
      "alerts": []  // ✅ Kebanyakan truck tidak punya alert (99%)
    }
  ]
}
```

### **Contoh Data dengan Alert (1% kasus):**

```json
{
  "type": "truck_locations_update",
  "timestamp": "2025-12-23T13:40:03.000Z",
  "trucks": [
    {
      "id": 2,
      "truck_id": "B 9002 SIM",
      "location": {
        "lat": -3.464300,
        "lng": 115.555239
      },
      "sensors": [
        {
          "id": 11,
          "tireNo": 1,
          "sensorNo": "SN-011",
          "temp": 71.2,
          "pressure": 110.5,
          "exType": "normal",
          "battery": 88,
          "timestamp": "2025-12-23T13:40:03.000Z"
        },
        {
          "id": 19,
          "tireNo": 9,
          "sensorNo": "SN-019",
          "temp": 73.5,
          "pressure": 87.0,        // ⚠️ Critical Low (< 90 PSI)
          "exType": "critical",    // ⚠️ Alert!
          "battery": 75,
          "timestamp": "2025-12-23T13:40:03.000Z"
        }
      ],
      "alerts": [
        {
          "id": 123,
          "type": "low_pressure",
          "severity": "critical",
          "message": "Critical Low Pressure: Tire 9 pressure 87.0 PSI",
          "sensorId": 19,
          "tireNo": 9,
          "value": 87.0,
          "threshold": 90,
          "timestamp": "2025-12-23T13:40:03.000Z",
          "status": "active"
        }
      ]
    }
  ]
}
```

---

## 🎨 Frontend Integration Changes

### **1. Data Classification Update**

Frontend perlu update logic untuk menampilkan status berdasarkan threshold baru:

```javascript
// ❌ OLD THRESHOLDS (SEBELUM)
const getTemperatureStatus = (temp) => {
  if (temp > 90) return 'critical';
  if (temp > 80) return 'warning';
  return 'normal';
};

const getPressureStatus = (pressure) => {
  if (pressure < 85 || pressure > 110) return 'critical';
  return 'normal';
};
```

```javascript
// ✅ NEW THRESHOLDS (UPDATE INI)
const getTemperatureStatus = (temp) => {
  if (temp >= 100) return 'critical';  // ⬆️ Naik dari 90°C
  if (temp >= 85) return 'warning';    // ⬆️ Naik dari 80°C
  return 'normal';
};

const getPressureStatus = (pressure) => {
  if (pressure < 90) return 'critical-low';     // ⬇️ Turun dari 85 PSI
  if (pressure >= 120) return 'critical-high';  // ⬆️ Naik dari 110 PSI
  return 'normal';
};
```

### **2. Gauge/Chart Display Ranges**

Update range display untuk temperature & pressure gauges:

```javascript
// ❌ OLD RANGES
const temperatureGaugeConfig = {
  min: 50,
  max: 110,
  zones: [
    { from: 50, to: 79, color: 'green' },   // Normal
    { from: 80, to: 90, color: 'yellow' },  // Warning
    { from: 91, to: 110, color: 'red' }     // Critical
  ]
};

const pressureGaugeConfig = {
  min: 70,
  max: 130,
  zones: [
    { from: 70, to: 84, color: 'red' },     // Critical Low
    { from: 85, to: 110, color: 'green' },  // Normal
    { from: 111, to: 130, color: 'red' }    // Critical High
  ]
};
```

```javascript
// ✅ NEW RANGES (UPDATE INI)
const temperatureGaugeConfig = {
  min: 50,
  max: 120,
  zones: [
    { from: 50, to: 84, color: 'green' },    // Normal (60-84°C)
    { from: 85, to: 99, color: 'yellow' },   // Warning (85-99°C)
    { from: 100, to: 120, color: 'red' }     // Critical (≥100°C)
  ],
  thresholds: {
    normal: 84,
    warning: 85,
    critical: 100
  }
};

const pressureGaugeConfig = {
  min: 70,
  max: 140,
  zones: [
    { from: 70, to: 89, color: 'red' },      // Critical Low (<90 PSI)
    { from: 90, to: 119, color: 'green' },   // Normal (100-119 PSI)
    { from: 120, to: 140, color: 'red' }     // Critical High (≥120 PSI)
  ],
  thresholds: {
    criticalLow: 90,
    normalMin: 100,
    normalMax: 119,
    criticalHigh: 120
  }
};
```

### **3. Alert Badge Colors**

```javascript
// Sama seperti sebelumnya, tapi alert akan jauh lebih jarang muncul
const getAlertBadgeColor = (exType) => {
  switch(exType) {
    case 'critical': return 'red';
    case 'warning': return 'orange';
    case 'normal': return 'green';    // ✅ 99% data akan hijau
    default: return 'gray';
  }
};
```

---

## 📈 Expected Data Distribution

### **SEBELUM (5% Alert Frequency):**
```
100 sensor readings:
├─ Normal:   95 sensors (95%)
└─ Anomaly:   5 sensors (5%)
   ├─ Critical temp:    1-2 sensors
   ├─ Warning temp:     1-2 sensors
   └─ Pressure issues:  1-2 sensors
```

### **SESUDAH (1% Alert Frequency):** ✅
```
100 sensor readings:
├─ Normal:   99 sensors (99%) ✅ Mayoritas
└─ Anomaly:   1 sensor (1%)   ✅ Sangat jarang
   ├─ Critical temp ≥100°C:  ~0.25%
   ├─ Warning temp ≥85°C:    ~0.25%
   ├─ Low pressure <90:      ~0.25%
   └─ High pressure ≥120:    ~0.25%
```

**Per Truck (10 sensors):**
- Probability truck punya alert: ~10% per cycle (1 dari 10 trucks)
- Max trucks dengan alert bersamaan: **1 truck**
- Kebanyakan waktu: **Semua truck normal** ✅

---

## 🧪 Testing & Validation

### **Test Scenarios:**

#### **1. Normal Operations (99% kasus)**
```bash
# Run server dan observe selama 1 menit
node server.js

Expected Output:
📊 Generated data for 6 trucks at XX:XX:XX
   ✅ B 9001 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9002 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9003 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9004 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9005 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ g543: (-3.xxx, 115.xxx) - 1 sensors

# Kebanyakan cycles TIDAK ADA alert ✅
```

#### **2. Alert Generated (1% kasus)**
```bash
📊 Generated data for 6 trucks at XX:XX:XX
   🚨 B 9002 SIM: Generated 1 alert(s)
      ⚠️  Critical Low Pressure: Tire 9 pressure 87.0 PSI
   
   ⚠️  Anomaly Summary: 1 truck(s) with alerts this cycle
   ✅ B 9001 SIM: (-3.xxx, 115.xxx) - 10 sensors
   🚨 B 9002 SIM: (-3.xxx, 115.xxx) - 10 sensors, 1 alerts
   ✅ B 9003 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9004 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ B 9005 SIM: (-3.xxx, 115.xxx) - 10 sensors
   ✅ g543: (-3.xxx, 115.xxx) - 1 sensors
```

### **Validation Checklist:**

- [x] Alert frequency ~1% (observasi 100 cycles)
- [x] Normal data 99% (semua sensor dalam range normal)
- [x] Temperature normal: 60-84°C
- [x] Temperature warning: 85-99°C
- [x] Temperature critical: ≥100°C
- [x] Pressure normal: 100-119 PSI
- [x] Pressure critical low: <90 PSI
- [x] Pressure critical high: ≥120 PSI
- [x] Max 1 truck dengan alert per cycle
- [x] Alert messages sesuai dengan threshold baru

---

## 🔍 Troubleshooting

### **Issue: Terlalu banyak alert muncul**

**Check:**
```javascript
// File: scripts/realistic-live-simulator.js
// Line ~30-34

ALERT_CONFIG: {
  MAX_TRUCKS_WITH_ALERTS: 1,           // ✅ Harus 1
  TRUCK_ANOMALY_PROBABILITY: 0.15,
  SENSOR_ANOMALY_PROBABILITY: 0.01,    // ✅ Harus 0.01 (1%)
}
```

### **Issue: Frontend masih show warning/critical di normal range**

**Update frontend thresholds:**
```javascript
// Temperature
if (temp >= 100) return 'critical';  // NOT > 90
if (temp >= 85) return 'warning';    // NOT > 80

// Pressure
if (pressure < 90) return 'critical';   // NOT < 85
if (pressure >= 120) return 'critical'; // NOT > 110
```

### **Issue: Gauge colors tidak sesuai**

**Update gauge zones:**
- Normal temp: 60-84°C (green)
- Warning temp: 85-99°C (yellow)
- Critical temp: ≥100°C (red)
- Normal pressure: 100-119 PSI (green)
- Critical low: <90 PSI (red)
- Critical high: ≥120 PSI (red)

---

## 📚 Additional Resources

### **Related Documentation:**
- `WEBSOCKET_INTEGRATION_GUIDE.md` - WebSocket implementation guide
- `API_ENDPOINTS.md` - Complete API reference
- `TESTING_GUIDE.md` - Testing procedures

### **Code Files Modified:**
- `scripts/realistic-live-simulator.js` - Main simulator with new thresholds
- Configuration changes:
  - Alert probability: 5% → 1%
  - Temperature thresholds updated
  - Pressure thresholds updated
  - Normal ranges widened

### **Database Impact:**
- ✅ **No schema changes required**
- ✅ **No migration needed**
- ✅ Only runtime data values changed

---

## 🎯 Summary

### **Key Changes:**
1. ✅ Alert frequency: **5% → 1%** (5x lebih jarang)
2. ✅ Normal data: **95% → 99%** (lebih banyak data normal)
3. ✅ Temperature thresholds: **Naik** (lebih realistis untuk mining truck)
4. ✅ Pressure thresholds: **Disesuaikan** (100-120 PSI optimal)
5. ✅ Alert message: **Updated** dengan threshold baru

### **Frontend Action Required:**
- ⚠️ Update threshold constants
- ⚠️ Update gauge configurations
- ⚠️ Update status classification logic
- ⚠️ Test with live WebSocket data

### **Backend Status:**
- ✅ **Already implemented** (December 23, 2025)
- ✅ Server running with new configuration
- ✅ WebSocket broadcasting updated data
- ✅ No breaking changes to API format

---

**Last Updated**: December 23, 2025  
**Version**: 2.0 (1% Alert Frequency)  
**Status**: ✅ Production Ready

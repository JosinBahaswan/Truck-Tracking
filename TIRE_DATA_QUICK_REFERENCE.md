# 📊 Quick Reference - Tire Data Thresholds Update

> **Update Date**: December 23, 2025  
> **Alert Frequency**: 5% → **1%** (99% normal data)

---

## 🎯 Frontend: Threshold Constants Update

```javascript
// ========================================
// TEMPERATURE THRESHOLDS
// ========================================

// ❌ OLD (REMOVE)
const TEMP_WARNING = 80;
const TEMP_CRITICAL = 90;

// ✅ NEW (USE THIS)
const TEMP_NORMAL_MAX = 84;      // Normal: 60-84°C
const TEMP_WARNING_MIN = 85;     // Warning: 85-99°C
const TEMP_CRITICAL_MIN = 100;   // Critical: ≥100°C

// ========================================
// PRESSURE THRESHOLDS
// ========================================

// ❌ OLD (REMOVE)
const PRESSURE_MIN = 85;
const PRESSURE_MAX = 110;

// ✅ NEW (USE THIS)
const PRESSURE_CRITICAL_LOW = 90;     // Critical: <90 PSI
const PRESSURE_NORMAL_MIN = 100;      // Normal: 100-119 PSI
const PRESSURE_NORMAL_MAX = 119;
const PRESSURE_CRITICAL_HIGH = 120;   // Critical: ≥120 PSI

// ========================================
// STATUS FUNCTIONS
// ========================================

// Temperature Status
function getTempStatus(temp) {
  if (temp >= 100) return 'critical';
  if (temp >= 85) return 'warning';
  return 'normal';
}

// Pressure Status
function getPressureStatus(pressure) {
  if (pressure < 90) return 'critical-low';
  if (pressure >= 120) return 'critical-high';
  return 'normal';
}

// ========================================
// GAUGE CONFIGURATIONS
// ========================================

// Temperature Gauge
const tempGaugeConfig = {
  min: 50,
  max: 120,
  zones: [
    { from: 50, to: 84, color: '#22c55e' },   // Normal (green)
    { from: 85, to: 99, color: '#f59e0b' },   // Warning (orange)
    { from: 100, to: 120, color: '#ef4444' }  // Critical (red)
  ]
};

// Pressure Gauge
const pressureGaugeConfig = {
  min: 70,
  max: 140,
  zones: [
    { from: 70, to: 89, color: '#ef4444' },    // Critical Low (red)
    { from: 90, to: 119, color: '#22c55e' },   // Normal (green)
    { from: 120, to: 140, color: '#ef4444' }   // Critical High (red)
  ]
};
```

---

## 📡 WebSocket Data Format (Unchanged)

```javascript
// No changes to WebSocket message structure
// Only the data VALUES are different

{
  "type": "truck_locations_update",
  "trucks": [{
    "sensors": [{
      "temp": 72.3,        // ✅ 60-84°C = normal
      "pressure": 108.5,   // ✅ 100-119 PSI = normal
      "exType": "normal"   // ✅ 99% will be "normal"
    }]
  }]
}
```

---

## 🎨 UI Color Mapping

```javascript
// Status badge colors
const statusColors = {
  'normal': {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  'warning': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300'
  },
  'critical': {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300'
  }
};
```

---

## 📊 Expected Data Distribution

```
Per 100 sensor readings:
├─ 99 sensors: NORMAL ✅ (green)
└─  1 sensor:  ALERT  ⚠️ (warning/critical)

Per truck (10 sensors):
├─ 90% chance: All sensors normal ✅
└─ 10% chance: 1 sensor has alert ⚠️
```

---

## ✅ Testing Checklist

```javascript
// Test cases for frontend
const testCases = [
  // Temperature
  { temp: 65, expected: 'normal' },    // ✅ Normal
  { temp: 84, expected: 'normal' },    // ✅ Normal max
  { temp: 85, expected: 'warning' },   // ⚠️ Warning
  { temp: 99, expected: 'warning' },   // ⚠️ Warning max
  { temp: 100, expected: 'critical' }, // 🚨 Critical
  { temp: 105, expected: 'critical' }, // 🚨 Critical
  
  // Pressure
  { pressure: 85, expected: 'critical-low' },   // 🚨 Too low
  { pressure: 89, expected: 'critical-low' },   // 🚨 Too low
  { pressure: 100, expected: 'normal' },        // ✅ Normal
  { pressure: 115, expected: 'normal' },        // ✅ Normal
  { pressure: 120, expected: 'critical-high' }, // 🚨 Too high
  { pressure: 125, expected: 'critical-high' }, // 🚨 Too high
];
```

---

## 🔧 Migration Code Example

```javascript
// React/Vue Component Update Example

// ❌ BEFORE
const isOverheating = sensor.temp > 80;
const isPressureLow = sensor.pressure < 85;

// ✅ AFTER
const isOverheating = sensor.temp >= 100;
const isPressureLow = sensor.pressure < 90;
const isWarning = sensor.temp >= 85 && sensor.temp < 100;
```

---

## 📞 Support

If you see unexpected alerts:
1. Check threshold constants are updated
2. Verify WebSocket connection
3. Check browser console for errors
4. See `TIRE_DATA_ALERT_UPDATE.md` for full details

---

**Version**: 2.0  
**Last Updated**: December 23, 2025

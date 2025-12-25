# 🚨 Alert Schedule Update - Frontend Integration Guide

**Update Date:** 24 Desember 2025  
**Backend Version:** V3  
**Alert System:** Scheduled 30-Minute Alerts untuk Truck 1

---

## 📋 OVERVIEW

### **Perubahan Alert System:**

**SEBELUMNYA (V2):**
- ❌ Alert muncul **random** (1% probability)
- ❌ Semua truck bisa dapat alert
- ❌ Tidak ada schedule tetap

**SEKARANG (V3):**
- ✅ **HANYA TRUCK 1** yang dapat alert
- ✅ Alert muncul **SETIAP 30 MENIT** (scheduled)
- ✅ **Predictable** dan mudah di-test
- ✅ **1 sensor** per alert cycle (Tire 1)

---

## 🎯 TRUCK TARGET

### **Identifikasi Truck 1:**

```javascript
// Truck 1 adalah truck dengan ID terkecil (sorted by ID ASC)
// Biasanya:
{
  "id": 1,
  "plate": "B 9001 SIM",
  "name": "Simulator Truck SIM01",
  "type": "Dump Truck"
}
```

### **Cara Mendapatkan Truck 1:**

```javascript
// API Call untuk get truck list
GET /api/trucks

// Response (trucks sorted by ID ASC):
{
  "success": true,
  "data": [
    {
      "id": 1,              // ← INI TRUCK TARGET
      "plate": "B 9001 SIM",
      "name": "Simulator Truck SIM01"
    },
    {
      "id": 2,
      "plate": "B 9002 SIM",
      "name": "Simulator Truck SIM02"
    }
    // ... trucks lainnya
  ]
}

// Truck 1 = data[0] (index pertama)
const truck1 = response.data.data[0];
```

---

## ⏰ ALERT SCHEDULE

### **Interval:**
- **30 menit** = 1,800,000 milliseconds
- Alert muncul pada waktu: **XX:00:00**, **XX:30:00**

### **Timeline Contoh:**

| Waktu | Event | Truck | Alert Type | Value |
|-------|-------|-------|------------|-------|
| 10:00:00 | First alert | Truck 1 | Warning Temp | 94.1°C |
| 10:30:00 | Scheduled | Truck 1 | Critical Pressure Low | 87.2 PSI |
| 11:00:00 | Scheduled | Truck 1 | Critical Temp | 102.3°C |
| 11:30:00 | Scheduled | Truck 1 | Critical Pressure High | 122.5 PSI |
| 12:00:00 | Scheduled | Truck 1 | Warning Temp | 88.7°C |

**Pattern:** Alert baru setiap 30 menit untuk Truck 1 only

---

## 📡 WEBSOCKET INTEGRATION

### **1. Connect to WebSocket**

```javascript
// Production
const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');

// Local Development
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
  
  // Subscribe ke alert channel
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'alerts'
  }));
};
```

### **2. Listen for Alert Messages**

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_alert') {
    handleNewAlert(message.data);
  }
  
  if (message.type === 'alert_resolved') {
    handleAlertResolved(message.data);
  }
};
```

### **3. WebSocket Message Format**

#### **New Alert (Setiap 30 Menit):**

```json
{
  "type": "new_alert",
  "timestamp": "2025-12-24T10:30:00.000Z",
  "data": {
    "id": 123,
    "alert_code": "TIRE_TEMP_CRITICAL",
    "alert_name": "Critical Tire Temperature",
    "severity": "critical",
    "truck_id": 1,
    "truck_plate": "B 9001 SIM",
    "device_id": 1,
    "device_sn": "DEV-SIM01",
    "sensor_id": 1,
    "sensor_tireNo": 1,
    "value": 102.3,
    "message": "Critical: Tire 1 temperature 102.3°C",
    "status": "active",
    "created_at": "2025-12-24T10:30:00.000Z"
  }
}
```

#### **Alert Types yang Mungkin Muncul:**

| Alert Code | Severity | Value Range | Probability |
|------------|----------|-------------|-------------|
| `TIRE_TEMP_CRITICAL` | critical | 100-105°C | 25% |
| `TIRE_TEMP_HIGH` | warning | 85-95°C | 25% |
| `TIRE_PRESSURE_CRITICAL` | critical | <90 PSI | 25% |
| `TIRE_PRESSURE_HIGH` | critical | ≥120 PSI | 25% |

---

## 🎨 FRONTEND UI UPDATES

### **1. Live Tracking Map**

#### **Truck Icon State:**

```javascript
function getTruckIconColor(truck, alerts) {
  // Check if truck has active alert
  const hasAlert = alerts.some(alert => 
    alert.truck_id === truck.id && 
    alert.status === 'active'
  );
  
  if (truck.id === 1 && hasAlert) {
    return 'red'; // 🔴 Truck 1 dengan alert
  } else if (truck.id === 1) {
    return 'orange'; // 🟠 Truck 1 normal (monitoring)
  } else {
    return 'green'; // 🟢 Truck lain normal
  }
}
```

#### **Map Marker Update:**

```jsx
// React Component
const TruckMarker = ({ truck, alerts }) => {
  const hasAlert = alerts.some(a => 
    a.truck_id === truck.id && a.status === 'active'
  );
  
  return (
    <Marker
      position={[truck.location.latitude, truck.location.longitude]}
      icon={hasAlert ? redTruckIcon : greenTruckIcon}
    >
      <Popup>
        <div>
          <h3>{truck.plate}</h3>
          {hasAlert && (
            <div className="alert-badge">
              🚨 Alert Active
            </div>
          )}
          {truck.id === 1 && (
            <div className="monitoring-badge">
              ⏰ Scheduled Monitoring (30 min)
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
```

### **2. Alert Notification Panel**

#### **Real-time Alert Display:**

```jsx
// React Component
const AlertNotification = () => {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_alert') {
        // Add new alert to top
        setAlerts(prev => [message.data, ...prev]);
        
        // Show toast notification
        toast.error(`🚨 ${message.data.message}`, {
          position: 'top-right',
          autoClose: 10000,
          icon: '🚛'
        });
        
        // Play sound (optional)
        playAlertSound();
      }
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="alert-panel">
      <h3>Active Alerts</h3>
      {alerts.map(alert => (
        <AlertCard 
          key={alert.id} 
          alert={alert}
          isTruck1={alert.truck_id === 1}
        />
      ))}
    </div>
  );
};
```

#### **Alert Card Component:**

```jsx
const AlertCard = ({ alert, isTruck1 }) => {
  const getSeverityColor = (severity) => {
    return severity === 'critical' ? 'red' : 'orange';
  };
  
  return (
    <div className={`alert-card ${alert.severity}`}>
      <div className="alert-header">
        <span className="truck-badge">
          {alert.truck_plate}
          {isTruck1 && <span className="scheduled-badge">⏰</span>}
        </span>
        <span className={`severity-badge ${alert.severity}`}>
          {alert.severity.toUpperCase()}
        </span>
      </div>
      
      <div className="alert-body">
        <p className="message">{alert.message}</p>
        <div className="alert-details">
          <span>Tire #{alert.sensor_tireNo}</span>
          <span>Value: {alert.value}</span>
        </div>
      </div>
      
      <div className="alert-footer">
        <span className="timestamp">
          {formatTime(alert.created_at)}
        </span>
        <button onClick={() => resolveAlert(alert.id)}>
          Resolve
        </button>
      </div>
    </div>
  );
};
```

### **3. Truck Detail Page**

#### **Sensor Status Display:**

```jsx
const TruckSensorStatus = ({ truckId }) => {
  const [sensorData, setSensorData] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  
  // Fetch sensor data
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/trucks/${truckId}/sensors`);
      const data = await response.json();
      setSensorData(data.data);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000); // Update every 3s
    
    return () => clearInterval(interval);
  }, [truckId]);
  
  // Fetch active alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch(`/api/alerts/active?truck_id=${truckId}`);
      const data = await response.json();
      setActiveAlerts(data.data);
    };
    
    fetchAlerts();
  }, [truckId]);
  
  const getSensorAlert = (sensorId) => {
    return activeAlerts.find(a => a.sensor_id === sensorId);
  };
  
  return (
    <div className="sensor-grid">
      {sensorData.map(sensor => {
        const alert = getSensorAlert(sensor.id);
        
        return (
          <div 
            key={sensor.id}
            className={`sensor-card ${alert ? 'has-alert' : ''}`}
          >
            <div className="tire-number">Tire {sensor.tireNo}</div>
            
            <div className="sensor-values">
              <div className={`value ${getStatusClass(sensor.tempValue, 'temp')}`}>
                <span className="label">Temperature</span>
                <span className="number">{sensor.tempValue}°C</span>
              </div>
              
              <div className={`value ${getStatusClass(sensor.tirepValue, 'pressure')}`}>
                <span className="label">Pressure</span>
                <span className="number">{sensor.tirepValue} PSI</span>
              </div>
            </div>
            
            {alert && (
              <div className="alert-indicator">
                🚨 {alert.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Status color helper
function getStatusClass(value, type) {
  if (type === 'temp') {
    if (value >= 100) return 'critical';
    if (value >= 85) return 'warning';
    return 'normal';
  } else if (type === 'pressure') {
    if (value < 90 || value >= 120) return 'critical';
    if (value < 95 || value >= 115) return 'warning';
    return 'normal';
  }
}
```

---

## 🔔 NOTIFICATION STRATEGY

### **1. Toast Notifications**

```javascript
// Recommended: React-Toastify
import { toast } from 'react-toastify';

function handleNewAlert(alertData) {
  const isTruck1 = alertData.truck_id === 1;
  
  toast.error(
    <div>
      <strong>{alertData.truck_plate}</strong>
      {isTruck1 && <span> (Scheduled)</span>}
      <br />
      {alertData.message}
    </div>,
    {
      position: 'top-right',
      autoClose: isTruck1 ? 15000 : 10000, // Longer for Truck 1
      closeOnClick: true,
      pauseOnHover: true,
      icon: isTruck1 ? '⏰' : '🚨'
    }
  );
}
```

### **2. Browser Notifications**

```javascript
// Request permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Show notification
function showBrowserNotification(alertData) {
  if (Notification.permission === 'granted') {
    const notification = new Notification('TPMS Alert', {
      body: `${alertData.truck_plate}: ${alertData.message}`,
      icon: '/truck-alert-icon.png',
      badge: '/badge-icon.png',
      tag: `alert-${alertData.id}`,
      requireInteraction: alertData.severity === 'critical',
      data: alertData
    });
    
    notification.onclick = () => {
      window.focus();
      navigateToTruck(alertData.truck_id);
    };
  }
}
```

### **3. Sound Alerts**

```javascript
// Alert sound manager
class AlertSoundManager {
  constructor() {
    this.criticalSound = new Audio('/sounds/critical-alert.mp3');
    this.warningSound = new Audio('/sounds/warning-alert.mp3');
  }
  
  play(severity) {
    const sound = severity === 'critical' 
      ? this.criticalSound 
      : this.warningSound;
    
    sound.play().catch(err => {
      console.error('Sound play failed:', err);
    });
  }
}

const soundManager = new AlertSoundManager();

// Play on new alert
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_alert') {
    soundManager.play(message.data.severity);
  }
};
```

---

## 📊 API ENDPOINTS

### **1. Get Active Alerts**

```javascript
GET /api/alerts/active?truck_id=1

// Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "alert_code": "TIRE_TEMP_CRITICAL",
      "severity": "critical",
      "truck_id": 1,
      "truck_plate": "B 9001 SIM",
      "sensor_tireNo": 1,
      "value": 102.3,
      "message": "Critical: Tire 1 temperature 102.3°C",
      "status": "active",
      "created_at": "2025-12-24T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### **2. Get Alert History for Truck 1**

```javascript
GET /api/alerts?truck_id=1&limit=50&page=1

// Response:
{
  "success": true,
  "data": [
    // ... array of alerts
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### **3. Get Alert Statistics**

```javascript
GET /api/alerts/stats?truck_id=1&days=7

// Response:
{
  "success": true,
  "data": {
    "summary": {
      "total": 336,          // 7 days × 24 hours × 2 alerts/hour = 336
      "active": 1,
      "resolved": 335,
      "critical": 250,
      "warning": 86
    },
    "byType": [
      {
        "code": "TIRE_TEMP_CRITICAL",
        "name": "Critical Tire Temperature",
        "severity": "critical",
        "count": 84
      },
      {
        "code": "TIRE_TEMP_HIGH",
        "name": "High Tire Temperature",
        "severity": "warning",
        "count": 86
      },
      {
        "code": "TIRE_PRESSURE_CRITICAL",
        "name": "Critical Tire Pressure",
        "severity": "critical",
        "count": 83
      },
      {
        "code": "TIRE_PRESSURE_HIGH",
        "name": "High Tire Pressure",
        "severity": "critical",
        "count": 83
      }
    ],
    "period": {
      "days": 7,
      "startDate": "2025-12-17T00:00:00.000Z",
      "endDate": "2025-12-24T10:30:00.000Z"
    }
  }
}
```

### **4. Resolve Alert**

```javascript
PATCH /api/alerts/:id/resolve

// Request Body:
{
  "notes": "Tire inspected and cooled down. Temperature back to normal."
}

// Response:
{
  "success": true,
  "data": {
    "id": 123,
    "status": "resolved",
    "resolved_at": "2025-12-24T10:35:00.000Z",
    "message": "Critical: Tire 1 temperature 102.3°C\nResolution notes: Tire inspected..."
  },
  "message": "Alert resolved successfully"
}
```

---

## 🧪 TESTING

### **1. Test Alert Reception**

```javascript
// Test script
const testAlertReception = () => {
  const ws = new WebSocket('ws://localhost:3001/ws');
  let alertCount = 0;
  
  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    ws.send(JSON.stringify({ type: 'subscribe', channel: 'alerts' }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'new_alert') {
      alertCount++;
      console.log(`📨 Alert #${alertCount} received:`, {
        truck: message.data.truck_plate,
        time: new Date(message.data.created_at).toLocaleTimeString(),
        message: message.data.message
      });
      
      // Verify it's Truck 1
      if (message.data.truck_id !== 1) {
        console.error('❌ FAIL: Alert from wrong truck!', message.data.truck_id);
      } else {
        console.log('✅ PASS: Alert is from Truck 1');
      }
    }
  };
  
  // Check after 35 minutes (should receive at least 1 alert)
  setTimeout(() => {
    if (alertCount >= 1) {
      console.log('✅ TEST PASSED: Received', alertCount, 'alert(s)');
    } else {
      console.error('❌ TEST FAILED: No alerts received');
    }
    ws.close();
  }, 35 * 60 * 1000); // 35 minutes
};
```

### **2. Verify Alert Schedule**

```javascript
// Track alert timestamps
const alertTimestamps = [];

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_alert' && message.data.truck_id === 1) {
    const now = new Date();
    alertTimestamps.push(now);
    
    if (alertTimestamps.length > 1) {
      const lastAlert = alertTimestamps[alertTimestamps.length - 2];
      const diff = (now - lastAlert) / 1000 / 60; // in minutes
      
      console.log(`⏱️ Time since last alert: ${diff.toFixed(1)} minutes`);
      
      if (Math.abs(diff - 30) < 1) {
        console.log('✅ PASS: Alert interval is ~30 minutes');
      } else {
        console.warn('⚠️ WARNING: Alert interval is not 30 minutes:', diff);
      }
    }
  }
};
```

---

## 📱 UI/UX RECOMMENDATIONS

### **1. Visual Indicators**

```css
/* Truck 1 Monitoring Badge */
.truck-card.truck-1 {
  border-left: 4px solid #FFA500; /* Orange border */
}

.truck-card.truck-1::before {
  content: "⏰ Scheduled Monitoring";
  background: #FFF3CD;
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* Alert Active State */
.truck-card.has-alert {
  border-left-color: #DC3545; /* Red border */
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
}
```

### **2. Alert Counter Badge**

```jsx
// Show alert count for Truck 1
const AlertCountBadge = ({ truckId, alerts }) => {
  const truckAlerts = alerts.filter(a => 
    a.truck_id === truckId && a.status === 'active'
  );
  
  if (truckAlerts.length === 0) return null;
  
  return (
    <div className="alert-count-badge">
      <span className="count">{truckAlerts.length}</span>
      <span className="label">Active Alert{truckAlerts.length > 1 ? 's' : ''}</span>
    </div>
  );
};
```

### **3. Timeline Visualization**

```jsx
// Alert timeline for Truck 1
const AlertTimeline = ({ truckId }) => {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    fetch(`/api/alerts?truck_id=${truckId}&limit=10`)
      .then(r => r.json())
      .then(data => setAlerts(data.data));
  }, [truckId]);
  
  return (
    <div className="alert-timeline">
      <h4>Alert History (Last 10)</h4>
      {alerts.map((alert, index) => (
        <div key={alert.id} className="timeline-item">
          <div className="timeline-marker" />
          <div className="timeline-content">
            <div className="time">
              {formatTime(alert.created_at)}
            </div>
            <div className={`alert-type ${alert.severity}`}>
              {alert.alert_name}
            </div>
            <div className="alert-value">
              Tire {alert.sensor_tireNo}: {alert.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## ⚙️ CONFIGURATION

### **Frontend Constants:**

```javascript
// src/constants/alerts.js

export const ALERT_CONFIG = {
  // Truck 1 monitoring
  MONITORED_TRUCK_ID: 1,
  ALERT_INTERVAL_MINUTES: 30,
  
  // Alert severity colors
  SEVERITY_COLORS: {
    critical: '#DC3545',
    warning: '#FFC107',
    normal: '#28A745'
  },
  
  // Thresholds (for display purposes)
  THRESHOLDS: {
    temperature: {
      critical: 100,
      warning: 85,
      normal_max: 84
    },
    pressure: {
      critical_low: 90,
      critical_high: 120,
      normal_min: 100,
      normal_max: 119
    }
  },
  
  // WebSocket config
  WS_URL: process.env.REACT_APP_WS_URL || 'wss://be-tpms.connectis.my.id/ws',
  WS_RECONNECT_INTERVAL: 5000,
  
  // Notification settings
  NOTIFICATION: {
    autoClose: {
      critical: 15000,
      warning: 10000
    },
    sound: {
      enabled: true,
      critical: '/sounds/critical-alert.mp3',
      warning: '/sounds/warning-alert.mp3'
    }
  }
};
```

---

## 🔍 TROUBLESHOOTING

### **Issue 1: Not Receiving Alerts**

**Symptoms:**
- WebSocket connected but no alert messages

**Solutions:**
```javascript
// Check WebSocket subscription
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'alerts'
  }));
  
  // Verify subscription
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 1000);
};

// Check server is running
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('Server health:', data));
```

### **Issue 2: Alert for Wrong Truck**

**Symptoms:**
- Receiving alerts for trucks other than Truck 1

**Solutions:**
```javascript
// Filter alerts on client side
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'new_alert') {
    // Only process Truck 1 alerts
    if (message.data.truck_id === 1) {
      handleNewAlert(message.data);
    } else {
      console.warn('Unexpected alert from truck:', message.data.truck_id);
    }
  }
};
```

### **Issue 3: Alert Timing Not Exact 30 Minutes**

**Explanation:**
- Backend generates alert "approximately" every 30 minutes
- Actual timing may vary by ±10 seconds due to:
  - GPS route generation cycles (3 seconds)
  - Database operations
  - Network latency

**Expected Behavior:**
```
Ideal: 10:00:00, 10:30:00, 11:00:00
Actual: 10:00:03, 10:30:06, 11:00:02 ← This is NORMAL
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Backend (Already Done):**
- [x] Alert schedule system (30 minutes)
- [x] Truck 1 targeting
- [x] WebSocket broadcast
- [x] API endpoints
- [x] Database logging

### **Frontend (To Do):**
- [ ] WebSocket connection setup
- [ ] Alert message handler
- [ ] Real-time notification display
- [ ] Truck 1 visual indicator on map
- [ ] Sensor status with alert overlay
- [ ] Alert history timeline
- [ ] Toast/Browser notifications
- [ ] Sound alerts (optional)
- [ ] Alert resolution UI
- [ ] Statistics dashboard
- [ ] Testing & validation

---

## 📞 SUPPORT

### **Backend Logs:**
```bash
# Monitor real-time logs
tail -f log/admin-activity.log

# Check alert generation
grep "ALERT SCHEDULE" log/admin-activity.log

# Verify Truck 1 alerts
grep "B 9001 SIM.*alert" log/admin-activity.log
```

### **Database Queries:**

```sql
-- Check latest alert for Truck 1
SELECT * FROM alert_events 
WHERE truck_id = 1 
ORDER BY created_at DESC 
LIMIT 5;

-- Count alerts per truck (should be mostly Truck 1)
SELECT truck_id, COUNT(*) as alert_count
FROM alert_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY truck_id
ORDER BY alert_count DESC;

-- Check alert interval
SELECT 
  created_at,
  LAG(created_at) OVER (ORDER BY created_at) as prev_alert,
  EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))/60 as minutes_diff
FROM alert_events
WHERE truck_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📚 REFERENCES

- **Backend Documentation:** `ALERT_SCHEDULE_30MIN.md`
- **WebSocket Guide:** `WEBSOCKET_INTEGRATION_GUIDE.md`
- **Tire Data Thresholds:** `TIRE_DATA_ALERT_UPDATE.md`
- **API Documentation:** `API_ENDPOINTS.md`

---

## 🎉 SUMMARY

### **Key Points untuk Frontend:**

1. ✅ **Hanya Truck 1** yang dapat alert (truck_id = 1, plate = "B 9001 SIM")
2. ✅ Alert muncul **setiap 30 menit** via WebSocket
3. ✅ **4 jenis alert** dengan probability sama (25% each)
4. ✅ Alert **selalu untuk Tire 1** dari Truck 1
5. ✅ **Predictable** - mudah di-test dan di-monitor
6. ✅ **Real-time** via WebSocket + REST API untuk history

### **Integration Steps:**

1. Connect ke WebSocket server
2. Subscribe ke 'alerts' channel
3. Listen untuk 'new_alert' messages
4. Filter untuk truck_id = 1
5. Display notification + update UI
6. Update map marker untuk Truck 1
7. Show alert details di truck detail page

### **Expected Result:**

```
Timeline:
10:00:00 → 🚨 Alert Truck 1 (Warning Temp)
10:30:00 → 🚨 Alert Truck 1 (Critical Pressure)
11:00:00 → 🚨 Alert Truck 1 (Critical Temp)
11:30:00 → 🚨 Alert Truck 1 (High Pressure)
...continues every 30 minutes
```

**All other trucks remain GREEN/NORMAL** ✅

---

**Questions?** Contact backend team atau cek dokumentasi di repository! 🚀

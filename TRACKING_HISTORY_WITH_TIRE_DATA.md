# 🗺️ Tracking History with Tire Pressure & Temperature Data

## 📋 Overview

Dokumentasi ini menjelaskan cara mengambil **riwayat tracking dengan data suhu dan tekanan ban yang sinkron dengan posisi GPS**. Saat history di-play, data sensor (pressure & temperature) akan sesuai dengan posisi truck pada waktu tersebut.

**Use Case:** 
- History playback di map dengan tire data per posisi
- Timeline analysis: Pressure/Temperature vs Position
- Route replay dengan monitoring kondisi ban real-time

---

## 🎯 Main Endpoint

### GET `/api/trucks/:id/tracking`

Endpoint ini sudah menyediakan location history + sensor data terbaru.

**Current Behavior:**
- ✅ Location history: Array dengan semua GPS points
- ✅ Sensors: Current/latest sensor data (1 snapshot)
- ❌ Sensor history per location: **Belum tersedia**

---

## 🔧 Solution: Synchronize Tire Data with Route

### Option 1: Frontend Interpolation (Recommended)

**Konsep:** Frontend menggunakan sensor `updated_at` timestamp untuk match dengan `location.recorded_at`

#### Endpoint

```
GET /api/trucks/:id/tracking
```

#### Response Structure

```json
{
  "success": true,
  "data": {
    "truck_id": 1,
    "plate_number": "B 9001 SIM",
    "location_history": [
      {
        "latitude": -3.583235,
        "longitude": 115.608048,
        "recorded_at": "2025-12-18T03:00:00.000Z",
        "created_at": "2025-12-18T03:00:01.000Z"
      },
      {
        "latitude": -3.584521,
        "longitude": 115.609234,
        "recorded_at": "2025-12-18T03:05:00.000Z",
        "created_at": "2025-12-18T03:05:01.000Z"
      }
      // ... more locations (100+ points)
    ],
    "sensors": [
      {
        "id": 1,
        "tireNo": 1,
        "tempValue": 45.2,
        "tirepValue": 95.5,
        "exType": "normal",
        "updated_at": "2025-12-18T03:05:00.000Z"
      },
      {
        "id": 2,
        "tireNo": 2,
        "tempValue": 89.8,
        "tirepValue": 82.1,
        "exType": "critical",
        "updated_at": "2025-12-18T03:05:00.000Z"
      }
      // ... 10 sensors total (current state)
    ]
  }
}
```

#### Frontend Implementation

**JavaScript/React Example:**

```javascript
import axios from 'axios';

// Service to fetch tracking with tire data
const getTrackingHistory = async (truckId) => {
  const response = await axios.get(
    `http://192.168.21.18:3001/api/trucks/${truckId}/tracking`
  );
  return response.data.data;
};

// Synchronize tire data with route playback
const syncTireDataWithRoute = (trackingData) => {
  const { location_history, sensors } = trackingData;
  
  // Assume sensor data updates every 5 minutes (same as location)
  // Since sensors only show current state, use latest sensor data
  // for all recent locations (within 5 minutes)
  
  const sensorUpdateTime = new Date(sensors[0]?.updated_at || Date.now());
  
  return location_history.map((location) => {
    const locationTime = new Date(location.recorded_at);
    
    // If location is within 5 minutes of sensor update, use sensor data
    const timeDiff = Math.abs(sensorUpdateTime - locationTime) / 1000 / 60; // minutes
    
    return {
      ...location,
      tires: timeDiff <= 5 ? sensors : null, // Attach sensors if time matches
      hasTireData: timeDiff <= 5,
    };
  });
};

// Usage in Route Playback Component
const RoutePlayback = ({ truckId }) => {
  const [routeData, setRouteData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const data = await getTrackingHistory(truckId);
      const synced = syncTireDataWithRoute(data);
      setRouteData(synced);
    };
    loadData();
  }, [truckId]);

  // Play route with tire data
  const playRoute = () => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= routeData.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000); // Move to next point every second

    return () => clearInterval(interval);
  };

  const currentPoint = routeData[currentIndex];

  return (
    <div>
      <Map center={[currentPoint?.latitude, currentPoint?.longitude]}>
        <Marker position={[currentPoint?.latitude, currentPoint?.longitude]} />
      </Map>

      {currentPoint?.hasTireData && (
        <div className="tire-panel">
          <h3>Tire Data at {currentPoint.recorded_at}</h3>
          {currentPoint.tires.map((tire) => (
            <div key={tire.id} className={`tire-${tire.exType}`}>
              <span>Tire {tire.tireNo}</span>
              <span>{tire.tirepValue} PSI</span>
              <span>{tire.tempValue}°C</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={playRoute}>▶️ Play Route</button>
    </div>
  );
};
```

---

### Option 2: Backend Enhancement (Future Enhancement)

**Konsep:** Backend menyimpan sensor snapshot per location atau menyediakan endpoint untuk query sensor history by time range.

#### Proposed New Endpoint

```
GET /api/trucks/:id/tracking-with-sensors
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `include_sensors` | Boolean | Include sensor data per location | `true` |
| `start_time` | DateTime | Start time filter | `2025-12-18T00:00:00Z` |
| `end_time` | DateTime | End time filter | `2025-12-18T23:59:59Z` |
| `limit` | Integer | Limit locations | `100` |

**Response with Sensor per Location:**

```json
{
  "success": true,
  "data": {
    "truck_id": 1,
    "plate_number": "B 9001 SIM",
    "timeline": [
      {
        "timestamp": "2025-12-18T03:00:00.000Z",
        "location": {
          "latitude": -3.583235,
          "longitude": 115.608048
        },
        "tires": [
          {
            "tireNo": 1,
            "pressure": 95.5,
            "temperature": 45.2,
            "status": "normal"
          },
          {
            "tireNo": 2,
            "pressure": 82.1,
            "temperature": 89.8,
            "status": "critical"
          }
          // ... 10 tires
        ]
      },
      {
        "timestamp": "2025-12-18T03:05:00.000Z",
        "location": {
          "latitude": -3.584521,
          "longitude": 115.609234
        },
        "tires": [
          {
            "tireNo": 1,
            "pressure": 96.2,
            "temperature": 46.8,
            "status": "normal"
          }
          // ... 10 tires with updated values
        ]
      }
      // ... more timeline points
    ]
  }
}
```

---

## 🧠 Understanding Data Synchronization

### Current Database Structure

1. **Location Table (`location`)**
   - Stores GPS coordinates
   - Field: `recorded_at` (timestamp GPS captured)
   - Updates every 5 minutes via simulator

2. **Sensor Table (`sensor`)**
   - Stores current tire pressure & temperature
   - Field: `updated_at` (timestamp sensor updated)
   - Updates every time IoT device sends data (~5 minutes)

### Key Challenge

**Problem:** Sensor table only stores **current state**, not historical snapshots.

**Current State:**
```
sensor.tempValue = 45.2°C  (current)
sensor.updated_at = 2025-12-18T03:05:00Z
```

**History Not Available:**
```
❌ sensor.tempValue at 2025-12-18T03:00:00Z = ?
❌ sensor.tempValue at 2025-12-18T02:55:00Z = ?
```

### Solutions

#### ✅ Solution 1: Use Latest Sensor Data (Current Implementation)
- Frontend uses **current sensor data** for recent locations
- Assumption: Sensor values don't change drastically in 5-10 minutes
- **Pros:** No backend changes needed
- **Cons:** Not 100% historically accurate

#### 🚧 Solution 2: Create Sensor History Table (Database Change Required)
```sql
CREATE TABLE sensor_history (
  id SERIAL PRIMARY KEY,
  sensor_id INT REFERENCES sensor(id),
  device_id INT REFERENCES device(id),
  location_id INT REFERENCES location(id), -- Link to location!
  tireNo INT,
  tempValue DECIMAL,
  tirepValue DECIMAL,
  exType VARCHAR(20),
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Backend would save sensor snapshot when location is recorded:**
```javascript
// When IoT device sends data
await prisma.$transaction([
  // Save location
  prisma.location.create({
    data: { lat, long, device_id, recorded_at }
  }),
  
  // Save sensor snapshot
  prisma.sensor_history.createMany({
    data: sensors.map(s => ({
      sensor_id: s.id,
      device_id: device.id,
      location_id: location.id, // Link!
      tireNo: s.tireNo,
      tempValue: s.tempValue,
      tirepValue: s.tirepValue,
      exType: s.exType,
      recorded_at: timestamp
    }))
  })
]);
```

---

## 💡 Recommended Approach (Quick Implementation)

### Step-by-Step: Match Sensor with Location by Timestamp

#### 1. Fetch Tracking Data

```javascript
const API_URL = 'http://192.168.21.18:3001/api';

const fetchTrackingWithTires = async (truckId) => {
  try {
    const response = await axios.get(`${API_URL}/trucks/${truckId}/tracking`);
    const { location_history, sensors } = response.data.data;
    
    return {
      locations: location_history,
      currentTires: sensors,
    };
  } catch (error) {
    console.error('Error fetching tracking:', error);
    throw error;
  }
};
```

#### 2. Create Playback Timeline

```javascript
const createPlaybackTimeline = (locations, currentTires) => {
  // Get sensor update timestamp
  const sensorTimestamp = currentTires[0]?.updated_at 
    ? new Date(currentTires[0].updated_at) 
    : new Date();

  // Sort locations by time (oldest first for playback)
  const sortedLocations = [...locations].sort(
    (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
  );

  // Attach tire data to matching locations
  return sortedLocations.map((location, index) => {
    const locationTime = new Date(location.recorded_at);
    
    // Calculate time difference in minutes
    const timeDiff = Math.abs(sensorTimestamp - locationTime) / 1000 / 60;
    
    // If location is recent (within 10 minutes of sensor update), use tire data
    const isRecent = timeDiff <= 10;
    
    return {
      index,
      timestamp: location.recorded_at,
      position: {
        lat: location.latitude,
        lng: location.longitude,
      },
      tireData: isRecent ? currentTires : null,
      isCurrent: timeDiff < 1, // Mark if this is current position
    };
  });
};
```

#### 3. Implement Route Playback

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

const TrackingPlayback = ({ truckId }) => {
  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per step
  const intervalRef = useRef(null);

  // Load tracking data on mount
  useEffect(() => {
    loadTrackingData();
  }, [truckId]);

  const loadTrackingData = async () => {
    try {
      const { locations, currentTires } = await fetchTrackingWithTires(truckId);
      const playback = createPlaybackTimeline(locations, currentTires);
      setTimeline(playback);
      console.log(`📊 Loaded ${playback.length} tracking points`);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  };

  // Play/Pause control
  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= timeline.length - 1) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
  };

  // Reset to start
  const resetPlayback = () => {
    clearInterval(intervalRef.current);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Jump to specific step
  const jumpToStep = (step) => {
    clearInterval(intervalRef.current);
    setCurrentStep(Math.max(0, Math.min(step, timeline.length - 1)));
    setIsPlaying(false);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (timeline.length === 0) {
    return <div>Loading tracking data...</div>;
  }

  const currentPoint = timeline[currentStep];
  const pathUpToCurrent = timeline.slice(0, currentStep + 1).map(p => [p.position.lat, p.position.lng]);

  return (
    <div className="tracking-playback">
      {/* Map Display */}
      <MapContainer
        center={[currentPoint.position.lat, currentPoint.position.lng]}
        zoom={14}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Route Path */}
        <Polyline positions={pathUpToCurrent} color="blue" weight={3} />
        
        {/* Current Position Marker */}
        <Marker position={[currentPoint.position.lat, currentPoint.position.lng]}>
          <Popup>
            <div>
              <strong>Step {currentStep + 1} / {timeline.length}</strong>
              <br />
              Time: {new Date(currentPoint.timestamp).toLocaleString()}
              <br />
              Position: {currentPoint.position.lat.toFixed(6)}, {currentPoint.position.lng.toFixed(6)}
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Tire Data Panel */}
      {currentPoint.tireData && (
        <div className="tire-data-panel">
          <h3>🛞 Tire Condition at this Position</h3>
          <p className="timestamp">
            📅 {new Date(currentPoint.timestamp).toLocaleString()}
          </p>
          
          <div className="tire-grid">
            {currentPoint.tireData.map((tire) => (
              <div
                key={tire.id}
                className={`tire-card tire-${tire.exType}`}
              >
                <div className="tire-number">Tire {tire.tireNo}</div>
                <div className="tire-metrics">
                  <div className="metric">
                    <span className="label">🌡️ Temp</span>
                    <span className="value">{tire.tempValue.toFixed(1)}°C</span>
                  </div>
                  <div className="metric">
                    <span className="label">💨 Pressure</span>
                    <span className="value">{tire.tirepValue.toFixed(1)} PSI</span>
                  </div>
                </div>
                <div className={`status-badge ${tire.exType}`}>
                  {tire.exType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="playback-controls">
        <button onClick={resetPlayback} title="Reset">
          ⏮️ Reset
        </button>
        
        <button onClick={() => jumpToStep(currentStep - 1)} disabled={currentStep === 0}>
          ⏪ Prev
        </button>
        
        <button onClick={togglePlayback}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button onClick={() => jumpToStep(currentStep + 1)} disabled={currentStep >= timeline.length - 1}>
          ⏩ Next
        </button>

        <div className="progress-info">
          <span>{currentStep + 1} / {timeline.length}</span>
        </div>

        {/* Timeline Slider */}
        <input
          type="range"
          min="0"
          max={timeline.length - 1}
          value={currentStep}
          onChange={(e) => jumpToStep(parseInt(e.target.value))}
          className="timeline-slider"
        />

        {/* Speed Control */}
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
          className="speed-select"
        >
          <option value="2000">0.5x</option>
          <option value="1000">1x</option>
          <option value="500">2x</option>
          <option value="250">4x</option>
        </select>
      </div>

      <style jsx>{`
        .tracking-playback {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tire-data-panel {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tire-data-panel h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .timestamp {
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .tire-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .tire-card {
          background: #f8f9fa;
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .tire-card.tire-normal {
          border-color: #28a745;
          background: #d4edda;
        }

        .tire-card.tire-warning {
          border-color: #ffc107;
          background: #fff3cd;
        }

        .tire-card.tire-critical {
          border-color: #dc3545;
          background: #f8d7da;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .tire-number {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }

        .tire-metrics {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 10px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .metric .label {
          color: #666;
        }

        .metric .value {
          font-weight: bold;
          color: #333;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.normal {
          background: #28a745;
          color: white;
        }

        .status-badge.warning {
          background: #ffc107;
          color: #333;
        }

        .status-badge.critical {
          background: #dc3545;
          color: white;
        }

        .playback-controls {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .playback-controls button {
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          background: #007bff;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .playback-controls button:hover:not(:disabled) {
          background: #0056b3;
        }

        .playback-controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .progress-info {
          padding: 0 15px;
          font-weight: bold;
          color: #333;
        }

        .timeline-slider {
          flex: 1;
          height: 6px;
        }

        .speed-select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default TrackingPlayback;
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND REQUEST                          │
│  GET /api/trucks/1/tracking                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND RESPONSE                           │
│                                                                 │
│  {                                                              │
│    location_history: [                                         │
│      { lat, lng, recorded_at: "03:00:00" },  ◄──┐             │
│      { lat, lng, recorded_at: "03:05:00" },     │             │
│      { lat, lng, recorded_at: "03:10:00" }      │             │
│    ],                                           │             │
│    sensors: [                                   │             │
│      { tireNo: 1, temp: 45°C, pressure: 95 PSI, │             │
│        updated_at: "03:10:00" }  ◄──────────────┼─ MATCH!     │
│    ]                                            │             │
│  }                                              │             │
└─────────────────────────────────────────────────┼──────────────┘
                              │                   │
                              ▼                   │
┌─────────────────────────────────────────────────┼──────────────┐
│                FRONTEND SYNCHRONIZATION         │              │
│                                                 │              │
│  Timeline = locations.map(location => {        │              │
│    timeDiff = |location.recorded_at -          │              │
│                sensors[0].updated_at|          │              │
│                                                 │              │
│    if (timeDiff <= 10 minutes) {               │              │
│      location.tires = sensors  ◄───────────────┘              │
│    }                                                           │
│  })                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ROUTE PLAYBACK                              │
│                                                                 │
│  Step 1 (03:00:00): Show location + tire data                 │
│  Step 2 (03:05:00): Show location + tire data                 │
│  Step 3 (03:10:00): Show location + tire data (current)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing the Implementation

### 1. Fetch Data

```bash
# Get truck tracking history
curl -X GET "http://192.168.21.18:3001/api/trucks/1/tracking" | jq
```

### 2. Verify Response

Check that response contains:
- ✅ `location_history[]` with multiple points
- ✅ `sensors[]` with 10 tire sensors
- ✅ `sensors[0].updated_at` timestamp
- ✅ `location_history[0].recorded_at` timestamp

### 3. Test with PowerShell

```powershell
# Fetch and analyze
$response = Invoke-RestMethod "http://192.168.21.18:3001/api/trucks/1/tracking"
$data = $response.data

Write-Host "📍 Locations: $($data.location_history.Count)"
Write-Host "🛞 Sensors: $($data.sensors.Count)"

# Check timestamps
$sensorTime = [DateTime]$data.sensors[0].updated_at
$locationTime = [DateTime]$data.location_history[0].recorded_at

$diff = ($sensorTime - $locationTime).TotalMinutes
Write-Host "⏱️ Time difference: $([Math]::Abs($diff).ToString('0.00')) minutes"

# Count locations with matching timestamps (within 5 min of sensor update)
$matches = $data.location_history | Where-Object {
    $locTime = [DateTime]$_.recorded_at
    $timeDiff = [Math]::Abs(($sensorTime - $locTime).TotalMinutes)
    $timeDiff -le 5
}
Write-Host "✅ Locations with tire data: $($matches.Count)"
```

---

## 📈 Performance Optimization

### 1. Limit History for Better Performance

```javascript
// Fetch only last 50 locations for playback
const response = await axios.get(
  `http://192.168.21.18:3001/api/trucks/${truckId}/tracking?limit=50`
);
```

### 2. Cache Timeline Data

```javascript
// Cache processed timeline
const timelineCache = new Map();

const getTimeline = async (truckId) => {
  if (timelineCache.has(truckId)) {
    return timelineCache.get(truckId);
  }
  
  const { locations, currentTires } = await fetchTrackingWithTires(truckId);
  const timeline = createPlaybackTimeline(locations, currentTires);
  
  timelineCache.set(truckId, timeline);
  return timeline;
};
```

### 3. Lazy Load Tire Data

```javascript
// Only fetch tire data when user starts playback
const [tireData, setTireData] = useState(null);

const onPlayClick = async () => {
  if (!tireData) {
    const data = await fetchTrackingWithTires(truckId);
    setTireData(data.currentTires);
  }
  startPlayback();
};
```

---

## 🔮 Future Enhancements

### 1. Sensor History Table (Backend)

Create dedicated table to store sensor snapshots per location:

```javascript
// When IoT device sends data
await prisma.$transaction(async (tx) => {
  // Save location
  const location = await tx.location.create({
    data: { lat, long, device_id, recorded_at: timestamp }
  });
  
  // Save sensor snapshot linked to location
  await tx.sensor_snapshot.createMany({
    data: sensors.map(s => ({
      location_id: location.id,
      sensor_id: s.id,
      tireNo: s.tireNo,
      tempValue: s.tempValue,
      tirepValue: s.tirepValue,
      exType: s.exType,
      recorded_at: timestamp
    }))
  });
  
  // Update current sensor values
  await tx.sensor.updateMany({
    where: { device_id },
    data: sensors
  });
});
```

### 2. Timeline Query Endpoint

New endpoint that joins location + sensor snapshots:

```javascript
// GET /api/trucks/:id/timeline?start=...&end=...
app.get('/api/trucks/:id/timeline', async (req, res) => {
  const timeline = await prisma.location.findMany({
    where: {
      device: { truck_id: parseInt(req.params.id) },
      recorded_at: {
        gte: req.query.start,
        lte: req.query.end
      }
    },
    include: {
      sensor_snapshots: {
        include: { sensor: true }
      }
    },
    orderBy: { recorded_at: 'asc' }
  });
  
  // Format with tire data per location
  res.json({
    success: true,
    data: timeline.map(loc => ({
      timestamp: loc.recorded_at,
      position: { lat: loc.lat, lng: loc.long },
      tires: loc.sensor_snapshots.map(snap => ({
        tireNo: snap.tireNo,
        pressure: snap.tirepValue,
        temperature: snap.tempValue,
        status: snap.exType
      }))
    }))
  });
});
```

---

## 📚 Related Documentation

- **Tire Pressure & Temperature API:** `/docs/TIRE_PRESSURE_TEMPERATURE_API.md`
- **Live Tracking API:** `/docs/LIVE_TRACKING_FRONTEND_INTEGRATION.md`
- **Alert Events API:** `/docs/ALERT_EVENTS_API.md`

---

## ✅ Quick Start Checklist

- [ ] Test `/api/trucks/:id/tracking` endpoint
- [ ] Verify `location_history` contains multiple points (100+)
- [ ] Verify `sensors` contains current tire data (10 sensors)
- [ ] Implement `createPlaybackTimeline()` function
- [ ] Create `TrackingPlayback` React component
- [ ] Add map library (react-leaflet or google-maps-react)
- [ ] Test route playback with play/pause controls
- [ ] Display tire data panel synchronized with route position
- [ ] Add timeline slider for manual scrubbing
- [ ] Test with different trucks and time ranges
- [ ] Optimize performance (limit locations, cache data)

---

**Last Updated:** December 18, 2025  
**Status:** ✅ Ready for Implementation  
**Recommended Approach:** Frontend Interpolation (Option 1)

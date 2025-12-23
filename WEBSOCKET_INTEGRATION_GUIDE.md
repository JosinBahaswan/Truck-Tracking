# WebSocket Integration Guide

Panduan lengkap untuk mengintegrasikan WebSocket real-time updates ke dalam aplikasi frontend TPMS (Tire Pressure Monitoring System).

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [WebSocket Connection](#websocket-connection)
3. [Message Types](#message-types)
4. [Subscription Channels](#subscription-channels)
5. [Implementation Examples](#implementation-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

WebSocket server menyediakan real-time updates untuk:
- **Truck Location Updates** - GPS tracking real-time setiap 3 detik
- **Alert Notifications** - Notifikasi instant untuk tire anomalies
- **Sensor Data Updates** - Temperature & pressure updates
- **Dashboard Metrics** - Real-time statistics
- **Admin Activities** - Activity logging untuk monitoring

### Server Information

```
Production URL: wss://be-tpms.connectis.my.id/ws
Development URL: ws://localhost:3001
Protocol: WebSocket (ws:// atau wss://)
```

---

## 🔌 WebSocket Connection

### Basic Connection

```javascript
// Vanilla JavaScript
const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');

ws.onopen = () => {
  console.log('✅ Connected to TPMS WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Received:', message);
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('🔌 Disconnected:', event.code, event.reason);
};
```

### React Implementation

```javascript
import { useEffect, useState, useRef } from 'react';

function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, lastMessage, sendMessage };
}

// Usage in component
function App() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    'wss://be-tpms.connectis.my.id/ws'
  );

  useEffect(() => {
    if (isConnected) {
      // Subscribe to truck updates
      sendMessage({
        type: 'subscribe',
        channel: 'truck_updates'
      });
    }
  }, [isConnected]);

  useEffect(() => {
    if (lastMessage) {
      console.log('New message:', lastMessage);
      // Handle different message types
      switch (lastMessage.type) {
        case 'truck_locations_update':
          // Update truck positions on map
          break;
        case 'new_alert':
          // Show alert notification
          break;
        // ... handle other message types
      }
    }
  }, [lastMessage]);

  return (
    <div>
      <p>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
    </div>
  );
}
```

### Vue 3 Implementation

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useWebSocket(url) {
  const isConnected = ref(false);
  const lastMessage = ref(null);
  let ws = null;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      isConnected.value = true;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      lastMessage.value = message;
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      isConnected.value = false;
    };
  };

  const sendMessage = (message) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const disconnect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return { isConnected, lastMessage, sendMessage, disconnect };
}

// Usage in component
export default {
  setup() {
    const { isConnected, lastMessage, sendMessage } = useWebSocket(
      'wss://be-tpms.connectis.my.id/ws'
    );

    watch(isConnected, (connected) => {
      if (connected) {
        // Subscribe to alerts
        sendMessage({
          type: 'subscribe',
          channel: 'alerts'
        });
      }
    });

    watch(lastMessage, (message) => {
      if (message?.type === 'new_alert') {
        // Show alert notification
        console.log('New alert:', message.data);
      }
    });

    return { isConnected, lastMessage };
  }
};
```

---

## 📨 Message Types

### 1. Client → Server Messages

#### Subscribe to Channel

```javascript
{
  "type": "subscribe",
  "channel": "truck_updates" | "alerts" | "dashboard" | "admin_activities"
}
```

**Example:**
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'truck_updates'
}));
```

#### Unsubscribe from Channel

```javascript
{
  "type": "unsubscribe",
  "channel": "truck_updates" | "alerts" | "dashboard" | "admin_activities"
}
```

#### Ping (Keep-Alive)

```javascript
{
  "type": "ping"
}
```

**Response:**
```javascript
{
  "type": "pong",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

### 2. Server → Client Messages

#### Truck Location Update

**Type:** `truck_locations_update`

```javascript
{
  "type": "truck_locations_update",
  "timestamp": "2025-12-23T10:00:00.000Z",
  "data": {
    "truckId": 1,
    "plate": "B 9001 SIM",
    "location": {
      "lat": -3.633564,
      "long": 115.652393,
      "recorded_at": "2025-12-23T10:00:00.000Z"
    },
    "sensors": [
      {
        "id": 1,
        "tireNo": 1,
        "sensorNo": 1,
        "tempValue": 67.5,
        "tirepValue": 98.2,
        "bat": 95,
        "status": "normal"
      }
      // ... more sensors
    ],
    "device": {
      "sn": "DEV001",
      "bat1": 87,
      "bat2": 85,
      "bat3": 90
    }
  }
}
```

#### New Alert

**Type:** `new_alert`

```javascript
{
  "type": "new_alert",
  "timestamp": "2025-12-23T10:00:00.000Z",
  "data": {
    "id": 123,
    "alert_id": 1,
    "truck_id": 2,
    "device_id": 2,
    "sensor_id": 15,
    "value": 92.5,
    "message": "Critical: Tire 4 temperature 92.5°C",
    "status": "active",
    "created_at": "2025-12-23T10:00:00.000Z",
    "alert": {
      "code": "TIRE_TEMP_CRITICAL",
      "name": "Critical Temperature",
      "description": "Tire temperature exceeded critical threshold",
      "severity": "critical"
    },
    "truck": {
      "name": "Hauler 02",
      "plate": "B 9002 SIM"
    },
    "sensor": {
      "tireNo": 4,
      "sn": "SENSOR-004"
    }
  }
}
```

#### Alert Resolved

**Type:** `alert_resolved`

```javascript
{
  "type": "alert_resolved",
  "timestamp": "2025-12-23T10:05:00.000Z",
  "data": {
    "id": 123,
    "status": "resolved",
    "resolved_at": "2025-12-23T10:05:00.000Z"
  }
}
```

#### Truck Status Update

**Type:** `truck_status_update`

```javascript
{
  "type": "truck_status_update",
  "timestamp": "2025-12-23T10:00:00.000Z",
  "data": {
    "truckId": 1,
    "plate": "B 9001 SIM",
    "status": "active" | "inactive" | "maintenance"
  }
}
```

#### Dashboard Update

**Type:** `dashboard_update`

```javascript
{
  "type": "dashboard_update",
  "timestamp": "2025-12-23T10:00:00.000Z",
  "data": {
    "totalTrucks": 6,
    "activeTrucks": 5,
    "activeAlerts": 3,
    "criticalAlerts": 1,
    "warningAlerts": 2
  }
}
```

#### Admin Activity

**Type:** `admin_activity`

```javascript
{
  "type": "admin_activity",
  "timestamp": "2025-12-23T10:00:00.000Z",
  "data": {
    "userId": 1,
    "username": "admin",
    "action": "truck_updated",
    "details": "Updated truck B 9001 SIM configuration"
  }
}
```

#### Connection Accepted

**Type:** `connection_accepted`

```javascript
{
  "type": "connection_accepted",
  "clientId": "abc-123-def-456",
  "message": "Connected to TPMS WebSocket",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

#### Error

**Type:** `error`

```javascript
{
  "type": "error",
  "code": "INVALID_MESSAGE" | "SUBSCRIPTION_FAILED" | "UNAUTHORIZED",
  "message": "Error description",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

---

## 📡 Subscription Channels

### Available Channels

| Channel | Description | Update Frequency |
|---------|-------------|------------------|
| `truck_updates` | GPS location & sensor data updates | Every 3 seconds |
| `alerts` | Alert notifications (new & resolved) | Real-time |
| `dashboard` | Dashboard statistics & metrics | On change |
| `admin_activities` | Admin action logs | Real-time |

### Managing Subscriptions

```javascript
// Subscribe to multiple channels
const subscribeToChannels = (ws, channels) => {
  channels.forEach(channel => {
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: channel
    }));
  });
};

// Usage
subscribeToChannels(ws, ['truck_updates', 'alerts']);

// Unsubscribe when not needed
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'truck_updates'
}));
```

---

## 💻 Implementation Examples

### Example 1: Real-Time Truck Map

```javascript
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function TruckMap() {
  const [trucks, setTrucks] = useState({});
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('wss://be-tpms.connectis.my.id/ws');

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      // Subscribe to truck updates
      websocket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'truck_updates'
      }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'truck_locations_update') {
        // Update truck position
        setTrucks(prev => ({
          ...prev,
          [message.data.truckId]: message.data
        }));
      }
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  return (
    <MapContainer center={[-3.547, 115.542]} zoom={12}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {Object.values(trucks).map(truck => (
        <Marker
          key={truck.truckId}
          position={[truck.location.lat, truck.location.long]}
        >
          <Popup>
            <div>
              <h3>{truck.plate}</h3>
              <p>Location: {truck.location.lat.toFixed(6)}, {truck.location.long.toFixed(6)}</p>
              <p>Sensors: {truck.sensors.length}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### Example 2: Alert Notification System

```javascript
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function AlertNotifications() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');

    ws.onopen = () => {
      // Subscribe to alerts
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'alerts'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_alert') {
        const alert = message.data;
        
        // Add to alert list
        setAlerts(prev => [alert, ...prev]);
        
        // Show toast notification
        const toastType = alert.alert.severity === 'critical' ? 'error' : 'warning';
        toast[toastType](
          `${alert.truck.plate}: ${alert.message}`,
          {
            position: 'top-right',
            autoClose: 5000,
          }
        );
        
        // Play sound for critical alerts
        if (alert.alert.severity === 'critical') {
          new Audio('/alert-sound.mp3').play();
        }
      } else if (message.type === 'alert_resolved') {
        // Update alert status
        setAlerts(prev => 
          prev.map(a => 
            a.id === message.data.id 
              ? { ...a, status: 'resolved' } 
              : a
          )
        );
        
        toast.success('Alert resolved', { autoClose: 3000 });
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="alert-list">
      <h2>Active Alerts ({alerts.filter(a => a.status === 'active').length})</h2>
      {alerts.map(alert => (
        <div 
          key={alert.id} 
          className={`alert-item ${alert.alert.severity} ${alert.status}`}
        >
          <span className="truck">{alert.truck.plate}</span>
          <span className="message">{alert.message}</span>
          <span className="time">{new Date(alert.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Real-Time Sensor Dashboard

```javascript
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

function SensorDashboard({ truckId }) {
  const [sensorData, setSensorData] = useState({});
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'truck_updates'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'truck_locations_update' && 
          message.data.truckId === truckId) {
        
        const sensors = message.data.sensors;
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        // Update current sensor data
        setSensorData(sensors.reduce((acc, sensor) => {
          acc[sensor.tireNo] = sensor;
          return acc;
        }, {}));
        
        // Update chart data (keep last 20 data points)
        setChartData(prev => {
          const newLabels = [...prev.labels, timestamp].slice(-20);
          const newDatasets = sensors.map(sensor => ({
            label: `Tire ${sensor.tireNo}`,
            data: [
              ...(prev.datasets.find(d => d.label === `Tire ${sensor.tireNo}`)?.data || []),
              sensor.tempValue
            ].slice(-20),
            borderColor: getColorForSensor(sensor.tireNo),
            tension: 0.1
          }));
          
          return {
            labels: newLabels,
            datasets: newDatasets
          };
        });
      }
    };

    return () => ws.close();
  }, [truckId]);

  return (
    <div className="sensor-dashboard">
      <h2>Real-Time Sensor Data</h2>
      
      {/* Current values */}
      <div className="sensor-grid">
        {Object.values(sensorData).map(sensor => (
          <div key={sensor.id} className="sensor-card">
            <h3>Tire {sensor.tireNo}</h3>
            <div className="temp">
              Temperature: <span className={getTempClass(sensor.tempValue)}>
                {sensor.tempValue.toFixed(1)}°C
              </span>
            </div>
            <div className="pressure">
              Pressure: <span className={getPressureClass(sensor.tirepValue)}>
                {sensor.tirepValue.toFixed(1)} PSI
              </span>
            </div>
            <div className="battery">
              Battery: {sensor.bat}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Temperature chart */}
      <div className="chart-container">
        <h3>Temperature Trend</h3>
        <Line data={chartData} options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              min: 50,
              max: 100
            }
          }
        }} />
      </div>
    </div>
  );
}

// Helper functions
function getTempClass(temp) {
  if (temp > 90) return 'critical';
  if (temp > 80) return 'warning';
  return 'normal';
}

function getPressureClass(pressure) {
  if (pressure < 85 || pressure > 110) return 'critical';
  if (pressure < 90 || pressure > 105) return 'warning';
  return 'normal';
}

function getColorForSensor(tireNo) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];
  return colors[tireNo - 1] || '#999';
}
```

### Example 4: Connection Manager with Auto-Reconnect

```javascript
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.listeners = new Map();
    this.subscriptions = new Set();
    
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Re-subscribe to previous channels
        this.subscriptions.forEach(channel => {
          this.subscribe(channel);
        });
        
        this.emit('connect');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit('message', message);
          this.emit(message.type, message.data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.emit('disconnect', event);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  subscribe(channel) {
    this.subscriptions.add(channel);
    if (this.isConnected()) {
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);
    if (this.isConnected()) {
      this.send({
        type: 'unsubscribe',
        channel: channel
      });
    }
  }

  send(message) {
    if (this.isConnected()) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage
const wsManager = new WebSocketManager('wss://be-tpms.connectis.my.id/ws', {
  maxReconnectAttempts: 5,
  reconnectDelay: 3000
});

// Listen to events
wsManager.on('connect', () => {
  console.log('Connected!');
});

wsManager.on('new_alert', (alert) => {
  console.log('New alert:', alert);
});

wsManager.on('truck_locations_update', (data) => {
  console.log('Truck update:', data);
});

// Subscribe to channels
wsManager.subscribe('truck_updates');
wsManager.subscribe('alerts');

// Send custom message
wsManager.send({ type: 'ping' });
```

---

## ⚠️ Error Handling

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_MESSAGE` | Invalid JSON or message format | Check message structure |
| `SUBSCRIPTION_FAILED` | Invalid channel name | Use valid channel names |
| `UNAUTHORIZED` | Authentication failed | Check credentials |
| `RATE_LIMIT` | Too many messages | Reduce message frequency |

### Error Handling Example

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  
  // Show user notification
  showNotification({
    type: 'error',
    message: 'Connection error. Trying to reconnect...'
  });
};

ws.onclose = (event) => {
  // Normal closure
  if (event.code === 1000) {
    console.log('WebSocket closed normally');
    return;
  }
  
  // Abnormal closure
  console.error('WebSocket closed abnormally:', event.code, event.reason);
  
  // Attempt reconnect
  setTimeout(() => {
    reconnectWebSocket();
  }, 5000);
};

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    
    if (message.type === 'error') {
      console.error('Server error:', message.code, message.message);
      handleServerError(message);
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};
```

---

## ✅ Best Practices

### 1. Connection Management

```javascript
// ✅ Good: Handle reconnection
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connectWebSocket() {
  const ws = new WebSocket(url);
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 3000);
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}

// ❌ Bad: No reconnection logic
const ws = new WebSocket(url);
```

### 2. Subscription Management

```javascript
// ✅ Good: Track subscriptions
const activeSubscriptions = new Set();

function subscribe(channel) {
  if (!activeSubscriptions.has(channel)) {
    ws.send(JSON.stringify({ type: 'subscribe', channel }));
    activeSubscriptions.add(channel);
  }
}

function unsubscribeAll() {
  activeSubscriptions.forEach(channel => {
    ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
  });
  activeSubscriptions.clear();
}

// ❌ Bad: Duplicate subscriptions
ws.send(JSON.stringify({ type: 'subscribe', channel: 'alerts' }));
ws.send(JSON.stringify({ type: 'subscribe', channel: 'alerts' })); // Duplicate!
```

### 3. Memory Management

```javascript
// ✅ Good: Clean up on unmount
useEffect(() => {
  const ws = new WebSocket(url);
  
  return () => {
    ws.close();
  };
}, []);

// ❌ Bad: Memory leak
useEffect(() => {
  const ws = new WebSocket(url);
  // No cleanup!
}, []);
```

### 4. Message Validation

```javascript
// ✅ Good: Validate messages
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    
    if (!message.type) {
      console.warn('Invalid message: missing type');
      return;
    }
    
    handleMessage(message);
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
};

// ❌ Bad: No validation
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message); // May crash!
};
```

### 5. Performance Optimization

```javascript
// ✅ Good: Batch updates
let updateQueue = [];
let updateTimer = null;

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  updateQueue.push(message);
  
  if (!updateTimer) {
    updateTimer = setTimeout(() => {
      processBatchUpdates(updateQueue);
      updateQueue = [];
      updateTimer = null;
    }, 100);
  }
};

// ❌ Bad: Update on every message
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  updateUI(message); // May cause performance issues
};
```

---

## 🔧 Troubleshooting

### Issue: Connection Fails

**Symptoms:** Cannot establish WebSocket connection

**Solutions:**
1. Check URL format (must start with `ws://` or `wss://`)
2. Verify server is running
3. Check firewall/proxy settings
4. Try connecting via browser console:
   ```javascript
   const ws = new WebSocket('wss://be-tpms.connectis.my.id/ws');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```

### Issue: No Messages Received

**Symptoms:** Connected but not receiving updates

**Solutions:**
1. Verify subscription:
   ```javascript
   ws.send(JSON.stringify({ type: 'subscribe', channel: 'truck_updates' }));
   ```
2. Check message handler:
   ```javascript
   ws.onmessage = (event) => {
     console.log('Raw message:', event.data);
   };
   ```
3. Confirm server is broadcasting (check server logs)

### Issue: Frequent Disconnections

**Symptoms:** Connection drops repeatedly

**Solutions:**
1. Implement ping/pong:
   ```javascript
   setInterval(() => {
     if (ws.readyState === WebSocket.OPEN) {
       ws.send(JSON.stringify({ type: 'ping' }));
     }
   }, 30000); // Every 30 seconds
   ```
2. Check network stability
3. Increase timeout settings

### Issue: High Memory Usage

**Symptoms:** Application slows down over time

**Solutions:**
1. Limit stored messages:
   ```javascript
   const MAX_MESSAGES = 100;
   setMessages(prev => [...prev, newMsg].slice(-MAX_MESSAGES));
   ```
2. Unsubscribe from unused channels
3. Clean up event listeners
4. Use React.memo / useMemo for expensive components

---

## 📊 Data Specifications

### Sensor Status Values

| Status | Temperature | Pressure | Description |
|--------|-------------|----------|-------------|
| `normal` | 55-79°C | 90-105 PSI | Optimal operating range |
| `warning` | 80-90°C | 86-89 or 106-110 PSI | Approaching limits |
| `critical` | >90°C | <85 or >110 PSI | Immediate attention required |

### Alert Severity Levels

- **`critical`**: Requires immediate action (temp >90°C or pressure <85/>110 PSI)
- **`warning`**: Monitor closely (temp >80°C)
- **`info`**: Informational only

### Truck Status Values

- **`active`**: Currently operating
- **`inactive`**: Parked/not in use
- **`maintenance`**: Under maintenance

---

## 📝 Quick Reference

### Connection URLs

```
Production:  wss://be-tpms.connectis.my.id/ws
Development: ws://localhost:3001
```

### Message Types (Client → Server)

- `subscribe` - Subscribe to channel
- `unsubscribe` - Unsubscribe from channel  
- `ping` - Keep-alive ping

### Message Types (Server → Client)

- `connection_accepted` - Connection established
- `truck_locations_update` - Truck GPS + sensor data
- `new_alert` - New alert notification
- `alert_resolved` - Alert resolved
- `truck_status_update` - Truck status changed
- `dashboard_update` - Dashboard metrics
- `admin_activity` - Admin action logged
- `pong` - Ping response
- `error` - Error message

### Channels

- `truck_updates` - Real-time truck location & sensors
- `alerts` - Alert notifications
- `dashboard` - Dashboard statistics
- `admin_activities` - Admin activity logs

---

## 🎓 Additional Resources

- **API Documentation**: `API_ENDPOINTS.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Frontend Guide**: `FRONTEND_COMPLETE_GUIDE.md`
- **Postman Collection**: `postman/TPMS.postman_collection.json`

---

## 📞 Support

Jika mengalami masalah atau memiliki pertanyaan:

1. Cek troubleshooting section di atas
2. Review server logs untuk error messages
3. Test koneksi menggunakan browser console
4. Verify subscription channels sudah benar

---

**Last Updated:** December 23, 2025  
**Version:** 2.0  
**Server URL:** wss://be-tpms.connectis.my.id/ws

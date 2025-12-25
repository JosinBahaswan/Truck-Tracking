# 🚨 Alert Resolve Feature - Documentation

**Feature:** Alert resolution untuk menandai alert sudah di-fix/di-resolve  
**Status:** ✅ **SUDAH TERSEDIA** (Already implemented)  
**Date:** 24 Desember 2025

---

## ✅ FITUR SUDAH ADA!

Alert resolve feature **SUDAH TERSEDIA** di backend dengan fitur lengkap:

### **Yang Sudah Ada:**
1. ✅ **Database field** `resolved_at` di table `alert_events`
2. ✅ **API endpoint** untuk resolve alert
3. ✅ **WebSocket broadcast** saat alert di-resolve
4. ✅ **Controller function** lengkap dengan validation
5. ✅ **Notes/keterangan** untuk resolution

---

## 📊 DATABASE SCHEMA

### **Table: `alert_events`**

```sql
CREATE TABLE alert_events (
  id          SERIAL PRIMARY KEY,
  alert_id    INT NOT NULL,
  device_id   INT,
  sensor_id   INT,
  truck_id    INT,
  value       REAL,
  message     TEXT,
  status      VARCHAR(20) DEFAULT 'active',  -- 'active' or 'resolved'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL,              -- ✅ Field untuk timestamp resolve
  
  FOREIGN KEY (alert_id) REFERENCES alert(id),
  FOREIGN KEY (device_id) REFERENCES device(id),
  FOREIGN KEY (sensor_id) REFERENCES sensor(id),
  FOREIGN KEY (truck_id) REFERENCES truck(id)
);

CREATE INDEX idx_alert_events_status ON alert_events(status);
```

**Fields penting:**
- `status`: `'active'` atau `'resolved'`
- `resolved_at`: Timestamp kapan alert di-resolve (NULL jika belum)

---

## 🌐 API ENDPOINTS

### **1. Resolve Alert**

**Endpoint:**
```
PATCH /api/alerts/:id/resolve
```

**Method:** `PATCH`  
**Authentication:** Required (JWT token)

**Request:**

```javascript
// Headers
Authorization: Bearer <token>
Content-Type: application/json

// Body (optional)
{
  "notes": "Tire inspected and replaced. Temperature back to normal."
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": 123,
    "alert_id": 1,
    "device_id": 1,
    "sensor_id": 1,
    "truck_id": 1,
    "value": 102.3,
    "message": "Critical: Tire 1 temperature 102.3°C\nResolution notes: Tire inspected and replaced. Temperature back to normal.",
    "status": "resolved",
    "created_at": "2025-12-24T10:30:00.000Z",
    "resolved_at": "2025-12-24T11:15:00.000Z",
    "alert": {
      "id": 1,
      "code": "TIRE_TEMP_CRITICAL",
      "name": "Critical Tire Temperature",
      "severity": "critical"
    },
    "truck": {
      "id": 1,
      "plate": "B 9001 SIM",
      "name": "Simulator Truck SIM01"
    },
    "sensor": {
      "id": 1,
      "tireNo": 1,
      "tempValue": 72.5,
      "tirepValue": 108.3
    }
  }
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Alert not found"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "message": "Alert already resolved"
}
```

---

### **2. Get Active Alerts (Unresolved)**

**Endpoint:**
```
GET /api/alerts/active
```

**Query Parameters:**
- `truck_id` (optional): Filter by truck ID
- `severity` (optional): Filter by severity (critical, warning)

**Response:**

```json
{
  "success": true,
  "message": "Active alerts retrieved successfully",
  "data": [
    {
      "id": 125,
      "alert_code": "TIRE_TEMP_CRITICAL",
      "severity": "critical",
      "truck_id": 1,
      "truck_plate": "B 9001 SIM",
      "sensor_tireNo": 1,
      "value": 102.3,
      "message": "Critical: Tire 1 temperature 102.3°C",
      "status": "active",
      "created_at": "2025-12-24T11:00:00.000Z",
      "resolved_at": null
    }
    // ... more active alerts
  ],
  "count": 5
}
```

---

### **3. Get All Alerts (With Filters)**

**Endpoint:**
```
GET /api/alerts
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional): `'active'` or `'resolved'`
- `truck_id` (optional)
- `severity` (optional)
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)
- `sortBy` (default: `'created_at'`)
- `sortOrder` (default: `'desc'`)

**Example:**

```
GET /api/alerts?status=resolved&truck_id=1&limit=50&page=1
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "status": "resolved",
      "created_at": "2025-12-24T10:30:00.000Z",
      "resolved_at": "2025-12-24T11:15:00.000Z",
      "message": "Critical: Tire 1 temperature 102.3°C\nResolution notes: Fixed",
      "truck": {
        "plate": "B 9001 SIM"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

## 📡 WEBSOCKET BROADCAST

Saat alert di-resolve, backend akan broadcast message ke semua connected clients:

### **Message Type: `alert_resolved`**

```json
{
  "type": "alert_resolved",
  "timestamp": "2025-12-24T11:15:00.000Z",
  "data": {
    "id": 123,
    "alert_code": "TIRE_TEMP_CRITICAL",
    "alert_name": "Critical Tire Temperature",
    "severity": "critical",
    "truck_id": 1,
    "truck_plate": "B 9001 SIM",
    "resolved_at": "2025-12-24T11:15:00.000Z"
  }
}
```

### **Frontend Integration:**

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'alert_resolved') {
    handleAlertResolved(message.data);
  }
};

function handleAlertResolved(data) {
  // Update UI - remove alert dari active list
  removeAlertFromList(data.id);
  
  // Show toast notification
  toast.success(`Alert resolved: ${data.truck_plate}`);
  
  // Update truck status icon (jika tidak ada alert lagi)
  updateTruckStatus(data.truck_id);
}
```

---

## 🎨 FRONTEND IMPLEMENTATION

### **1. Resolve Button Component**

```jsx
const ResolveAlertButton = ({ alert, onResolved }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  
  const handleResolve = async () => {
    setIsResolving(true);
    
    try {
      const response = await fetch(`/api/alerts/${alert.id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Alert resolved successfully');
        onResolved(alert.id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to resolve alert');
    } finally {
      setIsResolving(false);
      setShowNotesDialog(false);
      setNotes('');
    }
  };
  
  return (
    <>
      <button
        onClick={() => setShowNotesDialog(true)}
        disabled={isResolving}
        className="resolve-btn"
      >
        {isResolving ? 'Resolving...' : 'Resolve Alert'}
      </button>
      
      {showNotesDialog && (
        <Dialog>
          <h3>Resolve Alert</h3>
          <p>Alert: {alert.message}</p>
          
          <textarea
            placeholder="Add resolution notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          
          <div className="dialog-actions">
            <button onClick={() => setShowNotesDialog(false)}>
              Cancel
            </button>
            <button onClick={handleResolve} className="primary">
              Confirm Resolve
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
};
```

---

### **2. Alert List with Resolve**

```jsx
const AlertList = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' or 'resolved'
  
  useEffect(() => {
    fetchAlerts();
    
    // Listen to WebSocket for real-time updates
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_alert') {
        setActiveAlerts(prev => [message.data, ...prev]);
      }
      
      if (message.type === 'alert_resolved') {
        setActiveAlerts(prev => prev.filter(a => a.id !== message.data.id));
        fetchResolvedAlerts(); // Refresh resolved list
      }
    };
  }, []);
  
  const fetchAlerts = async () => {
    const response = await fetch('/api/alerts/active', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setActiveAlerts(data.data);
  };
  
  const fetchResolvedAlerts = async () => {
    const response = await fetch('/api/alerts?status=resolved&limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setResolvedAlerts(data.data);
  };
  
  const handleAlertResolved = (alertId) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    fetchResolvedAlerts();
  };
  
  return (
    <div className="alert-list">
      <div className="tabs">
        <button 
          className={tab === 'active' ? 'active' : ''}
          onClick={() => setTab('active')}
        >
          Active Alerts ({activeAlerts.length})
        </button>
        <button 
          className={tab === 'resolved' ? 'active' : ''}
          onClick={() => { setTab('resolved'); fetchResolvedAlerts(); }}
        >
          Resolved Alerts
        </button>
      </div>
      
      {tab === 'active' ? (
        <div className="active-alerts">
          {activeAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert}
              onResolve={handleAlertResolved}
            />
          ))}
        </div>
      ) : (
        <div className="resolved-alerts">
          {resolvedAlerts.map(alert => (
            <ResolvedAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### **3. Alert Card with Status**

```jsx
const AlertCard = ({ alert, onResolve }) => {
  const isResolved = alert.status === 'resolved';
  
  return (
    <div className={`alert-card ${alert.severity} ${isResolved ? 'resolved' : ''}`}>
      <div className="alert-header">
        <div className="truck-info">
          <span className="truck-plate">{alert.truck_plate}</span>
          <span className="tire-number">Tire #{alert.sensor_tireNo}</span>
        </div>
        
        <div className="alert-status">
          <span className={`severity-badge ${alert.severity}`}>
            {alert.severity.toUpperCase()}
          </span>
          
          {isResolved && (
            <span className="resolved-badge">
              ✅ Resolved
            </span>
          )}
        </div>
      </div>
      
      <div className="alert-body">
        <p className="alert-message">{alert.message}</p>
        
        <div className="alert-meta">
          <span>📅 {formatDate(alert.created_at)}</span>
          <span>🕐 {formatTime(alert.created_at)}</span>
          {alert.value && (
            <span>📊 Value: {alert.value.toFixed(1)}</span>
          )}
        </div>
        
        {isResolved && alert.resolved_at && (
          <div className="resolved-info">
            <span>✅ Resolved at: {formatDateTime(alert.resolved_at)}</span>
          </div>
        )}
      </div>
      
      <div className="alert-footer">
        {!isResolved && (
          <ResolveAlertButton 
            alert={alert} 
            onResolved={onResolve}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 🧪 TESTING

### **1. Test Resolve Alert via API**

```bash
# Get active alerts
curl -X GET "http://localhost:3001/api/alerts/active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Resolve alert dengan notes
curl -X PATCH "http://localhost:3001/api/alerts/123/resolve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Tire checked and replaced. Issue resolved."
  }'

# Verify alert is resolved
curl -X GET "http://localhost:3001/api/alerts/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **2. Test via WebSocket**

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'alerts'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Message received:', message);
  
  if (message.type === 'alert_resolved') {
    console.log('✅ Alert resolved:', message.data);
  }
};

// Resolve alert (via API)
// Then check WebSocket receives broadcast
```

---

### **3. Database Verification**

```sql
-- Check active alerts
SELECT 
  id, 
  truck_id, 
  message, 
  status, 
  created_at, 
  resolved_at 
FROM alert_events 
WHERE status = 'active'
ORDER BY created_at DESC 
LIMIT 10;

-- Check resolved alerts
SELECT 
  id, 
  truck_id, 
  message, 
  status, 
  created_at, 
  resolved_at,
  EXTRACT(EPOCH FROM (resolved_at - created_at))/60 as resolution_time_minutes
FROM alert_events 
WHERE status = 'resolved'
ORDER BY resolved_at DESC 
LIMIT 10;

-- Statistics: Average resolution time
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as avg_resolution_minutes,
  MIN(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as min_resolution_minutes,
  MAX(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as max_resolution_minutes
FROM alert_events 
WHERE status = 'resolved';
```

---

## 📊 STATISTICS & REPORTING

### **Alert Resolution Metrics:**

```javascript
// API endpoint untuk stats
GET /api/alerts/stats?days=7

// Response includes resolution metrics:
{
  "summary": {
    "total": 250,
    "active": 5,
    "resolved": 245
  },
  "resolution_rate": "98%",
  "avg_resolution_time_minutes": 45.3
}
```

---

## ✅ SUMMARY

### **Fitur yang Sudah Ada:**

1. ✅ **Database field** `resolved_at` di `alert_events` table
2. ✅ **API endpoint** `PATCH /api/alerts/:id/resolve`
3. ✅ **Resolution notes** support (optional message)
4. ✅ **WebSocket broadcast** `alert_resolved` message
5. ✅ **Status tracking** (`active` → `resolved`)
6. ✅ **Validation** (check if already resolved, check if exists)
7. ✅ **Get active alerts** endpoint (`/api/alerts/active`)
8. ✅ **Filter by status** di main alerts endpoint

### **Yang Perlu Diimplementasi di Frontend:**

1. ❌ **Resolve button** di alert card
2. ❌ **Resolution notes dialog**
3. ❌ **Active/Resolved tabs** di alert list
4. ❌ **WebSocket listener** untuk `alert_resolved`
5. ❌ **UI update** saat alert di-resolve
6. ❌ **Toast notifications** untuk success/error

---

**Status:** ✅ Backend sudah lengkap, tinggal implementasi di Frontend!

**Next Steps:**
1. Implementasi UI components di Frontend
2. Integrate dengan WebSocket untuk real-time updates
3. Test resolve functionality
4. Add statistics dashboard untuk resolution metrics

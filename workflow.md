"# 📊 DIAGRAM ALUR KERJA - TRUCK TRACKING SYSTEM

Dokumen ini berisi berbagai diagram alur kerja untuk sistem Truck Tracking dari input hingga output backend.

---

## 📌 Daftar Diagram

1. [Diagram Arsitektur Sistem](#1-diagram-arsitektur-sistem)
2. [Alur Kerja Umum (Input → Output)](#2-alur-kerja-umum-input--output)
3. [Alur Autentikasi (Login)](#3-alur-autentikasi-login)
4. [Alur Live Tracking](#4-alur-live-tracking)
5. [Alur History Tracking](#5-alur-history-tracking)
6. [Alur CRUD Operations](#6-alur-crud-operations)
7. [Alur Monitoring TPMS](#7-alur-monitoring-tpms)
8. [Alur WebSocket Real-time](#8-alur-websocket-real-time)
9. [Alur Data Flow Lengkap](#9-alur-data-flow-lengkap)

---

## 1. Diagram Arsitektur Sistem

```mermaid
graph TB
    subgraph \"User Interface Layer\"
        A[Web Browser]
    end

    subgraph \"Frontend Application - React\"
        B[React Router]
        C[Components]
        D[Pages]
        E[Services]
        F[Hooks]
    end

    subgraph \"Communication Layer\"
        G[Axios HTTP Client]
        H[Socket.io Client]
        I[WebSocket]
    end

    subgraph \"Backend Services\"
        J[Backend 1<br/>Tracking API]
        K[Backend 2<br/>Management API]
    end

    subgraph \"Data Layer\"
        L[MongoDB<br/>Database]
    end

    subgraph \"IoT Layer\"
        M[GPS Trackers]
        N[TPMS Sensors]
        O[Fuel Sensors]
        P[Temperature Sensors]
    end

    A --> B
    B --> C
    B --> D
    C --> F
    D --> E
    E --> G
    E --> H
    G --> J
    G --> K
    H --> I
    I --> K
    J --> M
    J --> N
    J --> O
    J --> P
    K --> L

    style A fill:#e1f5ff
    style J fill:#ffe1e1
    style K fill:#ffe1e1
    style L fill:#fff4e1
    style M fill:#e1ffe1
    style N fill:#e1ffe1
    style O fill:#e1ffe1
    style P fill:#e1ffe1
```

---

## 2. Alur Kerja Umum (Input → Output)

### Diagram Alur

```mermaid
graph TD
    A[👤 User Input] --> B{Jenis Request?}
    
    B -->|Login/Auth| C[📝 Form Login]
    B -->|CRUD Data| D[📋 Form Management]
    B -->|Real-time| E[🔄 WebSocket Request]
    B -->|View Data| F[📊 Fetch Request]
    
    C --> G[Auth API<br/>POST /auth/login]
    D --> H[Management API<br/>CRUD Endpoints]
    E --> I[WebSocket Connection<br/>Subscribe Channel]
    F --> J[REST API<br/>GET Request]
    
    G --> K[Backend 2<br/>Auth Service]
    H --> L[Backend 2<br/>Management Service]
    I --> M[Backend 2<br/>WebSocket Server]
    J --> N{Tracking<br/>atau<br/>Management?}
    
    N -->|Tracking| O[Backend 1<br/>Tracking API]
    N -->|Management| L
    
    K --> P{Credentials<br/>Valid?}
    P -->|✅ Yes| Q[Generate JWT Token]
    P -->|❌ No| R[Return Error]
    
    Q --> S[Store in localStorage]
    S --> T[Update React State]
    T --> U[Redirect to Dashboard]
    
    L --> V[Database Operations]
    V --> W{DB<br/>Success?}
    W -->|✅ Yes| X[Return Data]
    W -->|❌ No| Y[Return Error]
    
    X --> Z[Update UI State]
    Y --> AA[Show Error Message]
    
    O --> AB[Get Tracking Data]
    AB --> AC[Process Data]
    AC --> Z
    
    M --> AD[Real-time Updates]
    AD --> AE[Update Components]
    
    R --> AA
    U --> AF[✅ Success Display]
    Z --> AF
    AE --> AF
    AA --> AF
    
    AF[🖥️ User Interface Updated]

    style A fill:#e1f5ff
    style AF fill:#e1ffe1
    style P fill:#fff4e1
    style W fill:#fff4e1
```

### Penjelasan Alur

1. **User Input**: User memberikan input melalui interface (form, button, dll)
2. **Routing**: Request diklasifikasikan berdasarkan jenis (auth, CRUD, real-time, view)
3. **API Call**: Frontend mengirim request ke backend yang sesuai
4. **Backend Processing**: Backend memproses request (validasi, database operation, dll)
5. **Response**: Backend mengirim response (success atau error)
6. **State Update**: Frontend update React state dengan data baru
7. **UI Update**: Component re-render dan tampilkan data terbaru

---

## 3. Alur Autentikasi (Login)

```mermaid
sequenceDiagram
    actor User
    participant LoginForm
    participant useAuth Hook
    participant AuthAPI
    participant Axios
    participant Backend2
    participant Database
    participant LocalStorage
    participant Router
    
    User->>LoginForm: 1. Input username & password
    User->>LoginForm: 2. Click \"Login\" button
    
    LoginForm->>useAuth Hook: 3. login(credentials)
    useAuth Hook->>LocalStorage: 4. Clear old tokens
    Note over LocalStorage: localStorage.clear()
    
    useAuth Hook->>AuthAPI: 5. authApi.login(credentials)
    AuthAPI->>Axios: 6. POST /auth/login
    Note over Axios: Headers: Content-Type: application/json
    
    Axios->>Backend2: 7. HTTP Request
    Backend2->>Database: 8. SELECT user WHERE username
    Database-->>Backend2: 9. User data
    
    Backend2->>Backend2: 10. Verify password (bcrypt)
    
    alt Password Valid
        Backend2->>Backend2: 11. Generate JWT token
        Backend2-->>Axios: 12. {success:true, token, user}
        Axios-->>AuthAPI: 13. Response data
        
        AuthAPI->>LocalStorage: 14. Store token
        Note over LocalStorage: authToken, token
        AuthAPI->>LocalStorage: 15. Store user data
        Note over LocalStorage: JSON.stringify(user)
        
        AuthAPI->>Window: 16. dispatchEvent('loginSuccess')
        AuthAPI-->>useAuth Hook: 17. {success: true}
        
        useAuth Hook->>useAuth Hook: 18. setIsAuthenticated(true)
        useAuth Hook->>useAuth Hook: 19. setUser(userData)
        useAuth Hook-->>LoginForm: 20. Success response
        
        LoginForm->>Router: 21. navigate('/dashboard')
        Router->>User: 22. Display Dashboard
        
    else Password Invalid
        Backend2-->>Axios: 12. {success:false, message}
        Axios-->>AuthAPI: 13. Error response
        AuthAPI-->>useAuth Hook: 14. {success: false}
        useAuth Hook-->>LoginForm: 15. Error message
        LoginForm->>User: 16. Display error alert
    end
```

### Detail Proses

**Step 1-2: User Input**
- User mengisi form dengan username dan password
- Click button \"Login\"

**Step 3-6: Frontend Processing**
- LoginForm call `useAuth` hook
- Hook clear localStorage untuk hapus token lama
- Call AuthAPI untuk kirim credentials
- Axios buat HTTP POST request

**Step 7-10: Backend Validation**
- Backend terima request
- Query database untuk cari user
- Verify password dengan bcrypt
- Validasi credentials

**Step 11-15: Token Generation (Success Path)**
- Generate JWT token dengan payload user info
- Return token + user data ke frontend
- Frontend store di localStorage
- Dispatch event 'loginSuccess'

**Step 16-22: UI Update**
- Update React state (isAuthenticated, user)
- Redirect ke dashboard
- Dashboard load dengan user data

---

## 4. Alur Live Tracking

```mermaid
sequenceDiagram
    actor User
    participant LiveTrackingPage
    participant TrackingAPI
    participant Axios
    participant Backend1
    participant GPS_Devices
    participant WebSocket
    participant Backend2
    participant LeafletMap
    
    User->>LiveTrackingPage: 1. Open /live-tracking
    
    Note over LiveTrackingPage: Component Mount (useEffect)
    
    LiveTrackingPage->>TrackingAPI: 2. getLiveTracking()
    TrackingAPI->>Axios: 3. GET /api/trucks/live-tracking
    Note over Axios: Headers: Authorization Bearer {token}
    
    Axios->>Backend1: 4. HTTP Request
    Backend1->>GPS_Devices: 5. Get latest positions
    GPS_Devices-->>Backend1: 6. Location data
    
    Backend1->>Backend1: 7. Enrich with truck data
    Backend1-->>Axios: 8. {trucks: [...], summary}
    Axios-->>TrackingAPI: 9. Response data
    TrackingAPI-->>LiveTrackingPage: 10. Trucks data
    
    LiveTrackingPage->>LiveTrackingPage: 11. Process truck data
    LiveTrackingPage->>LeafletMap: 12. Render markers
    Note over LeafletMap: Create marker for each truck<br/>Color by status: green/yellow/red
    
    LeafletMap->>User: 13. Display map with markers
    
    Note over LiveTrackingPage: Setup WebSocket Connection
    
    LiveTrackingPage->>WebSocket: 14. Connect to WS
    WebSocket->>Backend2: 15. WS Handshake
    Backend2-->>WebSocket: 16. Connection established
    
    LiveTrackingPage->>WebSocket: 17. subscribe('truck_updates')
    WebSocket->>Backend2: 18. Subscribe request
    Backend2-->>WebSocket: 19. Subscription confirmed
    
    Note over LiveTrackingPage,Backend2: Real-time Updates Loop
    
    loop Every 3-5 seconds
        GPS_Devices->>Backend1: 20. Send new location
        Backend1->>Backend2: 21. Forward location update
        Backend2->>Backend2: 22. Store in database
        Backend2->>WebSocket: 23. Emit 'truck_locations_update'
        WebSocket->>LiveTrackingPage: 24. New location data
        
        LiveTrackingPage->>LiveTrackingPage: 25. Update state
        LiveTrackingPage->>LeafletMap: 26. Update marker position
        Note over LeafletMap: Animate marker movement
        LeafletMap->>User: 27. See live movement
    end
    
    User->>LeafletMap: 28. Click truck marker
    LeafletMap->>LiveTrackingPage: 29. Marker click event
    LiveTrackingPage->>LeafletMap: 30. Show popup
    LeafletMap->>User: 31. Display truck details
```

### Komponen Data Live Tracking

**Initial Data Load:**
```javascript
{
  success: true,
  data: {
    trucks: [
      {
        truck_id: 1,
        plate_number: \"B 9001 SIM\",
        truck_name: \"Simulator Truck SIM01\",
        status: \"active\",
        location: {
          latitude: -3.567821,
          longitude: 115.647158,
          recorded_at: \"2025-01-15T10:30:00Z\"
        },
        driver: { name, phone },
        device: { serial_number, battery },
        sensors: [...]
      }
    ],
    summary: {
      total_trucks: 50,
      trucks_with_location: 48
    }
  }
}
```

**WebSocket Update Message:**
```javascript
{
  type: 'truck_locations_update',
  data: {
    truck_id: 1,
    location: {
      latitude: -3.567900,
      longitude: 115.647200,
      recorded_at: \"2025-01-15T10:30:15Z\"
    },
    speed: 45,
    status: \"active\"
  }
}
```

---

## 5. Alur History Tracking

```mermaid
sequenceDiagram
    actor User
    participant HistoryPage
    participant TruckSelector
    participant DatePicker
    participant TrackingAPI
    participant Backend1
    participant Database
    participant MapComponent
    participant AnimationController
    
    User->>HistoryPage: 1. Open /history-tracking
    HistoryPage->>User: 2. Show truck selector & date picker
    
    User->>TruckSelector: 3. Select truck
    TruckSelector->>HistoryPage: 4. truckId selected
    
    User->>DatePicker: 5. Select date range
    DatePicker->>HistoryPage: 6. startDate, endDate
    
    User->>HistoryPage: 7. Click \"Load History\"
    
    HistoryPage->>TrackingAPI: 8. getTruckTracking(truckId)
    Note over TrackingAPI: No limit - get all history
    
    TrackingAPI->>Backend1: 9. GET /api/trucks/:id/tracking
    Note over Backend1: Query params: none<br/>(backend returns all history)
    
    Backend1->>Database: 10. SELECT all location_history<br/>WHERE truck_id
    Note over Database: No LIMIT in query<br/>Return all points
    
    Database-->>Backend1: 11. All location points
    Backend1->>Backend1: 12. Sort by timestamp ASC
    Backend1-->>TrackingAPI: 13. {location_history: [...]}
    Note over TrackingAPI: Could be 100s or 1000s of points
    
    TrackingAPI-->>HistoryPage: 14. Full history data
    
    HistoryPage->>HistoryPage: 15. Process route data
    Note over HistoryPage: Calculate:<br/>- Total distance<br/>- Duration<br/>- Average speed
    
    HistoryPage->>MapComponent: 16. Draw polyline route
    Note over MapComponent: Draw line connecting all points<br/>Add directional arrows
    
    MapComponent->>MapComponent: 17. Add start/end markers
    MapComponent->>MapComponent: 18. Fit bounds to route
    MapComponent->>User: 19. Display complete route
    
    User->>HistoryPage: 20. Click \"Play\" button
    HistoryPage->>AnimationController: 21. startReplay()
    
    AnimationController->>AnimationController: 22. Initialize variables
    Note over AnimationController: currentIndex = 0<br/>speed = 1x<br/>playing = true
    
    loop Replay Animation
        AnimationController->>AnimationController: 23. Get next point
        AnimationController->>MapComponent: 24. Update marker position
        
        MapComponent->>MapComponent: 25. Animate marker
        Note over MapComponent: Smooth transition to new position
        
        MapComponent->>User: 26. See marker movement
        
        AnimationController->>AnimationController: 27. Update timestamp display
        AnimationController->>AnimationController: 28. Update progress bar
        
        AnimationController->>AnimationController: 29. Wait interval
        Note over AnimationController: Delay based on speed:<br/>1x = 1000ms<br/>2x = 500ms<br/>5x = 200ms
        
        alt User clicks Pause
            User->>AnimationController: 30a. Pause
            AnimationController->>AnimationController: 30b. playing = false
        else User changes speed
            User->>AnimationController: 31a. Change speed
            AnimationController->>AnimationController: 31b. Update interval
        else Reached end
            AnimationController->>AnimationController: 32. playing = false
            AnimationController->>User: 33. Show \"Replay Complete\"
        end
    end
```

### Data Structure History

**Request:**
```http
GET /api/trucks/1/tracking HTTP/1.1
Authorization: Bearer {token}
```

**Response (All History - No Limit):**
```javascript
{
  success: true,
  data: {
    truck_id: 1,
    plate_number: \"B 9001 SIM\",
    current_location: {
      latitude: -3.567821,
      longitude: 115.647158,
      recorded_at: \"2025-01-15T14:30:00Z\"
    },
    location_history: [
      // All points from backend - could be 1000+ points
      {
        latitude: -3.577821,
        longitude: 115.645158,
        recorded_at: \"2025-01-15T08:00:00Z\"
      },
      {
        latitude: -3.576821,
        longitude: 115.647158,
        recorded_at: \"2025-01-15T08:03:00Z\"
      },
      // ... hundreds or thousands more points ...
      {
        latitude: -3.567821,
        longitude: 115.647158,
        recorded_at: \"2025-01-15T14:30:00Z\"
      }
    ],
    statistics: {
      total_points: 1234,
      total_distance_km: 156.7,
      duration_hours: 6.5,
      average_speed_kmh: 24.1
    }
  }
}
```

---

## 6. Alur CRUD Operations

### Create Operation

```mermaid
sequenceDiagram
    actor User
    participant ListPage
    participant Router
    participant FormPage
    participant FormValidation
    participant ManagementAPI
    participant Backend2
    participant Database
    participant Notification
    
    User->>ListPage: 1. Click \"Add New\" button
    ListPage->>Router: 2. navigate('/trucks/new')
    Router->>FormPage: 3. Load TruckForm (mode: create)
    FormPage->>User: 4. Display empty form
    
    User->>FormPage: 5. Fill form fields
    Note over FormPage: - Plate number<br/>- Truck name<br/>- Model, Type<br/>- Vendor<br/>- etc.
    
    User->>FormPage: 6. Click \"Submit\"
    
    FormPage->>FormValidation: 7. Validate form data
    
    alt Validation Failed
        FormValidation-->>FormPage: 8a. Validation errors
        FormPage->>User: 8b. Show error messages
    else Validation Success
        FormValidation-->>FormPage: 9. Data valid
        
        FormPage->>FormPage: 10. setLoading(true)
        FormPage->>ManagementAPI: 11. trucksApi.create(data)
        
        ManagementAPI->>Backend2: 12. POST /api/fleet/trucks
        Note over Backend2: Headers:<br/>Authorization: Bearer {token}<br/>Content-Type: application/json
        
        Backend2->>Backend2: 13. Validate token
        Backend2->>Backend2: 14. Validate business rules
        Note over Backend2: - Unique plate number<br/>- Valid vendor<br/>- Required fields
        
        alt Backend Validation Failed
            Backend2-->>ManagementAPI: 15a. {success: false, errors}
            ManagementAPI-->>FormPage: 15b. Error response
            FormPage->>FormPage: 15c. setLoading(false)
            FormPage->>Notification: 15d. showError()
            Notification->>User: 15e. Display error
        else Backend Validation Success
            Backend2->>Database: 16. INSERT INTO trucks
            Note over Database: Generate UUID<br/>Set timestamps
            
            Database-->>Backend2: 17. Insert successful
            Backend2-->>ManagementAPI: 18. {success: true, data}
            
            ManagementAPI-->>FormPage: 19. Success response
            FormPage->>FormPage: 20. setLoading(false)
            FormPage->>Notification: 21. showSuccess()
            Notification->>User: 22. \"Truck created successfully\"
            
            FormPage->>Router: 23. navigate('/trucks')
            Router->>ListPage: 24. Load list page
            ListPage->>ManagementAPI: 25. trucksApi.getAll()
            ManagementAPI->>Backend2: 26. GET /api/fleet/trucks
            Backend2->>Database: 27. SELECT * FROM trucks
            Database-->>Backend2: 28. All trucks
            Backend2-->>ManagementAPI: 29. Trucks data
            ManagementAPI-->>ListPage: 30. Data received
            ListPage->>User: 31. Display updated list
        end
    end
```

### Read Operation

```mermaid
sequenceDiagram
    actor User
    participant ListPage
    participant SearchFilter
    participant ManagementAPI
    participant Backend2
    participant Database
    participant TableComponent
    
    User->>ListPage: 1. Open /trucks
    
    ListPage->>ListPage: 2. useEffect mount
    ListPage->>ManagementAPI: 3. trucksApi.getAll()
    
    ManagementAPI->>Backend2: 4. GET /api/fleet/trucks
    Note over Backend2: Query params:<br/>?page=1&limit=20
    
    Backend2->>Backend2: 5. Verify JWT token
    Backend2->>Database: 6. SELECT with pagination
    Note over Database: ORDER BY created_at DESC<br/>LIMIT 20 OFFSET 0
    
    Database-->>Backend2: 7. Trucks data + count
    Backend2-->>ManagementAPI: 8. {data: [...], total, page}
    ManagementAPI-->>ListPage: 9. Response data
    
    ListPage->>ListPage: 10. Update state
    ListPage->>TableComponent: 11. Pass data as props
    TableComponent->>User: 12. Display table
    
    Note over User,Database: Search & Filter
    
    User->>SearchFilter: 13. Enter search term
    SearchFilter->>ListPage: 14. onSearch(query)
    
    ListPage->>ManagementAPI: 15. trucksApi.getAll({search})
    ManagementAPI->>Backend2: 16. GET ?search=B9001
    Backend2->>Database: 17. WHERE plate_number LIKE
    Database-->>Backend2: 18. Filtered results
    Backend2-->>ManagementAPI: 19. Filtered data
    ManagementAPI-->>ListPage: 20. Update results
    ListPage->>TableComponent: 21. Re-render
    TableComponent->>User: 22. Show filtered results
```

### Update Operation

```mermaid
sequenceDiagram
    actor User
    participant ListPage
    participant FormPage
    participant ManagementAPI
    participant Backend2
    participant Database
    
    User->>ListPage: 1. Click \"Edit\" on row
    ListPage->>FormPage: 2. navigate('/trucks/:id')
    
    FormPage->>ManagementAPI: 3. trucksApi.getById(id)
    ManagementAPI->>Backend2: 4. GET /api/fleet/trucks/:id
    Backend2->>Database: 5. SELECT WHERE id
    Database-->>Backend2: 6. Truck data
    Backend2-->>ManagementAPI: 7. {data: {...}}
    ManagementAPI-->>FormPage: 8. Data received
    
    FormPage->>FormPage: 9. Pre-fill form
    FormPage->>User: 10. Display filled form
    
    User->>FormPage: 11. Edit fields
    User->>FormPage: 12. Click \"Update\"
    
    FormPage->>ManagementAPI: 13. trucksApi.update(id, data)
    ManagementAPI->>Backend2: 14. PUT /api/fleet/trucks/:id
    
    Backend2->>Backend2: 15. Validate data
    Backend2->>Database: 16. UPDATE WHERE id
    Database-->>Backend2: 17. Update successful
    
    Backend2-->>ManagementAPI: 18. {success: true}
    ManagementAPI-->>FormPage: 19. Success
    FormPage->>ListPage: 20. navigate('/trucks')
    ListPage->>User: 21. Show success message
```

### Delete Operation

```mermaid
sequenceDiagram
    actor User
    participant ListPage
    participant ConfirmModal
    participant ManagementAPI
    participant Backend2
    participant Database
    
    User->>ListPage: 1. Click \"Delete\" button
    ListPage->>ConfirmModal: 2. Show confirmation
    ConfirmModal->>User: 3. \"Are you sure?\"
    
    User->>ConfirmModal: 4. Click \"Confirm\"
    ConfirmModal->>ListPage: 5. onConfirm()
    
    ListPage->>ManagementAPI: 6. trucksApi.delete(id)
    ManagementAPI->>Backend2: 7. DELETE /api/fleet/trucks/:id
    
    Backend2->>Backend2: 8. Check dependencies
    Note over Backend2: Check if truck has:<br/>- Active trips<br/>- Assigned devices<br/>- Active alerts
    
    alt Has Dependencies
        Backend2-->>ManagementAPI: 9a. {success: false, message}
        ManagementAPI-->>ListPage: 9b. Error
        ListPage->>User: 9c. \"Cannot delete: has dependencies\"
    else No Dependencies
        Backend2->>Database: 10. DELETE WHERE id
        Database-->>Backend2: 11. Delete successful
        Backend2-->>ManagementAPI: 12. {success: true}
        ManagementAPI-->>ListPage: 13. Success
        
        ListPage->>ListPage: 14. Remove from state
        ListPage->>User: 15. Update table
        ListPage->>User: 16. \"Deleted successfully\"
    end
```

---

## 7. Alur Monitoring TPMS

```mermaid
sequenceDiagram
    actor User
    participant MonitoringPage
    participant TPMS_API
    participant Backend1
    participant TPMS_Device
    participant ChartComponent
    participant AlertSystem
    
    User->>MonitoringPage: 1. Open /monitoring/sensors
    
    MonitoringPage->>MonitoringPage: 2. Component mount
    MonitoringPage->>TPMS_API: 3. getRealtimeSnapshot()
    
    TPMS_API->>Backend1: 4. GET /api/tpms/realtime
    Note over Backend1: Headers:<br/>Authorization: Bearer {token}
    
    Backend1->>TPMS_Device: 5. Request sensor data
    Note over TPMS_Device: Read from IoT sensors:<br/>- Tire pressure (kPa)<br/>- Temperature (°C)<br/>- Battery level
    
    TPMS_Device-->>Backend1: 6. Sensor readings
    Note over TPMS_Device: Data for all 10 tires<br/>per truck
    
    Backend1->>Backend1: 7. Format data
    Backend1-->>TPMS_API: 8. TPMS data
    Note over Backend1: {<br/>  sn: \"812952426\",<br/>  location: {...},<br/>  tire: [<br/>    {tireNo, tiprValue, tempValue},<br/>    ...<br/>  ]<br/>}
    
    TPMS_API-->>MonitoringPage: 9. Data received
    
    MonitoringPage->>MonitoringPage: 10. Process tire data
    Note over MonitoringPage: For each tire:<br/>- Check pressure threshold<br/>- Check temp threshold<br/>- Determine status
    
    loop For each tire (1-10)
        MonitoringPage->>MonitoringPage: 11. Evaluate thresholds
        
        alt Pressure Normal (200-250 kPa)
            MonitoringPage->>MonitoringPage: 12a. status = \"normal\"
            Note over MonitoringPage: Color: Green 🟢
        else Pressure Warning (150-200 or 250-280 kPa)
            MonitoringPage->>MonitoringPage: 12b. status = \"warning\"
            Note over MonitoringPage: Color: Yellow 🟡
        else Pressure Critical (<150 or >280 kPa)
            MonitoringPage->>MonitoringPage: 12c. status = \"critical\"
            Note over MonitoringPage: Color: Red 🔴
            
            MonitoringPage->>AlertSystem: 13. createAlert()
            AlertSystem->>Backend1: 14. POST /api/alerts
            Note over AlertSystem: Alert data:<br/>- truck_id<br/>- tire_position<br/>- pressure_value<br/>- severity: critical
        end
        
        alt Temperature Normal (20-50°C)
            MonitoringPage->>MonitoringPage: 15a. temp_status = \"normal\"
        else Temperature High (>50°C)
            MonitoringPage->>MonitoringPage: 15b. temp_status = \"warning\"
            MonitoringPage->>AlertSystem: 16. createTempAlert()
        end
    end
    
    MonitoringPage->>ChartComponent: 17. Render tire visualizations
    Note over ChartComponent: - Tire diagram (10 wheels)<br/>- Pressure gauge charts<br/>- Temperature indicators
    
    ChartComponent->>User: 18. Display tire status
    
    Note over MonitoringPage,User: Real-time Updates
    
    loop Every 5 seconds
        MonitoringPage->>TPMS_API: 19. getRealtimeSnapshot()
        TPMS_API->>Backend1: 20. GET /api/tpms/realtime
        Backend1->>TPMS_Device: 21. Get latest readings
        TPMS_Device-->>Backend1: 22. New data
        Backend1-->>TPMS_API: 23. Updated data
        TPMS_API-->>MonitoringPage: 24. New readings
        MonitoringPage->>MonitoringPage: 25. Update state
        MonitoringPage->>ChartComponent: 26. Re-render
        ChartComponent->>User: 27. Updated display
    end
    
    User->>MonitoringPage: 28. Click tire for details
    MonitoringPage->>MonitoringPage: 29. Show detailed modal
    Note over MonitoringPage: - Pressure history chart<br/>- Temperature trend<br/>- Last 24h data
    MonitoringPage->>User: 30. Display tire details
```

### TPMS Data Structure

**Real-time Data:**
```javascript
{
  message: \"Realtime data retrieved successfully\",
  count: 1,
  data: [
    {
      sn: \"812952426\",
      location: {
        lat_lng: \"-3.567821, 115.647158\",
        createdAt: \"2025-01-15T10:30:00.049Z\"
      },
      tire: [
        {
          tireNo: 1,
          tiprValue: 223.3,  // kPa
          tempValue: 35.1,    // °C
          createdAt: \"2025-01-15T10:30:00.123Z\"
        },
        // ... tires 2-10
      ]
    }
  ]
}
```

**Threshold Configuration:**
```javascript
const THRESHOLDS = {
  pressure: {
    min: 200,      // kPa
    max: 250,      // kPa
    critical_min: 150,
    critical_max: 280
  },
  temperature: {
    normal_max: 50,  // °C
    warning_max: 60,
    critical_max: 70
  }
};
```

---

## 8. Alur WebSocket Real-time

```mermaid
sequenceDiagram
    actor User
    participant Component
    participant WebSocketClient
    participant Backend_WS
    participant IoT_Gateway
    participant Database
    
    Note over Component: Page Load (useEffect)
    
    Component->>WebSocketClient: 1. connect()
    WebSocketClient->>Backend_WS: 2. new WebSocket(WS_URL)
    Backend_WS->>Backend_WS: 3. Validate connection
    Backend_WS-->>WebSocketClient: 4. onopen event
    
    WebSocketClient->>WebSocketClient: 5. reconnectAttempts = 0
    WebSocketClient->>Component: 6. emit('connected')
    Component->>Component: 7. setConnectionStatus('connected')
    
    Component->>WebSocketClient: 8. subscribe('truck_updates')
    WebSocketClient->>Backend_WS: 9. {type: 'subscribe', channel}
    Backend_WS->>Backend_WS: 10. Add to subscribers
    Backend_WS-->>WebSocketClient: 11. {type: 'subscription_confirmed'}
    WebSocketClient->>Component: 12. emit('subscribed')
    
    Note over IoT_Gateway,Database: Continuous Data Flow
    
    loop Real-time Updates (Every 3-5 seconds)
        IoT_Gateway->>Backend_WS: 13. Send truck location
        Note over IoT_Gateway: Data from GPS:<br/>- truck_id<br/>- latitude<br/>- longitude<br/>- speed<br/>- timestamp
        
        Backend_WS->>Database: 14. Store location
        Note over Database: INSERT INTO<br/>truck_locations
        
        Database-->>Backend_WS: 15. Stored
        
        Backend_WS->>Backend_WS: 16. Prepare message
        Note over Backend_WS: {<br/>  type: 'truck_locations_update',<br/>  data: {<br/>    truck_id,<br/>    location,<br/>    speed,<br/>    status<br/>  }<br/>}
        
        Backend_WS->>WebSocketClient: 17. Emit to subscribers
        WebSocketClient->>WebSocketClient: 18. handleMessage()
        
        alt Message Type: truck_locations_update
            WebSocketClient->>Component: 19. emit('truckUpdate', data)
            Component->>Component: 20. Update state
            Note over Component: setTrucks(prev => <br/>  prev.map(truck => <br/>    truck.id === data.truck_id<br/>      ? {...truck, location: data.location}<br/>      : truck<br/>  )<br/>)
            Component->>Component: 21. Re-render
            Component->>User: 22. See marker movement
            
        else Message Type: new_alerts
            WebSocketClient->>Component: 23. emit('newAlerts', data)
            Component->>Component: 24. Show notification
            Component->>User: 25. Alert popup
            
        else Message Type: dashboard_update
            WebSocketClient->>Component: 26. emit('dashboardUpdate', data)
            Component->>Component: 27. Update statistics
            Component->>User: 28. Updated dashboard
        end
    end
    
    Note over Component,Backend_WS: Heartbeat Mechanism
    
    loop Every 30 seconds
        WebSocketClient->>Backend_WS: 29. {type: 'ping'}
        Backend_WS-->>WebSocketClient: 30. {type: 'pong'}
    end
    
    Note over Component,Backend_WS: Disconnection & Reconnection
    
    alt Connection Lost
        Backend_WS->>WebSocketClient: 31. onclose event
        WebSocketClient->>Component: 32. emit('disconnected')
        Component->>Component: 33. setConnectionStatus('disconnected')
        Component->>User: 34. Show \"Reconnecting...\"
        
        loop Reconnect Attempts (max 5)
            WebSocketClient->>WebSocketClient: 35. reconnectAttempts++
            WebSocketClient->>WebSocketClient: 36. Wait 5 seconds
            WebSocketClient->>Backend_WS: 37. connect()
            
            alt Reconnect Success
                Backend_WS-->>WebSocketClient: 38a. Connection restored
                WebSocketClient->>Component: 38b. emit('connected')
                Component->>User: 38c. \"Connected\"
            else Reconnect Failed
                WebSocketClient->>WebSocketClient: 39. Continue loop
            end
        end
    end
    
    User->>Component: 40. Leave page
    Component->>WebSocketClient: 41. disconnect()
    WebSocketClient->>Backend_WS: 42. close()
    Backend_WS->>Backend_WS: 43. Remove from subscribers
```

### WebSocket Message Types

**Subscription Request:**
```javascript
{
  type: 'subscribe',
  data: {
    channel: 'truck_updates'
  }
}
```

**Location Update:**
```javascript
{
  type: 'truck_locations_update',
  data: {
    truck_id: 1,
    location: {
      latitude: -3.567821,
      longitude: 115.647158,
      recorded_at: \"2025-01-15T10:30:00Z\"
    },
    speed: 45,
    status: \"active\"
  },
  timestamp: \"2025-01-15T10:30:00Z\"
}
```

**Alert Notification:**
```javascript
{
  type: 'new_alerts',
  data: {
    alert_id: \"uuid\",
    truck_id: 1,
    alert_type: \"tire_pressure\",
    severity: \"critical\",
    message: \"Tire 3 pressure critically low\",
    created_at: \"2025-01-15T10:30:00Z\"
  }
}
```

---

## 9. Alur Data Flow Lengkap

```mermaid
graph TB
    subgraph \"IoT Layer\"
        A1[GPS Tracker]
        A2[TPMS Sensors]
        A3[Fuel Sensor]
        A4[Temp Sensor]
    end
    
    subgraph \"Backend 1 - Tracking\"
        B1[IoT Gateway API]
        B2[Location Service]
        B3[TPMS Service]
        B4[Telemetry Service]
    end
    
    subgraph \"Backend 2 - Management\"
        C1[REST API Server]
        C2[WebSocket Server]
        C3[Auth Service]
        C4[Fleet Service]
        C5[Alert Service]
    end
    
    subgraph \"Database Layer\"
        D1[MongoDB]
        D2[(Locations)]
        D3[(TPMS Data)]
        D4[(Trucks)]
        D5[(Users)]
        D6[(Alerts)]
    end
    
    subgraph \"Frontend - React\"
        E1[Login Page]
        E2[Dashboard]
        E3[Live Tracking]
        E4[History Tracking]
        E5[Monitoring]
        E6[Fleet Management]
    end
    
    subgraph \"User Interface\"
        F1[Web Browser]
        F2[User Actions]
    end
    
    %% IoT to Backend 1
    A1 -->|GPS Data| B1
    A2 -->|Tire Data| B1
    A3 -->|Fuel Data| B1
    A4 -->|Temp Data| B1
    
    B1 --> B2
    B1 --> B3
    B1 --> B4
    
    %% Backend 1 to Backend 2
    B2 -->|Location Updates| C2
    B3 -->|TPMS Alerts| C5
    B4 -->|Telemetry| C2
    
    %% Backend 2 to Database
    C1 --> D1
    C2 --> D1
    C3 --> D5
    C4 --> D4
    C5 --> D6
    
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D1 --> D5
    D1 --> D6
    
    %% Frontend to Backend 2
    E1 -->|Login Request| C3
    E2 -->|GET Stats| C1
    E3 -->|GET Live Data| C1
    E3 -.->|WebSocket| C2
    E4 -->|GET History| C1
    E5 -->|GET TPMS| C1
    E6 -->|CRUD Operations| C4
    
    %% Backend responses
    C1 -->|REST Response| E2
    C1 -->|REST Response| E3
    C1 -->|REST Response| E4
    C1 -->|REST Response| E5
    C1 -->|REST Response| E6
    C2 -.->|Real-time Updates| E3
    C2 -.->|Real-time Updates| E2
    C3 -->|JWT Token| E1
    
    %% User Interface
    F2 --> E1
    F2 --> E2
    F2 --> E3
    F2 --> E4
    F2 --> E5
    F2 --> E6
    
    E1 --> F1
    E2 --> F1
    E3 --> F1
    E4 --> F1
    E5 --> F1
    E6 --> F1
    
    style A1 fill:#e1ffe1
    style A2 fill:#e1ffe1
    style A3 fill:#e1ffe1
    style A4 fill:#e1ffe1
    style B1 fill:#ffe1e1
    style B2 fill:#ffe1e1
    style B3 fill:#ffe1e1
    style B4 fill:#ffe1e1
    style C1 fill:#ffe1e1
    style C2 fill:#ffe1e1
    style D1 fill:#fff4e1
    style F1 fill:#e1f5ff
    style F2 fill:#e1f5ff
```

---

## 📝 Penjelasan Komponen

### 1. IoT Layer
- **GPS Tracker**: Mengirim koordinat lokasi setiap 3-5 detik
- **TPMS Sensors**: Monitor tekanan dan suhu ban (10 sensors per truck)
- **Fuel Sensor**: Monitor level dan konsumsi bahan bakar
- **Temperature Sensor**: Monitor suhu engine dan komponen

### 2. Backend 1 (Tracking API)
- **IoT Gateway**: Menerima dan validasi data dari IoT devices
- **Location Service**: Process dan store GPS data
- **TPMS Service**: Process sensor data dan detect anomali
- **Telemetry Service**: Aggregate telemetry data

### 3. Backend 2 (Management API)
- **REST API Server**: Handle HTTP requests (CRUD operations)
- **WebSocket Server**: Handle real-time connections
- **Auth Service**: JWT authentication dan authorization
- **Fleet Service**: Manage trucks, drivers, devices
- **Alert Service**: Generate dan manage alerts

### 4. Database Layer (MongoDB)
- **Locations**: Store GPS coordinates dan tracking history
- **TPMS Data**: Store tire pressure dan temperature readings
- **Trucks**: Master data kendaraan
- **Users**: User accounts dan permissions
- **Alerts**: Alert records dan history

### 5. Frontend (React)
- **Login Page**: Authentication interface
- **Dashboard**: Overview dan statistics
- **Live Tracking**: Real-time map dengan WebSocket
- **History Tracking**: Route replay dengan animation
- **Monitoring**: TPMS, fuel, temperature monitoring
- **Fleet Management**: CRUD interfaces untuk master data

---

## 🔄 Request/Response Flow Summary

### HTTP Request Flow
```
User Action → Component → API Service → Axios → Backend → Database
```

### HTTP Response Flow
```
Database → Backend → Axios → API Service → Component → UI Update
```

### WebSocket Flow
```
IoT Device → Backend → WebSocket Server → WebSocket Client → Component → UI Update
```

### Real-time Update Cycle
```
1. IoT sends data (every 3-5s)
2. Backend receives & stores
3. Backend emits to WebSocket
4. Frontend receives update
5. React state updated
6. Component re-renders
7. User sees change
```

---

## 📊 Performance Metrics

### Typical Response Times
- **Authentication**: 200-500ms
- **CRUD Operations**: 100-300ms
- **Live Tracking (initial)**: 500-1000ms
- **History Tracking**: 1-2s (depending on data volume)
- **TPMS Data**: 300-600ms
- **WebSocket Update**: <100ms

### Data Volumes
- **Live Tracking**: 50-100 trucks simultaneously
- **History Points**: No limit (could be 1000s per truck)
- **TPMS Sensors**: 10 sensors per truck
- **WebSocket Messages**: 1 update per truck per 3-5 seconds

---

## 🔐 Security Measures

### Authentication
1. JWT Token with 24h expiration
2. Token stored in localStorage
3. Token sent in Authorization header
4. Auto-logout on 401 response

### Authorization
1. Role-based access control (RBAC)
2. Protected routes in React Router
3. Backend API endpoint protection
4. WebSocket connection authentication

### Data Protection
1. HTTPS for all HTTP requests
2. WSS (Secure WebSocket) for real-time data
3. Input validation on frontend & backend
4. SQL injection prevention (parameterized queries)
5. XSS protection (React auto-escaping)

---

**Diagram Created:** Januari 2025  
**Version:** 1.0.0  
**Last Updated:** Januari 2025
"
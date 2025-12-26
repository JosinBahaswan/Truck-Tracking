"# 📘 DOKUMENTASI ALUR KERJA SISTEM
# Dashboard Fleet Monitoring - Borneo Indobara

## 📋 Daftar Isi
1. [Overview Sistem](#1-overview-sistem)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Alur Kerja Authentication](#3-alur-kerja-authentication)
4. [Alur Kerja Live Tracking](#4-alur-kerja-live-tracking)
5. [Alur Kerja TPMS (Tire Pressure Monitoring)](#5-alur-kerja-tpms)
6. [Alur Kerja Fleet Management (CRUD)](#6-alur-kerja-fleet-management-crud)
7. [Alur Kerja Dashboard & Monitoring](#7-alur-kerja-dashboard--monitoring)
8. [Alur Kerja WebSocket Real-time](#8-alur-kerja-websocket-real-time)
9. [Alur Kerja History Tracking](#9-alur-kerja-history-tracking)
10. [Alur Kerja Alert System](#10-alur-kerja-alert-system)
11. [Tech Stack Detail](#11-tech-stack-detail)
12. [Struktur File & Direktori](#12-struktur-file--direktori)

---

## 1. Overview Sistem

### 1.1 Deskripsi Aplikasi
**Borneo Indobara Truck Tracking System** adalah platform manajemen armada berbasis web yang dirancang khusus untuk industri pertambangan dan transportasi. Sistem ini menyediakan monitoring real-time untuk kendaraan, TPMS (Tire Pressure Monitoring System), dan manajemen fleet lengkap.

### 1.2 Fitur Utama
- ✅ **Live Tracking**: Pelacakan posisi kendaraan real-time menggunakan GPS
- ✅ **TPMS Integration**: Monitoring tekanan dan suhu ban (10 ban per kendaraan)
- ✅ **Fleet Management**: CRUD lengkap untuk Trucks, Drivers, Vendors, Devices, Sensors
- ✅ **Historical Tracking**: Riwayat perjalanan dengan replay tracking
- ✅ **Dashboard Analytics**: Statistik dan visualisasi data
- ✅ **Alert System**: Notifikasi otomatis untuk anomali
- ✅ **WebSocket Real-time**: Update data secara langsung tanpa refresh

### 1.3 User Roles
- **Admin**: Akses penuh ke semua fitur
- **Operator**: Akses monitoring dan tracking
- **Viewer**: Akses read-only untuk dashboard

---

## 2. Arsitektur Aplikasi

### 2.1 Arsitektur High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │   Pages    │→ │  Components │→ │  Custom Hooks    │     │
│  │            │  │             │  │                  │     │
│  │ - Dashboard│  │ - Layout    │  │ - useAuth        │     │
│  │ - Tracking │  │ - Common    │  │ - useApi2        │     │
│  │ - Forms    │  │ - Maps      │  │ - useAlert       │     │
│  └────────────┘  └─────────────┘  └──────────────────┘     │
│                           │                                  │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Services Layer (API)                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐       │    │
│  │  │  Management API  │  │   Tracking API    │       │    │
│  │  │    (Backend 2)   │  │   (Backend 1)     │       │    │
│  │  └──────────────────┘  └──────────────────┘       │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │       WebSocket (Real-time Updates)      │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
┌──────────────────┐              ┌──────────────────┐
│   BACKEND 1      │              │   BACKEND 2      │
│  (Tracking API)  │              │ (Management API) │
│                  │              │                  │
│ - Live Tracking  │              │ - Authentication │
│ - History Track  │              │ - Dashboard      │
│ - TPMS Data      │              │ - Fleet CRUD     │
│ - Telemetry      │              │ - Alerts         │
│ - WebSocket      │              │ - User Mgmt      │
└──────────────────┘              └──────────────────┘
        │                                      │
        └──────────────────┬──────────────────┘
                           ↓
                   ┌───────────────┐
                   │   DATABASE    │
                   │   (MongoDB)   │
                   └───────────────┘
```

### 2.2 Backend Architecture

**Backend 1 (Tracking & TPMS)**
- Endpoint: `VITE_TRACKING_API_BASE_URL`
- WebSocket: `VITE_TRACKING_WS_URL`
- Fungsi: Live tracking, history tracking, TPMS real-time

**Backend 2 (Management & Master Data)**
- Endpoint: `VITE_API_BASE_URL`
- WebSocket: `VITE_WS_URL`
- Fungsi: Authentication, CRUD operations, dashboard stats, alerts

### 2.3 Data Flow Pattern

```
User Action → Component → Hook → Service → API → Backend → Database
                  ↑                                    ↓
                  └────────── Response ────────────────┘
```

---

## 3. Alur Kerja Authentication

### 3.1 Flow Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│  User   │────────>│  Login   │────────>│ useAuth │────────>│ Backend2 │
│ Browser │         │Component │         │  Hook   │         │ Auth API │
└─────────┘         └──────────┘         └─────────┘         └──────────┘
     ↑                                                              │
     │                                                              ↓
     │                                                        ┌──────────┐
     │                                                        │ Database │
     │                                                        │Validation│
     │                                                        └──────────┘
     │                                                              │
     └──────────────────────────────────────────────────────────────┘
              Token + User Data → localStorage
```

### 3.2 Step-by-Step Process

#### **Step 1: User Input Credentials**
- File: `src/components/auth/Login.jsx`
- User memasukkan username dan password
- Form validation dilakukan di frontend

#### **Step 2: Login Request**
```javascript
// src/hooks/useAuth.js
const login = async (credentials) => {
  setLoading(true);
  try {
    const response = await authApi.login(credentials);
    
    if (response.success) {
      setIsAuthenticated(true);
      setUser(response.data.user);
      // Token disimpan di localStorage
      return { success: true };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

#### **Step 3: Backend Validation**
- API Endpoint: `POST /api/auth/login`
- Backend 2 memvalidasi credentials
- Generate JWT token jika valid

#### **Step 4: Store Token**
```javascript
// Token disimpan di localStorage
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(userData));
```

#### **Step 5: Axios Interceptor**
```javascript
// src/services/management/config.js
managementClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### **Step 6: Protected Route Check**
```javascript
// src/routes/ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to=\"/login\" />;
  
  return children;
};
```

### 3.3 Logout Process
```javascript
const logout = async () => {
  await authApi.logout();
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  setIsAuthenticated(false);
  setUser(null);
};
```

---

## 4. Alur Kerja Live Tracking

### 4.1 Flow Diagram

```
┌────────────┐      ┌─────────────────┐      ┌──────────────┐
│    User    │─────>│  LiveTracking   │─────>│   Leaflet    │
│  Browser   │      │     Page        │      │     Map      │
└────────────┘      └─────────────────┘      └──────────────┘
      ↑                      │                        │
      │                      ↓                        │
      │             ┌─────────────────┐              │
      │             │  Tracking API   │              │
      │             │   (Backend 1)   │              │
      │             └─────────────────┘              │
      │                      │                        │
      │                      ↓                        │
      │             ┌─────────────────┐              │
      │             │   WebSocket     │──────────────┘
      │             │  Real-time      │
      │             └─────────────────┘
      │                      │
      └──────────────────────┘
         Update Markers
```

### 4.2 Step-by-Step Process

#### **Step 1: Initialize Map Component**
```javascript
// src/pages/LiveTracking.jsx
import LiveTrackingMapNew from './tracking/LiveTrackingMapNew';

const LiveTracking = () => {
  return (
    <TailwindLayout>
      <LiveTrackingMapNew />
    </TailwindLayout>
  );
};
```

#### **Step 2: Fetch Initial Truck Locations**
```javascript
// Menggunakan custom hook
const { locations, loading, error } = useRealtimeLocations();

// Hook melakukan API call
const fetchLocations = async () => {
  const response = await trucksApi.getRealtimeLocations();
  setLocations(response.data);
};
```

#### **Step 3: Render Map with Markers**
```javascript
// Menggunakan React Leaflet
<MapContainer center={[-1.5, 117.5]} zoom={10}>
  <TileLayer url=\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\" />
  
  {locations.features.map(truck => (
    <Marker
      key={truck.properties.device_id}
      position={[truck.geometry.coordinates[1], truck.geometry.coordinates[0]]}
      icon={getTruckIcon(truck.properties.status)}
    >
      <Popup>
        <TruckInfoPopup data={truck.properties} />
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

#### **Step 4: WebSocket Connection for Real-time Updates**
```javascript
// src/services/websocket/FleetWebSocket.js
const ws = new FleetWebSocket();
ws.connect();

ws.subscribe('truck_updates', (data) => {
  // Update truck position real-time
  updateTruckMarker(data.device_id, data.location);
});
```

#### **Step 5: Update Markers Dynamically**
- WebSocket menerima data baru setiap kali kendaraan bergerak
- Marker di peta diupdate tanpa refresh halaman
- Status kendaraan (aktif/idle/nonaktif) ditampilkan dengan warna berbeda

#### **Step 6: Show Truck Details**
```javascript
// Ketika user klik marker
<Popup>
  <div>
    <h3>{truck.licensePlate}</h3>
    <p>Driver: {truck.driverName}</p>
    <p>Speed: {truck.speed} km/h</p>
    <p>Status: {truck.status}</p>
    <p>Last Update: {truck.timestamp}</p>
  </div>
</Popup>
```

### 4.3 Data Structure

```javascript
// Truck Location Data (GeoJSON Format)
{
  type: \"FeatureCollection\",
  features: [
    {
      type: \"Feature\",
      geometry: {
        type: \"Point\",
        coordinates: [117.1234, -1.5678] // [longitude, latitude]
      },
      properties: {
        device_id: \"DEV001\",
        vin: \"TRUCK001\",
        licensePlate: \"KT 1234 AB\",
        driverName: \"John Doe\",
        speed: 45,
        status: \"active\",
        timestamp: \"2025-12-25T10:30:00Z\"
      }
    }
  ]
}
```

---

## 5. Alur Kerja TPMS (Tire Pressure Monitoring)

### 5.1 Flow Diagram

```
┌────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  IoT   │───>│    Device    │───>│  Backend 1   │───>│ Database │
│Sensor  │    │   Gateway    │    │  TPMS API    │    │          │
└────────┘    └──────────────┘    └──────────────┘    └──────────┘
  (10 Ban)                               │                    │
                                         ↓                    │
                              ┌──────────────────┐           │
                              │    WebSocket     │←──────────┘
                              │   Real-time      │
                              └──────────────────┘
                                         │
                                         ↓
                              ┌──────────────────┐
                              │    Frontend      │
                              │ Sensor Monitor   │
                              └──────────────────┘
```

### 5.2 Step-by-Step Process

#### **Step 1: IoT Sensor Data Collection**
- Setiap kendaraan memiliki 10 sensor TPMS (untuk 10 ban)
- Sensor mengirim data setiap X detik:
  - Tekanan ban (PSI atau Bar)
  - Suhu ban (Celsius)
  - Status sensor (Normal/Warning/Critical)
  - Battery level sensor
  - Signal strength

#### **Step 2: Data Transmission**
```javascript
// Format data dari IoT Sensor
{
  device_id: \"DEV001\",
  vin: \"TRUCK001\",
  timestamp: \"2025-12-25T10:30:00Z\",
  sensors: [
    {
      sensor_id: \"SENS001\",
      tire_no: 1,
      position: \"FL\", // Front Left
      pressure: 110, // PSI
      temperature: 65, // Celsius
      status: \"normal\",
      battery: 85,
      signal_strength: 90
    },
    // ... 9 sensor lainnya
  ]
}
```

#### **Step 3: Backend Processing**
- API Endpoint: `GET /api/tpms/realtime/:device_id`
- Backend 1 menerima data dari IoT gateway
- Data disimpan ke database
- Alert detection jika nilai abnormal

#### **Step 4: Alert Generation**
```javascript
// Kondisi Alert
if (pressure < THRESHOLD_MIN || pressure > THRESHOLD_MAX) {
  generateAlert({
    type: \"TIRE_PRESSURE\",
    severity: \"high\",
    message: \"Tekanan ban abnormal\",
    tire_no: 1
  });
}

if (temperature > TEMP_THRESHOLD) {
  generateAlert({
    type: \"TIRE_TEMPERATURE\",
    severity: \"critical\",
    message: \"Suhu ban terlalu tinggi\"
  });
}
```

#### **Step 5: Frontend Display - Sensor Monitoring Page**
```javascript
// src/pages/monitoring/SensorMonitoring.jsx
const SensorMonitoring = () => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [tpmsData, setTpmsData] = useState(null);
  
  useEffect(() => {
    if (selectedTruck) {
      fetchTPMSData(selectedTruck);
    }
  }, [selectedTruck]);
  
  return (
    <div>
      <TruckSelector onSelect={setSelectedTruck} />
      <TireGrid sensors={tpmsData?.sensors} />
    </div>
  );
};
```

#### **Step 6: Tire Grid Visualization**
```javascript
// Visualisasi 10 Ban dalam Grid
<div className=\"tire-grid\">
  {/* Front Tires */}
  <div className=\"row\">
    <TireCard tire={sensors[0]} position=\"FL\" />
    <TireCard tire={sensors[1]} position=\"FR\" />
  </div>
  
  {/* Middle Tires */}
  <div className=\"row\">
    <TireCard tire={sensors[2]} position=\"ML1\" />
    <TireCard tire={sensors[3]} position=\"MR1\" />
    <TireCard tire={sensors[4]} position=\"ML2\" />
    <TireCard tire={sensors[5]} position=\"MR2\" />
  </div>
  
  {/* Rear Tires */}
  <div className=\"row\">
    <TireCard tire={sensors[6]} position=\"RL1\" />
    <TireCard tire={sensors[7]} position=\"RR1\" />
    <TireCard tire={sensors[8]} position=\"RL2\" />
    <TireCard tire={sensors[9]} position=\"RR2\" />
  </div>
</div>
```

#### **Step 7: Real-time Updates via WebSocket**
```javascript
// Subscribe to TPMS updates
ws.subscribe('tpms_updates', (data) => {
  if (data.device_id === selectedTruck) {
    updateTireData(data.sensors);
  }
});
```

#### **Step 8: Color Coding & Status**
```javascript
const getTireStatus = (pressure, temperature) => {
  if (pressure < 90 || pressure > 120) return 'critical';
  if (pressure < 100 || pressure > 110) return 'warning';
  if (temperature > 80) return 'critical';
  if (temperature > 70) return 'warning';
  return 'normal';
};

// Visual representation
const statusColors = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500'
};
```

### 5.3 Live Tire View
```javascript
// src/pages/monitoring/LiveTireView.jsx
// Menampilkan TPMS data secara live untuk semua kendaraan
const LiveTireView = () => {
  const [trucks, setTrucks] = useState([]);
  
  return (
    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
      {trucks.map(truck => (
        <TruckTPMSCard key={truck.vin} truck={truck} />
      ))}
    </div>
  );
};
```

---

## 6. Alur Kerja Fleet Management (CRUD)

### 6.1 Flow Diagram - General CRUD

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│   User   │───>│   List Page  │───>│  useApi2 │───>│Backend 2 │
│  Action  │    │  (Display)   │    │   Hook   │    │Management│
└──────────┘    └──────────────┘    └──────────┘    └──────────┘
     │                 │                                    │
     ├─ View List ────┘                                    │
     │                                                      ↓
     ├─ Create ──> Form Page ──> useCRUD ──> POST ───> Database
     │                                                      │
     ├─ Update ──> Form Page ──> useCRUD ──> PUT ────> Database
     │                                                      │
     └─ Delete ──> Confirm ────> useCRUD ──> DELETE ─> Database
```

### 6.2 Module CRUD Operations

#### **6.2.1 Trucks Management**

**List Trucks**
```javascript
// src/pages/listdata/TrucksList.jsx
const TrucksList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  
  // Custom hook untuk fetch data
  const { trucks, loading, error, totalPages } = useTrucks({
    page,
    limit: 10,
    ...filters
  });
  
  return (
    <TailwindLayout>
      <div>
        <FilterBar onFilterChange={setFilters} />
        <TrucksTable 
          trucks={trucks}
          loading={loading}
          onEdit={(id) => navigate(`/trucks/${id}`)}
          onDelete={handleDelete}
        />
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </TailwindLayout>
  );
};
```

**Create/Edit Truck**
```javascript
// src/pages/form/TruckForm.jsx
const TruckForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  // Fetch truck data if editing
  const { truck, loading } = useTruck(id);
  
  // CRUD operations
  const { create, update } = useCRUD(trucksApi);
  
  const handleSubmit = async (formData) => {
    try {
      if (isEdit) {
        await update(id, formData);
        toast.success('Truck updated successfully');
      } else {
        await create(formData);
        toast.success('Truck created successfully');
      }
      navigate('/trucks');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <TailwindLayout>
      <form onSubmit={handleSubmit}>
        <Input name=\"vin\" label=\"VIN Number\" required />
        <Input name=\"licensePlate\" label=\"License Plate\" required />
        <Select name=\"vendor_id\" label=\"Vendor\" options={vendors} />
        <DatePicker name=\"purchaseDate\" label=\"Purchase Date\" />
        {/* ... more fields */}
        <Button type=\"submit\">
          {isEdit ? 'Update' : 'Create'} Truck
        </Button>
      </form>
    </TailwindLayout>
  );
};
```

**Delete Truck**
```javascript
const handleDelete = async (truckId) => {
  const confirmed = await showConfirmDialog({
    title: 'Delete Truck',
    message: 'Are you sure you want to delete this truck?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  
  if (confirmed) {
    try {
      await trucksApi.delete(truckId);
      toast.success('Truck deleted successfully');
      refetch(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete truck');
    }
  }
};
```

#### **6.2.2 Drivers Management**

**API Endpoint Structure**
```javascript
// src/services/management/modules/fleet/drivers.api.js
export const driversApi = {
  getAll: (params) => managementClient.get('/api/drivers', { params }),
  getById: (id) => managementClient.get(`/api/drivers/${id}`),
  create: (data) => managementClient.post('/api/drivers', data),
  update: (id, data) => managementClient.put(`/api/drivers/${id}`, data),
  delete: (id) => managementClient.delete(`/api/drivers/${id}`)
};
```

**List Drivers**
```javascript
// src/pages/listdata/DriversList.jsx
const DriversList = () => {
  const { drivers, loading, error, refetch } = useDrivers({
    page: 1,
    limit: 10
  });
  
  return (
    <div>
      <Button onClick={() => navigate('/drivers/new')}>
        Add New Driver
      </Button>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>License Number</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(driver => (
            <tr key={driver.id}>
              <td>{driver.name}</td>
              <td>{driver.licenseNumber}</td>
              <td>{driver.phone}</td>
              <td>{driver.status}</td>
              <td>
                <Button onClick={() => navigate(`/drivers/${driver.id}`)}>
                  Edit
                </Button>
                <Button onClick={() => handleDelete(driver.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**Create/Edit Driver Form**
```javascript
// src/pages/form/DriverForm.jsx
const DriverForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    phone: '',
    email: '',
    address: '',
    status: 'active'
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEdit) {
      await driversApi.update(driverId, formData);
    } else {
      await driversApi.create(formData);
    }
    
    navigate('/drivers');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        name=\"name\"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      {/* More fields */}
    </form>
  );
};
```

#### **6.2.3 Vendors Management**

```javascript
// Similar pattern untuk Vendors
// src/pages/listdata/VendorsList.jsx
// src/pages/form/VendorForm.jsx

const VendorsList = () => {
  const { vendors, loading, refetch } = useVendors();
  // Similar implementation
};

const VendorForm = () => {
  // Form fields:
  // - name, code, type
  // - contact person, phone, email
  // - address, contract details
};
```

#### **6.2.4 Devices Management**

```javascript
// src/pages/listdata/Devices.jsx
const Devices = () => {
  const { devices, loading, refetch } = useDevices({
    type: 'GPS', // atau 'GATEWAY'
    page: 1,
    limit: 10
  });
  
  return (
    <div>
      <FilterBar types={['GPS', 'GATEWAY', 'ALL']} />
      <DevicesGrid devices={devices} />
    </div>
  );
};

// src/pages/form/DeviceForm.jsx
const DeviceForm = () => {
  // Form fields:
  // - device_id, serial_number, imei
  // - type (GPS/Gateway)
  // - installation_date
  // - assigned_truck
  // - status
};
```

#### **6.2.5 Sensors (TPMS) Management**

```javascript
// src/pages/listdata/Sensors.jsx
const Sensors = () => {
  const { sensors, loading, refetch } = useSensors({
    device_id: selectedDevice,
    status: 'active'
  });
  
  return (
    <div>
      <SensorGrid sensors={sensors} />
    </div>
  );
};

// src/pages/form/SensorForm.jsx
const SensorForm = () => {
  // Form fields:
  // - sensor_id, device_id
  // - tire_no (1-10)
  // - position (FL, FR, ML1, MR1, etc)
  // - installation_date
  // - calibration_date
  // - status
};
```

### 6.3 Common CRUD Pattern

```javascript
// Pattern yang digunakan di semua module CRUD

// 1. List Page
const ListPage = () => {
  const { data, loading, error, refetch } = useDataHook();
  return <DataTable data={data} />;
};

// 2. Form Page (Create/Edit)
const FormPage = () => {
  const { id } = useParams();
  const { data, loading } = useSingleData(id);
  const { create, update } = useCRUD(api);
  
  const handleSubmit = async (formData) => {
    if (id) {
      await update(id, formData);
    } else {
      await create(formData);
    }
  };
  
  return <Form onSubmit={handleSubmit} />;
};

// 3. Delete Operation
const handleDelete = async (id) => {
  if (await confirm('Delete this item?')) {
    await api.delete(id);
    refetch();
  }
};
```

---

## 7. Alur Kerja Dashboard & Monitoring

### 7.1 Flow Diagram

```
┌──────────┐    ┌────────────────┐    ┌──────────────┐
│   User   │───>│   Dashboard    │───>│ useDashboard │
│ Browser  │    │     Page       │    │     Hook     │
└──────────┘    └────────────────┘    └──────────────┘
                         │                     │
                         │                     ↓
                         │            ┌─────────────────┐
                         │            │   Backend 2     │
                         │            │ Dashboard API   │
                         │            └─────────────────┘
                         │                     │
                         ↓                     ↓
                ┌──────────────────────────────────┐
                │     Dashboard Components         │
                │  ┌──────────┐  ┌──────────────┐ │
                │  │  Stats   │  │    Charts    │ │
                │  │  Cards   │  │ (Recharts)   │ │
                │  └──────────┘  └──────────────┘ │
                │  ┌──────────┐  ┌──────────────┐ │
                │  │  Alerts  │  │ Fleet Status │ │
                │  │  List    │  │    Table     │ │
                │  └──────────┘  └──────────────┘ │
                └──────────────────────────────────┘
```

### 7.2 Step-by-Step Process

#### **Step 1: Dashboard Page Initialization**
```javascript
// src/pages/Dashboard.jsx
const Dashboard = () => {
  // Fetch dashboard statistics
  const { stats, loading, error, refetch } = useDashboard();
  
  // Fetch alerts
  const { alerts } = useAlerts({ limit: 5, resolved: false });
  
  // Fetch fleet summary
  const { fleet } = useFleet();
  
  useEffect(() => {
    // Refresh data every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);
  
  return (
    <TailwindLayout>
      <div className=\"dashboard-grid\">
        <StatsCards stats={stats} />
        <FleetStatusChart data={fleet} />
        <RecentAlerts alerts={alerts} />
        <TruckActivityChart data={stats.activities} />
      </div>
    </TailwindLayout>
  );
};
```

#### **Step 2: Fetch Dashboard Statistics**
```javascript
// API Call
const fetchStats = async () => {
  const response = await dashboardApi.getStats();
  return response.data;
};

// Data structure
{
  trucks: {
    total: 50,
    active: 35,
    idle: 10,
    maintenance: 5
  },
  drivers: {
    total: 60,
    onDuty: 40,
    offDuty: 20
  },
  alerts: {
    total: 25,
    critical: 5,
    high: 10,
    medium: 7,
    low: 3
  },
  tpms: {
    sensorsActive: 450,
    sensorsOffline: 50,
    tiresNormal: 400,
    tiresWarning: 30,
    tiresCritical: 20
  },
  activities: [
    { date: '2025-12-20', distance: 1200, trips: 45 },
    { date: '2025-12-21', distance: 1350, trips: 50 }
  ]
}
```

#### **Step 3: Stats Cards Display**
```javascript
// src/components/dashboard/StatsCards.jsx
const StatsCards = ({ stats }) => {
  return (
    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
      <StatsCard
        title=\"Total Trucks\"
        value={stats.trucks.total}
        icon={<TruckIcon />}
        trend={+5}
        color=\"blue\"
      />
      
      <StatsCard
        title=\"Active Trucks\"
        value={stats.trucks.active}
        icon={<ActivityIcon />}
        color=\"green\"
      />
      
      <StatsCard
        title=\"Critical Alerts\"
        value={stats.alerts.critical}
        icon={<AlertIcon />}
        color=\"red\"
      />
      
      <StatsCard
        title=\"Active Drivers\"
        value={stats.drivers.onDuty}
        icon={<UserIcon />}
        color=\"purple\"
      />
    </div>
  );
};
```

#### **Step 4: Charts Visualization**
```javascript
// src/components/dashboard/FleetStatusChart.jsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const FleetStatusChart = ({ data }) => {
  const chartData = [
    { name: 'Active', value: data.trucks.active, color: '#10B981' },
    { name: 'Idle', value: data.trucks.idle, color: '#F59E0B' },
    { name: 'Maintenance', value: data.trucks.maintenance, color: '#EF4444' }
  ];
  
  return (
    <div className=\"chart-container\">
      <h3>Fleet Status</h3>
      <ResponsiveContainer width=\"100%\" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey=\"value\"
            nameKey=\"name\"
            cx=\"50%\"
            cy=\"50%\"
            outerRadius={80}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### **Step 5: Recent Alerts Display**
```javascript
// src/components/dashboard/RecentAlerts.jsx
const RecentAlerts = ({ alerts }) => {
  return (
    <div className=\"alerts-widget\">
      <h3>Recent Alerts</h3>
      <div className=\"alerts-list\">
        {alerts.map(alert => (
          <AlertItem
            key={alert.id}
            severity={alert.severity}
            message={alert.message}
            truck={alert.truckId}
            timestamp={alert.timestamp}
          />
        ))}
      </div>
      <Button onClick={() => navigate('/alerts')}>
        View All Alerts
      </Button>
    </div>
  );
};
```

#### **Step 6: Activity Chart (Line/Area Chart)**
```javascript
// src/components/dashboard/TruckActivityChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const TruckActivityChart = ({ data }) => {
  return (
    <div className=\"chart-container\">
      <h3>Truck Activity (Last 7 Days)</h3>
      <ResponsiveContainer width=\"100%\" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray=\"3 3\" />
          <XAxis dataKey=\"date\" />
          <YAxis />
          <Tooltip />
          <Area 
            type=\"monotone\" 
            dataKey=\"distance\" 
            stroke=\"#3B82F6\" 
            fill=\"#3B82F6\" 
            fillOpacity={0.3} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### 7.3 Monitoring Pages

#### **7.3.1 Fuel Monitoring**
```javascript
// src/pages/monitoring/FuelMonitoring.jsx
const FuelMonitoring = () => {
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  
  // Fetch fuel data
  const fetchFuelData = async (truckId) => {
    const response = await monitoringApi.getFuelData(truckId);
    return response.data;
  };
  
  return (
    <div>
      <TruckSelector onSelect={setSelectedTruck} />
      {selectedTruck && (
        <FuelChart truck={selectedTruck} />
      )}
      <FuelHistoryTable truck={selectedTruck} />
    </div>
  );
};
```

#### **7.3.2 Vehicle Device Status**
```javascript
// src/pages/monitoring/VehicleDeviceStatus.jsx
const VehicleDeviceStatus = () => {
  const { trucks } = useTrucks();
  
  return (
    <div>
      <h2>Vehicle & Device Status</h2>
      <div className=\"status-grid\">
        {trucks.map(truck => (
          <DeviceStatusCard
            key={truck.vin}
            truck={truck}
            device={truck.device}
            sensors={truck.sensors}
          />
        ))}
      </div>
    </div>
  );
};

// Device Status Card
const DeviceStatusCard = ({ truck, device, sensors }) => {
  return (
    <div className=\"status-card\">
      <h3>{truck.licensePlate}</h3>
      
      <div className=\"device-info\">
        <StatusIndicator 
          label=\"GPS Device\" 
          status={device.status} 
          lastUpdate={device.lastUpdate}
        />
        <StatusIndicator 
          label=\"Gateway\" 
          status={device.gatewayStatus}
        />
      </div>
      
      <div className=\"sensor-status\">
        <h4>TPMS Sensors</h4>
        <div className=\"sensor-grid\">
          {sensors.map(sensor => (
            <SensorStatusBadge 
              key={sensor.sensor_id}
              sensor={sensor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 8. Alur Kerja WebSocket Real-time

### 8.1 Flow Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────┐
│   Frontend   │────────>│   WebSocket  │────────>│ Backend  │
│   Connect    │  WS://  │   Server     │         │ Server   │
└──────────────┘         └──────────────┘         └──────────┘
       │                         │                       │
       │    Subscribe            │                       │
       ├────────────────────────>│                       │
       │    (truck_updates)      │                       │
       │                         │                       │
       │                         │   New Data Available  │
       │                         │<──────────────────────│
       │                         │                       │
       │    Broadcast Data       │                       │
       │<────────────────────────│                       │
       │                         │                       │
       ↓                         ↓                       ↓
  Update UI              Message Queue            Database
```

### 8.2 Step-by-Step Process

#### **Step 1: WebSocket Initialization**
```javascript
// src/services/websocket/FleetWebSocket.js
class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  connect() {
    const wsUrl = TRACKING_CONFIG.WS_URL;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }
}
```

#### **Step 2: Connection Open Handler**
```javascript
handleOpen() {
  console.log('✅ WebSocket connected');
  this.reconnectAttempts = 0;
  
  // Auto-subscribe to default channels
  this.send({
    type: 'subscribe',
    channel: 'truck_updates'
  });
  
  this.send({
    type: 'subscribe',
    channel: 'alerts'
  });
  
  this.send({
    type: 'subscribe',
    channel: 'dashboard'
  });
  
  // Subscribe to any previously registered channels
  this.subscriptions.forEach(channel => {
    this.send({
      type: 'subscribe',
      channel: channel
    });
  });
}
```

#### **Step 3: Subscribe to Channels**
```javascript
subscribe(channel, handler) {
  // Save handler for this channel
  this.messageHandlers.set(channel, handler);
  this.subscriptions.add(channel);
  
  // Send subscribe message if connected
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    this.send({
      type: 'subscribe',
      channel: channel
    });
  }
}

// Usage in component
useEffect(() => {
  const ws = new FleetWebSocket();
  ws.connect();
  
  // Subscribe to truck updates
  ws.subscribe('truck_updates', (data) => {
    console.log('Truck update received:', data);
    updateTruckPosition(data);
  });
  
  // Subscribe to TPMS updates
  ws.subscribe('tpms_updates', (data) => {
    console.log('TPMS update received:', data);
    updateTireData(data);
  });
  
  return () => ws.disconnect();
}, []);
```

#### **Step 4: Message Handler**
```javascript
handleMessage(event) {
  try {
    const message = JSON.parse(event.data);
    
    // Route message to appropriate handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
    
    // Handle specific message types
    switch(message.type) {
      case 'truck_updates':
        this.handleTruckUpdate(message.data);
        break;
        
      case 'tpms_updates':
        this.handleTPMSUpdate(message.data);
        break;
        
      case 'alerts':
        this.handleAlert(message.data);
        break;
        
      case 'dashboard':
        this.handleDashboardUpdate(message.data);
        break;
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
}
```

#### **Step 5: Reconnection Logic**
```javascript
handleClose() {
  console.log('❌ WebSocket disconnected');
  this.ws = null;
  this.attemptReconnect();
}

attemptReconnect() {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    
    console.log(
      `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    
    // Exponential backoff
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    setTimeout(() => {
      this.connect();
    }, delay);
  } else {
    console.error('Max reconnection attempts reached');
    // Show user notification
    showNotification({
      type: 'error',
      message: 'Real-time connection lost. Please refresh the page.'
    });
  }
}
```

#### **Step 6: Usage in Components**

**Live Tracking**
```javascript
// src/pages/tracking/LiveTrackingMapNew.jsx
const LiveTrackingMapNew = () => {
  const [trucks, setTrucks] = useState([]);
  const wsRef = useRef(null);
  
  useEffect(() => {
    // Initialize WebSocket
    wsRef.current = new FleetWebSocket();
    wsRef.current.connect();
    
    // Subscribe to truck updates
    wsRef.current.subscribe('truck_updates', (data) => {
      // Update truck position in real-time
      setTrucks(prevTrucks => {
        const index = prevTrucks.findIndex(t => t.device_id === data.device_id);
        if (index !== -1) {
          // Update existing truck
          const newTrucks = [...prevTrucks];
          newTrucks[index] = {
            ...newTrucks[index],
            ...data,
            position: [data.latitude, data.longitude]
          };
          return newTrucks;
        } else {
          // Add new truck
          return [...prevTrucks, data];
        }
      });
    });
    
    return () => {
      wsRef.current.disconnect();
    };
  }, []);
  
  return (
    <MapContainer>
      {trucks.map(truck => (
        <Marker
          key={truck.device_id}
          position={truck.position}
        />
      ))}
    </MapContainer>
  );
};
```

**TPMS Monitoring**
```javascript
// src/pages/monitoring/SensorMonitoring.jsx
const SensorMonitoring = () => {
  const [tpmsData, setTpmsData] = useState(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    wsRef.current = new FleetWebSocket();
    wsRef.current.connect();
    
    // Subscribe to TPMS updates
    wsRef.current.subscribe('tpms_updates', (data) => {
      if (data.device_id === selectedTruck) {
        setTpmsData(data);
        
        // Check for alerts
        data.sensors.forEach(sensor => {
          if (sensor.status === 'critical') {
            showAlert({
              type: 'critical',
              message: `Tire ${sensor.tire_no} pressure critical!`
            });
          }
        });
      }
    });
    
    return () => {
      wsRef.current.disconnect();
    };
  }, [selectedTruck]);
};
```

**Dashboard Real-time Updates**
```javascript
// src/pages/Dashboard.jsx
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    wsRef.current = new FleetWebSocket();
    wsRef.current.connect();
    
    // Subscribe to dashboard updates
    wsRef.current.subscribe('dashboard', (data) => {
      setStats(prevStats => ({
        ...prevStats,
        ...data
      }));
    });
    
    // Subscribe to alerts
    wsRef.current.subscribe('alerts', (alert) => {
      showNotification({
        type: alert.severity,
        title: alert.title,
        message: alert.message
      });
    });
    
    return () => {
      wsRef.current.disconnect();
    };
  }, []);
};
```

### 8.3 WebSocket Message Formats

#### **Truck Update Message**
```javascript
{
  type: 'truck_updates',
  data: {
    device_id: 'DEV001',
    vin: 'TRUCK001',
    latitude: -1.5678,
    longitude: 117.1234,
    speed: 45,
    heading: 180,
    status: 'active',
    timestamp: '2025-12-25T10:30:00Z'
  }
}
```

#### **TPMS Update Message**
```javascript
{
  type: 'tpms_updates',
  data: {
    device_id: 'DEV001',
    vin: 'TRUCK001',
    timestamp: '2025-12-25T10:30:00Z',
    sensors: [
      {
        sensor_id: 'SENS001',
        tire_no: 1,
        pressure: 110,
        temperature: 65,
        status: 'normal'
      }
      // ... 9 sensors lainnya
    ]
  }
}
```

#### **Alert Message**
```javascript
{
  type: 'alerts',
  data: {
    alert_id: 'ALERT001',
    severity: 'critical',
    title: 'Tire Pressure Critical',
    message: 'Truck KT 1234 AB - Tire 1 pressure below threshold',
    truck_id: 'TRUCK001',
    device_id: 'DEV001',
    timestamp: '2025-12-25T10:30:00Z',
    metadata: {
      tire_no: 1,
      current_pressure: 75,
      threshold: 90
    }
  }
}
```

---

## 9. Alur Kerja History Tracking

### 9.1 Flow Diagram

```
┌──────────┐    ┌──────────────────┐    ┌─────────────┐    ┌──────────┐
│   User   │───>│ HistoryTracking  │───>│ History API │───>│ Backend1 │
│  Select  │    │      Page        │    │  (Tracking) │    │ Database │
│  Params  │    └──────────────────┘    └─────────────┘    └──────────┘
└──────────┘             │                      │                  │
     │                   ↓                      ↓                  │
     │          ┌────────────────┐    ┌──────────────────┐       │
     │          │  Date Picker   │    │  Query History   │←──────┘
     │          │  Truck Select  │    │  - Start Date    │
     │          └────────────────┘    │  - End Date      │
     │                   │             │  - Device ID     │
     │                   ↓             └──────────────────┘
     │          ┌────────────────────────────┐
     │          │     Display Results        │
     │          │  ┌──────────┐ ┌─────────┐ │
     │          │  │   Map    │ │  Table  │ │
     │          │  │  Route   │ │  Data   │ │
     │          │  └──────────┘ └─────────┘ │
     │          │  ┌─────────────────────┐  │
     │          │  │  Replay Controls    │  │
     │          │  │  Play/Pause/Speed   │  │
     │          │  └─────────────────────┘  │
     │          └────────────────────────────┘
     └──────────────────────────────────────────
```

### 9.2 Step-by-Step Process

#### **Step 1: Initialize History Tracking Page**
```javascript
// src/pages/HistoryTracking.jsx
const HistoryTracking = () => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  return (
    <TailwindLayout>
      <div className=\"history-tracking-container\">
        <FiltersPanel
          onTruckChange={setSelectedTruck}
          onDateChange={setDateRange}
          onSearch={handleSearch}
        />
        
        {historyData && (
          <>
            <HistoryMap 
              route={historyData.route}
              tpmsData={historyData.tpms}
            />
            <ReplayControls />
            <HistoryDataTable data={historyData.points} />
          </>
        )}
      </div>
    </TailwindLayout>
  );
};
```

#### **Step 2: Filter Selection**
```javascript
// Filters Panel Component
const FiltersPanel = ({ onTruckChange, onDateChange, onSearch }) => {
  const { trucks } = useTrucks();
  const [filters, setFilters] = useState({
    truckId: null,
    startDate: null,
    endDate: null
  });
  
  const handleSearch = () => {
    if (!filters.truckId || !filters.startDate || !filters.endDate) {
      toast.error('Please select truck and date range');
      return;
    }
    
    onSearch(filters);
  };
  
  return (
    <div className=\"filters-panel\">
      <Select
        label=\"Select Truck\"
        options={trucks}
        value={filters.truckId}
        onChange={(value) => setFilters({...filters, truckId: value})}
      />
      
      <DatePicker
        label=\"Start Date\"
        value={filters.startDate}
        onChange={(date) => setFilters({...filters, startDate: date})}
      />
      
      <DatePicker
        label=\"End Date\"
        value={filters.endDate}
        onChange={(date) => setFilters({...filters, endDate: date})}
      />
      
      <Button onClick={handleSearch}>
        Search History
      </Button>
    </div>
  );
};
```

#### **Step 3: Fetch History Data**
```javascript
// API Call
const handleSearch = async (filters) => {
  setLoading(true);
  
  try {
    const response = await historyApi.getTrackingHistory({
      device_id: filters.truckId,
      start_date: filters.startDate.toISOString(),
      end_date: filters.endDate.toISOString(),
      include_tpms: true
    });
    
    setHistoryData(response.data);
  } catch (error) {
    toast.error('Failed to fetch history data');
  } finally {
    setLoading(false);
  }
};

// Response structure
{
  device_id: 'DEV001',
  vin: 'TRUCK001',
  startDate: '2025-12-20T00:00:00Z',
  endDate: '2025-12-20T23:59:59Z',
  totalPoints: 1440,
  totalDistance: 245.5, // km
  route: {
    type: 'LineString',
    coordinates: [
      [117.1234, -1.5678],
      [117.1240, -1.5680],
      // ... more points
    ]
  },
  points: [
    {
      timestamp: '2025-12-20T08:15:30Z',
      latitude: -1.5678,
      longitude: 117.1234,
      speed: 45,
      heading: 180,
      status: 'active'
    }
    // ... more points
  ],
  tpms: [
    {
      timestamp: '2025-12-20T08:15:30Z',
      sensors: [
        { tire_no: 1, pressure: 110, temperature: 65 }
        // ... 9 sensors lainnya
      ]
    }
  ]
}
```

#### **Step 4: Display Route on Map**
```javascript
// src/components/tracking/HistoryMap.jsx
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

const HistoryMap = ({ route, tpmsData }) => {
  const [currentPoint, setCurrentPoint] = useState(0);
  
  return (
    <MapContainer center={route.coordinates[0]} zoom={13}>
      <TileLayer url=\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\" />
      
      {/* Route Line */}
      <Polyline
        positions={route.coordinates.map(c => [c[1], c[0]])}
        color=\"blue\"
        weight={3}
      />
      
      {/* Start Marker */}
      <Marker
        position={[route.coordinates[0][1], route.coordinates[0][0]]}
        icon={L.icon({
          iconUrl: '/icons/start-marker.png',
          iconSize: [32, 32]
        })}
      >
        <Popup>Start Point</Popup>
      </Marker>
      
      {/* End Marker */}
      <Marker
        position={[
          route.coordinates[route.coordinates.length-1][1],
          route.coordinates[route.coordinates.length-1][0]
        ]}
        icon={L.icon({
          iconUrl: '/icons/end-marker.png',
          iconSize: [32, 32]
        })}
      >
        <Popup>End Point</Popup>
      </Marker>
      
      {/* Current Position (for replay) */}
      {currentPoint > 0 && (
        <Marker
          position={[
            route.coordinates[currentPoint][1],
            route.coordinates[currentPoint][0]
          ]}
          icon={L.icon({
            iconUrl: '/icons/truck-marker.png',
            iconSize: [40, 40]
          })}
        />
      )}
    </MapContainer>
  );
};
```

#### **Step 5: Replay Controls**
```javascript
// src/components/tracking/ReplayControls.jsx
const ReplayControls = ({ totalPoints, onPointChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const intervalRef = useRef(null);
  
  const handlePlay = () => {
    setIsPlaying(true);
    
    intervalRef.current = setInterval(() => {
      setCurrentPoint(prev => {
        if (prev >= totalPoints - 1) {
          handlePause();
          return 0;
        }
        return prev + 1;
      });
    }, 1000 / speed); // Adjust interval based on speed
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  
  const handleReset = () => {
    handlePause();
    setCurrentPoint(0);
    onPointChange(0);
  };
  
  const handleSpeedChange = (newSpeed) => {
    const wasPlaying = isPlaying;
    handlePause();
    setSpeed(newSpeed);
    if (wasPlaying) {
      handlePlay();
    }
  };
  
  useEffect(() => {
    onPointChange(currentPoint);
  }, [currentPoint]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return (
    <div className=\"replay-controls\">
      <div className=\"controls-buttons\">
        <Button onClick={handleReset}>
          <ResetIcon />
        </Button>
        
        {!isPlaying ? (
          <Button onClick={handlePlay}>
            <PlayIcon /> Play
          </Button>
        ) : (
          <Button onClick={handlePause}>
            <PauseIcon /> Pause
          </Button>
        )}
      </div>
      
      <div className=\"speed-selector\">
        <label>Speed:</label>
        {[1, 2, 5, 10].map(s => (
          <Button
            key={s}
            variant={speed === s ? 'primary' : 'secondary'}
            onClick={() => handleSpeedChange(s)}
          >
            {s}x
          </Button>
        ))}
      </div>
      
      <div className=\"progress-bar\">
        <input
          type=\"range\"
          min={0}
          max={totalPoints - 1}
          value={currentPoint}
          onChange={(e) => setCurrentPoint(parseInt(e.target.value))}
        />
        <span>{currentPoint} / {totalPoints}</span>
      </div>
    </div>
  );
};
```

#### **Step 6: History Data Table**
```javascript
// src/components/tracking/HistoryDataTable.jsx
const HistoryDataTable = ({ data }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  const paginatedData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  return (
    <div className=\"history-table\">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Speed (km/h)</th>
            <th>Heading</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((point, index) => (
            <tr key={index}>
              <td>{new Date(point.timestamp).toLocaleString()}</td>
              <td>{point.latitude.toFixed(6)}</td>
              <td>{point.longitude.toFixed(6)}</td>
              <td>{point.speed}</td>
              <td>{point.heading}°</td>
              <td>
                <StatusBadge status={point.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(data.length / itemsPerPage)}
        onPageChange={setPage}
      />
    </div>
  );
};
```

#### **Step 7: TPMS Data Timeline**
```javascript
// Display TPMS data alongside tracking history
const TPMSTimeline = ({ tpmsData, currentTimestamp }) => {
  // Find TPMS data closest to current timestamp
  const currentTPMS = tpmsData.find(t => 
    new Date(t.timestamp).getTime() === new Date(currentTimestamp).getTime()
  );
  
  if (!currentTPMS) return null;
  
  return (
    <div className=\"tpms-timeline\">
      <h4>TPMS Data at {new Date(currentTimestamp).toLocaleString()}</h4>
      <div className=\"tire-grid-small\">
        {currentTPMS.sensors.map(sensor => (
          <div key={sensor.tire_no} className=\"tire-mini\">
            <span>Tire {sensor.tire_no}</span>
            <span>{sensor.pressure} PSI</span>
            <span>{sensor.temperature}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 10. Alur Kerja Alert System

### 10.1 Flow Diagram

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  Sensor/    │───>│   Backend    │───>│   Alert     │───>│ Database │
│  Tracking   │    │  Monitoring  │    │  Detection  │    │  Store   │
│  Data       │    └──────────────┘    └─────────────┘    └──────────┘
└─────────────┘             │                    │               │
                            ↓                    ↓               ↓
                   ┌─────────────────┐  ┌──────────────────────────┐
                   │  Alert Rules    │  │  Alert Classification    │
                   │  - Tire Press   │  │  - Critical (Red)        │
                   │  - Temperature  │  │  - High (Orange)         │
                   │  - Speed        │  │  - Medium (Yellow)       │
                   │  - Geofence     │  │  - Low (Blue)            │
                   └─────────────────┘  └──────────────────────────┘
                            │                    │
                            ↓                    ↓
                   ┌─────────────────────────────────┐
                   │      Notification System        │
                   │  ┌────────┐  ┌──────────────┐  │
                   │  │WebSocket│  │  Frontend    │  │
                   │  │Broadcast│→ │  Toast/Modal │  │
                   │  └────────┘  └──────────────┘  │
                   └─────────────────────────────────┘
```

### 10.2 Step-by-Step Process

#### **Step 1: Alert Detection Rules (Backend)**
```javascript
// Backend logic for alert detection
const ALERT_RULES = {
  TIRE_PRESSURE: {
    critical: { min: 0, max: 80 },
    high: { min: 80, max: 90 },
    medium: { min: 115, max: 125 }
  },
  TIRE_TEMPERATURE: {
    critical: { min: 90, max: 150 },
    high: { min: 80, max: 90 },
    medium: { min: 70, max: 80 }
  },
  SPEED: {
    critical: { min: 100, max: 200 }, // Over speed limit
    high: { min: 90, max: 100 }
  },
  BATTERY: {
    critical: { min: 0, max: 10 },
    high: { min: 10, max: 20 }
  }
};

// Alert detection function
function detectAlerts(sensorData) {
  const alerts = [];
  
  // Check tire pressure
  sensorData.sensors.forEach(sensor => {
    const pressure = sensor.pressure;
    
    if (pressure <= ALERT_RULES.TIRE_PRESSURE.critical.max) {
      alerts.push({
        type: 'TIRE_PRESSURE',
        severity: 'critical',
        message: `Tire ${sensor.tire_no} pressure critically low: ${pressure} PSI`,
        device_id: sensorData.device_id,
        vin: sensorData.vin,
        metadata: {
          tire_no: sensor.tire_no,
          current_value: pressure,
          threshold: ALERT_RULES.TIRE_PRESSURE.critical.max
        }
      });
    }
    
    // Check tire temperature
    const temp = sensor.temperature;
    if (temp >= ALERT_RULES.TIRE_TEMPERATURE.critical.min) {
      alerts.push({
        type: 'TIRE_TEMPERATURE',
        severity: 'critical',
        message: `Tire ${sensor.tire_no} temperature critically high: ${temp}°C`,
        device_id: sensorData.device_id,
        vin: sensorData.vin,
        metadata: {
          tire_no: sensor.tire_no,
          current_value: temp,
          threshold: ALERT_RULES.TIRE_TEMPERATURE.critical.min
        }
      });
    }
  });
  
  return alerts;
}
```

#### **Step 2: Store Alerts in Database**
```javascript
// Save alert to database
async function saveAlert(alert) {
  const alertDocument = {
    alert_id: generateUUID(),
    type: alert.type,
    severity: alert.severity,
    title: getAlertTitle(alert.type),
    message: alert.message,
    device_id: alert.device_id,
    vin: alert.vin,
    metadata: alert.metadata,
    resolved: false,
    created_at: new Date(),
    created_by: 'SYSTEM'
  };
  
  await db.collection('alerts').insertOne(alertDocument);
  
  return alertDocument;
}
```

#### **Step 3: Broadcast Alert via WebSocket**
```javascript
// Send alert to all connected clients
function broadcastAlert(alert) {
  // Send to WebSocket clients
  wsServer.broadcast({
    type: 'alerts',
    data: alert
  });
  
  // Also send to specific truck monitoring clients
  wsServer.broadcastToChannel(`truck_${alert.device_id}`, {
    type: 'alert',
    data: alert
  });
}
```

#### **Step 4: Frontend - Alert Reception**
```javascript
// src/hooks/useAlert.js
export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  
  useEffect(() => {
    // Connect to WebSocket
    wsRef.current = new FleetWebSocket();
    wsRef.current.connect();
    
    // Subscribe to alerts channel
    wsRef.current.subscribe('alerts', (alert) => {
      // Add to alerts list
      setAlerts(prev => [alert, ...prev]);
      
      // Show notification
      showAlertNotification(alert);
    });
    
    // Fetch existing alerts on mount
    fetchAlerts();
    
    return () => {
      wsRef.current.disconnect();
    };
  }, []);
  
  const showAlertNotification = (alert) => {
    // Use toast notification
    const toastConfig = {
      critical: { duration: 10000, icon: '🔴' },
      high: { duration: 7000, icon: '🟠' },
      medium: { duration: 5000, icon: '🟡' },
      low: { duration: 3000, icon: '🔵' }
    };
    
    const config = toastConfig[alert.severity];
    
    toast.error(
      <div>
        <strong>{config.icon} {alert.title}</strong>
        <p>{alert.message}</p>
        <small>{alert.vin}</small>
      </div>,
      { duration: config.duration }
    );
    
    // Play sound for critical alerts
    if (alert.severity === 'critical') {
      playAlertSound();
    }
  };
  
  const fetchAlerts = async () => {
    try {
      const response = await alertsApi.getAll({
        resolved: false,
        limit: 50
      });
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };
  
  const resolveAlert = async (alertId, resolution) => {
    try {
      await alertsApi.resolve(alertId, resolution);
      setAlerts(prev => prev.filter(a => a.alert_id !== alertId));
      toast.success('Alert resolved');
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };
  
  return {
    alerts,
    resolveAlert,
    refetch: fetchAlerts
  };
};
```

#### **Step 5: Alerts List Page**
```javascript
// src/pages/listdata/Alerts.jsx
const Alerts = () => {
  const [filters, setFilters] = useState({
    severity: 'all',
    resolved: false,
    startDate: null,
    endDate: null
  });
  
  const { alerts, loading, refetch } = useAlerts(filters);
  
  return (
    <TailwindLayout>
      <div className=\"alerts-page\">
        <div className=\"header\">
          <h1>Alerts Management</h1>
          <div className=\"stats\">
            <StatBadge label=\"Critical\" count={alerts.filter(a => a.severity === 'critical').length} color=\"red\" />
            <StatBadge label=\"High\" count={alerts.filter(a => a.severity === 'high').length} color=\"orange\" />
            <StatBadge label=\"Medium\" count={alerts.filter(a => a.severity === 'medium').length} color=\"yellow\" />
          </div>
        </div>
        
        <FiltersBar
          filters={filters}
          onFilterChange={setFilters}
        />
        
        <AlertsTable
          alerts={alerts}
          loading={loading}
          onResolve={handleResolve}
          onView={handleView}
        />
      </div>
    </TailwindLayout>
  );
};
```

#### **Step 6: Alerts Table**
```javascript
// Alert Table Component
const AlertsTable = ({ alerts, onResolve, onView }) => {
  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <table className=\"alerts-table\">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Severity</th>
          <th>Type</th>
          <th>Truck</th>
          <th>Message</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map(alert => (
          <tr key={alert.alert_id}>
            <td>{new Date(alert.created_at).toLocaleString()}</td>
            <td>
              <span className={`badge ${severityColors[alert.severity]}`}>
                {alert.severity.toUpperCase()}
              </span>
            </td>
            <td>{alert.type}</td>
            <td>{alert.vin}</td>
            <td>{alert.message}</td>
            <td>
              {alert.resolved ? (
                <span className=\"badge bg-green-100 text-green-800\">
                  Resolved
                </span>
              ) : (
                <span className=\"badge bg-gray-100 text-gray-800\">
                  Active
                </span>
              )}
            </td>
            <td>
              <Button size=\"sm\" onClick={() => onView(alert)}>
                View
              </Button>
              {!alert.resolved && (
                <Button size=\"sm\" variant=\"primary\" onClick={() => onResolve(alert.alert_id)}>
                  Resolve
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

#### **Step 7: Alert Detail Modal**
```javascript
// Alert Detail Component
const AlertDetailModal = ({ alert, onClose, onResolve }) => {
  const [resolution, setResolution] = useState('');
  
  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    
    await onResolve(alert.alert_id, {
      resolved_at: new Date(),
      resolved_by: currentUser.username,
      resolution_notes: resolution
    });
    
    onClose();
  };
  
  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className=\"alert-detail\">
        <h2>Alert Details</h2>
        
        <div className=\"detail-grid\">
          <div className=\"detail-item\">
            <label>Alert ID:</label>
            <span>{alert.alert_id}</span>
          </div>
          
          <div className=\"detail-item\">
            <label>Severity:</label>
            <SeverityBadge severity={alert.severity} />
          </div>
          
          <div className=\"detail-item\">
            <label>Type:</label>
            <span>{alert.type}</span>
          </div>
          
          <div className=\"detail-item\">
            <label>Truck:</label>
            <span>{alert.vin}</span>
          </div>
          
          <div className=\"detail-item\">
            <label>Message:</label>
            <span>{alert.message}</span>
          </div>
          
          <div className=\"detail-item\">
            <label>Created:</label>
            <span>{new Date(alert.created_at).toLocaleString()}</span>
          </div>
          
          {alert.metadata && (
            <div className=\"detail-item full-width\">
              <label>Additional Info:</label>
              <pre>{JSON.stringify(alert.metadata, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {!alert.resolved && (
          <div className=\"resolution-form\">
            <h3>Resolve Alert</h3>
            <textarea
              placeholder=\"Resolution notes...\"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
            <Button onClick={handleResolve}>
              Mark as Resolved
            </Button>
          </div>
        )}
        
        {alert.resolved && (
          <div className=\"resolution-info\">
            <h3>Resolution</h3>
            <p><strong>Resolved by:</strong> {alert.resolved_by}</p>
            <p><strong>Resolved at:</strong> {new Date(alert.resolved_at).toLocaleString()}</p>
            <p><strong>Notes:</strong> {alert.resolution_notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
```

#### **Step 8: Alert Sound Notification**
```javascript
// src/utils/alertSound.js
export const playAlertSound = () => {
  // Check if notifications are enabled
  if (!localStorage.getItem('alertSoundEnabled')) {
    return;
  }
  
  // Play alert sound
  const audio = new Audio('/sounds/alert.mp3');
  audio.volume = 0.5;
  audio.play().catch(error => {
    console.error('Failed to play alert sound:', error);
  });
};

// Browser notification (if permission granted)
export const showBrowserNotification = (alert) => {
  if (Notification.permission === 'granted') {
    new Notification('Fleet Alert', {
      body: alert.message,
      icon: '/icons/alert-icon.png',
      badge: '/icons/badge.png',
      tag: alert.alert_id,
      requireInteraction: alert.severity === 'critical'
    });
  }
};
```

---

## 11. Tech Stack Detail

### 11.1 Frontend Technologies

#### **Core Framework**
```json
{
  \"react\": \"^19.1.1\",
  \"react-dom\": \"^19.1.1\",
  \"react-router-dom\": \"^7.8.2\"
}
```

**React 19** - Latest version dengan features:
- Server Components support
- Improved performance
- Better TypeScript integration
- Automatic batching

#### **Build Tool**
```json
{
  \"vite\": \"^7.1.2\",
  \"@vitejs/plugin-react-swc\": \"^4.0.0\"
}
```

**Vite 7** - Ultra-fast build tool:
- Lightning fast HMR (Hot Module Replacement)
- Optimized production builds
- Built-in code splitting
- SWC for faster transpilation

#### **Styling**
```json
{
  \"tailwindcss\": \"^4.1.12\",
  \"@tailwindcss/vite\": \"^4.1.12\"
}
```

**Tailwind CSS v4** - Latest version:
- Utility-first CSS framework
- Just-in-Time compilation
- Automatic purging of unused CSS
- Custom design system support

#### **Maps & Geolocation**
```json
{
  \"leaflet\": \"^1.9.4\",
  \"react-leaflet\": \"^5.0.0\",
  \"leaflet-polylinedecorator\": \"^1.6.0\",
  \"@types/leaflet\": \"^1.9.20\"
}
```

**Leaflet** - Interactive maps:
- Lightweight (39KB)
- Mobile-friendly
- Plugin ecosystem
- Custom markers & popups
- Route visualization

#### **Charts & Visualization**
```json
{
  \"recharts\": \"^3.5.1\"
}
```

**Recharts** - React chart library:
- Composable chart components
- Responsive design
- Rich animation
- Support untuk Area, Line, Pie, Bar charts

#### **HTTP Client**
```json
{
  \"axios\": \"^1.11.0\"
}
```

**Axios** - HTTP client:
- Promise-based
- Request/Response interceptors
- Automatic JSON transformation
- Error handling

#### **Real-time Communication**
```json
{
  \"socket.io-client\": \"^4.8.1\"
}
```

**Socket.io Client** - WebSocket library:
- Real-time bidirectional communication
- Auto-reconnection
- Room/Channel support
- Fallback to polling

#### **Icons & UI**
```json
{
  \"lucide-react\": \"^0.540.0\",
  \"@headlessui/react\": \"^2.2.7\",
  \"@heroicons/react\": \"^2.2.0\"
}
```

**Lucide React** - Icon library (600+ icons)
**Headless UI** - Unstyled accessible components
**Heroicons** - SVG icon set

#### **Utilities**
```json
{
  \"uuid\": \"^11.1.0\"
}
```

**UUID** - Generate unique identifiers

#### **Development Tools**
```json
{
  \"eslint\": \"^9.35.0\",
  \"prettier\": \"^3.6.2\",
  \"@types/react\": \"^19.1.10\",
  \"@types/react-dom\": \"^19.1.7\"
}
```

### 11.2 Backend Technologies

**Note**: Backend tidak termasuk dalam repository frontend ini, tapi berinteraksi dengan 2 backend:

#### **Backend 1 (Tracking & TPMS)**
- Framework: FastAPI / Express.js
- Database: MongoDB
- WebSocket: Socket.io / ws
- Endpoints: Tracking, TPMS, Telemetry

#### **Backend 2 (Management)**
- Framework: FastAPI / Express.js
- Database: MongoDB
- Authentication: JWT
- Endpoints: CRUD operations, Dashboard, Alerts

### 11.3 Environment Variables

```bash
# Backend URLs
VITE_API_BASE_URL=https://api.borneo-indobara.com
VITE_TRACKING_API_BASE_URL=https://tracking-api.borneo-indobara.com

# WebSocket URLs
VITE_WS_URL=wss://ws.borneo-indobara.com
VITE_TRACKING_WS_URL=wss://tracking-ws.borneo-indobara.com

# TPMS Configuration
VITE_API_TPMS_REALTIME_ENDPOINT=https://api.borneo-indobara.com/api/tpms/realtime
VITE_API_TPMS_LOCATION_ENDPOINT=https://api.borneo-indobara.com/api/tpms/location
VITE_TPMS_WS_URL=wss://tpms-ws.borneo-indobara.com
```

### 11.4 Build Configuration

**vite.config.js**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      'services': '/src/services',
    }
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
          charts: ['recharts']
        }
      }
    }
  }
});
```

**tailwind.config.js**
```javascript
export default {
  content: [
    \"./index.html\",
    \"./src/**/*.{js,jsx}\"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B'
      }
    }
  }
};
```

---

## 12. Struktur File & Direktori

### 12.1 Struktur Lengkap

```
borneo-indobara/
├── public/                         # Static assets
│   ├── icons/                      # Icon files
│   ├── sounds/                     # Alert sounds
│   └── favicon.ico
│
├── src/
│   ├── components/                 # Reusable components
│   │   ├── auth/                   # Authentication components
│   │   │   └── Login.jsx
│   │   │
│   │   ├── common/                 # Common UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── DatePicker.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── AlertModal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── StatusBadge.jsx
│   │   │
│   │   ├── dashboard/              # Dashboard specific components
│   │   │   ├── StatsCard.jsx
│   │   │   ├── FleetStatusChart.jsx
│   │   │   ├── TruckActivityChart.jsx
│   │   │   └── RecentAlerts.jsx
│   │   │
│   │   ├── chart/                  # Chart components (Recharts)
│   │   │   ├── AreaChartGradient.jsx
│   │   │   └── PieChartLabel.jsx
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── TailwindLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   └── icons/                  # Custom icon components
│   │       ├── TruckIcon.jsx
│   │       └── AlertIcon.jsx
│   │
│   ├── pages/                      # Page components
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── LiveTracking.jsx        # Live tracking page
│   │   ├── HistoryTracking.jsx     # History tracking page
│   │   ├── Analytics.jsx           # Analytics page
│   │   ├── Reports.jsx             # Reports page
│   │   ├── Settings.jsx            # Settings page
│   │   ├── FleetManagement.jsx     # Fleet management overview
│   │   ├── FleetGroups.jsx         # Fleet groups management
│   │   ├── ComingSoon.jsx          # Coming soon placeholder
│   │   │
│   │   ├── form/                   # Form pages (Create/Edit)
│   │   │   ├── TruckForm.jsx
│   │   │   ├── DriverForm.jsx
│   │   │   ├── VendorForm.jsx
│   │   │   ├── DeviceForm.jsx
│   │   │   └── SensorForm.jsx
│   │   │
│   │   ├── listdata/               # List/Table pages
│   │   │   ├── TrucksList.jsx
│   │   │   ├── DriversList.jsx
│   │   │   ├── VendorsList.jsx
│   │   │   ├── Devices.jsx
│   │   │   ├── Sensors.jsx
│   │   │   └── Alerts.jsx
│   │   │
│   │   ├── monitoring/             # Monitoring pages
│   │   │   ├── SensorMonitoring.jsx    # TPMS monitoring
│   │   │   ├── FuelMonitoring.jsx      # Fuel monitoring
│   │   │   ├── LiveTireView.jsx        # Live tire view
│   │   │   └── VehicleDeviceStatus.jsx # Device status
│   │   │
│   │   └── tracking/               # Tracking components
│   │       ├── LiveTrackingMapNew.jsx
│   │       └── HistoryMap.jsx
│   │
│   ├── services/                   # API Services
│   │   ├── index.js                # Main exports
│   │   ├── alertEvents.api.js      # Alert events API
│   │   │
│   │   ├── management/             # Backend 2 APIs (Management)
│   │   │   ├── config.js           # Backend 2 config & axios
│   │   │   ├── index.js            # Export all management APIs
│   │   │   ├── websocket.js        # WebSocket for management
│   │   │   │
│   │   │   ├── base/               # Base API structure
│   │   │   │   └── api.base.js
│   │   │   │
│   │   │   └── modules/            # API modules
│   │   │       ├── index.js
│   │   │       │
│   │   │       ├── auth/           # Authentication
│   │   │       │   └── auth.api.js
│   │   │       │
│   │   │       ├── fleet/          # Fleet management
│   │   │       │   ├── trucks.api.js
│   │   │       │   ├── drivers.api.js
│   │   │       │   ├── vendors.api.js
│   │   │       │   └── fleet.api.js
│   │   │       │
│   │   │       ├── iot/            # IoT devices & sensors
│   │   │       │   ├── iot.api.js
│   │   │       │   ├── devices.api.js
│   │   │       │   └── sensors.api.js
│   │   │       │
│   │   │       ├── monitoring/     # Monitoring & alerts
│   │   │       │   ├── dashboard.api.js
│   │   │       │   └── alerts.api.js
│   │   │       │
│   │   │       └── operations/     # Operations
│   │   │           └── miningArea.api.js
│   │   │
│   │   ├── tracking/               # Backend 1 APIs (Tracking)
│   │   │   ├── config.js           # Tracking API config
│   │   │   ├── index.js            # Export tracking APIs
│   │   │   ├── tracking.api.js     # Live tracking API
│   │   │   ├── history.api.js      # History tracking API
│   │   │   ├── tpms.api.js         # TPMS data API
│   │   │   └── monitoring.api.js   # Monitoring API
│   │   │
│   │   └── websocket/              # WebSocket services
│   │       └── FleetWebSocket.js   # WebSocket client class
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.js              # Authentication hook
│   │   ├── useApi2.js              # Backend 2 data hooks
│   │   ├── useAlert.js             # Alert hook
│   │   └── useAlertNotifications.js # Alert notifications
│   │
│   ├── routes/                     # Route configuration
│   │   ├── index.jsx               # Main routes
│   │   ├── ProtectedRoute.jsx      # Protected route wrapper
│   │   └── PublicRoute.jsx         # Public route wrapper
│   │
│   ├── App.jsx                     # Main App component
│   ├── App.css                     # App styles
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles (Tailwind)
│
├── screenshots/                    # Application screenshots
│
├── Documentation/                  # Documentation files
│   ├── API_ENDPOINTS.md
│   ├── ALERT_EVENTS_API.md
│   ├── FRONTEND_INTEGRATION_DECEMBER_2025.md
│   ├── LIVE_TRACKING_FRONTEND_INTEGRATION.md
│   ├── TIRE_PRESSURE_TEMPERATURE_API.md
│   ├── TRACKING_HISTORY_WITH_TIRE_DATA.md
│   ├── USER_MANAGEMENT_FRONTEND_GUIDE.md
│   └── WEBSOCKET_INTEGRATION_GUIDE.md
│
├── .env.example                    # Environment variables example
├── .eslintrc.cjs                   # ESLint configuration
├── .eslintignore                   # ESLint ignore patterns
├── .prettierrc.json                # Prettier configuration
├── .gitignore                      # Git ignore patterns
│
├── package.json                    # Dependencies & scripts
├── package-lock.json               # Lock file
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── eslint.config.js                # ESLint modern config
│
├── index.html                      # HTML entry point
└── README.md                       # Project README
```

### 12.2 Key Directories Explanation

#### **/src/components**
Komponen React yang reusable di seluruh aplikasi:
- `auth/`: Login, register components
- `common/`: Button, Input, Modal, dll
- `dashboard/`: Dashboard-specific components
- `layout/`: Sidebar, Header, Footer
- `icons/`: Custom icon components

#### **/src/pages**
Halaman-halaman utama aplikasi:
- `Dashboard.jsx`: Halaman dashboard utama
- `LiveTracking.jsx`: Peta tracking real-time
- `HistoryTracking.jsx`: Riwayat tracking
- `form/`: Halaman form untuk CRUD
- `listdata/`: Halaman list/table data
- `monitoring/`: Halaman monitoring TPMS, fuel, dll

#### **/src/services**
Layer service untuk API calls:
- `management/`: API Backend 2 (CRUD, Dashboard, Auth)
- `tracking/`: API Backend 1 (Tracking, TPMS)
- `websocket/`: WebSocket client

#### **/src/hooks**
Custom React hooks:
- `useAuth.js`: Authentication state & methods
- `useApi2.js`: Data fetching hooks
- `useAlert.js`: Alert management

#### **/src/routes**
Konfigurasi routing:
- `index.jsx`: Definisi semua routes
- `ProtectedRoute.jsx`: Route yang memerlukan auth
- `PublicRoute.jsx`: Route public (login, dll)

---

## 📊 Summary Diagram - Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│                                                                      │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐              │
│  │   Login    │→ │  Dashboard   │→ │ Live Tracking │              │
│  └────────────┘  └──────────────┘  └───────────────┘              │
│         │                │                   │                      │
│         ↓                ↓                   ↓                      │
│  ┌─────────────────────────────────────────────────┐              │
│  │         React 19 Application                     │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │              │
│  │  │Components│  │  Hooks   │  │   Services   │  │              │
│  │  └──────────┘  └──────────┘  └──────────────┘  │              │
│  └─────────────────────────────────────────────────┘              │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │                     │
                    ↓                     ↓
          ┌──────────────────┐  ┌──────────────────┐
          │   BACKEND 1      │  │   BACKEND 2      │
          │  (Tracking API)  │  │ (Management API) │
          │                  │  │                  │
          │ - GPS Tracking   │  │ - Authentication │
          │ - TPMS Data      │  │ - CRUD Trucks    │
          │ - Telemetry      │  │ - CRUD Drivers   │
          │ - WebSocket      │  │ - Dashboard      │
          │ - History        │  │ - Alerts         │
          └──────────────────┘  └──────────────────┘
                    │                     │
                    └──────────┬──────────┘
                               ↓
                      ┌─────────────────┐
                      │    MongoDB      │
                      │    Database     │
                      └─────────────────┘
                               ↑
                               │
                      ┌─────────────────┐
                      │   IoT Devices   │
                      │  - GPS Tracker  │
                      │  - TPMS Sensors │
                      │  - Gateway      │
                      └─────────────────┘
```

---

## 🎯 Kesimpulan

Dashboard Fleet Monitoring Borneo Indobara adalah sistem yang kompleks dan terintegrasi dengan baik, menggabungkan:

1. **Frontend Modern**: React 19, Vite 7, Tailwind CSS v4
2. **Real-time Communication**: WebSocket untuk live updates
3. **Dual Backend Architecture**: 
   - Backend 1 untuk Tracking & TPMS
   - Backend 2 untuk Management & CRUD
4. **Rich Features**: 
   - Live tracking dengan peta interaktif
   - TPMS monitoring 10 ban per kendaraan
   - Fleet management lengkap (CRUD)
   - Alert system dengan notifikasi real-time
   - History tracking dengan replay functionality
   - Dashboard analytics dengan charts

Sistem ini dirancang untuk scalability, maintainability, dan user experience yang optimal untuk industri pertambangan dan transportasi.

---

**Dokumen ini dibuat pada**: Desember 2025  
**Versi**: 1.0  
**Status**: Complete
"
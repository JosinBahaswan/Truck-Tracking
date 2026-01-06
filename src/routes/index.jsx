// src/routes/index.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Auth
import Login from '../components/auth/Login';

// Pages
import Dashboard from '../pages/Dashboard';
import Devices from '../pages/listdata/Devices';
import Sensors from '../pages/listdata/Sensors';
import LiveTracking from '../pages/LiveTracking';
import HistoryTracking from '../pages/HistoryTracking';
import Alerts from '../pages/listdata/Alerts';
import Settings from '../pages/Settings';
import TrucksFormList from '../pages/listdata/TrucksList';
import TruckForm from '../pages/form/TruckForm';
// Monitoring Pages
import SensorMonitoring from '../pages/monitoring/SensorMonitoring';
import VendorsList from '../pages/listdata/VendorsList';
import VendorForm from '../pages/form/VendorForm';
import DriversList from '../pages/listdata/DriversList';
import DriverForm from '../pages/form/DriverForm';
import DeviceForm from '../pages/form/DeviceForm';
import SensorForm from '../pages/form/SensorForm';
import MasterData from '../pages/MasterData';

/**
 * Application Routes Configuration
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Tracking */}
      <Route
        path="/live-tracking"
        element={
          <ProtectedRoute>
            <LiveTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history-tracking"
        element={
          <ProtectedRoute>
            <HistoryTracking />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - IoT Devices */}
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Devices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devices/:id"
        element={
          <ProtectedRoute>
            <DeviceForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sensors"
        element={
          <ProtectedRoute>
            <Sensors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sensors/:id"
        element={
          <ProtectedRoute>
            <SensorForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Trucks */}
      <Route
        path="/trucks"
        element={
          <ProtectedRoute>
            <TrucksFormList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trucks/:id"
        element={
          <ProtectedRoute>
            <TruckForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Monitoring */}
      <Route
        path="/monitoring/sensors"
        element={
          <ProtectedRoute>
            <SensorMonitoring />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Vendors */}
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <VendorsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors/:id"
        element={
          <ProtectedRoute>
            <VendorForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Drivers */}
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <DriversList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <ProtectedRoute>
            <DriverForm />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Alerts */}
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Master Data */}
      <Route
        path="/master-data"
        element={
          <ProtectedRoute>
            <MasterData />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all route - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

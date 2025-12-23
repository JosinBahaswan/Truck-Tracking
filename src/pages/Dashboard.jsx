// src/pages/Dashboard.jsx
/**
 * Dashboard Page - Fleet Management Overview
 * 
 * Features:
 * - 4 Stat Cards: Total Vehicles, Active, Maintenance, Alerts
 * - Fleet Status Pie Chart: Distribution of vehicle status
 * - Fuel Consumption Area Chart: Monthly fuel usage trends
 * - Tire Pressure Donut Chart: TPMS monitoring status
 * - Temperature Area Chart: Hub temperature monitoring
 * - Alert Trends Bar Chart: Weekly alert distribution
 * - Top Performing Vehicles: Best performing fleet
 * - Recent Alerts Timeline: Latest alerts and notifications
 * 
 * Data Sources:
 * - Backend 2 (Management API): /dashboard/stats, /alerts, /trucks
 * - Real-time updates via WebSocket
 */
import React from 'react';
import { Link } from 'react-router-dom';
import TailwindLayout from '../components/layout/TailwindLayout';
import TailwindFleetOverview from '../components/dashboard/TailwindFleetOverview';

const Dashboard = () => {
  return (
    <TailwindLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with primary CTA */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor seluruh aktivitas fleet Anda</p>
            </div>
            <Link
              to="/live-tracking"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 transition-all"
            >      
              Go to Live Tracking
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M3.75 10a.75.75 0 01.75-.75h8.69L10.22 6.28a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06l2.97-2.97H4.5A.75.75 0 013.75 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          {/* Existing overview content */}
          <TailwindFleetOverview />
        </div>
      </div>
    </TailwindLayout>
  );
};

export default Dashboard;

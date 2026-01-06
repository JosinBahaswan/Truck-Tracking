import React, { useEffect, useState } from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import TailwindStatCard from './TailwindStatCard';
import FleetStatusChart from '../chart/FleetStatusChart';
import TirePressureChart from '../chart/TirePressureChart';
import TemperatureChart from '../chart/TemperatureChart';
import AlertTrendsChart from '../chart/AlertTrendsChart';
import VehicleActivityChart from '../chart/VehicleActivityChart';
// Use Backend 2 APIs
import { dashboardApi, alertsApi, trucksApi } from 'services/management';
import fleetWebSocket from 'services/management/websocket';

const TailwindFleetOverview = () => {
  const [fleetStats, setFleetStats] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [tirePressureData, setTirePressureData] = useState([
    { name: 'Normal', value: 0 },
    { name: 'Warning', value: 0 },
    { name: 'Critical', value: 0 },
    { name: 'No Data', value: 0 },
  ]);
  const [alertTrendsData, setAlertTrendsData] = useState([]);
  const [vehicleStatusData, setVehicleStatusData] = useState([
    { name: 'Active', value: 45 },
    { name: 'Maintenance', value: 8 },
    { name: 'Inactive', value: 12 },
    { name: 'Idle', value: 15 },
  ]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load dashboard data from Backend 2
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setLastRefresh(new Date());

        // Stats from Backend 2
        let totalTrucks = 0;
        let activeTrucks = 0;
        let maintenanceTrucks = 0;
        let totalAlerts = 0;
        let inactiveTrucks = 0;

        try {
          const statsRes = await dashboardApi.getStats();
          console.log('📊 Dashboard stats from Backend 2:', statsRes);

          if (statsRes?.data) {
            const s = statsRes.data;
            totalTrucks = Number(s.totalTrucks || 0);
            activeTrucks = Number(s.activeTrucks || 0);
            maintenanceTrucks = Number(s.maintenanceTrucks || 0);
            inactiveTrucks = Number(s.inactiveTrucks || 0);
            totalAlerts = Number(s.alertsCount || s.totalAlerts || 0);
          }
        } catch (error) {
          console.error('❌ Error fetching dashboard stats:', error);
          // Fallback: get from trucks list
          try {
            const listRes = await trucksApi.getAll({ limit: 200 });
            const trucks = listRes?.data?.trucks || [];
            const stats = listRes?.data?.stats || {};

            totalTrucks = stats.total_trucks || trucks.length || 0;
            activeTrucks = stats.active || 0;
            maintenanceTrucks = stats.maintenance || 0;
            inactiveTrucks = stats.inactive || 0;
          } catch (err) {
            console.error('❌ Fallback also failed:', err);
          }
        }

        setFleetStats([
          {
            title: 'Total Vehicles',
            value: String(totalTrucks),
            change: '0',
            changeType: 'neutral',
            icon: TruckIcon,
            color: 'indigo',
            subtitle: 'Active Fleet',
          },
          {
            title: 'Active Vehicles',
            value: String(activeTrucks),
            change: '0',
            changeType: 'neutral',
            icon: CheckCircleIcon,
            color: 'green',
            subtitle: 'Currently Running',
          },
          {
            title: 'Maintenance',
            value: String(maintenanceTrucks),
            change: '0',
            changeType: 'neutral',
            icon: ExclamationTriangleIcon,
            color: 'yellow',
            subtitle: 'Under Maintenance',
          },
          {
            title: 'Alerts',
            value: String(totalAlerts),
            change: '0',
            changeType: 'neutral',
            icon: XCircleIcon,
            color: 'red',
            subtitle: 'Active Alerts',
          },
        ]);

        // Use dummy data if API returns zero values
        const statusData = [
          { name: 'Active', value: activeTrucks || 45 },
          { name: 'Maintenance', value: maintenanceTrucks || 8 },
          { name: 'Inactive', value: inactiveTrucks || 12 },
          {
            name: 'Idle',
            value:
              totalTrucks > 0
                ? Math.max(totalTrucks - activeTrucks - maintenanceTrucks - inactiveTrucks, 0)
                : 15,
          },
        ];

        console.log('📊 Fleet Status Data:', statusData);
        setVehicleStatusData(statusData);

        // Temperature data from trucks
        try {
          const tempList = await trucksApi.getAll({ limit: 50 });
          const trucks = tempList?.data?.trucks || [];

          // Aggregate temperature data
          const tempMap = {};
          trucks.forEach((truck) => {
            if (truck.tpms && Array.isArray(truck.tpms)) {
              truck.tpms.forEach((tire) => {
                const hour = new Date().getHours();
                const key = `${hour}:00`;
                if (!tempMap[key]) {
                  tempMap[key] = { temps: [], time: key };
                }
                if (tire.temperature) {
                  tempMap[key].temps.push(tire.temperature);
                }
              });
            }
          });

          const tempData = Object.values(tempMap).map((item) => ({
            time: item.time,
            average:
              item.temps.length > 0
                ? Math.round(item.temps.reduce((a, b) => a + b, 0) / item.temps.length)
                : 0,
            max: item.temps.length > 0 ? Math.max(...item.temps) : 0,
          }));

          if (tempData.length === 0) {
            // Mock temperature data
            setTemperatureData([
              { time: '08:00', average: 65, max: 72 },
              { time: '10:00', average: 68, max: 75 },
              { time: '12:00', average: 72, max: 82 },
              { time: '14:00', average: 74, max: 85 },
              { time: '16:00', average: 70, max: 78 },
              { time: '18:00', average: 67, max: 74 },
            ]);
          } else {
            setTemperatureData(tempData);
          }
        } catch (error) {
          console.error('❌ Error fetching temperature data:', error);
          setTemperatureData([
            { time: '08:00', average: 65, max: 72 },
            { time: '10:00', average: 68, max: 75 },
            { time: '12:00', average: 72, max: 82 },
            { time: '14:00', average: 74, max: 85 },
            { time: '16:00', average: 70, max: 78 },
            { time: '18:00', average: 67, max: 74 },
          ]);
        }

        // Tire pressure data
        try {
          const tireList = await trucksApi.getAll({ limit: 100 });
          const trucks = tireList?.data?.trucks || [];

          console.log('🔧 Fetching tire pressure data from trucks:', trucks.length, 'trucks');

          let normalCount = 0;
          let warningCount = 0;
          let criticalCount = 0;
          let noDataCount = 0;
          let hasTpmsData = false;

          trucks.forEach((truck) => {
            // Check multiple possible structures: tpms, sensors, tire_sensors
            const tireData = truck.tpms || truck.sensors || truck.tire_sensors || [];

            if (Array.isArray(tireData) && tireData.length > 0) {
              hasTpmsData = true;
              tireData.forEach((tire) => {
                const pressure = tire.pressure || tire.tirepValue || tire.tire_pressure || 0;

                if (!pressure || pressure === 0) {
                  noDataCount++;
                } else if (pressure < 80) {
                  criticalCount++;
                } else if (pressure < 100) {
                  warningCount++;
                } else {
                  normalCount++;
                }
              });
            }
          });

          // If no TPMS data found in any truck, use fallback
          if (
            !hasTpmsData ||
            (normalCount === 0 && warningCount === 0 && criticalCount === 0 && noDataCount === 0)
          ) {
            console.log('⚠️ No TPMS data found, using fallback data');
            const fallbackData = [
              { name: 'Normal', value: 120 },
              { name: 'Warning', value: 15 },
              { name: 'Critical', value: 5 },
              { name: 'No Data', value: 10 },
            ];
            setTirePressureData(fallbackData);
          } else {
            const tireDataResult = [
              { name: 'Normal', value: normalCount },
              { name: 'Warning', value: warningCount },
              { name: 'Critical', value: criticalCount },
              { name: 'No Data', value: noDataCount },
            ];

            console.log('🔧 Tire Pressure Data prepared:', tireDataResult);
            setTirePressureData(tireDataResult);
          }
        } catch (error) {
          console.error('❌ Error fetching tire pressure data:', error);
          const fallbackData = [
            { name: 'Normal', value: 120 },
            { name: 'Warning', value: 15 },
            { name: 'Critical', value: 5 },
            { name: 'No Data', value: 10 },
          ];
          console.log('🔧 Using fallback tire pressure data (error):', fallbackData);
          setTirePressureData(fallbackData);
        }

        // Alert trends data (last 7 days)
        try {
          const alertsRes = await alertsApi.getAll({ limit: 100 });
          const alerts = alertsRes?.data?.alerts || [];

          // Group alerts by day
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const alertsByDay = days.map((day) => ({
            day,
            critical: 0,
            warning: 0,
            info: 0,
          }));

          // Populate with real data if available
          const now = new Date();
          alerts.forEach((alert) => {
            const alertDate = new Date(alert.occurredAt || alert.createdAt);
            const daysAgo = Math.floor((now - alertDate) / (1000 * 60 * 60 * 24));

            if (daysAgo < 7) {
              const dayIndex = (now.getDay() - daysAgo + 7) % 7;
              const severity = alert.severity?.toLowerCase() || 'info';

              if (severity.includes('critical') || severity.includes('high')) {
                alertsByDay[dayIndex].critical++;
              } else if (severity.includes('warning') || severity.includes('medium')) {
                alertsByDay[dayIndex].warning++;
              } else {
                alertsByDay[dayIndex].info++;
              }
            }
          });

          // If no data, use mock data
          if (alerts.length === 0) {
            setAlertTrendsData([
              { day: 'Mon', critical: 2, warning: 5, info: 8 },
              { day: 'Tue', critical: 1, warning: 4, info: 6 },
              { day: 'Wed', critical: 3, warning: 6, info: 7 },
              { day: 'Thu', critical: 0, warning: 3, info: 5 },
              { day: 'Fri', critical: 2, warning: 5, info: 9 },
              { day: 'Sat', critical: 1, warning: 2, info: 4 },
              { day: 'Sun', critical: 0, warning: 1, info: 3 },
            ]);
          } else {
            setAlertTrendsData(alertsByDay);
          }
        } catch (error) {
          console.error('❌ Error fetching alert trends:', error);
          setAlertTrendsData([
            { day: 'Mon', critical: 2, warning: 5, info: 8 },
            { day: 'Tue', critical: 1, warning: 4, info: 6 },
            { day: 'Wed', critical: 3, warning: 6, info: 7 },
            { day: 'Thu', critical: 0, warning: 3, info: 5 },
            { day: 'Fri', critical: 2, warning: 5, info: 9 },
            { day: 'Sat', critical: 1, warning: 2, info: 4 },
            { day: 'Sun', critical: 0, warning: 1, info: 3 },
          ]);
        }
      } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(loadDashboardData, 300000);

    // Connect WebSocket for real-time updates
    fleetWebSocket.connect();
    fleetWebSocket.subscribe('dashboard');

    // Listen for dashboard updates
    const handleDashboardUpdate = (data) => {
      console.log('📡 Real-time dashboard update:', data);
      loadDashboardData();
    };

    fleetWebSocket.on('dashboardUpdate', handleDashboardUpdate);

    return () => {
      clearInterval(interval);
      fleetWebSocket.off('dashboardUpdate', handleDashboardUpdate);
      fleetWebSocket.unsubscribe('dashboard');
    };
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    setLastRefresh(new Date());

    // Trigger a full reload by changing state to force re-render
    try {
      const statsRes = await dashboardApi.getStats();
      console.log('🔄 Manual refresh - Stats:', statsRes);

      if (statsRes?.data) {
        const s = statsRes.data;
        const totalTrucks = Number(s.totalTrucks || 0);
        const activeTrucks = Number(s.activeTrucks || 0);
        const maintenanceTrucks = Number(s.maintenanceTrucks || 0);
        const inactiveTrucks = Number(s.inactiveTrucks || 0);

        const statusData = [
          { name: 'Active', value: activeTrucks || 0 },
          { name: 'Maintenance', value: maintenanceTrucks || 0 },
          { name: 'Inactive', value: inactiveTrucks || 0 },
          {
            name: 'Idle',
            value: Math.max(totalTrucks - activeTrucks - maintenanceTrucks - inactiveTrucks, 0),
          },
        ];

        console.log('🔄 Manual refresh - Setting vehicle status data:', statusData);
        setVehicleStatusData(statusData);
      }
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Last Refresh Indicator */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString('id-ID')}</span>
            <span className="text-xs text-gray-400">(Auto-refresh every 5 minutes)</span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard manually"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Now</span>
          </button>
        </div>

        {/* Header */}

        {/* <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Fleet Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time monitoring and analytics for your fleet operations
          </p>
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            : fleetStats.map((stat, index) => <TailwindStatCard key={index} {...stat} />)}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2" key="vehicle-activity-chart-container">
            <VehicleActivityChart loading={loading} />
          </div>
          <div className="lg:col-span-1" key="fleet-status-chart-outer">
            <FleetStatusChart data={vehicleStatusData} loading={loading} />
          </div>
        </div>

        {/* Alert Trends Chart - Full Width */}
        <div className="mb-8">
          <AlertTrendsChart data={alertTrendsData} loading={loading} />
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          <div key="tire-pressure-chart-outer">
            <TirePressureChart data={tirePressureData} loading={loading} />
          </div>
          <div key="temperature-chart-outer">
            <TemperatureChart data={temperatureData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindFleetOverview;

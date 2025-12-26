import React, { useState, useEffect, useMemo } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import AlertModal from '../../components/common/AlertModal.jsx';
import { trucksApi } from 'services/management';
import { Button } from '../../components/common/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/common/DropdownMenu.jsx';

export default function FuelMonitoring() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading fuel data...');

        const res = await trucksApi.getAll();
        console.log('✅ Trucks response:', res);

        const trucks = res?.data?.trucks || res?.data || [];

        if (!Array.isArray(trucks) || trucks.length === 0) {
          console.warn('No trucks data available');
          if (mounted) {
            setData([]);
            setLoading(false);
          }
          return;
        }

        // Transform fuel data
        const fuelData = trucks.map((truck) => {
          const fuel = truck.fuel_sensor || {};
          return {
            id: truck.id,
            truckCode: truck.unit_code || 'N/A',
            truckName: truck.truck_number || 'N/A',
            fuelLevel: fuel.fuel_level || 0,
            fuelCapacity: fuel.fuel_capacity || 100,
            fuelPercentage:
              fuel.fuel_level && fuel.fuel_capacity
                ? (fuel.fuel_level / fuel.fuel_capacity) * 100
                : 0,
            consumption: fuel.consumption_rate || 0,
            efficiency: fuel.fuel_efficiency || 0,
            timestamp: fuel.timestamp || new Date().toISOString(),
          };
        });

        if (mounted) {
          setData(fuelData);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading fuel data:', error);
        if (mounted) {
          setData([]);
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every 60s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Get status based on fuel percentage
  const getStatus = (truck) => {
    const percent = truck.fuelPercentage;
    if (percent <= 10) return 'Critical';
    if (percent <= 25) return 'Low';
    if (percent <= 50) return 'Medium';
    return 'Good';
  };

  // Filter logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.truckCode.toLowerCase().includes(term) || item.truckName.toLowerCase().includes(term)
      );
    }

    // Truck filter
    if (selectedTruck) {
      result = result.filter((item) => item.truckCode === selectedTruck);
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((item) => getStatus(item) === selectedStatus);
    }

    return result;
  }, [data, searchTerm, selectedTruck, selectedStatus]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = filteredData.length;
    const good = filteredData.filter((item) => getStatus(item) === 'Good').length;
    const low = filteredData.filter((item) => getStatus(item) === 'Low').length;
    const critical = filteredData.filter((item) => getStatus(item) === 'Critical').length;
    const avgFuel =
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.fuelPercentage, 0) / filteredData.length
        : 0;

    return { total, good, low, critical, avgFuel };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Get unique trucks for filter dropdown
  const uniqueTrucks = useMemo(() => {
    return [...new Set(data.map((item) => item.truckCode))].sort();
  }, [data]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTruck, selectedStatus, itemsPerPage]);

  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      Good: 'bg-green-100 text-green-800',
      Medium: 'bg-blue-100 text-blue-800',
      Low: 'bg-yellow-100 text-yellow-800',
      Critical: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  return (
    <TailwindLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Fuel Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time fuel level and consumption tracking
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Trucks</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-green-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Good Level</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.good}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-yellow-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Fuel</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.low + stats.critical}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-purple-500 p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Fuel</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.avgFuel.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header with Filters and Column Toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search trucks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Truck Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[150px]">
                      {selectedTruck || 'All Trucks'}
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-[150px] max-h-80 overflow-y-auto"
                  >
                    <DropdownMenuItem onClick={() => setSelectedTruck('')}>
                      All Trucks
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {uniqueTrucks.map((truck) => (
                      <DropdownMenuItem key={truck} onClick={() => setSelectedTruck(truck)}>
                        {truck}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[130px]">
                      {selectedStatus || 'All Status'}
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[130px]">
                    <DropdownMenuItem onClick={() => setSelectedStatus('')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedStatus('Good')}>
                      Good
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Medium')}>
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Low')}>
                      Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Critical')}>
                      Critical
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Items Per Page */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[120px]">
                      {itemsPerPage} / page
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[120px]">
                    <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                      10 / page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(25)}>
                      25 / page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(50)}>
                      50 / page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setItemsPerPage(100)}>
                      100 / page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Export Button */}
                <Button
                  onClick={() => {
                    if (filteredData.length === 0) {
                      setAlertModal({ isOpen: true, type: 'warning', title: 'No Data', message: 'No data to export' });
                      return;
                    }
                    const csvContent = [
                      [
                        'Truck Code',
                        'Truck Name',
                        'Fuel Level (L)',
                        'Capacity (L)',
                        'Percentage (%)',
                        'Consumption (L/hr)',
                        'Efficiency (km/L)',
                        'Status',
                        'Last Update',
                      ].join(','),
                      ...filteredData.map((item) =>
                        [
                          item.truckCode,
                          item.truckName,
                          item.fuelLevel.toFixed(1),
                          item.fuelCapacity,
                          item.fuelPercentage.toFixed(1),
                          item.consumption.toFixed(2),
                          item.efficiency.toFixed(2),
                          getStatus(item),
                          new Date(item.timestamp).toLocaleString(),
                        ]
                          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `fuel_monitoring_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedTruck || selectedStatus) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-600 font-medium">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    Search: &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm('')}
                      className="hover:bg-indigo-200 rounded p-0.5"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedTruck && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    Truck: {selectedTruck}
                    <button
                      onClick={() => setSelectedTruck('')}
                      className="hover:bg-indigo-200 rounded p-0.5"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus('')}
                      className="hover:bg-indigo-200 rounded p-0.5"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTruck('');
                    setSelectedStatus('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading fuel data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No fuel data</h3>
              <p className="mt-1 text-sm text-gray-500">No trucks found matching your filters.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Truck
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Fuel Level
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Capacity
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Percentage
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Consumption
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Efficiency
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                  >
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((truck, index) => {
                  const status = getStatus(truck);
                  return (
                    <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{startIndex + index + 1}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{truck.truckCode}</div>
                        <div className="text-xs text-gray-500">{truck.truckName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {truck.fuelLevel.toFixed(1)} L
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{truck.fuelCapacity} L</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 min-w-20 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                truck.fuelPercentage > 50
                                  ? 'bg-green-500'
                                  : truck.fuelPercentage > 25
                                    ? 'bg-yellow-500'
                                    : truck.fuelPercentage > 10
                                      ? 'bg-orange-500'
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${truck.fuelPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[45px]">
                            {truck.fuelPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {truck.consumption.toFixed(2)} L/hr
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {truck.efficiency.toFixed(2)} km/L
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {new Date(truck.timestamp).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
            {/* Mobile Pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 self-center">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredData.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
        confirmText="OK"
      />
    </TailwindLayout>
  );
}

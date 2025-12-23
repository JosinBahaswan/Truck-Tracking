import React, { useState, useEffect, useMemo } from 'react';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { monitoringAPI } from '../../services/tracking';
import { Button } from '../../components/common/Button.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/common/DropdownMenu.jsx';

export default function TirePressureMonitoring() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data from backend
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('📡 Loading tire pressure data from backend...');

        const response = await monitoringAPI.getTirePressureMonitoring();
        
        if (!response.success) {
          throw new Error('Failed to load tire pressure data');
        }

        if (mounted) {
          setData(response.data || []);
          setLoading(false);
          console.log(`✅ Loaded ${response.data?.length || 0} tire sensors`);
        }
      } catch (error) {
        console.error('❌ Error loading tire pressure data:', error);
        if (mounted) {
          setData([]);
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Get status (already provided by backend)
  const getStatus = (tire) => {
    // Backend already provides status field
    return tire.status || 'Normal';
  };

  // Filter logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.truckCode.toLowerCase().includes(term) ||
          item.truckName.toLowerCase().includes(term) ||
          item.tireLocation.toLowerCase().includes(term) ||
          item.serialNumber.toLowerCase().includes(term)
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
    const normal = filteredData.filter((item) => getStatus(item) === 'Normal').length;
    const warnings = filteredData.filter((item) => {
      const status = getStatus(item);
      return status === 'High Pressure' || status === 'Low Pressure' || status === 'High Temp';
    }).length;
    const critical = filteredData.filter((item) => {
      const status = getStatus(item);
      return status === 'Lost' || status === 'Low Battery';
    }).length;

    return { total, normal, warnings, critical };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Unique trucks for filter
  const uniqueTrucks = useMemo(() => {
    const trucks = [...new Set(data.map((item) => item.truckCode))];
    return trucks.sort();
  }, [data]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTruck, selectedStatus, itemsPerPage]);

  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      Normal: 'bg-green-100 text-green-800',
      'High Pressure': 'bg-orange-100 text-orange-800',
      'Low Pressure': 'bg-yellow-100 text-yellow-800',
      'High Temp': 'bg-red-100 text-red-800',
      'Low Battery': 'bg-purple-100 text-purple-800',
      Lost: 'bg-gray-100 text-gray-800',
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
          <h1 className="text-2xl font-bold text-gray-900">Tire Pressure Monitoring</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time TPMS sensor data and status</p>
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tires</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Normal</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.normal}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Warnings</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.warnings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-red-500 p-3">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.critical}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white shadow rounded-lg">
          {/* Filters */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-4 flex-1 w-full flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                    placeholder="Search tires..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <DropdownMenuContent align="start" className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => setSelectedTruck('')}>
                      All Trucks
                    </DropdownMenuItem>
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
                    <Button variant="outline" className="justify-between min-w-[150px]">
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
                  <DropdownMenuContent align="start" className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => setSelectedStatus('')}>
                      All Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Normal')}>
                      Normal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('High Pressure')}>
                      High Pressure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Low Pressure')}>
                      Low Pressure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('High Temp')}>
                      High Temp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Low Battery')}>
                      Low Battery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedStatus('Lost')}>
                      Lost
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Per Page */}
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
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading tire data...</p>
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tire data</h3>
                <p className="mt-1 text-sm text-gray-500">No tires found matching your filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-16"
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
                      Serial Number
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      Pressure
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      Temperature
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((tire, index) => {
                    const status = getStatus(tire);
                    const rowNumber = startIndex + index + 1;
                    return (
                      <tr key={tire.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rowNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{tire.truckCode}</div>
                          <div className="text-xs text-gray-500">{tire.truckName}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tire.serialNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`text-base font-semibold ${
                              tire.pressure > 120
                                ? 'text-red-600'
                                : tire.pressure < 80
                                  ? 'text-yellow-600'
                                  : 'text-gray-900'
                            }`}
                          >
                            {tire.pressure.toFixed(1)} PSI
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`text-base font-semibold ${
                              tire.temperature > 80
                                ? 'text-red-600'
                                : tire.temperature > 70
                                  ? 'text-yellow-600'
                                  : 'text-gray-900'
                            }`}
                          >
                            {tire.temperature.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && paginatedData.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              {/* Mobile pagination */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
                  {totalPages > 1 && (
                    <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
                      {/* First button */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        First
                      </button>

                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 -ml-px border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ‹
                      </button>

                      {/* Page numbers */}
                      <div className="hidden md:flex">
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
                              className={`relative inline-flex items-center px-4 py-2 -ml-px border border-gray-300 text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-indigo-50 text-indigo-600 z-10'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Current page indicator (mobile) */}
                      <div className="md:hidden relative inline-flex items-center px-4 py-2 -ml-px border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-600">
                        {currentPage}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 -ml-px border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ›
                      </button>

                      {/* Last button */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 -ml-px rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Last
                      </button>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TailwindLayout>
  );
}

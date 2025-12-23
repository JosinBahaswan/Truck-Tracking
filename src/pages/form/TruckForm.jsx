import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TailwindLayout from '../../components/layout/TailwindLayout.jsx';
import { trucksApi, vendorsApi, driversApi } from 'services/management';
import { useCRUD } from '../../hooks/useApi2.js';

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${props.className || ''}`}
        />
      </div>
    </label>
  );
}

function Select({ label, icon, children, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white cursor-pointer ${props.className || ''}`}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </label>
  );
}

export default function TruckForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendors, setVendors] = React.useState([]);
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const isNewTruck = id === 'new';

  // Use CRUD hook for create and update operations
  const { create: createTruck, update: updateTruck, loading: saving } = useCRUD(trucksApi);

  // Initialize form data
  const [formData, setFormData] = React.useState({
    truckNumber: '',
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    type: '',
    vin: '',
    capacity: 0,
    vendorId: '',
    driverId: '',
    status: 'active',
    manufacturer: 'Caterpillar',
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📡 Loading truck form data from Backend 2...');
        setLoading(true);

        // Load vendors
        const vendorsRes = await vendorsApi.getAll().catch(() => ({ data: { vendors: [] } }));
        const vendorsArray = vendorsRes?.data?.vendors || vendorsRes?.data || [];
        setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);

        // Load drivers
        const driversRes = await driversApi.getAll().catch(() => ({ data: { drivers: [] } }));
        const driversArray = driversRes?.data?.drivers || driversRes?.data || [];
        setDrivers(Array.isArray(driversArray) ? driversArray : []);

        // Load truck data if editing existing truck
        if (!isNewTruck) {
          try {
            const truckRes = await trucksApi.getById(id);
            console.log('✅ Truck data loaded:', truckRes);
            const truckData = truckRes?.data?.truck || truckRes?.data || {};

            // Map backend data to form
            setFormData({
              truckNumber: truckData.name || truckData.truckNumber || truckData.truck_number || '',
              plateNumber: truckData.plate || truckData.plateNumber || truckData.plate_number || '',
              model: truckData.model || '',
              year: truckData.year || new Date().getFullYear(),
              type: truckData.type || truckData.truckType || '',
              vin: truckData.vin || truckData.vinNumber || '',
              capacity: truckData.capacity || 0,
              vendorId: truckData.vendorId || truckData.vendor_id || '',
              driverId: truckData.driverId || truckData.driver_id || '',
              status: truckData.status || 'active',
              manufacturer: truckData.manufacturer || 'Caterpillar',
            });
          } catch (error) {
            console.error('❌ Failed to load truck:', error);
            alert('Failed to load truck data. Redirecting to truck list.');
            navigate('/trucks');
            return;
          }
        }
      } catch (error) {
        console.error('❌ Failed to load form data:', error);
        alert('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNewTruck, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.truckNumber?.trim()) {
      errors.push('Truck Number is required');
    }
    if (!formData.plateNumber?.trim()) {
      errors.push('Plate Number is required');
    }
    if (!formData.model?.trim()) {
      errors.push('Model is required');
    }
    if (!formData.year || formData.year < 1900 || formData.year > 2100) {
      errors.push('Valid Year is required');
    }

    // VIN validation: 5 characters, uppercase letters and numbers only
    if (formData.vin) {
      const vin = String(formData.vin).trim();
      // Must be exactly 5 characters, uppercase letters and numbers only
      const vinPattern = /^[A-Z0-9]{5}$/;
      if (!vinPattern.test(vin)) {
        errors.push('VIN must be exactly 5 characters (uppercase letters A-Z and numbers 0-9 only)');
      }
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      console.log('💾 Saving truck data to Backend 2...', formData);

      const truckData = {
        name: formData.truckNumber,
        plate: formData.plateNumber,
        model: formData.model,
        year: parseInt(formData.year),
        type: formData.type,
        // Normalize VIN: trim and uppercase, keep as string
        vin: formData.vin ? String(formData.vin).trim().toUpperCase() : '',
        capacity: parseFloat(formData.capacity) || 0,
        vendor_id: formData.vendorId ? parseInt(formData.vendorId) : null,
        driver_id: formData.driverId ? parseInt(formData.driverId) : null,
        status: formData.status,
        manufacturer: formData.manufacturer,
      };

      let response;
      if (isNewTruck) {
        // CREATE new truck
        console.log('➕ Creating new truck');
        response = await createTruck(truckData);
        console.log('✅ Truck created successfully:', response);
        alert('Truck created successfully!');
      } else {
        // UPDATE existing truck
        console.log('🔄 Updating truck:', id);
        response = await updateTruck(id, truckData);
        console.log('✅ Truck updated successfully:', response);
        alert('Truck updated successfully!');
      }

      navigate('/trucks');
    } catch (error) {
      console.error('❌ Failed to save truck:', error);
      const errorMsg = error.message || 'Unknown error';
      alert(`Failed to save truck:\n${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <TailwindLayout>
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading truck data...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      {/* <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 p-4 overflow-y-auto"> */}
      <div className="max-w-full mx-auto max-h-[calc(100vh-100px)] overflow-y-scroll">
        <div className="p-6 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <Link to="/trucks/" className="hover:text-indigo-600 transition-colors">
              Vehicles
            </Link>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-900 font-medium">Add Vehicle</span>
          </nav>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isNewTruck ? 'Add New Vehicle' : 'Edit Vehicle'}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isNewTruck ? 'Create a new vehicle entry' : 'Update vehicle information'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/trucks"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {isNewTruck ? 'Add Data' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-3">
            {/* Left Column - Main Info (spans 7 columns on xl, 8 on lg) */}
            <div className="lg:col-span-8 xl:col-span-7 space-y-3">
              {/* Basic Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
                      <p className="text-xs text-gray-600">Vehicle identification details</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      label="Truck Number *"
                      value={formData.truckNumber}
                      onChange={(e) => handleInputChange('truckNumber', e.target.value)}
                      placeholder="e.g., TRUCK001"
                      required
                      icon={
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
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      }
                    />
                    <Input
                      label="Plate Number *"
                      value={formData.plateNumber}
                      onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                      placeholder="e.g., B 1234 XYZ"
                      required
                      icon={
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
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                      }
                    />
                    <Input
                      label="Model *"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g., 777D"
                      required
                      icon={
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Input
                      type="number"
                      label="Year *"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="e.g., 2024"
                      min="1900"
                      max="2100"
                      required
                      icon={
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      }
                    />
                    <Input
                      label="Type"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      placeholder="e.g., Dump Truck"
                      icon={
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
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                          />
                        </svg>
                      }
                    />
                    <Input
                      label="Manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      placeholder="e.g., Caterpillar"
                      icon={
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="VIN (5 characters)"
                      value={formData.vin}
                      onChange={(e) => {
                        // Auto-transform to uppercase and limit to 5 characters
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
                        handleInputChange('vin', value);
                      }}
                      placeholder="e.g., TR001 or AB123"
                      maxLength={5}
                      style={{ textTransform: 'uppercase' }}
                      icon={
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      }
                    />
                    <div className="flex items-end pb-2">
                      <p className="text-xs text-gray-500">
                        💡 VIN: 5 karakter (huruf besar A-Z dan angka 0-9)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Assignment</h2>
                      <p className="text-xs text-gray-600">Vendor and driver information</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Select
                    label="Vendor"
                    value={formData.vendorId}
                    onChange={(e) => handleInputChange('vendorId', e.target.value)}
                    icon={
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    }
                  >
                    <option value="">Select Vendor (Optional)</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name || v.name_vendor} {v.code ? `(${v.code})` : ''}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Driver"
                    value={formData.driverId}
                    onChange={(e) => handleInputChange('driverId', e.target.value)}
                    icon={
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    }
                  >
                    <option value="">Select Driver (Optional)</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column - Status (spans 5 columns on xl, 4 on lg) */}
            <div className="lg:col-span-4 xl:col-span-5 space-y-3">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                      <p className="text-xs text-gray-600">Vehicle operational status</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Select
                    label="Status *"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    icon={
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </Select>

                  <div className="pt-2 border-t border-gray-100">
                    <div
                      className={`p-3 rounded-md text-center ${
                        formData.status === 'active'
                          ? 'bg-green-50 border border-green-200'
                          : formData.status === 'maintenance'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div
                        className={`text-2xl mb-1 ${
                          formData.status === 'active'
                            ? 'text-green-600'
                            : formData.status === 'maintenance'
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {formData.status === 'active'
                          ? '✓'
                          : formData.status === 'maintenance'
                            ? '⚠'
                            : '○'}
                      </div>
                      <p
                        className={`text-xs font-semibold ${
                          formData.status === 'active'
                            ? 'text-green-700'
                            : formData.status === 'maintenance'
                              ? 'text-yellow-700'
                              : 'text-gray-700'
                        }`}
                      >
                        {formData.status === 'active'
                          ? 'Vehicle Active'
                          : formData.status === 'maintenance'
                            ? 'Under Maintenance'
                            : 'Vehicle Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer - Full Width */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Fields marked with <span className="text-red-500 font-medium">*</span> are required
              </p>
              <div className="flex gap-2">
                <Link
                  to="/trucks"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? 'Saving...' : isNewTruck ? 'Add Data' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}
    </TailwindLayout>
  );
}

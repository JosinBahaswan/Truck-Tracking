// src/pages/MasterData.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import managementClient from '../services/management/config';
import TailwindLayout from '../components/layout/TailwindLayout';
import AlertModal from '../components/common/AlertModal';
import {
  CircleStackIcon,
  TruckIcon,
  CpuChipIcon,
  SignalIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const MasterData = () => {
  const masterDataImportRef = useRef(null);
  const duplicateDecisionRef = useRef(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, onSkip: null });
  const [importProgress, setImportProgress] = useState({ show: false, current: 0, total: 0, errors: [] });
  const [selectedDataType, setSelectedDataType] = useState('devices');
  const [profile, setProfile] = useState(null);
  const [importMode, setImportMode] = useState('skip'); // 'skip' or 'overwrite'
  const [transformedItem, setDuplicateMode] = useState(null); // 'replace', 'skip', or null

  // Helper to decode JWT token (not currently used but kept for future use)
  // eslint-disable-next-line no-unused-vars
  const decodeToken = (token) => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!currentToken) {
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      
      const response = await managementClient.get(`/users/me?t=${Date.now()}`);
      
      let rawData;
      if (response.success && response.data) {
        rawData = response.data;
      } else if (response.user) {
        rawData = response.user;
      } else if (response.id && response.email) {
        rawData = response;
      } else {
        throw new Error('Invalid response structure');
      }
      
      const normalizedData = {
        id: rawData.id,
        role: rawData.role || '',
      };
      
      setProfile(normalizedData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Helper function to check if user has admin privileges
  const isAdminRole = (role) => {
    if (!role) return false;
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'superadmin';
  };

  // Master Data Templates
  const getMasterDataTemplate = (type) => {
    const templates = {
      devices: {
        headers: ['sn', 'truck_id', 'sim_number', 'status'],
        example: ['DEV001', '1', '08123456789', 'active']
      },
      sensors: {
        headers: ['sn', 'device_id', 'tireNo', 'simNumber', 'sensorNo', 'status'],
        example: ['SENS001', '1', '1', '08123456789', '1', 'active']
      },
      trucks: {
        headers: ['name', 'vin', 'plate', 'model', 'year', 'type', 'vendor_id', 'status'],
        example: ['TRUCK-01', 'TR001', 'B 1234 XYZ', 'Hino Ranger', '2023', 'Dump Truck', '', 'active']
      },
      drivers: {
        headers: ['name', 'license_number', 'license_type', 'license_expiry', 'phone', 'email', 'vendor_id', 'status'],
        example: ['Ahmad Supriadi', 'SIM-A-12345', 'A', '2025-12-31', '+62 812 3456 7890', 'ahmad@company.com', '', 'aktif']
      },
      vendors: {
        headers: ['name_vendor', 'address', 'telephone', 'email', 'contact_person'],
        example: ['PT Mitra Sejahtera', 'Jl. Industri No. 123 Jakarta', '021-12345678', 'info@mitrasejahtera.com', 'Budi Santoso']
      }
    };
    return templates[type] || templates.devices;
  };

  // Export Master Data Template
  const handleExportMasterDataTemplate = (type) => {
    const template = getMasterDataTemplate(type);
    const csvContent = [
      template.headers.join(','),
      template.example.join(','),
      template.headers.map(() => '').join(','),
      template.headers.map(() => '').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_import_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Master Data
  const handleExportMasterData = async (type) => {
    try {
      const endpoints = {
        devices: '/iot/devices',
        sensors: '/iot/sensors', 
        trucks: '/trucks',
        drivers: '/drivers',
        vendors: '/vendors'
      };

      const response = await managementClient.get(endpoints[type] || endpoints.devices);
      
      console.log(`[Export ${type}] Response:`, response.data);
      
      // Handle different response structures from different endpoints
      let data;
      if (type === 'devices' || type === 'sensors') {
        // IoT endpoints return: { success, data: { devices/sensors, pagination } }
        data = response.data?.data?.[type] || response.data?.[type] || [];
      } else if (type === 'trucks') {
        // Trucks endpoint returns: { data: { trucks: [...] } }
        data = response.data?.data?.trucks || response.data?.trucks || response.data?.data || response.data || [];
      } else if (type === 'drivers') {
        // Drivers endpoint returns: { data: { drivers: [...] } }
        data = response.data?.data?.drivers || response.data?.drivers || response.data?.data || response.data || [];
      } else if (type === 'vendors') {
        // Vendors endpoint returns: { data: { vendors: [...] } }
        data = response.data?.data?.vendors || response.data?.vendors || response.data?.data || response.data || [];
      } else {
        data = response.data?.data || response.data || [];
      }
      
      console.log(`[Export ${type}] Parsed data:`, data);
      
      if (!Array.isArray(data)) {
        console.error(`[Export ${type}] Data is not array:`, typeof data, data);
        setAlertModal({ 
          isOpen: true, 
          type: 'error', 
          title: 'Export Failed', 
          message: `Invalid data format received from server` 
        });
        return;
      }
      
      if (data.length === 0) {
        setAlertModal({ 
          isOpen: true, 
          type: 'info', 
          title: 'No Data', 
          message: `No ${type} found to export` 
        });
        return;
      }

      const template = getMasterDataTemplate(type);
      const headers = template.headers;
      const csvRows = [headers.join(',')];
      
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header] || '';
          return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAlertModal({ 
        isOpen: true, 
        type: 'success', 
        title: 'Export Success', 
        message: `Successfully exported ${data.length} ${type}` 
      });
    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
      setAlertModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Export Failed', 
        message: error.response?.data?.message || `Failed to export ${type}` 
      });
    }
  };

  // Parse CSV content
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        const firstKey = Object.keys(row)[0];
        if (row[firstKey] && row[firstKey].trim()) {
          data.push(row);
        }
      }
    }

    return data;
  };

  // Import Master Data from CSV
  const handleImportMasterData = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setAlertModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Invalid File', 
        message: 'Please upload a CSV file' 
      });
      return;
    }

    try {
      const text = await file.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        setAlertModal({ 
          isOpen: true, 
          type: 'error', 
          title: 'No Data', 
          message: `No valid ${type} data found in CSV file` 
        });
        return;
      }

      // Reset duplicate mode and start import
      setDuplicateMode(null);
      
      setImportProgress({ show: true, current: 0, total: items.length, errors: [] });

      let successCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;
      const errors = [];
      
      // Helper: delay to prevent rate limiting
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const endpoints = {
        devices: '/iot/devices',
        sensors: '/iot/sensors',
        trucks: '/trucks',
        drivers: '/drivers',
        vendors: '/vendors',
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          // Transform data based on type to match backend expectations
          let transformedItem = { ...item };
          
          if (type === 'devices') {
            if (transformedItem.truck_id) transformedItem.truck_id = parseInt(transformedItem.truck_id);
            if (!transformedItem.sim_number) delete transformedItem.sim_number;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'sensors') {
            if (transformedItem.device_id) transformedItem.device_id = parseInt(transformedItem.device_id);
            if (transformedItem.tireNo) transformedItem.tireNo = parseInt(transformedItem.tireNo);
            if (transformedItem.sensorNo) transformedItem.sensorNo = parseInt(transformedItem.sensorNo);
            if (!transformedItem.simNumber) delete transformedItem.simNumber;
            if (!transformedItem.sensorNo) delete transformedItem.sensorNo;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'trucks') {
            if (transformedItem.year) transformedItem.year = parseInt(transformedItem.year);
            if (transformedItem.vendor_id) transformedItem.vendor_id = parseInt(transformedItem.vendor_id);
            if (!transformedItem.vin) delete transformedItem.vin;
            if (!transformedItem.model) delete transformedItem.model;
            if (!transformedItem.year) delete transformedItem.year;
            if (!transformedItem.type) delete transformedItem.type;
            if (!transformedItem.vendor_id) delete transformedItem.vendor_id;
            if (!transformedItem.status) transformedItem.status = 'active';
          } else if (type === 'drivers') {
            if (transformedItem.vendor_id) transformedItem.vendor_id = parseInt(transformedItem.vendor_id);
            if (!transformedItem.phone) delete transformedItem.phone;
            if (!transformedItem.email) delete transformedItem.email;
            if (!transformedItem.vendor_id) delete transformedItem.vendor_id;
            if (!transformedItem.status) transformedItem.status = 'aktif';
          } else if (type === 'vendors') {
            if (!transformedItem.address) delete transformedItem.address;
            if (!transformedItem.telephone) delete transformedItem.telephone;
            if (!transformedItem.email) delete transformedItem.email;
            if (!transformedItem.contact_person) delete transformedItem.contact_person;
          }
          
          // Client-side pre-validation: sensors must have device_id
          if (type === 'sensors') {
            if (!transformedItem.device_id) {
              const rowIdentifier = item[Object.keys(item)[0]] || `Baris ${i + 2}`;
              setImportProgress({ show: false, current: 0, total: items.length, errors: [] });
              if (masterDataImportRef.current) masterDataImportRef.current.value = '';
              setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Import Gagal',
                message: `Gagal import pada baris ${i + 2} (${rowIdentifier}): Kolom 'device_id' kosong atau tidak valid. Pastikan Device sudah terdaftar dan isi kolom 'device_id' pada CSV.`
              });
              setDuplicateMode(null);
              return;
            }
          }

          await managementClient.post(endpoints[type], transformedItem);
          successCount++;

          // Delay to prevent rate limiting (300ms)
          await delay(300);
        } catch (error) {
          // Get detailed error message
          let errorMessage = `Failed to create ${type}`;
          let errorDetails = '';

          if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const validationErrors = error.response.data.errors;
            errorDetails = validationErrors.map(err =>
              `• ${err.field}: ${err.message}${err.value !== undefined ? ` (nilai: "${err.value}")` : ''}`
            ).join('\n');
            errorMessage = 'Validation Error';

            // If validation error indicates missing device_id, show friendly message
            const missingDeviceId = validationErrors.some(e => {
              const field = (e.field || '').toString().toLowerCase();
              const msg = (e.message || '').toString().toLowerCase();
              return (field === 'device_id' || field === 'deviceid') && msg.includes('required');
            });

            if (missingDeviceId) {
              const rowIdentifier = item[Object.keys(item)[0]] || `Baris ${i + 2}`;
              setImportProgress({ show: false, current: 0, total: 0, errors: [] });
              if (masterDataImportRef.current) masterDataImportRef.current.value = '';
              setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Import Gagal',
                message: `Gagal import pada baris ${i + 2} (${rowIdentifier}): Kolom 'device_id' belum tersedia atau bernilai kosong. Pastikan Device sudah terdaftar lalu coba lagi.`
              });
              setDuplicateMode(null);
              return;
            }
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Detect "Device not found" error from backend and show friendly guidance
          const deviceNotFoundRegex = /device not found[:\s]*([0-9]+)/i;
          const deviceMsgSource = (error.response?.data?.message || error.response?.data?.error || errorMessage || '').toString();
          const deviceMatch = deviceNotFoundRegex.exec(deviceMsgSource);
          if (deviceMatch) {
            const missingDeviceId = deviceMatch[1];
            const rowIdentifier = item[Object.keys(item)[0]] || `Baris ${i + 2}`;
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) masterDataImportRef.current.value = '';
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Import Gagal',
              message: `Gagal import pada baris ${i + 2} (${rowIdentifier}): Device dengan ID ${missingDeviceId} tidak ditemukan.\n\nSolusi: buat Device dengan ID ${missingDeviceId} di menu Devices, atau perbaiki kolom 'device_id' pada CSV agar mengacu ke Device yang benar.`
            });
            setDuplicateMode(null);
            return;
          }
          // Check duplicate condition
          const isDuplicate = (errorMessage || '').toLowerCase().includes('already exists') ||
                              (errorMessage || '').toLowerCase().includes('already occupied') ||
                              (errorMessage || '').toLowerCase().includes('duplicate') ||
                              error.response?.status === 409;
          
          // Check rate limit error
          const isRateLimited = error.response?.status === 429 || 
                                (errorMessage || '').toLowerCase().includes('too many requests');
          
          if (isRateLimited) {
            // Use retryAfter from backend response, or default to 15 seconds
            const waitTime = (error.response?.data?.retryAfter || 15) * 1000;
            console.warn(`[Rate Limited] Row ${i + 1}, waiting ${waitTime/1000}s before retry...`);
            
            // Show message to user
            setImportProgress({ 
              show: true, 
              current: i, 
              total: items.length, 
              errors: [`Rate limit hit, waiting ${waitTime/1000}s...`] 
            });
            
            await delay(waitTime);
            // Retry this item by decrementing i
            i--;
            continue;
          }

          if (isDuplicate) {
            // Use importMode to decide action
            if (importMode === 'skip') {
              // Skip this duplicate
              skippedCount++;
              errors.push({
                row: i + 2,
                identifier: item[Object.keys(item)[0]] || `Row ${i + 2}`,
                error: 'Skipped (already exists)',
                type: 'skipped'
              });
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            } else if (importMode === 'overwrite') {
              // Try to update existing record
              try {
                let existingId = null;
                console.log(`[Replace] Searching for existing ${type}...`);
                
                if (type === 'devices' || type === 'sensors') {
                  const q = transformedItem.sn ? `?sn=${encodeURIComponent(transformedItem.sn)}` : '';
                  console.log(`[Replace] GET ${endpoints[type]}${q}`);
                  const searchRes = await managementClient.get(`${endpoints[type]}${q}`);
                  console.log(`[Replace] Search response:`, searchRes.data);
                  const list = searchRes.data?.data?.[type] || searchRes.data?.data?.devices || searchRes.data?.data?.sensors || searchRes.data || [];
                  console.log(`[Replace] List found:`, list);
                  existingId = list?.find?.(d => d.sn === transformedItem.sn)?.id || (Array.isArray(list) && list.length > 0 ? list[0].id : null);
                } else if (type === 'trucks') {
                  const q = transformedItem.plate ? `?plate=${encodeURIComponent(transformedItem.plate)}` : '';
                  console.log(`[Replace] GET ${endpoints[type]}${q}`);
                  const searchRes = await managementClient.get(`${endpoints[type]}${q}`);
                  console.log(`[Replace] Search response:`, searchRes.data);
                  const list = searchRes.data?.data?.trucks || searchRes.data?.data || searchRes.data || [];
                  console.log(`[Replace] List found:`, list);
                  existingId = list?.find?.(t => t.plate === transformedItem.plate)?.id || (Array.isArray(list) && list.length > 0 ? list[0].id : null);
                } else if (type === 'drivers') {
                  const q = transformedItem.name ? `?name=${encodeURIComponent(transformedItem.name)}` : '';
                  console.log(`[Replace] GET ${endpoints[type]}${q}`);
                  const searchRes = await managementClient.get(`${endpoints[type]}${q}`);
                  console.log(`[Replace] Search response:`, searchRes.data);
                  const list = searchRes.data?.data?.drivers || searchRes.data?.data || searchRes.data || [];
                  console.log(`[Replace] List found:`, list);
                  existingId = list?.find?.(d => d.name === transformedItem.name)?.id || (Array.isArray(list) && list.length > 0 ? list[0].id : null);
                } else if (type === 'vendors') {
                  const q = transformedItem.name_vendor ? `?name_vendor=${encodeURIComponent(transformedItem.name_vendor)}` : '';
                  console.log(`[Replace] GET ${endpoints[type]}${q}`);
                  const searchRes = await managementClient.get(`${endpoints[type]}${q}`);
                  console.log(`[Replace] Search response:`, searchRes.data);
                  const list = searchRes.data?.data?.vendors || searchRes.data?.data || searchRes.data || [];
                  console.log(`[Replace] List found:`, list);
                  existingId = list?.find?.(v => v.name_vendor === transformedItem.name_vendor)?.id || (Array.isArray(list) && list.length > 0 ? list[0].id : null);
                }

                console.log(`[Replace] Found existing ID:`, existingId);

                if (existingId) {
                  console.log(`[Replace] Updating ${type}/${existingId}...`);
                  await managementClient.put(`${endpoints[type]}/${existingId}`, transformedItem);
                  console.log(`[Replace] Update successful`);
                  updatedCount++;
                  
                  // Delay to prevent rate limiting (300ms)
                  await delay(300);
                } else {
                  // couldn't find existing entity to replace; skip
                  console.warn('[Replace] Existing entity not found for replace action, skipping row');
                  skippedCount++;
                  errors.push({
                    row: i + 2,
                    identifier: item[Object.keys(item)[0]] || `Row ${i + 2}`,
                    error: 'Could not find existing record to update',
                    type: 'skipped'
                  });
                }
              } catch (updateErr) {
                console.error('[Replace] Update failed during replace action:', updateErr);
                errors.push({
                  row: i + 2,
                  identifier: item[Object.keys(item)[0]] || `Row ${i + 2}`,
                  error: updateErr.response?.data?.message || 'Update failed'
                });
              }
              setImportProgress(prev => ({ ...prev, current: i + 1 }));
              continue;
            }
          } else {
            // Non-duplicate error: stop import and show error
            setImportProgress({ show: false, current: 0, total: 0, errors: [] });
            if (masterDataImportRef.current) {
              masterDataImportRef.current.value = '';
            }

            const rowIdentifier = item[Object.keys(item)[0]] || `Baris ${i + 2}`;

            setAlertModal({
              isOpen: true,
              type: 'error',
              title: `Import Error - ${rowIdentifier}`,
              message: `Import dihentikan pada baris ${i + 2}${rowIdentifier !== `Baris ${i + 2}` ? ` (${rowIdentifier})` : ''}:\n\n${errorDetails || errorMessage}\n\n${successCount > 0 ? `${successCount} data berhasil di-import sebelum error terjadi.\n\n` : ''}Perbaiki data dan coba lagi.`
            });
            setDuplicateMode(null);
            return;
          }
        }
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
      }

      // Finish import successfully
      setTimeout(() => {
        setImportProgress({ show: false, current: 0, total: 0, errors: [] });
      }, 2000);

      // Build result message
      const totalProcessed = successCount + updatedCount + skippedCount;
      const failedCount = errors.filter(e => e.type !== 'skipped').length;
      
      let message = `Import Complete:\n\n`;
      message += `✅ Created: ${successCount}\n`;
      if (updatedCount > 0) message += `🔄 Updated: ${updatedCount}\n`;
      if (skippedCount > 0) message += `⏭️ Skipped: ${skippedCount}\n`;
      if (failedCount > 0) message += `❌ Failed: ${failedCount}\n`;
      message += `\nTotal rows: ${items.length}`;
      
      const hasErrors = failedCount > 0;
      const errorDetails = errors.filter(e => e.type !== 'skipped');

      setAlertModal({ 
        isOpen: true, 
        type: hasErrors ? 'warning' : 'success', 
        title: 'Import Complete', 
        message: message + (hasErrors ? '\n\nErrors:\n' + errorDetails.map(e => `Row ${e.row} (${e.identifier}): ${e.error}`).join('\n') : '')
      });

      if (masterDataImportRef.current) {
        masterDataImportRef.current.value = '';
      }
      setDuplicateMode(null);
    } catch (error) {
      console.error(`Failed to import ${type}:`, error);
      setImportProgress({ show: false, current: 0, total: 0, errors: [] });
      setAlertModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Import Failed', 
        message: `Failed to process CSV file: ${error.message}` 
      });
    }
  };

  if (!profile) {
    return (
      <TailwindLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <CircleStackIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  if (!isAdminRole(profile?.role)) {
    return (
      <TailwindLayout>
        <div className="h-full flex items-center justify-center bg-white">
          <div className="text-center py-12">
            <CircleStackIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Restricted</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only administrators can manage master data.
            </p>
          </div>
        </div>
      </TailwindLayout>
    );
  }

  return (
    <TailwindLayout>
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CircleStackIcon className="h-8 w-8 mr-3 text-purple-600" />
              Master Data Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Bulk import and export master data for devices, sensors, trucks, drivers, and vendors.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
            {/* Instructions Panel */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Bulk Import/Export Instructions
              </h4>
              <ul className="text-xs text-purple-800 space-y-1 ml-7">
                <li>• Select data type below (Devices, Sensors, Trucks, Drivers, or Vendors)</li>
                <li>• Download template CSV for the selected type</li>
                <li>• Fill in the data according to the template format</li>
                <li>• Import CSV to create multiple records at once</li>
                <li>• Export existing data for backup or reference</li>
              </ul>
            </div>

            {/* Data Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Data Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'devices', name: 'Devices', icon: CpuChipIcon, color: 'blue' },
                  { id: 'sensors', name: 'Sensors', icon: SignalIcon, color: 'green' },
                  { id: 'trucks', name: 'Trucks', icon: TruckIcon, color: 'orange' },
                  { id: 'drivers', name: 'Drivers', icon: UserIcon, color: 'purple' },
                  { id: 'vendors', name: 'Vendors', icon: BuildingOfficeIcon, color: 'indigo' }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedDataType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedDataType(type.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-8 w-8 mb-2 ${
                        isSelected ? `text-${type.color}-600` : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isSelected ? `text-${type.color}-700` : 'text-gray-600'
                      }`}>
                        {type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Import Progress Bar */}
            {importProgress.show && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Importing {selectedDataType}...
                  </span>
                  <span className="text-sm text-blue-700">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Download Template */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <DocumentArrowDownIcon className="h-6 w-6 text-gray-600 mr-2" />
                  <h4 className="text-sm font-semibold text-gray-900">Download Template</h4>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Get CSV template with example data for {selectedDataType}
                </p>
                <button
                  onClick={() => handleExportMasterDataTemplate(selectedDataType)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Download Template
                </button>
              </div>

              {/* Export Data */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
                <div className="flex items-center mb-3">
                  <ArrowDownTrayIcon className="h-6 w-6 text-emerald-600 mr-2" />
                  <h4 className="text-sm font-semibold text-emerald-900">Export Data</h4>
                </div>
                <p className="text-xs text-emerald-700 mb-4">
                  Download all existing {selectedDataType} to CSV file
                </p>
                <button
                  onClick={() => handleExportMasterData(selectedDataType)}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Export {selectedDataType}
                </button>
              </div>

              {/* Import Data */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center mb-3">
                  <ArrowUpTrayIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-semibold text-indigo-900">Import Data</h4>
                </div>
                <p className="text-xs text-indigo-700 mb-3">
                  Upload CSV file to create multiple {selectedDataType}
                </p>
                
                {/* Import Mode Selector */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-indigo-900 mb-1.5">
                    Duplicate Handling:
                  </label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-xs font-medium text-indigo-800 bg-white hover:bg-indigo-50 transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    title="Choose how to handle duplicate records"
                  >
                    <option value="skip">⏭️ Skip Duplicates</option>
                    <option value="overwrite">🔄 Overwrite Duplicates</option>
                  </select>
                  <p className="text-[10px] text-indigo-600 mt-1">
                    {importMode === 'skip' ? 'Existing records will be skipped' : 'Existing records will be updated'}
                  </p>
                </div>
                
                <button
                  onClick={() => masterDataImportRef.current?.click()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Import CSV
                </button>
                <input
                  ref={masterDataImportRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImportMasterData(e, selectedDataType)}
                />
              </div>
            </div>

            {/* Data Format Reference */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                CSV Format for {selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)}
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {getMasterDataTemplate(selectedDataType).headers.map((header, idx) => (
                        <th key={idx} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      {getMasterDataTemplate(selectedDataType).example.map((value, idx) => (
                        <td key={idx} className="px-3 py-2 text-gray-600 border-b border-gray-200">
                          {value}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Note:</strong> Baris pertama harus berisi nama kolom (header), baris selanjutnya adalah data.
                <br />
                <strong>✓ Urutan kolom bebas</strong> - yang penting nama kolom harus sesuai dengan contoh di atas.
              </p>
            </div>

            {/* Field Requirements & Validation Rules */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Field Requirements & Validation
              </h4>
              
              {selectedDataType === 'devices' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sn:</span>
                      <span className="text-red-700 font-medium">Wajib, Serial Number unik (max 50 karakter) contoh: DEV001</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">truck_id:</span>
                      <span className="text-red-700 font-medium">Wajib, ID truck (harus sudah ada di database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sim_number:</span>
                      <span>Opsional, nomor SIM card device (max 50 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>Opsional, default: active (pilihan: active, inactive, maintenance)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'sensors' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sn:</span>
                      <span className="text-red-700 font-medium">Wajib, Serial Number unik (max 50 karakter) contoh: SENS001</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">device_id:</span>
                      <span className="text-red-700 font-medium">Wajib, ID device (harus sudah ada di database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">tireNo:</span>
                      <span className="text-red-700 font-medium">Wajib, Posisi ban (angka 1-10)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">simNumber:</span>
                      <span>Opsional, nomor SIM untuk sensor (max 50 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">sensorNo:</span>
                      <span>Opsional, nomor sensor (angka)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>Opsional, default: active (pilihan: active, inactive, maintenance)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'trucks' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name:</span>
                      <span className="text-red-700 font-medium">Wajib, nama/ID truck (max 255 karakter) contoh: TRUCK-01</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">plate:</span>
                      <span className="text-red-700 font-medium">Wajib, plat nomor (max 50 karakter), unik. Contoh: B 1234 XYZ</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vin:</span>
                      <span>Opsional, VIN 5 karakter (huruf & angka), unik</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">model:</span>
                      <span>Opsional, model truk (Hino Ranger, Isuzu Giga, dll)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">year:</span>
                      <span>Opsional, tahun 4 digit (contoh: 2023)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">type:</span>
                      <span>Opsional, tipe truk (Dump Truck, Box Truck, dll)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vendor_id:</span>
                      <span>Opsional, ID vendor (harus sudah ada di database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>Opsional, default: active (pilihan: active, inactive, maintenance)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'drivers' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name:</span>
                      <span className="text-red-700 font-medium">Wajib, nama lengkap driver (max 255 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_number:</span>
                      <span className="text-red-700 font-medium">Wajib, nomor SIM (max 50 karakter) contoh: SIM-A-12345</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_type:</span>
                      <span className="text-red-700 font-medium">Wajib, tipe SIM (A/B1/B2/C) max 20 karakter</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">license_expiry:</span>
                      <span className="text-red-700 font-medium">Wajib, tanggal kadaluarsa SIM (format: YYYY-MM-DD)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">phone:</span>
                      <span>Opsional, nomor telepon (format: +62 812 3456 7890)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">email:</span>
                      <span>Opsional, email valid (contoh@domain.com)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">vendor_id:</span>
                      <span>Opsional, ID vendor (harus sudah ada di database)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">status:</span>
                      <span>Opsional, default: aktif (pilihan: aktif, tidak_aktif, cuti)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDataType === 'vendors' && (
                <div className="space-y-2 text-xs text-blue-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">name_vendor:</span>
                      <span className="text-red-700 font-medium">Wajib, nama vendor (max 255 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">address:</span>
                      <span>Opsional, alamat lengkap vendor</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">telephone:</span>
                      <span>Opsional, nomor telepon (max 50 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">email:</span>
                      <span>Opsional, email vendor (max 255 karakter)</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold mr-2 min-w-[140px]">contact_person:</span>
                      <span>Opsional, nama contact person (max 255 karakter)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-blue-300">
                <p className="text-xs text-blue-800">
                  <strong>⚠️ Penting:</strong> Field yang ditandai merah adalah field yang WAJIB diisi atau memiliki format khusus. 
                  Pastikan data sesuai format untuk menghindari error saat import.
                </p>
              </div>
            </div>

            {/* Statistics Panel */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Devices', value: '0', color: 'blue' },
                { label: 'Total Sensors', value: '0', color: 'green' },
                { label: 'Total Trucks', value: '0', color: 'orange' },
                { label: 'Total Drivers', value: '0', color: 'purple' }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-4`}>
                  <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                  <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

      {/* Confirm Modal for Duplicates */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line mb-6">{confirmModal.message}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmModal.onConfirm}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Ganti Semua (Replace All)
                </button>
                <button
                  onClick={confirmModal.onSkip}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Lewati Semua (Skip All)
                </button>
                <button
                  onClick={confirmModal.onCancel}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Batalkan Import (Cancel)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TailwindLayout>
  );
};

export default MasterData;

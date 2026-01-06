// src/components/common/CommandPalette.jsx
import React, { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, TruckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { devicesApi, trucksApi } from '../../services/management';

const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const CommandPalette = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicleResults, setVehicleResults] = useState([]);
  const [deviceResults, setDeviceResults] = useState([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setVehicleResults([]);
      setDeviceResults([]);
    }
  }, [open]);

  // Define handlers before they are used
  const onSelectVehicle = useCallback(
    (v) => {
      console.log('🚚 Selected vehicle:', v);
      setOpen(false);
      // Navigate to fleet management detail page
      navigate(`/fleet-management/trucks/${v.id}`);
    },
    [navigate, setOpen]
  );

  const onSelectDevice = useCallback(
    (d) => {
      console.log('📱 Selected device:', d);
      setOpen(false);
      // Navigate to devices page with search query
      navigate(`/fleet-management/devices?search=${encodeURIComponent(d.sn)}`);
    },
    [navigate, setOpen]
  );

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }

      // Handle Enter key - select first result
      if (e.key === 'Enter' && open && !loading) {
        if (vehicleResults.length > 0) {
          onSelectVehicle(vehicleResults[0]);
        } else if (deviceResults.length > 0) {
          onSelectDevice(deviceResults[0]);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, setOpen, loading, vehicleResults, deviceResults, onSelectVehicle, onSelectDevice]);

  const search = async (q) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setVehicleResults([]);
      setDeviceResults([]);
      return;
    }

    setLoading(true);
    console.log('🔍 Global search for:', term);

    try {
      // Search Vehicles (Trucks)
      let vehicles = [];
      try {
        console.log('📦 Searching trucks...');
        const trucksRes = await trucksApi.getAll({ limit: 100 });
        console.log('✅ Trucks response:', trucksRes);

        if (trucksRes?.success) {
          const trucksArray = trucksRes.data?.trucks || trucksRes.data || [];
          vehicles = (Array.isArray(trucksArray) ? trucksArray : [])
            .filter((t) => {
              const searchText =
                `${t.name || ''} ${t.plate_number || ''} ${t.vin || ''} ${t.id || ''}`.toLowerCase();
              return searchText.includes(term);
            })
            .slice(0, 8)
            .map((t) => ({
              id: t.id,
              name: t.name || t.plate_number || `Truck #${t.id}`,
              plate_number: t.plate_number,
              vin: t.vin,
              status: String(t.status || 'unknown').toLowerCase(),
            }));
        }
        console.log('✅ Vehicle matches:', vehicles.length);
      } catch (error) {
        console.error('❌ Failed to search trucks:', error);
      }
      setVehicleResults(vehicles);

      // Search Devices
      let devices = [];
      try {
        console.log('📱 Searching devices...');
        const devicesRes = await devicesApi.getAll({ limit: 100 });
        console.log('✅ Devices response:', devicesRes);

        if (devicesRes?.success) {
          const devicesArray = devicesRes.data?.devices || devicesRes.data || [];
          devices = (Array.isArray(devicesArray) ? devicesArray : [])
            .filter((d) => {
              const searchText = `${d.sn || ''} ${d.sim_number || ''} ${d.id || ''}`.toLowerCase();
              return searchText.includes(term);
            })
            .slice(0, 8)
            .map((d) => ({
              id: d.id,
              sn: d.sn || d.serial || 'N/A',
              sim_number: d.sim_number || d.sim || 'N/A',
              status: d.status || 'unknown',
            }));
        }
        console.log('✅ Device matches:', devices.length);
      } catch (error) {
        console.error('❌ Failed to search devices:', error);
      }
      setDeviceResults(devices);

      console.log('✅ Search complete:', { vehicles: vehicles.length, devices: devices.length });
    } catch (error) {
      console.error('❌ Global search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const debounced = useMemo(() => debounce(search, 250), []);

  useEffect(() => {
    debounced(query);
  }, [debounced, query]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-2000" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search vehicles or devices..."
                  className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                    ESC
                  </kbd>
                  to close
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {/* Vehicles Section */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TruckIcon className="w-4 h-4 text-slate-400" />
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">
                      Vehicles
                    </div>
                  </div>
                  {loading && query && (
                    <div className="text-xs text-indigo-600 py-2">Searching vehicles...</div>
                  )}
                  {!loading && !query && (
                    <div className="text-xs text-slate-400 py-2">Type to search vehicles...</div>
                  )}
                  {!loading && query && vehicleResults.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No vehicles found</div>
                  )}
                  <ul className="space-y-1">
                    {vehicleResults.map((v) => (
                      <li key={v.id}>
                        <button
                          onClick={() => onSelectVehicle(v)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                                {v.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {v.plate_number && <span>Plate: {v.plate_number}</span>}
                                {v.vin && <span className="ml-2">VIN: {v.vin}</span>}
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                v.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : v.status === 'maintenance'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {v.status}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Devices Section */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DevicePhoneMobileIcon className="w-4 h-4 text-slate-400" />
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">
                      Devices
                    </div>
                  </div>
                  {loading && query && (
                    <div className="text-xs text-indigo-600 py-2">Searching devices...</div>
                  )}
                  {!loading && !query && (
                    <div className="text-xs text-slate-400 py-2">Type to search devices...</div>
                  )}
                  {!loading && query && deviceResults.length === 0 && (
                    <div className="text-xs text-slate-400 py-2">No devices found</div>
                  )}
                  <ul className="space-y-1">
                    {deviceResults.map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => onSelectDevice(d)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                                {d.sn}
                              </div>
                              <div className="text-xs text-slate-500">SIM: {d.sim_number}</div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                d.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CommandPalette;

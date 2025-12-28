import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  TruckIcon,
  MapIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  ClockIcon,
  SignalIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Tracking',
    icon: MapIcon,
    children: [
      { name: 'Live Tracking', href: '/live-tracking' },
      { name: 'History', href: '/history-tracking' },
    ],
  },
  {
    name: 'Monitoring',
    icon: ChartBarIcon,
    children: [
      // { name: 'Vehicle & IoT Status', href: '/fleet/status' },
      // { name: 'Live Tire View', href: '/monitoring/live-view' },
      { name: 'Sensors (Tire & Temp)', href: '/monitoring/sensors' },
      // { name: 'Fuel Level', href: '/monitoring/fuel' },
    ],
  },
  {
    name: 'Fleet Management',
    icon: TruckIcon,
    children: [
      // { name: 'Fleet Groups', href: '/fleet/groups' },
      { name: 'All Vehicles', href: '/trucks' },
      { name: 'Drivers', href: '/drivers' },
      { name: 'Vendors', href: '/vendors' },
    ],
  },
  {
    name: 'IoT Devices',
    icon: CpuChipIcon,
    children: [
      { name: 'Device Center', href: '/devices' },
      { name: 'Sensor Management', href: '/sensors' },
    ],
  },

  // { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: false },
  // { name: 'Reports', href: '/reports', icon: DocumentTextIcon, current: false },
  { name: 'Master Data', href: '/master-data', icon: CircleStackIcon },
  { name: 'Alerts', href: '/alerts', icon: BellIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TailwindSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState({});

  const isActive = (item) => {
    if (item.href) {
      // Exact match or pathname starts with href (for nested routes)
      try {
        const [pathOnly] = item.href.split('?');
        return location.pathname === pathOnly || location.pathname.startsWith(pathOnly + '/');
      } catch {
        return location.pathname === item.href;
      }
    }
    if (item.children) {
      return item.children.some((c) => {
        const [pathOnly] = c.href.split('?');
        return location.pathname === pathOnly || location.pathname.startsWith(pathOnly + '/');
      });
    }
    return false;
  };

  const isActiveHref = (href) => {
    try {
      const [pathOnly] = href.split('?');
      return location.pathname === pathOnly || location.pathname.startsWith(pathOnly + '/');
    } catch {
      return location.pathname === href;
    }
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-linear-to-b from-indigo-400 via-indigo-700 to-indigo-900 px-6 pb-4 backdrop-blur-xl border-r border-white/10 pointer-events-auto">
      <div className="flex h-16 shrink-0 items-center mb-6">
        <div className="flex items-center">
          <img src="/icon2.png" alt="Truck" className="h-50 w-50 object-contain relative top-5" />
          {/* <div className="ml-10">
            <h3 className="text-xl font-bold text-white tracking-tight">Borneo Fleet</h3>
            <p className="text-sm text-indigo-200 font-medium">Live Tracking System</p>
          </div> */}
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item);
                const expanded = expandedItems[item.name] ?? (active && item.children);
                return (
                  <li key={item.name}>
                    {!item.children ? (
                      <Link
                        to={item.href}
                        className={classNames(
                          active
                            ? 'bg-white/20 text-white shadow-md'
                            : 'text-indigo-200 hover:text-white hover:bg-white/10',
                          'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 border border-transparent hover:border-white/20 cursor-pointer relative z-5001'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            active ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={classNames(
                            active
                              ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                              : 'text-indigo-200 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm hover:shadow-md',
                            'group flex w-full gap-x-3 rounded-xl p-3 text-left text-sm leading-6 font-semibold transition-all duration-200 relative z-5001'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                          <svg
                            className={classNames(
                              expanded ? 'rotate-90' : '',
                              'ml-auto h-5 w-5 shrink-0 text-indigo-200 transition-transform'
                            )}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {expanded && (
                          <ul className="mt-1 px-2">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={classNames(
                                    isActiveHref(subItem.href)
                                      ? 'bg-white/20 text-white shadow-inner border border-white/20'
                                      : 'text-indigo-200 hover:text-white hover:bg-white/10',
                                    'block rounded-md py-2 pl-9 pr-2 text-sm leading-6 cursor-pointer relative z-5001'
                                  )}
                                  aria-current={isActiveHref(subItem.href) ? 'page' : undefined}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 shadow-lg">
              <h3 className="text-sm font-semibold text-white">Need Help?</h3>
              <p className="mt-1 text-xs text-indigo-200">
                Contact support for assistance with fleet management
              </p>
              <button className="mt-3 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 transition-all duration-200 border border-white/30 shadow-md">
                Get Support
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-4000 lg:flex lg:w-72 lg:flex-col pointer-events-auto">
        <SidebarContent />
      </div>
    </>
  );
};

export default TailwindSidebar;

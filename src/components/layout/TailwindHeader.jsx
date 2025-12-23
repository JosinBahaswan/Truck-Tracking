import React, { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useAlertNotifications } from '../../hooks/useAlertNotifications.js';
import CommandPalette from '../common/CommandPalette.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TailwindHeader = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAlertNotifications();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if (
        (isMac && e.metaKey && e.key.toLowerCase() === 'k') ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const displayName = user?.name || user?.username || 'John Doe';
  const initials = (displayName || 'JD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = () => {
    try {
      logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <div className="sticky top-0 z-1002 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/20 bg-white/80 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 shadow-sm"
              title="Global Search (Ctrl/Cmd + K)"
              aria-label="Open command palette search"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <span className="hidden sm:inline">Search</span>
              <span className="ml-2 hidden sm:inline text-[10px] text-gray-400">Ctrl/Cmd + K</span>
            </button>
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
            {/* Notifications dropdown */}
            <Menu as="div" className="relative z-1003">
              <Menu.Button
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                aria-label="Open notifications menu"
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-1003 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <Menu.Item key={notification.id}>
                          {({ active }) => (
                            <div
                              className={classNames(
                                active ? 'bg-gray-50' : '',
                                !notification.isRead ? 'bg-blue-50' : '',
                                'px-4 py-3 cursor-pointer transition-colors'
                              )}
                              onClick={() => {
                                markAsRead(notification.id);
                                navigate('/alerts');
                              }}
                            >
                              <div className="flex items-start">
                                <div
                                  className={classNames(
                                    'shrink-0 w-2 h-2 rounded-full mt-2 mr-3',
                                    notification.type === 'error'
                                      ? 'bg-red-500'
                                      : notification.type === 'warning'
                                        ? 'bg-yellow-500'
                                        : 'bg-blue-500'
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={classNames(
                                      'text-sm',
                                      !notification.isRead
                                        ? 'font-semibold text-gray-900'
                                        : 'font-medium text-gray-700'
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-500 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Menu.Item>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate('/alerts')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium w-full text-center"
                      >
                        View all alerts
                      </button>
                    </div>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Settings */}
            {/* <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Settings</span>
            <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
          </button> */}

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

            {/* Profile dropdown */}
            <Menu as="div" className="relative z-1003">
              <Menu.Button className="-m-1.5 flex items-center p-1.5" aria-label="Open user menu">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{initials}</span>
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                    aria-hidden="true"
                  >
                    {displayName}
                  </span>
                  <svg
                    className="ml-2 h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-1003 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">Fleet Manager</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-3 py-2 text-sm text-gray-700'
                        )}
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        Profile
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-50' : '',
                          'flex items-center px-3 py-2 text-sm text-gray-700'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  <div className="border-t border-gray-100">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'flex items-center w-full px-3 py-2 text-left text-sm text-gray-700'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
};

export default TailwindHeader;

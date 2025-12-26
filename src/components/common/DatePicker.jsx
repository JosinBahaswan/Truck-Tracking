import React, { useState, useRef, useEffect } from 'react';

/**
 * DatePicker Component
 * A custom date picker with calendar UI similar to the provided design
 *
 * @param {Object} props
 * @param {Date} props.value - Selected date value
 * @param {Function} props.onChange - Callback when date is selected
 * @param {string} props.label - Input label text
 * @param {string} props.placeholder - Input placeholder
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.disabled - Disable the input
 * @param {string} props.className - Additional CSS classes for input
 */
export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  className = '', // 'bottom' or 'top'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Calculate position for fixed calendar
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCalendarPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    // Check if date is within min/max range
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    onChange(date);
    setIsOpen(false);
  };

  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date) => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const days = getDaysInMonth(currentMonth);
  const currentMonthYear = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>}

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={formatDate(value)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div 
          className="fixed z-[9999] bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-4 w-72"
          style={{ top: `${calendarPosition.top}px`, left: `${calendarPosition.left}px` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <h3 className="text-sm font-semibold text-white">{currentMonthYear}</h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj, index) => {
              const selected = isDateSelected(dayObj.date);
              const today = isToday(dayObj.date);
              const disabled = isDateDisabled(dayObj.date);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(dayObj.date)}
                  disabled={disabled}
                  className={`
                    relative py-2 text-sm rounded-lg transition-all
                    ${!dayObj.isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}
                    ${selected ? 'bg-indigo-600 text-white font-semibold' : ''}
                    ${!selected && today ? 'bg-gray-800 text-white' : ''}
                    ${!selected && !today && dayObj.isCurrentMonth ? 'hover:bg-gray-800' : ''}
                    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {dayObj.day}
                </button>
              );
            })}
          </div>

          {/* Footer with Today button */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

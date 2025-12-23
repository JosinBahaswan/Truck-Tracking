// src/pages/HistoryTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import HistoryTrackingMap from '../pages/tracking/HistoryTrackingMap';

const HistoryTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <HistoryTrackingMap />
      </div>
    </TailwindLayout>
  );
};

export default HistoryTracking;

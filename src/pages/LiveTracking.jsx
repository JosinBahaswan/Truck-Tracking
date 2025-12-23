// src/pages/LiveTracking.jsx
import React from 'react';
import TailwindLayout from '../components/layout/TailwindLayout';
import LiveTrackingMapNew from '../pages/tracking/LiveTrackingMapNew';

const LiveTracking = () => {
  return (
    <TailwindLayout>
      <div className="h-full">
        <LiveTrackingMapNew />
        {/* <LiveTrackingMap /> */}
      </div>
    </TailwindLayout>
  );
};

export default LiveTracking;

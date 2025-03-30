'use client';

import React from 'react';

const WebView = () => {
  const url = "https://maps.google.com/maps?q=43.2574358,-79.867593&z=15&output=embed";

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src={url}
        title="Google Maps WebView"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default WebView;

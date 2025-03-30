// GoogleMapsWebView.tsx
import React from 'react';

interface GoogleMapsWebViewProps {
  latitude: number;
  longitude: number;
}

const GoogleMapsWebView: React.FC<GoogleMapsWebViewProps> = ({ latitude, longitude }) => {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <iframe
      width="100%"
      height="400"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      src={mapUrl}
    ></iframe>
  );
};

export default GoogleMapsWebView;
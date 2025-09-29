"use client";

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseMapProps {
  latitude: number;
  longitude: number;
  courseName: string;
}

export default function CourseMap({ latitude, longitude, courseName }: CourseMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: parseFloat(latitude.toString()),
    lng: parseFloat(longitude.toString())
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    zoom: 14,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  // Custom marker icon using favicon
  const customMarkerIcon = {
    url: '/favicon.ico',
    scaledSize: { width: 32, height: 32 } as google.maps.Size,
    origin: { x: 0, y: 0 } as google.maps.Point,
    anchor: { x: 16, y: 32 } as google.maps.Point,
  };

  if (!isLoaded) {
    return (
      <Skeleton className="w-full h-[400px] bg-gray-100 rounded-lg" />
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={mapOptions}
      >
        <Marker
          position={center}
          icon={customMarkerIcon}
          title={courseName}
        />
      </GoogleMap>
    </div>
  );
}

"use client";

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface CourseMapProps {
  latitude: number;
  longitude: number;
  courseName: string;
}

export default function CourseMap({ latitude, longitude, courseName }: CourseMapProps) {
  const center = {
    lat: parseFloat(latitude.toString()),
    lng: parseFloat(longitude.toString())
  };

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden w-full h-[400px] [&_.gm-style-cc]:!hidden [&_a[href^='https://maps.google.com']]:!hidden [&_.gmnoprint]:!hidden [&_.gm-style-cc+div]:!hidden [&_button[aria-label*='Zoom']]:!block [&_div[aria-label='Zoom']]:!block">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          disableDefaultUI={true}
          zoomControl={true}
          mapId="course-map"
          clickableIcons={false}
          gestureHandling="greedy"
          styles={[
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]}
        >
          <AdvancedMarker position={center} title={courseName}>
            <img 
              src="/favicon.ico" 
              alt="Course location marker" 
              style={{ width: 32, height: 32 }}
            />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}

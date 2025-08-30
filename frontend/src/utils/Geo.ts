export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // Earth radius (m)
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Gets the user's current position coordinates.
 * Returns latitude and longitude if successful, throws error if failed.
 */
export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  // Next.js/SSR guard
  if (typeof window === 'undefined') {
    throw new Error('Geolocation not available in server environment');
  }

  // Must be secure (https or localhost)
  if (!window.isSecureContext) {
    throw new Error('Geolocation requires secure context (HTTPS)');
  }

  // Basic support check
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation not supported by this browser');
  }

  return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location'));
            break;
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}
/**
 * Checks if geolocation permission is granted.
 * Returns true only if the site currently has permission.
 * Returns false if denied, blocked, unsupported, or unknown.
 */
export async function checkLocationPermission(): Promise<boolean> {
  // Next.js/SSR guard
  if (typeof window === 'undefined') return false;

  // Must be secure (https or localhost)
  if (!window.isSecureContext) return false;

  // Basic support check
  if (!('geolocation' in navigator)) return false;

  // Try Permissions API if available
  try {
    // Safari may throw here; TS needs the cast for permissions API
    const status = await (navigator as Navigator & { permissions?: { query(descriptor: PermissionDescriptor): Promise<PermissionStatus> } }).permissions?.query?.(
      { name: 'geolocation' as PermissionName }
    );

    if (status) {
      if (status.state === 'granted') return true;
      if (status.state === 'denied') return false;
      // if 'prompt', fall through to an active check
    }
  } catch {
    // ignore and fall through
  }

  // Actively request a position to resolve 'prompt' -> granted/denied.
  // If the user denies, we get PERMISSION_DENIED and return false.
  // If it times out or is unavailable, permission status is unclear -> return false.
  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true), // we definitely have permission
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve(false);
        } else {
          // POSITION_UNAVAILABLE or TIMEOUT => not proof of permission
          resolve(false);
        }
      },
      {
        timeout: 5000,
        enableHighAccuracy: false,
        maximumAge: 0,
      }
    );
  });
}

/**
 * geolocation.ts
 * ------------------------------------------------------------------
 * Browser Geolocation API wrapper, plus reverse geocoding via
 * OpenStreetMap's free Nominatim API (no API key required). Kept as
 * plain utility functions (not a React hook) so they're usable from
 * both the asset-creation form and the "Near Me" browse toggle
 * without duplicating logic.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * getCurrentPosition
 * ------------------------------------------------------------------
 * Wraps the browser's callback-based navigator.geolocation.getCurrentPosition
 * in a Promise. Rejects with a human-readable message on any failure
 * (permission denied, timeout, unsupported browser, etc.) so callers
 * can surface it directly via toast.error() without needing to
 * interpret raw GeolocationPositionError codes themselves.
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

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
            reject(new Error('Location access was denied. Please enable it in your browser settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Your location could not be determined.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting your location.'));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * reverseGeocode
 * ------------------------------------------------------------------
 * Converts coordinates into a human-readable city name via
 * OpenStreetMap's Nominatim API. Free, no API key, but has a strict
 * usage policy (max 1 request/second, must set a custom User-Agent
 * or Referer in production use — the browser's default Referer
 * header satisfies this for client-side calls like this one).
 *
 * Returns null (rather than throwing) on any failure — reverse
 * geocoding is a UX nicety (pre-filling a city name), not essential;
 * the raw coordinates are what actually power the distance search,
 * so a failed city lookup should never block the overall flow.
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const address = data?.address;

    // Nominatim's address object varies by location type — try the
    // most likely city-equivalent fields in order of preference.
    return address?.city || address?.town || address?.village || address?.county || null;
  } catch {
    return null;
  }
}

export interface UserLocation {
  city: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'city';
}

export const POPULAR_CITIES: Record<string, { city: string; latitude: number; longitude: number }> = {
  Mumbai: { city: 'Mumbai', latitude: 18.9402, longitude: 72.8777 },
  Delhi: { city: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  Bangalore: { city: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  Pune: { city: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  Hyderabad: { city: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
  Chennai: { city: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  Kolkata: { city: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  Ahmedabad: { city: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  Jaipur: { city: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  Lucknow: { city: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
};

const LOCATION_STORAGE_KEY = 'reborrow_user_location';

export function getSavedUserLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserLocation(location: UserLocation): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Non-critical
  }
}

export function clearSavedUserLocation(): void {
  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch {
    // Non-critical
  }
}
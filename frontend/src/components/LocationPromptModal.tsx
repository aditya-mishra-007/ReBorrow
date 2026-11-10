import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  MapPin,
  Loader2,
  Navigation,
  X,
  Compass,
} from 'lucide-react';
import {
  getCurrentPosition,
  reverseGeocode,
  saveUserLocation,
  POPULAR_CITIES,
  type UserLocation,
} from '@/lib/geolocation';

interface LocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (location: UserLocation | null) => void;
  currentLocation: UserLocation | null;
}

export default function LocationPromptModal({
  isOpen,
  onClose,
  onLocationSelected,
  currentLocation,
}: LocationPromptModalProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [customCity, setCustomCity] = useState('');

  if (!isOpen) return null;

  const handleUseGPS = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentPosition();
      const detectedCity = await reverseGeocode(coords);
      const loc: UserLocation = {
        city: detectedCity || 'My Location',
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: 'gps',
      };
      saveUserLocation(loc);
      toast.success(`Location set: ${loc.city}`);
      onLocationSelected(loc);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not retrieve your GPS location.';
      toast.error(msg);
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickCity = (cityName: string) => {
    const cityData = POPULAR_CITIES[cityName];
    if (cityData) {
      const loc: UserLocation = {
        city: cityData.city,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        source: 'city',
      };
      saveUserLocation(loc);
      toast.success(`Location set to ${loc.city}`);
      onLocationSelected(loc);
      onClose();
    }
  };

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCity.trim();
    if (!trimmed) return;

    // Check if matched in popular cities
    const matchedKey = Object.keys(POPULAR_CITIES).find(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedKey) {
      handlePickCity(matchedKey);
      return;
    }

    // Default to Mumbai center if unknown city coordinates, but keep city name for filter
    const loc: UserLocation = {
      city: trimmed,
      latitude: 18.9402,
      longitude: 72.8777,
      source: 'city',
    };
    saveUserLocation(loc);
    toast.success(`Location set to ${trimmed}`);
    onLocationSelected(loc);
    onClose();
  };

  const handleBrowseAll = () => {
    onLocationSelected(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-gray-900 tracking-tight">
            Where are you located?
          </h2>
          <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
            ReBorrow matches you with community items in your neighborhood so you can pick them up quickly.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Action 1: GPS Auto Detect */}
          <button
            onClick={handleUseGPS}
            disabled={isLocating}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-600 py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-brand-700 active:scale-98 disabled:opacity-60 transition-all"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span>{isLocating ? 'Detecting your coordinates...' : 'Use My Current Location'}</span>
          </button>

          <div className="relative flex items-center justify-center text-xs uppercase tracking-wider text-gray-400">
            <span className="bg-white px-3 text-[11px] font-semibold">Or select your city</span>
            <div className="absolute inset-0 flex items-center -z-10">
              <div className="w-full border-t border-gray-100" />
            </div>
          </div>

          {/* Action 2: Popular City Pills */}
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(POPULAR_CITIES).slice(0, 6).map((city) => {
              const isSelected = currentLocation?.city.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  onClick={() => handlePickCity(city)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs ring-1 ring-brand-600'
                      : 'border-gray-200/80 bg-white text-gray-700 hover:border-brand-300 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className={`h-3 w-3 ${isSelected ? 'text-brand-600' : 'text-gray-400'}`} />
                  <span className="truncate">{city}</span>
                </button>
              );
            })}
          </div>

          {/* Action 3: Manual City Search */}
          <form onSubmit={handleCustomCitySubmit} className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Type another city (e.g. Lucknow, Jaipur)..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-3 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={!customCity.trim()}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-xs"
            >
              Apply
            </button>
          </form>

          {/* Action 4: Skip / Browse All */}
          <div className="pt-2 text-center border-t border-gray-100">
            <button
              type="button"
              onClick={handleBrowseAll}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 underline"
            >
              Skip and browse all items across India
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

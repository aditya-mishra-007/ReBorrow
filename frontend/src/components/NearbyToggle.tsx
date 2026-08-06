import { useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Loader2, X } from 'lucide-react';
import { getCurrentPosition } from '@/lib/geolocation';
import { getErrorMessage } from '@/lib/api';

/**
 * NearbyToggle.tsx
 * ------------------------------------------------------------------
 * Self-contained "Near Me" control. Owns its own locating/loading
 * state; reports the resolved coordinates + radius up to the parent
 * (HomePage) via onActivate, and reports deactivation via onClear.
 * The parent is responsible for actually fetching nearby assets with
 * those values — this component only handles the permission request
 * and radius selection UI.
 */

const RADIUS_OPTIONS = [10, 25, 50, 100, 250];

interface NearbyToggleProps {
  isActive: boolean;
  radius: number;
  onActivate: (coords: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  onClear: () => void;
}

export default function NearbyToggle({
  isActive,
  radius,
  onActivate,
  onRadiusChange,
  onClear,
}: NearbyToggleProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleClick = async () => {
    if (isActive) {
      onClear();
      return;
    }

    setIsLocating(true);
    try {
      const coords = await getCurrentPosition();
      onActivate({ lat: coords.latitude, lng: coords.longitude });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isLocating}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isLocating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isActive ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <MapPin className="h-3.5 w-3.5" />
        )}
        {isActive ? 'Near Me (active)' : 'Near Me'}
      </button>

      {isActive && (
        <select
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              Within {r} km
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
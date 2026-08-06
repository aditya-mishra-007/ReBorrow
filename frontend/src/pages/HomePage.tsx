import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { getCategoryIcon } from '@/constants/categories';
import { ImageOff } from 'lucide-react';
import Pagination from '@/components/Pagination';
import NearbyToggle from '@/components/NearbyToggle';
import {
  isPopulatedOwner,
  type Asset,
  type AssetStatus,
  type NearbyAsset,
  type PaginationMeta,
} from '@/types';

/**
 * HomePage.tsx
 * ------------------------------------------------------------------
 * Public route: /
 *
 * Two mutually exclusive browsing modes:
 *   1. Regular mode (default): paginated, filterable, searchable list
 *      via GET /api/assets.
 *   2. "Near Me" mode: distance-sorted list via GET /api/assets/nearby,
 *      once the user grants location access. No pagination in this
 *      mode (backend caps results at 100, sorted nearest-first).
 *
 * Switching between modes resets search/pagination state to avoid
 * confusing carryover (e.g., a page-3 selection from regular mode
 * persisting into nearby mode, which has no pages).
 */

const STATUS_FILTERS: { label: string; value: AssetStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Requested', value: 'requested' },
  { label: 'Borrowed', value: 'borrowed' },
];

const PAGE_SIZE = 12;
const DEFAULT_RADIUS = 25;

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Nearby mode state ---
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(DEFAULT_RADIUS);

  const fetchRegularAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, pagination: paginationMeta } = await assetApi.getAssets({
        search: activeSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setAssets(data);
      setPagination(paginationMeta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, statusFilter, currentPage]);

  const fetchNearbyAssets = useCallback(async () => {
    if (!nearbyCoords) return;
    setIsLoading(true);
    try {
      const { data } = await assetApi.getNearbyAssets({
        lat: nearbyCoords.lat,
        lng: nearbyCoords.lng,
        radius: nearbyRadius,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setAssets(data);
      setPagination(null); // nearby mode has no pagination
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [nearbyCoords, nearbyRadius, statusFilter]);

  useEffect(() => {
    if (isNearbyMode) {
      fetchNearbyAssets();
    } else {
      fetchRegularAssets();
    }
  }, [isNearbyMode, fetchRegularAssets, fetchNearbyAssets]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (value: AssetStatus | 'all') => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNearbyActivate = (coords: { lat: number; lng: number }) => {
    setNearbyCoords(coords);
    setIsNearbyMode(true);
  };

  const handleNearbyClear = () => {
    setIsNearbyMode(false);
    setNearbyCoords(null);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* --- Page header --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Items</h1>
        <p className="mt-1 text-gray-500">
          Discover what your community is willing to lend.
        </p>
      </div>

      {/* --- Search + filter controls --- */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items..."
            disabled={isNearbyMode}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={isNearbyMode}
            className="whitespace-nowrap rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusFilterChange(filter.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Near Me toggle --- */}
      <div className="mb-6">
        <NearbyToggle
          isActive={isNearbyMode}
          radius={nearbyRadius}
          onActivate={handleNearbyActivate}
          onRadiusChange={setNearbyRadius}
          onClear={handleNearbyClear}
        />
        {isNearbyMode && (
          <p className="mt-2 text-xs text-gray-400">
            Showing items sorted by distance. Search is disabled while Near Me is active.
          </p>
        )}
      </div>

      {/* --- Result count --- */}
      {!isLoading && !isNearbyMode && pagination && pagination.totalCount > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          Showing {(pagination.currentPage - 1) * pagination.limit + 1}–
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount} items
        </p>
      )}
      {!isLoading && isNearbyMode && (
        <p className="mb-4 text-sm text-gray-500">
          {assets.length} item{assets.length !== 1 ? 's' : ''} within {nearbyRadius} km
        </p>
      )}

      {/* --- Asset grid / states --- */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
            role="status"
            aria-label="Loading"
          />
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">
            {isNearbyMode
              ? 'No items found within this radius. Try widening the search.'
              : 'No items found. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard key={asset._id} asset={asset} />
            ))}
          </div>

          {!isNearbyMode && pagination && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * AssetCard
 * ------------------------------------------------------------------
 * Displays distanceMeters as a friendly "X km away" badge when
 * present (i.e., when rendered from a NearbyAsset in nearby mode) —
 * uses a type guard rather than a prop flag, so the card component
 * doesn't need to know which mode the parent is in.
 */
function AssetCard({ asset }: { asset: Asset | NearbyAsset }) {
  const ownerName = isPopulatedOwner(asset.owner) ? asset.owner.name : 'Unknown';
  const thumbnail = asset.images[0];
  const distanceKm = 'distanceMeters' in asset ? asset.distanceMeters / 1000 : null;

  const statusStyles: Record<AssetStatus, string> = {
    available: 'bg-green-100 text-green-800',
    requested: 'bg-yellow-100 text-yellow-800',
    borrowed: 'bg-gray-200 text-gray-700',
  };

  return (
    <Link
      to={`/assets/${asset._id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={asset.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-gray-300" />
          </div>
        )}

        {distanceKm !== null && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {distanceKm < 1 ? '<1 km' : `${distanceKm.toFixed(1)} km`} away
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="line-clamp-1 text-lg font-semibold text-gray-900">{asset.name}</h2>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[asset.status]}`}
          >
            {asset.status}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 flex-1 text-sm text-gray-500">{asset.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <CategoryBadge category={asset.category} />
          <span>Listed by {ownerName}</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * CategoryBadge
 * ------------------------------------------------------------------
 * Small reusable badge pairing a category's icon with its label.
 */
function CategoryBadge({ category }: { category: string }) {
  const Icon = getCategoryIcon(category);

  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2 py-1 font-medium text-gray-600">
      <Icon className="h-3.5 w-3.5" />
      {category}
    </span>
  );
}
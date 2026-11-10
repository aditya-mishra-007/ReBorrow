import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { CATEGORIES, getCategoryIcon } from '@/constants/categories';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Zap,
  Repeat,
  Sparkles,
  SlidersHorizontal,
  ImageOff,
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import NearbyToggle from '@/components/NearbyToggle';
import {
  isPopulatedOwner,
  type Asset,
  type AssetStatus,
  type NearbyAsset,
  type PaginationMeta,
} from '@/types';

const STATUS_FILTERS: { label: string; value: AssetStatus | 'all' }[] = [
  { label: 'All Items', value: 'all' },
  { label: 'Available Now', value: 'available' },
  { label: 'Requested', value: 'requested' },
  { label: 'Borrowed', value: 'borrowed' },
];

const CONDITION_FILTERS = ['all', 'New', 'Like New', 'Good', 'Fair'] as const;

const PAGE_SIZE = 12;
const DEFAULT_RADIUS = 25;

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
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
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });

      // Filter by condition locally if specified (or backend condition filter)
      let filtered = data;
      if (selectedCondition !== 'all') {
        filtered = filtered.filter(
          (a) => a.condition?.toLowerCase() === selectedCondition.toLowerCase()
        );
      }

      setAssets(filtered);
      setPagination(paginationMeta);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, selectedCategory, selectedCondition, statusFilter, currentPage]);

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

      let filtered = data;
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(
          (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      if (selectedCondition !== 'all') {
        filtered = filtered.filter(
          (a) => a.condition?.toLowerCase() === selectedCondition.toLowerCase()
        );
      }

      setAssets(filtered);
      setPagination(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [nearbyCoords, nearbyRadius, statusFilter, selectedCategory, selectedCondition]);

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

  const handleCategorySelect = (categoryValue: string) => {
    setCurrentPage(1);
    setSelectedCategory(categoryValue);
  };

  const handleStatusFilterChange = (value: AssetStatus | 'all') => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 350, behavior: 'smooth' });
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
    <div className="space-y-10">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 p-8 text-white shadow-xl sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-700/40 px-3.5 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            <span>Community-Powered Peer Lending</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Borrow what you need. <br />
            <span className="text-brand-300">Share what you own.</span>
          </h1>

          <p className="text-base leading-relaxed text-brand-100/90 sm:text-lg">
            Access pro power tools, cameras, camping gear, and appliances right in your neighborhood.
            Save money, cut waste, and build trust.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search drills, DSLR cameras, tents, drones..."
                disabled={isNearbyMode}
                className="w-full rounded-xl border-0 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 disabled:bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={isNearbyMode}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-98 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>Search Catalog</span>
            </button>
          </form>

          {/* Quick Value Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-700/60 sm:grid-cols-4 text-xs font-medium text-brand-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Verified Lenders</span>
            </div>
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-brand-300" />
              <span>Zero Service Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Instant Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>4.9 Avg Item Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORY PILLS ===================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Browse by Category
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleCategorySelect('all')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/20'
                : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>All Items</span>
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/20'
                    : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================== FILTERS & CONTROLS ===================== */}
      <section className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleStatusFilterChange(filter.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Condition Dropdown & Active Filter Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Condition:</span>
              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none"
              >
                {CONDITION_FILTERS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond === 'all' ? 'All Conditions' : cond}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Near Me Location Bar */}
        <div className="border-t border-gray-100 pt-3">
          <NearbyToggle
            isActive={isNearbyMode}
            radius={nearbyRadius}
            onActivate={handleNearbyActivate}
            onRadiusChange={setNearbyRadius}
            onClear={handleNearbyClear}
          />
        </div>
      </section>

      {/* ===================== ASSET LIST / GRID ===================== */}
      <section className="space-y-6">
        {/* Results summary header */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
          {!isLoading && !isNearbyMode && pagination && (
            <span>
              Showing {assets.length} of {pagination.totalCount} community items
              {activeSearch && ` matching "${activeSearch}"`}
            </span>
          )}
          {!isLoading && isNearbyMode && (
            <span>
              Found {assets.length} items within {nearbyRadius} km of your location
            </span>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No items match your criteria</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Try relaxing your category or status filters, or check back soon as neighbors add new items.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedCondition('all');
                  setStatusFilter('all');
                  setActiveSearch('');
                  setSearchInput('');
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>

            {!isNearbyMode && pagination && (
              <div className="pt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

/**
 * High-Fidelity AssetCard
 */
function AssetCard({ asset }: { asset: Asset | NearbyAsset }) {
  const ownerName = isPopulatedOwner(asset.owner) ? asset.owner.name : 'Neighbor';
  const thumbnail = asset.images?.[0];
  const distanceKm = 'distanceMeters' in asset ? asset.distanceMeters / 1000 : null;

  const statusStyles: Record<AssetStatus, { badge: string; label: string }> = {
    available: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Available' },
    requested: { badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Requested' },
    borrowed: { badge: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Borrowed' },
  };

  const conditionColors: Record<string, string> = {
    New: 'bg-purple-50 text-purple-700 border-purple-200',
    'Like New': 'bg-blue-50 text-blue-700 border-blue-200',
    Good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fair: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const cost = asset.borrowingCostPerDay ?? 0;
  const rating = asset.ownerRating ?? 4.9;

  return (
    <Link
      to={`/assets/${asset._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
    >
      {/* Thumbnail with Overlays */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={asset.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm shadow-xs ${
              statusStyles[asset.status]?.badge
            }`}
          >
            {statusStyles[asset.status]?.label}
          </span>
          {asset.condition && (
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm shadow-xs ${
                conditionColors[asset.condition] || 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {asset.condition}
            </span>
          )}
        </div>

        {/* Distance Badge */}
        {distanceKm !== null && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
            {distanceKm < 1 ? '<1 km' : `${distanceKm.toFixed(1)} km`} away
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <CategoryBadge category={asset.category} />
          {asset.location?.city && (
            <span className="flex items-center gap-1 text-gray-400">
              <MapPin className="h-3 w-3" />
              {asset.location.city}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
          {asset.name}
        </h3>

        {asset.brand && (
          <p className="text-xs font-medium text-brand-700/80">{asset.brand}</p>
        )}

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 flex-1">
          {asset.description}
        </p>

        {/* Pricing & Owner Row */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <div className="flex items-baseline gap-1">
              {cost > 0 ? (
                <>
                  <span className="text-base font-extrabold text-gray-900">₹{cost}</span>
                  <span className="text-xs text-gray-500 font-medium">/ day</span>
                </>
              ) : (
                <span className="text-sm font-bold text-emerald-600">Free to borrow</span>
              )}
            </div>
            {asset.securityDeposit ? (
              <span className="text-[10px] text-gray-400">
                Deposit: ₹{asset.securityDeposit} (refundable)
              </span>
            ) : null}
          </div>

          <div className="flex flex-col items-end text-right">
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-gray-400 max-w-[90px] truncate">{ownerName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = getCategoryIcon(category);
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
      <Icon className="h-3 w-3" />
      {category}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="aspect-[16/10] w-full bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-2/3 bg-gray-200 rounded" />
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
          <div className="h-5 w-1/4 bg-gray-200 rounded" />
          <div className="h-5 w-1/4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

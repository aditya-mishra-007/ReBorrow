import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { isPopulatedOwner, type Asset, type AssetStatus, type PaginationMeta } from '@/types';
import Pagination from '@/components/Pagination';

/**
 * HomePage.tsx
 * ------------------------------------------------------------------
 * Public route: /
 *
 * Primary asset discovery/browsing page. Supports:
 *   - Free-text search (name/description/category, via backend's
 *     $text index)
 *   - Status filtering (available / requested / borrowed / all)
 *   - Pagination (12 items per page)
 *
 * No authentication required to view — matches the "public browsing,
 * auth wall on actions" access model established in App.tsx.
 */

const STATUS_FILTERS: { label: string; value: AssetStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Requested', value: 'requested' },
  { label: 'Borrowed', value: 'borrowed' },
];

const PAGE_SIZE = 12;

export default function HomePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAssets = useCallback(async () => {
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

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // reset to page 1 whenever a new search is submitted
    setActiveSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (value: AssetStatus | 'all') => {
    setCurrentPage(1); // reset to page 1 whenever the filter changes
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top so the user sees the new page's results from the
    // start, rather than staying scrolled wherever they were on the
    // previous page (which could land mid-grid on a shorter last page).
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
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

      {/* --- Result count --- */}
      {!isLoading && pagination && pagination.totalCount > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          Showing {(pagination.currentPage - 1) * pagination.limit + 1}–
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount} items
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
          <p className="text-gray-500">No items found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard key={asset._id} asset={asset} />
            ))}
          </div>

          {pagination && (
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
 * Local presentational component for a single asset in the grid.
 */
function AssetCard({ asset }: { asset: Asset }) {
  const ownerName = isPopulatedOwner(asset.owner) ? asset.owner.name : 'Unknown';

  const statusStyles: Record<AssetStatus, string> = {
    available: 'bg-green-100 text-green-800',
    requested: 'bg-yellow-100 text-yellow-800',
    borrowed: 'bg-gray-200 text-gray-700',
  };

  return (
    <Link
      to={`/assets/${asset._id}`}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
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
        <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-600">
          {asset.category}
        </span>
        <span>Listed by {ownerName}</span>
      </div>
    </Link>
  );
}
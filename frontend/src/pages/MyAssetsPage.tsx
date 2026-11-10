import { ImageOff, Plus, Trash2, MapPin, Eye } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Asset, AssetStatus } from '@/types';

const statusStyles: Record<AssetStatus, { badge: string; label: string }> = {
  available: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Available' },
  requested: { badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Requested' },
  borrowed: { badge: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Borrowed' },
};

export default function MyAssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyAssets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await assetApi.getAssets({ owner: 'me' });
      setAssets(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyAssets();
  }, [fetchMyAssets]);

  const handleDelete = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      return;
    }

    setDeletingId(assetId);
    try {
      await assetApi.deleteAsset(assetId);
      toast.success('Listing deleted');
      setAssets((prev) => prev.filter((a) => a._id !== assetId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Listed Assets</h1>
          <p className="mt-1 text-xs text-gray-500">
            Manage your items available for borrowing, edit details, or remove listings.
          </p>
        </div>

        <Link
          to="/assets/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>List New Item</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No items listed yet</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            You haven't added any items to lend out. Share tools, equipment, or cameras with your community!
          </p>
          <Link
            to="/assets/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            List your first item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const isDeleting = deletingId === asset._id;
            const statusConfig = statusStyles[asset.status];
            const cost = asset.borrowingCostPerDay ?? 0;

            return (
              <div
                key={asset._id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                  {asset.images?.[0] ? (
                    <img
                      src={asset.images[0]}
                      alt={asset.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}

                  <div className="absolute left-2.5 top-2.5 flex gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs ${
                        statusConfig?.badge
                      }`}
                    >
                      {statusConfig?.label}
                    </span>
                    {asset.condition && (
                      <span className="rounded-md border border-gray-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700 backdrop-blur-xs">
                        {asset.condition}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{asset.category}</span>
                    {asset.location?.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {asset.location.city}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 line-clamp-1 text-sm font-bold text-gray-900">{asset.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 flex-1">{asset.description}</p>

                  <div className="mt-3 flex items-baseline justify-between border-t border-gray-50 pt-2.5">
                    <div>
                      {cost > 0 ? (
                        <span className="text-sm font-extrabold text-gray-900">₹{cost}/day</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Free to borrow</span>
                      )}
                    </div>
                    {asset.securityDeposit ? (
                      <span className="text-[10px] text-gray-400">Deposit: ₹{asset.securityDeposit}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    <Link
                      to={`/assets/${asset._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Public Page
                    </Link>

                    <button
                      onClick={() => handleDelete(asset._id)}
                      disabled={isDeleting}
                      title="Delete listing"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

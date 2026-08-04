import { ImageOff, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Asset, AssetStatus } from '@/types';

/**
 * MyAssetsPage.tsx
 * ------------------------------------------------------------------
 * Private route: /my-assets (guarded by ProtectedRoute)
 *
 * Lists all assets owned by the current user, with inline edit and
 * delete actions. Uses the backend's `owner=me` query param
 * (assetController.ts's getAssets) to fetch only the current user's
 * assets directly from the server, rather than fetching the entire
 * public asset list and filtering client-side.
 */
export default function MyAssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    if (!window.confirm('Delete this listing? This cannot be undone.')) {
      return;
    }

    setDeletingId(assetId);
    try {
      await assetApi.deleteAsset(assetId);
      toast.success('Listing deleted');
      setAssets((prev) => prev.filter((a) => a._id !== assetId));
    } catch (error) {
      // Surfaces the backend's 409 message if an active/pending borrow
      // request blocks deletion (see deleteAsset in assetController.ts)
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const statusStyles: Record<AssetStatus, string> = {
    available: 'bg-green-100 text-green-800',
    requested: 'bg-yellow-100 text-yellow-800',
    borrowed: 'bg-gray-200 text-gray-700',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
          <p className="mt-1 text-gray-500">Manage the items you've listed for lending.</p>
        </div>
        <Link
          to="/assets/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + List an Item
        </Link>
      </div>

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
          <p className="mb-3 text-gray-500">You haven't listed any items yet.</p>
          <Link to="/assets/new" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            List your first item →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {asset.images[0] ? (
                    <img src={asset.images[0]} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/assets/${asset._id}`}
                    className="truncate font-semibold text-gray-900 hover:text-brand-600"
                  >
                    {asset.name}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-gray-500">{asset.description}</p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(asset._id)}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(asset._id)}
                  disabled={deletingId === asset._id}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === asset._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>

              {editingId === asset._id && (
                <EditAssetForm
                  asset={asset}
                  onClose={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setAssets((prev) =>
                      prev.map((a) => (a._id === updated._id ? updated : a))
                    );
                    setEditingId(null);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * EditAssetForm
 * ------------------------------------------------------------------
 * Inline edit form rendered below an asset row when its "Edit" button
 * is clicked. Kept simple (uncontrolled-ish via local state, not
 * react-hook-form) since it's a small, self-contained 3-field form —
 * pulling in the full react-hook-form machinery here would be
 * disproportionate for something this contained.
 */
function EditAssetForm({
  asset,
  onClose,
  onSaved,
}: {
  asset: Asset;
  onClose: () => void;
  onSaved: (updated: Asset) => void;
}) {
  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [description, setDescription] = useState(asset.description);
  const [images, setImages] = useState(asset.images);
  const [isSaving, setIsSaving] = useState(false);
  const [removingImage, setRemovingImage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await assetApi.updateAsset(asset._id, { name, category, description });
      toast.success('Listing updated');
      onSaved({ ...data, images });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!window.confirm('Remove this image?')) return;

    setRemovingImage(imageUrl);
    try {
      const { data } = await assetApi.deleteAssetImage(asset._id, imageUrl);
      toast.success('Image removed');
      setImages(data.images);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingImage(null);
    }
  };

  return (
    <div className="w-full basis-full rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        {images.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Photos</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    disabled={removingImage === url}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
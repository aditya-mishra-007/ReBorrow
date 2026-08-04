import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import * as borrowRequestApi from '@/api/borrowRequestApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isPopulatedOwner, type Asset, type AssetStatus } from '@/types';

/**
 * AssetDetailPage.tsx
 * ------------------------------------------------------------------
 * Public route: /assets/:id
 *
 * Displays full asset detail (owner info, description, status).
 * Conditionally renders a "Request to Borrow" form if:
 *   - The viewer is authenticated
 *   - The viewer is NOT the asset's owner (mirrors backend's
 *     SELF_BORROW_FORBIDDEN rule — enforced here purely for UX,
 *     the backend is still the actual authority)
 *   - The asset's status is 'available'
 *
 * Unauthenticated viewers see a "Log in to borrow this item" prompt
 * instead of the form, consistent with the public-browse/auth-wall-
 * on-action access model.
 */

interface BorrowFormValues {
  startDate: string;
  endDate: string;
}

const statusStyles: Record<AssetStatus, string> = {
  available: 'bg-green-100 text-green-800',
  requested: 'bg-yellow-100 text-yellow-800',
  borrowed: 'bg-gray-200 text-gray-700',
};

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BorrowFormValues>();

  const startDateValue = watch('startDate');

  const fetchAsset = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const { data } = await assetApi.getAssetById(id);
      setAsset(data);
    } catch (error) {
      setNotFound(true);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  const isOwner =
    asset && user && isPopulatedOwner(asset.owner) && asset.owner._id === user._id;

  const onSubmitBorrowRequest = async (formValues: BorrowFormValues) => {
    if (!asset) return;

    setIsSubmittingRequest(true);
    try {
      await borrowRequestApi.createBorrowRequest({
        asset: asset._id,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      });
      toast.success('Borrow request sent! The owner will review it shortly.');
      reset();
      // Re-fetch so the page reflects the asset's new 'requested' status
      // immediately, rather than showing a stale 'available' badge.
      fetchAsset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Today's date in YYYY-MM-DD, used as the `min` attribute on the
  // start-date input so users can't pick a date in the past.
  const todayStr = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">This item could not be found.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-600">
          ← Back to browsing
        </Link>
      </div>
    );
  }

  const ownerName = isPopulatedOwner(asset.owner) ? asset.owner.name : 'Unknown';
  const ownerEmail = isPopulatedOwner(asset.owner) ? asset.owner.email : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-4 inline-block text-sm font-medium text-brand-600">
        ← Back to browsing
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {/* --- Header: name + status --- */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[asset.status]}`}
          >
            {asset.status}
          </span>
        </div>

        <span className="mb-4 inline-block rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {asset.category}
        </span>

        <p className="mb-6 whitespace-pre-wrap text-gray-700">{asset.description}</p>

        {/* --- Owner info --- */}
        <div className="mb-6 rounded-md bg-gray-50 p-4 text-sm">
          <p className="text-gray-500">Listed by</p>
          <p className="font-medium text-gray-900">{ownerName}</p>
          {ownerEmail && <p className="text-gray-500">{ownerEmail}</p>}
        </div>

        {/* --- Conditional action area --- */}
        {isOwner ? (
          <div className="rounded-md border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            This is your listing. Manage it from{' '}
            <Link to="/my-assets" className="font-medium underline">
              My Assets
            </Link>
            .
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-sm">
            <p className="mb-2 text-gray-600">Log in to request this item.</p>
            <Link
              to="/login"
              state={{ from: { pathname: `/assets/${asset._id}` } }}
              className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Log In
            </Link>
          </div>
        ) : asset.status !== 'available' ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
            This item is not currently available for borrowing.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmitBorrowRequest)}
            className="space-y-4 rounded-md border border-gray-200 p-4"
            noValidate
          >
            <h2 className="font-semibold text-gray-900">Request to Borrow</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  min={todayStr}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
                  {...register('startDate', { required: 'Start date is required' })}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  min={startDateValue || todayStr}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
                  {...register('endDate', {
                    required: 'End date is required',
                    validate: (value) =>
                      !startDateValue ||
                      value > startDateValue ||
                      'End date must be after start date',
                  })}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingRequest ? 'Sending request...' : 'Send Borrow Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as borrowRequestApi from '@/api/borrowRequestApi';
import { getErrorMessage } from '@/lib/api';
import { isPopulatedAsset, type BorrowRequest, type BorrowRequestStatus } from '@/types';

/**
 * MyRequestsPage.tsx
 * ------------------------------------------------------------------
 * Private route: /my-requests (guarded by ProtectedRoute)
 *
 * Lists all borrow requests the current user has made (as requester)
 * on OTHER users' assets. Read-only status tracking, EXCEPT for a
 * 'pending' request, which can be cancelled by the requester —
 * approve/reject remain exclusively the asset owner's actions, on
 * IncomingRequestsPage.
 */

const statusStyles: Record<BorrowRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await borrowRequestApi.getMyBorrowRequests();
      setRequests(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancel = async (requestId: string) => {
    if (!window.confirm('Cancel this borrow request?')) {
      return;
    }

    setCancellingId(requestId);
    try {
      await borrowRequestApi.cancelBorrowRequest(requestId);
      toast.success('Request cancelled');
      // The request is deleted server-side, so remove it from local
      // state entirely rather than trying to update its status.
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="mt-1 text-gray-500">Track items you've asked to borrow.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
            role="status"
            aria-label="Loading"
          />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <p className="mb-3 text-gray-500">You haven't requested to borrow anything yet.</p>
          <Link to="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Browse items →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const asset = isPopulatedAsset(request.asset) ? request.asset : null;
            const isCancelling = cancellingId === request._id;

            return (
              <div
                key={request._id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {asset ? (
                      <Link
                        to={`/assets/${asset._id}`}
                        className="truncate font-semibold text-gray-900 hover:text-brand-600"
                      >
                        {asset.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-500">
                        (Item no longer available)
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(request.startDate)} → {formatDate(request.endDate)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-gray-400">
                    Requested {formatDate(request.createdAt)}
                  </span>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request._id)}
                      disabled={isCancelling}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
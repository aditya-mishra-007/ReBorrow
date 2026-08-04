import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as borrowRequestApi from '@/api/borrowRequestApi';
import { getErrorMessage } from '@/lib/api';
import {
  isPopulatedAsset,
  isPopulatedOwner,
  type BorrowRequest,
  type BorrowRequestStatus,
} from '@/types';

/**
 * IncomingRequestsPage.tsx
 * ------------------------------------------------------------------
 * Private route: /incoming-requests (guarded by ProtectedRoute)
 *
 * Lists all borrow requests made ON the current user's own assets
 * (as owner), with Approve/Reject actions for any 'pending' request.
 * This is where the core approve/reject business logic (asset status
 * cascade to 'borrowed' or back to 'available') gets triggered from
 * the UI — the backend does all the actual state-transition work,
 * this page just calls the two mutation endpoints and refreshes.
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

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Tracks which specific request is mid-mutation (approve or reject)
  // so we can disable only that row's buttons, not the whole page.
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await borrowRequestApi.getIncomingBorrowRequests();
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

  const handleApprove = async (requestId: string) => {
    setActioningId(requestId);
    try {
      const { data: updated } = await borrowRequestApi.approveBorrowRequest(requestId);
      toast.success('Request approved');
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActioningId(requestId);
    try {
      const { data: updated } = await borrowRequestApi.rejectBorrowRequest(requestId);
      toast.success('Request rejected');
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Incoming Requests</h1>
        <p className="mt-1 text-gray-500">
          Review and respond to requests on your listed items.
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              {pendingCount} pending
            </span>
          )}
        </p>
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
          <p className="text-gray-500">No one has requested to borrow your items yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const asset = isPopulatedAsset(request.asset) ? request.asset : null;
            const requester = isPopulatedOwner(request.requester) ? request.requester : null;
            const isActioning = actioningId === request._id;

            return (
              <div
                key={request._id}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {asset ? (
                      <Link
                        to={`/assets/${asset._id}`}
                        className="truncate font-semibold text-gray-900 hover:text-brand-600"
                      >
                        {asset.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-500">(Item unavailable)</span>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    Requested by{' '}
                    <span className="font-medium">{requester ? requester.name : 'Unknown'}</span>
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(request.startDate)} → {formatDate(request.endDate)}
                  </p>
                </div>

                {/* --- Actions: only shown for pending requests --- */}
                {request.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={isActioning}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActioning ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      disabled={isActioning}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActioning ? '...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as borrowRequestApi from '@/api/borrowRequestApi';
import { getErrorMessage } from '@/lib/api';
import { isPopulatedAsset, type BorrowRequest, type BorrowRequestStatus } from '@/types';
import { Calendar, ArrowUpRight, ImageOff, Clock, CheckCircle2, XCircle } from 'lucide-react';

const statusStyles: Record<
  BorrowRequestStatus,
  { badge: string; label: string; icon: typeof Clock }
> = {
  pending: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Pending Owner Review',
    icon: Clock,
  },
  approved: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Approved by Owner',
    icon: CheckCircle2,
  },
  rejected: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Declined by Owner',
    icon: XCircle,
  },
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
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">My Borrow Requests</h1>
        <p className="mt-1 text-xs text-gray-500">
          Track the status of items you have requested from neighbors.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No active borrow requests</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            You haven't requested to borrow anything yet. Browse the community catalog to find items you need.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const asset = isPopulatedAsset(request.asset) ? request.asset : null;
            const isCancelling = cancellingId === request._id;
            const statusConfig = statusStyles[request.status];
            const StatusIcon = statusConfig?.icon || Clock;

            return (
              <div
                key={request._id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                    {asset?.images?.[0] ? (
                      <img
                        src={asset.images[0]}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {asset ? (
                        <Link
                          to={`/assets/${asset._id}`}
                          className="truncate text-sm font-bold text-gray-900 hover:text-brand-600"
                        >
                          {asset.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-gray-400">
                          (Item no longer available)
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          statusConfig?.badge
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig?.label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </span>
                    </div>

                    {asset?.borrowingCostPerDay ? (
                      <p className="mt-0.5 text-[11px] font-medium text-gray-600">
                        Rate: ₹{asset.borrowingCostPerDay}/day
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3 sm:border-0 sm:pt-0">
                  <span className="text-[11px] text-gray-400">
                    Requested on {formatDate(request.createdAt)}
                  </span>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request._id)}
                      disabled={isCancelling}
                      className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Request'}
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

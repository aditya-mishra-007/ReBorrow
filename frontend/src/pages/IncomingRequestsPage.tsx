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
import {
  Calendar,
  Inbox,
  ImageOff,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Check,
  X,
} from 'lucide-react';

const statusStyles: Record<
  BorrowRequestStatus,
  { badge: string; label: string; icon: typeof Clock }
> = {
  pending: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Needs Your Review',
    icon: Clock,
  },
  approved: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Approved',
    icon: CheckCircle2,
  },
  rejected: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'Declined',
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

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      toast.success('Request approved! Item marked as borrowed.');
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
      toast.success('Request declined.');
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Incoming Requests</h1>
          <p className="mt-1 text-xs text-gray-500">
            Neighbors requesting to borrow your equipment and items.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            {pendingCount} Pending Approval
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No incoming requests yet</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            When other users want to borrow items you've listed, their requests will appear here for your approval.
          </p>
          <Link
            to="/assets/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            List Another Item
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const asset = isPopulatedAsset(request.asset) ? request.asset : null;
            const requester = isPopulatedOwner(request.requester) ? request.requester : null;
            const isActioning = actioningId === request._id;
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
                        Borrow Period: {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>Requester: </span>
                      <span className="font-semibold text-gray-900">
                        {requester?.name || 'Neighbor'}
                      </span>
                      {requester?.email && (
                        <span className="text-gray-400 text-[11px]">({requester.email})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-gray-50 pt-3 sm:border-0 sm:pt-0">
                  {request.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(request._id)}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        disabled={isActioning}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Decided on {formatDate(request.updatedAt)}
                    </span>
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

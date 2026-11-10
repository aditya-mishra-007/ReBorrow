import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getCategoryIcon } from '@/constants/categories';
import {
  ImageOff,
  MessageCircle,
  MapPin,
  Star,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  ChevronLeft,
  Share2,
} from 'lucide-react';
import * as assetApi from '@/api/assetApi';
import * as borrowRequestApi from '@/api/borrowRequestApi';
import * as messageApi from '@/api/messageApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isPopulatedOwner, type Asset, type AssetStatus } from '@/types';

interface BorrowFormValues {
  startDate: string;
  endDate: string;
}

const statusStyles: Record<AssetStatus, { badge: string; label: string }> = {
  available: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Available for Borrow' },
  requested: { badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Currently Requested' },
  borrowed: { badge: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Currently Lent Out' },
};

const conditionColors: Record<string, string> = {
  New: 'bg-purple-50 text-purple-700 border-purple-200',
  'Like New': 'bg-blue-50 text-blue-700 border-blue-200',
  Good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fair: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BorrowFormValues>();

  const startDateValue = watch('startDate');
  const endDateValue = watch('endDate');

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

  const handleMessageOwner = async () => {
    if (!asset || !isPopulatedOwner(asset.owner)) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/assets/${asset._id}` } } });
      return;
    }

    setIsStartingChat(true);
    try {
      const { data } = await messageApi.startConversation(asset.owner._id, asset._id);
      navigate(`/messages?conversation=${data._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsStartingChat(false);
    }
  };

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
      fetchAsset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Dynamic cost calculation based on selected dates
  const costBreakdown = useMemo(() => {
    if (!startDateValue || !endDateValue || !asset) return null;
    const start = new Date(startDateValue);
    const end = new Date(endDateValue);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days <= 0) return null;

    const rate = asset.borrowingCostPerDay ?? 0;
    const subtotal = days * rate;
    const deposit = asset.securityDeposit ?? 0;
    const total = subtotal + deposit;

    return { days, rate, subtotal, deposit, total };
  }, [startDateValue, endDateValue, asset]);

  const todayStr = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-xs font-medium text-gray-500">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Item Not Found</h2>
        <p className="mt-1 text-sm text-gray-500">
          This listing may have been removed by its owner or is no longer accessible.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Browse
        </Link>
      </div>
    );
  }

  const ownerName = isPopulatedOwner(asset.owner) ? asset.owner.name : 'Community Member';
  const ownerRating = asset.ownerRating ?? 4.9;
  const cost = asset.borrowingCostPerDay ?? 0;
  const deposit = asset.securityDeposit ?? 0;

  return (
    <div className="space-y-6">
      {/* --- Breadcrumb / Back Link --- */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-brand-600">
            <ChevronLeft className="h-4 w-4" />
            Browse
          </Link>
          <span>/</span>
          <span className="text-gray-400">{asset.category}</span>
          <span>/</span>
          <span className="font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-md">
            {asset.name}
          </span>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
        >
          <Share2 className="h-3.5 w-3.5 text-gray-500" />
          <span>Share</span>
        </button>
      </div>

      {/* --- Main 2-Column Grid --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ===================== LEFT COLUMN (GALLERY & DETAILS) ===================== */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          {/* Gallery */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <ImageGallery images={asset.images} altText={asset.name} />
          </div>

          {/* Core Info */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    statusStyles[asset.status]?.badge
                  }`}
                >
                  {statusStyles[asset.status]?.label}
                </span>

                {asset.condition && (
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                      conditionColors[asset.condition] || 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    Condition: {asset.condition}
                  </span>
                )}

                <CategoryBadge category={asset.category} />

                {asset.location?.city && (
                  <span className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {asset.location.city}
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {asset.name}
              </h1>

              {asset.brand && (
                <p className="mt-1 text-sm font-semibold text-brand-700">Brand: {asset.brand}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                About this item
              </h2>
              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {asset.description}
              </p>
            </div>

            {/* Specifications Key-Value Grid */}
            {asset.specifications && Object.keys(asset.specifications).length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Specifications & Features
                </h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Object.entries(asset.specifications).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-medium text-gray-500">{key}</span>
                      <span className="font-semibold text-gray-900">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup & Return Instructions */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                Pickup & Handover Details
              </h2>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900">Pickup Instructions: </span>
                    <span>
                      {asset.pickupInstructions ||
                        'Pick up directly from the owner. You can coordinate preferred timing via chat.'}
                    </span>
                  </div>
                </div>

                {asset.location?.city && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Location: </span>
                      <span>Available in {asset.location.city} area. Exact address shared upon approval.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Borrowing Guidelines & Restrictions */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                Guidelines & Responsibilities
              </h2>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-2 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Borrower Note: </span>
                    <span>
                      {asset.restrictions ||
                        'Please treat this item with respect. Return it in clean, original working condition.'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-800/80 pl-6">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Inspect before taking possession and take photos at pickup & return.</span>
                </div>
              </div>
            </div>

            {/* Owner Profile Box */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                Listed by Neighbor
              </h2>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-base shadow-sm">
                    {ownerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm">{ownerName}</p>
                      <span title="Verified Member">
                        <ShieldCheck className="h-4 w-4 text-brand-600" />
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-700">{ownerRating.toFixed(1)}</span>
                      <span>• Community Lender</span>
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <button
                    onClick={handleMessageOwner}
                    disabled={isStartingChat}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-xs transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-brand-600" />
                    <span>{isStartingChat ? 'Connecting...' : 'Chat'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT COLUMN (STICKY BORROW BOX) ===================== */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-md">
              {/* Pricing Header */}
              <div className="mb-5 flex items-baseline justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Borrow Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {cost > 0 ? (
                      <>
                        <span className="text-3xl font-extrabold text-gray-900">₹{cost}</span>
                        <span className="text-xs text-gray-500 font-medium">/ day</span>
                      </>
                    ) : (
                      <span className="text-2xl font-extrabold text-emerald-600">Free to borrow</span>
                    )}
                  </div>
                </div>

                {deposit > 0 && (
                  <div className="text-right">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Security Deposit
                    </span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">₹{deposit}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">100% Refundable</p>
                  </div>
                )}
              </div>

              {/* Action Form or Conditional Notice */}
              {isOwner ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50/80 p-4 text-center">
                  <p className="text-xs font-semibold text-brand-900">This is your item</p>
                  <p className="mt-1 text-xs text-brand-700">
                    You listed this item. You can edit or remove it from your assets dashboard.
                  </p>
                  <Link
                    to="/my-assets"
                    className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Manage Listing
                  </Link>
                </div>
              ) : !isAuthenticated ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center space-y-3">
                  <p className="text-xs font-medium text-gray-600">
                    Sign in to check availability and submit a borrow request for this item.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/assets/${asset._id}` } }}
                    className="inline-block w-full rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
                  >
                    Log In to Borrow
                  </Link>
                  <p className="text-[11px] text-gray-400">Takes less than 30 seconds</p>
                </div>
              ) : asset.status !== 'available' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Item is {asset.status === 'borrowed' ? 'currently on loan' : 'currently requested'}
                  </p>
                  <p className="text-xs text-amber-700">
                    You can message the owner to inquire when it will be free next.
                  </p>
                  <button
                    onClick={handleMessageOwner}
                    disabled={isStartingChat}
                    className="w-full rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    Message Owner
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitBorrowRequest)} className="space-y-4" noValidate>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="startDate" className="block text-xs font-semibold text-gray-700">
                        Borrow Start Date
                      </label>
                      <div className="relative mt-1">
                        <input
                          id="startDate"
                          type="date"
                          min={todayStr}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          {...register('startDate', { required: 'Start date is required' })}
                        />
                      </div>
                      {errors.startDate && (
                        <p className="mt-1 text-[11px] text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-xs font-semibold text-gray-700">
                        Return End Date
                      </label>
                      <div className="relative mt-1">
                        <input
                          id="endDate"
                          type="date"
                          min={startDateValue || todayStr}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          {...register('endDate', {
                            required: 'End date is required',
                            validate: (value) =>
                              !startDateValue ||
                              value >= startDateValue ||
                              'End date cannot precede start date',
                          })}
                        />
                      </div>
                      {errors.endDate && (
                        <p className="mt-1 text-[11px] text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Real-time Cost Calculator */}
                  {costBreakdown && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>
                          ₹{costBreakdown.rate} × {costBreakdown.days} day
                          {costBreakdown.days > 1 ? 's' : ''}
                        </span>
                        <span className="font-semibold text-gray-900">₹{costBreakdown.subtotal}</span>
                      </div>

                      {costBreakdown.deposit > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span className="flex items-center gap-1">
                            Refundable Deposit
                            <Info className="h-3 w-3 text-gray-400" />
                          </span>
                          <span className="font-semibold text-gray-900">₹{costBreakdown.deposit}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-sm">
                        <span>Estimated Total</span>
                        <span className="text-brand-700">₹{costBreakdown.total}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="w-full rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700 active:scale-98 disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Sending Borrow Request...' : 'Send Borrow Request'}
                  </button>

                  <button
                    type="button"
                    onClick={handleMessageOwner}
                    disabled={isStartingChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4 text-brand-600" />
                    <span>{isStartingChat ? 'Opening chat...' : 'Ask Owner a Question'}</span>
                  </button>
                </form>
              )}

              {/* Trust Badges */}
              <div className="mt-6 border-t border-gray-100 pt-4 space-y-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Deposit returned immediately upon safe return</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  <span>Direct owner handover & in-person inspection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = getCategoryIcon(category);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      <Icon className="h-3.5 w-3.5" />
      {category}
    </span>
  );
}

function ImageGallery({ images, altText }: { images: string[]; altText: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center bg-gray-50 text-gray-300">
        <ImageOff className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
        <img
          src={images[activeIndex]}
          alt={altText}
          className="h-full w-full object-cover transition-all duration-300"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto p-4 border-t border-gray-100 bg-gray-50/50">
          {images.map((url, index) => (
            <button
              key={url}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                index === activeIndex
                  ? 'border-brand-600 ring-2 ring-brand-600/20 shadow-sm'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt={`${altText} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

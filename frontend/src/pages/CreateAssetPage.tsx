import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { CATEGORIES } from '@/constants/categories';
import ImageUploadInput from '@/components/ImageUploadInput';
import { getCurrentPosition, reverseGeocode } from '@/lib/geolocation';
import { MapPin, Loader2, Sparkles, ChevronLeft } from 'lucide-react';
import type { CreateAssetPayload } from '@/types';

const CONDITIONS = [
  { value: 'New', label: 'New (Never used or in original packaging)' },
  { value: 'Like New', label: 'Like New (Pre-owned but shows virtually no wear)' },
  { value: 'Good', label: 'Good (Gently used with minor normal wear, fully functional)' },
  { value: 'Fair', label: 'Fair (Functional with visible signs of wear or cosmetic blemishes)' },
] as const;

export default function CreateAssetPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAssetPayload>();

  const cityValue = watch('city');

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentPosition();
      setLocationCoords({ lat: coords.latitude, lng: coords.longitude });

      const city = await reverseGeocode(coords);
      if (city) {
        setValue('city', city);
      } else {
        toast('Location coordinates captured; you can still refine your city manually.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  const onSubmit = async (data: CreateAssetPayload) => {
    setIsSubmitting(true);
    try {
      const payload: CreateAssetPayload = {
        ...data,
        borrowingCostPerDay: data.borrowingCostPerDay ? Number(data.borrowingCostPerDay) : 0,
        securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : 0,
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
      };

      const { data: createdAsset } = await assetApi.createAsset(payload, images);
      toast.success('Item listed successfully!');
      navigate(`/assets/${createdAsset._id}`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to browsing
      </Link>

      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-10">
        <div className="border-b border-gray-100 pb-5">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Community Lending</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">List an Item to Lend</h1>
          <p className="mt-1 text-xs text-gray-500">
            Help neighbors access what they need and earn or lend freely while building community trust.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8" noValidate>
          {/* ===================== SECTION 1: BASIC DETAILS ===================== */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              1. Basic Information
            </h2>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700">
                Item Name *
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. DeWalt 20V Cordless Drill with 2 Batteries"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('name', {
                  required: 'Item name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                })}
              />
              {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-xs font-semibold text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  {...register('category', {
                    required: 'Please select a category',
                  })}
                >
                  <option value="" disabled>
                    Select a category...
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="brand" className="block text-xs font-semibold text-gray-700">
                  Brand or Manufacturer <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="brand"
                  type="text"
                  placeholder="e.g. Sony, DeWalt, Coleman"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  {...register('brand')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="condition" className="block text-xs font-semibold text-gray-700">
                Item Condition *
              </label>
              <select
                id="condition"
                defaultValue="Good"
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('condition')}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===================== SECTION 2: PRICING & DEPOSIT ===================== */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              2. Borrowing Fees & Protection
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="borrowingCostPerDay" className="block text-xs font-semibold text-gray-700">
                  Daily Rental Rate (₹)
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <span className="text-xs font-bold">₹</span>
                  </div>
                  <input
                    id="borrowingCostPerDay"
                    type="number"
                    min="0"
                    placeholder="0 for free"
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-3 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    {...register('borrowingCostPerDay')}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Enter 0 if this item is free to borrow for neighbors.
                </p>
              </div>

              <div>
                <label htmlFor="securityDeposit" className="block text-xs font-semibold text-gray-700">
                  Security Deposit (₹) <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <span className="text-xs font-bold">₹</span>
                  </div>
                  <input
                    id="securityDeposit"
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-8 pr-3 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    {...register('securityDeposit')}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Held to cover damages, refunded completely upon return.
                </p>
              </div>
            </div>
          </div>

          {/* ===================== SECTION 3: DESCRIPTION & RULES ===================== */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              3. Description & Usage Guidelines
            </h2>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-700">
                Detailed Description *
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe what is included, functionality, specifications, or any tips for using it..."
                className="mt-1 w-full resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' },
                })}
              />
              {errors.description && (
                <p className="mt-1 text-[11px] text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pickupInstructions" className="block text-xs font-semibold text-gray-700">
                Pickup & Handover Instructions <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="pickupInstructions"
                type="text"
                placeholder="e.g. Available weekdays after 6pm, carry ID, near Metro Station"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('pickupInstructions')}
              />
            </div>

            <div>
              <label htmlFor="restrictions" className="block text-xs font-semibold text-gray-700">
                Borrower Restrictions & Guidelines <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="restrictions"
                type="text"
                placeholder="e.g. Return battery fully charged, indoor use only, no wet weather use"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('restrictions')}
              />
            </div>
          </div>

          {/* ===================== SECTION 4: PHOTOS & LOCATION ===================== */}
          <div className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              4. Photos & Location
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700">
                Item Images <span className="font-normal text-gray-400">(high-res photos recommended)</span>
              </label>
              <div className="mt-1.5">
                <ImageUploadInput files={images} onChange={setImages} />
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-semibold text-gray-700">
                City / Neighborhood <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="city"
                  type="text"
                  placeholder="e.g. Mumbai, Bangalore, Delhi"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  {...register('city')}
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60 transition-colors"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-brand-600" />
                  )}
                  <span>Detect Location</span>
                </button>
              </div>
              {locationCoords && cityValue && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                  ✓ Precise coordinates attached for "Near Me" search.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700 active:scale-98 disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

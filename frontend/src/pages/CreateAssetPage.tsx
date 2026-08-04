import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as assetApi from '@/api/assetApi';
import { getErrorMessage } from '@/lib/api';
import { CATEGORIES } from '@/constants/categories';
import ImageUploadInput from '@/components/ImageUploadInput';
import type { CreateAssetPayload } from '@/types';

/**
 * CreateAssetPage.tsx
 * ------------------------------------------------------------------
 * Private route: /assets/new (guarded by ProtectedRoute in App.tsx)
 *
 * Form for listing a new item to lend. On success, redirects the
 * user directly to the newly created asset's detail page — letting
 * them immediately see how their listing appears to others, rather
 * than dumping them back on a generic list.
 */

// A small, fixed set of suggested categories to guide consistent
// tagging across listings (helps the backend's category filter in
// getAssets() actually group things meaningfully). Implemented as a
// <datalist> rather than a rigid <select> so users can still type a
// custom category if none of these fit — the backend has no enum
// constraint on category, so the frontend shouldn't impose one either.


export default function CreateAssetPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAssetPayload>();

  const onSubmit = async (data: CreateAssetPayload) => {
    setIsSubmitting(true);
    try {
      const { data: createdAsset } = await assetApi.createAsset(data, images);
      toast.success('Item listed successfully!');
      navigate(`/assets/${createdAsset._id}`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="mx-auto max-w-lg">
      <Link to="/" className="mb-4 inline-block text-sm font-medium text-brand-600">
        ← Back to browsing
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">List an Item</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share something you own with your community.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          {/* --- Name field --- */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Cordless Drill"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('name', {
                required: 'Item name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
              })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* --- Category field (icon-labeled dropdown) --- */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:border-brand-500"
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
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

{/* --- Description field --- */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Describe the item's condition, any accessories included, and usage notes..."
              className="mt-1 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
                maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' },
              })}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* --- Image upload (optional) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="mt-1">
              <ImageUploadInput files={images} onChange={setImages} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Listing item...' : 'List Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
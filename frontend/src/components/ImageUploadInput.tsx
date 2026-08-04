import { useRef, useState, useCallback, DragEvent } from 'react';
import { X, ImagePlus } from 'lucide-react';

/**
 * ImageUploadInput.tsx
 * ------------------------------------------------------------------
 * Multi-file image picker with drag-and-drop support and thumbnail
 * previews. Purely a controlled input over a File[] array — owns no
 * upload logic itself (the parent form submits the files via
 * assetApi.createAsset's `images` parameter on actual form submit).
 *
 * Client-side validation here (type/size/count) is a UX nicety only —
 * the backend's uploadMiddleware.ts enforces the real limits
 * (5MB/file, 5 files, JPEG/PNG/WebP only) regardless of what this
 * component allows through.
 */

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadInputProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function ImageUploadInput({ files, onChange }: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(newFiles);

      const invalidType = incoming.find((f) => !ALLOWED_TYPES.includes(f.type));
      if (invalidType) {
        setError('Only JPEG, PNG, and WebP images are allowed.');
        return;
      }

      const oversized = incoming.find((f) => f.size > MAX_FILE_SIZE_BYTES);
      if (oversized) {
        setError('Each image must be under 5MB.');
        return;
      }

      const combined = [...files, ...incoming];
      if (combined.length > MAX_FILES) {
        setError(`You can upload up to ${MAX_FILES} images.`);
        return;
      }

      onChange(combined);
    },
    [files, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset the input value so selecting the same file again (after
    // removing it) still fires the change event.
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <ImagePlus className="h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400">JPEG, PNG, or WebP — up to 5MB each, max 5 images</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {files.map((file, index) => (
            <ImagePreview key={`${file.name}-${index}`} file={file} onRemove={() => removeFile(index)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ImagePreview
 * ------------------------------------------------------------------
 * Renders a local object-URL preview of a selected (not-yet-uploaded)
 * File, with a remove button. Revokes the object URL on unmount to
 * avoid leaking memory — object URLs stay alive until explicitly
 * revoked, even after the component using them is gone.
 */
function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-gray-200">
      <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Remove image"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
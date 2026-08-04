import multer from 'multer';

/**
 * uploadMiddleware.ts
 * ------------------------------------------------------------------
 * Configures Multer to handle incoming image file uploads for asset
 * listings. Uses memory storage (files held as an in-memory Buffer,
 * never written to local disk) since we immediately stream each file
 * up to Cloudinary and never need to persist it locally — this also
 * makes the app stateless-deployment-friendly (no local disk
 * dependency, which matters on platforms like Render where the
 * filesystem is ephemeral between deploys/restarts).
 *
 * Validation enforced here:
 *   - Only image MIME types accepted (image/jpeg, image/png, image/webp)
 *   - Max file size: 5MB per file
 *   - Max 5 files per upload request
 */

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES,
  },
});

/**
 * uploadAssetImages
 * ------------------------------------------------------------------
 * Middleware for handling multiple image uploads under the form
 * field name 'images'. Attaches parsed files to `req.files` as an
 * array (even for a single file), which the controller reads and
 * streams to Cloudinary.
 */
export const uploadAssetImages = upload.array('images', MAX_FILES);
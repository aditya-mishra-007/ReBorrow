interface ReBorrowLogoProps {
  className?: string;
  size?: number;
}

/**
 * ReBorrow Custom Logo
 * Represents the circular economy: two synchronized cycle arrows
 * forming a continuous borrowing & returning loop around a shared asset cube.
 */
export default function ReBorrowLogo({ className = 'h-8 w-8', size = 32 }: ReBorrowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="reborrow-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="reborrow-arrow" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>

      {/* Background Rounded Shield / Tile */}
      <rect width="48" height="48" rx="14" fill="url(#reborrow-grad)" />

      {/* Top Lending / Sharing Flow Arrow (Counter-clockwise upper loop) */}
      <path
        d="M13 22C13 16.4772 17.4772 12 23 12H34"
        stroke="url(#reborrow-arrow)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M31 8L36 12L31 16"
        stroke="url(#reborrow-arrow)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Returning Flow Arrow (Counter-clockwise lower loop) */}
      <path
        d="M35 26C35 31.5228 30.5228 36 25 36H14"
        stroke="url(#reborrow-arrow)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M17 40L12 36L17 32"
        stroke="url(#reborrow-arrow)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Shared Asset Box (The item being borrowed and returned) */}
      <rect
        x="19"
        y="19"
        width="10"
        height="10"
        rx="2.5"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
      <circle cx="24" cy="24" r="1.75" fill="#4F46E5" />
    </svg>
  );
}

export function ReBorrowBrand({
  logoClassName = 'h-9 w-9',
  textClassName = 'text-xl',
}: {
  logoClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <ReBorrowLogo className={logoClassName} />
      <span
        className={`bg-gradient-to-r from-gray-950 via-brand-950 to-brand-700 bg-clip-text text-transparent font-extrabold tracking-tight ${textClassName}`}
      >
        ReBorrow
      </span>
    </div>
  );
}
